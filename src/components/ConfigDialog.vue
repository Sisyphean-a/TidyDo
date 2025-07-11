<template>
  <v-dialog
    v-model="isVisible"
    max-width="800"
    persistent
  >
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="me-2">mdi-cog</v-icon>
        系统配置
        <v-spacer />
        <v-btn
          icon
          variant="text"
          @click="handleClose"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-6">
        <v-tabs
          v-model="activeTab"
          class="mb-6"
        >
          <v-tab value="status">状态配置</v-tab>
          <v-tab value="priority">优先级配置</v-tab>
          <v-tab value="data">数据管理</v-tab>
          <!-- <v-tab value="field">字段配置</v-tab> -->
          <!-- <v-tab value="system">系统设置</v-tab> -->
        </v-tabs>

        <v-tabs-window v-model="activeTab">
          <!-- 状态配置 -->
          <v-tabs-window-item value="status">
            <v-card variant="outlined">
              <v-card-text>
                <div
                  v-for="(status, key) in statusConfig"
                  :key="key"
                  class="mb-4"
                >
                  <v-row>
                    <v-col cols="3">
                      <v-text-field
                        :model-value="key"
                        label="状态键"
                        variant="outlined"
                        density="compact"
                        readonly
                      />
                    </v-col>
                    <v-col cols="4">
                      <v-text-field
                        v-model="status.text"
                        label="显示文本"
                        variant="outlined"
                        density="compact"
                      />
                    </v-col>
                    <v-col cols="3">
                      <v-select
                        v-model="status.color"
                        label="颜色"
                        :items="colorOptions"
                        variant="outlined"
                        density="compact"
                      />
                    </v-col>
                    <v-col
                      cols="2"
                      class="d-flex align-center"
                    >
                      <v-chip
                        :color="status.color"
                        size="small"
                      >
                        {{ status.text }}
                      </v-chip>
                    </v-col>
                  </v-row>
                </div>
              </v-card-text>
            </v-card>
          </v-tabs-window-item>

          <!-- 优先级配置 -->
          <v-tabs-window-item value="priority">
            <v-card variant="outlined">
              <v-card-text>
                <div
                  v-for="(priority, key) in priorityConfig"
                  :key="key"
                  class="mb-4"
                >
                  <v-row>
                    <v-col cols="2">
                      <v-text-field
                        :model-value="key"
                        label="优先级键"
                        variant="outlined"
                        density="compact"
                        readonly
                      />
                    </v-col>
                    <v-col cols="3">
                      <v-text-field
                        v-model="priority.text"
                        label="显示文本"
                        variant="outlined"
                        density="compact"
                      />
                    </v-col>
                    <v-col cols="3">
                      <v-select
                        v-model="priority.color"
                        label="颜色"
                        :items="colorOptions"
                        variant="outlined"
                        density="compact"
                      />
                    </v-col>
                    <v-col cols="2">
                      <v-select
                        v-model="priority.icon"
                        label="图标"
                        :items="iconOptions"
                        variant="outlined"
                        density="compact"
                      />
                    </v-col>
                    <v-col
                      cols="2"
                      class="d-flex align-center"
                    >
                      <v-chip
                        :color="priority.color"
                        size="small"
                      >
                        <v-icon
                          start
                          :icon="priority.icon"
                        />
                        {{ priority.text }}
                      </v-chip>
                    </v-col>
                  </v-row>
                </div>
              </v-card-text>
            </v-card>
          </v-tabs-window-item>

          <!-- 数据管理 -->
          <v-tabs-window-item value="data">
            <v-card variant="outlined">
              <v-card-title class="text-h6 pa-4">
                <v-icon class="me-2">mdi-database</v-icon>
                数据备份与恢复
              </v-card-title>

              <v-divider />

              <v-card-text class="pa-6">
                <!-- 数据统计 -->
                <v-row class="mb-6">
                  <v-col cols="12">
                    <div class="text-subtitle-2 mb-3">当前数据统计</div>
                    <v-card
                      variant="tonal"
                      color="info"
                    >
                      <v-card-text class="pa-4">
                        <div v-if="dataStats.totalKeys > 0">
                          <div class="mb-2">
                            <strong>总数据项：</strong> {{ dataStats.totalKeys }}
                          </div>
                          <div
                            v-for="(detail, key) in dataStats.details"
                            :key="key"
                            class="mb-1"
                          >
                            <v-chip
                              size="small"
                              class="me-2"
                              variant="outlined"
                              >{{ getKeyDisplayName(key) }}</v-chip
                            >
                            <span v-if="detail.type === 'array'">{{ detail.count }} 项</span>
                            <span v-else-if="detail.type === 'object'"
                              >{{ detail.keys }} 个配置</span
                            >
                            <span v-else>{{ detail.type }}</span>
                          </div>
                        </div>
                        <div
                          v-else
                          class="text-grey"
                        >
                          暂无数据
                        </div>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>

                <!-- 导出功能 -->
                <v-row class="mb-6">
                  <v-col cols="12">
                    <div class="text-subtitle-2 mb-3">数据导出</div>
                    <v-card variant="outlined">
                      <v-card-text class="pa-4">
                        <p class="text-body-2 mb-4">
                          将当前所有数据导出为JSON文件，包括待办事项、分类和系统配置等。
                        </p>
                        <v-btn
                          color="primary"
                          variant="flat"
                          prepend-icon="mdi-download"
                          @click="handleExportData"
                          :disabled="isLoading"
                          :loading="isExporting"
                        >
                          导出所有数据
                        </v-btn>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>

                <!-- 导入功能 -->
                <v-row>
                  <v-col cols="12">
                    <div class="text-subtitle-2 mb-3">数据导入</div>
                    <v-card variant="outlined">
                      <v-card-text class="pa-4">
                        <p class="text-body-2 mb-4">
                          从JSON文件导入数据，可选择覆盖现有数据或与现有数据合并。
                        </p>

                        <!-- 文件选择 -->
                        <div class="mb-4">
                          <v-file-input
                            v-model="selectedFile"
                            label="选择备份文件"
                            accept=".json"
                            prepend-icon="mdi-file-upload"
                            variant="outlined"
                            density="comfortable"
                            :disabled="isLoading"
                          />
                        </div>

                        <!-- 导入选项 -->
                        <div class="mb-4">
                          <v-radio-group
                            v-model="importMode"
                            inline
                            :disabled="isLoading"
                          >
                            <template #label>
                              <div class="text-subtitle-2">导入模式：</div>
                            </template>
                            <v-radio
                              label="合并数据（保留现有数据）"
                              value="merge"
                            />
                            <v-radio
                              label="覆盖数据（清除现有数据）"
                              value="replace"
                            />
                          </v-radio-group>
                        </div>

                        <!-- 导入按钮 -->
                        <v-btn
                          color="warning"
                          variant="flat"
                          prepend-icon="mdi-upload"
                          @click="handleImportData"
                          :disabled="!selectedFile || isLoading"
                          :loading="isImporting"
                        >
                          导入数据
                        </v-btn>

                        <!-- 警告提示 -->
                        <v-alert
                          v-if="importMode === 'replace'"
                          type="warning"
                          variant="tonal"
                          class="mt-4"
                        >
                          <strong>警告：</strong>覆盖模式将清除所有现有数据，此操作不可撤销！
                        </v-alert>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-tabs-window-item>

          <!-- 字段配置 -->
          <v-tabs-window-item value="field">
            <v-card variant="outlined">
              <v-card-text>
                <div
                  v-for="(field, key) in fieldConfig"
                  :key="key"
                  class="mb-4"
                >
                  <v-row>
                    <v-col cols="3">
                      <v-text-field
                        :model-value="key"
                        label="字段键"
                        variant="outlined"
                        density="compact"
                        readonly
                      />
                    </v-col>
                    <v-col cols="4">
                      <v-text-field
                        v-model="field.label"
                        label="显示标签"
                        variant="outlined"
                        density="compact"
                      />
                    </v-col>
                    <v-col cols="3">
                      <v-switch
                        v-model="field.required"
                        label="必填字段"
                        color="primary"
                        density="compact"
                      />
                    </v-col>
                    <v-col
                      cols="2"
                      class="d-flex align-center"
                    >
                      <v-chip
                        :color="field.required ? 'error' : 'grey'"
                        size="small"
                      >
                        {{ field.label }}{{ field.required ? ' *' : '' }}
                      </v-chip>
                    </v-col>
                  </v-row>
                </div>
              </v-card-text>
            </v-card>
          </v-tabs-window-item>

          <!-- 系统设置 -->
          <v-tabs-window-item value="system">
            <v-card variant="outlined">
              <v-card-text>
                <v-row>
                  <v-col cols="6">
                    <v-select
                      v-model="systemConfig.theme"
                      label="主题"
                      :items="themeOptions"
                      variant="outlined"
                      density="comfortable"
                    />
                  </v-col>
                  <v-col cols="6">
                    <v-select
                      v-model="systemConfig.language"
                      label="语言"
                      :items="languageOptions"
                      variant="outlined"
                      density="comfortable"
                    />
                  </v-col>
                  <v-col cols="6">
                    <v-select
                      v-model="systemConfig.dateFormat"
                      label="日期格式"
                      :items="dateFormatOptions"
                      variant="outlined"
                      density="comfortable"
                    />
                  </v-col>
                  <v-col cols="6">
                    <v-select
                      v-model="systemConfig.timeFormat"
                      label="时间格式"
                      :items="timeFormatOptions"
                      variant="outlined"
                      density="comfortable"
                    />
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-tabs-window-item>
        </v-tabs-window>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-btn
          color="warning"
          variant="outlined"
          @click="resetToDefault"
          :disabled="isLoading"
        >
          <v-icon class="me-1">mdi-restore</v-icon>
          重置默认
        </v-btn>

        <v-spacer />

        <v-btn
          color="grey"
          variant="outlined"
          @click="handleClose"
          :disabled="isLoading"
        >
          取消
        </v-btn>

        <v-btn
          color="primary"
          variant="flat"
          @click="handleSave"
          :disabled="isLoading"
          :loading="isLoading"
        >
          保存
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { ConfigService } from '@/services/configService'
import { DataService } from '@/services/dataService'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'config-updated'])

