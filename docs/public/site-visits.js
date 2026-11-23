(() => {
  if (location.origin !== 'https://leslamcomedy.github.io' || document.getElementById('leslam-umami')) return

  // Count a direct or external entry. Refreshes and navigation inside the directory belong to the same visit.
  const navigation = window.performance?.getEntriesByType?.('navigation')?.[0]
  const referrer = document.referrer ? new URL(document.referrer) : null
  if (navigation?.type === 'reload' || navigation?.type === 'back_forward' || referrer?.origin === location.origin) return

  // Capture the sharing tags before a visitor can change the directory filters.
  const entry = new URL('/', location.origin)
  const params = new URLSearchParams(location.search)
  for (const key of ['utm_source', 'utm_medium']) {
    const value = params.get(key)
    if (value) entry.searchParams.set(key, value)
  }

  const tracker = document.createElement('script')
  tracker.id = 'leslam-umami'
  tracker.defer = true
  tracker.src = 'https://cloud.umami.is/script.js'
  tracker.dataset.websiteId = '941976b7-bb74-491a-912e-74a7c22ea1d1'
  tracker.dataset.autoTrack = 'false'
  tracker.referrerPolicy = 'no-referrer'
  tracker.addEventListener('load', () => {
    window.umami?.track(({ website, hostname, screen, language }) => ({
      website, hostname, screen, language,
      url: entry.href,
      title: '乐咔喜剧资料库',
      referrer: referrer && /^https?:$/.test(referrer.protocol) ? referrer.origin : '',
    }))
  }, { once: true })
  document.head.appendChild(tracker)
})()
