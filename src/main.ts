import { createApp } from 'vue'
import '@fontsource/poppins/600.css'
import '@fontsource/dm-sans/400.css'
import '@fontsource/dm-sans/500.css'
import '@fontsource/dm-sans/700.css'
import '@fontsource/noto-serif-jp/400.css'
import './styles.css'
import App from './App.vue'
import { router } from './router'

createApp(App).use(router).mount('#app')
