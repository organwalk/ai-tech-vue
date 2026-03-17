# AI-Tech Vue 前端

基于 Vue 3 + Vite 的 AI 辅助学习平台前端项目，覆盖个人学习与共享课程两种学习模式，支持文档解析、RAG 对话、测验/指南/学情诊断等 AI 学习能力。

## 项目矩阵（AI自适应学习引擎）

- 前端（当前仓库）：[ai-tech-vue](https://github.com/organwalk/ai-tech-vue)
- 后端：[ai-tech](https://github.com/organwalk/ai-tech)
- Agent：[ai-tech-agent](https://github.com/organwalk/ai-tech-agent)

## 项目特性

- 邮箱验证码登录与鉴权路由守卫
- 个人学习窗口：文档上传解析、知识检索对话、学习任务中心
- 共享课程窗口（教师端）：章节管理、文档挂载、指南/测验生成、成员管理、反馈查看
- 共享课程窗口（学员端）：章节学习、文档下载、指南预览、测验作答、反馈提交
- 支持 Markdown + KaTeX 数学公式渲染
- 支持流式对话（`text/event-stream`）与增量消息渲染

## 技术栈

| 类别 | 技术 |
| --- | --- |
| 框架 | Vue 3 (`script setup`) |
| 构建 | Vite 6 |
| 路由 | Vue Router 4 |
| UI | Element Plus |
| 网络 | Axios + Fetch |
| 文本渲染 | markdown-it + KaTeX |
| 图表 | ECharts |
| 工具库 | dayjs |

## 快速开始

### 1) 环境要求

- Node.js >= 18
- npm >= 9

### 2) 安装依赖

```bash
npm install
```

### 3) 启动开发环境

```bash
npm run dev
```

默认访问地址：

- `http://localhost:5173/ai-tech/login`

### 4) 打包与预览

```bash
npm run build
npm run preview
```

## 可用脚本

| 脚本 | 说明 |
| --- | --- |
| `npm run dev` | 启动 Vite 开发服务器 |
| `npm run build` | 生产构建到 `dist/` |
| `npm run preview` | 本地预览生产构建 |

## 业务模块

| 模块 | 说明 |
| --- | --- |
| 登录模块 | 邮箱验证码发送、登录换取 token |
| 首页窗口模块 | 创建/编辑/删除窗口，加入共享窗口 |
| 个人学习模块 | 上传学习资料、RAG 对话、任务中心（测验/指南/诊断） |
| 教师课程模块 | 章节管理、文档挂载、生成指南/测验、成员与反馈管理 |
| 学员课程模块 | 章节学习、资料下载、测验作答、学习反馈 |
| 个人资料模块 | 昵称编辑 |

## 路由说明

| 路径 | 页面 | 鉴权 |
| --- | --- | --- |
| `/ai-tech/login` | 登录页 | 否 |
| `/ai-tech` | 首页窗口列表 | 是 |
| `/ai-tech/self/window/:windowId` | 个人学习工作台 | 是 |
| `/ai-tech/share/owner/window/:windowId/:inviteCode` | 教师课程工作台 | 是 |
| `/ai-tech/share/member/window/:windowId/:inviteCode` | 学员课程工作台 | 是 |

> 未匹配路由将重定向到 `/ai-tech/login`。

## 项目结构

```text
src/
├─ assets/                     # 全局样式变量
├─ features/                   # 按业务域拆分
│  ├─ auth/                    # 登录
│  ├─ home/                    # 首页窗口管理
│  ├─ self-study/              # 个人学习工作台
│  ├─ course-owner/            # 教师课程端
│  ├─ course-member/           # 学员课程端
│  └─ profile/                 # 用户资料
├─ router/                     # 路由配置与守卫
├─ shared/
│  ├─ api/                     # 接口封装（services/core/utils）
│  ├─ components/              # 可复用组件
│  ├─ plugins/                 # 插件注册（Element Plus）
│  └─ utils/                   # 工具（SSE 消费等）
├─ App.vue
└─ main.js
```

## 接口与鉴权约定

### 基础地址（当前实现）

当前前端将 API 基地址写死为：

- `http://localhost:8081/api/v1`

涉及文件：

- `src/shared/api/core/instance.js`
- `src/shared/api/core/loginInstance.js`
- `src/shared/api/core/fetchClient.js`

### 响应码约定

| code | 含义 |
| --- | --- |
| `200` | 成功 |
| `400` | 业务异常 |
| `401` | 未授权/登录过期 |
| `403` | 无权限 |
| `500` | 系统错误 |

### Token 存储

- `localStorage.token`
- `localStorage.userInfo`

路由守卫会对需要登录的路由检查 `token`，不存在时自动跳转登录页。

## 文件上传与异步任务流

### 上传限制

- 支持格式：`.txt` `.md` `.pdf` `.doc` `.docx`
- 文件大小：最大 20MB

### 上传流程

1. 前端请求预签名地址（`/knowledge/presign-upload`）
2. 前端直传对象存储（`PUT uploadUrl`）
3. 通知后端开始解析（`/knowledge/confirm`）
4. 前端轮询任务状态并刷新文件列表

### 流式对话

- 使用 `fetch` + `text/event-stream`
- 消费 `data:` 增量消息，支持 `[DONE]` 结束标记
- 统一由 `src/shared/utils/eventStream.js` 处理流式解析

## 构建优化

`vite.config.js` 已开启 `manualChunks`，按依赖拆分常见 vendor 包（UI、Markdown、图表、工具库），减小首屏包体积压力。

## 部署说明

### 静态部署

构建产物目录：`dist/`

```bash
npm run build
```

### Nginx（History 路由）示例

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

如果部署到非根路径，请同步调整 Vite `base` 与路由策略。

## 开发约定

- 优先在 `features/*` 下按业务域组织页面与组件
- 所有接口统一收敛到 `shared/api/services/*`
- 需要鉴权的请求默认走 `api` 实例（自动注入 `Authorization`）
- 统一复用 `shared/components` 与 `shared/utils`

## 常见问题

### 1. 页面刷新后 404

原因：服务器未配置 History 路由回退。  
处理：为静态服务器增加 `try_files ... /index.html`。

### 2. 本地无法登录/接口报错

原因：后端未启动或端口不一致。  
处理：确认后端服务运行在 `http://localhost:8081/api/v1`，或修改上述 3 个基础地址配置文件。

### 3. 对话一直没有返回

原因：后端未按 SSE（`text/event-stream`）协议返回流式数据。  
处理：检查 `/chat/send`、`/chat/send/tool` 响应头与流式数据格式。

## License

暂未声明 License。
