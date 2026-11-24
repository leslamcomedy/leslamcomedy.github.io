<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { loadYouTubePlayer, type YouTubePlayer } from './youtubePlayer'

const props = withDefaults(defineProps<{
  platform: 'youtube' | 'bilibili'
  videoId: string
  title: string
  start?: number
  performances?: number
}>(), { start: 0 })

const player = ref<HTMLDivElement>()
const iframe = ref<HTMLIFrameElement>()
const transcript = ref<HTMLDivElement>()
const timeline = ref<HTMLDetailsElement>()
const followPlayback = ref(true)
const apiUnavailable = ref(false)
const hasCues = ref(false)
let youtube: YouTubePlayer | undefined
let connection: YouTubePlayer | undefined
let readyTimeout: number | undefined
let interval: number | undefined
let disposed = false

type Cue = { time: number; element: HTMLElement }
let cues: Cue[] = []
let active: Cue | undefined
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
const origin = ref('')
const embed = computed(() => {
  const autoplay = selected.value !== undefined ? '1' : '0'
  if (isYouTube.value) {
    const start = apiUnavailable.value ? seconds.value : props.start
    return `https://www.youtube.com/embed/${props.videoId}?enablejsapi=1&start=${start}&autoplay=${apiUnavailable.value ? autoplay : '0'}${origin.value}`
  }
  return `https://player.bilibili.com/player.html?bvid=${props.videoId}&danmaku=0&autoplay=${autoplay}&t=${seconds.value}`
})

function videoTime(link: HTMLAnchorElement) {
  const url = new URL(link.href)
  const sameVideo = isYouTube.value
    ? url.origin === 'https://www.youtube.com' && url.searchParams.get('v') === props.videoId
    : url.origin === 'https://www.bilibili.com' && url.pathname === `/video/${props.videoId}/`
  const time = url.searchParams.get('t')?.match(/^(\d+)s?$/)
  if (sameVideo && time) return Number(time[1])
}

function readCues() {
  const body = transcript.value!
  const byElement = new Map<HTMLElement, number>()
  for (const row of timeline.value?.querySelectorAll('tbody tr') ?? []) {
    const watch = row.querySelector<HTMLAnchorElement>('td:first-child a')
    const anchor = row.querySelector<HTMLAnchorElement>('a[href^="#"]')
    if (!watch || !anchor) continue
    const time = videoTime(watch)
    const id = decodeURIComponent(anchor.hash.slice(1))
    const target = document.getElementById(id)
    if (time === undefined || !target || !body.contains(target)) continue
    const block = target.matches('h2, h3') ? target.nextElementSibling : target.closest('p') ?? target
    if (block instanceof HTMLElement && block.matches('p, .transcript-highlight')) {
      byElement.set(block, time)
    }
  }

  for (const link of body.querySelectorAll<HTMLAnchorElement>('a[href]')) {
    const time = videoTime(link)
    const block = link.closest('p')
    if (time !== undefined && block && /^\d{2,}:\d{2}$/.test(link.textContent?.trim() ?? '')) {
      byElement.set(block, time)
    }
  }

  cues = Array.from(byElement, ([element, time]) => ({ time, element })).sort((a, b) => a.time - b.time)
  hasCues.value = cues.length > 0
  for (const { element, time } of cues) {
    element.dataset.transcriptTime = String(time)
    if (!element.querySelector('a[data-cue], a[href*="t="]')) {
      const link = document.createElement('a')
      const url = new URL(original.value)
      url.searchParams.set('t', isYouTube.value ? `${time}s` : String(time))
      link.href = url.href
      link.className = 'transcript-timestamp'
      link.dataset.cue = ''
      link.textContent = `${String(Math.floor(time / 60)).padStart(2, '0')}:${String(time % 60).padStart(2, '0')}`
      element.prepend(link)
    }
  }
}

function showCue(time: number, follow: boolean) {
  let next: Cue | undefined
  for (const cue of cues) {
    if (cue.time > time) break
    next = cue
  }
  if (next === active) return
  active?.element.removeAttribute('aria-current')
  active = next
  active?.element.setAttribute('aria-current', 'true')
  if (active && follow && followPlayback.value) scrollToCue(active)
}

