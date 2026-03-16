<template>
  <el-dialog
    v-model="dialogVisible"
    :show-close="false"
    width="50%"
    top="5vh"
    class="task-dialog"
    style="overflow-y:auto;max-height: 90vh; border-radius: 15px; padding: 35px;"
  >
    <template #header>
      <div class="dialog-header">
        <span class="dialog-title">{{ dialogTitle }}</span>
      </div>
    </template>

    <div v-if="isLoading" class="loading-content">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>加载中...</span>
    </div>

    <div v-else-if="taskType === 'QUIZ_GEN'" class="quiz-content">
      <QuizContent
        v-if="taskData && !isResult"
        :quiz-data="taskData"
        :is-result="isResult"
        :result-data="resultData"
        :current-index="currentIndex"
        :answers="answers"
        :show-analysis="showAnalysis"
        @select-option="selectOption"
        @next-question="nextQuestion"
        @prev-question="prevQuestion"
        @submit="submitQuiz"
        @retry="retryQuiz"
        @generate-analysis="generateAnalysis"
      />
      <div v-else-if="isResult && resultData" class="result-content">
        <div class="result-score">
          <div class="score-value">{{ resultData.score }}</div>
          <div class="score-label">总成绩</div>
        </div>
        <div class="result-accuracy">
          <div class="accuracy-value">{{ calculateAccuracy(answers, taskData.questions) }}%</div>
          <div class="accuracy-label">正确率</div>
        </div>
      </div>
    </div>

    <div v-else-if="taskType === 'GUIDE_GEN' || taskType === 'QUIZ_ANALYSIS' || taskType === 'DIAGNOSIS_GEN'" class="guide-content">
      <MarkdownContent
        v-if="taskData"
        :content="taskData.content || taskData.agentAnalysis || ''"
      />
    </div>

    <div v-else class="unknown-content">
      <el-alert
        title="未知的任务类型"
        type="warning"
        :closable="false"
      />
    </div>

    <template #footer>
      <div v-if="taskType === 'QUIZ_GEN' && isResult" class="dialog-footer result-footer">
        <el-button class="retry-btn" @click="retryQuiz">
          重做
        </el-button>
        <el-button class="analysis-btn" @click="generateAnalysis">
          测试结果分析
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import QuizContent from '@/features/self-study/components/QuizContent.vue'
import MarkdownContent from '@/shared/components/content/MarkdownContent.vue'
import {
  getDiagnosisDetail,
  getGuideDetail,
  getQuizAnalysis,
  getQuizDetail,
  submitQuiz as submitQuizRequest
} from '@/shared/api/index.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  task: {
    type: Object,
    default: null
  },
  windowId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'submitted'])

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const isLoading = ref(false)
const taskData = ref(null)
const taskType = ref('')
const currentIndex = ref(0)
const answers = ref({})
const isTesting = ref(true)
const isResult = ref(false)
const resultData = ref(null)
const showAnalysis = ref(false)
const recordId = ref(null)

const dialogTitle = computed(() => {
  if (isResult.value) return '????'
  switch (taskType.value) {
    case 'QUIZ_GEN': return '????'
    case 'GUIDE_GEN': return '????'
    case 'QUIZ_ANALYSIS': return '????'
    case 'DIAGNOSIS_GEN': return '????'
    default: return '????'
  }
})

watch(() => props.modelValue, (val) => {
  if (val) {
    resetState()
    if (props.task && props.task.businessId) {
      taskType.value = props.task.taskType
      fetchTaskDetail()
    }
  }
})

const resetState = () => {
  taskData.value = null
  taskType.value = ''
  currentIndex.value = 0
  answers.value = {}
  isTesting.value = true
  isResult.value = false
  resultData.value = null
  showAnalysis.value = false
  recordId.value = null
}

const fetchTaskDetail = async () => {
  isLoading.value = true
  try {
    let request = null
    switch (taskType.value) {
      case 'QUIZ_GEN':
        request = () => getQuizDetail(props.task.businessId)
        break
      case 'GUIDE_GEN':
        request = () => getGuideDetail(props.task.businessId)
        break
      case 'QUIZ_ANALYSIS':
        request = () => getQuizAnalysis(props.task.businessId)
        break
      case 'DIAGNOSIS_GEN':
        request = () => getDiagnosisDetail(props.task.businessId)
        break
      default:
        ElMessage.error('???????')
        return
    }

    const data = await request()
    taskData.value = data.data
  } catch (error) {
    console.error('??????:', error)
    ElMessage.error('??????')
  } finally {
    isLoading.value = false
  }
}

