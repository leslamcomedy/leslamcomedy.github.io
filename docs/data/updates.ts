import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { basename, join } from 'node:path'

interface PageChange {
  action: '新增' | '更新' | '移除'
  title: string
  href?: string
}

export interface SiteUpdate {
  id: string
  date: string
  berlinTime: string
  changes: PageChange[]
}

const berlinTime = new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Europe/Berlin', dateStyle: 'medium', timeStyle: 'short',
})

// These sources publish changes to a page without editing its Markdown.
const pageSources: Record<string, string> = {
  'data/videos.json': 'videos.md',
  '.vitepress/theme/components/VideoLibrary.vue': 'videos.md',
  'components/TranscriptPlayer.vue': 'transcripts/index.md',
  'components/ResourceDirectory.vue': 'index.md',
}
const actions: Record<string, PageChange['action']> = { A: '新增', D: '移除' }

export function readUpdates(docsDir: string): SiteUpdate[] {
  if (!existsSync(join(docsDir, '..', '.git'))) return []
  const git = (...args: string[]) => execFileSync('git', args, { cwd: docsDir, encoding: 'utf8' })
  const log = git('log', '-8', '--first-parent', '--relative', '--no-renames', '--name-status',
    '-z', '--format=%x1e%H%x09%cI', '--', '*.md', ...Object.keys(pageSources))
  const titles = new Map<string, string>()

  return log.split('\x1e').filter(Boolean).map(record => {
    const [header, ...files] = record.split('\0')
    const [id, date] = header.split('\t')
    const changes = new Map<string, PageChange>()
    for (let i = 0; i + 1 < files.length; i += 2) {
      const status = files[i].trim()
      const file = files[i + 1]
      const page = pageSources[file] ?? file
      if (file !== page && changes.has(page)) continue
      const path = join(docsDir, page)
      const exists = existsSync(path)
      let title = titles.get(page)
      if (!title) {
        const revision = status === 'D' ? id + '^' : id
        const source = exists ? readFileSync(path, 'utf8') : git('show', `${revision}:./${file}`)
        title = page === 'index.md' ? '首页推荐' : source.match(/^# (.+)$/m)?.[1] ?? basename(page, '.md')
        if (exists) titles.set(page, title)
      }
      const action = actions[file === page ? status : 'M'] ?? '更新'
      const href = '/' + page.replace(/(^|\/)index\.md$/, '$1').replace(/\.md$/, '.html')
      changes.set(page, { action, title, href: exists && action !== '移除' ? href : undefined })
    }
    return { id, date, berlinTime: berlinTime.format(new Date(date)), changes: [...changes.values()] }
  })
}
