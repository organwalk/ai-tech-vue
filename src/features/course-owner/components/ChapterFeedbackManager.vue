<template>
  <div class="feedback-manager">
    <div class="panel-header">
      <span class="header-title">本章节所收集的反馈如下</span>
    </div>
    
    <div v-if="isLoading" class="feedback-list">
      <div v-for="i in 3" :key="i" class="feedback-card skeleton">
        <div class="skeleton-title"></div>
        <div class="skeleton-content"></div>
        <div class="skeleton-footer"></div>
      </div>
    </div>
    
    <div v-else class="feedback-list">
      <div 
        v-for="feedback in feedbackList" 
        :key="feedback.id" 
        class="feedback-card"
      >
        <div class="feedback-header">
          <span class="feedback-title">{{ feedback.title }}</span>
        </div>
        <div class="feedback-body">
          <p class="feedback-content">{{ feedback.content }}</p>
        </div>
        <div class="feedback-footer">
          <span class="feedback-user">{{ feedback.nickName }}</span>
          <span class="feedback-time">{{ formatTime(feedback.createTime) }}</span>
        </div>
      </div>
      
      <div v-if="feedbackList.length === 0" class="empty-tip">
        当前章节暂无成员反馈
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { getFeedbackList } from '@/shared/api/index.js'

const props = defineProps({
  windowId: {
    type: String,
    required: true
  },
  chapterId: {
    type: [String, Number],
    required: true
  }
})

const feedbackList = ref([])
const isLoading = ref(false)

const fetchFeedbackList = async () => {
  if (!props.chapterId) return
  
  isLoading.value = true
  try {
    const res = await getFeedbackList({
      windowId: props.windowId,
      chapterId: props.chapterId
    })
    feedbackList.value = res.data || []
  } catch (error) {
    console.error('获取反馈列表失败:', error)
    feedbackList.value = []
  } finally {
    isLoading.value = false
  }
}

const formatTime = (timeStr) => {
  if (!timeStr) return ''
  
  const now = new Date()
  const time = new Date(timeStr)
  const diffMs = now - time
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffMins < 1) {
    return '刚刚'
  } else if (diffMins < 60) {
    return `${diffMins}分钟前`
  } else if (diffHours < 24) {
    return `${diffHours}小时前`
  } else {
    return `${diffDays}天前`
  }
}

watch(() => props.chapterId, () => {
  if (props.chapterId) {
    fetchFeedbackList()
  }
}, { immediate: true })

onMounted(() => {
  fetchFeedbackList()
})
</script>

<style scoped>
.feedback-manager {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.panel-header {
  padding: 16px 24px;
  border-bottom: 1px solid #F3F4F6;
}

.header-title {
  font-size: 14px;
  color: #333333;
  margin-left: 15px;
}

.feedback-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feedback-card {
  background-color: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: 16px;
  transition: background-color 0.2s ease;
}

.feedback-card:hover {
  background-color: #F9FAFB;
}

.feedback-card.skeleton {
  background-color: #F8F9FA;
}

.skeleton-title {
  height: 18px;
  width: 60%;
  background: linear-gradient(90deg, #E5E7EB 25%, #F3F4F6 50%, #E5E7EB 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 4px;
  margin-bottom: 12px;
}

.skeleton-content {
  height: 40px;
  width: 100%;
  background: linear-gradient(90deg, #E5E7EB 25%, #F3F4F6 50%, #E5E7EB 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 4px;
  margin-bottom: 12px;
}

.skeleton-footer {
  height: 14px;
  width: 40%;
  background: linear-gradient(90deg, #E5E7EB 25%, #F3F4F6 50%, #E5E7EB 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 4px;
}

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.feedback-header {
  margin-bottom: 8px;
}

.feedback-title {
  font-size: 15px;
  font-weight: 600;
  color: #333333;
}

.feedback-body {
  margin-top: 8px;
}

.feedback-content {
  font-size: 14px;
  color: #646A73;
  line-height: 1.6;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.feedback-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  font-size: 12px;
  color: #9CA3AF;
}

.feedback-user {
  color: #9CA3AF;
}

.feedback-time {
  color: #9CA3AF;
}

.empty-tip {
  text-align: center;
  color: #9CA3AF;
  font-size: 14px;
  padding: 40px 20px;
}
</style>
