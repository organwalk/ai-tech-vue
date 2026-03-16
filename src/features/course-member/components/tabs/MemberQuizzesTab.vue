<template>
  <div class="quizzes-tab">
    <div class="quizzes-list">
      <div v-if="isLoading" class="loading-tip">加载中...</div>
      <template v-else>
        <div
          v-for="quiz in quizList"
          :key="quiz.id"
          class="quiz-item"
          @click="handleQuizClick(quiz)"
        >
          <div class="quiz-info">
            <el-icon class="quiz-icon"><DocumentCopy /></el-icon>
            <span class="quiz-title">{{ quiz.title || '测验' }}</span>
          </div>
          <span class="quiz-status" :class="getStatusClass(quiz)">
            {{ getStatusText(quiz) }}
          </span>
        </div>
        <div v-if="quizList.length === 0" class="empty-tip">
          暂无测验
        </div>
      </template>
    </div>

    <el-dialog
      v-model="quizDialogVisible"
      :show-close="false"
      width="50%"
      top="5vh"
      class="quiz-dialog"
      style="overflow-y: auto; max-height: 90vh; border-radius: 16px; padding: 35px;"
    >
      <template #header>
        <div class="dialog-header">
          <span class="dialog-title">{{ selectedQuiz?.title || '测验' }}</span>
        </div>
      </template>

      <div v-if="isQuizLoading" class="loading-content">加载中...</div>

      <template v-else-if="quizData">
        <div v-if="!showResult" class="quiz-main-content">
          <div class="progress-section">
            <div class="progress-bar">
              <div
                v-for="(item, index) in quizData.questions"
                :key="index"
                class="progress-item"
                :class="{ completed: index < currentIndex || answers[quizData.questions[index].id] }"
              ></div>
            </div>
            <div class="progress-text">{{ currentIndex + 1 }} / {{ quizData.questions.length }}</div>
          </div>

          <div class="question-section">
            <div class="question-text">{{ quizData.questions[currentIndex].text }}</div>
            <div class="options-list">
              <template v-if="hasAnswered">
                <div
                  v-for="(option, idx) in quizData.questions[currentIndex].options"
                  :key="idx"
                  class="option-item"
                  :class="{
                    selected: answers[quizData.questions[currentIndex].id] === option.charAt(0),
                    correct: option.charAt(0) === quizData.questions[currentIndex].correct,
                    wrong: answers[quizData.questions[currentIndex].id] === option.charAt(0) && option.charAt(0) !== quizData.questions[currentIndex].correct
                  }"
                >
                  {{ option }}
                </div>
              </template>
              <template v-else>
                <div
                  v-for="(option, idx) in quizData.questions[currentIndex].options"
                  :key="idx"
                  class="option-item"
                  @click="handleSelectOption(option)"
                >
                  {{ option }}
                </div>
              </template>
            </div>
          </div>

          <div v-if="hasAnswered" class="hint-section">
            <el-button
              text
              class="hint-btn"
              @click="showHint = !showHint"
            >
              <el-icon><Opportunity /></el-icon>
              <span>查看解析</span>
              <el-icon class="hint-arrow" :class="{ expanded: showHint }">
                <ArrowDown />
              </el-icon>
            </el-button>
            <div v-if="showHint" class="analysis-box">
              <el-alert :closable="false" type="info">
                <template #default>
                  <div class="analysis-content">{{ quizData.questions[currentIndex].analysis }}</div>
                </template>
              </el-alert>
            </div>
          </div>

          <div class="quiz-footer">
            <div class="footer-left">
              <el-button
                text
                :disabled="currentIndex === 0"
                @click="prevQuestion"
              >
                上一题
              </el-button>
            </div>
            <div class="footer-right">
              <el-button
                v-if="currentIndex < quizData.questions.length - 1"
                text
                :disabled="!hasAnswered"
                @click="nextQuestion"
              >
                下一题
              </el-button>
              <el-button
                v-else
                class="submit-btn"
                :disabled="!hasAnswered"
                @click="submitQuiz"
              >
                提交答案
              </el-button>
            </div>
          </div>
        </div>

        <div v-else class="result-content">
          <div class="result-summary">
            <div class="score-card">
              <div class="score-value">{{ resultData?.score || 0 }}</div>
              <div class="score-label">总成绩</div>
            </div>
            <div class="score-card">
              <div class="score-value">{{ calculateAccuracy() }}%</div>
              <div class="score-label">正确率</div>
            </div>
          </div>

          <div v-if="(resultData?.score || 0) < 60" class="warning-tip">
            <span class="warning-icon">!</span>
            <span>当前成绩较低，系统已为你触发对应弱项的补充练习，请稍后刷新列表查看。</span>
          </div>

          <div class="feedback-section">
            <div class="feedback-title">学习反馈</div>
            <div class="feedback-form">
              <input
                v-model="feedbackTitle"
                class="feedback-input"
                placeholder="反馈标题"
              />
              <textarea
                v-model="feedbackContent"
                class="feedback-textarea"
                placeholder="输入你的学习感受、题目问题或希望改进的内容..."
                rows="4"
              ></textarea>
              <button
                class="submit-feedback-btn"
                :disabled="isFeedbackSubmitted"
                @click="submitFeedback"
              >
                {{ isFeedbackSubmitted ? '已提交反馈' : '提交反馈' }}
              </button>
            </div>
          </div>

          <div class="result-actions">
            <el-button plain round @click="retryQuiz">重新作答</el-button>
            <el-button type="primary" round @click="quizDialogVisible = false">关闭</el-button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onUnmounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowDown, DocumentCopy, Opportunity } from '@element-plus/icons-vue'
