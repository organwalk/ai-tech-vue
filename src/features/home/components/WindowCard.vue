<template>
  <div class="window-card" :class="cardBgClass" @click="handleClick" @mouseenter="isHovering = true" @mouseleave="isHovering = false">
    <!-- 顶部图示区域 -->
    <div class="card-header">
      <div class="icon-wrapper">
        <el-icon class="card-icon">
          <Collection v-if="data.type === 'COURSE'" />
          <Monitor v-else-if="data.type === 'SELF_STUDY'" />
        </el-icon>
      </div>
      
      <!-- 右上角操作菜单 -->
      <div v-if="data.role === 'OWNER'" class="card-actions">
        <el-dropdown @command="handleAction">
          <el-button type="text" class="action-btn">
            <el-icon><More /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="edit">修改</el-dropdown-item>
              <el-dropdown-item command="delete" class="delete-item">删除</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
    
    <!-- 内容区域 -->
    <div class="card-content-wrapper">
      <div class="card-body">
        <h3 class="card-title">{{ data.title }}</h3>
        <p v-if="data.description" class="card-description">{{ data.description }}</p>
      </div>
      
      <!-- 底部信息栏 -->
      <div class="card-footer">
        <span class="card-time">{{ formatTime(data.createTime) }}</span>
        <span v-if="data.type === 'COURSE'" class="card-members">
          <el-icon><UserFilled /></el-icon>
          {{ data.memberCount }} 名成员
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue'
import { More, UserFilled, Collection, Reading, Monitor, EditPen } from '@element-plus/icons-vue'

// 定义属性
const props = defineProps({
  data: {
    type: Object,
    required: true,
    validator: (value) => {
      return ['id', 'title', 'description', 'type', 'role', 'memberCount', 'createTime'].every(key => key in value)
    }
  }
})

// 定义事件
const emit = defineEmits(['edit', 'delete', 'click'])

// 悬停状态
const isHovering = ref(false)

// 根据类型生成卡片背景类名
const cardBgClass = computed(() => {
  return props.data.type === 'COURSE' ? 'card-bg-course' : 'card-bg-self'
})

// 格式化时间
const formatTime = (timeString) => {
  const date = new Date(timeString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}年${month}月${day}日`
}

// 处理操作
const handleAction = (command) => {
  if (command === 'edit') {
    emit('edit', props.data)
  } else if (command === 'delete') {
    emit('delete', String(props.data.id))
  }
}

// 处理点击卡片
const handleClick = () => {
  emit('click', props.data)
}
</script>

<style scoped>
.window-card {
  border-radius: var(--card-radius);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  position: relative;
  transform: translateY(0);
}

/* 卡片背景 - 燕麦拿铁色调 */
.card-bg-course {
  background: linear-gradient(145deg, #FFFFFF 0%, #F5F4F0 100%);
  border: 1px solid #EAE8E1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}

/* 卡片背景 - 冰川雾海色调 */
.card-bg-self {
  background: linear-gradient(145deg, #FFFFFF 0%, #F0F2F5 100%);
  border: 1px solid #E5E7EB;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}

.window-card:hover {
  transform: translateY(-4px);
}

.card-bg-course:hover {
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.06);
}

.card-bg-self:hover {
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.06);
}

/* 顶部图示区域 */
.card-header {
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background: transparent;
}

.icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: #FFFFFF;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-icon {
  font-size: 24px;
  color: #333333;
}

/* 操作按钮 */
.card-actions {
  position: absolute;
  top: 12px;
  right: 12px;
  opacity: 0;
  transition: var(--transition);
}

.window-card:hover .card-actions {
  opacity: 1;
}

.action-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.8);
  transition: var(--transition);
}

.action-btn:hover {
  background-color: rgba(255, 255, 255, 1);
}

/* 内容区域 */
.window-card {
  display: flex;
  flex-direction: column;
}

.card-content-wrapper {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.card-body {
  padding: 16px;
  flex: 1;
  min-height: 0;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-description {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 底部信息栏 */
.card-footer {
  padding: 0 16px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: auto;
}

.card-members {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 删除菜单项 */
:deep(.delete-item) {
  color: #F56C6C;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .card-header {
    height: 100px;
  }
  
  .card-icon {
    font-size: 40px;
  }
  
  .card-body {
    padding: 12px;
  }
  
  .card-title {
    font-size: 15px;
  }
  
  .card-footer {
    padding: 0 12px 12px;
  }
}
</style>