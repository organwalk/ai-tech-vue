<template>
  <div class="workspace-container">
    <div class="workspace-main">
      <SourcePanel
        :parse-tasks="parseTasks"
        :window-id="windowId"
        v-model:selected-file-ids="selectedFileIds"
      />
      <ChatPanel
        :window-id="windowId"
        :selected-file-ids="selectedFileIds"
      />
      <StudioPanel
        :notification-tasks="notificationTasks"
        :window-id="windowId"
        :selected-file-ids="selectedFileIds"
        @start-polling="startPolling"
        @refresh-tasks="fetchActiveTasks"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import SourcePanel from '@/features/self-study/components/SourcePanel.vue'
import ChatPanel from '@/features/self-study/components/ChatPanel.vue'
import StudioPanel from '@/features/self-study/components/StudioPanel.vue'
import { getAllActiveTasks } from '@/shared/api/index.js'

const route = useRoute()
const windowId = ref(route.params.windowId)
const parseTasks = ref([])
const notificationTasks = ref([])
const selectedFileIds = ref([])
let pollingTimer = null

const shouldContinuePolling = () => {
  const parseEmpty = !parseTasks.value || parseTasks.value.length === 0
  const notificationEmpty = !notificationTasks.value || notificationTasks.value.length === 0

  if (parseEmpty && notificationEmpty) {
    return false
  }

  const hasRunningParseTask = parseTasks.value.some(task => task.status === 0)
  const hasRunningNotificationTask = notificationTasks.value.some(task => task.status === 0)

  return hasRunningParseTask || hasRunningNotificationTask
}

const fetchActiveTasks = async () => {
  try {
    const response = await getAllActiveTasks(windowId.value)

    parseTasks.value = response.data?.parseTasks || []
    notificationTasks.value = response.data?.notificationTasks || []

    if (!shouldContinuePolling() && pollingTimer) {
      clearInterval(pollingTimer)
      pollingTimer = null
    }
  } catch (error) {
    console.error('??????:', error)
  }
}

const startPolling = () => {
  if (!pollingTimer) {
    fetchActiveTasks()
    pollingTimer = setInterval(fetchActiveTasks, 5000)
  }
}

onMounted(() => {
  fetchActiveTasks()
  pollingTimer = setInterval(fetchActiveTasks, 5000)
})

onUnmounted(() => {
  if (pollingTimer) {
    clearInterval(pollingTimer)
  }
})
</script>

<style scoped>
.workspace-container {
  width: 100%;
  height: 90vh;
  background-color: #F8F9FA;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.workspace-main {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  gap: 16px;
  padding: 16px;
  min-height: 0;
}
</style>
