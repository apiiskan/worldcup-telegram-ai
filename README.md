# World Cup Telegram AI Predictor

2026 世界杯 Telegram 自动赛况推送与比分预测系统。

## 功能特性

- **赛前预测推送** — 每场比赛开赛前 1 小时自动推送 AI 预测
- **胜率百分比** — 主/平/客三方概率分布 + 可视化进度条
- **近 5 场战绩** — 每支球队的近期状态一目了然
- **Claude AI 分析** — 接入 Anthropic Claude API 生成专业预测理由
- **规则模型兜底** — 无 AI Key 时自动使用规则模型
- **防重复推送** — SQLite 唯一索引保证不会重复发送
- **一键部署 Railway** — Dockerfile + railway.toml 开箱即用

## 快速开始

### 1. 创建 Telegram Bot

1. 在 Telegram 搜索 `@BotFather` → 发送 `/newbot`
2. 按提示操作，记录返回的 **Bot Token**

### 2. 获取 Chat ID

1. 向 Bot 发送一条任意消息
2. 浏览器访问：`https://api.telegram.org/bot<TOKEN>/getUpdates`
3. JSON 中找 `"chat":{"id": 123456}` — 这就是 Chat ID

### 3. 安装

```bash
git clone <repo-url> && cd worldcup-telegram-ai
pnpm install
cp .env.example .env
# 编辑 .env，填入 TELEGRAM_BOT_TOKEN 和 TELEGRAM_CHAT_ID
```

### 4. 启用 Claude AI（可选但推荐）

在 `.env` 中设置：
```
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-xxxxx
```
不设置则自动使用规则模型。

### 5. 同步赛程 & 测试

```bash
pnpm sync:fixtures    # 同步 72 场小组赛到 SQLite
pnpm test:predict     # 测试预测逻辑（不需要 Telegram）
pnpm test:telegram    # 测试 Telegram 连接
pnpm test:prematch    # 发送一条完整预测到 Telegram
```

### 6. 启动服务

```bash
pnpm dev              # 开发模式（热重载）
pnpm build && pnpm start  # 生产模式
```

## 一键部署 Railway

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/template)

### 手动部署步骤

```bash
# 1. 安装 Railway CLI
npm install -g @railway/cli

# 2. 登录
railway login

# 3. 初始化项目
railway init

# 4. 设置环境变量
railway variables set TELEGRAM_BOT_TOKEN=xxx
railway variables set TELEGRAM_CHAT_ID=xxx
railway variables set AI_PROVIDER=anthropic
railway variables set ANTHROPIC_API_KEY=sk-ant-xxx
railway variables set TIMEZONE=America/Los_Angeles

# 5. 部署
railway up
```

Railway 会自动读取 `Dockerfile` + `railway.toml` 完成构建和部署。

### 使用 pm2 部署到 VPS

```bash
pnpm build
npm install -g pm2
pm2 start dist/index.js --name worldcup-bot
pm2 save && pm2 startup
pm2 logs worldcup-bot
```

## 推送消息示例

```
🏆 2026 FIFA World Cup
────────────────────────

⚽ Argentina  vs  Peru
📅 2026/06/15 19:00  ⏳ 约 1 小时
🏟️ MetLife Stadium · New York
🏷️ Group C - Matchday 1

─── 🔮 AI 预测 ────────────

📊 预测比分：Argentina 2-1 Peru
🎯 结果倾向：Argentina 👑
🟢 风险等级：稳

─── 📊 胜率分布 ───────────

Argentina    ████████░░ 62%
平局           ██░░░░░░░░ 18%
Peru         ██░░░░░░░░ 20%

─── 📝 近 5 场战绩 ──────────

Argentina    🟢 🟢 🟡 🟢 🟢
Peru         🟡 🟡 🔴 🟢 🟡

─── 🧩 细分数据 ───────────

📈 大小球：大2.5
⚽ 双方进球：是
⚠️ 冷门概率：中
🔒 信心指数：62%

─── 💡 核心理由 ───────────

  1. Argentina 世界排名远高于 Peru，综合实力占优
  2. 小组赛阶段，需要积分，可能会主动进攻
  3. Argentina 预计掌控更多控球权

─── 👀 重点关注 ───────────

  ▸ Peru 能否在前30分钟守住防线
  ▸ 球队是否会在后半段换人调整节奏

────────────────────────
🤖 Powered by Claude AI · 仅供参考
```

## 项目结构

```
src/
  index.ts                           # 入口 + cron 调度
  config.ts                          # 环境变量
  skills/
    info-skill/                      # 数据采集
      index.ts                       # 统一接口
      footballApiClient.ts           # API-Football
      mockData.ts                    # Mock 赛程
      normalizeFixture.ts            # 数据标准化
    prediction-skill/                # 预测引擎
      index.ts                       # 统一接口（规则 + AI）
      ruleBasedPredictor.ts          # 规则预测模型
      aiReasoningPredictor.ts        # Claude AI 预测增强
      formTracker.ts                 # 近 5 场战绩数据
  telegram/
    telegramBot.ts                   # Telegram API
    messageTemplates.ts              # 富文本消息模板
  scheduler/
    syncFixturesJob.ts               # 赛程同步
    preMatchPushJob.ts               # 赛前推送
  db/
    sqlite.ts                        # SQLite 连接
    fixtureRepository.ts             # 赛程数据
    predictionRepository.ts          # 预测数据
    pushLogRepository.ts             # 推送日志（防重复）
  utils/
    logger.ts / time.ts / retry.ts   # 工具函数
  scripts/
    syncFixtures.ts                  # 手动同步
    testTelegram.ts                  # 测试连接
    testPredict.ts                   # 测试预测
    testPreMatch.ts                  # 测试完整推送
```

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `TELEGRAM_BOT_TOKEN` | Telegram Bot Token | 必填 |
| `TELEGRAM_CHAT_ID` | 目标 Chat ID | 必填 |
| `AI_PROVIDER` | AI 提供商 | `anthropic` |
| `ANTHROPIC_API_KEY` | Claude API Key | 可选 |
| `FOOTBALL_API_PROVIDER` | 数据源 | `mock` |
| `TIMEZONE` | 显示时区 | `America/Los_Angeles` |
| `PRE_MATCH_MINUTES` | 赛前推送窗口 | `60` |

## 第二轮计划

- [ ] 实时比分关键事件推送
- [ ] 赛后复盘自动推送
- [ ] 赔率数据接入
- [ ] 首发阵容
- [ ] 预测命中率统计
- [ ] OpenAI / Gemini 支持
