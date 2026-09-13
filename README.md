# DSH Codex Theme

把 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（DSH）Web UI 的观感整体换装成 ChatGPT / Codex 桌面端风格：纯中性暗色调、更亮的侧栏、发丝级对齐的行高与间距、圆角卡片 composer、悬浮菜单动效，以及侧栏「插件」入口与轮换的空态标语。

所有颜色均从真实的 Codex 桌面端截图逐像素取样，不是凭感觉猜的。侧栏行、菜单行等关键几何（30pt 行高、图标与文字缩进、图标亮度）均经过渲染后像素级比对验证。

## 包含什么

本仓库是**纯覆盖层**：不修改 DSH 官方源码（唯一例外见下方「可选源码补丁」），由两个零构建插件组成。

### `codex-theme/` — 宿主侧 CSS 注入插件

- 服务端在渲染 index 时把 `codex-theme.css` **内联**进 `<head>` 末尾，不产生额外的样式请求——没有请求失败或缓存陈旧的问题
- CSS 文件在每次渲染时从磁盘重读：改完 CSS 按 ⌘R 刷新即生效，无需重启服务或重新构建
- 同时注册 `/codex-theme.css` 路由，方便直接在浏览器里查看这张样式表

覆盖范围：调色板（60+ 设计令牌）、侧栏（品牌行 / 新会话行 / 分组标题 / 会话列表 / 底部行）、空态大标题、composer 卡片、对话气泡、Markdown 代码块、悬浮菜单与子菜单、折叠侧栏、滚动条、动效（尊重系统「减弱动态效果」设置）。

### `sidebar-plugins/` — 客户端插件

- 在侧栏导航区（新会话正下方，即 ChatGPT 里 Scheduled / Plugins 的位置）注册一个「插件」行，图标为 @ 环，与新会话行逐像素同款（14px 图标、30pt 行高、同缩进同亮度）
- 点击该行**直达设置的「插件」分区**：因为设置面板的开关状态与当前分区都是组件内部 state，没有对外 API，所以实现方式是捕获阶段拦截行点击，代之为「打开设置 → 自动点中插件分区」
- 把空态大标题的固定文案替换为**轮换标语**（「今天我们要构建什么？」等六句，可在 `lib/client.js` 的 `TAGLINES` 数组增删）；每次回到空态换一句，「预览版」徽章不受影响

客户端半是手写的 `window.__ModuleLoader__.load` bundle（与官方客户端包同格式），无 TypeScript、无打包器、无任何构建步骤。

## 要求

- DeepSeek Harness（本主题基于其 Web UI 的 CSS module 类名结构制作；官方版本更新可能导致类名漂移，届时需要小修）
- macOS（窗口拖拽区依赖 `-webkit-app-region`，浏览器里打开时只是外观略有差异）
- 客户端插件需在 DSH 的 web profile 中安装（见下）

## 安装

把下面整段复制给你的 AI 助手即可代装：

```text
请帮我安装 dsh-codex-theme（DeepSeek Harness 的 Codex 风格主题）：
1. git clone https://github.com/Shiorangerin/dsh-codex-theme.git 到任意目录，记为 $THEME_DIR
2. 在 DSH 官方仓库根目录执行：
   node apps/cli/lib/bin.js plugin --profile web add file:$THEME_DIR/sidebar-plugins
3. 编辑 ~/.dsh/profiles/web/cordis.patch.yml（没有就新建），确保内容包含：
   - insert:
       - id: codex-theme
         name: '$THEME_DIR/codex-theme/plugin.js'
       - id: codex-sidebar
         name: 'dsh-codex-sidebar'
   （第一条是宿主 CSS 插件，用绝对路径；第二条必须用裸包名 dsh-codex-sidebar，
   客户端包的浏览器半只能按包名解析，绝对路径不会被识别。）
4. 重启 DSH 的 web 服务并刷新页面。
```

<details>
<summary>手动安装步骤（点开）</summary>

```bash
git clone https://github.com/Shiorangerin/dsh-codex-theme.git
cd deepseek-harness   # 官方仓库根目录

# 客户端插件装进 web profile（file: 依赖是复制，之后改了插件源码要重新执行这条）
node apps/cli/lib/bin.js plugin --profile web add file:/path/to/dsh-codex-theme/sidebar-plugins
```

编辑 `~/.dsh/profiles/web/cordis.patch.yml`：

```yaml
- insert:
    - id: codex-theme
      name: '/path/to/dsh-codex-theme/codex-theme/plugin.js'
    - id: codex-sidebar
      name: 'dsh-codex-sidebar'
```

重启 web 服务，刷新页面即可。CSS 改动随时 ⌘R 热生效；改了 `sidebar-plugins/lib/client.js` 则需要重跑上面的 `plugin add`（file: 依赖是复制不是软链）。

</details>

### 可选：顶部模式控件

把 DSH 的 agent preset 座位移到主列顶部（Codex 的 Chat | Work 分段控件位置），需要在 `~/.dsh/settings.yaml` 中开启：

```yaml
agent-presets:
  modeSelectionEnabled: true
```

### 可选：源码两行补丁（折叠侧栏零宽）

主题把「折叠侧栏」处理成完全消失、只留标题栏里的开关。这依赖官方源码 `packages/client` 下布局常量的两处小改动，不改的话折叠后仍是 56px 图标栏（其余功能不受影响）：

```diff
--- a/packages/client/.../columns.ts
+++ b/packages/client/.../columns.ts
-SIDEBAR_AUTO_COLLAPSE = 1024
+SIDEBAR_AUTO_COLLAPSE = 880
-SIDEBAR_COLLAPSED = 56
+SIDEBAR_COLLAPSED = 0
```

（常量所在文件可在 `packages/client` 内 `rg "SIDEBAR_COLLAPSED = "` 定位。）

## 风险与已知限制

- **这是对官方产物的逆向覆盖层**：DSH 版本更新、CSS module 哈希或类名结构调整时，部分规则会静默失效，需要跟着小修。本主题不保证跟随上游每個版本。
- 客户端插件的浏览器半按官方 loader 的私有 bundle 格式手写，loader 协议变化时需同步调整。
- 「插件」行点击后能否精确定位到插件分区，依赖设置弹窗的导航文案为「插件」（简体中文界面）。其他语言请改 `sidebar-plugins/lib/client.js` 顶部的 `SECTION_LABEL`。
- 轮换标语同理：标语是中文，可自行改写。

## 调试

- 主题 CSS：改完直接 ⌘R，无缓存问题（宿主插件内联注入且 `no-store`）
- 客户端插件改完：重跑 `dsh plugin --profile web add file:...` 后强刷（客户端 bundle 带 `immutable` 缓存头，普通刷新可能拿到旧副本）
- 若整站报 "Failed to load plugins"：多半是手写 bundle 语法错误或包名没按裸名注册，先检查 `cordis.patch.yml` 与浏览器控制台

## 许可证

[MIT](./LICENSE)
