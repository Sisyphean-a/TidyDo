import './assets/tailwind.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

// 引入 MDI 图标
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import '@mdi/font/css/materialdesignicons.css' // 确保导入 CSS

import App from './App.vue'
import router from './router'
import { AppService } from './services/appService'

const vuetify = createVuetify({
  components,
  directives,
  // 配置图标
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },
  // Chrome扩展环境优化
  theme: {
    defaultTheme: 'light'
  }
})

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(vuetify)

// 统一的应用初始化
AppService.initializeApp().then(() => {
  app.mount('#app')
}).catch(error => {
  console.error('应用初始化失败：', error)
  // 即使初始化失败，也要挂载应用以显示错误信息
  app.mount('#app')
}) 