<template>
  <div class="home-container">
    <!-- 功能工具栏 -->
    <SubHeader
      @create="handleCreate"
      @join="handleJoin"
    />
    
    <!-- 窗口内容区 -->
    <div 
      class="content-container"
      v-loading="loading"
      element-loading-text="加载中..."
    >
      <div class="content-grid">
        <!-- 新建窗口占位卡片：只在有数据时显示 -->
        <div v-if="filteredWindows.length > 0" class="create-card" @click="handleCreate">
          <div class="icon-wrapper">
            <svg viewBox="0 0 1024 1024" width="24" height="24">
              <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm192 472c0 4.4-3.6 8-8 8H544v152c0 4.4-3.6 8-8 8h-48c-4.4 0-8-3.6-8-8V544H328c-4.4 0-8-3.6-8-8v-48c0-4.4 3.6-8 8-8h152V328c0-4.4 3.6-8 8-8h48c4.4 0 8 3.6 8 8v152h152c4.4 0 8 3.6 8 8v48z" fill="#333333"/>
            </svg>
          </div>
          <div class="text-group">
            <h3 class="create-title">新建窗口</h3>
            <p class="create-subtitle">创建个人学习或共享空间</p>
          </div>
        </div>
        
        <!-- 窗口卡片列表 -->
        <WindowCard
          v-for="window in filteredWindows"
          :key="window.id"
          :data="window"
          @edit="handleEdit"
          @delete="handleDelete"
          @click="handleClick"
        />
      </div>
      
      <!-- 空状态 -->
      <div v-if="!loading && filteredWindows.length === 0" class="empty-state">
        <h3 class="empty-title">暂无窗口</h3>
        <p class="empty-description">点击下方按钮创建您的第一个窗口</p>
        <div class="empty-actions">
          <el-button type="primary" @click="handleCreate">立即创建</el-button>
          <el-button class="join-btn" @click="handleJoin">加入现有窗口</el-button>
        </div>
      </div>
    </div>
    
    <!-- 分页组件 -->
    <CustomPagination
      v-if="total > 0"
      :total="total"
      :page-size="pageSize"
      v-model:current-page="pageNum"
      @change="handlePageChange"
    />
    
    <!-- 新建窗口弹窗 -->
    <CreateWindowDialog
      v-model:visible="createDialogVisible"
      @success="handleCreateSuccess"
    />
    
    <!-- 加入窗口弹窗 -->
    <JoinWindowDialog
      v-model:visible="joinDialogVisible"
      @success="handleJoinSuccess"
    />
    
    <!-- 修改窗口弹窗 -->
    <UpdateWindowDialog
      v-model:visible="updateDialogVisible"
      :window-data="currentWindow"
      @success="handleUpdateSuccess"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import SubHeader from '@/features/home/components/HomeToolbar.vue'
import WindowCard from '@/features/home/components/WindowCard.vue'
import CustomPagination from '@/features/home/components/CustomPagination.vue'
import CreateWindowDialog from '@/features/home/components/dialogs/CreateWindowDialog.vue'
import JoinWindowDialog from '@/features/home/components/dialogs/JoinWindowDialog.vue'
import UpdateWindowDialog from '@/features/home/components/dialogs/UpdateWindowDialog.vue'
import { getWindowList, createWindow, updateWindow, deleteWindow } from '@/shared/api/index.js'
import { ElMessageBox, ElMessage } from 'element-plus'

const router = useRouter()

// 状态管理
const sortBy = ref('recent')
const createDialogVisible = ref(false)
const joinDialogVisible = ref(false)
const updateDialogVisible = ref(false)
const currentWindow = ref(null)
const windows = ref([])
const loading = ref(false)
const pageNum = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 根据标签筛选窗口
const filteredWindows = computed(() => {
  let result = [...windows.value]
  
  // 排序
  result.sort((a, b) => {
    if (sortBy.value === 'recent') {
      return new Date(b.createTime) - new Date(a.createTime)
    } else if (sortBy.value === 'name') {
      return a.title.localeCompare(b.title)
    } else if (sortBy.value === 'type') {
      return a.type.localeCompare(b.type)
    }
    return 0
  })
  
  return result
})

// 组件挂载时获取窗口列表
onMounted(() => {
  fetchWindows()
})

