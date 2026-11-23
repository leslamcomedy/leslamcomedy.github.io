<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { withBase } from 'vitepress'
import { data } from '../data/catalog.data'
import { groups, kinds, type Kind } from '../data/catalogGroups'

const props = defineProps<{ recommendedBooks: { href: string; cover?: string }[] }>()
const readingList = computed(() => props.recommendedBooks.map(({ href, cover }) => {
  const book = data.find(item => item.kind === '书籍与手册' && item.href === href)
  if (!book) throw new Error(`推荐书目缺少资料条目 ${href}`)
  return { ...book, cover: cover ?? book.cover }
}))

const pageSize = 12
const query = ref('')
const kind = ref<Kind | ''>('')
const group = ref('')
const limit = ref(pageSize)
const resultHeading = ref<HTMLElement>()
const searchInput = ref<HTMLInputElement>()

function normalize(text: string) {
  return text.normalize('NFKC').toLowerCase().replace(/\s+/g, '')
}

const indexed = data.map(item => ({
  item, title: normalize(item.title),
  text: normalize([item.title, item.kind, item.group, item.podcastLabel, item.platform, item.detail, item.keywords, item.source?.label].join(' ')),
}))
const terms = computed(() => query.value.trim().split(/\s+/).filter(Boolean).map(normalize))
const results = computed(() => {
  const hits = indexed.filter(({ item, text }) =>
    (!kind.value || item.kind === kind.value) && (!group.value || item.group === group.value) &&
    terms.value.every(term => text.includes(term)),
  )
  if (terms.value.length) {
    const titleHits = (title: string) => terms.value.filter(term => title.includes(term)).length
    hits.sort((left, right) => titleHits(right.title) - titleHits(left.title))
  }
  return hits.map(({ item }) => item)
})

const subgroups = computed(() => kind.value ? groups[kind.value] : [])
const singleSection = computed(() => Boolean(kind.value && (group.value || !subgroups.value.length)))
const sectionLimit = computed(() => {
  if (singleSection.value) return limit.value
  if (terms.value.length) return pageSize
  if (!kind.value) return 2
  return kind.value === '视频' ? 4 : pageSize
})

const shelves = computed(() => kinds.flatMap(key => {
  if (key === '书籍与手册' && !kind.value && !terms.value.length) {
    const items = readingList.value
    return [{ kind: key, bookPreview: true, sections: [{ name: '书籍', count: items.length, items }] }]
  }
  const items = results.value.filter(item => item.kind === key)
  if (!items.length) return []
  const size = !kind.value && key === '喜剧点评与创作解析' ? pageSize : sectionLimit.value
  const names = new Set([...groups[key], ...items.map(item => item.group ?? '')])
  const sections = [...names].flatMap(name => {
    const matches = items.filter(item => (item.group ?? '') === name)
    return matches.length ? [{ name, count: matches.length, items: matches.slice(0, size) }] : []
  })
  return [{ kind: key, sections, bookPreview: false }]
}))

function selectKind(key: Kind | '', name = '') {
  kind.value = key
  group.value = name
}

const previewFilterHash = '#catalog?'
function restoreFilters() {
  const url = new URL(window.location.href)
  const params = url.protocol === 'file:' && url.hash.startsWith(previewFilterHash)
    ? new URLSearchParams(url.hash.slice(previewFilterHash.length)) : url.searchParams
  query.value = params.get('q') ?? ''
  const type = params.get('type')
  if (type === '手册' || type === '书籍') {
    selectKind('书籍与手册', type === '手册' ? '创作和表演手册' : '书籍')
    return
  }
  const key = type === '创作者' ? '喜剧点评与创作解析' : kinds.find(item => item === type)
  const name = params.get('group') ?? ''
  selectKind(key ?? '', key && groups[key].includes(name) ? name : '')
}

onMounted(() => {
  restoreFilters()
  window.addEventListener('popstate', restoreFilters)
})
onUnmounted(() => window.removeEventListener('popstate', restoreFilters))

