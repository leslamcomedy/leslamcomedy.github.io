export interface YouTubePlayer {
  seekTo(seconds: number, allowSeekAhead: boolean): void
  playVideo(): void
  getCurrentTime(): number
  getDuration(): number
  destroy(): void
}

type YouTubeAPI = {
  Player: new (iframe: HTMLIFrameElement, config: {
    events: {
      onReady: (event: { target: YouTubePlayer }) => void
      onError: () => void
    }
  }) => YouTubePlayer
}

let pending: Promise<YouTubeAPI> | undefined

export function loadYouTubePlayer(): Promise<YouTubeAPI> {
  const browser = window as Window & {
    YT?: YouTubeAPI
    onYouTubeIframeAPIReady?: () => void
  }
  if (browser.YT?.Player) return Promise.resolve(browser.YT)
  if (pending) return pending

  pending = new Promise<YouTubeAPI>((resolve, reject) => {
    const script = document.createElement('script')
    const previous = browser.onYouTubeIframeAPIReady
    browser.onYouTubeIframeAPIReady = () => {
      if (browser.YT?.Player) {
        window.clearTimeout(timeout)
        resolve(browser.YT)
      }
      previous?.()
    }
    const fail = () => {
      window.clearTimeout(timeout)
      browser.onYouTubeIframeAPIReady = previous
      script.remove()
      reject(new Error('YouTube IFrame API unavailable'))
    }
    const timeout = window.setTimeout(fail, 12000)
    script.onerror = fail
    script.src = 'https://www.youtube.com/iframe_api'
    document.head.append(script)
  }).catch(error => {
    pending = undefined
    throw error
  })
  return pending
}
