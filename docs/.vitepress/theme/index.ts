import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import TranscriptPlayer from '../../components/TranscriptPlayer.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('TranscriptPlayer', TranscriptPlayer)
  },
} satisfies Theme
