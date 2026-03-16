<template>
  <div class="chapter-panel">
    <div v-if="activeTab === 'chapter'" class="tab-content">
      <template v-if="!selectedChapter">
        <div class="chapter-header">
          <span class="header-title">以下是本课程的章节列表</span>
          <button class="add-chapter-btn" @click="handleCreateChapter">
            + 添加章节
          </button>
        </div>

        <div class="chapter-list">
          <div
            v-for="chapter in chapterList"
            :key="chapter.id"
            class="chapter-item"
          >
            <div class="chapter-main" @click="handleChapterClick(chapter)">
              <div class="chapter-info">
                <div class="chapter-title">{{ chapter.title }}</div>
                <div class="chapter-summary">{{ chapter.contentSummary || '暂无摘要' }}</div>
              </div>
            </div>
          </div>

          <div v-if="chapterList.length === 0 && !isLoading" class="empty-list">
            暂无章节
          </div>
        </div>
      </template>

      <template v-else>
        <div class="chapter-detail">
          <div class="detail-header">
            <div class="back-btn" @click="handleBackToList">
              <span class="back-icon">←</span>
              <span class="back-text">返回章节列表</span>
            </div>
            <div class="detail-title-row">
              <h2 class="detail-title">{{ selectedChapter.title }}</h2>
              <div class="detail-actions">
                <el-button text class="action-btn" @click="handleEditChapterInDetail">修改</el-button>
                <el-button text class="action-btn delete-btn" @click="handleDeleteChapterInDetail">删除</el-button>
              </div>
            </div>
          </div>

          <div class="detail-tabs">
            <div
              class="detail-tab-item"
              :class="{ active: detailTab === 'files' }"
              @click="detailTab = 'files'"
            >
              挂载文档
            </div>
            <div
              class="detail-tab-item"
              :class="{ active: detailTab === 'guide' }"
              @click="detailTab = 'guide'"
            >
              挂载指南
            </div>
            <div
              class="detail-tab-item"
              :class="{ active: detailTab === 'quiz' }"
              @click="detailTab = 'quiz'"
            >
              挂载试题
            </div>
            <div
              class="detail-tab-item"
              :class="{ active: detailTab === 'feedback' }"
              @click="detailTab = 'feedback'"
            >
              反馈列表
            </div>
          </div>

          <div class="detail-content">
            <ChapterFileManager
              v-if="detailTab === 'files'"
              :window-id="windowId"
              :chapter-id="selectedChapter.id"
              @files-updated="handleFilesUpdated"
            />
            <ChapterGuideManager
              v-else-if="detailTab === 'guide'"
              :window-id="windowId"
              :chapter-id="selectedChapter.id"
            />
            <ChapterQuizManager
              v-else-if="detailTab === 'quiz'"
              :window-id="windowId"
              :chapter-id="selectedChapter.id"
            />
            <ChapterFeedbackManager
              v-else-if="detailTab === 'feedback'"
              :window-id="windowId"
              :chapter-id="selectedChapter.id"
            />
          </div>
        </div>
      </template>
    </div>

    <div v-else class="tab-content">
      <MemberManagePanel :window-id="windowId" />
    </div>

    <ChapterFormDialog
      v-model="showFormDialog"
      :chapter="selectedChapter"
      :window-id="windowId"
      @success="handleFormSuccess"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ChapterFormDialog from '@/features/course-owner/components/dialogs/ChapterFormDialog.vue'
import ChapterFileManager from '@/features/course-owner/components/ChapterFileManager.vue'
import ChapterQuizManager from '@/features/course-owner/components/ChapterQuizManager.vue'
import ChapterFeedbackManager from '@/features/course-owner/components/ChapterFeedbackManager.vue'
import ChapterGuideManager from '@/features/course-owner/components/ChapterGuideManager.vue'
import MemberManagePanel from '@/features/course-owner/components/MemberManagePanel.vue'
import { getChapterList, deleteChapter } from '@/shared/api/index.js'

const props = defineProps({
  windowId: {
    type: String,
    required: true
  },
  activeTab: {
    type: String,
    default: 'chapter'
  }
})

const emit = defineEmits(['chapter-selected'])

const detailTab = ref('files')
const chapterList = ref([])
const isLoading = ref(false)
const showFormDialog = ref(false)
const selectedChapter = ref(null)

const fetchChapterList = async () => {
  isLoading.value = true
  try {
    const res = await getChapterList(props.windowId)
    chapterList.value = res.data || []
  } catch (error) {
    console.error('获取章节列表失败:', error)
  } finally {
    isLoading.value = false
  }
}

const handleCreateChapter = () => {
  selectedChapter.value = null
  showFormDialog.value = true
}

