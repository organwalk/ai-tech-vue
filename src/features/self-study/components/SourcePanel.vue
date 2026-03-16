<template>
  <div class="source-panel">
    <div class="panel-header">
      <h2 class="panel-title">来源</h2>
      <button class="add-source-btn" @click="triggerFileInput" :disabled="isUploading">
        <span v-if="isUploading" class="spin-icon">⏳</span>
        <span v-else>+ 添加来源</span>
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
      <div v-for="file in fileList" :key="file.id" class="file-item" :class="{ 'error-item': file.status === 3 }">
        <div class="file-info">
          <!-- 状态 1: 加载中 (无勾选框) -->
          <span v-if="file.parseStatus === 1" class="status-icon spin-icon">⏳</span>
          
          <!-- 状态 3: 失败 (无勾选框) -->
          <span v-else-if="file.parseStatus === 3" class="status-icon error-icon" title="解析失败">⚠️</span>
          
          <!-- 状态 2: 成功 (展示勾选框) -->
          <input 
            v-else
            type="checkbox" 
            :checked="isSelected(file.id)"
            @change="toggleFile(file.id)"
            class="file-checkbox custom-checkbox"
          />
          
          <el-icon class="file-icon"><Document /></el-icon>
          <span class="file-name" :title="file.filename">{{ file.filename }}</span>
        </div>
        
        <button v-if="file.status !== 1" class="delete-btn" @click="handleDeleteFile(file.id)">
          删除
        </button>
      </div>
      
      <div v-if="fileList.length === 0" class="empty-tip">
        暂无来源，点击上方按钮添加文档
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, defineProps, defineEmits } from 'vue'
import { ElMessage } from 'element-plus'
import { Document } from '@element-plus/icons-vue'
import {
  confirmFileParse,
  deleteFile,
  getAllActiveTasks,
  getFileList,
  getPresignUploadUrl,
  uploadFileToStorage
} from '@/shared/api/index.js'

const props = defineProps({
  windowId: {
    type: String,
    required: true
  },
  selectedFileIds: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:selectedFileIds'])

const fileInput = ref(null)
const fileList = ref([])
const isUploading = ref(false)
let pollingTimer = null

const ALLOWED_EXTENSIONS = ['.txt', '.md', '.pdf', '.doc', '.docx']
const MAX_FILE_SIZE = 20 * 1024 * 1024

const getFileExtension = (filename) => {
  const idx = filename.lastIndexOf('.')
  return idx >= 0 ? filename.substring(idx).toLowerCase() : ''
}

const fetchFileList = async () => {
  try {
    const data = await getFileList({ windowId: props.windowId })
    let files = []

    if (Array.isArray(data)) {
      files = data
    } else if (data?.data) {
      files = data.data || []
    }

    const currentSelected = new Set(props.selectedFileIds)
    const knownFileIds = new Set(fileList.value.map(file => String(file.id)))
    let shouldUpdateSelected = false

    files.forEach(file => {
      const fileId = String(file.id)
      if (!knownFileIds.has(fileId)) {
        currentSelected.add(fileId)
        shouldUpdateSelected = true
      }
    })

    fileList.value = files

    if (shouldUpdateSelected) {
      emit('update:selectedFileIds', Array.from(currentSelected))
    }
  } catch (error) {
    console.error('获取文件列表失败:', error)
  }
}

const isSelected = (fileId) => {
  return props.selectedFileIds.includes(String(fileId))
}

const toggleFile = (fileId) => {
  const newSelected = [...props.selectedFileIds]
  const index = newSelected.indexOf(String(fileId))
  if (index > -1) {
    newSelected.splice(index, 1)
  } else {
    newSelected.push(String(fileId))
  }
  emit('update:selectedFileIds', newSelected)
}

const startPolling = () => {
  if (pollingTimer) return

  pollingTimer = setInterval(async () => {
    try {
      const data = await getAllActiveTasks(props.windowId)
      const parseTasks = data.data?.parseTasks || []
      const hasParsing = parseTasks.some(task => task.status === 0)

      if (!hasParsing) {
        if (pollingTimer) {
          clearInterval(pollingTimer)
          pollingTimer = null
        }
        await fetchFileList()
      }
    } catch (error) {
      console.error('轮询解析任务失败:', error)
    }
  }, 3000)
}

const triggerFileInput = () => {
  fileInput.value.click()
}

const handleFileChange = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  const ext = getFileExtension(file.name)
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    ElMessage.error('仅支持 txt、md、pdf、doc、docx 格式文件')
    event.target.value = ''
    return
  }

  if (file.size > MAX_FILE_SIZE) {
    ElMessage.error('文件大小不能超过 20MB')
    event.target.value = ''
    return
  }

  event.target.value = ''
  await uploadFile(file)
}

const uploadFile = async (file) => {
  if (isUploading.value) return
  isUploading.value = true

  try {
    const presignData = await getPresignUploadUrl({
      windowId: props.windowId,
      filename: file.name,
      fileSize: file.size
    })

    const uploadUrl = presignData.data.uploadUrl
    const fileId = presignData.data.fileId
    const contentType = getContentType(file.name)

    const putResponse = await uploadFileToStorage(uploadUrl, file, contentType)

    if (!putResponse.ok) {
      throw new Error('上传文件失败')
    }

    await confirmFileParse(fileId)

    ElMessage.success('文件上传成功，正在解析...')

    await fetchFileList()
    startPolling()
  } catch (error) {
    console.error('上传文件失败:', error)
    ElMessage.error('上传失败: ' + error.message)
  } finally {
    isUploading.value = false
  }
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

const handleDeleteFile = async (fileId) => {
  try {
    await deleteFile(fileId)

    const newSelected = props.selectedFileIds.filter(id => id !== String(fileId))
    emit('update:selectedFileIds', newSelected)

    await fetchFileList()
  } catch (error) {
    console.error('删除文件失败:', error)
    ElMessage.error('删除失败')
  }
}

onMounted(() => {
  fetchFileList()
})

onUnmounted(() => {
  if (pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = null
  }
})
</script>


<style scoped>
.source-panel {
  background-color: #FFFFFF;
  border-radius: 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.panel-header {
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #F3F4F6;
}

.panel-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333333;
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

.add-source-btn:hover {
  background-color: #333333;
  color: #FFFFFF;
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

.file-item.error {
  background-color: #FEE2E2;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #333333;
}

.file-checkbox:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.status-icon {
  font-size: 14px;
}

.file-icon {
  font-size: 18px;
}

.file-name {
  font-size: 14px;
  color: #333333;
}

.delete-btn {
  background-color: transparent;
  color: #9CA3AF;
  border: none;
  cursor: pointer;
  font-size: 12px;
  opacity: 0;
  transition: all 0.3s ease;
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
</style>