watch([query, kind, group], () => {
  limit.value = pageSize
  const url = new URL(window.location.href)
  // A local file can update its fragment, while the published site uses query parameters.
  const local = url.protocol === 'file:'
  const params = local ? new URLSearchParams() : url.searchParams
  for (const [key, value] of [['q', query.value.trim()], ['type', kind.value], ['group', group.value]]) {
    if (value) params.set(key, value)
    else params.delete(key)
  }
  if (local && (params.size || url.hash.startsWith(previewFilterHash))) {
    url.hash = params.size ? previewFilterHash + params : ''
  }
  if (url.href !== window.location.href) history.replaceState(history.state, '', url)
})

function reset() {
  query.value = ''
  selectKind('')
  searchInput.value?.focus()
}
async function showResults() {
  await nextTick()
  resultHeading.value?.focus()
  resultHeading.value?.scrollIntoView({ block: 'start' })
}
function openSection(key: Kind, name: string) {
  selectKind(key, name)
  showResults()
}
function destination(href: string) {
  return href.startsWith('/') ? withBase(href) : href
}
</script>

<template>
  <div class="directory">
    <header class="directory-top">
      <h1 class="visually-hidden">乐咔喜剧推荐</h1>
      <form role="search" aria-label="搜索乐咔精选" class="directory-search" @submit.prevent="showResults">
        <span class="vpi-search" aria-hidden="true"></span>
        <input id="recommendation-search" ref="searchInput" v-model="query" type="search" aria-label="搜索已收录的推荐"
          placeholder="搜索已收录的推荐" enterkeyhint="search" />
        <button type="submit">搜索</button>
      </form>
      <p class="curation-credit">由慕尼黑乐咔喜剧筛选整理，持续补充。</p>
    </header>

    <section class="catalog" aria-labelledby="catalog-heading">
      <h2 id="catalog-heading" ref="resultHeading" tabindex="-1" :class="{ 'visually-hidden': !terms.length }">{{ terms.length ? '搜索结果' : '推荐内容' }}</h2>
      <div class="formats" role="group" aria-label="按资料类型筛选">
        <button type="button" :aria-pressed="kind === ''" @click="selectKind('')">全部</button>
        <button v-for="key in kinds" :key="key" type="button" :aria-pressed="kind === key" @click="selectKind(key)">{{ key }}</button>
      </div>
      <div v-if="subgroups.length" class="subfilters" role="group" :aria-label="kind + '分类'">
        <button type="button" :aria-pressed="!group" @click="group = ''">全部{{ kind }}</button>
        <button v-for="name in subgroups" :key="name" type="button" :aria-pressed="group === name" @click="group = name">{{ name }}</button>
      </div>
      <div class="result-line">
        <p role="status" aria-live="polite">{{ terms.length || kind ? '匹配' : '已精选' }} {{ results.length }} 条</p>
        <button v-if="query || kind" type="button" @click="reset">清除筛选</button>
      </div>
      <section v-for="shelf in shelves" :key="shelf.kind" class="shelf" :class="{ 'book-preview': shelf.bookPreview }" :aria-label="shelf.kind">
        <div class="shelf-heading">
          <h3>{{ shelf.bookPreview ? '乐咔荐书 · 从入门到进阶' : shelf.kind }}</h3>
          <button v-if="shelf.bookPreview" type="button" class="see-all" aria-label="查看全部书籍与手册" @click="openSection(shelf.kind, '')">全部书目</button>
        </div>
        <div v-for="section in shelf.sections" :key="section.name" class="resource-section">
          <div v-if="section.name && !shelf.bookPreview" class="group-heading">
            <h4>{{ section.name }}</h4>
            <span>{{ section.count }} 条</span>
          </div>
          <component :is="shelf.bookPreview ? 'ol' : 'ul'" class="resources" :class="{ 'book-grid': section.name === '书籍' }">
            <li v-for="item in section.items" :key="item.href">
              <a class="entry" :href="destination(item.href)">
                <img v-if="item.cover" :src="withBase(item.cover)" alt="" width="112" height="156" decoding="async" />
                <div class="entry-info">
                  <span v-if="item.podcastLabel" class="podcast-label">{{ item.podcastLabel }}</span>
                  <span class="entry-title resource-link-title">{{ item.title }}</span>
                  <template v-if="!shelf.bookPreview">
                    <p v-if="item.detail">{{ item.detail }}</p>
                    <span class="metadata">{{ item.platform }}</span>
                  </template>
                </div>
              </a>
              <a v-if="!shelf.bookPreview && item.source" class="source" :href="item.source.href">{{ item.source.label }}</a>
            </li>
          </component>
          <button v-if="!shelf.bookPreview && section.count > section.items.length && !singleSection" class="see-all" type="button"
            :aria-label="`查看${section.name || shelf.kind}的全部 ${section.count} 条资料`"
            @click="openSection(shelf.kind, section.name)">查看全部 {{ section.count }} 条 <span aria-hidden="true">→</span></button>
        </div>
      </section>
      <div v-if="!results.length" class="empty">
        <h3>已收录的推荐中暂未找到匹配内容</h3>
        <p>这里只搜索乐咔已收录的内容。可以换个关键词，或清除筛选继续浏览推荐。</p>
      </div>
      <button v-if="singleSection && results.length > limit" class="load-more" type="button" @click="limit += pageSize">
        再显示 {{ Math.min(pageSize, results.length - limit) }} 条
      </button>
    </section>
  </div>
