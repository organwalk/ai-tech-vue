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
    <div class="form-content">
      <div class="form-item">
        <label class="form-label">标题 <span class="required">*</span></label>
        <el-input
          v-model="formData.title"
          placeholder="请输入章节标题"
          maxlength="20"
          show-word-limit
        />
      </div>
      <div class="form-item">
        <label class="form-label">摘要</label>
        <el-input
          v-model="formData.contentSummary"
          type="textarea"
          placeholder="请输入章节摘要"
          maxlength="100"
          show-word-limit
          :rows="3"
        />
      </div>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <button class="cancel-btn" @click="handleCancel">取消</button>
        <button class="confirm-btn" @click="handleConfirm">确定</button>
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
  if (!formData.value.title.trim()) {
    ElMessage.warning('请输入章节标题')
    return
  }

  try {
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
  } catch (error) {
    console.error(isEdit.value ? '修改章节失败:' : '创建章节失败:', error)
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
