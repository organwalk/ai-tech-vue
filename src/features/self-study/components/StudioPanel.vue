<template>
  <div class="studio-panel">
    <div class="panel-header">
      <h2 class="panel-title">Studio</h2>
    </div>
    
    <div class="studio-actions">
      <div class="action-grid">
        <div 
          class="action-card quiz-card" 
          :class="{ 'is-disabled': isDisabled }"
          @click="handleCardClick('quiz')"
        >
          <el-icon class="action-icon"><DocumentCopy /></el-icon>
          <span class="action-text">测验生成</span>
        </div>
        <div 
          class="action-card guide-card" 
          :class="{ 'is-disabled': isDisabled }"
          @click="handleCardClick('guide')"
        >
          <el-icon class="action-icon"><Reading /></el-icon>
          <span class="action-text">学习指南</span>
        </div>
        <div 
          class="action-card diagnosis-card" 
          :class="{ 'is-disabled': isDisabled }"
          @click="handleCardClick('diagnosis')"
        >
          <el-icon class="action-icon"><DataAnalysis /></el-icon>
          <span class="action-text">学情诊断</span>
        </div>
      </div>
    </div>
    
    <div class="tasks-section">
      <div class="tasks-list">
        <div 
          v-for="task in notificationTasks" 
          :key="task.id" 
          class="task-card"
          :class="{ 'task-hoverable': task.status !== 0 }"
          @click="handleTaskClick(task)"
        >
          <div class="task-icon">
            <div v-if="task.status === 0" class="loading-wrapper">
              <span class="loading-dot"></span>
            </div>
            <template v-else-if="task.status === 1">
              <el-icon v-if="task.taskType === 'QUIZ_GEN'" class="task-quiz-icon"><DocumentCopy /></el-icon>
              <el-icon v-else-if="task.taskType === 'GUIDE_GEN'" class="task-guide-icon"><Reading /></el-icon>
              <el-icon v-else-if="task.taskType === 'DIAGNOSIS_GEN'" class="task-diagnosis-icon"><DataAnalysis /></el-icon>
              <el-icon v-else class="task-doc-icon"><Paperclip /></el-icon>
            </template>
            <el-icon v-else-if="task.status === 2" class="task-error-icon"><CircleClose /></el-icon>
            <el-icon v-else class="task-doc-icon"><Paperclip /></el-icon>
          </div>
          <div class="task-content">
            <div class="task-title">
              {{ task.status === 0 ? '正在生成' + (task.title || '任务') + '...' : (task.title || '异步任务') }}
            </div>
            <div class="task-time">{{ formatRelativeTime(task.createTime) }}</div>
          </div>
          <div v-if="task.status === 1" class="task-actions" @click.stop>
            <el-button text class="task-action-btn" @click="openRenameDialog(task)">重命名</el-button>
            <el-button text style="color:#F56C6C" class="task-action-btn" @click="handleDeleteTask(task)">删除</el-button>
          </div>
          <div v-else-if="task.status === 2" class="task-actions" @click.stop>
            <el-button text style="color:#F56C6C" class="task-action-btn" @click="handleDeleteTask(task)">删除</el-button>
          </div>
        </div>
        <div v-if="notificationTasks.length === 0" class="empty-tasks">
          暂无记录
        </div>
      </div>
    </div>

    <QuizGenerateDialog 
      v-model="showQuizDialog" 
      :window-id="windowId" 
      :selected-file-ids="selectedFileIds"
      @submitted="handleTaskSubmitted"
    />

    <GuideGenerateDialog 
      v-model="showGuideDialog" 
      :window-id="windowId" 
      :selected-file-ids="selectedFileIds"
      @submitted="handleTaskSubmitted"
    />

    <TaskDetailDialog 
      v-model="showTaskDetailDialog" 
      :task="selectedTask"
      :window-id="windowId"
      @submitted="handleTaskSubmitted"
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
          @keydown.enter="handleRenameTask"
        />
      </div>
      <template #footer>
        <button class="rename-confirm-btn" @click="handleRenameTask">确定</button>
      </template>
    </el-dialog>

    <DeleteConfirmDialog
      v-model="deleteDialogVisible"
      :message="deleteMessage"
      @confirm="handleConfirmDelete"
    />
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Paperclip, Reading, DataAnalysis, DocumentCopy, CircleClose } from '@element-plus/icons-vue'
import QuizGenerateDialog from '@/features/self-study/components/dialogs/QuizGenerateDialog.vue'
import GuideGenerateDialog from '@/features/self-study/components/dialogs/GuideGenerateDialog.vue'
import TaskDetailDialog from '@/features/self-study/components/dialogs/TaskDetailDialog.vue'
import DeleteConfirmDialog from '@/shared/components/dialogs/DeleteConfirmDialog.vue'
import {
  deleteDiagnosis,
  deleteGuide,
  deleteLearnerAnalyze,
  deleteQuiz,
  deleteQuizAnalysis,
  startDiagnosis,
  updateTaskTitle
} from '@/shared/api/index.js'

const props = defineProps({
  notificationTasks: {
    type: Array,
    default: () => []
  },
  windowId: {
    type: String,
    required: true
  },
  selectedFileIds: {
    type: Array,
    default: () => []
  }
})

const showQuizDialog = ref(false)
const showGuideDialog = ref(false)
const showTaskDetailDialog = ref(false)
const selectedTask = ref(null)
const showRenameDialog = ref(false)
const newTitle = ref('')
const currentTask = ref(null)
const deleteDialogVisible = ref(false)
const deleteMessage = ref('确定要删除该任务吗？')
const deleteTargetId = ref(null)

const isDisabled = computed(() => {
  return !props.selectedFileIds || props.selectedFileIds.length === 0
})

