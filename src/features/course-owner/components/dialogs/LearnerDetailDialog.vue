<template>
  <el-dialog
    v-model="dialogVisible"
    :show-close="false"
    width="70%"
    top="5vh"
    style="overflow-y: auto; max-height: 90vh; border-radius: 15px; padding: 35px;"
    class="learner-dialog"
    :append-to-body="true"
  >
    <div v-if="isLoading" class="loading-container">
      <div class="loading-content">加载中...</div>
    </div>

    <div v-else-if="sortedHistory.length === 0" class="empty-container">
      <div class="learner-info">
        <div class="learner-avatar">
          <img v-if="memberInfo.avatar" :src="memberInfo.avatar" alt="avatar" />
          <span v-else class="avatar-text">{{ getAvatarText(memberInfo.nickname) }}</span>
        </div>
        <div class="learner-details">
          <div class="learner-name">{{ memberInfo.nickname || '学员' }}</div>
          <div class="learner-email">{{ memberInfo.email || '-' }}</div>
        </div>
      </div>
      <div class="empty-text">暂无学习记录</div>
    </div>

    <div v-else class="dialog-content">
      <div class="info-section">
        <div class="learner-info">
          <div class="learner-avatar">
            <img v-if="memberInfo.avatar" :src="memberInfo.avatar" alt="avatar" />
            <span v-else class="avatar-text">{{ getAvatarText(memberInfo.nickname) }}</span>
          </div>
          <div class="learner-details">
            <div class="learner-name">{{ memberInfo.nickname || '学员' }}</div>
            <div class="learner-email">{{ memberInfo.email || '-' }}</div>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">{{ stats.avgScore }}</div>
            <div class="stat-label">平均成绩</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ stats.peakScore }}</div>
            <div class="stat-label">最高成绩</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ stats.weaknessFixes }}</div>
            <div class="stat-label">弱项修复</div>
          </div>
          <div class="stat-card stat-card-highlight">
            <div class="stat-value">{{ stats.recentProgress }}</div>
            <div class="stat-label">近期进步</div>
          </div>
        </div>
      </div>

      <div class="chart-section">
        <div ref="chartRef" class="chart-container"></div>
        <div class="chart-hint">按时间展示历史测验成绩</div>
      </div>

      <div class="timeline-section">
        <div class="timeline-title">测试记录</div>
        <div class="timeline-list">
          <div
            v-for="(record, index) in sortedHistory"
            :key="index"
            class="timeline-item"
          >
            <div class="timeline-dot"></div>
            <div class="timeline-content">
              <div v-if="record.chapter_title" class="record-chapter">章节：{{ record.chapter_title }}</div>
              <div class="timeline-header">
                <span class="timeline-name">{{ record.quiz_title }}</span>
                <span class="timeline-score">{{ record.score }}分</span>
              </div>
              <div class="timeline-time">{{ formatTime(record.create_time) }}</div>
            </div>
          </div>
          <div v-if="sortedHistory.length === 0" class="timeline-empty">
            暂无测试记录
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { graphic, init, use } from 'echarts/core'
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'
import { getLearnerDetail } from '@/shared/api/index.js'

use([LineChart, GridComponent, TooltipComponent, CanvasRenderer])

const props = defineProps({
  visible: { type: Boolean, default: false },
  memberInfo: {
    type: Object,
    default: () => ({ nickname: '', email: '', avatar: '' })
  },
  windowId: { type: String, required: true }
})

const emit = defineEmits(['update:visible'])

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

const isLoading = ref(true)
const chartRef = ref(null)
const historyData = ref([])
const sortedHistory = ref([])
const stats = ref({
  avgScore: 0,
  peakScore: 0,
  weaknessFixes: 0,
  recentProgress: 0
})

let chartInstance = null

const getAvatarText = (nickname) => {
  if (!nickname) {
    return '?'
  }
  return nickname.charAt(0).toUpperCase()
}

const formatTime = (time) => {
  if (!time) {
    return '-'
  }
  return dayjs(time).format('MM-DD HH:mm')
}

const destroyChart = () => {
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
}

const processData = () => {
  const sorted = [...historyData.value].sort((a, b) => {
    return dayjs(a.create_time).valueOf() - dayjs(b.create_time).valueOf()
  })

  sortedHistory.value = sorted

  if (sorted.length === 0) {
    stats.value = {
      avgScore: 0,
      peakScore: 0,
      weaknessFixes: 0,
      recentProgress: 0
    }
    destroyChart()
    return
  }

  const scores = sorted.map(item => item.score || 0)
  const avg = scores.reduce((sum, score) => sum + score, 0) / scores.length
  const weaknessFixes = sorted.filter(item => (item.quiz_title || '').includes('【弱项增强】') && (item.score || 0) >= 60).length

  let recentProgress = 0
  if (sorted.length >= 2) {
    const diff = (sorted[sorted.length - 1].score || 0) - (sorted[0].score || 0)
    recentProgress = diff > 0 ? `+${diff}` : diff
  }

  stats.value = {
    avgScore: avg.toFixed(1),
    peakScore: Math.max(...scores),
    weaknessFixes,
    recentProgress
  }

  nextTick(() => {
    initChart()
  })
}

const fetchLearnerDetailData = async () => {
  const userId = props.memberInfo.userId || props.memberInfo.id
  if (!userId) {
    historyData.value = []
    sortedHistory.value = []
    isLoading.value = false
    destroyChart()
    return
  }

  isLoading.value = true
  try {
    const response = await getLearnerDetail({
      windowId: props.windowId,
      userId
    })
    historyData.value = response.data?.history || []
    processData()
  } catch (error) {
    console.error('获取学员详情失败:', error)
    ElMessage.error('获取学员详情失败')
  } finally {
    isLoading.value = false
  }
}

