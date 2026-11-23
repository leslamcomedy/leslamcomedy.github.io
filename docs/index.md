---
layout: page
sidebar: false
aside: false
title: 乐咔喜剧精选推荐
description: 慕尼黑乐咔喜剧筛选推荐的演出、文字稿、视频、播客、书籍与创作手册。从乐咔的选择中，发现值得看、读、听的喜剧内容。
recommendedBooks:
  - href: https://yes1am.github.io/stand-up-comedy/
    cover: /book-covers/handbook-v1.1.png
  - href: https://weread.qq.com/web/bookDetail/13b32ff0811e7e4c5g018897
  - href: https://weread.qq.com/web/bookDetail/83432cc0813ab7406g014dbc
---

<script setup>
import { useData } from 'vitepress'
import ResourceDirectory from './components/ResourceDirectory.vue'
import UpdateHistory from './components/UpdateHistory.vue'

const { frontmatter } = useData()
</script>

<main>
<ResourceDirectory :recommended-books="frontmatter.recommendedBooks" />
<UpdateHistory :initial="frontmatter.updates">

- **2026 年 11 月 22 日 19:23** · 新增[喜剧点评与创作解析](/comedy-channels)和[免费喜剧资料](/comedy-resources)，更新[书籍与手册](/books)
- **2026 年 11 月 20 日 21:45** · 添加播客[《一言不合》：你就这么用开放麦啊？](https://www.xiaoyuzhoufm.com/episode/5eff02a46d76607427667101)
- **2026 年 11 月 16 日 23:18** · 补充[邱瑞](/transcripts/qiurui)、[刁鑫](/transcripts/diaoxin)文字稿和[单立人视频合集](/danliren)
- **2026 年 11 月 16 日 22:56** · 添加播客[《一言不合》：单口喜剧废料处理厂](https://www.xiaoyuzhoufm.com/episode/5e280fab418a84a0461fac4e)

</UpdateHistory>
</main>
