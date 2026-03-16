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
                class="custom-input"
              />
              <button
                type="button"
                class="code-btn"
                :disabled="!isEmailValid || countdown > 0"
                @click="handleSendCode"
              >
                {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
              </button>
            </div>
          </el-form-item>

          <el-form-item prop="code">
            <el-input
              v-model="form.code"
              placeholder="请输入验证码"
              maxlength="6"
              class="custom-input"
            />
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              @click="handleLogin"
              :loading="loggingIn"
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
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { MagicStick } from '@element-plus/icons-vue'
import { login, sendCode, setToken, setUserInfo } from '@/shared/api/index.js'
import { ElMessage } from 'element-plus'

const router = useRouter()

const form = reactive({
  email: '',
  code: ''
})

const rules = {
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { min: 6, max: 6, message: '验证码长度为6位', trigger: 'blur' }
  ]
}

const isEmailValid = ref(false)
const countdown = ref(0)
const sendingCode = ref(false)
const loggingIn = ref(false)
const errorMessage = ref('')
const loginForm = ref(null)

const handleEmailInput = () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  isEmailValid.value = emailRegex.test(form.email)
  errorMessage.value = ''
}

const handleSendCode = async () => {
  try {
    sendingCode.value = true
    errorMessage.value = ''
    
    await sendCode(form.email)
    ElMessage.success('验证码已发送到您的邮箱')
    
    countdown.value = 60
    const timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer)
      }
    }, 1000)
  } catch (error) {
    errorMessage.value = error.response?.data?.message || '发送验证码失败，请稍后重试'
  } finally {
    sendingCode.value = false
  }
}

const handleLogin = async () => {
  try {
    await loginForm.value.validate()
    
    loggingIn.value = true
    errorMessage.value = ''
    
    const response = await login(form.email, form.code)

    console.log('登录响应:', response)
    
    const responseData = response.data

    console.log('响应数据:', responseData)

    if (responseData.code !== 200) {
      errorMessage.value = responseData.message || '登录失败，请稍后重试'
      return
    }

    const { data } = responseData

    console.log('登录数据:', data)
    
    const { token, userInfo } = data
    
    setToken(token)
    setUserInfo(userInfo)
    
    ElMessage.success('登录成功')
    router.push('/ai-tech')
  } catch (error) {
    if (error.name === 'Error') {
      errorMessage.value = '请检查表单填写是否正确'
    } else {
      const errorMsg = error.response?.data?.message || error.response?.data?.data?.message || '登录失败，请稍后重试'
      errorMessage.value = errorMsg
    }
  } finally {
    loggingIn.value = false
  }
}
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
