<template>
  <div class="file-manager">
    <div class="panel-header">
      <span class="header-title">本章节引用的知识库文件</span>
      <button class="add-source-btn" :disabled="isUploading" @click="triggerFileInput">
        <span v-if="isUploading" class="spin-icon">⟳</span>
        <span v-else>+ 添加文件</span>
      </button>
      <input
        ref="fileInput"
        type="file"
        style="display: none"
        accept=".txt,.md,.pdf,.doc,.docx"
        @change="handleFileChange"
      />
    </div>

    <div class="file-list">
      <div v-if="isLoading" class="file-skeleton">
        <div v-for="i in 5" :key="i" class="skeleton-item">
          <div class="skeleton-icon"></div>
          <div class="skeleton-name"></div>
        </div>
      </div>

      <template v-else>
        <div
          v-for="file in fileList"
          :key="file.id"
          class="file-item"
          :class="{ 'error-item': file.parseStatus === 3 }"
        >
          <div class="file-info">
            <span v-if="file.parseStatus === 1" class="status-icon spin-icon">⟳</span>
            <span v-else-if="file.parseStatus === 3" class="status-icon error-icon" title="解析失败">!</span>
            <span v-else class="status-icon"></span>

            <el-icon class="file-icon"><Document /></el-icon>
            <span class="file-name" :title="file.filename">{{ file.filename }}</span>
          </div>

          <button
            v-if="file.parseStatus !== 1"
            class="delete-btn"
            @click="handleDeleteFile(file.id)"
          >
            删除
          </button>
        </div>

        <div v-if="fileList.length === 0" class="empty-tip">
          暂无文件，点击右上角按钮添加资料
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { onUnmounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Document } from '@element-plus/icons-vue'
import {
  confirmFileParse,
  deleteFile,
  getActiveTasks,
  getFileList,
  getPresignUploadUrl,
  uploadFileToStorage
} from '@/shared/api/index.js'

const props = defineProps({
  windowId: {
    type: String,
    required: true
  },
  chapterId: {
    type: [String, Number],
    required: true
  }
})

const emit = defineEmits(['files-updated'])

const fileInput = ref(null)
const fileList = ref([])
const isUploading = ref(false)
const isLoading = ref(false)
let pollingTimer = null

const ALLOWED_EXTENSIONS = ['.txt', '.md', '.pdf', '.doc', '.docx']
const MAX_FILE_SIZE = 20 * 1024 * 1024

const emitFilesUpdated = () => {
  emit('files-updated', fileList.value.map(file => file.id))
}

const getOwnerId = () => {
  try {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    return userInfo.id || userInfo.userId || ''
  } catch {
    return ''
  }
}

const getFileExtension = (filename) => {
  const idx = filename.lastIndexOf('.')
  return idx >= 0 ? filename.substring(idx).toLowerCase() : ''
}

const getContentType = (filename) => {
  const ext = getFileExtension(filename)
  const types = {
    '.txt': 'text/plain',
    '.md': 'text/markdown',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  }
  return types[ext] || 'application/octet-stream'
}

const shouldContinuePolling = (parseTasks) => {
  if (!parseTasks || parseTasks.length === 0) {
    return false
  }
  return parseTasks.some(task => task.status === 0)
}

const fetchFileList = async (showLoading = true) => {
  if (!props.chapterId) {
    fileList.value = []
    emitFilesUpdated()
    return
  }

  if (showLoading) {
    isLoading.value = true
  }

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

    fileList.value = files
  } catch (error) {
    console.error('获取文件列表失败:', error)
  } finally {
    if (showLoading) {
      isLoading.value = false
    }
  }
}

