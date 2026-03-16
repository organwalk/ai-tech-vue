<template>
  <div class="markdown-content">
    <div class="markdown-body" v-html="renderedContent"></div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import MarkdownIt from 'markdown-it'
import katex from 'katex'
import 'katex/dist/katex.min.css'

const props = defineProps({
  content: {
    type: String,
    default: ''
  }
})

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
})

const renderContent = (content) => {
  if (!content) return ''
  
  let processed = content
  
  processed = processed.replace(/\$\$([\s\S]+?)\$\$/g, (match, tex) => {
    try {
      return katex.renderToString(tex.trim(), { displayMode: true, throwOnError: false })
    } catch (e) {
      return match
    }
  })
  
  processed = processed.replace(/\$([^\$\n]+?)\$/g, (match, tex) => {
    try {
      return katex.renderToString(tex.trim(), { displayMode: false, throwOnError: false })
    } catch (e) {
      return match
    }
  })
  
  return md.render(processed)
}

const renderedContent = computed(() => {
  return renderContent(props.content)
})
</script>

<style scoped>
.markdown-content {
  height: 100%;
  overflow-y: auto;
  padding-right: 8px;
  display: flex;
  flex-direction: column;
}

.markdown-body {
  color: #333333;
  line-height: 1.8;
  font-size: 14px;
}

.markdown-body :deep(h1) {
  font-size: 24px;
  font-weight: 600;
  margin: 20px 0 12px;
  color: #1a1a1a;
}

.markdown-body :deep(h2) {
  font-size: 20px;
  font-weight: 600;
  margin: 18px 0 10px;
  color: #2a2a2a;
}

.markdown-body :deep(h3) {
  font-size: 16px;
  font-weight: 600;
  margin: 16px 0 8px;
  color: #3a3a3a;
}

.markdown-body :deep(p) {
  margin: 12px 0;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  padding-left: 24px;
  margin: 12px 0;
}

.markdown-body :deep(li) {
  margin: 6px 0;
}

.markdown-body :deep(code) {
  background-color: #f5f5f5;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
}

.markdown-body :deep(pre) {
  background-color: #f5f5f5;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 12px 0;
}

.markdown-body :deep(pre code) {
  background: none;
  padding: 0;
}

.markdown-body :deep(blockquote) {
  border-left: 4px solid #e0e0e0;
  padding-left: 16px;
  margin: 12px 0;
  color: #666666;
}

.markdown-body :deep(a) {
  color: #1890ff;
  text-decoration: none;
}

.markdown-body :deep(a:hover) {
  text-decoration: underline;
}

.markdown-body :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 12px 0;
}

.markdown-body :deep(th),
.markdown-body :deep(td) {
  border: 1px solid #e0e0e0;
  padding: 8px 12px;
  text-align: left;
}

.markdown-body :deep(th) {
  background-color: #f5f5f5;
  font-weight: 600;
}

.markdown-body :deep(.katex-display) {
  margin: 16px 0;
  overflow-x: auto;
}

.markdown-body :deep(.katex) {
  font-size: 1.1em;
}
</style>
