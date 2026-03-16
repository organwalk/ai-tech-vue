<template>
  <div class="quiz-content">
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
      <div class="question-text">{{ currentQuestion.text }}</div>
      <div class="options-list">
        <template v-if="hasAnswered">
          <div
            v-for="(option, index) in currentQuestion.options"
            :key="index"
            class="option-item"
            :class="{
              selected: answers[currentQuestion.id] === option.charAt(0),
              correct: option.charAt(0) === currentQuestion.correct,
              wrong: answers[currentQuestion.id] === option.charAt(0) && option.charAt(0) !== currentQuestion.correct
            }"
          >
            {{ option }}
          </div>
        </template>
        <template v-else>
          <div
            v-for="(option, index) in currentQuestion.options"
            :key="index"
            class="option-item"
            @click="handleSelectOption(option.charAt(0))"
          >
            {{ option }}
          </div>
        </template>
      </div>
    </div>

    <div class="hint-section" v-if="hasAnswered || showHint">
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
            <div class="analysis-content">{{ currentQuestion.analysis }}</div>
          </template>
        </el-alert>
      </div>
    </div>

    <div class="quiz-footer">
      <div class="footer-left">
        <el-button 
          text 
          :disabled="currentIndex === 0"
          @click="emit('prev-question')"
        >
          上一题
        </el-button>
      </div>
      <div class="footer-right">
        <el-button 
          v-if="currentIndex < quizData.questions.length - 1"
          text 
          :disabled="!hasAnswered"
          @click="emit('next-question')"
        >
          下一题
        </el-button>
        <el-button 
          v-else
          class="submit-btn"
          :disabled="!hasAnswered"
          @click="emit('submit')"
        >
          提交
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Opportunity, ArrowDown } from '@element-plus/icons-vue'

const props = defineProps({
  quizData: {
    type: Object,
    required: true
  },
  isResult: {
    type: Boolean,
    default: false
  },
  resultData: {
    type: Object,
    default: null
  },
  currentIndex: {
    type: Number,
    default: 0
  },
  answers: {
    type: Object,
    default: () => ({})
  },
  showAnalysis: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['select-option', 'next-question', 'prev-question', 'submit', 'retry', 'generate-analysis'])

const showHint = ref(false)
const showResult = ref(false)

const currentQuestion = computed(() => {
  if (!props.quizData || !props.quizData.questions) return {}
  return props.quizData.questions[props.currentIndex] || {}
})

const isCorrect = computed(() => {
  if (!currentQuestion.value || !props.answers[currentQuestion.value.id]) return null
  return props.answers[currentQuestion.value.id] === currentQuestion.value.correct
})

const hasAnswered = computed(() => {
  return !!props.answers[currentQuestion.value?.id]
})

watch(() => props.currentIndex, () => {
  showResult.value = false
  showHint.value = false
})

const handleSelectOption = (option) => {
  if (showResult.value) return
  
  emit('select-option', option)
  showResult.value = true
  
  const correct = option === currentQuestion.value.correct
  if (!correct) {
    showHint.value = true
  }
}
</script>

<style scoped>
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
  gap: 6px;
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

.footer-left,
.footer-right {
  display: flex;
  align-items: center;
}

.footer-right {
  gap: 8px;
}

.quiz-footer .el-button[disabled] {
  color: #9CA3AF;
  cursor: not-allowed;
}

.quiz-footer .el-button {
  border-radius: 99px;
  padding: 10px 32px;
  height: 40px;
  font-size: 14px;
  font-weight: 500;
}

.quiz-footer .el-button:not(.submit-btn) {
  background-color: #ffffff;
  color: #6b7280;
  border: 1px solid #e5e7eb;
}

.quiz-footer .el-button:not(.submit-btn):hover {
  background-color: #f9fafb;
  color: #111827;
  border-color: #d1d5db;
}

.submit-btn {
  background-color: #333333;
  color: #FFFFFF;
  border: none;
  border-radius: 24px;
  padding: 10px 28px;
  font-weight: 500;
}

.submit-btn:hover:not([disabled]) {
  background-color: #4B5563;
}

.submit-btn[disabled] {
  background-color: #D1D5DB;
  color: #9CA3AF;
  cursor: not-allowed;
}
</style>
