import webPush from 'npm:web-push@3'
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type Subscription = { endpoint: string; p256dh: string; auth: string; user_id: string }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const payload = await req.json()
    const record = payload.record
    if (!record) return new Response('ok', { headers: corsHeaders })

    const { community_id, user_id: senderId, content } = record

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const [communityRes, senderRes, membersRes] = await Promise.all([
      supabase.from('communities').select('name').eq('id', community_id).single(),
      supabase.from('profiles').select('display_name').eq('id', senderId).single(),
      supabase
        .from('community_members')
        .select('user_id')
        .eq('community_id', community_id)
        .neq('user_id', senderId),
    ])

    const communityName = communityRes.data?.name ?? 'Comunidad'
    const senderName = senderRes.data?.display_name ?? 'Alguien'
    const memberIds = (membersRes.data ?? []).map((m: { user_id: string }) => m.user_id)

    if (!memberIds.length) return new Response('ok', { headers: corsHeaders })

    const [recipientsRes, senderSubsRes] = await Promise.all([
      supabase
        .from('push_subscriptions')
        .select('endpoint, p256dh, auth, user_id')
        .in('user_id', memberIds),
      supabase.from('push_subscriptions').select('endpoint').eq('user_id', senderId),
    ])

    const senderEndpoints = new Set(
      (senderSubsRes.data ?? []).map((s: { endpoint: string }) => s.endpoint)
    )

    const byEndpoint = new Map<string, Subscription>()
    for (const sub of (recipientsRes.data ?? []) as Subscription[]) {
      if (senderEndpoints.has(sub.endpoint)) continue
      if (!byEndpoint.has(sub.endpoint)) byEndpoint.set(sub.endpoint, sub)
    }

    const subscriptions = [...byEndpoint.values()]
    if (!subscriptions.length) return new Response('ok', { headers: corsHeaders })

    webPush.setVapidDetails(
      Deno.env.get('VAPID_SUBJECT')!,
      Deno.env.get('VAPID_PUBLIC_KEY')!,
      Deno.env.get('VAPID_PRIVATE_KEY')!
    )

    const notificationPayload = JSON.stringify({
      title: communityName,
      body: `${senderName}: ${content.slice(0, 80)}`,
      url: `/comunidades/${community_id}`,
      tag: `community-${community_id}`,
    })

    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        webPush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          notificationPayload
        )
      )
    )

    const goneEndpoints = results
      .map((result, i) =>
        result.status === 'rejected' && [404, 410].includes(result.reason?.statusCode)
          ? subscriptions[i].endpoint
          : null
      )
      .filter((endpoint): endpoint is string => endpoint !== null)

    if (goneEndpoints.length) {
      await supabase.from('push_subscriptions').delete().in('endpoint', goneEndpoints)
    }

    return new Response(
      JSON.stringify({ sent: subscriptions.length - goneEndpoints.length, pruned: goneEndpoints.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
