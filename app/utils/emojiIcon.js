const EMOJI_CLUSTER = /(?:\p{Extended_Pictographic}|\p{Regional_Indicator}|[0-9#*])(?:\p{Emoji_Modifier}|️|⃣|\p{Regional_Indicator})*(?:‍(?:\p{Extended_Pictographic}|\p{Regional_Indicator})(?:\p{Emoji_Modifier}|️|⃣)*)*/gu

export function splitGraphemes(value) {
    const text = String(value ?? '')
    if (!text) return []
    if (typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function') {
        return Array.from(new Intl.Segmenter('es', { granularity: 'grapheme' }).segment(text), s => s.segment)
    }
    const clusters = []
    let cursor = 0
    EMOJI_CLUSTER.lastIndex = 0
    let match
    while ((match = EMOJI_CLUSTER.exec(text)) !== null) {
        if (match.index > cursor) clusters.push(...Array.from(text.slice(cursor, match.index)))
        clusters.push(match[0])
        cursor = match.index + match[0].length
    }
    if (cursor < text.length) clusters.push(...Array.from(text.slice(cursor)))
    return clusters
}

export function graphemeLength(value) {
    return splitGraphemes(value).length
}

export function keepLastEmojiGrapheme(value) {
    const emojis = splitGraphemes(value)
        .filter(cluster => /\p{Extended_Pictographic}|\p{Regional_Indicator}/u.test(cluster))
    return emojis.length ? emojis[emojis.length - 1] : ''
}
