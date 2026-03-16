<template>
  <el-dialog
    v-model="dialogVisible"
    title="修改窗口信息"
    :show-close="false"
    width="50%"
    style="overflow-y:auto;max-height: 90vh; border-radius: 20px; padding: 35px;"
    custom-class="custom-dialog"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
      class="update-form"
      hide-required-asterisk
    >
      <!-- 标题 -->
      <el-form-item label="标题" prop="title">
        <el-input
          v-model="form.title"
          placeholder="请输入窗口标题"
          maxlength="15"
          show-word-limit
          class="custom-input"
        ></el-input>
      </el-form-item>
      
      <!-- 类型（只读） -->
      <el-form-item label="类型">
        <el-input
          v-model="form.typeText"
          disabled
          class="custom-input disabled-input"
        ></el-input>
      </el-form-item>
      
      <!-- 简介 -->
      <el-form-item label="简介" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          placeholder="请输入窗口简介（可选）"
          maxlength="30"
          show-word-limit
          :rows="3"
          class="custom-textarea"
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
          确定
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, defineProps, defineEmits, watch, computed } from 'vue'

// 定义属性
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  windowData: {
    type: Object,
    default: null
  }
})

// 定义事件
const emit = defineEmits(['update:visible', 'success'])

// 弹窗可见性
const dialogVisible = ref(props.visible)

// 监听visible属性变化
watch(() => props.visible, (newVal) => {
  dialogVisible.value = newVal
})

// 监听dialogVisible变化
watch(dialogVisible, (newVal) => {
  emit('update:visible', newVal)
  if (!newVal) {
    // 弹窗关闭时重置表单
    resetForm()
  }
})

// 监听windowData变化，更新表单数据
watch(() => props.windowData, (newVal) => {
  if (newVal) {
    updateFormData(newVal)
  }
}, { immediate: true })

// 表单数据
const form = reactive({
  id: '',
  title: '',
  type: '',
  typeText: '',
  description: ''
})

// 表单验证规则
const rules = {
  title: [
    { required: true, message: '请输入标题', trigger: 'blur' },
    { min: 1, max: 15, message: '标题长度不能超过15个字符', trigger: 'blur' }
  ]
}

// 表单引用
const formRef = ref(null)

// 加载状态
const loading = ref(false)

// 更新表单数据
const updateFormData = (windowData) => {
  form.id = String(windowData.id)
  form.title = windowData.title
  form.type = windowData.type
  form.typeText = windowData.type === 'SELF_STUDY' ? '个人' : '共享'
  form.description = windowData.description || ''
}

// 重置表单
const resetForm = () => {
  if (props.windowData) {
    updateFormData(props.windowData)
  } else {
    form.id = ''
    form.title = ''
    form.type = ''
    form.typeText = ''
    form.description = ''
  }
  if (formRef.value) {
    formRef.value.resetFields()
  }
  loading.value = false
}

// 处理取消
const handleCancel = () => {
  dialogVisible.value = false
}

// 处理提交
const handleSubmit = async () => {
  try {
    // 表单验证
    await formRef.value.validate()
    
    loading.value = true
    
    // 生成更新后的窗口数据
    const updatedWindow = {
      id: form.id,
      title: form.title,
      description: form.description,
      coverImg: props.windowData.coverImg
    }
    
    // 触发成功事件
    emit('success', updatedWindow)
    
    // 关闭弹窗
    dialogVisible.value = false
  } catch (error) {
    // 表单验证失败
    console.error('表单验证失败:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.custom-dialog {
  border-radius: 20px;
  box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.1);
}

.custom-dialog :deep(.el-dialog__header) {
  border-bottom: none;
  padding-bottom: 0;
}

.custom-dialog :deep(.el-dialog__title) {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.update-form {
  margin: 0;
}

.update-form :deep(.el-form-item__label) {
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

.custom-input :deep(.el-input__count) {
  color: #9ca3af;
  font-size: 12px;
}

.disabled-input {
  background-color: #f3f4f6;
  color: #9ca3af;
}

.custom-textarea {
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background-color: #f9fafb;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.custom-textarea:focus {
  background-color: #ffffff;
  border-color: #333333;
  box-shadow: 0 0 0 3px rgba(51, 51, 51, 0.1);
}

.custom-textarea :deep(.el-textarea__inner) {
  min-height: 88px;
}

.custom-textarea :deep(.el-input__count) {
  color: #9ca3af;
  font-size: 12px;
}

/* 底部操作区 */
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

/* 响应式设计 */
@media (max-width: 768px) {
  :deep(.el-dialog) {
    width: 90% !important;
    margin: 5vh auto !important;
  }
}
</style>