</template>

<style scoped>
.directory {
  --ink: #20211e;
  --rule: var(--vp-c-divider);
  width: min(100%, 1184px);
  margin-inline: auto;
  padding: 16px clamp(20px, 4vw, 56px) 28px;
  color: var(--vp-c-text-1);
}
.visually-hidden { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.directory-top { display: flex; flex-direction: column; gap: 8px; }
.curation-credit { margin: 0; color: var(--vp-c-text-2); font-size: .8125rem; line-height: 1.6; }
.directory-search { width: min(100%, 420px); border: 1px solid var(--rule); display: flex; align-items: center; gap: 10px; padding: 3px 3px 3px 10px; background: white; color: var(--ink); border-radius: 9px; }
.directory-search:focus-within { outline: 2px solid #ffda38; outline-offset: 3px; }
.directory-search .vpi-search { flex: none; width: 18px; height: 18px; color: #66685f; }
.directory-search input { flex: 1; min-width: 0; width: 100%; color: var(--ink); background: white; font-size: 16px; outline: none; }
.directory-search input::placeholder { color: #66685f; opacity: 1; }
.directory-search button { flex: none; min-height: 34px; padding: 0 14px; border-radius: 6px; background: #ffda38; color: #171810; font-size: .9375rem; font-weight: 700; }
.directory-search button:hover { background: #ffe670; }
.catalog { margin-top: 10px; }
.catalog-heading, .result-line { display: flex; align-items: center; }
.catalog-heading, .result-line { justify-content: space-between; gap: 12px; }
.catalog-heading h2 { margin: 0; font-size: clamp(1.55rem, 2.4vw, 2rem); font-weight: 750; line-height: 1.4; letter-spacing: -.03em; scroll-margin-top: 90px; }
.contribute-link, .result-line button, .source { font-size: .875rem; text-decoration: underline; text-underline-offset: 4px; }
.contribute-link { padding: 8px 0 8px 8px; font-weight: 600; }
.formats { display: flex; flex-wrap: wrap; gap: 7px; margin: 16px 0 8px; }
.formats button, .load-more { border: 1px solid var(--rule); border-radius: 7px; background: var(--vp-c-bg); min-height: 42px; padding: 6px 15px; font-size: .9375rem; font-weight: 550; }
.formats button:hover, .load-more:hover { background: var(--vp-c-bg-soft); }
.formats button[aria-pressed=true] { background: #ffda38; border-color: #ffda38; color: #191a14; font-weight: 700; }
.subfilters { display: flex; flex-wrap: wrap; gap: 0 14px; padding: 3px 0; }
.subfilters button { min-height: 40px; border-bottom: 2px solid transparent; color: var(--vp-c-text-2); font-size: .875rem; }
.subfilters button:hover { color: var(--vp-c-text-1); }
.subfilters button[aria-pressed=true] { border-color: var(--vp-c-brand-1); color: var(--vp-c-text-1); font-weight: 650; }
.result-line { min-height: 36px; color: var(--vp-c-text-2); font-size: .875rem; }
.shelf { margin: 16px 0 28px; }
.shelf-heading { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding-bottom: 9px; border-bottom: 2px solid var(--vp-c-text-1); }
.shelf-heading h3 { margin: 0; font-size: 1.375rem; line-height: 1.4; font-weight: 750; }
.resource-section + .resource-section { margin-top: 21px; }
.group-heading { display: flex; align-items: baseline; gap: 10px; padding: 12px 0 3px; }
.group-heading h4 { margin: 0; font-size: 1rem; line-height: 1.5; font-weight: 700; }
.group-heading span, .metadata { color: var(--vp-c-text-2); font-size: .8125rem; }
.resources { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: clamp(24px, 4vw, 56px); }
.resources li { min-width: 0; border-bottom: 1px solid var(--rule); padding-bottom: 14px; }
.entry { display: flex; gap: 12px; justify-content: space-between; align-items: flex-start; min-height: 64px; padding: 12px 0 1px; }
.entry-info { min-width: 0; }
.podcast-label { display: block; margin-bottom: 4px; color: var(--vp-c-text-2); font-size: .875rem; font-weight: 600; }
.metadata { display: block; margin-top: 4px; line-height: 1.5; }
.entry-title { display: block; font-weight: 650; font-size: 1.1rem; line-height: 1.5; overflow-wrap: anywhere; }
.book-grid { grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 14px clamp(12px, 2vw, 24px); }
.book-grid .entry { flex-direction: column; justify-content: flex-start; gap: 10px; }
.book-grid img { display: block; width: 100%; height: clamp(138px, 15vw, 172px); padding: 8px; object-fit: contain; border-radius: 6px; background: var(--vp-c-bg-soft); }
.book-grid .entry-title { font-size: 1rem; }
.book-preview { margin: 8px 0 16px; }
.book-preview .shelf-heading { padding-bottom: 3px; }
.book-preview .shelf-heading h3 { font-size: 1.0625rem; }
.book-preview .see-all { min-height: 32px; }
.book-preview .book-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: clamp(6px, 2vw, 20px); }
.book-preview li { padding-bottom: 0; }
.book-preview .entry { flex-direction: row; align-items: center; justify-content: flex-start; gap: 8px; min-height: 0; padding: 6px 0; }
.book-preview img { flex: none; width: 46px; height: 62px; padding: 0; border-radius: 2px; background: transparent; }
.book-preview .entry-title { font-size: .9375rem; line-height: 1.35; }
.entry p { color: var(--vp-c-text-2); }
.source, .contribute-link { color: var(--vp-c-brand-1); }
.entry p { margin-top: 3px; font-size: .875rem; line-height: 1.5; }
.source { display: inline-flex; align-items: center; min-height: 28px; }
.see-all { min-height: 42px; padding: 4px 0; color: var(--vp-c-brand-1); font-size: .875rem; font-weight: 600; text-decoration: underline; text-underline-offset: .2em; }
.load-more { display: block; margin: 22px auto 0; padding-inline: 28px; }
.empty { padding: 30px 0; border-block: 1px solid var(--rule); }
.empty h3 { font-weight: 650; }
.empty p { margin-top: 6px; color: var(--vp-c-text-2); }
.directory :is(a, button, h2):focus-visible { outline: 2px solid var(--vp-c-brand-1); outline-offset: 3px; }
.directory-hero :is(a, button):focus-visible { outline-color: #ffda38; }
@media (max-width: 760px) {
  .directory { padding: 14px 16px 20px; }
  .resources { grid-template-columns: 1fr; }
  .book-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .formats { gap: 6px; margin-top: 10px; }
  .formats button { padding-inline: 11px; }
  .directory-search { padding-left: 9px; gap: 6px; }
  .directory-search button { padding-inline: 13px; }
}
@media (max-width: 600px) {
  .book-preview .entry { flex-direction: column; gap: 4px; text-align: center; }
  .book-preview img { width: 42px; height: 56px; }
  .book-preview .entry-title { font-size: .875rem; }
}
@media (max-width: 520px) {
  .book-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 420px) {

}
</style>
