# AGENTS.md — saas-fulfillment-prototype

> 项目规则与 AI 协作契约。改动本仓库前必须先读本文件与 [MEMORY.md](MEMORY.md)；冲突时先在会话中确认，不要自行取舍。

## 项目定位
「进销存（轻量发货）」SaaS 高保真原型，四端可切换：租户后台 / 供应商后台 / 门店 APP / 买家端。
用途：给研发与业务看流程闭环与改造点——**不是可上线产品**，无后端、无真实支付。
交付重点：新增处标记「新增：X」、改动处标记「改动：X」，研发一眼可辨。

## 技术栈与命令
- Vite 6 + React 19，纯前端；无路由库（`Shell.jsx` 切换端与页）、无 UI 库（样式集中在 `src/saas.css`）
- `npm run dev` → http://127.0.0.1:5311
- `npm run build` → `dist/`（构建必须通过才算完成）
- 发布：`bash ~/proto-push.sh "中文说明"`（build → 同步 docs/ → commit → push → GitHub Pages）
- ⚠ `node_modules` 是指向 `../fulfillment-mvp-v2/node_modules` 的软链，**不要在本目录跑 `npm install`**
- ⚠ 项目在 Desktop 下（macOS TCC）；临时文件用 `$TMPDIR`，不要把 dev server 的读取范围扩到其他桌面路径

## 目录
- `src/data.js` — 种子数据（订单 / 供货单 / 差异单 / 门店 / 商品…）
- `src/store.js` — 运行时状态与单据流转（patchDoc / diffStore / addDiff / applyArrivalTimeouts）
- `src/pages/` — 按模块：order 订单、supply 发货·收货·配送差异、returns 退货返厂、aftersale 售后、product 商品、supplierMaster 供应商、supplier 供应商后台、app 门店APP、buyer 买家端
- `src/pages/reqnotes.jsx` 需求注释面板 · `scenarios.jsx` 场景清单 · `flows.jsx` 流程图 · `versions.jsx` 版本记录

## 编码约定
- 页面取数一律来自 `data.js` / `store.js`（运行时真实联动），**禁止在详情/弹窗里写死演示数据**
- hooks 必须写在任何 early return 之前
- 状态词只能用在业务或原系统里有对应的词，不新造
- 红框标记：`<div className="hl" data-hl="新增：供应商后台登录账号">`；顶栏开关切换 `body.hide-hl`
- 需求注释用正常中文写业务语义，不写「复刻了 XX」「照原系统」这类叙述

## 验证与交付
1. 改动后 `npm run build` 必须通过
2. 浏览器实测：**改过种子数据/默认值后先 `location.reload()`**（HMR 会保留旧 useState，否则验的是旧 state）
3. 全站对齐：改了列表口径，要连详情 / 弹窗 / 种子数据 / 需求注释一起查
4. 交付 = 改动清单（短）+ 验证结果 + push 命令

## 边界（不做的事）
- 本期只做「销」链路：不做采购、入库、真实库存、真实支付/分账、渠道归因
- 不做破坏性 git 操作（reset --hard / push --force / clean -f），不做未获授权的重构
- 不写入任何凭据、密钥、账号（含测试环境账号）——只记录获取方式
