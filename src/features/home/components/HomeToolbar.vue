<template>
  <div class="sub-header">
    <div class="sub-header-container">
      <!-- 左侧分类切换 -->
      <div class="tabs">
        <button
          class="tab-button"
        >
          全部
        </button>
      </div>
      
      <!-- 右侧操作 -->
      <div class="actions">
        <!-- 加入窗口按钮 -->
        <el-button
          :icon="Key"
          class="join-btn"
          @click="handleJoin"
          round
        >
          加入窗口
        </el-button>
        
        <!-- 新建按钮 -->
        <el-button
          type="primary"
          :icon="Plus"
          class="create-btn"
          @click="handleCreate"
          round
        >
          新建
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineEmits } from 'vue'
import { Plus, Key } from '@element-plus/icons-vue'

const emit = defineEmits(['create', 'join'])

const handleCreate = () => {
  emit('create')
}

const handleJoin = () => {
  emit('join')
}
</script>

<style scoped>
.sub-header {
  background-color: var(--card-bg);
  border-bottom: 1px solid rgba(0,0,0,0.05);
}

.sub-header-container {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 0 24px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* 左侧标签 */
.tabs {
  display: flex;
  gap: 32px;
}

.tab-button {
  background: none;
  border: none;
  font-size: 14px;
  color: var(--text-primary);
  padding: 8px 0;
  cursor: pointer;
  transition: var(--transition);
}

.tab-button:hover {
  color: var(--hover-color);
}

/* 右侧操作 */
.actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 加入窗口按钮 - 幽灵按钮风格 */
.join-btn {
  background-color: #FFFFFF;
  color: #333333;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 8px 20px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
}

.join-btn:hover {
  background-color: #f9fafb;
  border-color: #d1d5db;
  color: #333333;
}

.join-btn:active {
  transform: scale(0.97);
}

.join-btn .el-icon {
  font-size: 14px;
}

/* 新建按钮 */
.create-btn {
  background-color: #333333;
  color: #FFFFFF;
  border-color: #333333;
  border-radius: 8px;
  padding: 8px 20px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(51, 51, 51, 0.25);
  font-weight: 500;
}

.create-btn:hover {
  background-color: #1f2937;
  border-color: #1f2937;
  box-shadow: 0 6px 16px rgba(51, 51, 51, 0.35);
}

.create-btn:active {
  transform: scale(0.97);
  box-shadow: 0 2px 8px rgba(51, 51, 51, 0.2);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sub-header-container {
    padding: 0 16px;
    flex-wrap: wrap;
    height: auto;
    padding-top: 12px;
    padding-bottom: 12px;
    gap: 12px;
  }
  
  .tabs {
    gap: 24px;
  }
  
  .actions {
    gap: 12px;
  }
  
  .create-btn {
    padding: 6px 16px;
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .tabs {
    gap: 16px;
  }
  
  .tab-button {
    font-size: 13px;
  }
  
  .actions {
    gap: 8px;
  }
  
  .create-btn {
    padding: 6px 12px;
    font-size: 13px;
  }
}
</style>
