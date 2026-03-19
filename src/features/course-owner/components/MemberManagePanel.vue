<template>
  <div class="member-panel">
    <div class="panel-header">
      <span class="header-title">课程成员</span>
    </div>

    <div class="member-content">
      <div v-if="isLoading" class="member-grid">
        <div v-for="i in 4" :key="i" class="member-card skeleton">
          <div class="skeleton-avatar"></div>
          <div class="skeleton-info">
            <div class="skeleton-name"></div>
            <div class="skeleton-email"></div>
          </div>
        </div>
      </div>

      <div v-else-if="memberList.length > 0" class="member-grid">
        <div
          v-for="member in memberList"
          :key="member.id"
          class="member-card"
          :class="{ clickable: member.role !== 'OWNER' }"
          @click="handleMemberClick(member)"
        >
          <div class="member-avatar">
            <img v-if="member.avatar" :src="member.avatar" alt="avatar" />
            <span v-else class="avatar-text">{{ getAvatarText(member.nickname) }}</span>
          </div>
          <div class="member-info">
            <div class="member-name-row">
              <span class="member-name">{{ member.nickname }}</span>
              <span class="role-badge" :class="getRoleClass(member.role)">
                {{ getRoleText(member.role) }}
              </span>
            </div>
            <div class="member-email">{{ member.email }}</div>
          </div>
          <button
            v-if="member.role !== 'OWNER'"
            class="remove-btn"
            @click.stop="handleRemoveMember(member.id)"
          >
            移除
          </button>
        </div>
      </div>

      <div v-else class="empty-tip">
        暂无成员数据
      </div>
    </div>

    <LearnerDetailDialog
      v-model:visible="learnerDialogVisible"
      :member-info="selectedMember"
      :window-id="windowId"
    />
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import LearnerDetailDialog from '@/features/course-owner/components/dialogs/LearnerDetailDialog.vue'
import { getMemberList, removeMember } from '@/shared/api/index.js'

const props = defineProps({
  windowId: {
    type: String,
    required: true
  }
})

const memberList = ref([])
const isLoading = ref(false)
const learnerDialogVisible = ref(false)
const selectedMember = ref({})

const fetchMemberList = async () => {
  isLoading.value = true
  try {
    const response = await getMemberList(props.windowId)
    memberList.value = response.data || []
  } catch (error) {
    console.error('获取成员列表失败:', error)
  } finally {
    isLoading.value = false
  }
}

const getAvatarText = (nickname) => {
  if (!nickname) {
    return '?'
  }
  return nickname.charAt(0)
}

const getRoleText = (role) => {
  if (role === 'OWNER') {
    return '创建者'
  }
  return '成员'
}

const getRoleClass = (role) => {
  if (role === 'OWNER') {
    return 'role-owner'
  }
  return 'role-student'
}

const handleMemberClick = (member) => {
  if (member.role === 'OWNER') {
    return
  }
  selectedMember.value = member
  learnerDialogVisible.value = true
}

const handleRemoveMember = async (memberId) => {
  try {
    await ElMessageBox.confirm('确定要移除该成员吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await removeMember(memberId)
    ElMessage.success('移除成功')
    fetchMemberList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('移除成员失败:', error)
    }
  }
}

onMounted(() => {
  fetchMemberList()
})
</script>

<style scoped>
.member-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 16px 24px;
  border-bottom: 1px solid #F3F4F6;
}

.header-title {
  font-size: 14px;
  font-weight: 600;
  color: #333333;
}

.member-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.member-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.member-card {
  background-color: #ffffff;
  border: 1px solid #f3f4f6;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.3s ease;
  position: relative;
}

.member-card.clickable {
  cursor: pointer;
}

.member-card.clickable:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.04);
}

.member-card.clickable:hover .remove-btn {
  opacity: 1;
}

.member-card:not(.clickable) {
  cursor: default;
}

.remove-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px 12px;
  background-color: transparent;
  color: #F56C6C;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.remove-btn:hover {
  background-color: #FEF2F2;
}

.member-card.skeleton {
  background-color: #f8f9fa;
}

.skeleton-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
}

.skeleton-info {
  flex: 1;
}

.skeleton-name {
  height: 16px;
  width: 80px;
  background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 4px;
  margin-bottom: 8px;
}

.skeleton-email {
  height: 12px;
  width: 120px;
  background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
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

.member-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background-color: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.member-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-text {
  font-size: 18px;
  font-weight: 600;
  color: #333333;
  text-transform: uppercase;
}

.member-info {
  flex: 1;
  min-width: 0;
}

.member-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.member-name {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.role-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 99px;
  flex-shrink: 0;
}

.role-owner {
  background-color: #333333;
  color: #ffffff;
}

.role-student {
  background-color: #f3f4f6;
  color: #4b5563;
}

.member-email {
  font-size: 13px;
  color: #9ca3af;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-tip {
  text-align: center;
  color: #9ca3af;
  font-size: 14px;
  padding: 40px 20px;
}
</style>
