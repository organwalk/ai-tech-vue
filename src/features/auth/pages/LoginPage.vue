<template>
  <div class="login-container">
    <!-- 左侧品牌区 -->
    <div class="brand-section">
      <div class="brand-content">
        <el-icon class="brand-icon"><MagicStick /></el-icon>
        <div class="brand-text">AI-Tech Space</div>
      </div>
    </div>

    <!-- 右侧表单区 -->
    <div class="form-section">
      <div class="form-wrapper">
        <div class="form-header">
          <h1 class="form-title">欢迎回来</h1>
          <p class="form-subtitle">请输入您的邮箱进行登录或注册</p>
        </div>

        <el-form
          ref="loginForm"
          :model="form"
          :rules="rules"
          label-position="top"
          hide-required-asterisk
          class="login-form"
        >
          <el-form-item prop="email">
            <div class="email-input-wrapper">
              <el-input
                v-model="form.email"
                type="email"
                placeholder="请输入邮箱地址"
                @input="handleEmailInput"
                @blur="handleEmailBlur"
                class="custom-input"
              />
              <button
                type="button"
                class="code-btn"
                :disabled="!canSendCode"
                @click="handleSendCode"
              >
                {{ sendCodeButtonText }}
              </button>
            </div>
          </el-form-item>

          <el-form-item prop="code">
            <el-input
              v-model="form.code"
              placeholder="请输入验证码"
              maxlength="6"
              inputmode="numeric"
              @input="handleCodeInput"
              class="custom-input"
            />
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              @click="handleLogin"
              :loading="loggingIn"
              :disabled="loggingIn"
              class="login-button"
            >
              登录
            </el-button>
          </el-form-item>
        </el-form>

        <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { MagicStick } from '@element-plus/icons-vue'
import { login, sendCode, setToken, setUserInfo } from '@/shared/api/index.js'
import { ElMessage } from 'element-plus'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const CODE_REGEX = /^\d{6}$/
const CODE_LENGTH = 6
const SEND_CODE_COUNTDOWN_SECONDS = 60
const SEND_CODE_THROTTLE_MS = 1000

const router = useRouter()

const form = reactive({
  email: '',
  code: ''
})

const validateEmail = (_rule, value, callback) => {
  const email = typeof value === 'string' ? value.trim() : ''

  if (!email) {
    callback(new Error('请输入邮箱地址'))
    return
  }

  if (!EMAIL_REGEX.test(email)) {
    callback(new Error('请输入正确的邮箱格式'))
    return
  }

  callback()
}

const validateCode = (_rule, value, callback) => {
  const code = typeof value === 'string' ? value.trim() : ''

  if (!code) {
    callback(new Error('请输入验证码'))
    return
  }

  if (!CODE_REGEX.test(code)) {
    callback(new Error('请输入6位数字验证码'))
    return
  }

  callback()
}

const rules = {
  email: [
    { validator: validateEmail, trigger: ['blur', 'change'] }
  ],
  code: [
    { validator: validateCode, trigger: ['blur', 'change'] }
  ]
}

const countdown = ref(0)
const sendingCode = ref(false)
const sendCodeThrottled = ref(false)
const loggingIn = ref(false)
const errorMessage = ref('')
const loginForm = ref(null)
let countdownTimer = null
let sendCodeThrottleTimer = null

const normalizedEmail = computed(() => form.email.trim())
const isEmailValid = computed(() => EMAIL_REGEX.test(normalizedEmail.value))
const canSendCode = computed(() => {
  return isEmailValid.value && !sendingCode.value && !sendCodeThrottled.value && countdown.value === 0
})
const sendCodeButtonText = computed(() => {
  if (sendingCode.value) {
    return '发送中...'
  }

  if (countdown.value > 0) {
    return `${countdown.value}s`
  }

  return '获取验证码'
})

const clearErrorMessage = () => {
  errorMessage.value = ''
}

const normalizeCode = (value) => {
  return String(value ?? '')
    .replace(/\D/g, '')
    .slice(0, CODE_LENGTH)
}

const normalizeEmailField = () => {
  form.email = normalizedEmail.value
}

const clearCountdownTimer = () => {
  if (!countdownTimer) {
    return
  }

  clearInterval(countdownTimer)
  countdownTimer = null
}

const clearSendCodeThrottleTimer = () => {
  if (!sendCodeThrottleTimer) {
    return
  }

  clearTimeout(sendCodeThrottleTimer)
  sendCodeThrottleTimer = null
}

const startSendCodeThrottle = () => {
  sendCodeThrottled.value = true
  clearSendCodeThrottleTimer()
  sendCodeThrottleTimer = window.setTimeout(() => {
    sendCodeThrottled.value = false
    clearSendCodeThrottleTimer()
  }, SEND_CODE_THROTTLE_MS)
}

const startCountdown = () => {
  clearCountdownTimer()
  countdown.value = SEND_CODE_COUNTDOWN_SECONDS
  countdownTimer = window.setInterval(() => {
    if (countdown.value <= 1) {
      countdown.value = 0
      clearCountdownTimer()
      return
    }

    countdown.value -= 1
  }, 1000)
}

