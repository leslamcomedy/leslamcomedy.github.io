import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitepress'
import { readUpdates } from '../data/updates'

const updates = readUpdates(fileURLToPath(new URL('..', import.meta.url)))

export default defineConfig({
  lang: 'zh-CN',
  title: '乐咔喜剧精选',
  description: '慕尼黑乐咔喜剧筛选推荐的演出文字稿、视频、播客、书籍和创作手册。',
  base: '/',
  ignoreDeadLinks: true,
  transformPageData(page) {
    if (page.relativePath === 'index.md') page.frontmatter.updates = updates
  },
  async buildEnd({ outDir }) {
    await writeFile(join(outDir, 'updates.json'), JSON.stringify(updates))
  },
  // 保留「一句一行」的原文排版（锐锐、高寒等字幕稿是单换行，不加这个会合并成一段）
  markdown: {
    breaks: true,
  },
  head: [
    ['link', { rel: 'icon', type: 'image/png', href: '/logo.png' }],
    ['script', { defer: '', src: '/site-visits.js' }],
  ],
  themeConfig: {
    logo: '/logo.png',
    siteTitle: '乐咔喜剧',
    nav: [
      { text: '首页', link: '/' },
      { text: '文字稿', link: '/transcripts/' },
      { text: '学习资料', link: '/learn' },
      { text: '乐咔俱乐部', link: '/info' },
    ],
    sidebar: [
      {
        text: '文字稿',
        items: [
          { text: '全部文字稿', link: '/transcripts/' },
          { text: 'House：我是交易的王者', link: '/transcripts/house' },
          { text: '快乐小偷 Thief of Joy', link: '/transcripts/thief-of-joy' },
          { text: '阿水：国外面试企业文化', link: '/transcripts/ashui' },
          { text: '卡姆：军训和黑车司机', link: '/transcripts/kamu' },
          { text: '李雪琴：脱口秀大会合集', link: '/transcripts/lixueqin' },
          { text: '鸟鸟：脱口秀大会第五季', link: '/transcripts/niaoniao' },
          { text: '高寒：穷门赛道的神', link: '/transcripts/gaohan' },
          { text: '锐锐：老将，每一步都来之不易', link: '/transcripts/ruirui' },
          { text: '二维马：猜拳', link: '/transcripts/erweima-caiquan' },
          { text: '二维马：打孩子', link: '/transcripts/erweima-dahai' },
          { text: '邱瑞：钻石房', link: '/transcripts/qiurui' },
          { text: '刁鑫：吐槽亚麻 manager', link: '/transcripts/diaoxin' },
        ],
      },
      {
        text: '学习资料',
        items: [
          { text: '概览', link: '/learn' },
          { text: '学习视频', link: '/videos' },
          { text: '喜剧点评与创作解析', link: '/comedy-channels' },
          { text: '公开视频课与讲解', link: '/comedy-resources#公开视频课与讲解' },
          { text: '单立人 2021 夏', link: '/danliren' },
          { text: '播客', link: '/podcasts' },
          { text: '书籍与手册', link: '/books' },
          { text: '综艺推荐', link: '/shows' },
        ],
      },
      {
        text: '俱乐部',
        items: [
          { text: '演出资讯', link: '/info' },
          { text: '推荐资料', link: '/contribute' },
        ],
      },
    ],
    socialLinks: [
      { icon: 'instagram', link: 'https://www.instagram.com/leslamcomedy/' },
      {
        icon: 'xiaohongshu',
        link: 'https://xhslink.cn/m/4ww6vasuImJ',
        ariaLabel: '小红书：慕尼黑乐咔喜剧',
      },
    ],
    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '全文搜索', buttonAriaLabel: '全文搜索' },
          modal: {
            noResultsText: '没有找到相关内容',
            resetButtonTitle: '清除搜索',
            footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' },
          },
        },
      },
    },
    editLink: false,
    outline: { label: '本页目录' },
    docFooter: { prev: '上一页', next: '下一页' },
    lastUpdated: { text: '最后更新' },
    darkModeSwitchLabel: '深色模式',
    sidebarMenuLabel: '目录',
    returnToTopLabel: '回到顶部',
    footer: {
      message: 'LeSlam Comedy 慕尼黑乐咔喜剧 · 筛选整理，持续推荐 · <a href="/contribute.html">推荐资料</a> · <a href="/info.html">俱乐部资讯</a>',
      copyright: '<a href="https://www.instagram.com/leslamcomedy/">Instagram @leslamcomedy</a> · 小红书「慕尼黑乐咔喜剧」6381249812',
    },
  },
})
