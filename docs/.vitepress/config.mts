import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'zh-CN',
  title: '乐咔喜剧知识库',
  description: 'LeSlam Comedy 俱乐部内部资料：文字稿、学习资料、俱乐部事务',
  base: '/',
  ignoreDeadLinks: true,
  // 保留「一句一行」的原文排版（锐锐、高寒等字幕稿是单换行，不加这个会合并成一段）
  markdown: {
    breaks: true,
  },
  head: [['link', { rel: 'icon', type: 'image/png', href: '/logo.png' }]],
  themeConfig: {
    logo: '/logo.png',
    nav: [
      { text: '首页', link: '/' },
      { text: '文字稿', link: '/transcripts/' },
      { text: '学习资料', link: '/learn' },
      { text: '俱乐部', link: '/info' },
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
          { text: '单立人 2021 夏', link: '/danliren' },
          { text: '播客', link: '/podcasts' },
          { text: '书单', link: '/books' },
          { text: '综艺推荐', link: '/shows' },
        ],
      },
      {
        text: '俱乐部',
        items: [
          { text: '演出资讯', link: '/info' },
          { text: '俱乐部文档', link: '/club-docs' },
          { text: '如何贡献', link: '/contribute' },
        ],
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
      { icon: 'github', link: 'https://github.com/leslamcomedy/leslamcomedy.github.io' },
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
    // 不提供 GitHub 在线编辑：成员通过微信投稿，由主理人更新
    editLink: false,
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
