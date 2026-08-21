# wali-dsh-plugin

`wali-dsh-plugin` 是一个安装在 DSH Web 端的桌面宠物插件。安装后，页面右下角会出现一个悬浮宠物，它会跟随会话状态变化、展示提示卡片，并支持头像、背景图、股票主题等交互。

## 功能简介

- 在 DSH Web 界面显示悬浮桌面宠物
- 根据当前会话状态展示不同提示
- 支持切换形象、上传头像、上传背景图
- 支持切换“图片主题 / 股票 K 线主题”
- 以 npm 插件形式分发，可通过 `dsh plugin` 安装
- 无需修改宿主项目源码

## 前置要求

安装前请先确认：

- 已安装 `Node.js` 与 `npm`
- 本机可以访问 npm registry
- 使用的是支持插件机制的 DSH 版本

---

## 快速开始

如果你只想先跑起来，按下面顺序执行即可：

### 1) 安装 DSH

```bash
npm install -g @deepseek-ai/dsh
```

### 2) 确认 DSH 已安装成功

```bash
dsh --version
```

### 3) 安装插件

```bash
dsh plugin --profile web add wali-dsh-plugin
```

### 4) 启动 DSH Web

```bash
dsh web
```

默认情况下，DSH Web 通常会运行在：

```text
http://127.0.0.1:3080
```

### 5) 刷新页面确认插件生效

安装完成后，如果浏览器里已经打开了 DSH 页面，请手动刷新一次。如果插件是在 `dsh web` 已运行时安装的，建议直接重启一次 `dsh web`，再刷新页面。

---

## 1. 怎么安装 DSH

如果本机还没有安装 `dsh`，请先执行：

```bash
npm install -g @deepseek-ai/dsh
```

安装完成后，使用下面的命令检查是否成功：

```bash
dsh --version
```

如果你不想全局安装，也可以临时使用：

```bash
npx @deepseek-ai/dsh --version
```

---

## 2. 怎么启动 DSH

启动 DSH Web：

```bash
dsh web
```

如果你没有全局安装 `dsh`，也可以这样启动：

```bash
npx @deepseek-ai/dsh web
```

启动成功后，通常可在浏览器打开：

```text
http://127.0.0.1:3080
```

说明：

- `dsh web` 启动后通常会持续占用当前终端
- 如果你还要执行插件安装、更新、卸载命令，建议新开一个终端窗口操作

---

## 3. 怎么安装插件

### 安装最新版

```bash
dsh plugin --profile web add wali-dsh-plugin
```

### 安装指定版本

例如安装 `0.1.2`：

```bash
dsh plugin --profile web add wali-dsh-plugin@0.1.2
```

### 安装完成后要做什么

安装完成后，请执行以下动作：

1. 如果 `dsh web` 正在运行，先停止它
2. 重新启动 `dsh web`
3. 刷新浏览器页面

重启命令：

```bash
dsh web
```

---

## 4. 怎么更新插件

当前最稳妥的更新方式是：先卸载旧版本，再安装新版本。

### 更新到最新版

```bash
dsh plugin --profile web remove wali-dsh-plugin
dsh plugin --profile web add wali-dsh-plugin@latest
```

### 更新到指定版本

例如更新到 `0.1.2`：

```bash
dsh plugin --profile web remove wali-dsh-plugin
dsh plugin --profile web add wali-dsh-plugin@0.1.2
```

### 更新后必须重启

更新完成后，请重新启动 DSH Web 并刷新页面：

```bash
dsh web
```

---

## 5. 怎么卸载插件

卸载命令：

```bash
dsh plugin --profile web remove wali-dsh-plugin
```

卸载完成后，同样建议：

1. 停止当前运行中的 `dsh web`
2. 重新执行 `dsh web`
3. 刷新浏览器页面

---

## 6. 一套可以直接复制执行的命令

### 首次安装：安装 DSH + 安装插件 + 启动 Web

```bash
npm install -g @deepseek-ai/dsh
dsh --version
dsh plugin --profile web add wali-dsh-plugin
dsh web
```

