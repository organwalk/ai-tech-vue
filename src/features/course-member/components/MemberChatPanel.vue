<template>
  <div class="chat-panel">
    <div class="panel-header">
      <h2 class="panel-title">对话</h2>
    </div>

    <div v-if="!chapterId" class="chat-disabled">
      <el-icon class="disabled-icon"><Position /></el-icon>
      <div class="disabled-text">选择章节后即可开始对话</div>
    </div>

    <template v-else>
      <div class="chat-messages" ref="chatMessagesRef" @scroll="handleScroll">
        <div v-if="isLoadingMore" class="loading-more">
          <div class="loading-spinner"></div>
          <span>加载历史消息中...</span>
        </div>

        <div v-if="!hasMoreData && messages.length > 0" class="no-more-data">
          没有更多历史消息了
        </div>

        <div v-for="(message, index) in messages" :key="message.id || index" class="message-wrapper">
          <div
            class="message-item"
            :class="{ 'user-message': message.role === 'user', 'ai-message': message.role === 'assistant' || message.role === 'ai' }"
          >
            <div class="message-content">
              <div v-if="message.isThinking" class="thinking-animation">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <div v-else class="message-text markdown-body" v-html="renderContent(message.content)"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="chat-input-area">
        <textarea
          ref="chatInputRef"
          v-model="inputMessage"
          class="chat-input"
          :placeholder="inputPlaceholder"
          :disabled="isLoading || isFileDisabled"
          rows="1"
          @keydown="handleKeyDown"
        ></textarea>
        <button
          class="send-btn"
          :disabled="isLoading || !inputMessage.trim() || isFileDisabled"
          @click="handleSend"
        >
          发送
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { Position } from '@element-plus/icons-vue'
import MarkdownIt from 'markdown-it'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import { getChatHistory as getChatHistoryRequest, sendChatMessageStream } from '@/shared/api/index.js'
import { consumeJsonEventStream } from '@/shared/utils/eventStream.js'

const props = defineProps({
  windowId: {
    type: String,
    required: true
  },
  chapterId: {
    type: [String, Number],
    default: null
  },
  selectedFileIds: {
    type: Array,
    default: () => []
  }
})

const chatMessagesRef = ref(null)
const chatInputRef = ref(null)
const messages = ref([])
const inputMessage = ref('')
const isLoading = ref(false)
const pageNum = ref(1)
const pageSize = ref(5)
const isLoadingMore = ref(false)
const hasMoreData = ref(true)
const messageCache = ref(new Map())

const isFileDisabled = computed(() => !props.selectedFileIds || props.selectedFileIds.length === 0)
const inputPlaceholder = computed(() => {
  if (!props.chapterId) {
    return '请先选择章节'
  }
  if (isFileDisabled.value) {
    return '请先选择章节资料'
  }
  return '输入消息，按 Enter 发送，Shift+Enter 换行'
})

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
})

const getCacheKey = (page) => `${props.windowId}-${props.chapterId}-${page}`

const resetPagination = () => {
  pageNum.value = 1
  hasMoreData.value = true
  isLoadingMore.value = false
}

const autoResize = () => {
  const textarea = chatInputRef.value
  if (!textarea) {
    return
  }

  textarea.style.height = 'auto'
  textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
}

watch(inputMessage, async () => {
  await nextTick()
  autoResize()
})

watch(
  () => [props.windowId, props.chapterId],
  () => {
    messages.value = []
    resetPagination()
    fetchChatHistory()
  }
)

const renderContent = (content) => {
  if (!content) {
    return ''
  }

  let processed = content

  processed = processed.replace(/\$\$([\s\S]+?)\$\$/g, (match, tex) => {
    try {
      return katex.renderToString(tex.trim(), { displayMode: true, throwOnError: false })
    } catch {
      return match
    }
  })

  processed = processed.replace(/\$([^\$\n]+?)\$/g, (match, tex) => {
    try {
      return katex.renderToString(tex.trim(), { displayMode: false, throwOnError: false })
    } catch {
      return match
    }
  })

  return md.render(processed)
}

const scrollToBottom = () => {
  nextTick(() => {
    if (chatMessagesRef.value) {
      chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight
    }
  })
}

