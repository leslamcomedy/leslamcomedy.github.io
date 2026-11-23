<script setup lang="ts">
import { computed, ref } from 'vue'

const props = withDefaults(defineProps<{
  platform: 'youtube' | 'bilibili'
  videoId: string
  title: string
  start?: number
}>(), { start: 0 })

const player = ref<HTMLDivElement>()
const selected = ref<number>()
const playCount = ref(0)
const isYouTube = computed(() => props.platform === 'youtube')
const seconds = computed(() => selected.value ?? props.start)
const original = computed(() => {
  if (isYouTube.value) {
    return `https://www.youtube.com/watch?v=${props.videoId}${seconds.value ? `&t=${seconds.value}s` : ''}`
  }
  return `https://www.bilibili.com/video/${props.videoId}/${seconds.value ? `?t=${seconds.value}` : ''}`
})
const embed = computed(() => {
  const autoplay = selected.value !== undefined ? '1' : '0'
  if (isYouTube.value) {
    return `https://www.youtube.com/embed/${props.videoId}?start=${seconds.value}&autoplay=${autoplay}`
  }
  return `https://player.bilibili.com/player.html?bvid=${props.videoId}&danmaku=0&autoplay=${autoplay}&t=${seconds.value}`
})

// The Markdown links also work without JavaScript or when opened in a new tab.
function seek(event: MouseEvent) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  const link = event.target instanceof Element ? event.target.closest('a') : null
  if (!link || !/^\d{2,}:\d{2}$/.test(link.textContent?.trim() ?? '')) return
  const url = new URL(link.href)
  const sameVideo = isYouTube.value
    ? url.hostname === 'www.youtube.com' && url.searchParams.get('v') === props.videoId
    : url.hostname === 'www.bilibili.com' && url.pathname === `/video/${props.videoId}/`
  const time = url.searchParams.get('t')?.match(/^(\d+)s?$/)
  if (!sameVideo || !time) return

  event.preventDefault()
  selected.value = Number(time[1])
  playCount.value++
  player.value?.focus({ preventScroll: true })
  player.value?.scrollIntoView({ block: 'start' })
}
</script>

<template>
  <div class="transcript-player">
    <div ref="player" tabindex="-1" class="video-embed">
      <iframe :key="playCount" :src="embed" :title="title"
        allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen />
    </div>
    <p><a :href="original" target="_blank" rel="noopener noreferrer" class="vp-external-link-icon">去 {{ isYouTube ? 'YouTube' : 'B 站' }} 打开原视频</a></p>
    <div class="timeline" @click="seek"><slot /></div>
  </div>
</template>

<style scoped>
.video-embed { scroll-margin-top: calc(var(--vp-nav-height) + 3rem); }
.timeline :deep(table) { display: table; width: 100%; }
.timeline :deep(th:first-child), .timeline :deep(td:first-child) {
  width: 1%;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.timeline :deep(td) { vertical-align: top; }
</style>
