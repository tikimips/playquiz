export function generatePin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export const AVATAR_COLORS = [
  '#6366f1','#8b5cf6','#ec4899','#ef4444',
  '#f97316','#eab308','#22c55e','#06b6d4',
]

export function randomAvatarColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]
}

export function calcPoints(timeLimit: number, responseTimeMs: number, basePoints: number): number {
  const fraction = Math.max(0, 1 - responseTimeMs / (timeLimit * 1000))
  return Math.round(basePoints * (0.5 + 0.5 * fraction))
}

export const OPTION_COLORS = ['#ef4444','#3b82f6','#eab308','#22c55e']
export const OPTION_SHAPES = ['▲','◆','●','■']