function scrollToCue(cue: Cue) {
  const panel = transcript.value!
  const top = cue.element.getBoundingClientRect().top - panel.getBoundingClientRect().top
  panel.scrollTop += top - 12
}

function jump(time: number) {
  selected.value = time
  if (youtube) {
    youtube.seekTo(time, true)
    youtube.playVideo()
  } else if (!isYouTube.value || apiUnavailable.value) {
    playCount.value++
  }
  showCue(time, false)
}

// Preserve open-in-new-tab and the original platform timestamp.
function seek(event: MouseEvent) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  const target = event.target
  if (!(target instanceof Element)) return
  const link = target.closest('a')
  const block = target.closest<HTMLElement>('[data-transcript-time]')
  if (link && !/^\d{2,}:\d{2}$/.test(link.textContent?.trim() ?? '')) return
  if (!link && (!block || window.getSelection()?.toString())) return
  const time = link ? videoTime(link) : Number(block!.dataset.transcriptTime)
  if (time === undefined) return

  event.preventDefault()
  jump(time)
  if (!block && active?.time === time && followPlayback.value) scrollToCue(active)
}

function unavailable() {
  window.clearTimeout(readyTimeout)
  window.clearInterval(interval)
  youtube = undefined
  apiUnavailable.value = true
}

onMounted(async () => {
  readCues()
  if (!isYouTube.value || !iframe.value) return
  // Set the full origin after hydration, before the API connects to the iframe.
  origin.value = `&origin=${encodeURIComponent(window.location.origin)}`
  await nextTick()
  try {
    const api = await loadYouTubePlayer()
    if (disposed || !iframe.value) return
    readyTimeout = window.setTimeout(unavailable, 12000)
    connection = new api.Player(iframe.value, {
      events: {
        onReady({ target }) {
          if (disposed || apiUnavailable.value) return
          window.clearTimeout(readyTimeout)
          youtube = target
          if (selected.value !== undefined) jump(selected.value)
          interval = window.setInterval(() => {
            if (youtube && youtube.getDuration() > 0) showCue(youtube.getCurrentTime(), true)
          }, 250)
        },
        onError: unavailable,
      },
    })
  } catch {
    if (!disposed) unavailable()
  }
})

onBeforeUnmount(() => {
  disposed = true
  window.clearInterval(interval)
  window.clearTimeout(readyTimeout)
  connection?.destroy()
})
</script>

<template>
  <div class="transcript-player" @click="seek">
    <div ref="player" tabindex="-1" class="video-embed">
      <iframe ref="iframe" :key="playCount" :src="embed" :title="title"
        allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen />
    </div>
    <div class="player-links">
      <details v-if="$slots.timeline" ref="timeline" id="演出时间轴" class="timeline">
        <summary>演出时间轴<span v-if="performances"> · {{ performances }} 场</span></summary>
        <slot name="timeline" />
      </details>
      <a :href="original" target="_blank" rel="noopener noreferrer" class="original vp-external-link-icon">
        {{ isYouTube ? 'YouTube' : 'B 站' }} 原视频
      </a>
    </div>
    <div v-if="isYouTube && hasCues && !apiUnavailable" class="transcript-controls">
      <label><input v-model="followPlayback" type="checkbox" @change="followPlayback && active && scrollToCue(active)" /> 跟随播放</label>
    </div>
    <div v-else-if="apiUnavailable" class="transcript-controls" role="status">同步播放暂不可用，可用上方链接打开原视频。</div>
    <div ref="transcript" class="transcript-body" tabindex="0" aria-label="逐字稿">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.transcript-controls { margin-top: .5rem; font-size: .875rem; }
.transcript-controls input { accent-color: var(--vp-c-brand-1); }
.transcript-body {
  max-height: min(48vh, 32rem);
  overflow: auto;
  padding: 0 .75rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  margin-top: .5rem;
  overflow-anchor: none;
}
.transcript-body :deep([data-transcript-time]) { cursor: pointer; }
.transcript-body :deep([aria-current="true"]) {
  background: var(--vp-c-brand-soft);
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 2px;
  border-radius: 4px;
}
.transcript-body :deep(.transcript-timestamp) {
  display: inline-block;
  margin-inline-end: .7em;
  font-variant-numeric: tabular-nums;
}
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
  margin: 0;
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
