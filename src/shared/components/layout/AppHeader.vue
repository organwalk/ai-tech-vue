<template>
  <header class="global-header">
    <div class="header-inner">
      <!-- 左侧：品牌区 (点击回首页) -->
      <div class="brand-area" @click="goHome">
        <el-icon class="brand-icon"><MagicStick /></el-icon>
        <span class="brand-text">AI-Tech</span>
      </div>

      <!-- 右侧：用户区 -->
      <div class="user-area">
        <div class="user-profile-trigger" @click="openProfile">
          <span class="user-name" :title="userInfo.nickname">{{ userInfo.nickname || '未登录' }}</span>
          <el-avatar
            :size="32"
            :src="userInfo.avatar"
            class="user-avatar"
          >
            {{ userInfo.nickname ? userInfo.nickname.charAt(0).toUpperCase() : 'U' }}
          </el-avatar>
        </div>
      </div>
    </div>

    <!-- 用户信息编辑对话框 -->
    <UserInfoDialog
      v-model:visible="dialogVisible"
      :user-info="userInfo"
      @success="handleUpdateSuccess"
    />
  </header>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { MagicStick } from '@element-plus/icons-vue'
import UserInfoDialog from '@/features/profile/components/UserInfoDialog.vue'

const router = useRouter()
const userInfo = ref({
  nickname: '',
  avatar: '',
  userId: null
})

const dialogVisible = ref(false)

onMounted(() => {
  const storedUser = localStorage.getItem('userInfo')
  if (storedUser) {
    try {
      const parsed = JSON.parse(storedUser)
      userInfo.value.nickname = parsed.nickname || '用户'
      userInfo.value.avatar = parsed.avatar || ''
      userInfo.value.userId = parsed.id || parsed.userId || null
    } catch (e) {
      console.error('解析用户信息失败:', e)
    }
  }
})

const goHome = () => {
  router.push('/ai-tech')
}

const openProfile = () => {
  dialogVisible.value = true
}

const handleUpdateSuccess = (data) => {
  userInfo.value.nickname = data.nickname
  localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
}
</script>

<style scoped>
.global-header {
  height: 64px;
  background-color: #ffffff;
  border-bottom: 1px solid #f0f0f0;
  position: sticky;
  top: 0;
  z-index: 100;
  box-sizing: border-box;
}

.header-inner {
  max-width: 100%;
  height: 100%;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.brand-area {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.brand-area:hover {
  opacity: 0.7;
}

.brand-icon {
  font-size: 20px;
  color: #333333;
}

.brand-text {
  font-size: 18px;
  font-weight: 600;
  color: #333333;
  letter-spacing: 0.5px;
}

.user-area {
  display: flex;
  align-items: center;
}

.user-profile-trigger {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 8px 4px 12px;
  border-radius: 99px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.user-profile-trigger:hover {
  background-color: #f9fafb;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #4b5563;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-avatar {
  background-color: #e5e7eb;
  color: #646a73;
  font-weight: 600;
}
</style>