import {
  getActiveTasks,
  getQuizDetail,
  getQuizRecords,
  getWindowDetail,
  submitFeedback as submitFeedbackRequest,
  submitQuiz as submitQuizRequest
} from '@/shared/api/index.js'

const props = defineProps({
  windowId: { type: String, required: true },
  chapterId: { type: [String, Number], required: true }
})

const quizList = ref([])
const completedRecords = ref({})
const isLoading = ref(true)
const quizDialogVisible = ref(false)
const selectedQuiz = ref(null)
const quizData = ref(null)
const isQuizLoading = ref(false)
const currentIndex = ref(0)
const answers = ref({})
const showResult = ref(false)
const resultData = ref(null)
const isFeedbackSubmitted = ref(false)
const feedbackTitle = ref('')
const feedbackContent = ref('')
const ownerId = ref('')
const showHint = ref(false)
let pollingTimer = null

const resetDialogState = () => {
  currentIndex.value = 0
  answers.value = {}
  showResult.value = false
  resultData.value = null
  isFeedbackSubmitted.value = false
  feedbackTitle.value = ''
  feedbackContent.value = ''
  showHint.value = false
}

const stopPolling = () => {
  if (pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = null
  }
}

const fetchOwnerId = async () => {
  try {
    const response = await getWindowDetail(props.windowId)
    if (response.data) {
      ownerId.value = response.data.creatorId || ''
    }
  } catch (error) {
    console.error('获取课程信息失败:', error)
  }
}

const fetchQuizRecords = async () => {
  try {
    const response = await getQuizRecords({
      windowId: props.windowId,
      chapterId: props.chapterId
    })
    const records = Array.isArray(response.data) ? response.data : (response.data?.records || [])
    const recordsMap = {}

    records.forEach((record) => {
      const quizId = record.quizId || record.quiz_id
      recordsMap[quizId] = record.score
    })

    completedRecords.value = recordsMap
  } catch (error) {
    console.error('获取答题记录失败:', error)
  }
}

const fetchQuizList = async () => {
  if (!ownerId.value || !props.chapterId) {
    quizList.value = []
    completedRecords.value = {}
    isLoading.value = false
    return
  }

  isLoading.value = true
  try {
    const response = await getActiveTasks({
      windowId: props.windowId,
      chapterId: props.chapterId,
      type: 'QUIZ_GEN',
      ownerId: ownerId.value
    })

    quizList.value = response.data || []

    if (quizList.value.length > 0) {
      await fetchQuizRecords()
    } else {
      completedRecords.value = {}
    }
  } catch (error) {
    console.error('获取测验列表失败:', error)
  } finally {
    isLoading.value = false
  }
}

const refreshData = async () => {
  stopPolling()
  resetDialogState()
  quizDialogVisible.value = false
  selectedQuiz.value = null
  quizData.value = null
  await fetchOwnerId()
  await fetchQuizList()
}

