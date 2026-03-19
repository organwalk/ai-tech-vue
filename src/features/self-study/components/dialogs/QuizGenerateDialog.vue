<template>
  <el-dialog
    v-model="dialogVisible"
    :show-close="false"
    width="50%"
    top="5vh"
    style="overflow-y:auto;max-height: 90vh; border-radius: 15px; padding: 35px;"
    class="quiz-dialog"
  >
    <template #header>
      <div class="dialog-header">
        <span class="dialog-title">生成测试卡片</span>
      </div>
    </template>
    
    <div class="dialog-content">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-position="top"
        class="quiz-form"
        hide-required-asterisk
      >
        <el-form-item label="题目数量" prop="count">
          <div class="option-buttons">
            <div 
              v-for="option in countOptions" 
              :key="option.value"
              class="option-btn"
              :class="{ active: formData.count === option.value }"
              @click="formData.count = option.value"
            >
              {{ option.label }}
            </div>
          </div>
        </el-form-item>

        <el-form-item label="难度等级" prop="difficulty">
          <div class="option-buttons">
            <div 
              v-for="option in difficultyOptions" 
              :key="option.value"
              class="option-btn"
              :class="{ active: formData.difficulty === option.value }"
              @click="formData.difficulty = option.value"
            >
             {{ option.label }}
            </div>
          </div>
        </el-form-item>

        <el-form-item label="标题" prop="title">
          <input 
            v-model="formData.title" 
            class="title-input"
            placeholder="请输入标题"
            maxlength="20"
          />
        </el-form-item>

        <el-form-item label="主题（可选）" prop="prompt">
          <textarea 
            v-model="formData.prompt" 
            class="theme-input"
            placeholder="示例提示\n • 仅限于特定来源\n • 专注特定主题\n • 简短易记"
            rows="4"
          ></textarea>
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <button class="generate-btn" @click="handleGenerate" :disabled="isLoading">
          {{ isLoading ? '生成中...' : '生成' }}
        </button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits } from 'vue'
import { ElMessage } from 'element-plus'
import { generateQuiz } from '@/shared/api/index.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
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

const emit = defineEmits(['update:modelValue', 'submitted'])

const dialogVisible = ref(props.modelValue)
const isLoading = ref(false)
const formRef = ref(null)
const formData = ref({
  title: '',
  count: 10,
  difficulty: 'SAME',
  prompt: ''
})

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

const rules = {
  title: [
    { required: true, message: '请输入标题', trigger: 'blur' },
    { min: 1, max: 20, message: '标题长度不能超过20个字符', trigger: 'blur' }
  ]
}

watch(() => props.modelValue, (val) => {
  dialogVisible.value = val
})

watch(dialogVisible, (val) => {
  emit('update:modelValue', val)
})

const handleGenerate = async () => {
  try {
    await formRef.value.validate()
    
    isLoading.value = true
    
    const payload = {
      windowId: props.windowId,
      title: formData.value.title,
      mode: 'SELF_STUDY',
      config: {
        prompt: formData.value.prompt,
        focus: 'ALL',
        count: formData.value.count,
        difficulty: formData.value.difficulty,
        fileIds: props.selectedFileIds
      }
    }

    await generateQuiz(payload)
    dialogVisible.value = false
    ElMessage.success('测验生成任务已提交')
    emit('submitted')
  } catch (error) {
    if (error !== false) {
      console.error('生成测验失败:', error)
      ElMessage.error('生成失败，请重试')
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.quiz-dialog :deep(.el-dialog) {
  border-radius: 20px;
  box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.1);
}

.quiz-dialog :deep(.el-dialog__header) {
  padding: 20px 24px;
  border-bottom: none;
}

.quiz-dialog :deep(.el-dialog__title) {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.quiz-dialog :deep(.el-dialog__body) {
  padding: 24px;
}

.quiz-dialog :deep(.el-dialog__footer) {
  padding: 16px 24px;
  border-top: none;
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
  color: #4b5563;
}

.option-buttons {
  display: flex;
  gap: 12px;
}

.option-btn {
  padding: 8px 20px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background-color: #ffffff;
  color: #646a73;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.option-btn:hover {
  border-color: #333333;
  color: #111827;
}

.option-btn.active {
  background-color: #333333;
  color: #ffffff;
  border-color: #333333;
  box-shadow: 0 1px 3px rgba(51, 51, 51, 0.1);
}

.title-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  color: #333333;
  line-height: 1.5;
  box-sizing: border-box;
  background-color: #f9fafb;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.title-input:focus {
  outline: none;
  border-color: #333333;
  background-color: #ffffff;
  box-shadow: 0 0 0 3px rgba(51, 51, 51, 0.1);
}

.title-input::placeholder {
  color: #9ca3af;
}

.theme-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  color: #333333;
  resize: vertical;
  line-height: 1.5;
  box-sizing: border-box;
  background-color: #f9fafb;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.theme-input:focus {
  outline: none;
  border-color: #333333;
  background-color: #ffffff;
  box-shadow: 0 0 0 3px rgba(51, 51, 51, 0.1);
}

.theme-input::placeholder {
  color: #9ca3af;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}

.generate-btn {
  padding: 10px 32px;
  border-radius: 8px;
  background-color: #333333;
  color: #FFFFFF;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  height: 40px;
}

.generate-btn:hover:not(:disabled) {
  background-color: #1f2937;
  transform: scale(0.98);
}

.generate-btn:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}
</style>
