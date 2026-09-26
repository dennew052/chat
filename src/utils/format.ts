/**
 * Format timestamp into conversational time or date
 */
export function formatMessageTime(timestamp: number): string {
  if (!timestamp) return ''
  // If timestamp is in seconds (unix epoch from Green-API), convert to ms
  const ms = timestamp < 1e11 ? timestamp * 1000 : timestamp
  const date = new Date(ms)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function formatChatTimestamp(timestamp: number): string {
  if (!timestamp) return ''
  const ms = timestamp < 1e11 ? timestamp * 1000 : timestamp
  const date = new Date(ms)
  const now = new Date()

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()

  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()

  if (isYesterday) {
    return 'Вчера'
  }

  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

/**
 * Format date divider in chat
 */
export function formatDateDivider(timestamp: number): string {
  if (!timestamp) return ''
  const ms = timestamp < 1e11 ? timestamp * 1000 : timestamp
  const date = new Date(ms)
  const now = new Date()

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()

  if (isToday) return 'Сегодня'

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()

  if (isYesterday) return 'Вчера'

  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

/**
 * Format phone number nicely: +7 (999) 123-45-67
 */
export function formatPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'))) {
    return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`
  }
  if (digits.length >= 10) {
    return `+${digits}`
  }
  return phone
}

/**
 * Get pleasant avatar color and initials
 */
const AVATAR_COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-purple-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-indigo-500',
  'bg-cyan-500',
  'bg-violet-500',
  'bg-teal-500'
]

export function getAvatarDetails(nameOrId: string): { initials: string; bgColor: string } {
  let initials = '?'
  const clean = nameOrId.trim()
  if (clean) {
    const parts = clean.split(/[\s_-]+/)
    if (parts.length >= 2) {
      initials = (parts[0][0] + parts[1][0]).toUpperCase()
    } else if (clean.length >= 2) {
      initials = clean.slice(0, 2).toUpperCase()
    } else {
      initials = clean[0].toUpperCase()
    }
  }

  let hash = 0
  for (let i = 0; i < clean.length; i++) {
    hash = (hash << 5) - hash + clean.charCodeAt(i)
    hash |= 0
  }
  const colorIndex = Math.abs(hash) % AVATAR_COLORS.length
  return { initials, bgColor: AVATAR_COLORS[colorIndex] }
}
