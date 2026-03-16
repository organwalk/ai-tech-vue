<template>
  <el-dialog
    v-model="dialogVisible"
    :show-close="false"
    width="50%"
    top="5vh"
    style="overflow-y: auto; max-height: 90vh; border-radius: 15px; padding: 35px;"
    class="quiz-dialog"
  >
    <template #header>
      <div class="dialog-header">
        <span class="dialog-title">生成测试卡片</span>
      </div>
    </template>

    <div class="dialog-content">
      <div class="form-section">
        <div class="section-label">题目数量</div>
        <div class="option-buttons">
          <div
            v-for="option in countOptions"
            :key="option.value"
            class="option-btn"
            :class="{ active: count === option.value }"
            @click="count = option.value"
          >
            {{ option.label }}
          </div>
        </div>
      </div>

      <div class="form-section">
        <div class="section-label">难度等级</div>
        <div class="option-buttons">
          <div
            v-for="option in difficultyOptions"
            :key="option.value"
            class="option-btn"
            :class="{ active: difficulty === option.value }"
            @click="difficulty = option.value"
          >
            {{ option.label }}
          </div>
        </div>
      </div>

      <div class="form-section">
        <div class="section-label">标题</div>
        <input
          v-model="title"
          class="title-input"
          placeholder="请输入标题"
          maxlength="20"
        />
      </div>

      <div class="form-section">
        <div class="section-label">主题（可选）</div>
        <textarea
          v-model="prompt"
          class="theme-input"
          placeholder="示例提示：\n- 仅限某个来源\n- 专注某个主题\n- 保持题目简短清晰"
          rows="4"
        ></textarea>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <button class="generate-btn" :disabled="isLoading" @click="handleGenerate">
          {{ isLoading ? '生成中...' : '生成' }}
        </button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { generateQuiz, getFileList } from '@/shared/api/index.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  windowId: {
    type: String,
    required: true
  },
  chapterId: {
    type: [String, Number],
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'submitted'])

const dialogVisible = ref(props.modelValue)
const isLoading = ref(false)
const title = ref('')
const count = ref(10)
const difficulty = ref('SAME')
const prompt = ref('')

const countOptions = [
  { label: '5', value: 5 },
  { label: '10', value: 10 },
  { label: '15', value: 15 }
]

const difficultyOptions = [
  { label: '简单', value: 'LOWER' },
  { label: '中等', value: 'SAME' },
  { label: '困难', value: 'HIGHER' }
]

const resetForm = () => {
  title.value = ''
  count.value = 10
  difficulty.value = 'SAME'
  prompt.value = ''
}

watch(() => props.modelValue, (val) => {
  dialogVisible.value = val
  if (val) {
    resetForm()
  }
})

watch(dialogVisible, (val) => {
  emit('update:modelValue', val)
})

const fetchFileIds = async () => {
  try {
    const response = await getFileList({
      windowId: props.windowId,
      chapterId: props.chapterId
    })

    let files = []
    if (Array.isArray(response)) {
      files = response
    } else if (response?.data) {
      files = response.data || []
    }

    return files.map(file => file.id)
  } catch (error) {
    console.error('获取文件列表失败:', error)
    return []
  }
}

const handleGenerate = async () => {
  isLoading.value = true

  try {
    const fileIds = await fetchFileIds()

    await generateQuiz({
      windowId: props.windowId,
      chapterId: props.chapterId,
      title: title.value,
      mode: 'SELF_STUDY',
      config: {
        prompt: prompt.value,
        focus: 'ALL',
        count: count.value,
        difficulty: difficulty.value,
        fileIds
      }
    })

    dialogVisible.value = false
    resetForm()
    ElMessage.success('测试生成任务已提交')
    emit('submitted')
  } catch (error) {
    console.error('生成测试失败:', error)
    ElMessage.error('生成失败，请重试')
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.quiz-dialog :deep(.el-dialog) {
  border-radius: 16px;
}

.quiz-dialog :deep(.el-dialog__header) {
  padding: 20px 24px;
  border-bottom: 1px solid #F3F4F6;
}

.quiz-dialog :deep(.el-dialog__body) {
  padding: 24px;
}

.quiz-dialog :deep(.el-dialog__footer) {
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

.dialog-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-label {
  font-size: 14px;
  font-weight: 500;
  color: #333333;
}

.option-buttons {
  display: flex;
  gap: 12px;
}

.option-btn {
  padding: 8px 20px;
  border-radius: 999px;
  border: 1px solid #E5E7EB;
  background-color: #FFFFFF;
  color: #666666;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.option-btn:hover {
  border-color: #333333;
}

.option-btn.active {
  background-color: #F3F4F6;
  color: #333333;
  font-weight: 600;
  border-color: #333333;
}

.title-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  color: #333333;
  line-height: 1.5;
  box-sizing: border-box;
}

.title-input:focus {
  outline: none;
  border-color: #333333;
}

.title-input::placeholder {
  color: #9CA3AF;
}

.theme-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  color: #333333;
  resize: vertical;
  line-height: 1.5;
}

.theme-input:focus {
  outline: none;
  border-color: #333333;
}

.theme-input::placeholder {
  color: #9CA3AF;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}

.generate-btn {
  padding: 10px 32px;
  border-radius: 999px;
  background-color: #333333;
  color: #FFFFFF;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.generate-btn:hover:not(:disabled) {
  background-color: #555555;
}

.generate-btn:disabled {
  background-color: #9CA3AF;
  cursor: not-allowed;
}
</style>
