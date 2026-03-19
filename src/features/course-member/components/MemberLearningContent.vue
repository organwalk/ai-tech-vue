<template>
  <div class="learning-content">
          <div class="panel-header">
        <h2 class="panel-title">选项卡</h2>
      </div>
    <div v-if="!chapterId" class="empty-state">
      <el-icon class="empty-icon"><Files /></el-icon>
      <div class="empty-text">请在左侧选择章节开始学习</div>
    </div>
    <template v-else>
      <div class="content-tabs">
        <div 
          class="tab-item"
          :class="{ active: activeTab === 'docs' }"
          @click="activeTab = 'docs'"
        >
          知识文档
        </div>
        <div 
          class="tab-item"
          :class="{ active: activeTab === 'guides' }"
          @click="activeTab = 'guides'"
        >
          学习指南
        </div>
        <div 
          class="tab-item"
          :class="{ active: activeTab === 'quizzes' }"
          @click="activeTab = 'quizzes'"
        >
          测试卡片
        </div>
      </div>
      <div class="tab-content">
        <MemberDocsTab
          v-if="activeTab === 'docs'"
          :window-id="windowId"
          :chapter-id="chapterId"
          @file-ids-change="handleFileIdsChange"
        />
        <MemberGuidesTab
          v-if="activeTab === 'guides'"
          :window-id="windowId"
          :chapter-id="chapterId"
        />
        <MemberQuizzesTab
          v-if="activeTab === 'quizzes'"
          :window-id="windowId"
          :chapter-id="chapterId"
        />
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { Files } from '@element-plus/icons-vue'
import MemberDocsTab from '@/features/course-member/components/tabs/MemberDocsTab.vue'
import MemberGuidesTab from '@/features/course-member/components/tabs/MemberGuidesTab.vue'
import MemberQuizzesTab from '@/features/course-member/components/tabs/MemberQuizzesTab.vue'

const props = defineProps({
  windowId: {
    type: String,
    required: true
  },
  chapterId: {
    type: [String, Number],
    default: null
  }
})

const emit = defineEmits(['file-ids-change'])

const activeTab = ref('docs')

watch(() => props.chapterId, (newChapterId, oldChapterId) => {
  if (newChapterId !== oldChapterId && newChapterId) {
    activeTab.value = 'docs'
  }
})

const handleFileIdsChange = (fileIds) => {
  emit('file-ids-change', fileIds)
}
</script>

<style scoped>
.learning-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #F8F9FA;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.empty-icon {
  font-size: 40px;
  margin-bottom: 16px;
  color: #9CA3AF;
}

.empty-icon::before {
  font-size: 64px;
}

.empty-text {
  font-size: 16px;
  color: #9CA3AF;
}

.panel-header {
  padding: 16px 24px;
  background-color: #FFFFFF;
  border-bottom: 1px solid #E5E7EB;
  flex-shrink: 0;
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
  color: #333333;
  margin: 0;
}

.content-tabs {
  display: flex;
  background-color: #FFFFFF;
  border-bottom: 1px solid #E5E7EB;
  padding: 0 16px;
}

.tab-item {
  padding: 16px 20px;
  font-size: 14px;
  color: #9CA3AF;
  cursor: pointer;
  position: relative;
  transition: color 0.2s ease;
}

.tab-item:hover {
  color: #666666;
}

.tab-item.active {
  color: #333333;
  font-weight: 600;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background-color: #333333;
}

.tab-content {
  flex: 1;
  overflow-y: auto;
}
</style>
