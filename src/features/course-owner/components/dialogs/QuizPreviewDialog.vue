<template>
  <el-dialog
    v-model="dialogVisible"
    :show-close="false"
    width="50%"
    top="5vh"
    style="overflow-y:auto;max-height: 90vh; border-radius: 15px; padding: 35px;"
    class="quiz-preview-dialog"
  >
    <template #header>
      <div class="dialog-header">
        <span class="dialog-title">预览试题</span>
      </div>
    </template>
    
    <div v-if="isLoading" class="loading-content">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>加载中...</span>
    </div>

    <div v-else-if="quizData" class="quiz-content">
      <div class="progress-section">
        <div class="progress-bar">
          <div 
            v-for="(item, index) in quizData.questions" 
            :key="index"
            class="progress-item"
            :class="{ current: index === currentIndex }"
          ></div>
        </div>
        <div class="progress-text">{{ currentIndex + 1 }} / {{ quizData.questions.length }}</div>
      </div>

      <div class="question-section">
        <div class="question-text">{{ currentQuestion.text }}</div>
        
        <div class="options-list">
          <div 
            v-for="(option, index) in currentQuestion.options" 
            :key="index"
            class="option-item"
            :class="{ correct: option.charAt(0) === currentQuestion.correct }"
          >
            <span class="option-label">{{ option.charAt(0) }}.</span>
            <span class="option-text">{{ option.substring(2) }}</span>
            <el-icon v-if="option.charAt(0) === currentQuestion.correct" class="correct-icon">
              <CircleCheck />
            </el-icon>
          </div>
        </div>
      </div>

      <div class="hint-section">
        <el-button 
          text 
          class="hint-btn"
          @click="showAnalysis = !showAnalysis"
        >
          <el-icon><Opportunity /></el-icon>
          <span>查看提示</span>
          <el-icon class="hint-arrow" :class="{ expanded: showAnalysis }">
            <ArrowDown />
          </el-icon>
        </el-button>
        <div v-if="showAnalysis" class="analysis-box">
          <div class="correct-answer">
            <span class="label">正确答案：</span>
            <span class="answer">{{ currentQuestion.correct }}</span>
          </div>
          <div class="analysis-text">
            <span class="label">解析：</span>
            <span>{{ currentQuestion.analysis || '暂无解析' }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-content">
      暂无试题数据
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button 
          text 
          :disabled="currentIndex === 0"
          @click="prevQuestion"
        >
          上一题
        </el-button>
        <el-button 
          v-if="currentIndex < quizData?.questions?.length - 1"
          text 
          @click="nextQuestion"
        >
          下一题
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Loading, Opportunity, ArrowDown, CircleCheck } from '@element-plus/icons-vue'
import { getQuizDetail, submitQuiz, getQuizAnalysis } from '@/shared/api/index.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  task: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue'])

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const isLoading = ref(false)
const quizData = ref(null)
const currentIndex = ref(0)
const showAnalysis = ref(false)

const currentQuestion = computed(() => {
  if (!quizData.value || !quizData.value.questions) return {}
  return quizData.value.questions[currentIndex.value] || {}
})

watch(() => props.modelValue, (val) => {
  if (val) {
    resetState()
    if (props.task && props.task.businessId) {
      fetchQuizDetail()
    }
  }
})

const resetState = () => {
  quizData.value = null
  currentIndex.value = 0
  showAnalysis.value = false
}

const fetchQuizDetail = async () => {
  isLoading.value = true
  try {
    const res = await getQuizDetail(props.task.businessId)
    quizData.value = res.data
  } catch (error) {
    console.error('获取题目失败:', error)
  } finally {
    isLoading.value = false
  }
}

const prevQuestion = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
    showAnalysis.value = false
  }
}

const nextQuestion = () => {
  if (quizData.value && currentIndex.value < quizData.value.questions.length - 1) {
    currentIndex.value++
    showAnalysis.value = false
  }
}
</script>

<style scoped>
.quiz-preview-dialog :deep(.el-dialog) {
  border-radius: 16px;
}

.quiz-preview-dialog :deep(.el-dialog__header) {
  padding: 20px 24px;
  border-bottom: 1px solid #F3F4F6;
}

.quiz-preview-dialog :deep(.el-dialog__body) {
  padding: 24px;
}

.quiz-preview-dialog :deep(.el-dialog__footer) {
  padding: 16px 24px;
  border-top: 1px solid #F3F4F6;
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

.loading-content,
.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px;
  color: #909399;
}

.loading-content .el-icon {
  font-size: 32px;
}

.quiz-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.progress-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar {
  flex: 1;
  display: flex;
  gap: 4px;
}

.progress-item {
  flex: 1;
  height: 6px;
  background-color: #E5E7EB;
  border-radius: 3px;
  transition: background-color 0.3s ease;
}

.progress-item.current {
  background-color: #333333;
}

.progress-text {
  font-size: 14px;
  color: #666666;
  min-width: 40px;
  text-align: right;
}

.question-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.question-text {
  font-size: 16px;
  font-weight: 500;
  color: #333333;
  line-height: 1.6;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  font-size: 14px;
  color: #333333;
}

.option-item.correct {
  background-color: #F0F9EB;
  border-color: #67C23A;
}

.option-label {
  font-weight: 600;
  color: #333333;
}

.option-text {
  flex: 1;
}

.correct-icon {
  color: #67C23A;
  font-size: 18px;
}

.hint-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.hint-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 0;
  color: #909399;
}

.hint-btn:hover {
  color: #333333;
}

.hint-arrow {
  transition: transform 0.2s ease;
}

.hint-arrow.expanded {
  transform: rotate(180deg);
}

.analysis-box {
  padding: 16px;
  background-color: #F5F7FA;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.correct-answer {
  display: flex;
  align-items: center;
  gap: 8px;
}

.correct-answer .label {
  font-size: 14px;
  color: #666666;
}

.correct-answer .answer {
  font-size: 14px;
  font-weight: 600;
  color: #67C23A;
}

.analysis-text {
  display: flex;
  gap: 8px;
  font-size: 14px;
  color: #333333;
  line-height: 1.6;
}

.analysis-text .label {
  color: #666666;
  flex-shrink: 0;
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dialog-footer .el-button[disabled] {
  color: #d1d5db;
  cursor: not-allowed;
}
</style>