const initChart = () => {
  if (!chartRef.value || sortedHistory.value.length === 0) {
    return
  }

  destroyChart()
  chartInstance = init(chartRef.value)

  const option = {
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#ffffff',
      borderWidth: 0,
      padding: 0,
      extraCssText: 'box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12); border-radius: 12px;',
      formatter: (params) => {
        const item = params[0]
        const record = sortedHistory.value[item.dataIndex]
        return `
          <div style="padding: 12px 16px; min-width: 160px;">
            <div style="font-size: 14px; font-weight: 600; color: #333333; margin-bottom: 8px;">
              ${record?.quiz_title || '-'}
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-size: 12px; color: #6b7280;">成绩</span>
              <span style="font-size: 18px; font-weight: 700; color: #333333;">${record?.score || 0}分</span>
            </div>
            <div style="font-size: 11px; color: #9ca3af;">
              ${record?.create_time ? dayjs(record.create_time).format('MM-DD HH:mm') : '-'}
            </div>
          </div>
        `
      }
    },
    xAxis: {
      type: 'category',
      data: sortedHistory.value.map(item => dayjs(item.create_time).format('MM-DD HH:mm')),
      boundaryGap: false,
      axisLine: {
        lineStyle: { color: '#e5e7eb' }
      },
      axisTick: { show: false },
      axisLabel: {
        color: '#9ca3af',
        fontSize: 11,
        formatter: (value) => value.split(' ')[0]
      }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      splitLine: {
        lineStyle: {
          type: 'dashed',
          color: '#f3f4f6'
        }
      },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: '#9ca3af',
        fontSize: 11
      }
    },
    series: [{
      data: sortedHistory.value.map(item => item.score || 0),
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      showSymbol: false,
      lineStyle: {
        color: '#333333',
        width: 3
      },
      itemStyle: {
        color: '#333333',
        borderColor: '#ffffff',
        borderWidth: 2
      },
      emphasis: {
        showSymbol: true,
        itemStyle: {
          color: '#333333',
          borderColor: '#ffffff',
          borderWidth: 2,
          shadowBlur: 8,
          shadowColor: 'rgba(0, 0, 0, 0.15)'
        }
      },
      areaStyle: {
        color: new graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(51, 51, 51, 0.08)' },
          { offset: 1, color: 'rgba(51, 51, 51, 0)' }
        ])
      }
    }]
  }

  chartInstance.setOption(option)
}

const handleResize = () => {
  if (chartInstance) {
    chartInstance.resize()
  }
}

watch(() => props.visible, (val) => {
  if (val) {
    fetchLearnerDetailData()
  } else {
    destroyChart()
  }
})

watch(() => props.memberInfo, () => {
  if (props.visible) {
    fetchLearnerDetailData()
  }
}, { deep: true })

onMounted(() => {
  if (props.visible) {
    fetchLearnerDetailData()
  }
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  destroyChart()
})
</script>

<style scoped>
:deep(.el-dialog) {
  border-radius: 20px;
}

:deep(.el-dialog__header) {
  display: none;
}

:deep(.el-dialog__body) {
  padding: 24px;
  max-height: 80vh;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

:deep(.el-dialog__body)::-webkit-scrollbar {
  display: none;
}

.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.loading-content {
  color: #9ca3af;
  font-size: 14px;
}

.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 16px;
}

.empty-text {
  color: #9ca3af;
  font-size: 14px;
}

.dialog-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.learner-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.learner-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  overflow: hidden;
  background-color: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.learner-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-text {
  font-size: 22px;
  font-weight: 600;
  color: #333333;
  text-transform: uppercase;
}

.learner-details {
  flex: 1;
}

.learner-name {
  font-size: 18px;
  font-weight: 600;
  color: #333333;
  margin-bottom: 4px;
}

.learner-email {
  font-size: 13px;
  color: #9ca3af;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  background-color: #f9fafb;
  border-radius: 16px;
  padding: 16px;
  text-align: center;
}

.stat-card-highlight {
  background-color: #333333;
  color: #ffffff;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #333333;
  margin-bottom: 4px;
}

.stat-card-highlight .stat-value {
  color: #ffffff;
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
}

.stat-card-highlight .stat-label {
  color: #9ca3af;
}

.chart-section {
  background-color: #ffffff;
  border-radius: 16px;
  padding: 16px;
}

.chart-container {
  width: 100%;
  height: 280px;
}

.chart-hint {
  font-size: 12px;
  color: #9ca3af;
  text-align: center;
  margin-top: 8px;
}

.timeline-section {
  background-color: #f9fafb;
  border-radius: 16px;
  padding: 16px;
  max-height: 240px;
  overflow-y: auto;
}

.timeline-title {
  font-size: 14px;
  font-weight: 600;
  color: #333333;
  margin-bottom: 16px;
}

.timeline-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.timeline-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  position: relative;
}

.timeline-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #333333;
  flex-shrink: 0;
  margin-top: 6px;
}

.timeline-content {
  flex: 1;
}

.record-chapter {
  font-size: 12px;
  color: #9ca3af;
  margin-bottom: 4px;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.timeline-name {
  font-size: 14px;
  font-weight: 500;
  color: #333333;
}

.timeline-score {
  font-size: 14px;
  font-weight: 600;
  color: #333333;
}

.timeline-time {
  font-size: 12px;
  color: #9ca3af;
}

.timeline-empty {
  text-align: center;
  color: #9ca3af;
  font-size: 14px;
  padding: 20px;
}
</style>