const handleQuizClick = async (quiz) => {
  if (quiz.status !== 1) {
    return
  }

  selectedQuiz.value = quiz
  quizDialogVisible.value = true
  isQuizLoading.value = true
  resetDialogState()

  try {
    const response = await getQuizDetail(quiz.businessId)
    quizData.value = response.data
  } catch (error) {
    console.error('获取测验详情失败:', error)
  } finally {
    isQuizLoading.value = false
  }
}

const hasAnswered = computed(() => {
  const currentQuestion = quizData.value?.questions?.[currentIndex.value]
  return currentQuestion ? Boolean(answers.value[currentQuestion.id]) : false
})

const handleSelectOption = (option) => {
  if (!quizData.value || showResult.value) {
    return
  }

  const question = quizData.value.questions[currentIndex.value]
  answers.value[question.id] = option.charAt(0)

  if (option.charAt(0) !== question.correct) {
    showHint.value = true
  }
}

const prevQuestion = () => {
  if (currentIndex.value > 0) {
    currentIndex.value -= 1
  }
}

const nextQuestion = () => {
  if (currentIndex.value < (quizData.value?.questions?.length || 0) - 1) {
    currentIndex.value += 1
  }
}

const startPolling = () => {
  if (pollingTimer || !ownerId.value) {
    return
  }

  pollingTimer = setInterval(async () => {
    try {
      const response = await getActiveTasks({
        windowId: props.windowId,
        chapterId: props.chapterId,
        type: 'QUIZ_GEN',
        ownerId: ownerId.value
      })

      const hasGenerating = (response.data || []).some(task => task.status === 0)
      if (!hasGenerating) {
        stopPolling()
        await fetchQuizList()
      }
    } catch (error) {
      console.error('轮询补充练习失败:', error)
    }
  }, 3000)
}

const submitQuiz = async () => {
  if (!quizData.value || !selectedQuiz.value) {
    return
  }

  const unanswered = quizData.value.questions.filter(question => !answers.value[question.id])
  if (unanswered.length > 0) {
    ElMessage.warning(`还有 ${unanswered.length} 题未作答`)
    return
  }

  isQuizLoading.value = true
  try {
    const response = await submitQuizRequest({
      quizId: selectedQuiz.value.businessId || selectedQuiz.value.id,
      answers: answers.value
    })

    resultData.value = response.data
    showResult.value = true

    const quizId = selectedQuiz.value.businessId || selectedQuiz.value.id
    completedRecords.value[quizId] = resultData.value?.score || 0

    if ((resultData.value?.score || 0) < 60) {
      startPolling()
    }
  } catch (error) {
    console.error('提交答案失败:', error)
    ElMessage.error('提交答案失败')
  } finally {
    isQuizLoading.value = false
  }
}

const calculateAccuracy = () => {
  if (!quizData.value || !resultData.value) {
    return 0
  }

  const correctCount = resultData.value.correctCount || resultData.value.correct_count || 0
  return Math.round((correctCount / quizData.value.questions.length) * 100)
}

const retryQuiz = () => {
  resetDialogState()
  stopPolling()
}

const submitFeedback = async () => {
  if (!feedbackContent.value.trim()) {
    ElMessage.warning('请输入反馈内容')
    return
  }

  try {
    await submitFeedbackRequest({
      windowId: props.windowId,
      chapterId: props.chapterId,
      title: feedbackTitle.value,
      content: feedbackContent.value,
      nickName: JSON.parse(localStorage.getItem('userInfo') || '{}').nickname || ''
    })
    ElMessage.success('反馈提交成功')
    isFeedbackSubmitted.value = true
  } catch (error) {
    console.error('提交反馈失败:', error)
    ElMessage.error('提交反馈失败')
  }
}

const getStatusClass = (quiz) => {
  if (quiz.status === 0) {
    return 'status-generating'
  }
  if (quiz.status === 2) {
    return 'status-error'
  }

  if (quiz.status === 1) {
    const score = completedRecords.value[quiz.businessId || quiz.id]
    return score !== undefined ? 'status-completed' : 'status-pending'
  }

  return ''
}

const getStatusText = (quiz) => {
  if (quiz.status === 0) {
    return '生成中'
  }
  if (quiz.status === 2) {
    return '生成失败'
  }

  if (quiz.status === 1) {
    const score = completedRecords.value[quiz.businessId || quiz.id]
    if (score !== undefined) {
      return `已完成 · ${score}分`
    }
    return '待完成'
  }

  return '未知状态'
}

