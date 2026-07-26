import webPush from 'npm:web-push@3'
import { createClient } from 'npm:@supabase/supabase-js@2'

type CommunityHabit = {
  id: string
  community_id: string
  name: string
  frequency_type: string
  frequency_option: string | null
  frequency_detail: { weekDays?: string[]; monthDays?: number[]; counter?: number } | null
  communities: { name: string } | null
}

type Subscription = { endpoint: string; p256dh: string; auth: string; user_id: string }

const LETTER_TO_DOW: Record<string, number> = { D: 0, L: 1, M: 2, X: 3, J: 4, V: 5, S: 6 }

const argentineDateStr = (instant = Date.now()) =>
  new Date(instant - 3 * 60 * 60 * 1000).toISOString().slice(0, 10)

const addDays = (dateStr: string, n: number) => {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d + n))
  return date.toISOString().slice(0, 10)
}

const dayOfWeek = (dateStr: string) => {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay()
}

const weekBounds = (dateStr: string) => {
  const dow = dayOfWeek(dateStr)
  const offsetToMonday = dow === 0 ? -6 : 1 - dow
  const start = addDays(dateStr, offsetToMonday)
  return { start, end: addDays(start, 6) }
}

const monthBounds = (dateStr: string) => {
  const [y, m] = dateStr.split('-').map(Number)
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const mm = String(m).padStart(2, '0')
  return { start: `${y}-${mm}-01`, end: `${y}-${mm}-${String(lastDay).padStart(2, '0')}` }
}

const periodBounds = (habit: CommunityHabit, dateStr: string) => {
  const option = habit.frequency_option
  if (habit.frequency_type === 'semanal' || option === 'cantidad_dias_semana' || option === 'dias_especificos_semana') {
    return weekBounds(dateStr)
  }
  if (habit.frequency_type === 'mensual' || option === 'cantidad_dias_mes' || option === 'dias_especificos_mes') {
    return monthBounds(dateStr)
  }
  return { start: dateStr, end: dateStr }
}

const isScheduledOn = (habit: CommunityHabit, dateStr: string) => {
  const [, , day] = dateStr.split('-').map(Number)
  if (habit.frequency_option === 'dias_especificos_semana') {
    const selected = (habit.frequency_detail?.weekDays ?? []).map((l) => LETTER_TO_DOW[l])
    return selected.includes(dayOfWeek(dateStr))
  }
  if (habit.frequency_option === 'dias_especificos_mes') {
    return (habit.frequency_detail?.monthDays ?? []).includes(day)
  }
  return true
}

const quotaFor = (habit: CommunityHabit) => habit.frequency_detail?.counter ?? 0

Deno.serve(async () => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const today = argentineDateStr()

    const { data: habits, error: habitsError } = await supabase
      .from('community_habits')
      .select('id, community_id, name, frequency_type, frequency_option, frequency_detail, communities(name)')

    if (habitsError) throw habitsError
    if (!habits?.length) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const pendingByUser = new Map<string, { communityName: string; habitName: string; communityId: string; habitId: string }>()

    for (const habit of habits as CommunityHabit[]) {
      if (!isScheduledOn(habit, today)) continue

      const { data: members } = await supabase
        .from('community_members')
        .select('user_id')
        .eq('community_id', habit.community_id)

      if (!members?.length) continue

      const option = habit.frequency_option
      const isCounterBased = option === 'cantidad_dias_semana' || option === 'cantidad_dias_mes'
      const { start, end } = periodBounds(habit, today)

      const { data: logs } = await supabase
        .from('community_habit_logs')
        .select('user_id, date')
        .eq('community_habit_id', habit.id)
        .eq('completed', true)
        .gte('date', isCounterBased ? start : today)
        .lte('date', isCounterBased ? end : today)

      const completionsByUser = new Map<string, number>()
      for (const log of logs ?? []) {
        completionsByUser.set(log.user_id, (completionsByUser.get(log.user_id) ?? 0) + 1)
      }

      const required = isCounterBased ? Math.max(1, quotaFor(habit)) : 1

      for (const member of members) {
        if ((completionsByUser.get(member.user_id) ?? 0) >= required) continue
        if (pendingByUser.has(member.user_id)) continue
        pendingByUser.set(member.user_id, {
          communityName: habit.communities?.name ?? 'Tu comunidad',
          habitName: habit.name,
          communityId: habit.community_id,
          habitId: habit.id,
        })
      }
    }

    if (pendingByUser.size === 0) {
      return new Response(JSON.stringify({ sent: 0, reminded: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth, user_id')
      .in('user_id', [...pendingByUser.keys()])

    if (!subscriptions?.length) {
      return new Response(JSON.stringify({ sent: 0, reminded: pendingByUser.size }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    webPush.setVapidDetails(
      Deno.env.get('VAPID_SUBJECT')!,
      Deno.env.get('VAPID_PUBLIC_KEY')!,
      Deno.env.get('VAPID_PRIVATE_KEY')!
    )

    const byEndpoint = new Map<string, Subscription>()
    for (const sub of subscriptions as Subscription[]) {
      if (!byEndpoint.has(sub.endpoint)) byEndpoint.set(sub.endpoint, sub)
    }
    const targets = [...byEndpoint.values()]

    const results = await Promise.allSettled(
      targets.map((sub) => {
        const pending = pendingByUser.get(sub.user_id)!
        return webPush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({
            title: pending.communityName,
            body: `Todavía no marcaste «${pending.habitName}». ¡Tu comunidad te espera!`,
            url: `/comunidades/${pending.communityId}/habito`,
            tag: `reminder-${pending.habitId}`,
          })
        )
      })
    )

    const goneEndpoints = results
      .map((result, i) =>
        result.status === 'rejected' && [404, 410].includes(result.reason?.statusCode)
          ? targets[i].endpoint
          : null
      )
      .filter((endpoint): endpoint is string => endpoint !== null)

    if (goneEndpoints.length) {
      await supabase.from('push_subscriptions').delete().in('endpoint', goneEndpoints)
    }

    return new Response(
      JSON.stringify({
        date: today,
        reminded: pendingByUser.size,
        sent: targets.length - goneEndpoints.length,
        pruned: goneEndpoints.length,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
