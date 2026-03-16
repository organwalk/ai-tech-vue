<template>
  <div class="guides-tab">
    <div class="guides-list">
      <div v-if="isLoading" class="loading-tip">加载中...</div>
      <template v-else>
        <div 
          v-for="guide in guideList" 
          :key="guide.id" 
          class="guide-item"
          @click="handlePreview(guide)"
        >
          <div class="guide-info">
            <el-icon class="guide-icon"><Reading /></el-icon>
            <span class="guide-title">{{ guide.title || '指南' }}</span>
          </div>
        </div>
        <div v-if="guideList.length === 0" class="empty-tip">
          暂无学习指南
        </div>
      </template>
    </div>

    <el-dialog
      v-model="previewVisible"
      :show-close="false"
      width="50%"
      top="5vh"
      class="preview-dialog"
      style="overflow-y:auto;max-height: 90vh; border-radius: 16px; padding: 35px;"
    >
      <template #header>
        <div class="dialog-header">
          <span class="dialog-title">{{ selectedGuide?.title || '学习指南' }}</span>
        </div>
      </template>
      <div v-if="isContentLoading" class="loading-content">
        加载中...
      </div>
      <div v-else class="guide-content">
        <MarkdownContent :content="guideContent" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { Reading } from '@element-plus/icons-vue'
import MarkdownContent from '@/shared/components/content/MarkdownContent.vue'
import { getWindowDetail, getActiveTasks, getGuideDetail } from '@/shared/api/index.js'

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

const guideList = ref([])
const isLoading = ref(true)
const previewVisible = ref(false)
const selectedGuide = ref(null)
const guideContent = ref('')
const isContentLoading = ref(false)
const ownerId = ref('')

const fetchOwnerId = async () => {
  try {
    const res = await getWindowDetail(props.windowId)
    if (res.data) {
      ownerId.value = res.data.creatorId || ''
    }
  } catch (error) {
    console.error('获取窗口详情失败:', error)
  }
}

const fetchGuideList = async () => {
  if (!ownerId.value) return
  isLoading.value = true
  try {
    const res = await getActiveTasks({
      windowId: props.windowId,
      chapterId: props.chapterId,
      type: 'GUIDE_GEN',
      ownerId: ownerId.value
    })
    guideList.value = res.data || []
  } catch (error) {
    console.error('获取指南列表失败:', error)
  } finally {
    isLoading.value = false
  }
}

const handlePreview = async (guide) => {
  selectedGuide.value = guide
  previewVisible.value = true
  isContentLoading.value = true
  
  try {
    const res = await getGuideDetail(guide.businessId)
    guideContent.value = res.data?.content || ''
  } catch (error) {
    console.error('获取指南详情失败:', error)
  } finally {
    isContentLoading.value = false
  }
}

watch(() => props.chapterId, () => {
  if (props.chapterId) {
    fetchGuideList()
  }
}, { immediate: true })

onMounted(async () => {
  await fetchOwnerId()
  if (ownerId.value) {
    fetchGuideList()
  }
})
</script>

<style scoped>
.guides-tab {
  padding: 16px;
  height: 100%;
}

.guides-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.guide-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background-color: #FFFFFF;
  border-radius: 12px;
  border: 1px solid #E5E7EB;
  cursor: pointer;
  transition: all 0.2s ease;
}

.guide-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border-color: #333333;
}

.guide-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.guide-icon {
  font-size: 20px;
}

.guide-title {
  font-size: 14px;
  color: #333333;
}

.loading-tip,
.empty-tip {
  text-align: center;
  color: #9CA3AF;
  font-size: 14px;
  padding: 40px;
}

.preview-dialog :deep(.el-dialog) {
  border-radius: 16px;
}

.preview-dialog :deep(.el-dialog__header) {
  padding: 20px 24px;
  border-bottom: 1px solid #F3F4F6;
}

.preview-dialog :deep(.el-dialog__body) {
  padding: 24px;
  min-height: 200px;
  max-height: calc(90vh - 140px);
  overflow-y: auto;
}

.dialog-header {
  display: flex;
  align-items: center;
}

.dialog-title {
  font-size: 18px;
  font-weight: 600;
  color: #333333;
}

.loading-content {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: #9CA3AF;
}

.guide-content {
  min-height: 200px;
}
</style>
