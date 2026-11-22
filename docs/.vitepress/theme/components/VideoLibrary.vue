<script setup>
import { computed, ref } from 'vue'
import videos from '../../../data/videos.json'

const category = ref('all')
const query = ref('')
const categories = [
  { id: 'all', label: '全部' },
  { id: 'technique', label: '脱口秀技巧' },
  { id: 'special', label: '脱口秀专场' },
  { id: 'interview', label: '脱口秀采访' },
  { id: 'open-mic', label: '开放麦 / 拼盘演出' },
]
const filtered = computed(() => videos.filter(video =>
  (category.value === 'all' || video.category === category.value) &&
  `${video.title} ${video.author}`.toLowerCase().includes(query.value.trim().toLowerCase())
))
const count = id => videos.filter(video => id === 'all' || video.category === id).length
const label = id => categories.find(item => item.id === id)?.label
const duration = seconds => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
function reset() {
  category.value = 'all'
  query.value = ''
}
</script>

<template>
  <section class="video-library" aria-label="学习视频列表">
    <div class="video-filters" role="group" aria-label="视频分类">
      <button v-for="item in categories" :key="item.id" type="button"
        :aria-pressed="category === item.id" @click="category = item.id">
        {{ item.label }} <span>{{ count(item.id) }}</span>
      </button>
    </div>
    <label class="video-search">
      <span>搜索视频</span>
      <input v-model="query" type="search" placeholder="搜索标题、演员或 UP 主" />
    </label>
    <p class="video-result-count" role="status">共 {{ filtered.length }} 个视频 · 点击标题，在 B 站打开</p>
    <ul v-if="filtered.length" class="video-list">
      <li v-for="video in filtered" :key="video.id">
        <a :href="`https://www.bilibili.com/video/${video.id}/`" target="_blank" rel="noopener noreferrer">
          <span class="video-title">{{ video.title }} <span aria-hidden="true">↗</span></span>
          <span class="video-meta">{{ label(video.category) }} · {{ duration(video.duration) }} · {{ video.author }}</span>
          <span class="sr-only">（在新标签页打开）</span>
        </a>
      </li>
    </ul>
    <div v-else class="video-empty">
      <p>没有找到匹配的视频，试试其他关键词或分类。</p>
      <button type="button" @click="reset">查看全部视频</button>
    </div>
  </section>
</template>

<style scoped>
.video-filters { display: flex; flex-wrap: wrap; gap: 8px; margin: 24px 0; }
.video-filters button, .video-empty button { min-height: 44px; padding: 8px 14px; border: 1px solid var(--vp-c-divider); border-radius: 22px; font-size: 14px; line-height: 24px; }
.video-filters button[aria-pressed="true"] { background: #FFD500; border-color: #FFD500; color: #000; font-weight: 600; }
.video-filters button span { margin-left: 4px; opacity: .7; }
.video-search { display: flex; flex-direction: column; gap: 8px; font-size: 14px; font-weight: 600; }
.video-search input { width: 100%; min-height: 48px; padding: 10px 14px; border: 1px solid var(--vp-c-divider); border-radius: 10px; background: var(--vp-c-bg-soft); color: var(--vp-c-text-1); font: inherit; font-weight: 400; }
button:focus-visible, input:focus-visible, a:focus-visible { outline: 2px solid var(--vp-c-brand-3); outline-offset: 4px; }
.video-result-count { font-size: 13px; color: var(--vp-c-text-2); }
.video-list { list-style: none; padding: 0; margin: 0; }
.video-list li { margin: 0; border-top: 1px solid var(--vp-c-divider); }
.video-list li:last-child { border-bottom: 1px solid var(--vp-c-divider); }
.video-list a { display: flex; flex-direction: column; gap: 8px; padding: 18px 8px; color: var(--vp-c-text-1); text-decoration: none; border-radius: 6px; }
.video-list a:hover { background: var(--vp-c-bg-soft); }
.video-title { font-size: 16px; font-weight: 600; line-height: 1.6; overflow-wrap: anywhere; }
.video-title > span { color: var(--vp-c-text-3); white-space: nowrap; }
.video-meta { font-size: 13px; line-height: 1.6; color: var(--vp-c-text-2); overflow-wrap: anywhere; font-weight: 400; }
.video-empty { padding: 24px 0; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
</style>
