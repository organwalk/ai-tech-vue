<template>
  <el-dialog
    v-model="dialogVisible"
    title="删除章节"
    :show-close="false"
    width="50%"
    style="overflow-y:auto;max-height: 90vh; border-radius: 20px; padding: 35px;"
    custom-class="custom-dialog"
    append-to-body
  >
    <div class="delete-content">
      <p class="delete-message">确定要删除章节吗？此操作不可逆</p>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button
          size="large"
          round
          @click="handleCancel"
          class="cancel-button"
          :disabled="loading"
        >
          取消
        </el-button>
        <el-button
          size="large"
          round
          type="primary"
          @click="handleConfirm"
          :loading="loading"
          class="confirm-button"
        >
          {{ loading ? '删除中...' : '确认' }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  message: {
    type: String,
    default: '确定要删除该项吗？此操作不可逆'
  }
})

const emit = defineEmits(['update:visible', 'confirm'])

const dialogVisible = ref(props.visible)
const loading = ref(false)

watch(() => props.visible, (newVal) => {
  dialogVisible.value = newVal
})

watch(dialogVisible, (newVal) => {
  emit('update:visible', newVal)
})

const handleCancel = () => {
  if (!loading.value) {
    dialogVisible.value = false
  }
}

const handleConfirm = async () => {
  loading.value = true
  try {
    emit('confirm')
    dialogVisible.value = false
  } catch (error) {
    console.error('删除操作失败:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.custom-dialog {
  border-radius: 20px;
}

.custom-dialog :deep(.el-dialog__header) {
  padding: 0;
  margin: 0;
}

.custom-dialog :deep(.el-dialog__body) {
  padding: 0;
}

.custom-dialog :deep(.el-dialog__footer) {
  padding: 0;
}

.delete-content {
  padding: 20px 0;
}

.delete-message {
  font-size: 14px;
  color: #374151;
  margin: 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.cancel-button {
  background-color: #FFFFFF;
  color: #374151;
  border: 1px solid #E5E7EB;
  transition: all 0.2s;
}

.cancel-button:hover {
  background-color: #F9FAFB;
  border-color: #D1D5DB;
}

.cancel-button:disabled {
  background-color: #F3F4F6;
  border-color: #E5E7EB;
  color: #9CA3AF;
}

.confirm-button {
  background-color: #333333;
  color: #FFFFFF;
  border: none;
  transition: all 0.2s;
}

.confirm-button:hover {
  background-color: #555555;
}

.confirm-button:disabled {
  background-color: #999999;
  cursor: not-allowed;
}
</style>
