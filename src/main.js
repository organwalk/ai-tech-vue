import { createApp } from 'vue'
import App from '@/App.vue'
import router from '@/router/index.js'
import '@/assets/styles/variables.css'
import elementPlus from '@/shared/plugins/elementPlus.js'

const app = createApp(App)
app.use(router)
app.use(elementPlus)

app.mount('#app')

const hideScrollbarStyle = document.createElement('style')
hideScrollbarStyle.textContent = `
  * {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  *::-webkit-scrollbar {
    display: none;
  }
`
document.head.appendChild(hideScrollbarStyle)
