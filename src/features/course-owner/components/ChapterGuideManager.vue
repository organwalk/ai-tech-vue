<template>
  <div class="guide-manager">
    <div class="panel-header">
      <span class="header-title">本章节需要阅读的指南</span>
      <button class="add-guide-btn" @click="showDialog = true" :disabled="isGenerating">
        {{ isGenerating ? '生成中...' : '+ 生成指南' }}
      </button>
    </div>
    
    <div class="guide-list">
      <div v-if="isLoading" class="guide-skeleton">
        <div v-for="i in 5" :key="i" class="skeleton-item">
          <div class="skeleton-icon"></div>
          <div class="skeleton-title"></div>
        </div>
      </div>
      <template v-else>
        <div v-if="isGenerating" class="guide-item generating">
          <div class="guide-info">
            <el-icon class="status-icon spin-icon"><Loading /></el-icon>
            <el-icon class="guide-icon"><Reading /></el-icon>
            <span class="guide-title">正在生成指南...</span>
          </div>
        </div>
        
        <div 
          v-for="guide in guideList" 
          :key="guide.id" 
          class="guide-item"
          :class="{ 'task-hoverable': guide.status !== 0 }"
          @click="handleGuideClick(guide)"
        >
          <div class="guide-info">
            <el-icon v-if="guide.status === 0" class="guide-icon loading-icon"><Loading /></el-icon>
            <el-icon v-else-if="guide.status === 2" class="guide-icon error-icon"><CircleClose /></el-icon>
            <el-icon v-else class="guide-icon"><Reading /></el-icon>
            <span class="guide-title">{{ guide.title || '指南' }}</span>
          </div>
          <div class="guide-actions" @click.stop>
            <el-button 
              v-if="guide.status === 1" 
              text 
              class="action-btn"
              @click="handleRenameGuide(guide)"
            >
              重命名
            </el-button>
            <el-button 
              text 
              class="action-btn delete-btn-text"
              @click="handleDeleteGuide(guide.businessId)"
            >
              删除
            </el-button>
          </div>
        </div>
        
        <div v-if="guideList.length === 0 && !isGenerating" class="empty-tip">
          暂无学习指南，点击上方按钮生成
        </div>
      </template>
    </div>

    <ChapterGuideDialog
      v-model="showDialog"
      :window-id="windowId"
      :chapter-id="chapterId"
      @submitted="handleSubmitted"
    />

    <el-dialog
      v-model="showRenameDialog"
      :show-close="false"
      title="重命名"
      width="50%"
      style="overflow-y:auto;max-height: 90vh; border-radius: 15px; padding: 35px;"
    >
      <div class="rename-form">
        <el-input 
          v-model="newTitle" 
          placeholder="请输入新标题"
          maxlength="15"
          show-word-limit
          @keydown.enter="handleRenameConfirm"
        />
      </div>
      <template #footer>
        <button class="rename-confirm-btn" @click="handleRenameConfirm">确定</button>
      </template>
    </el-dialog>

    <GuidePreviewDialog
      v-model="showPreviewDialog"
      :guide-id="selectedGuideId"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Reading, CircleClose, Loading } from '@element-plus/icons-vue'
import ChapterGuideDialog from '@/features/course-owner/components/dialogs/ChapterGuideDialog.vue'
import GuidePreviewDialog from '@/features/course-owner/components/dialogs/GuidePreviewDialog.vue'
import { getActiveTasks, updateTaskTitle, deleteGuide } from '@/shared/api/index.js'
import { getUserInfo } from '@/shared/api/utils/helpers.js'

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
const showDialog = ref(false)
const isGenerating = ref(false)
const isLoading = ref(false)
const showRenameDialog = ref(false)
const showPreviewDialog = ref(false)
const currentGuide = ref(null)
const newTitle = ref('')
const selectedGuideId = ref(null)
let pollingTimer = null

const getOwnerId = () => {
  const user = getUserInfo()
  if (user) {
    return user.id || user.userId || ''
  }
  return ''
}

const fetchGuideList = async () => {
  isLoading.value = true
  const ownerId = getOwnerId()
  try {
    const data = await getActiveTasks({
      windowId: props.windowId,
      chapterId: props.chapterId,
      type: 'GUIDE_GEN',
      ownerId
    })
    guideList.value = data.data || []
  } catch (error) {
    console.error('获取指南列表失败:', error)
  } finally {
    isLoading.value = false
  }
}

