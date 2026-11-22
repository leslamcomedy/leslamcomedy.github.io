<script setup>
import { computed, ref } from 'vue'
import { data } from '../../../data/catalog.data'
import { groups } from '../../../data/catalogGroups'

const videos = data.filter(item => item.kind === '视频')
const categories = groups['视频']
const category = ref('')
const query = ref('')
const filtered = computed(() => videos.filter(video =>
  (!category.value || video.group === category.value) &&
  [video.title, video.detail, video.keywords].join(' ').toLowerCase().includes(query.value.trim().toLowerCase())
))
const sections = computed(() => categories.map(name => ({
  name, items: filtered.value.filter(video => video.group === name),
})).filter(section => section.items.length))
const count = name => videos.filter(video => video.group === name).length
function reset() {
  category.value = ''
  query.value = ''
}
</script>

<template>
  <section class="video-library" aria-label="学习视频列表">
    <div class="video-filters" role="group" aria-label="视频分类">
      <button type="button" :aria-pressed="!category" @click="category = ''">全部 <span>{{ videos.length }}</span></button>
      <button v-for="name in categories" :key="name" type="button"
        :aria-pressed="category === name" @click="category = name">
        {{ name }} <span>{{ count(name) }}</span>
      </button>
    </div>
    <label class="video-search">
      <span>搜索视频</span>
      <input v-model="query" type="search" placeholder="搜索标题、演员或 UP 主" />
    </label>
    <p class="video-result-count" role="status">共 {{ filtered.length }} 条视频资料</p>
    <section v-for="section in sections" :key="section.name" :aria-label="section.name">
      <h2>{{ section.name }}</h2>
      <ul class="video-list">
        <li v-for="video in section.items" :key="video.href">
          <a :href="video.href" target="_blank" rel="noopener noreferrer">
            <span class="video-title">{{ video.title }} <span aria-hidden="true">↗</span></span>
            <span class="video-meta">{{ video.platform }}<template v-if="video.detail"> · {{ video.detail }}</template></span>
            <span class="sr-only">（在新标签页打开）</span>
          </a>
        </li>
      </ul>
    </section>
    <div v-if="!filtered.length" class="video-empty">
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
