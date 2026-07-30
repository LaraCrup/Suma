export const getDateString = (date) => {
    if (!date) return getArgentineDate()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

export const argentineTodayAsDate = () => {
    const [year, month, day] = getArgentineDate().split('-').map(Number)
    return new Date(year, month - 1, day)
}

export const dateStrToDate = (dateStr) => {
    const [year, month, day] = dateStr.split('-').map(Number)
    return new Date(year, month - 1, day)
}

export const timestampToArgentineDateStr = (timestamp) =>
    new Date(new Date(timestamp).getTime() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10)

export const addDaysToDateStr = (dateStr, n) => {
    const [y, m, d] = dateStr.split('-').map(Number)
    return getDateString(new Date(y, m - 1, d + n))
}

export const getWeekStart = (date = argentineTodayAsDate()) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    const result = new Date(d.setDate(diff))
    return getDateString(result)
}

export const getWeekEnd = (date = argentineTodayAsDate()) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? 0 : 7)
    const result = new Date(d.setDate(diff))
    return getDateString(result)
}

export const letterDayToNumber = (letterDay) => {
    const dayMap = {
        'D': 0,
        'L': 1,
        'M': 2,
        'X': 3,
        'J': 4,
        'V': 5,
        'S': 6
    }
    return dayMap[letterDay] !== undefined ? dayMap[letterDay] : -1
}

export const letterDaysToNumbers = (letterDays) => {
    if (!Array.isArray(letterDays)) {
        return []
    }
    return letterDays.map(letterDayToNumber).filter(day => day !== -1)
}

export const habitStartDate = (habit) => {
    const starts = [habit?.created_at, habit?.member_since]
        .filter(Boolean)
        .map(timestampToArgentineDateStr)

    return starts.length ? starts.reduce((a, b) => (a > b ? a : b)) : null
}

export const habitExistsOn = (habit, dateStr) => {
    const start = habitStartDate(habit)
    return !start || dateStr >= start
}

export const isHabitScheduledOn = (habit, dateStr) => {
    const [y, m, d] = dateStr.split('-').map(Number)
    const dow = new Date(y, m - 1, d).getDay()
    switch (habit.frequency_option) {
        case 'dias_especificos_semana':
            return letterDaysToNumbers(habit.frequency_detail?.weekDays || []).includes(dow)
        case 'dias_especificos_mes':
            return (habit.frequency_detail?.monthDays || []).includes(d)
        default:
            return true
    }
}

export const getStreakCadence = (habit) => {
    if (habit.frequency_type === 'semanal') return 'weekly'
    if (habit.frequency_type === 'mensual') return 'monthly'
    return 'daily'
}

export const getHabitPeriodGranularity = (habit) => {
    const o = habit.frequency_option
    if (habit.frequency_type === 'semanal' || o === 'cantidad_dias_semana' || o === 'dias_especificos_semana') return 'week'
    if (habit.frequency_type === 'mensual' || o === 'cantidad_dias_mes' || o === 'dias_especificos_mes') return 'month'
    return 'day'
}

export const getGraceBreakMode = (habit) => {
    const cadence = getStreakCadence(habit)
    if (cadence === 'weekly') return 'week'
    if (cadence === 'monthly') return 'month'
    const o = habit.frequency_option
    if (o === 'cantidad_dias_semana') return 'week'
    if (o === 'cantidad_dias_mes') return 'month'
    return 'scheduled'
}

