# 开眼 · AI Builds

可视化周刊：用人话 + 流程图，讲清每个 AI build **实际在做什么**。

- 界面语言：简体中文（zh-CN）
- 产品名 / URL：保留英文
- 技术栈：纯静态 HTML + CSS + vanilla JS（无构建步骤）
- 适合 GitHub Pages / 任意静态托管

## 本地预览

进入本目录后任选一种方式：

```bash
cd kaiyan-ai-builds

# 方式 A — npx serve（推荐）
npx --yes serve .

# 方式 B — Python
python3 -m http.server 8080

# 方式 C — Node http-server
npx --yes http-server -p 8080
```

然后打开终端提示的地址（例如 `http://localhost:3000` 或 `http://localhost:8080`）。

> **注意**：请用本地 HTTP 服务器打开，不要直接双击 `index.html`（`file://`）。浏览器会拦截对 JSON 的 `fetch`，导致内容无法加载。

## 发布到 GitHub Pages

1. 将本文件夹推送到 GitHub 仓库（可作为仓库根目录，或放在 `/docs`）。
2. 仓库 **Settings → Pages**：
   - Source：Deploy from a branch
   - Branch：`main`（或 `gh-pages`），目录选 `/`（根）或 `/docs`
3. 保存后等待 1–2 分钟，访问 `https://<user>.github.io/<repo>/`

所有资源路径均为相对路径，子路径托管也可正常工作。

### 快速推送示例

```bash
cd kaiyan-ai-builds
git init
git add .
git commit -m "Publish 开眼 · AI Builds"
git branch -M main
git remote add origin https://github.com/<USER>/<REPO>.git
git push -u origin main
```

然后按上文启用 Pages。

## 目录结构

```
kaiyan-ai-builds/
├── index.html                 # 入口 SPA
├── css/styles.css             # 编辑风深色主题
├── js/app.js                  # 路由、筛选、详情弹层
├── content/
│   └── weeks/
│       ├── index.json         # 周刊列表（周切换器）
│       └── 2026-09-13.json    # 单周内容
├── assets/                    # 预留静态资源
└── README.md
```

## 如何新增一周

1. 复制 `content/weeks/2026-09-13.json` 为新文件，例如 `2026-09-20.json`。
2. 按同一 schema 填写 `theme`、`patterns`、`builds`（含 `flow` 步骤）。
3. 在 `content/weeks/index.json` 的 `weeks` 数组头部加入新周，并按需更新 `defaultWeek`。

每个 build 建议字段：`id`、`name`、`org`、`url`、`category`（`portfolio` | `business` | `workflow`）、`tagline`、`oneLiner`、`plainExplain`、`painPoint`、`whyCool`、`pattern`、`variants`、`flow`。

## Hash 路由

| 路径 | 含义 |
|------|------|
| `#/` | 首页 |
| `#/build/<id>` | 打开某 build 详情 |
| `#/pattern/<id>` | 按约束模式筛选 |
| `#/week/<id>` | 切换周刊 |

## License

内容与代码可按仓库需要自行声明。Seed 周内容来自公开产品页与仓库链接，仅作学习摘要。
