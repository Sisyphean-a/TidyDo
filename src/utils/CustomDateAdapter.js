import { VuetifyDateAdapter } from 'vuetify/lib/composables/date/adapters/vuetify.js'

export class CustomDateAdapter extends VuetifyDateAdapter {
    constructor(options) {
        super(options)
    }

    getWeekdays() {
        // 强制返回以周一为起始的顺序
        // 用户反馈 "依然是周日开始"，可能是因为之前的修改未生效或被覆盖
        // 这里明确返回：一, 二, 三, 四, 五, 六, 日
        return ['一', '二', '三', '四', '五', '六', '日']
    }

    format(date, formatString) {
        const d = new Date(date)

        if (formatString === 'monthAndYear') {
            // 格式： "2025 7"
            return `${d.getFullYear()} ${d.getMonth() + 1}`
        }

        if (formatString === 'month') {
            return `${d.getMonth() + 1}`
        }

        // 默认行为
        return super.format(date, formatString)
    }
}