// 获取窗口列表
const fetchWindows = async () => {
  try {
    loading.value = true
    const response = await getWindowList({ pageNum: pageNum.value, pageSize: pageSize.value })
    windows.value = response.data?.dataList || []
    total.value = response.data?.total || 0
  } catch (error) {
    console.error('获取窗口列表失败:', error)
    ElMessage.error('获取窗口列表失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 处理排序切换
const handleSortChange = (value) => {
  sortBy.value = value
}

// 处理新建窗口
const handleCreate = () => {
  createDialogVisible.value = true
}

// 处理加入窗口
const handleJoin = () => {
  joinDialogVisible.value = true
}

// 处理编辑窗口
const handleEdit = (window) => {
  currentWindow.value = window
  updateDialogVisible.value = true
}

// 处理删除窗口
const handleDelete = (id) => {
  ElMessageBox.confirm('确定要删除这个窗口吗？', '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteWindow(id)
      ElMessage.success('删除成功')
      // 重新获取窗口列表
      await fetchWindows()
    } catch (error) {
      console.error('删除窗口失败:', error)
      ElMessage.error('删除窗口失败，请稍后重试')
    }
  }).catch(() => {
    // 取消删除
  })
}

// 处理点击卡片跳转
const handleClick = (window) => {
  if (window.type === 'COURSE') {
    if (window.role === 'OWNER') {
      const inviteCode = window.inviteCode || 'default'
      router.push(`/ai-tech/share/owner/window/${window.id}/${inviteCode}`)
    } else {
      const inviteCode = window.inviteCode || 'default'
      router.push(`/ai-tech/share/member/window/${window.id}/${inviteCode}`)
    }
  } else {
    router.push(`/ai-tech/self/window/${window.id}`)
  }
}

// 处理创建成功
const handleCreateSuccess = async (newWindow) => {
  try {
    // 调用创建窗口API
    await createWindow(newWindow)
    ElMessage.success('创建成功')
    // 重新获取窗口列表
    await fetchWindows()
  } catch (error) {
    console.error('创建窗口失败:', error)
    ElMessage.error('创建窗口失败，请稍后重试')
  }
}

// 处理加入成功
const handleJoinSuccess = async () => {
  // 重新获取窗口列表
  await fetchWindows()
}

// 处理更新成功
const handleUpdateSuccess = async (updatedWindow) => {
  try {
    await updateWindow(updatedWindow)
    ElMessage.success('更新成功')
    await fetchWindows()
  } catch (error) {
    console.error('更新窗口失败:', error)
    ElMessage.error('更新窗口失败，请稍后重试')
  }
}

// 处理分页变化
const handlePageChange = (page) => {
  pageNum.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
  fetchWindows()
}
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  background-color: var(--bg-color);
}

/* 内容容器 */
.content-container {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 24px;
  min-height: calc(100vh - 120px);
  position: relative;
}

/* 网格布局 */
.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--card-gap);
}

/* 新建窗口卡片 */
.create-card {
  background-color: #fafafa;
  border: 2px dashed #e5e7eb;
  border-radius: 16px;
  padding: 48px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 280px;
}

.create-card:hover {
  background-color: #ffffff;
  border: 2px solid #333333;
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.06);
}

.create-card:active {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.04);
}

.icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.create-card:hover .icon-wrapper {
  box-shadow: 0 6px 16px rgba(51, 51, 51, 0.15);
}

.text-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.create-title {
  font-size: 16px;
  font-weight: 600;
  color: #333333;
  margin: 0;
}

.create-subtitle {
  font-size: 13px;
  color: #9ca3af;
  margin: 0;
  text-align: center;
}

/* 空状态 */
.empty-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  padding: 48px;
  background-color: var(--card-bg);
  border-radius: var(--card-radius);
  box-shadow: var(--shadow-normal);
  min-width: 400px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-title {
  font-size: 20px;
  font-weight: 500;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}

.empty-description {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0 0 24px 0;
}

.empty-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.empty-actions .join-btn {
  background-color: #FFFFFF;
  color: #333333;
  border: 1px solid #333333;
}

.empty-actions .join-btn:hover {
  background-color: #F3F4F6;
  border-color: #555555;
  color: #555555;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .content-container {
    padding: 16px;
  }
  
  .content-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 16px;
  }
  
  .create-card {
    min-height: 240px;
    padding: 32px 16px;
  }
  
  .empty-state {
    min-width: 300px;
    padding: 32px;
  }
  
  .content-grid.list-layout .window-card {
    flex-direction: column;
    height: auto;
  }
  
  .content-grid.list-layout .card-header {
    width: 100%;
    height: 120px;
  }
}

@media (max-width: 480px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
  
  .empty-state {
    min-width: 280px;
    padding: 24px;
  }
}
</style>