const checkActiveTasks = async () => {
  try {
    const response = await getActiveTasks({
      windowId: props.windowId,
      chapterId: props.chapterId,
      type: 'DOC_PARSE',
      ownerId: getOwnerId()
    })
    const parseTasks = response.data || []

    if (!shouldContinuePolling(parseTasks)) {
      if (pollingTimer) {
        clearInterval(pollingTimer)
        pollingTimer = null
      }
      await fetchFileList(false)
      emitFilesUpdated()
    }
  } catch (error) {
    console.error('轮询解析任务失败:', error)
  }
}

const startPolling = () => {
  if (pollingTimer) {
    return
  }

  pollingTimer = setInterval(checkActiveTasks, 3000)
  checkActiveTasks()
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileChange = async (event) => {
  const file = event.target.files?.[0]
  event.target.value = ''

  if (!file) {
    return
  }

  const ext = getFileExtension(file.name)
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    ElMessage.error('仅支持 txt、md、pdf、doc、docx 格式文件')
    return
  }

  if (file.size > MAX_FILE_SIZE) {
    ElMessage.error('文件大小不能超过 20MB')
    return
  }

  await uploadFile(file)
}

const uploadFile = async (file) => {
  if (isUploading.value) {
    return
  }

  isUploading.value = true

  try {
    const presignData = await getPresignUploadUrl({
      windowId: props.windowId,
      chapterId: props.chapterId,
      filename: file.name,
      fileSize: file.size
    })

    const uploadUrl = presignData.data?.uploadUrl
    const fileId = presignData.data?.fileId
    const putResponse = await uploadFileToStorage(uploadUrl, file, getContentType(file.name))

    if (!putResponse.ok) {
      throw new Error('文件上传到存储服务失败')
    }

    await confirmFileParse(fileId)
    ElMessage.success('上传成功，文件解析中')

    await fetchFileList(false)
    emitFilesUpdated()
    startPolling()
  } catch (error) {
    console.error('上传文件失败:', error)
    ElMessage.error(`上传失败: ${error.message}`)
  } finally {
    isUploading.value = false
  }
}

const handleDeleteFile = async (fileId) => {
  try {
    await deleteFile(fileId)
    await fetchFileList(false)
    emitFilesUpdated()
  } catch (error) {
    console.error('删除文件失败:', error)
    ElMessage.error('删除文件失败')
  }
}

watch(
  () => [props.windowId, props.chapterId],
  async () => {
    await fetchFileList(true)
    emitFilesUpdated()
  },
  { immediate: true }
)

onUnmounted(() => {
  if (pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = null
  }
})
</script>

<style scoped>
.file-manager {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.panel-header {
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #F3F4F6;
}

.header-title {
  margin-left: 15px;
  font-size: 14px;
  color: #333333;
  font-weight: 500;
}

.add-source-btn {
  background-color: #FFFFFF;
  color: #333333;
  border: 1px solid #333333;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.add-source-btn:hover:not(:disabled) {
  background-color: #333333;
  color: #FFFFFF;
}

.add-source-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.file-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 8px;
  background-color: #F8F9FA;
  transition: all 0.3s ease;
}

.file-item.error-item {
  background-color: #FEE2E2;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.status-icon {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.error-icon {
  color: #F56C6C;
}

.file-icon {
  font-size: 18px;
}

.file-name {
  font-size: 14px;
  color: #333333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.delete-btn {
  background-color: transparent;
  color: #9CA3AF;
  border: none;
  cursor: pointer;
  font-size: 12px;
  opacity: 0;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.file-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  color: #F56C6C;
}

.empty-tip {
  text-align: center;
  color: #9CA3AF;
  font-size: 14px;
  padding: 40px 20px;
}

.file-skeleton {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-radius: 8px;
  background-color: #F8F9FA;
}

.skeleton-icon {
  width: 18px;
  height: 18px;
  background: linear-gradient(90deg, #E5E7EB 25%, #F3F4F6 50%, #E5E7EB 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 4px;
}

.skeleton-name {
  flex: 1;
  height: 16px;
  background: linear-gradient(90deg, #E5E7EB 25%, #F3F4F6 50%, #E5E7EB 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 4px;
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
