<template>
  <div class="member-workspace">
    <div class="workspace-main">
      <div class="left-panel">
        <MemberChapterNav
          :window-id="windowId"
          :active-chapter-id="activeChapterId"
          @chapter-select="handleChapterSelect"
        />
      </div>
      <div class="center-panel">
        <MemberLearningContent
          :window-id="windowId"
          :chapter-id="activeChapterId"
          @file-ids-change="handleFileIdsChange"
        />
      </div>
      <div class="right-panel">
        <MemberChatPanel
          :window-id="windowId"
          :chapter-id="activeChapterId"
          :selected-file-ids="selectedFileIds"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import MemberChapterNav from '@/features/course-member/components/MemberChapterNav.vue'
import MemberLearningContent from '@/features/course-member/components/MemberLearningContent.vue'
import MemberChatPanel from '@/features/course-member/components/MemberChatPanel.vue'

const route = useRoute()

const windowId = ref(route.params.windowId)
const inviteCode = ref(route.params.inviteCode || '')
const activeChapterId = ref(null)
const selectedFileIds = ref([])

const handleChapterSelect = (chapterId) => {
  activeChapterId.value = chapterId
}

const handleFileIdsChange = (fileIds) => {
  selectedFileIds.value = fileIds
}

watch(activeChapterId, (newChapterId, oldChapterId) => {
  if (newChapterId !== oldChapterId) {
    selectedFileIds.value = []
  }
})
</script>

<style scoped>
.member-workspace {
  height: 90vh;
  background-color: #F8F9FA;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.workspace-main {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.left-panel {
  width: 20%;
  min-width: 200px;
  background-color: #FFFFFF;
  border-right: 1px solid #E5E7EB;
  overflow-y: auto;
}

.center-panel {
  width: 30%;
  min-width: 300px;
  overflow-y: auto;
}

.right-panel {
  width: 50%;
  min-width: 400px;
  background-color: #FFFFFF;
  border-left: 1px solid #E5E7EB;
  overflow: hidden;
}
</style>
