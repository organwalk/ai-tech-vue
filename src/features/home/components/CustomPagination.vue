<template>
  <div class="pagination-wrapper">
    <div class="total-info" v-if="showTotal">共 {{ total }} 项</div>
    <div class="pagination-pill">
      <button
        class="pagination-btn prev-btn"
        :class="{ disabled: currentPage === 1 }"
        @click="handlePrev"
        :disabled="currentPage === 1"
      >
        <svg viewBox="0 0 1024 1024" width="12" height="12">
          <path d="M724 218.3V141c0-6.7-7.7-10.4-12.9-6.3L260.3 486.8c-16.4 12.8-16.4 37.5 0 50.3l450.8 352.1c5.3 4.1 12.9 0.4 12.9-6.3v-77.3c0-4.9-2.3-9.6-6.1-12.6l-360-281 360-281.1c3.8-3 6.1-7.7 6.1-12.6z" fill="currentColor"/>
        </svg>
      </button>
      
      <template v-for="(page, index) in pageNumbers" :key="index">
        <span v-if="page === '...'" class="ellipsis">...</span>
        <button
          v-else
          class="pagination-btn page-btn"
          :class="{ active: page === currentPage }"
          @click="handlePageChange(page)"
        >
          {{ page }}
        </button>
      </template>
      
      <button
        class="pagination-btn next-btn"
        :class="{ disabled: currentPage === totalPages }"
        @click="handleNext"
        :disabled="currentPage === totalPages"
      >
        <svg viewBox="0 0 1024 1024" width="12" height="12">
          <path d="M763.7 486.8L312.9 134.7c-5.3-4.1-12.9-0.4-12.9 6.3v77.3c0 4.9 2.3 9.6 6.1 12.6l360 281.1-360 281.1c-3.9 3-6.1 7.7-6.1 12.6V883c0 6.7 7.7 10.4 12.9 6.3l450.8-352.1c16.4-12.8 16.4-37.6 0-50.4z" fill="currentColor"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  total: {
    type: Number,
    required: true
  },
  pageSize: {
    type: Number,
    default: 20
  },
  currentPage: {
    type: Number,
    default: 1
  },
  showTotal: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:currentPage', 'change'])

const totalPages = computed(() => {
  return Math.ceil(props.total / props.pageSize)
})

const pageNumbers = computed(() => {
  const total = totalPages.value
  const current = props.currentPage
  
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  
  if (current <= 4) {
    return [1, 2, 3, 4, 5, '...', total]
  }
  
  if (current >= total - 3) {
    return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
  }
  
  return [1, '...', current - 1, current, current + 1, '...', total]
})

const handlePageChange = (page) => {
  if (page === props.currentPage) return
  emit('update:currentPage', page)
  emit('change', page)
}

const handlePrev = () => {
  if (props.currentPage > 1) {
    handlePageChange(props.currentPage - 1)
  }
}

const handleNext = () => {
  if (props.currentPage < totalPages.value) {
    handlePageChange(props.currentPage + 1)
  }
}
</script>

<style scoped>
.pagination-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 40px;
  margin-bottom: 20px;
  gap: 16px;
}

.total-info {
  font-size: 13px;
  color: #9ca3af;
  font-weight: 400;
}

.pagination-pill {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px;
  background-color: #f9fafb;
  border: 1px solid #f3f4f6;
  border-radius: 999px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}

.pagination-btn {
  min-width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
  color: #646a73;
  cursor: pointer;
  border: none;
  outline: none;
  background: transparent;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 0;
}

.pagination-btn:hover:not(.disabled):not(.active) {
  background-color: #e5e7eb;
  color: #333333;
}

.pagination-btn.active {
  background-color: #333333;
  color: #ffffff;
  box-shadow: 0 4px 10px rgba(51, 51, 51, 0.25);
  font-weight: 600;
}

.pagination-btn.disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.pagination-btn.disabled:hover {
  background-color: transparent;
  color: #646a73;
}

.ellipsis {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  color: #9ca3af;
  letter-spacing: 2px;
  font-size: 14px;
  font-weight: 400;
  cursor: default;
  user-select: none;
}

.prev-btn svg,
.next-btn svg {
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.prev-btn:not(.disabled):hover svg,
.next-btn:not(.disabled):hover svg {
  transform: translateX(-2px);
}

.next-btn:not(.disabled):hover svg {
  transform: translateX(2px);
}
</style>
