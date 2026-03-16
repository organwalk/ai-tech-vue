<template>
  <div class="chapter-nav">
    <div class="nav-header">
      <h2 class="nav-title">章节</h2>
    </div>
    <div class="chapter-list">
      <div 
        v-for="chapter in chapterList" 
        :key="chapter.id"
        class="chapter-item"
        :class="{ active: chapter.id === activeChapterId }"
        @click="handleChapterClick(chapter.id)"
      >
        <div class="chapter-title">{{ chapter.title }}</div>
        <div class="chapter-summary">{{ chapter.contentSummary || '暂无摘要' }}</div>
      </div>
      <div v-if="chapterList.length === 0 && !isLoading" class="empty-tip">
        暂无章节
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { getChapterList } from '@/shared/api/index.js'

const props = defineProps({
  windowId: {
    type: String,
    required: true
  },
  activeChapterId: {
    type: [String, Number],
    default: null
  }
})

const emit = defineEmits(['chapter-select'])

const chapterList = ref([])
const isLoading = ref(false)

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

const handleChapterClick = (chapterId) => {
  emit('chapter-select', chapterId)
}

watch(() => props.windowId, () => {
  if (props.windowId) {
    fetchChapterList()
  }
}, { immediate: true })

onMounted(() => {
  fetchChapterList()
})
</script>

<style scoped>
.chapter-nav {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.nav-header {
  padding: 16px;
  border-bottom: 1px solid #E5E7EB;
}

.nav-title {
  font-size: 16px;
  font-weight: 600;
  color: #333333;
  margin: 0;
}

.chapter-list {
  flex: 1;
  overflow-y: auto;
}

.chapter-item {
  padding: 16px;
  border-bottom: 1px solid #F3F4F6;
  cursor: pointer;
  transition: all 0.2s ease;
}

.chapter-item:hover {
  background-color: #F9FAFB;
}

.chapter-item.active {
  background-color: #F3F4F6;
  border-left: 3px solid #333333;
  padding-left: 13px;
}

.chapter-title {
  font-size: 14px;
  font-weight: 500;
  color: #333333;
  margin-bottom: 8px;
}

.chapter-summary {
  font-size: 12px;
  color: #9CA3AF;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-tip {
  text-align: center;
  color: #9CA3AF;
  font-size: 14px;
  padding: 40px 20px;
}
</style>
