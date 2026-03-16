<template>
  <div class="docs-tab">
    <div class="docs-list">
      <div v-if="isLoading" class="loading-tip">加载中...</div>
      <template v-else>
        <div 
          v-for="file in fileList" 
          :key="file.id" 
          class="doc-item"
        >
          <div class="doc-info">
            <el-icon class="doc-icon"><Document /></el-icon>
            <span class="doc-name" :title="file.filename">{{ file.filename }}</span>
          </div>
          <el-button 
            v-if="file.downloadUrl" 
            type="text"
            class="download-btn"
            @click="handleDownload(file.downloadUrl, file.filename)"
          >
            下载
          </el-button>
        </div>
        <div v-if="fileList.length === 0" class="empty-tip">
          暂无文档
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { ElButton } from 'element-plus'
import { Document } from '@element-plus/icons-vue'
import { fetchDownloadFile, getFileList } from '@/shared/api/index.js'

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

const emit = defineEmits(['file-ids-change'])

const fileList = ref([])
const isLoading = ref(false)

const fetchFileList = async () => {
  isLoading.value = true
  try {
    const res = await getFileList({ windowId: props.windowId, chapterId: props.chapterId })
    let files = []

    if (Array.isArray(res)) {
      files = res
    } else if (res.data) {
      files = res.data || []
    }

    fileList.value = files
    emit('file-ids-change', files.map(file => file.id))
  } catch (error) {
    console.error('获取文件列表失败:', error)
  } finally {
    isLoading.value = false
  }
}

const handleDownload = async (url, filename) => {
  if (!url) return

  try {
    const response = await fetchDownloadFile(url)

    if (!response.ok) {
      throw new Error('下载失败')
    }

    const blob = await response.blob()
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl

    const contentDisposition = response.headers.get('Content-Disposition')
    let downloadFilename = filename || 'download'
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/i)
      if (filenameMatch && filenameMatch[1]) {
        downloadFilename = filenameMatch[1]
      }
    }

    link.download = downloadFilename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)
  } catch (error) {
    console.error('下载失败:', error)
  }
}

watch(() => props.chapterId, () => {
  if (props.chapterId) {
    fetchFileList()
  }
}, { immediate: true })

onMounted(() => {
  fetchFileList()
})
</script>

<style scoped>
.docs-tab {
  padding: 16px;
  height: 100%;
}

.docs-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.doc-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #FFFFFF;
  border-radius: 12px;
  border: 1px solid #E5E7EB;
  transition: all 0.2s ease;
}

.doc-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.doc-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.doc-icon {
  font-size: 20px;
}

.doc-name {
  font-size: 14px;
  color: #333333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.download-btn {
  width: 60px;
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.doc-item:hover .download-btn {
  opacity: 1;
}

.download-btn:hover {
  
  background-color: #F3F4F6;
}

.loading-tip {
  text-align: center;
  color: #9CA3AF;
  font-size: 14px;
  padding: 40px;
}

.empty-tip {
  text-align: center;
  color: #9CA3AF;
  font-size: 14px;
  padding: 40px;
}
</style>
