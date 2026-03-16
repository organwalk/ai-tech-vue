<template>
  <div class="owner-workspace">
    <div class="workspace-header">
      <div class="header-tabs">
        <div
          class="tab-item"
          :class="{ active: activeTab === 'chapter' }"
          @click="activeTab = 'chapter'"
        >
          章节
        </div>
        <div
          class="tab-item"
          :class="{ active: activeTab === 'member' }"
          @click="activeTab = 'member'"
        >
          人员
        </div>
      </div>
      <div class="invite-code-badge" @click="handleCopyInviteCode">
        <span class="invite-label">课程邀请码：</span>
        <span class="invite-code">{{ inviteCode }}</span>
        <el-icon class="copy-icon"><CopyDocument /></el-icon>
      </div>
    </div>
    <div class="workspace-main">
      <div class="left-panel">
        <ChapterManagePanel
          :window-id="windowId"
          :active-tab="activeTab"
          @chapter-selected="handleChapterSelected"
        />
      </div>
      <div class="right-panel">
        <OwnerChatPanel
          :window-id="windowId"
          :chapter-id="selectedChapterId"
          :file-ids="selectedFileIds"
          :active-tab="activeTab"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { CopyDocument } from '@element-plus/icons-vue'
import ChapterManagePanel from '@/features/course-owner/components/ChapterManagePanel.vue'
import OwnerChatPanel from '@/features/course-owner/components/OwnerChatPanel.vue'
import { getFileList } from '@/shared/api/index.js'

const route = useRoute()
const windowId = ref(route.params.windowId)
const inviteCode = ref(route.params.inviteCode || '')
const activeTab = ref('chapter')
const selectedChapterId = ref(null)
const selectedFileIds = ref([])

const handleCopyInviteCode = async () => {
  try {
    await navigator.clipboard.writeText(inviteCode.value)
    ElMessage.success('邀请码已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
    ElMessage.error('复制失败')
  }
}

const handleChapterSelected = async (chapter) => {
  selectedChapterId.value = chapter ? chapter.id : null
  if (chapter) {
    if (chapter.fileIds && chapter.fileIds.length > 0) {
      selectedFileIds.value = chapter.fileIds
    } else {
      await fetchChapterFiles(chapter.id)
    }
  } else {
    selectedFileIds.value = []
  }
}

const fetchChapterFiles = async (chapterId) => {
  try {
    const data = await getFileList({ windowId: windowId.value, chapterId })
    let files = []

    if (Array.isArray(data)) {
      files = data
    } else if (data?.data) {
      files = data.data || []
    }

    selectedFileIds.value = files.map(file => file.id)
  } catch (error) {
    console.error('获取章节文件列表失败:', error)
    selectedFileIds.value = []
  }
}
</script>

<style scoped>
.owner-workspace {
  width: 100%;
  height: 90vh;
  background-color: #F8F9FA;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.workspace-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background-color: #FFFFFF;
  border-bottom: 1px solid #F3F4F6;
}

.header-tabs {
  display: flex;
  gap: 24px;
}

.tab-item {
  font-size: 14px;
  color: #9CA3AF;
  cursor: pointer;
  padding: 8px 0;
  position: relative;
  transition: color 0.2s;
}

.tab-item.active {
  color: #333333;
  font-weight: 600;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background-color: #333333;
}

.tab-item:hover:not(.active) {
  color: #666666;
}

.invite-code-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  background-color: #f3f4f6;
  border-radius: 99px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.invite-code-badge:hover {
  background-color: #e5e7eb;
}

.invite-label {
  font-size: 13px;
  color: #646a73;
}

.invite-code {
  font-size: 14px;
  font-weight: 600;
  color: #333333;
  font-family: monospace;
}

.copy-icon {
  font-size: 14px;
  color: #333333;
}

.workspace-main {
  flex: 1;
  display: flex;
  gap: 16px;
  padding: 16px;
  overflow: hidden;
}

.left-panel {
  flex: 1;
  background-color: #FFFFFF;
  border-radius: 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.right-panel {
  flex: 1;
  background-color: #FFFFFF;
  border-radius: 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>