const prependMessages = (newMessages) => {
  const container = chatMessagesRef.value
  if (!container) {
    messages.value = [...newMessages, ...messages.value]
    return
  }

  const oldScrollHeight = container.scrollHeight
  const oldScrollTop = container.scrollTop
  messages.value = [...newMessages, ...messages.value]

  nextTick(() => {
    const newScrollHeight = container.scrollHeight
    container.scrollTop = oldScrollTop + (newScrollHeight - oldScrollHeight)
  })
}

const handleScroll = () => {
  const container = chatMessagesRef.value
  if (!container || isLoadingMore.value || !hasMoreData.value) {
    return
  }

  if (container.scrollTop === 0) {
    loadMoreMessages()
  }
}

const loadMoreMessages = async () => {
  if (isLoadingMore.value || !hasMoreData.value || !props.chapterId) {
    return
  }

  const cacheKey = getCacheKey(pageNum.value)
  if (messageCache.value.has(cacheKey)) {
    prependMessages(messageCache.value.get(cacheKey))
    pageNum.value += 1
    return
  }

  isLoadingMore.value = true

  try {
    const response = await getChatHistoryRequest({
      windowId: props.windowId,
      chapterId: props.chapterId,
      pageNum: pageNum.value,
      pageSize: pageSize.value
    })
    const newMessages = response.data?.records || []

    if (newMessages.length > 0) {
      messageCache.value.set(cacheKey, newMessages)
      prependMessages(newMessages)
      pageNum.value += 1
    }

    if (newMessages.length < pageSize.value || pageNum.value > (response.data?.pages || 0)) {
      hasMoreData.value = false
    }
  } catch (error) {
    console.error('加载历史消息失败:', error)
  } finally {
    isLoadingMore.value = false
  }
}

const fetchChatHistory = async () => {
  if (!props.chapterId) {
    messages.value = []
    resetPagination()
    return
  }

  try {
    const response = await getChatHistoryRequest({
      windowId: props.windowId,
      chapterId: props.chapterId,
      pageNum: 1,
      pageSize: pageSize.value
    })

    messages.value = response.data?.records || []
    pageNum.value = 2
    hasMoreData.value = (response.data?.pages || 0) > 1

    if (messages.value.length > 0) {
      messageCache.value.set(getCacheKey(1), messages.value)
    }

    scrollToBottom()
  } catch (error) {
    console.error('获取聊天记录失败:', error)
  }
}

const handleKeyDown = (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    handleSend()
  }
}

const handleSend = async () => {
  if (!inputMessage.value.trim() || isLoading.value || !props.chapterId || isFileDisabled.value) {
    return
  }

  const userMessage = inputMessage.value.trim()
  inputMessage.value = ''

  messages.value.push({ role: 'user', content: userMessage })
  scrollToBottom()

  const aiMessageIndex = messages.value.push({
    role: 'assistant',
    content: '',
    isThinking: true
  }) - 1

  isLoading.value = true
  scrollToBottom()

  try {
    const response = await sendChatMessageStream({
      windowId: props.windowId,
      chapterId: props.chapterId,
      fileIds: props.selectedFileIds,
      content: userMessage,
      useRAG: true
    })

    messages.value[aiMessageIndex].isThinking = false

    await consumeJsonEventStream(response, {
      onDone: () => {
        isLoading.value = false
      },
      onMessage: (parsedData) => {
        messages.value[aiMessageIndex].content += parsedData.content || ''
        scrollToBottom()
      },
      onFinish: () => {
        isLoading.value = false
      },
      onParseError: (dataStr, error) => {
        console.warn('跳过无法解析的流式数据块:', dataStr, error)
      }
    })
  } catch (error) {
    console.error('发送消息失败:', error)
    if (messages.value[aiMessageIndex]) {
      messages.value[aiMessageIndex].isThinking = false
      if (!messages.value[aiMessageIndex].content) {
        messages.value[aiMessageIndex].content = '消息发送失败，请稍后重试。'
      }
    }
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchChatHistory()
})
</script>

<style scoped>
.chat-panel {
  background-color: #FFFFFF;
  border-radius: 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.panel-header {
  padding: 16px 20px;
  border-bottom: 1px solid #F3F4F6;
}

.panel-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333333;
}

