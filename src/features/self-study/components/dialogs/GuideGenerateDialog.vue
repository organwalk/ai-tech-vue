<template>
  <el-dialog
    v-model="dialogVisible"
    :show-close="false"
    width="50%"
    style="overflow-y:auto;max-height: 90vh; border-radius: 15px; padding: 35px;"
    class="guide-dialog"
  >
    <template #header>
      <div class="dialog-header">
        <span class="dialog-title">生成学习指南</span>
      </div>
    </template>
    
    <div class="dialog-content">
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
        <div class="section-label">主题应该是什么？</div>
        <textarea 
          v-model="topic" 
          class="topic-input"
          placeholder="请描述需要生成的主题"
          rows="7"
        ></textarea>
      </div>
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
import { generateGuide } from '@/shared/api/index.js'

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
const title = ref('')
const topic = ref('')

watch(() => props.modelValue, (val) => {
  dialogVisible.value = val
})

watch(dialogVisible, (val) => {
  emit('update:modelValue', val)
})

const handleGenerate = async () => {
  isLoading.value = true
  
  try {
    const payload = {
      windowId: props.windowId,
      title: title.value,
      fileIds: props.selectedFileIds,
      topic: topic.value
    }

    await generateGuide(payload)
    dialogVisible.value = false
    topic.value = ''
    ElMessage.success('学习指南生成任务已提交')
    emit('submitted')
  } catch (error) {
    console.error('生成学习指南失败:', error)
    ElMessage.error('生成失败，请重试')
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.guide-dialog :deep(.el-dialog) {
  border-radius: 16px;
}

.guide-dialog :deep(.el-dialog__header) {
  padding: 20px 24px;
  border-bottom: 1px solid #F3F4F6;
}

.guide-dialog :deep(.el-dialog__body) {
  padding: 24px;
}

.guide-dialog :deep(.el-dialog__footer) {
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

.topic-input {
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

.topic-input:focus {
  outline: none;
  border-color: #333333;
}

.topic-input::placeholder {
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
