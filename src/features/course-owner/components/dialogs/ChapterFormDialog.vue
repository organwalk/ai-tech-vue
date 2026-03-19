<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isEdit ? '修改章节' : '新建章节'"
    :show-close="false"
    width="50%"
    top="5vh"
    style="overflow-y:auto;max-height: 90vh; border-radius: 15px; padding: 35px;"
    class="chapter-form-dialog"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-position="top"
      class="chapter-form"
      hide-required-asterisk
    >
      <el-form-item label="标题" prop="title">
        <el-input
          v-model="formData.title"
          placeholder="请输入章节标题"
          maxlength="20"
          show-word-limit
        />
      </el-form-item>
      <el-form-item label="摘要" prop="contentSummary">
        <el-input
          v-model="formData.contentSummary"
          type="textarea"
          placeholder="请输入章节摘要"
          maxlength="100"
          show-word-limit
          :rows="3"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <button class="cancel-btn" @click="handleCancel" :disabled="loading">取消</button>
        <button class="confirm-btn" @click="handleConfirm" :disabled="loading">
          {{ loading ? '处理中...' : '确定' }}
        </button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { createChapter, updateChapter } from '@/shared/api/index.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  chapter: {
    type: Object,
    default: null
  },
  windowId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'success'])

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const isEdit = computed(() => !!props.chapter)

const formData = ref({
  title: '',
  contentSummary: ''
})

const rules = {
  title: [
    { required: true, message: '请输入章节标题', trigger: 'blur' },
    { min: 1, max: 20, message: '标题长度不能超过20个字符', trigger: 'blur' }
  ]
}

const formRef = ref(null)
const loading = ref(false)

watch(() => props.modelValue, (val) => {
  if (val) {
    if (props.chapter) {
      formData.value = {
        title: props.chapter.title || '',
        contentSummary: props.chapter.contentSummary || ''
      }
    } else {
      formData.value = {
        title: '',
        contentSummary: ''
      }
    }
  }
})

const handleCancel = () => {
  dialogVisible.value = false
}

const handleConfirm = async () => {
  try {
    await formRef.value.validate()
    
    loading.value = true
    
    if (isEdit.value) {
      await updateChapter({
        id: props.chapter.id,
        title: formData.value.title,
        contentSummary: formData.value.contentSummary
      })
    } else {
      await createChapter({
        windowId: props.windowId,
        title: formData.value.title,
        contentSummary: formData.value.contentSummary
      })
    }
    ElMessage.success(isEdit.value ? '修改成功' : '创建成功')
    emit('success')
    dialogVisible.value = false
  } catch (error) {
    if (error !== false) {
      console.error(isEdit.value ? '修改章节失败:' : '创建章节失败:', error)
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.chapter-form-dialog :deep(.el-dialog) {
  border-radius: 16px;
}

.chapter-form-dialog :deep(.el-dialog__header) {
  padding: 20px 24px;
  border-bottom: 1px solid #F3F4F6;
}

.chapter-form-dialog :deep(.el-dialog__title) {
  font-size: 16px;
  font-weight: 600;
  color: #333333;
}

.chapter-form-dialog :deep(.el-dialog__body) {
  padding: 24px;
}

.chapter-form-dialog :deep(.el-dialog__footer) {
  padding: 16px 24px;
  border-top: 1px solid #F3F4F6;
}

.form-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: #333333;
}

.required {
  color: #F56C6C;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.cancel-btn {
  padding: 8px 20px;
  background-color: #FFFFFF;
  color: #333333;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn:hover {
  background-color: #F9FAFB;
}

.confirm-btn {
  padding: 8px 20px;
  background-color: #333333;
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.confirm-btn:hover {
  background-color: #555555;
}
</style>