const handleCardClick = (type) => {
  if (isDisabled.value) {
    ElMessage.warning('请先选择文档')
    return
  }
  if (type === 'quiz') {
    showQuizDialog.value = true
  } else if (type === 'guide') {
    showGuideDialog.value = true
  } else if (type === 'diagnosis') {
    handleGenerateDiagnosis()
  }
}

const emit = defineEmits(['start-polling', 'refresh-tasks'])

const formatRelativeTime = (timeStr) => {
  if (!timeStr) return ''

  const now = new Date()
  const time = new Date(timeStr)
  const diffMs = now - time
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) {
    return '刚刚'
  }
  if (diffMins < 60) {
    return diffMins + '分钟前'
  }
  if (diffHours < 24) {
    return diffHours + '小时前'
  }
  return diffDays + '天前'
}

const handleTaskClick = (task) => {
  if (task.status !== 1) return

  if (task.taskType === 'QUIZ_GEN' || task.taskType === 'GUIDE_GEN' || task.taskType === 'QUIZ_ANALYSIS' || task.taskType === 'DIAGNOSIS_GEN') {
    selectedTask.value = task
    showTaskDetailDialog.value = true
  }
}

const handleTaskSubmitted = () => {
  emit('start-polling')
}

const handleGenerateDiagnosis = async () => {
  try {
    await startDiagnosis(props.windowId)
    ElMessage.success('学情诊断任务已提交')
    emit('start-polling')
  } catch (error) {
    console.error('生成学情诊断失败:', error)
    ElMessage.error('生成学情诊断失败')
  }
}

const openRenameDialog = (task) => {
  currentTask.value = task
  newTitle.value = task.title || ''
  showRenameDialog.value = true
}

const handleRenameTask = async () => {
  if (!currentTask.value || !newTitle.value.trim()) return

  try {
    await updateTaskTitle(currentTask.value.id, newTitle.value)
    ElMessage.success('重命名成功')
    showRenameDialog.value = false
    emit('refresh-tasks')
  } catch (error) {
    console.error('重命名任务失败:', error)
    ElMessage.error('重命名失败')
  }
}

const handleDeleteTask = (task) => {
  deleteTargetId.value = task
  deleteDialogVisible.value = true
}

const handleConfirmDelete = async () => {
  const task = deleteTargetId.value
  if (!task) return
  
  let deleteAction = null

  switch (task.taskType) {
    case 'QUIZ_GEN':
      deleteAction = () => deleteQuiz(task.businessId)
      break
    case 'QUIZ_ANALYSIS':
      deleteAction = () => deleteQuizAnalysis(task.businessId)
      break
    case 'GUIDE_GEN':
      deleteAction = () => deleteGuide(task.businessId)
      break
    case 'DIAGNOSIS_GEN':
      deleteAction = () => deleteDiagnosis(task.businessId)
      break
    case 'LEARNER_ANALYZE':
      deleteAction = () => deleteLearnerAnalyze(task.businessId)
      break
    default:
      ElMessage.error('未知的任务类型')
      return
  }

  try {
    await deleteAction()
    ElMessage.success('删除成功')
    emit('refresh-tasks')
  } catch (error) {
    console.error('删除任务失败:', error)
    ElMessage.error('删除失败')
  } finally {
    deleteTargetId.value = null
  }
}
</script>

<style scoped>
.studio-panel {
  background-color: #FFFFFF;
  border-radius: 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.panel-header {
  padding: 16px 24px;
  border-bottom: 1px solid #F3F4F6;
}

.panel-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333333;
}

.studio-actions {
  padding: 16px;
  border-bottom: 1px solid #F3F4F6;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.action-card {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-card:hover {
  opacity: 0.8;
  transform: translateY(-1px);
}

.action-card.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.action-card.is-disabled:hover {
  opacity: 0.5;
  transform: none;
}

.action-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.quiz-card {
  background-color: #DEF1F7;
}

.quiz-card .action-icon {
  color: #1890FF;
}

.guide-card {
  background-color: #F2F2E8;
}

.guide-card .action-icon {
  color: #E6A23C;
}

.diagnosis-card {
  background-color: #E1F1E5;
}

.diagnosis-card .action-icon {
  color: #67C23A;
}

.action-text {
  font-size: 14px;
  font-weight: 500;
  color: #333333;
}

.tasks-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 16px;
}

.tasks-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.task-hoverable:hover {
  background-color: #F3F4F6;
}

.task-icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-wrapper {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-dot {
  width: 8px;
  height: 8px;
  background-color: #333333;
  border-radius: 50%;
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.4; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1); }
}

.task-quiz-icon {
  color: #1890FF;
  font-size: 20px;
}

.task-guide-icon {
  color: #E6A23C;
  font-size: 20px;
}

.task-diagnosis-icon {
  color: #67C23A;
  font-size: 20px;
}

.task-error-icon {
  color: #F56C6C;
  font-size: 20px;
}

.task-doc-icon {
  color: #909399;
  font-size: 20px;
}

.task-content {
  flex: 1;
  min-width: 0;
}

.task-title {
  font-size: 14px;
  font-weight: 500;
  color: #333333;
  line-height: 1.4;
  word-break: break-word;
}

.task-time {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.empty-tasks {
  text-align: center;
  color: #9CA3AF;
  font-size: 14px;
  padding: 20px;
}

.task-actions {
  display: flex;
  gap: 12px;
  margin-left: 8px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.task-card:hover .task-actions {
  opacity: 1;
}

.task-action-btn {
  cursor: pointer;
  width: 20px;
  font-size: 12px;
}

.rename-form {
  padding: 10px 0;
}

.rename-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  font-size: 14px;
  color: #333333;
}

.rename-input:focus {
  outline: none;
  border-color: #333333;
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
</style>
