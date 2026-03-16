<template>
  <el-dialog
    v-model="dialogVisible"
    :show-close="false"
    width="50%"
    top="5vh"
    class="guide-preview-dialog"
    style="overflow-y:auto;max-height: 90vh; border-radius: 15px; padding: 35px;"
  >
    <template #header>
      <div class="dialog-header">
        <span class="dialog-title">学习指南</span>
      </div>
    </template>

    <div v-if="isLoading" class="loading-content">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>加载中...</span>
    </div>

    <div v-else class="guide-content">
      <MarkdownContent
        v-if="guideContent"
        :content="guideContent"
      />
      <div v-else class="empty-content">
        暂无内容
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import MarkdownContent from '@/shared/components/content/MarkdownContent.vue'
import { getGuideDetail } from '@/shared/api/index.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  guideId: {
    type: [String, Number],
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const isLoading = ref(false)
const guideContent = ref('')

watch(() => props.modelValue, (val) => {
  if (val && props.guideId) {
    fetchGuideDetail()
  }
})

const fetchGuideDetail = async () => {
  isLoading.value = true
  try {
    const res = await getGuideDetail(props.guideId)
    guideContent.value = res.data?.content || ''
  } catch (error) {
    console.error('获取指南详情失败:', error)
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.guide-preview-dialog :deep(.el-dialog) {
  border-radius: 16px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.guide-preview-dialog :deep(.el-dialog__header) {
  padding: 20px 24px;
  border-bottom: 1px solid #F3F4F6;
  flex-shrink: 0;
}

.guide-preview-dialog :deep(.el-dialog__body) {
  padding: 24px;
  min-height: 200px;
  max-height: calc(90vh - 140px);
  overflow-y: auto;
  flex: 1;
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

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px;
  color: #909399;
}

.loading-content .el-icon {
  font-size: 32px;
}

.guide-content {
  min-height: 200px;
  max-height: 100%;
  overflow-y: auto;
}

.empty-content {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: #9CA3AF;
  font-size: 14px;
}
</style>
