export const videoCategories = [
  { id: 'technique', label: '脱口秀技巧' },
  { id: 'special', label: '脱口秀专场' },
  { id: 'interview', label: '脱口秀采访' },
  { id: 'open-mic', label: '开放麦 / 拼盘演出' },
]

export function videoCategory(id: string) {
  return videoCategories.find(category => category.id === id)?.label ?? '视频'
}

export function videoDuration(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}