watch(() => currentIndex.value, () => {
  showHint.value = false
})

watch(
  () => [props.windowId, props.chapterId],
  async () => {
    isLoading.value = true
    await refreshData()
  },
  { immediate: true }
)

onUnmounted(() => {
  stopPolling()
})
</script>

<style scoped>
.quizzes-tab {
  padding: 16px;
  height: 100%;
}

.quizzes-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.quiz-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px;
  background-color: #FFFFFF;
  border-radius: 12px;
  border: 1px solid #E5E7EB;
  cursor: pointer;
  transition: all 0.2s ease;
}

.quiz-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.quiz-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.quiz-icon {
  font-size: 20px;
  color: #6B7280;
}

.quiz-title {
  font-size: 15px;
  font-weight: 500;
  color: #1F2937;
}

.quiz-status {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 20px;
}

.status-generating {
  background-color: #DBEAFE;
  color: #1E3A8A;
}

.status-pending {
  background-color: #FEF3C7;
  color: #92400E;
}

.status-completed {
  background-color: #D1FAE5;
  color: #065F46;
}

.status-error {
  background-color: #FEE2E2;
  color: #991B1B;
}

.dialog-header {
  display: flex;
  align-items: center;
}

.dialog-title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.quiz-main-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
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

.progress-item.completed {
  background-color: #333333;
}

.progress-text {
  font-size: 13px;
  color: #6B7280;
  min-width: 45px;
}

.question-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.question-text {
  font-size: 18px;
  color: #333333;
  line-height: 1.6;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-item {
  padding: 16px 20px;
  background-color: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: 10px;
  cursor: pointer;
  font-size: 15px;
  transition: all 0.2s ease;
}

.option-item:hover:not(.selected):not(.correct):not(.wrong) {
  border-color: #9CA3AF;
  background-color: #F3F4F6;
}

.option-item.selected {
  background-color: #333333;
  color: #FFFFFF;
  border-color: #333333;
}

.option-item.correct {
  background-color: #10B981;
  color: #FFFFFF;
  border-color: #10B981;
}

.option-item.wrong {
  background-color: #EF4444;
  color: #FFFFFF;
  border-color: #EF4444;
}

.hint-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.hint-btn {
  width: fit-content;
  color: #6B7280;
}

.hint-arrow {
  transition: transform 0.2s ease;
}

.hint-arrow.expanded {
  transform: rotate(180deg);
}

.analysis-box {
  margin-top: 8px;
}

.analysis-content {
  line-height: 1.6;
  font-size: 14px;
}

.quiz-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 20px;
  border-top: 1px solid #F3F4F6;
  margin-top: 10px;
}

.submit-btn {
  background-color: #333333;
  color: #FFFFFF;
  border: none;
  border-radius: 24px;
  padding: 10px 28px;
  font-weight: 500;
}

.submit-btn:hover:not(:disabled) {
  background-color: #4B5563;
}

.submit-btn:disabled {
  background-color: #D1D5DB;
  color: #9CA3AF;
  cursor: not-allowed;
}

.result-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30px;
  padding: 10px 0;
}

.result-summary {
  display: flex;
  gap: 40px;
}

.score-card {
  text-align: center;
}

.score-value {
  font-size: 56px;
  font-weight: 800;
  color: #111827;
}

.score-label {
  font-size: 14px;
  color: #6B7280;
  margin-top: 4px;
}

.warning-tip {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  background-color: #FFFBEB;
  border: 1px solid #FDE68A;
  border-radius: 10px;
  color: #92400E;
  font-size: 14px;
  width: 100%;
}

.warning-icon {
  font-weight: 700;
}

.feedback-section {
  width: 100%;
}

.feedback-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
}

.feedback-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.feedback-input,
.feedback-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
}

.feedback-input:focus,
.feedback-textarea:focus {
  border-color: #333333;
}

.submit-feedback-btn {
  align-self: flex-end;
  padding: 10px 24px;
  background-color: #333333;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.submit-feedback-btn:disabled {
  background-color: #9CA3AF;
}

.result-actions {
  display: flex;
  gap: 16px;
}

.loading-tip,
.empty-tip,
.loading-content {
  text-align: center;
  color: #9CA3AF;
  padding: 40px;
  font-size: 14px;
}
</style>
