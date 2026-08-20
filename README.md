# wali-dsh-plugin

`wali-dsh-plugin` 是一个安装在 DSH Web 端的桌面宠物插件。安装后，页面右下区域会出现一个悬浮宠物，它会跟随会话状态变化、展示提示卡片，并支持头像/背景图片等交互。

## 功能简介

- 在 DSH Web 界面显示悬浮桌面宠物
- 根据当前会话状态展示不同提示
- 支持切换形象、上传头像、上传背景图
- 以 npm 插件形式分发，可通过 `dsh plugin` 安装
- 无需修改宿主项目源码

## 前置要求

- Node.js 与 npm 已安装
- 可访问 npm registry
- 使用支持插件机制的 DSH 版本

## 1. 全局安装 DSH

如果本机还没有安装 `dsh`，先执行：

```bash
npm install -g @deepseek-ai/dsh
```

安装完成后可检查版本：

```bash
dsh --version
```

## 2. 启动 DSH Web

启动 Web 端：

```bash
dsh web
```

默认会打开本地页面，通常地址是：

```text
http://127.0.0.1:3080
```

如果你不想全局安装，也可以直接使用：

```bash
npx @deepseek-ai/dsh web
```

## 3. 安装插件

推荐安装命令：

```bash
dsh plugin --profile web add wali-dsh-plugin
```

如果你希望明确安装某个版本，例如 `0.1.2`：

```bash
dsh plugin --profile web add wali-dsh-plugin@0.1.2
```

安装完成后：

1. 重启 `dsh web`
2. 刷新浏览器页面

## 4. 更新插件

### 方式一：直接更新到最新版

```bash
dsh plugin --profile web remove wali-dsh-plugin
dsh plugin --profile web add wali-dsh-plugin@latest
```

### 方式二：更新到指定版本

```bash
dsh plugin --profile web remove wali-dsh-plugin
dsh plugin --profile web add wali-dsh-plugin@0.1.2
```

更新完成后，同样建议：

```bash
# 先停止旧的 dsh web，再重新启动
dsh web
```

然后刷新页面。

## 5. 卸载插件

```bash
dsh plugin --profile web remove wali-dsh-plugin
```

卸载后重启 `dsh web` 并刷新页面即可。

## 6. 一套可直接执行的完整命令

### 首次安装 DSH + 启动 + 安装插件

```bash
npm install -g @deepseek-ai/dsh
dsh web
# 新开一个终端后执行
dsh plugin --profile web add wali-dsh-plugin
```

### 更新插件

```bash
dsh plugin --profile web remove wali-dsh-plugin
dsh plugin --profile web add wali-dsh-plugin@latest
```

### 卸载插件

```bash
dsh plugin --profile web remove wali-dsh-plugin
```

## 7. 怎么使用

安装并刷新页面后：

- 宠物会默认显示在页面右下区域附近
- 点击宠物可打开交互菜单
- 可上传头像、上传背景图、切换形象
- 宠物会根据当前会话状态展示不同提示
- 在新机器或无痕窗口中，首次安装后也应该直接看到宠物

## 8. 常见问题

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

然后重新安装指定版本：

```bash
dsh plugin --profile web remove wali-dsh-plugin
dsh plugin --profile web add wali-dsh-plugin@latest
```

### 启动 `dsh web` 报端口占用

说明已有旧的 `dsh web` 进程在运行。先停止旧进程，再重新启动即可。

## 9. 包地址

- npm: `https://www.npmjs.com/package/wali-dsh-plugin`
- repository: `https://github.com/fuzhengwei/wali-dsh-plugin`
- issues: `https://github.com/fuzhengwei/wali-dsh-plugin/issues`

## 10. 本地开发

安装依赖并构建：

```bash
pnpm install
pnpm run bundle
```

监听开发：

```bash
pnpm run watch
```

## 11. 发布

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

## 12. 项目结构

- `package.json`：npm 包配置与 DSH 声明
- `cordis.patch.yml`：注入到 DSH profile 的 bundle patch
- `src/index.ts`：宿主侧插件入口
- `src/client/*`：浏览器端宠物实现

## 13. 维护说明

- npm 发布只会带上 `files` 中声明的文件
- 如果修改包名，需要同步更新 `cordis.patch.yml` 中的插件名