const selectOption = (option) => {
  if (!taskData.value) return
  const questionId = taskData.value.questions[currentIndex.value].id
  answers.value[questionId] = option
}

const prevQuestion = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
  }
}

const nextQuestion = () => {
  if (!taskData.value) return
  if (currentIndex.value < taskData.value.questions.length - 1) {
    currentIndex.value++
  }
}

const calculateAccuracy = (userAnswers, questions) => {
  if (!questions || questions.length === 0) return 0
  let correctCount = 0
  questions.forEach(question => {
    if (userAnswers[question.id] === question.correct) {
      correctCount++
    }
  })
  return Math.round((correctCount / questions.length) * 100)
}

const submitQuiz = async () => {
  if (!taskData.value || !props.task) return

  const unanswered = taskData.value.questions.filter(question => !answers.value[question.id])
  if (unanswered.length > 0) {
    ElMessage.warning('?? ' + unanswered.length + ' ????')
    return
  }

  isLoading.value = true
  try {
    const data = await submitQuizRequest({
      quizId: props.task.businessId,
      answers: answers.value
    })
    resultData.value = data.data
    recordId.value = data.data.recordId
    isTesting.value = false
    isResult.value = true
  } catch (error) {
    console.error('????:', error)
    ElMessage.error('????')
  } finally {
    isLoading.value = false
  }
}

const retryQuiz = () => {
  resetState()
  if (props.task && props.task.businessId) {
    taskType.value = props.task.taskType
    fetchTaskDetail()
  }
}

const generateAnalysis = async () => {
  if (!recordId.value) return

  emit('update:modelValue', false)

  try {
    await getQuizAnalysis(recordId.value)
    ElMessage.success('???????????')
    emit('submitted')
  } catch (error) {
    console.error('??????:', error)
    ElMessage.error('????')
  }
}
</script>

<style scoped>
.task-dialog ::v-deep(.el-dialog) {
  border-radius: 16px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.task-dialog :deep(.el-dialog__header) {
  padding: 20px 24px;
  border-bottom: 1px solid #F3F4F6;
  flex-shrink: 0;
}

.task-dialog :deep(.el-dialog__body) {
  padding: 24px;
  min-height: 200px;
  max-height: calc(90vh - 140px);
  overflow-y: auto;
  flex: 1;
}

.task-dialog :deep(.el-dialog__footer) {
  padding: 16px 24px;
  border-top: 1px solid #F3F4F6;
  flex-shrink: 0;
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

.quiz-content,
.guide-content,
.unknown-content {
  min-height: 200px;
  max-height: 100%;
  overflow-y: auto;
}

.result-content {
  display: flex;
  justify-content: center;
  gap: 60px;
  padding: 40px 0;
}

.result-score,
.result-accuracy {
  text-align: center;
}

.score-value,
.accuracy-value {
  font-size: 48px;
  font-weight: 700;
  color: #333333;
}

.score-label,
.accuracy-label {
  font-size: 14px;
  color: #666666;
  margin-top: 8px;
}

.dialog-footer {
  display: flex;
  align-items: center;
}

.dialog-footer.result-footer {
  justify-content: center;
  gap: 16px;
}

.footer-spacer {
  flex: 1;
}

.submit-btn {
  background-color: #333333;
  color: #FFFFFF;
  border: none;
  border-radius: 20px;
  padding: 8px 24px;
}

.submit-btn:hover {
  background-color: #555555;
}

.retry-btn {
  background-color: #FFFFFF;
  color: #333333;
  border: 1px solid #333333;
  border-radius: 20px;
  padding: 8px 24px;
}

.retry-btn:hover {
  background-color: #F3F4F6;
}

.analysis-btn {
  background-color: #333333;
  color: #FFFFFF;
  border: none;
  border-radius: 20px;
  padding: 8px 24px;
}

.analysis-btn:hover {
  background-color: #555555;
}
</style>
