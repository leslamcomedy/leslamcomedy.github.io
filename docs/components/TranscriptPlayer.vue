<script setup lang="ts">
import { computed, ref } from 'vue'

const props = withDefaults(defineProps<{
  platform: 'youtube' | 'bilibili'
  videoId: string
  title: string
  start?: number
  performances?: number
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
  <div class="transcript-player" @click="seek">
    <div ref="player" tabindex="-1" class="video-embed">
      <iframe :key="playCount" :src="embed" :title="title"
        allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen />
    </div>
    <div class="player-links">
      <details v-if="$slots.timeline" id="演出时间轴" class="timeline">
        <summary>演出时间轴<span v-if="performances"> · {{ performances }} 场</span></summary>
        <slot name="timeline" />
      </details>
      <a :href="original" target="_blank" rel="noopener noreferrer" class="original vp-external-link-icon">
        {{ isYouTube ? 'YouTube' : 'B 站' }} 原视频
      </a>
    </div>
    <slot />
  </div>
</template>

<style scoped>
.video-embed {
  margin-bottom: .25rem;
  scroll-margin-top: calc(var(--vp-nav-height) + 3rem);
}
.player-links {
  display: grid;
  align-items: start;
  font-size: .9375rem;
  line-height: 1.5;
}
.timeline, .original { grid-area: 1 / 1; }
.timeline summary {
  width: fit-content;
  max-width: calc(100% - 7rem);
  padding: .4rem 0;
  color: var(--vp-c-text-1);
  font-weight: 600;
  cursor: pointer;
}
.timeline summary::marker { color: var(--vp-c-brand-1); }
.original {
  justify-self: end;
  padding: .4rem 0;
}
.timeline :deep(table) {
  display: table;
  width: 100%;
  margin: .25rem 0 .5rem;
  font-size: .875rem;
  line-height: 1.5;
}
.timeline :deep(th), .timeline :deep(td) { padding: .3rem .55rem; }
.timeline :deep(th:first-child), .timeline :deep(td:first-child) {
  width: 1%;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.timeline :deep(td) { vertical-align: top; }
.player-links + :deep(h2), :global(.vp-doc .transcript-player + h2) {
  margin-top: 1rem;
  padding-top: 0;
  border-top: 0;
}
</style>