const activeTab = ref('status')
const isLoading = ref(false)

// 配置数据
const statusConfig = ref({})
const priorityConfig = ref({})
const fieldConfig = ref({})
const systemConfig = ref({})

// 数据管理相关状态
const dataStats = ref({ totalKeys: 0, details: {} })
const selectedFile = ref(null)
const importMode = ref('merge')
const isExporting = ref(false)
const isImporting = ref(false)

// 选项数据
const colorOptions = [
  { title: '主要色', value: 'primary' },
  { title: '成功', value: 'success' },
  { title: '警告', value: 'warning' },
  { title: '错误', value: 'error' },
  { title: '信息', value: 'info' },
  { title: '灰色', value: 'grey' },
]

const iconOptions = [
  { title: '向下箭头', value: 'mdi-chevron-down' },
  { title: '向上箭头', value: 'mdi-chevron-up' },
  { title: '双向上箭头', value: 'mdi-chevron-double-up' },
  { title: '减号', value: 'mdi-minus' },
  { title: '感叹号', value: 'mdi-exclamation' },
  { title: '警告', value: 'mdi-alert' },
]

const themeOptions = [
  { title: '浅色主题', value: 'light' },
  { title: '深色主题', value: 'dark' },
]

const languageOptions = [
  { title: '简体中文', value: 'zh-CN' },
  { title: 'English', value: 'en-US' },
]

