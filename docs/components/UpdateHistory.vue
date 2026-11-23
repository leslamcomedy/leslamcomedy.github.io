<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { withBase } from 'vitepress'
import type { SiteUpdate } from '../data/updates'

const props = defineProps<{ initial: SiteUpdate[] }>()
const entries = ref(props.initial)
let timer: number | undefined
let request: AbortController | undefined

async function refresh() {
  if (import.meta.env.DEV || window.location.protocol === 'file:' || document.hidden || request) return
  request = new AbortController()
  try {
    const response = await fetch(withBase('/updates.json'), { cache: 'no-cache', signal: request.signal })
    if (!response.ok) return
    const latest: SiteUpdate[] = await response.json()
    if (Array.isArray(latest) && latest.length) entries.value = latest
  } catch {
    // Keep the embedded history available offline.
  } finally {
    request = undefined
  }
}

function onToggle(event: Event) {
  if ((event.currentTarget as HTMLDetailsElement).open) refresh()
}

onMounted(() => {
  if (import.meta.env.DEV || window.location.protocol === 'file:') return
  refresh()
  timer = window.setInterval(refresh, 60_000)
  document.addEventListener('visibilitychange', refresh)
})
onUnmounted(() => {
  window.clearInterval(timer)
  document.removeEventListener('visibilitychange', refresh)
  request?.abort()
})
</script>

<template>
  <details id="最新动态" class="directory-updates" @toggle="onToggle">
    <summary>
      更新记录
      <span v-if="entries.length" class="latest-update">最近一次 {{ entries[0].berlinTime }}（柏林时间）</span>
    </summary>
    <ul v-if="entries.length" class="update-list">
      <li v-for="entry in entries" :key="entry.id">
        <time :datetime="entry.date">{{ entry.berlinTime }}</time>
        <component :is="entry.changes.length > 3 ? 'details' : 'div'">
          <summary v-if="entry.changes.length > 3">查看这次变动的 {{ entry.changes.length }} 项资料</summary>
          <span v-for="(change, index) in entry.changes" :key="change.href ?? index">
            <template v-if="index">、</template>{{ change.action }}
            <a v-if="change.href" :href="withBase(change.href)">{{ change.title }}</a>
            <template v-else>{{ change.title }}</template>
          </span>
        </component>
      </li>
    </ul>
    <details class="update-archive">
      <summary>早期编辑记录</summary>
      <slot />
    </details>
  </details>
</template>

<style scoped>
.latest-update, .update-list time { color: var(--vp-c-text-2); font-size: .875rem; font-weight: 400; }
.latest-update { margin-inline-start: .5rem; }
.directory-updates .update-list { list-style: none; padding: 0 0 .75rem; }
.update-list > li { display: grid; grid-template-columns: max-content minmax(0, 1fr); gap: .25rem 1.25rem; padding: .3rem 0; }
.update-list time { font-variant-numeric: tabular-nums; }
.update-list summary, .update-archive summary { padding: 0; font-weight: 400; }
.update-archive { margin-bottom: .75rem; }
@media (max-width: 600px) {
  .update-list > li { grid-template-columns: 1fr; }
}
</style>