const handleChapterClick = (chapter) => {
  selectedChapter.value = chapter
  detailTab.value = 'files'
  emit('chapter-selected', chapter)
}

const handleBackToList = () => {
  selectedChapter.value = null
  emit('chapter-selected', null)
}

const handleChapterCommand = (command, chapter) => {
  if (command === 'edit') {
    handleEditChapter(chapter)
  } else if (command === 'delete') {
    handleDeleteChapter(chapter.id)
  }
}

const handleEditChapter = (chapter) => {
  selectedChapter.value = chapter
  showFormDialog.value = true
}

const handleEditChapterInDetail = () => {
  showFormDialog.value = true
}

const handleDeleteChapterInDetail = async () => {
  if (!selectedChapter.value) return
  
  try {
    await ElMessageBox.confirm('确定要删除该章节吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await deleteChapter(selectedChapter.value.id)
    ElMessage.success('删除成功')
    handleBackToList()
    fetchChapterList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除章节失败:', error)
    }
  }
}

const handleDeleteChapter = async (chapterId) => {
  try {
    await ElMessageBox.confirm('确定要删除该章节吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await deleteChapter(chapterId)
    ElMessage.success('删除成功')
    fetchChapterList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除章节失败:', error)
    }
  }
}

const handleFormSuccess = () => {
  fetchChapterList()
  showFormDialog.value = false
}

const handleFilesUpdated = (fileIds) => {
  const chapter = selectedChapter.value
  if (chapter) {
    emit('chapter-selected', { ...chapter, fileIds })
  }
}

onMounted(() => {
  fetchChapterList()
})
</script>

<style scoped>
.chapter-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.tab-content {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.chapter-header {
  padding: 16px;
  border-bottom: 1px solid #F3F4F6;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  font-size: 14px;
  color: #333333;
  font-weight: 500;
}

.add-chapter-btn {
  padding: 8px 16px;
  background-color: #333333;
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.add-chapter-btn:hover {
  background-color: #555555;
}

.chapter-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.chapter-item {
  display: flex;
  align-items: stretch;
  border-radius: 12px;
  background-color: #FFFFFF;
  border: 1px solid #E5E7EB;
  margin-bottom: 12px;
  overflow: hidden;
  transition: all 0.2s;
}

.chapter-item:hover {
  background-color: #F9FAFB;
}

.chapter-main {
  flex: 1;
  padding: 16px;
  cursor: pointer;
}

.chapter-info {
  flex: 1;
  min-width: 0;
}

.chapter-title {
  font-size: 14px;
  font-weight: 600;
  color: #333333;
  margin-bottom: 8px;
}

.chapter-summary {
  font-size: 13px;
  color: #9CA3AF;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.action-btn {
  padding: 4px 8px;
  font-size: 13px;
  color: #646a73;
}

.action-btn:hover {
  color: #333333;
}

.action-btn.delete-btn {
  color: #F56C6C;
}

.action-btn.delete-btn:hover {
  color: #F56C6C;
}

.more-btn {
  padding: 4px;
  color: #9CA3AF;
}

.more-btn:hover {
  color: #666666;
}

.empty-list {
  text-align: center;
  color: #9CA3AF;
  font-size: 14px;
  padding: 40px 20px;
}

:deep(.delete-item) {
  color: #F56C6C;
}

.chapter-detail {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.detail-header {
  padding: 16px;
  border-bottom: 1px solid #F3F4F6;
}

.detail-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.detail-actions {
  display: flex;
  gap: 8px;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #646A73;
  font-size: 13px;
  cursor: pointer;
  margin-bottom: 12px;
  transition: color 0.2s;
}

.back-btn:hover {
  color: #333333;
}

.back-icon {
  font-size: 14px;
}

.detail-title {
  font-size: 18px;
  font-weight: 600;
  color: #333333;
  margin: 0;
  flex: 1;
}

.detail-tabs {
  display: flex;
  padding: 0 16px;
  border-bottom: 1px solid #F3F4F6;
}

.detail-tab-item {
  padding: 12px 16px;
  font-size: 14px;
  color: #9CA3AF;
  cursor: pointer;
  position: relative;
  transition: color 0.2s;
}

.detail-tab-item.active {
  color: #333333;
  font-weight: 600;
}

.detail-tab-item.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 16px;
  right: 16px;
  height: 2px;
  background-color: #333333;
}

.detail-tab-item:hover:not(.active) {
  color: #666666;
}

.detail-content {
  flex: 1;
  overflow-y: auto;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
}

.empty-text {
  color: #9CA3AF;
  font-size: 14px;
}
</style>