### 插件更新到最新版

```bash
dsh plugin --profile web remove wali-dsh-plugin
dsh plugin --profile web add wali-dsh-plugin@latest
dsh web
```

### 插件卸载

```bash
dsh plugin --profile web remove wali-dsh-plugin
dsh web
```

---

## 7. 怎么确认插件已经安装成功

安装后如果页面没有立即显示宠物，可按下面顺序检查：

### 方式一：检查配置里是否已经包含插件

```bash
dsh web --dump-config | rg "wali-dsh-plugin|ui-pet"
```

如果输出里能看到 `wali-dsh-plugin` 或相关注入配置，说明插件已经写入到 `web profile`。

### 方式二：重启 DSH Web

```bash
dsh web
```

然后刷新浏览器页面。

---

## 8. 插件使用说明

安装并刷新页面后：

- 宠物会默认显示在页面右下区域附近
- 点击宠物可打开交互菜单
- 可上传头像、上传背景图、切换形象
- 可切换到股票主题，并设置股票代码
- 可填写 `Twelve Data API Key` 获取真实 K 线

### 股票主题说明

- 默认使用内置演示 K 线数据，开箱即可预览效果
- 在宠物菜单中切换到“股票主题”后，可设置股票代码，例如 `AAPL`、`TSLA`、`NVDA`
- 支持输入多个股票代码，使用英文逗号分隔，例如 `AAPL, TSLA, NVDA`，卡片会自动轮播展示
- 支持直接对接 `Twelve Data`：在菜单里填写 `Twelve Data API Key` 后，会自动请求官方 `time_series` 接口获取真实 K 线
- 菜单里提供“获取 Twelve Data API Key”按钮，可直接跳转到 `https://twelvedata.com/account/api-keys`
- 当前实现是浏览器前端直连，`API Key` 会保存在本地浏览器存储中；如果后续面向多人使用，更建议改成你自己的服务端代理

---

## 9. 常见问题

### 安装成功，但页面没有看到宠物

请依次检查：

```bash
# 1) 确认插件已安装到 web profile
dsh web --dump-config | rg "wali-dsh-plugin|ui-pet"
```

```bash
# 2) 重启 dsh web
dsh web
```

然后刷新浏览器页面。

### npm 已经有新版，但 `dsh plugin add` 还是装到旧版

这通常是因为本机 `pnpm` 使用了镜像源，镜像同步滞后。

可在 profile 目录写入官方 registry：

```bash
printf 'registry=https://registry.npmjs.org/\n' > ~/.dsh/profiles/web/.npmrc
```

然后重新安装最新版：

```bash
dsh plugin --profile web remove wali-dsh-plugin
dsh plugin --profile web add wali-dsh-plugin@latest
```

### 启动 `dsh web` 报端口占用

说明已有旧的 `dsh web` 进程在运行。先停止旧进程，再重新启动即可。

---

## 10. 包地址

- npm: `https://www.npmjs.com/package/wali-dsh-plugin`
- repository: `https://github.com/fuzhengwei/wali-dsh-plugin`
- issues: `https://github.com/fuzhengwei/wali-dsh-plugin/issues`

---

## 11. 本地开发

安装依赖并构建：

```bash
pnpm install
pnpm run bundle
```

监听开发：

```bash
pnpm run watch
```

---

## 12. 发布

发布前会自动执行构建（`prepublishOnly`）：

```bash
npm version patch
npm publish --access public
```

如需升级版本号，也可以使用：

```bash
npm version minor
npm publish --access public
```

或：

```bash
npm version major
npm publish --access public
```

---

## 13. 项目结构

- `package.json`：npm 包配置与 DSH 声明
- `cordis.patch.yml`：注入到 DSH profile 的 bundle patch
- `src/index.ts`：宿主侧插件入口
- `src/client/*`：浏览器端宠物实现

---

## 14. 维护说明

- npm 发布只会带上 `files` 中声明的文件
- 如果修改包名，需要同步更新 `cordis.patch.yml` 中的插件名
