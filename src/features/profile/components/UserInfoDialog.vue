<template>
  <el-dialog
    v-model="dialogVisible"
    title="修改个人信息"
    width="50%"
    style="overflow-y:auto;max-height: 90vh; border-radius: 20px; padding: 35px;"
    :show-close="false"
    custom-class="user-info-dialog"
    append-to-body
  >
  <br/>
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
      class="nickname-form"
      hide-required-asterisk
    >
      <el-form-item label="昵称" prop="nickname">
        <el-input
          v-model="form.nickname"
          placeholder="请输入新昵称"
          maxlength="20"
          show-word-limit
          class="nickname-input"
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
          :disabled="loading"
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
          确定
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, defineProps, defineEmits, watch } from 'vue'
import { updateUserInfo } from '@/shared/api/index.js'
import { ElMessage } from 'element-plus'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  userInfo: {
    type: Object,
    default: () => ({
      nickname: '用户',
      avatar: 'https://via.placeholder.com/80'
    })
  }
})

const emit = defineEmits(['update:visible', 'success'])

const dialogVisible = ref(props.visible)

watch(() => props.visible, (newVal) => {
  dialogVisible.value = newVal
  if (newVal) {
    form.nickname = props.userInfo.nickname
  }
})

watch(dialogVisible, (newVal) => {
  emit('update:visible', newVal)
})

const form = reactive({
  nickname: ''
})

const rules = {
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 1, max: 20, message: '昵称长度不能超过20个字符', trigger: 'blur' }
  ]
}

const formRef = ref(null)
const loading = ref(false)

const handleCancel = () => {
  dialogVisible.value = false
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    
    loading.value = true
    
    await updateUserInfo({ nickname: form.nickname })
    
    ElMessage.success('修改成功')
    emit('success', { nickname: form.nickname })
    dialogVisible.value = false
  } catch (error) {
    console.error('修改用户信息失败:', error)
    ElMessage.error(error.message || '修改失败，请稍后重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.user-info-dialog {
  border-radius: 20px;
  box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.1);
}

.user-info-dialog :deep(.el-dialog__header) {
  border-bottom: none;
  padding-bottom: 0;
}

.user-info-dialog :deep(.el-dialog__title) {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.nickname-form {
  width: 100%;
}

.nickname-form :deep(.el-form-item__label) {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
}

.nickname-input {
  width: 100%;
}

.nickname-input :deep(.el-input__wrapper) {
  border-radius: 8px;
}

.nickname-input :deep(.el-input__inner) {
  height: 44px;
}

.nickname-input :deep(.el-input__inner::placeholder) {
  color: #9ca3af;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}



.cancel-button:hover {
  background-color: #f9fafb;
  border-color: #d1d5db;
}

.submit-button {
  background-color: #333333;
  color: #FFFFFF;
  border: none;
  padding: 8px 24px;
  height: 40px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
