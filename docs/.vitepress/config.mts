import { defineConfig } from 'vitepress'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const docsDir = path.dirname(fileURLToPath(import.meta.url)) + '/..'

// 「好的段子」文稿由 GitHub Actions 自动同步到 docs/duanzi/，
// 这里在构建时扫描目录（含子目录）生成侧边栏
function scanDir(dir, urlBase) {
  if (!fs.existsSync(dir)) return []
  const items = []
  const entries = fs
    .readdirSync(dir, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name, 'zh'))
  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'images') continue
    if (entry.isDirectory()) {
      const children = scanDir(path.join(dir, entry.name), `${urlBase}${entry.name}/`)
      if (children.length > 0) {
        items.push({ text: entry.name, collapsed: false, items: children })
      }
    } else if (entry.name.endsWith('.md') && entry.name !== 'index.md') {
      const name = entry.name.replace(/\.md$/, '')
      items.push({ text: name, link: `${urlBase}${encodeURI(name)}` })
    }
  }
  return items
}

function duanziSidebarItems() {
  return scanDir(path.join(docsDir, 'duanzi'), '/duanzi/')
}

export default defineConfig({
  lang: 'zh-CN',
  title: '乐咔喜剧知识库',
  description: 'LeSlam Comedy 俱乐部内部学习资料：脱口秀技巧、专场、播客、书单、段子文稿',
  base: '/leSlamComedy_KnowledgeBase/',
  // 段子文稿是外部同步的，里面可能有 Obsidian 风格的链接，不让死链接卡住构建
  ignoreDeadLinks: true,
  head: [['link', { rel: 'icon', type: 'image/png', href: '/leSlamComedy_KnowledgeBase/logo.png' }]],
  themeConfig: {
    logo: '/logo.png',
    nav: [
      { text: '首页', link: '/' },
      { text: '学习资料', link: '/videos' },
      { text: '好的段子', link: '/duanzi/' },
      { text: '如何贡献', link: '/contribute' },
    ],
    sidebar: [
      {
        text: '学习资料',
        items: [
          { text: 'B站视频合集', link: '/videos' },
          { text: '播客', link: '/podcasts' },
          { text: '综艺与表演', link: '/shows' },
          { text: '书单', link: '/books' },
          { text: '演出资讯', link: '/info' },
        ],
      },
      {
        text: '好的段子',
        items: [{ text: '关于这个栏目', link: '/duanzi/' }, ...duanziSidebarItems()],
      },
      {
        text: '参与',
        items: [{ text: '如何贡献', link: '/contribute' }],
      },
    ],
    socialLinks: [
      { icon: 'instagram', link: 'https://www.instagram.com/leslamcomedy/' },
      {
        // 小红书没有内置图标，用自定义 SVG（书本造型 + RED 文字风格简化）
        icon: {
          svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M3 5.5C3 4.12 4.12 3 5.5 3h13C19.88 3 21 4.12 21 5.5v13c0 1.38-1.12 2.5-2.5 2.5h-13C4.12 21 3 19.88 3 18.5v-13zM7.2 9.6l-1.6 4.8h1.5l.3-1h1.6l.3 1h1.5L9.2 9.6H7.2zm.9 1.5l.5 1.5h-1l.5-1.5zm4.1-1.5v4.8h1.4v-1.7h.9c1 0 1.7-.7 1.7-1.6s-.7-1.5-1.7-1.5h-2.3zm1.4 1.2h.8c.3 0 .5.2.5.4s-.2.4-.5.4h-.8v-.8zm4 -1.2v4.8h1.4V9.6h-1.4z"/></svg>',
        },
        link: 'https://www.xiaohongshu.com/search_result?keyword=%E6%85%95%E5%B0%BC%E9%BB%91%E4%B9%90%E5%92%94%E5%96%9C%E5%89%A7',
        ariaLabel: '小红书：慕尼黑乐咔喜剧',
      },
      { icon: 'github', link: 'https://github.com/fanyu-meng/leSlamComedy_KnowledgeBase' },
    ],
    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '搜索', buttonAriaLabel: '搜索' },
          modal: {
            noResultsText: '没有找到相关内容',
            resetButtonTitle: '清除搜索',
            footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' },
          },
        },
      },
    },
    editLink: {
      pattern: 'https://github.com/fanyu-meng/leSlamComedy_KnowledgeBase/edit/main/docs/:path',
      text: '在 GitHub 上编辑此页',
    },
    outline: { label: '本页目录' },
    docFooter: { prev: '上一页', next: '下一页' },
    lastUpdated: { text: '最后更新' },
    darkModeSwitchLabel: '深色模式',
    sidebarMenuLabel: '目录',
    returnToTopLabel: '回到顶部',
    footer: {
      message: 'LeSlam Comedy 乐咔喜剧俱乐部 · Instagram: leslamcomedy · 小红书: 慕尼黑乐咔喜剧（小红书号 6381249812）',
      copyright: '内部学习资料，欢迎大家一起补充',
    },
  },
})
