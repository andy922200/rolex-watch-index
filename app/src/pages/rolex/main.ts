import '@/assets/base.css'
import '@/assets/global.scss'

import { createApp } from 'vue'

import { i18n } from '@/plugins/i18n'

import App from './App.vue'

createApp(App).use(i18n).mount('#app')