const getErrorMessage = (error, fallbackMessage) => {
  return error?.response?.data?.message
    || error?.response?.data?.data?.message
    || error?.message
    || fallbackMessage
}

const handleEmailInput = () => {
  clearErrorMessage()
}

const handleEmailBlur = () => {
  normalizeEmailField()
}

const handleCodeInput = (value) => {
  form.code = normalizeCode(value)
  clearErrorMessage()
}

const handleSendCode = async () => {
  if (!canSendCode.value) {
    return
  }

  startSendCodeThrottle()
  normalizeEmailField()
  clearErrorMessage()

  try {
    await loginForm.value?.validateField('email')
  } catch {
    errorMessage.value = '请先输入正确的邮箱地址'
    return
  }

  try {
    sendingCode.value = true

    await sendCode(form.email)
    ElMessage.success('验证码已发送到您的邮箱')
    startCountdown()
  } catch (error) {
    errorMessage.value = getErrorMessage(error, '发送验证码失败，请稍后重试')
  } finally {
    sendingCode.value = false
  }
}

const handleLogin = async () => {
  if (loggingIn.value) {
    return
  }

  normalizeEmailField()
  form.code = normalizeCode(form.code)
  clearErrorMessage()

  const isValid = await loginForm.value?.validate().catch(() => false)
  if (!isValid) {
    errorMessage.value = '请检查表单填写是否正确'
    return
  }

  try {
    loggingIn.value = true

    const response = await login(form.email, form.code)
    const responseData = response.data

    if (responseData.code !== 200) {
      errorMessage.value = responseData.message || '登录失败，请稍后重试'
      return
    }

    const { data } = responseData

    const { token, userInfo } = data

    setToken(token)
    setUserInfo(userInfo)

    ElMessage.success('登录成功')
    router.push('/ai-tech')
  } catch (error) {
    errorMessage.value = getErrorMessage(error, '登录失败，请稍后重试')
  } finally {
    loggingIn.value = false
  }
}

onBeforeUnmount(() => {
  clearCountdownTimer()
  clearSendCodeThrottleTimer()
})
</script>

<style scoped>
.login-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  overflow: hidden;
}

/* 左侧品牌区 */
.brand-section {
  width: 45%;
  background-color: #111111;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.brand-section::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%);
  transform: translate(-50%, -50%);
}

.brand-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  z-index: 1;
}

.brand-icon {
  font-size: 80px;
  color: rgba(255, 255, 255, 0.9);
}

.brand-text {
  font-size: 28px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
  letter-spacing: 2px;
}

/* 右侧表单区 */
.form-section {
  flex: 1;
  background-color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.form-wrapper {
  width: 100%;
  max-width: 400px;
  padding: 20px;
}

.form-header {
  margin-bottom: 40px;
}

.form-title {
  font-size: 28px;
  font-weight: 700;
  color: #333333;
  margin: 0 0 8px 0;
}

.form-subtitle {
  font-size: 14px;
  color: #9ca3af;
  margin: 0;
}

.login-form {
  margin-bottom: 20px;
}

.email-input-wrapper {
  position: relative;
  width: 100%;
}

.email-input-wrapper .custom-input {
  width: 100%;
}

.email-input-wrapper :deep(.el-input__wrapper) {
  height: 48px;
  border-radius: 12px;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  box-shadow: none;
}

.email-input-wrapper :deep(.el-input__wrapper:focus-within) {
  border-color: #333333;
  box-shadow: 0 0 0 3px rgba(51, 51, 51, 0.1);
}

.email-input-wrapper :deep(.el-input__inner) {
  padding-right: 100px;
}

.code-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 14px;
  font-weight: 500;
  color: #333333;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 6px;
  transition: all 0.2s ease;
  z-index: 10;
}

.code-btn:hover:not(:disabled) {
  background-color: #f3f4f6;
}

.code-btn:disabled {
  color: #9ca3af;
  cursor: not-allowed;
}

.custom-input {
  width: 100%;
}

.custom-input :deep(.el-input__wrapper) {
  height: 48px;
  border-radius: 12px;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  box-shadow: none;
}

.custom-input :deep(.el-input__wrapper:focus-within) {
  border-color: #333333;
  box-shadow: 0 0 0 3px rgba(51, 51, 51, 0.1);
}

.login-button {
  width: 100%;
  height: 48px;
  background-color: #333333;
  border-color: #333333;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.login-button:hover {
  background-color: #4b5563;
  border-color: #4b5563;
}

.login-button:active {
  transform: scale(0.98);
}

.error-message {
  color: #f56c6c;
  text-align: center;
  margin-top: 10px;
  font-size: 14px;
}

/* 响应式 */
@media (max-width: 768px) {
  .brand-section {
    display: none;
  }
  
  .form-section {
    width: 100%;
  }
}
</style>