export const getPeriodBounds = (habit, dateStr) => {
    const gran = getHabitPeriodGranularity(habit)
    const [y, m, d] = dateStr.split('-').map(Number)
    if (gran === 'week') {
        const dObj = new Date(y, m - 1, d)
        return { start: getWeekStart(dObj), end: getWeekEnd(dObj) }
    }
    if (gran === 'month') {
        const lastDay = new Date(y, m, 0).getDate()
        return {
            start: `${y}-${String(m).padStart(2, '0')}-01`,
            end: `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
        }
    }
    return { start: dateStr, end: dateStr }
}

export const getPeriodQuota = (habit, startDate) => {
    switch (habit.frequency_option) {
        case 'dias_especificos_semana':
            return habit.frequency_detail?.weekDays?.length || 0
        case 'dias_especificos_mes':
            return habit.frequency_detail?.monthDays?.length || 0
        case 'cantidad_dias_semana':
        case 'cantidad_dias_mes':
            return habit.frequency_detail?.counter || 0
        case 'todos':
        default:
            if (habit.frequency_type === 'semanal') return 7
            if (habit.frequency_type === 'mensual') {
                const [y, m] = startDate.split('-').map(Number)
                return new Date(y, m, 0).getDate()
            }
            return 1
    }
}

export const getPrevPeriodEndDate = (habit, dateStr) => {
    const { start } = getPeriodBounds(habit, dateStr)
    return addDaysToDateStr(start, -1)
}

export const findScheduledOnOrBefore = (habit, dateStr) => {
    let cur = dateStr
    for (let i = 0; i < 400; i++) {
        if (isHabitScheduledOn(habit, cur)) return cur
        cur = addDaysToDateStr(cur, -1)
    }
    return null
}

export const findScheduledBefore = (habit, dateStr) => {
    return findScheduledOnOrBefore(habit, addDaysToDateStr(dateStr, -1))
}

export const shouldShowHabitForDateWith = async (habit, dateStr, countCompletedInPeriod) => {
    if (!habitExistsOn(habit, dateStr)) {
        return false
    }

    const [year, month, day] = dateStr.split('-').map(Number)
    const dateObj = new Date(year, month - 1, day)
    const dayOfWeek = dateObj.getDay()
    const dayOfMonth = dateObj.getDate()

    if (!habit.frequency_type) {
        return true
    }

    switch (habit.frequency_type) {
        case 'diario': {
            const option = habit.frequency_option || 'todos'
            if (option === 'dias_especificos_semana' || option === 'dias_especificos_mes') {
                return isHabitScheduledOn(habit, dateStr)
            }
            if (option === 'cantidad_dias_semana' || option === 'cantidad_dias_mes') {
                const { start, end } = getPeriodBounds(habit, dateStr)
                const completedCount = await countCompletedInPeriod(start, end)
                return completedCount < getPeriodQuota(habit, start)
            }
            return true
        }

        case 'semanal': {
            const weeklyOption = habit.frequency_option || 'todos'

            if (weeklyOption === 'todos') {
                return true
            }

            if (weeklyOption === 'dias_especificos_semana') {
                const selectedDays = habit.frequency_detail?.weekDays || []
                return letterDaysToNumbers(selectedDays).includes(dayOfWeek)
            }

            if (weeklyOption === 'cantidad_dias_semana') {
                const weekStart = getWeekStart(dateObj)
                const weekEnd = getWeekEnd(dateObj)
                const completedCount = await countCompletedInPeriod(weekStart, weekEnd)
                const requiredCount = habit.frequency_detail?.counter || 0

                return completedCount < requiredCount
            }

            return false
        }

        case 'mensual': {
            const monthlyOption = habit.frequency_option || 'todos'

            if (monthlyOption === 'todos') {
                return true
            }

            if (monthlyOption === 'dias_especificos_mes') {
                const selectedDays = habit.frequency_detail?.monthDays || []
                return selectedDays.includes(dayOfMonth)
            }

            if (monthlyOption === 'cantidad_dias_mes') {
                const monthStart = `${year}-${String(month).padStart(2, '0')}-01`
                const lastDay = new Date(year, month, 0).getDate()
                const monthEnd = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
                const completedCount = await countCompletedInPeriod(monthStart, monthEnd)
                const requiredCount = habit.frequency_detail?.counter || 0

                return completedCount < requiredCount
            }

            return false
        }

        default:
            return true
    }
}