const dateFormatOptions = [
  { title: 'YYYY-MM-DD', value: 'YYYY-MM-DD' },
  { title: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
  { title: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
]

const timeFormatOptions = [
  { title: '24小时制', value: '24h' },
  { title: '12小时制', value: '12h' },
]

// 计算属性
const isVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

// 加载配置
const loadConfig = async () => {
  try {
    const config = await ConfigService.getConfig()
    statusConfig.value = { ...config.statusConfig }
    priorityConfig.value = { ...config.priorityConfig }
    fieldConfig.value = { ...config.fieldConfig }
    systemConfig.value = { ...config.systemConfig }
  } catch (error) {
    console.error('加载配置失败：', error)
  }
}

// 处理保存
const handleSave = async () => {
  isLoading.value = true
  try {
    const config = {
      statusConfig: statusConfig.value,
      priorityConfig: priorityConfig.value,
      fieldConfig: fieldConfig.value,
      systemConfig: systemConfig.value,
    }

    await ConfigService.saveConfig(config)
    emit('config-updated')
    isVisible.value = false
  } catch (error) {
    console.error('保存配置失败：', error)
  } finally {
    isLoading.value = false
  }
}

// 重置为默认配置
const resetToDefault = async () => {
  if (confirm('确定要重置为默认配置吗？这将清除所有自定义设置。')) {
    isLoading.value = true
    try {
      await ConfigService.resetToDefault()
      await loadConfig()
    } catch (error) {
      console.error('重置配置失败：', error)
    } finally {
      isLoading.value = false
    }
  }
}

// 处理关闭
const handleClose = () => {
  isVisible.value = false
}

// 加载数据统计
const loadDataStats = async () => {
  try {
    dataStats.value = await DataService.getDataStats()
  } catch (error) {
    console.error('加载数据统计失败：', error)
  }
}

// 获取数据键的显示名称
const getKeyDisplayName = (key) => {
  const keyNames = {
    'todo-categories': '待办分类',
    'todo-items': '待办事项',
    'app-config': '应用配置',
  }
  return keyNames[key] || key
}

// 处理数据导出
const handleExportData = async () => {
  isExporting.value = true
  try {
    const exportData = await DataService.exportAllData()
    DataService.downloadAsJSON(exportData)

    // 显示成功消息（这里可以使用Vuetify的snackbar或者其他通知组件）
    console.log('数据导出成功')
  } catch (error) {
    console.error('导出失败：', error)
    alert(`导出失败：${error.message}`)
  } finally {
    isExporting.value = false
  }
}

// 处理数据导入
const handleImportData = async () => {
  if (!selectedFile.value || !selectedFile.value.size) {
    alert('请选择要导入的文件')
    return
  }

  // 如果是覆盖模式，需要确认
  if (importMode.value === 'replace') {
    if (!confirm('确定要覆盖所有现有数据吗？此操作不可撤销！')) {
      return
    }
  }

  isImporting.value = true
  try {
    const file = selectedFile.value
    const importData = await DataService.readJSONFile(file)

    const options = {
      clearExisting: importMode.value === 'replace',
      mergeData: importMode.value === 'merge',
    }

    const result = await DataService.importData(importData, options)

    // 重新加载数据统计和配置
    await loadDataStats()
    await loadConfig()

    // 通知父组件配置已更新
    emit('config-updated')
    alert(result.message)

    // 清除选择的文件
    selectedFile.value = null
    window.location.reload()
  } catch (error) {
    console.error('导入失败：', error)
    alert(`导入失败：${error.message}`)
  } finally {
    isImporting.value = false
  }
}

// 监听弹窗显示状态，加载数据
watch(
  () => props.modelValue,
  async (visible) => {
    if (visible) {
      await loadConfig()
      await loadDataStats()
    }
  },
)

// 组件挂载时加载配置
onMounted(async () => {
  if (props.modelValue) {
    await loadConfig()
    await loadDataStats()
  }
})
</script>