.chat-disabled {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background-color: #FAFAFA;
}

.disabled-icon {
  font-size: 48px;
  margin-bottom: 16px;
  color: #D1D5DB;
}

.disabled-text {
  font-size: 14px;
  color: #9CA3AF;
  text-align: center;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  color: #9CA3AF;
  font-size: 14px;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #E5E7EB;
  border-top-color: #333333;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.no-more-data {
  text-align: center;
  padding: 8px;
  color: #9CA3AF;
  font-size: 12px;
}

.message-wrapper {
  margin-bottom: 20px;
}

.user-message {
  display: flex;
  justify-content: flex-end;
}

.ai-message {
  display: block;
  width: 100%;
}

.message-content {
  border-radius: 12px;
  padding: 12px 16px;
  word-wrap: break-word;
}

.user-message .message-content {
  background-color: #333333;
  color: #FFFFFF;
  max-width: 80%;
  border-bottom-right-radius: 4px;
}

.ai-message .message-content {
  background-color: transparent;
  color: #333333;
  width: 100%;
  padding: 8px 0;
  line-height: 1.6;
}

.thinking-animation {
  display: flex;
  gap: 4px;
  padding: 4px 0;
}

.thinking-animation span {
  width: 8px;
  height: 8px;
  background-color: #333333;
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out;
}

.thinking-animation span:nth-child(1) {
  animation-delay: -0.32s;
}

.thinking-animation span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes typing {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.message-text {
  line-height: 1.6;
  font-size: 14px;
}

.message-text :deep(h1),
.message-text :deep(h2),
.message-text :deep(h3),
.message-text :deep(h4),
.message-text :deep(h5),
.message-text :deep(h6) {
  margin: 0.5em 0;
  font-weight: 600;
}

.message-text :deep(p) {
  margin: 0.5em 0;
}

.message-text :deep(ul),
.message-text :deep(ol) {
  padding-left: 1.5em;
  margin: 0.5em 0;
}

.message-text :deep(code) {
  background-color: rgba(0, 0, 0, 0.06);
  padding: 0.2em 0.4em;
  border-radius: 4px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 0.9em;
}

.user-message .message-content .message-text :deep(code) {
  background-color: rgba(255, 255, 255, 0.15);
}

.message-text :deep(pre) {
  background-color: #282c34;
  color: #abb2bf;
  padding: 1em;
  border-radius: 8px;
  overflow-x: auto;
  margin: 0.5em 0;
}

.message-text :deep(pre code) {
  background: none;
  padding: 0;
}

.message-text :deep(blockquote) {
  border-left: 3px solid #ddd;
  margin: 0.5em 0;
  padding-left: 1em;
  color: #666;
}

.message-text :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 0.5em 0;
}

.message-text :deep(th),
.message-text :deep(td) {
  border: 1px solid #ddd;
  padding: 0.5em;
  text-align: left;
}

.message-text :deep(th) {
  background-color: #f5f5f5;
}

.message-text :deep(a) {
  color: #333333;
  text-decoration: underline;
}

.message-text :deep(img) {
  max-width: 100%;
  border-radius: 4px;
}

.message-text :deep(.katex-display) {
  margin: 0.5em 0;
  overflow-x: auto;
}

.message-text :deep(.katex) {
  font-size: 1.1em;
}

.chat-input-area {
  padding: 16px 20px;
  border-top: 1px solid #F3F4F6;
  display: flex;
  gap: 12px;
  align-items: flex-end;
  background: #FFF;
}

.chat-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  resize: none;
  font-size: 14px;
  color: #333333;
  max-height: 120px;
  line-height: 1.5;
  transition: border-color 0.2s;
}

.chat-input:focus {
  outline: none;
  border-color: #333333;
}

.chat-input:disabled {
  background-color: #F9FAFB;
  cursor: not-allowed;
}

.send-btn {
  background-color: #333333;
  color: #FFFFFF;
  border: none;
  border-radius: 12px;
  padding: 10px 20px;
  height: 44px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.send-btn:hover:not(:disabled) {
  background-color: #4B5563;
}

.send-btn:disabled {
  background-color: #D1D5DB;
  cursor: not-allowed;
}
</style>