const startPolling = () => {
  if (pollingTimer) return
  
  isGenerating.value = true
  const ownerId = getOwnerId()
  
  pollingTimer = setInterval(async () => {
    try {
      const data = await getActiveTasks({
        windowId: props.windowId,
        chapterId: props.chapterId,
        type: 'GUIDE_GEN',
        ownerId
      })
      
      const tasks = data.data || []
      const hasGenerating = tasks.some(task => task.taskType === 'GUIDE_GEN' && task.status === 0)
      
      if (!hasGenerating) {
        await fetchGuideList()
        isGenerating.value = false
        if (pollingTimer) {
          clearInterval(pollingTimer)
          pollingTimer = null
        }
      }
    } catch (error) {
      console.error('轮询任务失败:', error)
    }
  }, 3000)
}

const handleSubmitted = () => {
  startPolling()
}

const handleGuideClick = (guide) => {
  if (guide.status === 1) {
    selectedGuideId.value = guide.businessId
    showPreviewDialog.value = true
  }
}

const handleRenameGuide = (guide) => {
  currentGuide.value = guide
  newTitle.value = guide.title || ''
  showRenameDialog.value = true
}

const handleRenameConfirm = async () => {
  if (!currentGuide.value || !newTitle.value.trim()) return
  
  try {
    await updateTaskTitle(currentGuide.value.id, newTitle.value)
    ElMessage.success('重命名成功')
    showRenameDialog.value = false
    fetchGuideList()
  } catch (error) {
    console.error('重命名任务失败:', error)
  }
}

const handleDeleteGuide = async (guideId) => {
  try {
    await ElMessageBox.confirm('确定要删除该指南吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await deleteGuide(guideId)
    ElMessage.success('删除成功')
    fetchGuideList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除指南失败:', error)
    }
  }
}

watch(() => props.chapterId, () => {
  if (props.chapterId) {
    fetchGuideList()
  }
}, { immediate: true })

onMounted(() => {
  fetchGuideList()
})

onUnmounted(() => {
  if (pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = null
  }
})
</script>

<style scoped>
.guide-manager {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.panel-header {
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #F3F4F6;
}

.header-title {
  margin-left: 15px;
  font-size: 14px;
  color: #333333;
}

.add-guide-btn {
  background-color: #333333;
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.add-guide-btn:hover:not(:disabled) {
  background-color: #555555;
}

.add-guide-btn:disabled {
  background-color: #9CA3AF;
  cursor: not-allowed;
}

.guide-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.guide-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 8px;
  background-color: #F8F9FA;
  transition: all 0.3s ease;
}

.guide-item.generating {
  background-color: #FFFFFF;
  border: 1px solid #E5E7EB;
}

.guide-item.task-hoverable:hover {
  background-color: #F3F4F6;
  cursor: pointer;
}

.guide-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.status-icon {
  font-size: 14px;
}

.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.guide-icon {
  font-size: 18px;
}

.loading-icon {
  animation: spin 1s linear infinite;
}

.error-icon {
  color: #F56C6C;
}

.guide-title {
  font-size: 14px;
  color: #333333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.guide-actions {
  display: flex;
  gap: 8px;
  margin-left: 8px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.guide-item:hover .guide-actions {
  opacity: 1;
}

.action-btn {
  cursor: pointer;
  font-size: 12px;
}

.delete-btn-text {
  color: #F56C6C;
}

.delete-btn-text:hover {
  color: #F56C6C;
}

.rename-form {
  padding: 10px 0;
}

.rename-confirm-btn {
  padding: 8px 24px;
  background-color: #333333;
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}

.rename-confirm-btn:hover {
  background-color: #555555;
}

.empty-tip {
  text-align: center;
  color: #9CA3AF;
  font-size: 14px;
  padding: 40px 20px;
}

.guide-skeleton {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-radius: 8px;
  background-color: #F8F9FA;
}

.skeleton-icon {
  width: 18px;
  height: 18px;
  background: linear-gradient(90deg, #E5E7EB 25%, #F3F4F6 50%, #E5E7EB 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 4px;
}

.skeleton-title {
  flex: 1;
  height: 16px;
  background: linear-gradient(90deg, #E5E7EB 25%, #F3F4F6 50%, #E5E7EB 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 4px;
}

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
