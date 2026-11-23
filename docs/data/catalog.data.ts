import { createContentLoader, type ContentData } from 'vitepress'
import videos from './videos.json'
import { videoCategory, videoDuration } from './videoMeta'
import type { Kind } from './catalogGroups'

export interface Resource {
  title: string
  href: string
  kind: Kind
  group?: string
  platform: string
  detail: string
  keywords: string
  podcastLabel?: string
  cover?: string
  source?: { label: string; href: string }
}

declare const data: Resource[]
export { data }

const sections: Record<string, { level: number; kind: Kind; group?: string }> = {
  podcasts: { level: 3, kind: '播客' },
  books: { level: 3, kind: '书籍与手册' },
  'comedy-resources': { level: 3, kind: '书籍与手册' },
  'comedy-channels': { level: 2, kind: '喜剧点评与创作解析' },
  shows: { level: 2, kind: '视频', group: '综艺推荐' },
  danliren: { level: 1, kind: '视频', group: '演出合集' },
}

function platform(href: string) {
  const host = new URL(href).hostname
  if (host.endsWith('bilibili.com')) return 'B 站'
  if (host === 'youtu.be' || host.endsWith('youtube.com')) return 'YouTube'
  if (host.endsWith('xiaoyuzhoufm.com')) return '小宇宙'
  if (host === 'weread.qq.com') return '微信读书'
  if (host === 'drive.google.com') return 'PDF · Google Drive'
  if (host.endsWith('github.io')) return '网页手册'
  return host
}

function transcript(page: ContentData): Resource[] {
  const src = page.src ?? ''
  const title = src.match(/^# (.+)$/m)?.[1]
  if (!title || page.url.endsWith('/')) return []
  const intro = page.frontmatter.description ?? ''
  const original = src.match(/^> 来源[^\n]*?\]\((https?:\/\/[^)]+)\)/m)?.[1]
  const headings = [...src.matchAll(/^## (.+)$/gm)].map(match => match[1])
  return [{
    title, href: page.url, kind: '文字稿', platform: '站内阅读',
    detail: page.frontmatter.format ?? '', keywords: [intro, ...headings, page.frontmatter.format ?? '逐字稿'].join(' '),
    source: original ? { label: `${platform(original)} 原片`, href: original } : undefined,
  }]
}

function resourcesOnPage(page: ContentData): Resource[] {
  if (page.url.startsWith('/transcripts/')) return transcript(page)
  const section = sections[page.url.slice(1).replace(/\.html$/, '')]
  const src = page.src ?? ''
  const headings = [...src.matchAll(/^(#{1,3}) (.+)$/gm)]
  let parent = ''
  return headings.flatMap(([heading, depth, headingText], index) => {
    if (depth.length === 2) parent = headingText
    if (depth.length !== section.level) return []
    const start = headings[index].index! + heading.length
    const body = src.slice(start, headings[index + 1]?.index ?? src.length)
    const titleLink = headingText.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/)
    const title = titleLink?.[1] ?? headingText
    const href = titleLink?.[2] ?? body.match(/\]\((https?:\/\/[^\s)]+)\)/)?.[1]
    if (!href) return []
    const destination = platform(href)
    const paragraphs = body.split('\n').filter(line => /^[\p{L}《「]/u.test(line))
    const isVideoLesson = parent === '公开视频课与讲解'
    const kind = isVideoLesson ? '视频' : section.kind
    const group = isVideoLesson ? videoCategory('technique') : section.group ?? (section.level === 3 ? parent : undefined)
    const podcastLabel = kind === '播客' && group === '单集推荐'
      ? body.match(/^\*\*(.+?)\*\*$/m)?.[1] : undefined
    const extra = body.match(/\[(查看资料来源|查看网页版说明)\]\((https?:\/\/[^)]+)\)/)
    return [{
      title, href, kind, group, platform: destination, podcastLabel, detail: paragraphs[0] ?? '', keywords: paragraphs.join(' '),
      cover: body.match(/!\[[^\]]*\]\((\/book-covers\/[^)]+)\)/)?.[1],
      source: extra ? { label: extra[1], href: extra[2] } : undefined,
    }]
  })
}

export default createContentLoader(
  ['transcripts/*.md', ...Object.keys(sections).map(name => `${name}.md`)],
  {
    includeSrc: true,
    transform(pages) {
      const catalog = new Map(pages.flatMap(resourcesOnPage).map(item => [item.href, item]))
      for (const video of videos) {
        const href = `https://www.bilibili.com/video/${video.id}/`
        const topic = videoCategory(video.category)
        const existing = catalog.get(href)
        catalog.set(href, {
          title: existing?.title ?? video.title,
          href, kind: '视频', group: topic, platform: 'B 站', detail: `${videoDuration(video.duration)} · ${video.author}`,
          keywords: [video.title, video.author, topic, existing?.keywords].join(' '),
        })
      }
      return [...catalog.values()]
    },
  },
)
