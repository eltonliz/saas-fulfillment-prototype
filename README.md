# 进销存 MVP（轻量发货）原型

基于真实 SAAS 界面 1:1 复刻的进销存改造原型，四端可切换：租户后台 / 供应商后台 / 门店 APP / 买家端。

**在线预览：** https://eltonliz.github.io/saas-fulfillment-prototype/

- 菜单顶部：版本记录 / 业务流程图 / 场景清单
- 进销存新增：发货管理、收货管理、配送差异、退货返厂（改动处均有红框标注，可在顶栏开关）
- 每个业务页面右侧有「需求注释」面板（业务规则 / 数据流转 / 前后置条件 / 异常场景 / 上下游影响）

## 本地运行

```bash
npm install
npm run dev      # http://127.0.0.1:5311
```

## 更新线上版本（GitHub Pages，部署在 docs/）

```bash
npm run build
rm -rf docs && cp -R dist docs
git add -A && git commit -m "更新说明" && git push
```
