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
import { initializeConfig } from './services/configService'
import { initializeDefaultData } from './services/todoService'
import { TodoBusinessService } from './services/todoBusinessService'

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

// 初始化数据
async function initializeApp() {
  try {
    await initializeConfig()
    await TodoBusinessService.initialize()
    await initializeDefaultData()
  } catch (error) {
    console.error('应用初始化失败：', error)
  }
}

initializeApp()

app.mount('#app') 