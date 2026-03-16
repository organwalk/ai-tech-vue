<template>
  <div class="quiz-manager">
    <div class="panel-header">
      <span class="header-title">本章节需要完成的试题</span>
      <button class="add-quiz-btn" @click="showDialog = true">
        + 添加试题
      </button>
    </div>
    
    <div class="quiz-list">
      <div v-if="isLoading" class="quiz-skeleton">
        <div v-for="i in 5" :key="i" class="skeleton-item">
          <div class="skeleton-icon"></div>
          <div class="skeleton-title"></div>
        </div>
      </div>
      <template v-else>
        <div v-if="isGenerating" class="quiz-item generating">
          <div class="quiz-info">
            <el-icon class="status-icon spin-icon"><Loading /></el-icon>
            <el-icon class="quiz-icon"><DocumentCopy /></el-icon>
            <span class="quiz-title">正在生成试题...</span>
          </div>
        </div>
        
        <div 
          v-for="quiz in quizList" 
          :key="quiz.id" 
          class="quiz-item"
          :class="{ 'task-hoverable': quiz.status !== 0 }"
          @click="handleQuizClick(quiz)"
        >
          <div class="quiz-info">
            <el-icon v-if="quiz.status === 0" class="quiz-icon loading-icon"><Loading /></el-icon>
            <el-icon v-else-if="quiz.status === 2" class="quiz-icon error-icon"><CircleClose /></el-icon>
            <el-icon v-else class="quiz-icon"><DocumentCopy /></el-icon>
            <span class="quiz-title">{{ quiz.title || '试题' }}</span>
          </div>
          <div class="quiz-actions" @click.stop>
            <el-button 
              v-if="quiz.status === 1" 
              text 
              class="action-btn"
              @click="handleRenameQuiz(quiz)"
            >
              重命名
            </el-button>
            <el-button 
              text 
              class="action-btn delete-btn-text"
              @click="handleDeleteQuiz(quiz.businessId)"
            >
              删除
            </el-button>
          </div>
        </div>
        
        <div v-if="quizList.length === 0 && !isGenerating" class="empty-tip">
          暂无试题，点击上方按钮添加
        </div>
      </template>
    </div>

    <ChapterQuizDialog
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

    <QuizPreviewDialog
      v-model="showPreviewDialog"
      :task="selectedQuiz"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { DocumentCopy, CircleClose, Loading } from '@element-plus/icons-vue'
import ChapterQuizDialog from '@/features/course-owner/components/dialogs/ChapterQuizDialog.vue'
import QuizPreviewDialog from '@/features/course-owner/components/dialogs/QuizPreviewDialog.vue'
import { getActiveTasks, updateTaskTitle, deleteQuiz } from '@/shared/api/index.js'
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

const quizList = ref([])
const showDialog = ref(false)
const isGenerating = ref(false)
const isLoading = ref(false)
const showRenameDialog = ref(false)
const showPreviewDialog = ref(false)
const currentQuiz = ref(null)
const newTitle = ref('')
const selectedQuiz = ref(null)
let pollingTimer = null

const getOwnerId = () => {
  const user = getUserInfo()
  if (user) {
    return user.id || user.userId || ''
  }
  return ''
}

const fetchQuizList = async () => {
  isLoading.value = true
  const ownerId = getOwnerId()
  try {
    const data = await getActiveTasks({
      windowId: props.windowId,
      chapterId: props.chapterId,
      type: 'QUIZ_GEN',
      ownerId
    })
    quizList.value = data.data || []
  } catch (error) {
    console.error('获取试题列表失败:', error)
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
        type: 'QUIZ_GEN',
        ownerId
      })
      
      const tasks = data.data || []
      const hasGenerating = tasks.some(task => task.taskType === 'QUIZ_GEN' && task.status === 0)
      
      if (!hasGenerating) {
        await fetchQuizList()
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

const handleQuizClick = (quiz) => {
  if (quiz.status === 1) {
    selectedQuiz.value = quiz
    showPreviewDialog.value = true
  }
}

const handleRenameQuiz = (quiz) => {
  currentQuiz.value = quiz
  newTitle.value = quiz.title || ''
  showRenameDialog.value = true
}

const handleRenameConfirm = async () => {
  if (!currentQuiz.value || !newTitle.value.trim()) return
  
  try {
    await updateTaskTitle(currentQuiz.value.id, newTitle.value)
    ElMessage.success('重命名成功')
    showRenameDialog.value = false
    fetchQuizList()
  } catch (error) {
    console.error('重命名任务失败:', error)
  }
}

const handleDeleteQuiz = async (quizId) => {
  try {
    await ElMessageBox.confirm('确定要删除该试题吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await deleteQuiz(quizId)
    ElMessage.success('删除成功')
    fetchQuizList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除试题失败:', error)
    }
  }
}

watch(() => props.chapterId, () => {
  if (props.chapterId) {
    fetchQuizList()
  }
}, { immediate: true })

onMounted(() => {
  fetchQuizList()
})

onUnmounted(() => {
  if (pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = null
  }
})
</script>

<style scoped>
.quiz-manager {
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
  font-weight: 500;
}

.add-quiz-btn {
  background-color: #333333;
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.add-quiz-btn:hover {
  background-color: #555555;
}

.quiz-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.quiz-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 8px;
  background-color: #F8F9FA;
  transition: all 0.3s ease;
}

.quiz-item.generating {
  background-color: #FFFFFF;
  border: 1px solid #E5E7EB;
}

.quiz-item.task-hoverable:hover {
  background-color: #F3F4F6;
  cursor: pointer;
}

.quiz-info {
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

.quiz-icon {
  font-size: 18px;
}

.loading-icon {
  animation: spin 1s linear infinite;
}

.error-icon {
  color: #F56C6C;
}

.quiz-title {
  font-size: 14px;
  color: #333333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.quiz-actions {
  display: flex;
  gap: 8px;
  margin-left: 8px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.quiz-item:hover .quiz-actions {
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

.quiz-skeleton {
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
