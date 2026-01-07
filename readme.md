# 🚀 VMess 订阅生成器 Pro

这是一个运行在 Cloudflare Workers 边缘网络上的轻量级工具。它能够将单个 VMess 节点扩展为多个使用优选域名的节点，并自动生成短链接订阅地址。

示例网站：https://yyyy.220820.xyz

![React](https://img.shields.io/badge/Frontend-React_18-61DAFB?style=flat-square&logo=react)
![TailwindCSS](https://img.shields.io/badge/Style-Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css)
![Cloudflare](https://img.shields.io/badge/Platform-Cloudflare_Workers-F38020?style=flat-square&logo=cloudflare)

## ✨ 核心特性

- **批量优选生成**：一键将原始节点扩展至多个内置或自定义优选域名。
- **自动订阅转换**：自动拼接 Sing-box 格式参数，并调用后端生成短链接。
- **动态 UUID 上送**：每次请求自动生成唯一 `shortCode`，确保订阅安全。
- **隐私保护**：所有解析与编码逻辑均在浏览器本地及边缘端完成，不存储节点信息。
- **极速部署**：支持 GitHub Action 联动，代码推送即自动部署。

## 🛠️ 快速部署

### 1. 推送代码至 GitHub
确保你的仓库中包含以下文件：
- `index.js` (或 `works.js`): 主程序代码
- `wrangler.jsonc`: Cloudflare 配置文件
- `README.md`: 本说明文档

### 2. 关联 Cloudflare Workers
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)。
2. 进入 **Workers & Pages** -> **Create application**。
3. 在 **Settings -> Build & Deployment** 中连接你的 GitHub 仓库。

### 3. 配置环境变量
在 Cloudflare Worker 的 **Settings -> Variables** 中添加以下变量：

| 变量名 | 示例值 | 描述 |
| :--- | :--- | :--- |
| `SHORTEN_API_BASE` | `https://xxxx.pp.ua` | 短链接转换后端的 API 基础地址 |

## 📖 使用指南

1. **输入节点**：粘贴你的原始 `vmess://` 链接。
2. **选择域名**：使用内置优选域名列表或手动输入新的域名。
3. **生成地址**：点击按钮，程序将自动完成节点批量替换及短链接转换。
4. **导入客户端**：点击“复制链接”获取最终的短链接订阅地址，粘贴至 Sing-box 等客户端即可。

## 🔧 技术细节

- **Frontend**: React 18 + Tailwind CSS (通过 CDN 加载，保持 Worker 体积精简)。
- **Logic**: 采用 `atob/btoa` 处理 Base64，支持 `encodeURIComponent` 兼容中文备注。
- **Integration**: 深度集成 Cloudflare `env` 变量系统。

## ⚠️ 免责声明

本工具仅供网络技术交流与研究使用，请勿用于任何违反当地法律法规的活动。使用者需自行承担因使用本工具产生的所有后果。

---
