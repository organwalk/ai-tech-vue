<template>
  <div id="app">
    <Header v-if="!$route.meta.hideHeader" />
    <div class="progress-container">
      <transition name="progress-fade">
        <el-progress
          v-if="isRouting"
          :indeterminate="true"
          :duration="1"
          :percentage="50"
          :show-text="false"
          :stroke-width="2"
          color="#333333"
        />
      </transition>
    </div>
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import Header from '@/shared/components/layout/AppHeader.vue'

const route = useRoute()
const isRouting = ref(false)

window.__isRouting = isRouting
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: Arial, sans-serif;
  background-color: #FFFFFF;
  color: #333;
}

#app {
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.progress-container {
  height: 2px;
  background-color: #f3f4f6;
  overflow: hidden;
}

.progress-container .el-progress {
  position: absolute;
  width: 100%;
}

.progress-container .el-progress-bar__outer {
  background-color: transparent !important;
  border-radius: 0 !important;
}

.progress-fade-enter-active,
.progress-fade-leave-active {
  transition: opacity 0.3s ease;
}

.progress-fade-enter-from,
.progress-fade-leave-to {
  opacity: 0;
}
</style>
