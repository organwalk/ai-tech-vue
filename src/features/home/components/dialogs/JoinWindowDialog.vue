<template>
  <el-dialog
    v-model="dialogVisible"
    title="加入共享窗口"
    :show-close="false"
    width="50%"
    style="overflow-y:auto;max-height: 90vh; border-radius: 20px; padding: 35px;"
    custom-class="join-dialog"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
      class="join-form"
      hide-required-asterisk
    >
      <el-form-item label="邀请码" prop="inviteCode">
        <el-input
          v-model="form.inviteCode"
          placeholder="请输入 8 位课程邀请码"
          maxlength="20"
          class="custom-input"
          @keydown.enter="handleSubmit"
        ></el-input>
      </el-form-item>
    </el-form>
    
    <template #footer>
      <span class="dialog-footer">
        <el-button
          size="large"
          round
          @click="handleCancel"
          class="cancel-button"
        >
          取消
        </el-button>
        <el-button
          size="large"
          round
          type="primary"
          @click="handleSubmit"
          :loading="loading"
          class="submit-button"
        >
          加入
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, defineProps, defineEmits, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { joinWindow } from '@/shared/api/index.js'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible', 'success'])

const dialogVisible = ref(props.visible)

watch(() => props.visible, (newVal) => {
  dialogVisible.value = newVal
})

watch(dialogVisible, (newVal) => {
  emit('update:visible', newVal)
  if (!newVal) {
    resetForm()
  }
})

const form = reactive({
  inviteCode: ''
})

const rules = {
  inviteCode: [
    { required: true, message: '请输入邀请码', trigger: 'blur' },
    { min: 1, max: 20, message: '邀请码长度不能超过20个字符', trigger: 'blur' }
  ]
}

const formRef = ref(null)
const loading = ref(false)

const resetForm = () => {
  form.inviteCode = ''
  loading.value = false
}

const handleCancel = () => {
  dialogVisible.value = false
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    
    loading.value = true

    await joinWindow(form.inviteCode)
    ElMessage.success('成功加入窗口')
    dialogVisible.value = false
    form.inviteCode = ''
    emit('success')
  } catch (error) {
    if (error !== false) {
      console.error('加入窗口失败:', error)
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.join-dialog {
  border-radius: 20px;
  box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.1);
}

.join-dialog :deep(.el-dialog__header) {
  border-bottom: none;
  padding-bottom: 0;
}

.join-dialog :deep(.el-dialog__title) {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.join-form {
  margin: 0;
}

.join-form :deep(.el-form-item__label) {
  font-size: 13px;
  font-weight: 500;
  color: #4b5563;
}

.custom-input {
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background-color: #f9fafb;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.custom-input:focus {
  background-color: #ffffff;
  border-color: #333333;
  box-shadow: 0 0 0 3px rgba(51, 51, 51, 0.1);
}

.custom-input :deep(.el-input__inner) {
  height: 44px;
}

.custom-input :deep(.el-input__inner::placeholder) {
  color: #9ca3af;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.cancel-button {
  background-color: #FFFFFF;
  color: #374151;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 8px 24px;
  height: 40px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.cancel-button:hover {
  background-color: #f9fafb;
  border-color: #d1d5db;
}

.submit-button {
  background-color: #333333;
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  padding: 8px 24px;
  height: 40px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.submit-button:hover {
  background-color: #1f2937;
  transform: scale(0.98);
}

@media (max-width: 768px) {
  :deep(.el-dialog) {
    width: 90% !important;
    margin: 5vh auto !important;
  }
}
</style>
