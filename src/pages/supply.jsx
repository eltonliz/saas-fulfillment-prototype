import React, { useState } from "react";
import { SUPPLY_DOCS, itemsOf, ordersOf, packagesOf, qtyOf, sentOf, receivedOf, itemsLabel, allocateByOrder, supplyLabelOf, matchOrder, matchDoc } from "../data.js";
import { TrackDrawer, useToast, useRowSelect, BatchBar, usePaged, Pager } from "../ui.jsx";
import { supplyStore, supplierStore, diffStore, orderStore, addressBookStore, patchDoc, addDoc, addDiff, ARRIVAL_TIMEOUT_DAYS } from "../store.js";

const LEG_LABEL = {
  sup_consumer: "供应商 → 消费者",
  supplier_to_hq: "供应商 → 总仓",
  supplier_inbound: "供应商 → 门店",
  hq_store: "总部仓 → 门店",
};
/* 自有货的到店单据按业务口径单独显示为「总部自有 → 门店」（货为总部自有、不经供应商） */
const legLabelOf = (d) => (d.goodsSource === "总部自有" && d.leg === "hq_store" ? "总部自有 → 门店" : LEG_LABEL[d.leg]);
/* 配送差异状态 Tab —— 按来源分两套业务场景：
   · 收货环节少收时**当场完成举证**（差异原因 + 说明 + 图片），所以差异单开出来就直接进「待审核」，没有「待举证」这个中间态；
   · 门店上报：门店举证 → 总部审核 → 按「谁发货谁补发」补发，与门店APP同一套状态口径。
   供应商后台合并展示两类，用同一个 diffInTab（「待审核」含待供应商审核 / 待总部审核）。 */
export const DIFF_TABS_BY_SOURCE = {
  总部上报: ["全部", "待供应商审核", "待补发", "补发中", "补发完成", "审核不通过", "已关闭"],
  门店上报: ["全部", "待审核", "审核通过", "审核不通过", "已关闭"],
};
export const DIFF_TABS = ["全部", "待审核", "审核通过", "审核不通过", "已关闭"];
/* 补发状态三段：待补发（补发单已生成未发货）→ 补发中（已发货在途）→ 补发完成（收货闭环） */
export const diffInTab = (status, tab) =>
  tab === "全部" ? true
    : tab === "待审核" ? ["待总部审核", "待供应商审核"].includes(status)
        : tab === "待供应商审核" ? status === "待供应商审核"
          : tab === "待补发" ? status === "待补发"
            : tab === "补发中" ? status === "补发中"
              : tab === "补发完成" ? status === "补发完成"
                : tab === "审核通过" ? ["待补发", "补发中", "补发完成"].includes(status)
                  : tab === "审核不通过" ? status === "审核不通过"
                    : status === "已关闭";
/* 总部 = 租户，门店也属于同一租户 —— 权限一致，本租户的供货单一律可见。
   只有「供应商 → 消费者（一件代发）」是供应商独占的，租户侧不显示。
   另：「总部仓 → 消费者」不是供货单 —— 消费者那一跳由订单管理的「发货」完成，
   故发货管理只承载到内部主体（总仓 / 门店）为止的供货单。 */
const TENANT_LEGS = ["supplier_to_hq", "supplier_inbound", "hq_store"];
const RECEIVE_LEGS = ["supplier_to_hq", "supplier_inbound", "hq_store"];
const isTenantLeg = (d) => TENANT_LEGS.includes(d.leg);
const isSelfShip = (d) => d.leg === "hq_store";
/* F3/F4：总部仓直配（供应商供货）的下游段，必须等同一订单「供应商→总仓」那段确认收货后才可发货 */
const upstreamReady = (d) => {
  if (d.leg !== "hq_store") return true;
  const up = supplyStore.get().find((x) => x.leg === "supplier_to_hq" && ordersOf(x).includes(d.no));
  return !up || up.status === "已收货";
};
const awaitHqReceive = (d) => isSelfShip(d) && d.status === "待发货" && !upstreamReady(d);
const canShip = (d) => isSelfShip(d) && d.status === "待发货" && upstreamReady(d);
const awaitSupShip = (d) => !isSelfShip(d) && d.status === "待发货";
const canReceive = (d) => d.status === "已发货";

/* ============================================================================
   收货提交：数量定状态（决策 3）、异常定差异单（决策 1）、举证并入收货（决策 4）、补发闭环终态（决策 5）
   ============================================================================ */
const STORE_ADDR = { "9071门店": "辽宁省铁岭市银州区工人街 28 号", "九天门店": "广东省广州市荔湾区宝华路 76 号", "濮源直播间": "广州市越秀区东风中路 410 号时代地产中心" };
/* 生成下一个 FHD 单号（跨两端去重） */
export function newFhdId() {
  const used = new Set([...supplyStore.get(), ...supplierStore.get()].map((d) => d.id));
  const dt = new Date();
  const ymd = String(dt.getFullYear()).slice(2) + String(dt.getMonth() + 1).padStart(2, "0") + String(dt.getDate()).padStart(2, "0");
  let n = 1, id = "FHD" + ymd + String(n).padStart(4, "0");
  while (used.has(id)) { n += 1; id = "FHD" + ymd + String(n).padStart(4, "0"); }
  return id;
}

/* ============================================================================
   发货任务：订单池 → 生成任务（一批 = 一个收货主体）
   批次不是系统按时间自动切出来的，而是发货方**显式生成**的：选门店 + 选支付时间截止点。
   所以发货侧分两个页签——日常按订单看（订单池），发货按任务看（汇总单）。
   ============================================================================ */
/* 供应商 → 总仓的收货地址：一批货统一进仓，不落到消费者门店 */
const HQ_ADDR = "广州市天河区科韵路 16 号";
export const POOL_SCOPES = {
  /* 租户后台 · 发货管理：总仓发给门店（自提单；供应商供货的还要上游已到总仓） */
  hq_store: { leg: "hq_store", shipper: "九天教育总仓", match: (o) => o.delivery === "上门自提" && o.supplyMode === "总部仓直配" },
  /* 供应商后台 · 发门店：供应商直配的自提单 */
  sup_store: { leg: "supplier_inbound", shipper: "JOJO供应商", match: (o) => o.delivery === "上门自提" && o.supplyMode === "供应商直配" },
  /* 供应商后台 · 发总仓：总部仓直配 · 供应商供货 的自提单，货要先到总仓再发门店。
     快递单不进池——货由发货方直发消费者，不经过总仓 / 门店，供货单承载不到它 */
  sup_hq: {
    leg: "supplier_to_hq", shipper: "JOJO供应商", receiver: "九天教育总仓", receiverAddr: HQ_ADDR,
    match: (o) => o.delivery === "上门自提" && o.supplyMode === "总部仓直配" && o.goodsSource === "供应商供货",
  },
};
const POOL_DONE = ["已完成", "已取消", "已全额退款", "已关闭"];

/* 订单池自动筛，不给人工勾：能发哪些单是业务规则定的，让人勾一定会把不该发的单生成任务。
   已经进过同链路任务的订单不再进池——否则会重复生成、重复发货。
   按**链路**判重而不是一票否决：同一个订单会先走「供应商 → 总仓」再走「总仓 → 门店」，两次都要入池 */
export function poolOf(scope, orders, supplyDocs) {
  const cfg = POOL_SCOPES[scope];
  const batched = new Set(supplyDocs.filter((d) => d.leg === cfg.leg).flatMap((d) => d.orderNos || []));
  return orders.filter((o) => {
    if (POOL_DONE.includes(o.status) || batched.has(o.no)) return false;
    if (!cfg.match(o)) return false;
    if (scope === "hq_store" && o.goodsSource !== "总部自有") {
      const up = supplyDocs.find((x) => x.leg === "supplier_to_hq" && ordersOf(x).includes(o.no));
      if (!(up && up.status === "已收货")) return false;   // 上游没到总仓，发不了
    }
    return true;
  });
}

/* 生成发货任务：按门店分组，一个门店一张；items 从订单商品汇总，from 保留订单来源可追溯 */
export function genTasksFrom(scope, pickedStores, cutoff, deps) {
  const cfg = POOL_SCOPES[scope];
  const { orders, supplyDocs, setOrders } = deps;
  const pool = poolOf(scope, orders, supplyDocs)
    .filter((o) => pickedStores.includes(o.store) && (!cutoff || (o.payTime || o.createdAt || "") <= cutoff));
  /* 收货方是仓时不按门店拆批：货统一进总仓，门店只是这些订单的自提点 */
  const groups = {};
  if (cfg.receiver) groups[cfg.receiver] = pool;
  else for (const o of pool) (groups[o.store] = groups[o.store] || []).push(o);
  const made = [];
  for (const [store, os] of Object.entries(groups)) {
    const items = [];
    for (const o of os) {
      const key = `${o.product || ""}|${o.spec || ""}`;
      let it = items.find((x) => x.key === key);
      if (!it) { it = { key, product: o.product, spec: o.spec, emoji: o.emoji, qty: 0, sent: 0, received: 0, from: [] }; items.push(it); }
      it.qty += o.qty || 0;
      it.from.push({ orderNo: o.no, qty: o.qty || 0 });
    }
    items.forEach((x) => delete x.key);
    const addQty = items.reduce((a, i) => a + i.qty, 0);
    const id = newFhdId();
    /* 生成只产出「待发货」任务：物流在发货环节填，生成这一步不碰物流。
       任务一旦生成就锁死：不再支持往已有任务里追加订单，避免同一批货改来改去对不上账 */
    addDoc({
      id, leg: cfg.leg, source: "发货任务生成",
      batchAt: new Date().toISOString().slice(0, 19).replace("T", " "),
      shipper: cfg.shipper, receiver: store, receiverAddr: cfg.receiver ? cfg.receiverAddr : (STORE_ADDR[store] || ""),
      orderNos: os.map((o) => o.no), items, packages: [],
      qty: addQty, sent: 0, received: 0, status: "待发货",
    });
    made.push({ id, store, count: os.length });
    const ns = os.map((o) => o.no);
    setOrders((all) => all.map((o) => (ns.includes(o.no) ? { ...o, batchNos: [...(o.batchNos || []), made[made.length - 1].id] } : o)));
  }
  return made;
}

export function applyReceive(doc, p) {
  /* 汇总单按**商品行**登记本次实收：items 是唯一源头，单据级 qty/sent/received 由它汇总 */
  const got = (p.lines || []).reduce((a, x) => a + x.got, 0);
  const items = itemsOf(doc).map((it) => {
    const l = (p.lines || []).find((x) => x.product === it.product);
    return l ? { ...it, received: (it.received || 0) + l.got } : it;
  });
  const recv = items.reduce((a, i) => a + (i.received || 0), 0);
  const sent = items.reduce((a, i) => a + (i.sent || 0), 0);
  const qty = items.reduce((a, i) => a + (i.qty || 0), 0);
  /* 结案基准 = **应发总量**：实收 < 应发就在确认收货这一刻记一张配送差异单，
     差多少 = 应发 − 实收（含发货方压根没发的部分），之后按「审核 → 补发单」补齐 ——
     补发单关联原供货单，这一批发过多少、收了多少、补多少能对上账 */
  const shortRecv = Math.max(0, sent - recv);   // 到货短少：收货方举证的那部分
  const shortShip = Math.max(0, qty - sent);    // 发货方还没发：系统自己知道，不用举证
  const isDiff = shortRecv + shortShip > 0;
  const full = !isDiff;
  /* 到货短少才算「收货异常」（实物与发货登记对不上）；
     只是发货方没发齐 → 「部分收货」—— 货已确认收下、单子结案，但带「部分收货」标签，
     剩下的量走差异单 → 补发单，由补发单回到「待收货」 */
  const status = shortRecv > 0 ? "收货异常" : shortShip > 0 ? "部分收货" : "已收货";

  patchDoc(doc.id, { items, received: recv, status });

  /* 提货码分配必须**先于**异常分支：少货也是「到货了一部分」，
     先下单的那几笔如果货已齐，就该能提货，不能因为同批有别的商品短少而一起卡住 */
  let extra = "";
  const orders = orderStore.get();
  if (["supplier_inbound", "hq_store"].includes(doc.leg)) {
    const { ready, short } = allocateByOrder({ ...doc, items }, orders);
    if (ready.length) {
      orderStore.set((os) => os.map((o) => (ready.includes(o.no) && !["已完成", "已取消", "已全额退款"].includes(o.status) ? { ...o, pickupReady: true } : o)));
      extra += `，${ready.length} 笔自提订单货已齐、提货码已激活`;
    }
    if (short.length) extra += `，${short.length} 笔订单货未齐、提货码暂不可用`;
  }

  if (isDiff) {
    /* 决策 5：补发单再出问题 → 只记异常标记，不再开新差异单，转线下 */
    if (doc.isMakeup) {
      patchDoc(doc.id, { makeupAnomaly: true });
      return `补发单 ${doc.id} 记收货异常标记（不再开新差异单，转线下处理）`;
    }
    const d = new Date();
    const ymd = String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0");
    /* 谁被上报谁审核：总仓收货（供应商 → 总仓）→ 总部上报、供应商审核；门店收货 → 门店上报、总部审核。
       两种来源的举证都在收货环节一次完成，直接进各自「待审核」态。 */
    const byHq = doc.leg === "supplier_to_hq";
    /* 差异原因：到货短少用收货方当场填的（要举证），发货方没发的系统自己标出来（不用举证） */
    const reasonText = [shortRecv > 0 ? p.reason : "", shortShip > 0 ? `发货方未发齐 ${shortShip} 件` : ""].filter(Boolean).join(" + ");
    addDiff({
      id: "DIFF" + ymd + String(diffStore.get().length + 1).padStart(4, "0"),
      source: byHq ? "总部上报" : "门店上报", leg: legLabelOf(doc), reporter: byHq ? "总部" : "门店",
      supplyNo: doc.id, shipper: doc.shipper,
      /* 差异摘要按商品逐条列：一批里可能只有某几个商品短少 */
      summary: items.filter((i) => (i.received || 0) < (i.qty || 0))
        .map((i) => `${i.product} 应收${i.qty}/实收${i.received} 差${i.qty - i.received}`).join("；") + `｜${reasonText}`,
      diffQty: shortRecv + shortShip,
      status: byHq ? "待供应商审核" : "待总部审核",
      evidence: shortRecv > 0 ? `${p.reason} · 照片 ${p.photos} 张` : `少发（发货方未发齐 ${shortShip} 件）· 无需举证`,
      note: p.note,
    });
    return `供货单 ${doc.id} 已记收货异常：应发 ${qty}、实收 ${recv}，差异单 ${shortRecv + shortShip} 件进入「${byHq ? "待供应商审核" : "待总部审核"}」，审核通过后生成补发单${extra}`;
  }

  /* 决策 5：补发单收满 → 原供货单同步结案 + 差异单转「补发完成」（不早退，继续走激活/生成） */
  if (doc.isMakeup && full && doc.reshipOf) {
    const diff = diffStore.get().find((x) => x.id === doc.reshipOf);
    const src = diff?.supplyNo ? supplyStore.get().find((x) => x.id === diff.supplyNo) : null;
    if (src) patchDoc(src.id, { status: "已收货", received: src.qty });
    diffStore.set((ds) => ds.map((x) => (x.id === doc.reshipOf ? { ...x, status: "补发完成" } : x)));
    extra += `，原供货单 ${diff?.supplyNo || ""} 同步结案，差异单转「补发完成」`;
  }

  /* F4③：总部仓直配（供应商供货）·自提订单，上游收满 → 自动生成「总部仓 → 门店」发货任务。
     汇总口径下按**门店**建批：同一门店的多个自提订单一并进这一批 */
  if (full && doc.leg === "supplier_to_hq") {
    const mine = ordersOf(doc);
    const pickups = orders.filter((o) => mine.includes(o.no) && o.delivery === "上门自提");
    const byStore = {};
    for (const o of pickups) {
      const no = o.supplyNo;
      const src = itemsOf(doc).find((it) => (it.from || []).some((f) => f.orderNo === o.no)) || itemsOf(doc)[0] || {};
      (byStore[o.store] = byStore[o.store] || []).push({
        product: o.product, spec: o.spec, emoji: o.emoji, qty: o.qty, sent: 0, received: 0,
        from: [{ orderNo: o.no, qty: o.qty }],
      });
      void no; void src;
    }
    for (const [store, its] of Object.entries(byStore)) {
      /* 去重按**订单**判，不按门店：门店手上已经有别的待发货批次，不该把这一单漏掉；
         反过来，已经在任一批次里的订单也不能重复建批（同一单只能进一批） */
      const covered = new Set(supplyStore.get().filter((d) => d.leg === "hq_store").flatMap((d) => d.orderNos || []));
      const fresh = its.filter((x) => !covered.has(x.from[0].orderNo));
      if (!fresh.length) continue;
      const id = newFhdId();
      supplyStore.set((ds) => [{
        id, leg: "hq_store", source: "上游收货自动生成",
        batchAt: new Date().toISOString().slice(0, 19).replace("T", " "),
        shipper: "九天教育总仓", receiver: store, receiverAddr: STORE_ADDR[store] || "",
        orderNos: fresh.map((x) => x.from[0].orderNo),
        items: fresh, packages: [],
        qty: fresh.reduce((a, x) => a + x.qty, 0), sent: 0, received: 0, status: "待发货",
      }, ...ds]);
      extra += `，系统自动生成「总部仓 → ${store}」发货任务 ${id}（${fresh.length} 笔自提订单）`;
    }
  }
  return full ? `供货单 ${doc.id} 已收货${extra}`
    : `供货单 ${doc.id} ${status}：应发 ${qty}、实收 ${recv}，差额 ${qty - recv} 件已开配送差异单，审核通过后由补发单补齐${extra}`;
}

/* 补发单标记（列表通用）：补发单 + 源差异单 + 原供货单，关联关系一眼可见 */
export function MakeupTag({ d }) {
  if (!d.isMakeup) return null;
  const orig = diffStore.get().find((x) => x.id === d.reshipOf)?.supplyNo;
  return (
    <small style={{ color: "#f5a623" }}>
      补发单 · 源差异单 {d.reshipOf}{orig && <> · 原供货单 <span className="mono">{orig}</span></>}
    </small>
  );
}

/* 商品列：一批可能含多个商品，列表只展示首个 + 「等 N 种」，明细进详情看 */
const Thumb = ({ d }) => {
  const { first, spec, emoji, more } = itemsLabel(d);
  const n = itemsOf(d).length;
  return (
    <div className="prod-cell">
      <span className="thumb" style={{ background: "#f4f7f6" }}>{emoji}</span>
      <div>
        <div>{first}{more > 0 && <span className="note"> 等 {n} 种</span>}</div>
        <small>{spec}</small>
      </div>
    </div>
  );
};

function DocTable({ rows, tab, setTab, tabs, mode, onOpen, onBatch }) {
  /* 收货管理为收货方视角：「已发货」= 还没确认收货（显示「待收货」）；
     「部分收货」= 已经确认收过、只是没发齐 → 归「已收货」（状态词保留，卡上看得到是部分） */
  const statusText = (d) => {
    if (mode === "receive" && d.status === "已发货") return "待收货";
    if (mode === "receive" && d.status === "部分收货") return "已收货";
    if (mode === "ship" && d.status === "部分收货") return "已发货";   // 发货方视角：货已发出，对方收了一部分
    return d.status;
  };
  const list = rows.filter((d) => (tab === "全部" ? true : statusText(d) === tab));
  const { sel, allSel, toggleAll, toggleOne } = useRowSelect(list.map((d) => d.id));
  const pg = usePaged(list);
  return (
    <>
      <div className="pills">
        {tabs.map((t) => (
          <span key={t} className={`pill ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>{t}</span>
        ))}
      </div>
      <BatchBar allSel={allSel} toggleAll={toggleAll} count={sel.size}>
        {mode === "ship" && (
          <>
            <button className="act" onClick={() => onBatch("batch")}>批量发货</button>
            <button className="act" onClick={() => onBatch("import")}>导入发货</button>
            <button className="act" onClick={() => onBatch("template")}>下载发货模板</button>
          </>
        )}
      </BatchBar>
      <div className="tbl-wrap">
        <table className="tbl-tight">
          <thead>
            <tr>
              <th style={{ width: 36 }}><input type="checkbox" checked={allSel} onChange={toggleAll} /></th>
              <th className="tw">供货单号</th><th className="tw">任务来源</th><th className="tw">关联销售订单</th>
              <th>商品</th><th className="tw">供货路径</th><th className="tw">发货主体</th><th>收货主体</th>
              <th className="tw">应发/已发</th><th className="tw">快递公司/物流单号</th><th className="tw">物流轨迹</th>
              <th className="tw">供货状态</th><th style={{ minWidth: 92 }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {pg.pageRows.map((d) => (
              <tr key={d.id}>
                <td><input type="checkbox" checked={sel.has(d.id)} onChange={() => toggleOne(d.id)} /></td>
                <td className="tw mono">{d.id}</td>
                <td className="tw">{d.source || "订单汇总生成"}<small className="mono">{d.batchAt || d.createdAt}</small>
                  <MakeupTag d={d} /></td>
                <td className="tw mono">{ordersOf(d).length > 1
                  ? <>{ordersOf(d)[0]}<small style={{ display: "block", color: "#999" }}>等 {ordersOf(d).length} 笔订单</small></>
                  : <>{ordersOf(d)[0] || "-"}</>}</td>
                <td><Thumb d={d} /></td>
                <td className="tw">{legLabelOf(d)}</td>
                <td className="tw">{d.shipper}</td>
                <td>{d.receiver}<small>{d.receiverAddr}</small></td>
                <td className="tw mono">{qtyOf(d)}/{sentOf(d)}
                  {d.status === "部分收货" && <small style={{ color: "#f5a623" }}>已收 {receivedOf(d)}｜待补 {qtyOf(d) - receivedOf(d)} 件{sentOf(d) < qtyOf(d) ? `（发货方待发 ${qtyOf(d) - sentOf(d)} 件）` : ""}</small>}
                  {d.status === "收货异常" && !d.makeupAnomaly && <small style={{ color: "#f5522e" }}>实收 {receivedOf(d)}｜差 {Math.max(0, qtyOf(d) - receivedOf(d))} 件</small>}
                  {d.makeupAnomaly && <small style={{ color: "#f5522e" }}>补发仍有异常 · 转线下</small>}
                </td>
                <td className="tw mono">{packagesOf(d).length
                  ? <>{packagesOf(d)[0].carrier}<small>{packagesOf(d)[0].tracking}</small>
                    {packagesOf(d).length > 1 && <small style={{ display: "block", color: "#999" }}>共 {packagesOf(d).length} 个包裹</small>}</>
                  : "-"}</td>
                <td className="tw">{packagesOf(d).length ? <span onClick={() => onOpen("track", d)} style={{ color: "#25c7a5", cursor: "pointer" }}>{packagesOf(d).length > 1 ? `查看 ${packagesOf(d).length} 个包裹` : "查看物流轨迹"}</span> : "-"}</td>
                <td className="tw">
                  <span className={`tag ${statusText(d) === "待发货" ? "warn" : statusText(d) === "待收货" ? "blue" : statusText(d) === "收货异常" ? "danger" : ""}`}>{statusText(d)}</span>
                  {d.status === "部分收货" && <small style={{ color: "#f5a623" }}>未收满：实收 {receivedOf(d)}／应发 {qtyOf(d)}</small>}
                  {d.autoConfirmed && <small style={{ color: "#2f80ed" }}>系统自动确认</small>}
                </td>
                <td>
                  <div className="op-col">
                    {/* 收货方的待收货行：重点是「这单是给谁的」，详情让位给关联订单 */}
                    {mode === "receive" && statusText(d) === "待收货"
                      ? <button onClick={() => onOpen("order", d)}>关联订单</button>
                      : <button className="gray" onClick={() => onOpen("detail", d)}>详情</button>}
                    {/* 补发单的发货操作收口在配送差异页，本列表只读监控 */}
                    {mode === "ship" && canShip(d) && (d.isMakeup
                      ? <span style={{ color: "#bbb", fontSize: 14, height: 22 }}>在配送差异发货</span>
                      : <button onClick={() => onOpen("ship", d)}>发货</button>)}
                    {mode === "ship" && awaitSupShip(d) && <span style={{ color: "#bbb", fontSize: 14, height: 22 }}>{d.isMakeup ? "在配送差异发货" : "由供应商发货"}</span>}
                    {mode === "ship" && awaitHqReceive(d) && <span title="总部仓确认收货后本页才可发货" style={{ color: "#f5a623", fontSize: 13, height: 22 }}>待总部仓收货</span>}
                    {mode === "receive" && canReceive(d) && <button onClick={() => onOpen("receive", d)}>收货</button>}
                  </div>
                </td>
              </tr>
            ))}
            {!list.length && <tr><td colSpan={13} style={{ textAlign: "center", padding: 40, color: "#999" }}>暂无数据</td></tr>}
          </tbody>
        </table>
      </div>
      <Pager {...pg} />
    </>
  );
}

/* ---------------- 自提订单（池子：货要到门店才能交接，还没进发货任务） ----------------
   池子里只有「上门自提」的订单，所以配送方式是恒定的，不占一列；门店这一列就是这个单要去自提的门店 */
export function OrderPool({ scope }) {
  const orders = orderStore.use();
  const docs = supplyStore.use();
  const [gen, setGen] = useState(null);
  const [toast, tip] = useToast();
  const all = poolOf(scope, orders, docs);
  const stores = [...new Set(all.map((o) => o.store))];

  /* 筛选区就是「这次要发哪一批」的圈定范围，生成动作跟着它走：
     不再把支付时间藏在生成弹窗里，否则页面上看到的和实际要发的对不上。
     「截止到 X 之前的已支付订单」是发货方每天用的口径，默认给今天 17:00 */
  const today = new Date().toISOString().slice(0, 10);
  const [f, setF] = useState({ store: "全部", date: today, time: "17:00" });
  const [q, setQ] = useState({ store: "全部", date: today, time: "17:00" });
  const cutoff = q.date ? `${q.date} ${q.time || "23:59"}:59` : "";
  const pool = all
    .filter((o) => q.store === "全部" || o.store === q.store)
    .filter((o) => !cutoff || (o.payTime || o.createdAt || "") <= cutoff);
  const oldest = pool.map((o) => o.payTime || o.createdAt || "").filter(Boolean).sort()[0];
  const waitH = oldest ? Math.max(0, Math.round((Date.now() - new Date(oldest.replace(/-/g, "/")).getTime()) / 36e5)) : 0;
  const dirty = f.store !== q.store || f.date !== q.date || f.time !== q.time;

  return (
    <>
      <div className="filters">
        <div className="row">
          <div className="field"><label>自提门店</label>
            <select className="ctl" value={f.store} onChange={(e) => setF((v) => ({ ...v, store: e.target.value }))}>
              {["全部", ...stores].map((x) => <option key={x}>{x}</option>)}
            </select>
          </div>
          <div className="field"><label>支付时间</label>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="date" className="ctl" style={{ width: 160 }} value={f.date} onChange={(e) => setF((v) => ({ ...v, date: e.target.value }))} />
              <span className="note" style={{ display: "inline" }}>之前（含）</span>
              <input type="time" className="ctl" style={{ width: 116 }} value={f.time} onChange={(e) => setF((v) => ({ ...v, time: e.target.value }))} />
            </div>
          </div>
          <div className="actions">
            <button className="btn primary" onClick={() => setQ(f)}>查询</button>
            <button className="btn" onClick={() => { const e = { store: "全部", date: "", time: "" }; setF(e); setQ(e); }}>重置</button>
          </div>
        </div>
        <div className="note" style={{ marginTop: 8 }}>
          只汇总<b>截止到这个时间点之前支付</b>的订单；之后支付的留在池子里等下一批。生成发货任务时，发出去的就是下面列出来的这些。
        </div>
      </div>

      <div className="alert">
        <span className="ic">i</span>
        当前筛选出 <b style={{ margin: "0 4px" }}>{pool.length}</b> 笔已支付的自提单待生成发货任务
        {all.length !== pool.length && <>（池子里共 {all.length} 笔，其余被筛选条件挡住）</>}
        {pool.length > 0 && <>，最早一笔已等待 <b style={{ margin: "0 4px" }}>{waitH}</b> 小时</>}
        <button className="btn primary" style={{ marginLeft: "auto" }} disabled={!pool.length || dirty}
          title={dirty ? "筛选条件改过了，先点「查询」再生成" : undefined}
          onClick={() => setGen({ k: "new" })}>
          生成发货任务（{pool.length} 笔）
        </button>
      </div>

      <div className="tbl-wrap">
        <table className="tbl-tight">
          <thead>
            <tr><th>商品信息</th><th className="tw">数量</th><th>买家</th><th className="tw">自提门店</th>
              <th className="tw">支付时间</th><th className="tw">供货模式</th></tr>
          </thead>
          <tbody>
            {pool.map((o) => (
              <tr key={o.id}>
                <td>
                  <div className="prod-cell">
                    <span className="thumb" style={{ background: "#f4f7f6" }}>{o.emoji}</span>
                    <div>
                      <div>订单号：<span className="mono" style={{ color: "#25c7a5" }}>{o.no}</span></div>
                      <div>{o.product}</div><small>{o.spec}</small>
                    </div>
                  </div>
                </td>
                <td className="tw mono">{o.qty}</td>
                <td>
                  <div>{o.buyer?.["昵称"] || "—"}</div>
                  <small className="mono">{o.buyer?.["收件人电话"] || "—"}</small>
                </td>
                <td className="tw">{o.store}</td>
                <td className="tw mono">{o.payTime || o.createdAt}</td>
                <td className="tw">{supplyLabelOf(o)}</td>
              </tr>
            ))}
            {!pool.length && (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: 34, color: "#999" }}>
                {all.length ? `当前筛选条件下没有订单（池子里还有 ${all.length} 笔）` : "没有待生成任务的自提单"}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {gen && <GenTaskModal scope={scope} pool={pool} cutoff={cutoff} onClose={() => setGen(null)}
        onDone={(made) => { setGen(null); tip(`已生成 ${made.length} 张发货任务：${made.map((m) => `${m.store} ${m.count} 笔`).join("；")}`); }} />}
      {toast}
    </>
  );
}

/* 生成 / 追加发货任务：选门店（可多选）+ 选支付时间截止点，按门店各生成一张 */
export function GenTaskModal({ scope, pool, cutoff, onClose, onDone }) {
  const cfg = POOL_SCOPES[scope];
  /* 收货方是仓（供应商 → 总仓）时不挑门店：货统一进仓，只出一张任务 */
  /* 门店多选：在页面筛选出来的范围里，再挑这次真要发的门店（有些店今天不发货）。
     支付时间不再重复给 —— 那是页面筛选区的条件，这里只显示，避免两处口径打架 */
  const stores = [...new Set(pool.map((o) => o.store))];
  const [picked, setPicked] = useState(stores);
  const will = pool.filter((o) => picked.includes(o.store) && (!cutoff || (o.payTime || o.createdAt || "") <= cutoff));
  const byStore = {};
  for (const o of will) (byStore[o.store] = byStore[o.store] || []).push(o);
  const toggle = (x) => setPicked((a) => (a.includes(x) ? a.filter((y) => y !== x) : [...a, x]));
  const n = cfg.receiver ? (will.length ? 1 : 0) : Object.keys(byStore).length;
  /* 订单明细可展开收起：单少时默认摊开（一眼核完），单多时默认收起（别把弹窗撑爆） */
  const [openMap, setOpenMap] = useState({});
  const isOpen = (x, cnt) => (x in openMap ? openMap[x] : cnt <= 3);
  const toggleOpen = (x, cnt) => setOpenMap((a) => ({ ...a, [x]: !isOpen(x, cnt) }));

  return (
    <div className="drawer-mask" style={{ justifyContent: "center", alignItems: "center" }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="drawer" style={{ width: 760, height: "auto", maxHeight: "88vh", borderRadius: 4 }}>
        <header>生成发货任务<button className="x" onClick={onClose}>×</button></header>
        <div className="body">
          <div className="alert">
            <span className="ic">i</span>
            {cfg.receiver
              ? <>把支付时间在截止点之前的订单汇总成<b style={{ margin: "0 4px" }}>一张</b>发货任务，统一发往 {cfg.receiver}；门店只是这些订单的自提点，不按门店拆批。订单进入任务后不会再次出现在自提订单里，避免重复发货。</>
              : <>把「发往同一门店、支付时间在截止点之前」的订单汇总成一张发货任务，每个门店各一张。订单进入任务后不会再次出现在自提订单里，避免重复发货。</>}
          </div>

          <div className="frow" style={{ marginTop: 14 }}>
            <label><i className="req">*</i>{cfg.receiver ? "收货主体" : "发往门店"}</label>
            <div className="fc">
              {cfg.receiver && (
                <>
                  <div style={{ fontSize: 13.5 }}><b>{cfg.receiver}</b>　<span className="note" style={{ display: "inline" }}>{cfg.receiverAddr}</span></div>
                  <div className="note">货统一进仓，下面按门店列出这批涉及的自提单；仓收货后再由总部仓发往各门店。</div>
                </>
              )}
              <div className="radio-row" style={{ flexWrap: "wrap", gap: 16, display: cfg.receiver ? "none" : undefined }}>
                {stores.map((x) => (
                  <label key={x}>
                    <input type="checkbox" checked={picked.includes(x)} onChange={() => toggle(x)} />
                    {x}<span className="note" style={{ marginLeft: 4 }}>（{pool.filter((o) => o.store === x).length} 笔）</span>
                  </label>
                ))}
              </div>
              {!stores.length && <div className="note">当前没有可汇总的订单</div>}
            </div>
          </div>

          <div className="frow">
            <label>支付时间</label>
            <div className="fc">
              <div style={{ fontSize: 13.5 }}>
                {cutoff ? <>截止到 <b className="mono">{cutoff.slice(0, 16)}</b> 之前（含）支付的订单</> : "不限支付时间"}
              </div>
              <div className="note">这个条件来自列表页的筛选区，要改回上一页改。</div>
            </div>
          </div>

          <h3 style={{ fontSize: 14, margin: "18px 0 8px" }}>这批将汇总以下订单</h3>
          {Object.entries(byStore).map(([x, os]) => (
            <div key={x} style={{ border: "1px solid var(--line)", borderRadius: 4, padding: "12px 14px", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 13 }}>
                <b>{x}</b>
                <span className="note" style={{ display: "inline" }}>
                  {os.length} 笔订单 · {new Set(os.map((o) => o.product)).size} 种商品 · {os.reduce((a, o) => a + (o.qty || 0), 0)} 件
                </span>
                <span className="note" style={{ display: "inline", marginLeft: "auto" }}>生成后进入发货任务列表（待发货），物流在发货时填</span>
              </div>
              {/* 生成前要能核对「这批到底是谁的单」——只给汇总数，发货方没法确认 */}
              <div style={{ marginTop: 8, display: "flex", alignItems: "center" }}>
                <span className="note" style={{ display: "inline" }}>订单明细（{os.length} 笔）</span>
                <button className="btn link" style={{ marginLeft: 8 }} onClick={() => toggleOpen(x, os.length)}>
                  {isOpen(x, os.length) ? "收起" : "展开"}
                </button>
              </div>
              {isOpen(x, os.length) && (
                <table className="tbl-tight" style={{ marginTop: 6 }}>
                  <thead><tr><th className="tw">销售订单</th><th>买家</th><th>商品</th><th className="tw">数量</th><th className="tw">支付时间</th></tr></thead>
                  <tbody>
                    {os.map((o) => (
                      <tr key={o.no}>
                        <td className="tw mono">{o.no}</td>
                        <td>{o.buyer?.["收件人"] || o.buyer?.昵称 || "—"}</td>
                        <td>{o.emoji} {o.product}　<small>{o.spec}</small></td>
                        <td className="tw mono">{o.qty}</td>
                        <td className="tw mono">{o.payTime || o.createdAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
          {!n && <div className="note" style={{ textAlign: "center", padding: 24 }}>当前条件下没有可汇总的订单</div>}
        </div>
        <div className="foot">
          <button className="btn plain" onClick={onClose}>取消</button>
          <button className="btn primary" disabled={!n}
            onClick={() => onDone(genTasksFrom(scope, picked, cutoff, {
              orders: orderStore.get(), supplyDocs: supplyStore.get(), setOrders: orderStore.set,
            }))}>
            生成 {n} 张发货任务
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================ 供货发货 ============================ */
export function SupplyDispatch() {
  const [view, setView] = useState("pool");     // pool 自提订单 / tasks 发货任务
  const [tab, setTab] = useState("全部");
  const [modal, setModal] = useState(null);
  const [batch, setBatch] = useState(null);
  const [toast, tip] = useToast();
  const docs = supplyStore.use();
  const rows = docs.filter(isTenantLeg);
  const pending = rows.filter((d) => canShip(d) && !d.isMakeup).length;
  /* 补发单发货收口在配送差异页：批量 / 导入 / 模板不含补发单 */
  const canShipRows = rows.filter((d) => canShip(d) && !d.isMakeup);

  return (
    <>
      {/* 日常按订单看（订单池），发货按任务看（汇总单）——批次是发货方显式生成的，不是系统按时间切的 */}
      <div className="tabs" style={{ display: "flex", gap: 28, borderBottom: "1px solid var(--line)", marginBottom: 16, paddingLeft: 8 }}>
        {[["pool", "自提订单"], ["tasks", "发货任务"]].map(([k, t]) => (
          <span key={k} onClick={() => setView(k)}
            style={{ paddingBottom: 12, fontSize: 14, cursor: "pointer",
              color: view === k ? "var(--brand)" : "var(--text-2)",
              borderBottom: view === k ? "2px solid var(--brand)" : "2px solid transparent",
              fontWeight: view === k ? 600 : 400 }}>{t}</span>
        ))}
      </div>

      {view === "pool" ? <OrderPool scope="hq_store" /> : (<>
      <div className="filters">
        <div className="row">
          <div className="field"><label>供货路径</label>
            <select className="ctl" defaultValue=""><option value="">请选择供货路径</option><option>供应商 → 总仓</option><option>供应商 → 门店</option><option>总部仓 → 门店</option><option>总部自有 → 门店</option></select>
          </div>
          <div className="field"><label>供货单号</label><input className="ctl w-lg" placeholder="供货单号/销售订单/收货主体" /></div>
          <div className="actions"><button className="btn primary">查询</button><button className="btn">重置</button></div>
        </div>
      </div>

      <div className="alert">
        <span className="ic">i</span>您有 <b style={{ margin: "0 4px" }}>{pending}</b> 笔待发货供货单
      </div>

      <DocTable rows={rows} tab={tab} setTab={setTab} tabs={["全部", "待发货", "已发货", "收货异常", "已收货"]} mode="ship" onOpen={(k, d) => setModal({ k, d })} onBatch={setBatch} />

      {modal?.k === "ship" && <ShipDrawer doc={modal.d} onClose={() => setModal(null)} onDone={(p) => { tip(applyShip(modal.d, p)); setModal(null); }} />}
      {modal?.k === "receive" && <ReceiveDrawer doc={modal.d} onClose={() => setModal(null)} onDone={(p) => { tip(applyReceive(modal.d, p)); setModal(null); }} />}
      {modal?.k === "detail" && <DocDetailDrawer doc={modal.d} onClose={() => setModal(null)} />}
      {modal?.k === "track" && <TrackDrawer doc={modal.d} onClose={() => setModal(null)} />}
      {toast}
      {batch === "template" && <TemplateDrawer rows={canShipRows} onClose={() => setBatch(null)} />}
      {batch === "import" && <ImportDrawer rows={canShipRows} onClose={() => setBatch(null)} onDone={(items) => tip(`已导入发货 ${applyShipBatch(items)} 单`)} />}
      {batch === "batch" && <BatchShipDrawer rows={canShipRows} onClose={() => setBatch(null)} onDone={(items) => tip(`已批量发货 ${applyShipBatch(items)} 单`)} />}
      </>)}
    </>
  );
}

/* ============================ 供货收货 ============================ */
export function SupplyReceipt() {
  const [tab, setTab] = useState("全部");
  const [modal, setModal] = useState(null);
  const [toast, tip] = useToast();
  const docs = supplyStore.use();
  /* 收货现场是照着快递面单收货的：供货单号和快递单号都得能查，才能快速定位要收哪一批 */
  const [f, setF] = useState({ leg: "", kw: "", receiver: "全部" });
  const [q, setQ] = useState({ leg: "", kw: "", receiver: "全部" });
  const all = docs.filter((d) => RECEIVE_LEGS.includes(d.leg));
  const rows = all
    .filter((d) => !q.leg || legLabelOf(d) === q.leg)
    .filter((d) => q.receiver === "全部" || d.receiver === q.receiver)
    .filter((d) => matchDoc(d, q.kw));
  const autoList = rows.filter((d) => d.autoConfirmed);
  const receivers = [...new Set(all.map((d) => d.receiver))];

  return (
    <>
      <div className="filters">
        <div className="row">
          <div className="field"><label>供货路径</label>
            <select className="ctl" value={f.leg} onChange={(e) => setF((v) => ({ ...v, leg: e.target.value }))}>
              {["", "供应商 → 总仓", "供应商 → 门店", "总部仓 → 门店", "总部自有 → 门店"].map((o) => (
                <option key={o} value={o}>{o || "请选择供货路径"}</option>
              ))}
            </select>
          </div>
          <div className="field"><label>供货单号</label>
            <input className="ctl w-lg" value={f.kw} placeholder="供货单号 / 快递单号 / 销售订单 / 商品"
              onChange={(e) => setF((v) => ({ ...v, kw: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && setQ(f)} /></div>
          <div className="field"><label>收货主体</label>
            <select className="ctl" value={f.receiver} onChange={(e) => setF((v) => ({ ...v, receiver: e.target.value }))}>
              {["全部", ...receivers].map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="actions">
            <button className="btn primary" onClick={() => setQ(f)}>查询</button>
            <button className="btn" onClick={() => { const e = { leg: "", kw: "", receiver: "全部" }; setF(e); setQ(e); }}>重置</button>
          </div>
        </div>
      </div>

      <div className="alert">
        <span className="ic">i</span>确认内部供货到货；当前筛选出 <b style={{ margin: "0 4px" }}>{rows.length}</b> 笔供货单
      </div>
      {autoList.length > 0 && (
        <div className="alert" style={{ background: "#eef4ff", color: "#1f5fbf" }}>
          <span className="ic" style={{ background: "#2f80ed" }}>i</span>
          系统已自动确认 <b style={{ margin: "0 4px" }}>{autoList.length}</b> 笔超时到货（到店超过 {ARRIVAL_TIMEOUT_DAYS} 天门店未点「确认到货」）
          —— 对应的自提订单<b style={{ margin: "0 4px" }}>提货码已随之激活</b>
        </div>
      )}
      <DocTable rows={rows} tab={tab} setTab={setTab} tabs={["全部", "待发货", "待收货", "已收货", "收货异常"]} mode="receive" onOpen={(k, d) => setModal({ k, d })} />

      {modal?.k === "receive" && <ReceiveDrawer doc={modal.d} onClose={() => setModal(null)} onDone={(p) => { tip(applyReceive(modal.d, p)); setModal(null); }} />}
      {modal?.k === "ship" && <ShipDrawer doc={modal.d} onClose={() => setModal(null)} onDone={(p) => { tip(applyShip(modal.d, p)); setModal(null); }} />}
      {modal?.k === "detail" && <DocDetailDrawer doc={modal.d} onClose={() => setModal(null)} mode="receive" />}
      {modal?.k === "order" && <RelatedOrderDrawer doc={modal.d} onClose={() => setModal(null)} />}
      {modal?.k === "track" && <TrackDrawer doc={modal.d} onClose={() => setModal(null)} />}
      {toast}
    </>
  );
}

/* ============================ 配送差异 ============================ */
export function SupplyDiff() {
  const [source, setSource] = useState("总部上报");
  const [tab, setTab] = useState("全部");
  const rows = diffStore.use();
  const supplyDocs = supplyStore.use();
  const supplierDocs = supplierStore.use();
  const setRows = diffStore.set;
  const [detail, setDetail] = useState(null);
  const [pass, setPass] = useState(null);
  const [ship, setShip] = useState(null);   // 补发单发货：差异单在配送差异页内闭环
  const [toast, tip] = useToast();
  /* 两套来源的状态 Tab 不同：总部上报走「供应商审核」，门店上报走「总部审核 + 举证」 */
  const tabs = DIFF_TABS_BY_SOURCE[source];
  const list = rows.filter((d) => d.source === source && diffInTab(d.status, tab));
  const pg = usePaged(list);
  const makeupOf = (d) => (d.makeup ? [...supplyDocs, ...supplierDocs].find((x) => x.id === d.makeup) : null);

  return (
    <>
      <div className="filters">
        <div className="row">
          <div className="field">
            <span className="portal-sw">
              {["总部上报", "门店上报"].map((s) => (
                <button key={s} className={source === s ? "on" : ""} onClick={() => { setSource(s); setTab("全部"); }}>{s}</button>
              ))}
            </span>
          </div>
          <div className="field"><label>差异单号 / 供货单号</label><input className="ctl w-lg" placeholder="请输入差异单号或供货单号" /></div>
          <div className="actions"><button className="btn primary">查询</button><button className="btn">重置</button></div>
        </div>
      </div>

      <div className="pills">
        {tabs.map((t) => (
          <span key={t} className={`pill ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>{t}</span>
        ))}
      </div>

      <div className="tbl-wrap">
        <table>
          <thead>
            <tr><th className="tw">差异单号</th><th className="tw">来源链路</th><th className="tw">上报方</th><th className="tw">关联供货单</th><th className="tw">发货方（补发责任）</th><th>差异摘要</th><th>举证信息</th><th className="tw">状态</th><th className="tw">补发任务</th><th className="tw">操作</th></tr>
          </thead>
          <tbody>
            {pg.pageRows.map((d) => {
              const mk = makeupOf(d);
              return (
                <tr key={d.id}>
                  <td className="tw mono">{d.id}</td>
                  <td className="tw">{d.leg}</td>
                  <td className="tw">{d.reporter}</td>
                  <td className="tw mono">{d.supplyNo}</td>
                  <td className="tw">{d.shipper}</td>
                  <td>{d.summary}</td>
                  <td className="tw">{d.evidence}</td>
                  <td className="tw"><span className={`tag ${d.status === "待补发" ? "warn" : ["待供应商审核", "待总部审核"].includes(d.status) ? "blue" : d.status === "审核不通过" ? "danger" : d.status === "补发中" || d.status === "补发完成" ? "" : "gray"}`}>{d.status}</span>{d.rejectReason && <small style={{ color: "#f5522e" }}>原因：{d.rejectReason}</small>}</td>
                  <td className="tw">{d.makeup
                    ? <span className="mono" style={{ color: "#25c7a5" }}>
                        {d.makeup}
                        <small style={{ display: "block", fontFamily: "inherit" }}>{mk ? `${mk.status}${packagesOf(mk).length ? " · 已发物流" : ""}` : "—"}</small>
                      </span>
                    : <span style={{ color: "#999" }}>—</span>}</td>
                  <td className="tw">
                    <div className="op-col">
                      <button className="gray" onClick={() => setDetail(d)}>详情</button>
                      {d.status === "待总部审核" && <button onClick={() => setPass(d)}>审核</button>}
                      {/* 补发单闭环在配送差异页：本方为发货责任方（总部仓链路）→ 本页直接发货；供应商链路由供应商在其配送差异页发货 */}
                      {d.makeup && mk?.leg === "hq_store" && mk?.status === "待发货" && <button onClick={() => setShip(mk)}>发货</button>}
                      {d.makeup && mk && mk.leg !== "hq_store" && mk.status === "待发货" && <span style={{ color: "#bbb", fontSize: 14, height: 22 }}>由供应商发货</span>}
                    </div>
                  </td>
                </tr>
              );
            })}
            {!list.length && <tr><td colSpan={10} style={{ textAlign: "center", padding: 40, color: "#999" }}>当前筛选下暂无差异单</td></tr>}
          </tbody>
        </table>
      </div>
      <Pager {...pg} />

      {toast}
      {ship && <ShipDrawer doc={ship} onClose={() => setShip(null)} onDone={(p) => {
        tip(applyShip(ship, p));
        /* 补发发货 → 差异单推进：待补发 → 补发中（在途）；到货收货后由收货链路转「补发完成」 */
        if ((ship.sent ?? 0) + p.qty >= ship.qty) setRows((rs) => rs.map((r) => (r.makeup === ship.id && r.status === "待补发" ? { ...r, status: "补发中" } : r)));
        setShip(null);
      }} />}
      {detail && <DiffDetailDrawer row={detail} onClose={() => setDetail(null)} />}
      {pass && (
        <DiffAuditModal
          row={pass}
          onClose={() => setPass(null)}
          onReject={(reason) => {
            setRows((rs) => rs.map((r) => (r.id === pass.id ? { ...r, status: "审核不通过", rejectReason: reason } : r)));
            tip(`差异单 ${pass.id} 已驳回：${reason}（不再补发，转线下处理）`);
            setPass(null);
          }}
          onPass={() => {
            /* 决策 5：审核通过 → 按「谁发货谁补发」生成补发供货单，进对应发货页 */
            const all = [...supplyStore.get(), ...supplierStore.get()];
            const orig = all.find((d) => d.id === pass.supplyNo);
            const reshipId = newFhdId();
            /* 补发只补**少的那几个商品**，不复制整批 */
            /* 补发量 = 应发 − 已收：发货方少发的、到货短少的，一并按补发单补 */
            const miss = itemsOf(orig).map((it) => {
              const need = (it.qty || 0) - (it.received || 0);
              return need > 0 ? { ...it, qty: need, sent: 0, received: 0 } : null;
            }).filter(Boolean);
            const its = miss.length ? miss : [{ product: "补发商品", spec: "", emoji: "📦", qty: pass.diffQty ?? 1, sent: 0, received: 0, from: [] }];
            const doc = {
              id: reshipId, leg: orig?.leg || "hq_store", source: "配送差异补发",
              batchAt: new Date().toISOString().slice(0, 19).replace("T", " "),
              shipper: pass.shipper, receiver: orig?.receiver || "—", receiverAddr: orig?.receiverAddr || "",
              orderNos: ordersOf(orig), items: its, packages: [],
              qty: its.reduce((a, x) => a + x.qty, 0), sent: 0, received: 0, status: "待发货",
              supplyMode: orig?.supplyMode, goodsSource: orig?.goodsSource,
              isMakeup: true, reshipOf: pass.id,
            };
            /* 谁发货谁补发：供应商发起的链路推送供应商后台，总部仓链路留在发货管理 */
            if (doc.leg === "sup_consumer") supplierStore.set((ds) => [doc, ...ds]);
            else if (["supplier_to_hq", "supplier_inbound"].includes(doc.leg)) { supplyStore.set((ds) => [doc, ...ds]); supplierStore.set((ds) => [doc, ...ds]); }
            else supplyStore.set((ds) => [doc, ...ds]);
            setRows((rs) => rs.map((r) => (r.id === pass.id ? { ...r, status: "待补发", makeup: reshipId } : r)));
            tip(`差异单 ${pass.id} 审核通过，已生成补发供货单 ${reshipId}（${doc.leg === "hq_store" ? "在本页「补发任务」列点「发货」" : "由供应商在其配送差异页发货"}）`);
            setPass(null);
          }}
        />
      )}
    </>
  );
}

/* ---------------- 审核配送差异（通过 / 不通过 · 不通过须填原因） ---------------- */
export function DiffAuditModal({ row, onClose, onPass, onReject }) {
  const [result, setResult] = useState("通过");
  const [reason, setReason] = useState("");
  const ok = result === "通过" || reason.trim().length > 0;
  return (
    <div className="gmock" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="gbox" style={{ width: 520 }}>
        <b>审核配送差异</b>
        <div style={{ marginTop: 12, background: "#f7f8fa", borderRadius: 4, padding: "10px 12px", fontSize: 12.5, lineHeight: 1.9, color: "#5b6672" }}>
          <div>差异单号：<span className="mono">{row.id}</span>　关联供货单：<span className="mono">{row.supplyNo}</span></div>
          <div>差异摘要：{row.summary}</div>
          {row.evidence && row.evidence !== "—" && <div>举证：{row.evidence}</div>}
        </div>
        <div className="radio-row" style={{ marginTop: 14 }}>
          <label><input type="radio" checked={result === "通过"} onChange={() => setResult("通过")} />审核通过</label>
          <label><input type="radio" checked={result === "不通过"} onChange={() => setResult("不通过")} />审核不通过</label>
        </div>
        {result === "不通过" && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 6 }}><i className="req">*</i>不通过原因</div>
            <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="请填写不通过原因（必填）——随差异单记录，对门店 / 供应商可见" style={{ width: "100%" }} />
          </div>
        )}
        <p style={{ margin: "12px 0 0", fontSize: 12.5, lineHeight: 1.8, color: "#5b6672" }}>
          {result === "通过" ? "通过 → 按「谁发货谁补发」生成补发供货单并执行补发。" : "不通过 → 不再补发，差异单转「审核不通过」，原因随单记录。"}
        </p>
        <div className="gfoot">
          <button className="btn plain" onClick={onClose}>取消</button>
          <button className="btn primary" disabled={!ok} title={ok ? "" : "请填写不通过原因"} onClick={() => (result === "通过" ? onPass() : onReject(reason.trim()))}>确认</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- 配送差异详情 ---------------- */
/* 举证照片占位（按「xxx · 照片 N 张」渲染 N 个占位块） */
export function EvidencePhotos({ evidence, size = 96 }) {
  const n = Number((String(evidence).match(/照片 (\d+) 张/) || [])[1] || 0);
  if (!n) return <span className="note">待收货方举证</span>;
  const reason = String(evidence).split(" · ")[0] || "举证";
  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} style={{ width: size }}>
          <div style={{ width: size, height: size, borderRadius: 4, background: "#f4f6f7", border: "1px dashed #cfd6db", display: "grid", placeItems: "center", fontSize: size > 40 ? 26 : 14, color: "#b6bdc4" }}>🖼</div>
          {size > 40 && <div className="note" style={{ marginTop: 4, textAlign: "center", fontSize: 11 }}>{reason}照片 {i + 1}（占位）</div>}
        </div>
      ))}
    </div>
  );
}

function DiffDetailDrawer({ row, onClose }) {
  const makeupDoc = row.makeup ? [...supplyStore.get(), ...supplierStore.get()].find((d) => d.id === row.makeup) : null;
  return (
    <div className="drawer-mask" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="drawer" style={{ width: 620 }}>
        <header>配送差异详情<button className="x" onClick={onClose}>×</button></header>
        <div className="body">
          <section className="card">
            <h3>差异单 {row.id}</h3>
            <div className="cbody">
              <div className="frow"><label>上报来源</label><div className="fc"><input value={`${row.source} · ${row.leg}`} readOnly /></div></div>
              <div className="frow"><label>上报方</label><div className="fc"><input value={row.reporter} readOnly /></div></div>
              <div className="frow"><label>关联供货单</label><div className="fc"><input className="mono" value={row.supplyNo} readOnly /></div></div>
              <div className="frow"><label>发货方</label><div className="fc"><input value={`${row.shipper}（补发责任方）`} readOnly /></div></div>
            </div>
          </section>

          <section className="card">
            <h3>差异与举证</h3>
            <div className="cbody">
              <div className="frow"><label>差异摘要</label><div className="fc"><input value={row.summary} readOnly /></div></div>
              <div className="frow"><label>举证信息</label><div className="fc"><input value={row.evidence} readOnly /></div></div>
              <div className="frow"><label>举证照片</label><div className="fc" style={{ paddingTop: 6 }}><EvidencePhotos evidence={row.evidence} /></div></div>
              <div className="frow"><label>当前状态</label><div className="fc"><span className={`tag ${row.status === "待补发" ? "warn" : ["待供应商审核", "待总部审核"].includes(row.status) ? "blue" : row.status === "审核不通过" ? "danger" : row.status === "已关闭" ? "gray" : ""}`}>{row.status}</span></div></div>
              {row.rejectReason && <div className="frow"><label>驳回原因</label><div className="fc"><input value={row.rejectReason} readOnly style={{ color: "#f5522e" }} /></div></div>}
              {row.makeup && <div className="frow"><label>补发供货单</label><div className="fc"><input className="mono" value={row.makeup} readOnly /></div></div>}
              {row.makeup && (
                <div className="frow"><label>补发物流</label><div className="fc">
                  {makeupDoc && packagesOf(makeupDoc).length
                    ? <span>{packagesOf(makeupDoc).map((p) => `${p.carrier} ${p.tracking}`).join("；")}　{packagesOf(makeupDoc)[0].track}</span>
                    : <span className="note">补发供货单 {row.makeup} 尚未发货（{makeupDoc?.leg === "hq_store" ? "在配送差异列表点「发货」提交物流" : "由供应商在其配送差异页发货"}）</span>}
                </div></div>
              )}
            </div>
          </section>

          <section className="card">
            <h3>处理口径</h3>
            <div className="cbody">
              <div className="note" style={{ padding: 10, lineHeight: 1.9 }}>
                <b>谁被上报谁审核</b>：总部上报（供应商 → 总仓，总仓收货时登记）→ 供应商审核；门店上报 → 总部审核。
                审核通过后按「<b>谁发货谁补发</b>」自动生成补发供货单，补发单带「补发」标识、关联原供货单。
              </div>
            </div>
          </section>
        </div>
        <div className="foot"><button className="btn plain" onClick={onClose}>关闭</button></div>
      </div>
    </div>
  );
}

/* 订单关联：这张供货单上的某件商品，是哪些销售订单要的 —— 订单号 + 购买者。
   自提单要靠它知道「货到了通知谁」，所以联系方式一并给出。 */
export function OrderRefsPop({ item, orders, onClose, mask }) {
  const [kw, setKw] = useState("");
  const paged = usePaged((item.from || []).map((f) => ({ ...f, order: orders.find((o) => o.no === f.orderNo) })).filter((r) => matchOrder(r.order, kw)), 10);
  /* 供应商侧的买家信息脱敏（供应商只管把货发到门店，不该拿到消费者联系方式） */
  const hide = (t) => (mask && t && t.length > 1 ? t[0] + "*".repeat(t.length - 1) : t);
  const hidePhone = (t) => (mask && t ? t.slice(0, 3) + "****" + t.slice(-4) : t);
  const rows = paged.pageRows;
  return (
    <div className="drawer-mask" style={{ justifyContent: "center", alignItems: "center" }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="drawer" style={{ width: 660, height: "auto", maxHeight: "82vh", borderRadius: 4 }}>
        <header>订单关联<button className="x" onClick={onClose}>×</button></header>
        <div className="body">
          <div className="note" style={{ marginTop: 0 }}>{item.product}　{item.spec}　共 {paged.total} 笔订单，合计 {item.qty} 件</div>
          <div className="note" style={{ marginTop: 2 }}>{mask ? "买家联系方式对供应商脱敏，发货到店后由门店 / 总部通知买家" : "自提单货到后按联系电话通知买家来取"}</div>
          <input className="ctl" value={kw} onChange={(e) => { setKw(e.target.value); paged.setPage(1); }}
            placeholder="搜订单号 / 手机号 / 姓名" style={{ width: "100%", height: 32, marginTop: 10 }} />
          <table className="tbl-tight" style={{ marginTop: 10 }}>
            <thead>
              <tr><th>订单号</th><th className="tw">购买数量</th><th>购买者</th><th>联系电话</th><th className="tw">配送方式</th><th className="tw">下单时间</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const o = r.order;
                const nick = o?.buyer?.["昵称"] || "-";
                const rcpt = o?.buyer?.["收件人"];
                return (
                  <tr key={r.orderNo}>
                    <td className="mono">{r.orderNo}</td>
                    <td className="tw mono">{r.qty}</td>
                    <td>
                      <div>{hide(nick)}</div>
                      {rcpt && rcpt !== nick && <small>收件人：{hide(rcpt)}</small>}
                    </td>
                    <td className="mono">{o?.buyer?.["收件人电话"] ? hidePhone(o.buyer["收件人电话"]) : "—"}</td>
                    <td className="tw">{o?.delivery || "—"}</td>
                    <td className="mono">{o?.createdAt || "—"}</td>
                  </tr>
                );
              })}
              {!rows.length && <tr><td colSpan={6} style={{ textAlign: "center", padding: 26, color: "#999" }}>{kw ? "没有匹配的订单" : "暂无订单"}</td></tr>}
            </tbody>
          </table>
          <Pager {...paged} />
        </div>
      </div>
    </div>
  );
}

/* ============================ 发货弹窗（版式与真实 SaaS「发货」弹窗一致） ============================ */
function ShipDrawer({ doc, onClose, onDone }) {
  /* 一次发一部分是常态（货没备齐，先发装好的那几箱），所以「本次发货」按商品行可改：
     默认发满未发数量，改小就是少发，剩余部分之后再点「发货（补齐）」。上限 = 应发 − 已发 */
  const [lines, setLines] = useState(() => itemsOf(doc).map((it) => {
    const remain = Math.max(0, (it.qty || 0) - (it.sent || 0));
    return { product: it.product, spec: it.spec, emoji: it.emoji, qty: it.qty, max: remain, out: remain, from: it.from || [] };
  }));
  const setOut = (i, v) => setLines((a) => a.map((x, j) => (j === i ? { ...x, out: Math.max(0, Math.min(x.max, v)) } : x)));
  /* 包裹可以多个：一批装不下就拆包，每个包裹一条运单号 */
  const [pk, setPk] = useState([{ carrier: "", tracking: "" }]);
  const setPkAt = (i, k, v) => setPk((a) => a.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  const totalOut = lines.reduce((a, x) => a + x.out, 0);
  const parcels = pk.filter((x) => x.carrier && x.tracking.trim());
  /* 发货地址只从「设置 › 地址库 › 发货地址」里选，默认地址唯一（isDefault），弹窗打开即选中它 */
  const addresses = addressBookStore.use().filter((a) => a.type === "ship");
  const [addr, setAddr] = useState(() => Math.max(0, addresses.findIndex((a) => a.isDefault)));
  const [rel, setRel] = useState(null);      // 订单关联弹层

  return (
    <div className="drawer-mask" style={{ justifyContent: "center", alignItems: "center" }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="drawer" style={{ width: 780, height: "auto", maxHeight: "88vh", borderRadius: 4 }}>
        <header>发货<button className="x" onClick={onClose}>×</button></header>
        <div className="body">
          <table className="tbl-tight">
            <thead>
              <tr>
                <th>商品信息</th><th className="tw">订单关联</th><th className="tw">单价(元)</th><th className="tw">数量/单位</th>
                <th className="tw">未发货数量</th><th className="tw">本次发货</th><th className="tw">发货状态</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => (
                <tr key={l.product}>
                  <td>
                    <div className="prod-cell">
                      <span className="thumb" style={{ background: "#f4f7f6" }}>{l.emoji}</span>
                      <div><div>{l.product}</div><small>{l.spec}</small></div>
                    </div>
                  </td>
                  <td className="tw">
                    <span onClick={() => setRel(l)} style={{ color: "#25c7a5", cursor: "pointer" }}>{l.from.length} 笔订单</span>
                  </td>
                  <td className="tw">￥0.01</td>
                  <td className="tw">{l.qty}</td>
                  <td className="tw mono">{l.max}</td>
                  <td className="tw">
                    <span className="qty">
                      <button className="btn plain sm" onClick={() => setOut(i, l.out - 1)}>−</button>
                      <input value={l.out} readOnly style={{ width: 44, textAlign: "center", height: 28 }} />
                      <button className="btn plain sm" disabled={l.out >= l.max} onClick={() => setOut(i, l.out + 1)}>＋</button>
                    </span>
                  </td>
                  <td className="tw">{l.max === 0 ? "已发齐" : `已发 ${l.qty - l.max}`}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3 style={{ fontSize: 14, margin: "18px 0 8px" }}>收货人信息</h3>
          <div style={{ lineHeight: 2, display: "flex", gap: 60 }}>
            <div>
              <div>配送方式： 快递发货</div>
              <div>收货人电话： —</div>
              <div>收货地址： {doc.receiverAddr}</div>
            </div>
            <div>收货人： {doc.receiver}</div>
          </div>

          <div style={{ display: "flex", alignItems: "center", margin: "18px 0 8px" }}>
            <h3 style={{ fontSize: 14, margin: 0 }}>选择发货地址</h3>
            <span className="note" style={{ marginLeft: "auto" }}>地址在「设置 › 地址库」维护，这里只做选择</span>
          </div>
          <table className="tbl-tight">
            <thead><tr><th style={{ width: 36 }}></th><th className="tw">联系人</th><th className="tw">联系方式</th><th>地址</th></tr></thead>
            <tbody>
              {addresses.map((a, i) => (
                <tr key={a.id}>
                  <td><input type="radio" checked={addr === i} onChange={() => setAddr(i)} /></td>
                  <td className="tw">{a.name} {a.isDefault && <span className="tag gray">默认</span>}</td>
                  <td className="tw mono">{a.phone}</td>
                  <td>{a.region.replace(/\//g, "")} {a.detail}</td>
                </tr>
              ))}
              {!addresses.length && <tr><td colSpan={4} className="note" style={{ padding: 16 }}>地址库里还没有发货地址，请先到「设置 › 地址库」添加</td></tr>}
            </tbody>
          </table>

          <div style={{ display: "flex", alignItems: "center", margin: "18px 0 8px" }}>
            <h3 style={{ fontSize: 14, margin: 0 }}>包裹与物流</h3>
            {/* 一批最多拆 50 个包裹；再多就不该在一张任务里拆了，应该另开一批 */}
            <button className="btn link" style={{ marginLeft: "auto" }} disabled={pk.length >= 50}
              onClick={() => setPk((a) => [...a, { carrier: "", tracking: "" }])}>+ 添加包裹</button>
          </div>
          <table className="tbl-tight">
            <thead><tr><th className="tw" style={{ width: 80 }}>包裹</th><th className="tw">快递公司</th><th className="tw">快递单号</th><th style={{ width: 60 }}></th></tr></thead>
            <tbody>
              {pk.map((p, i) => (
                <tr key={i}>
                  <td className="tw">第 {i + 1} 个</td>
                  <td className="tw">
                    <select className="ctl" value={p.carrier} onChange={(e) => setPkAt(i, "carrier", e.target.value)} style={{ width: 180, height: 30 }}>
                      <option value="">请选择或搜索快递公司</option>
                      {["顺丰速运", "圆通速递", "中通快递", "京东物流", "韵达快递", "极兔速递"].map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </td>
                  <td className="tw"><input className="ctl" style={{ height: 30 }} placeholder="请输入快递单号" value={p.tracking} onChange={(e) => setPkAt(i, "tracking", e.target.value)} /></td>
                  <td>{pk.length > 1 && <button className="btn link" onClick={() => setPk((a) => a.filter((_, j) => j !== i))}>删除</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="note">
            这一批发往 {doc.receiver}：本次共发 {lines.length} 种商品、{totalOut} 件。
            装不下可以拆成多个包裹（每个包裹一条运单号）；<b>也可以先只发一部分</b>——把「本次发货」改小。没发齐的部分不在这张单上补：收货方按已到的数量确认收货，差额在那一刻自动开配送差异单，审核通过后以补发单补到收货方。
          </div>

        </div>
        <div className="foot">
          <button className="btn plain" onClick={onClose}>取消</button>
          <button className="btn primary" disabled={totalOut < 1 || !parcels.length}
            onClick={() => onDone({ lines: lines.filter((x) => x.out > 0).map((x) => ({ product: x.product, qty: x.out })), packages: parcels, qty: totalOut })}>确认发货</button>
        </div>
      </div>
      {rel && <OrderRefsPop item={rel} orders={orderStore.get()} onClose={() => setRel(null)} />}
    </div>
  );
}

/* 发货提交：写回 sent / 物流，部分发货保持可再发（F6） */
export function applyShip(doc, p) {
  /* 汇总单按商品行发货；包裹可以多个（一批装不下就拆包），每个包裹一条运单号 */
  const items = itemsOf(doc).map((it) => {
    const l = (p.lines || []).find((x) => x.product === it.product);
    return l && l.qty ? { ...it, sent: (it.sent || 0) + l.qty } : it;
  });
  const sent = items.reduce((a, i) => a + (i.sent || 0), 0);
  const qty = items.reduce((a, i) => a + (i.qty || 0), 0);
  const at = "已发货 " + new Date().toISOString().slice(0, 19).replace("T", " ");
  const pk = [...packagesOf(doc), ...(p.packages || []).filter((x) => x.tracking && x.tracking.trim()).map((x) => ({ carrier: x.carrier, tracking: x.tracking.trim(), track: at }))];
  patchDoc(doc.id, {
    items, sent, packages: pk,
    /* 发了就是「已发货」：没发齐的部分不改状态（收货方那侧只是「还没收完」），
       差额等到收货方确认收货时按应发总量算、开差异单走补发 */
    status: "已发货",
  });
  const n = (p.lines || []).reduce((a, x) => a + x.qty, 0);
  return `供货单 ${doc.id} 已发货 ${n} 件${p.packages?.length ? `，${p.packages.length} 个包裹` : ""}` + (sent < qty ? `，剩余 ${qty - sent} 件可再发` : "");
}

/* 批量 / 导入发货共用：逐单写入。数量口径与单笔发货一致（F6 / 决策2：部分收货按未收满的差额） */
export function applyShipBatch(rows) {
  /* 批量 / 导入是「整批发货」：把该批未发完的商品一次发完，物流按一个包裹登记 */
  rows.forEach(({ doc, carrier, tracking }) => {
    const lines = itemsOf(doc).map((it) => {
      const remain = (it.qty || 0) - (it.sent || 0);
      return { product: it.product, qty: Math.max(0, remain) };
    }).filter((x) => x.qty > 0);
    if (lines.length) applyShip(doc, { lines, packages: [{ carrier, tracking }] });
  });
  return rows.length;
}

/* ============================ 收货抽屉（累计实收 F9 / R2 / R3） ============================ */
function ReceiveDrawer({ doc, onClose, onDone }) {
  const recv = receivedOf(doc);
  const sentTotal = sentOf(doc);
  const qtyTotal = qtyOf(doc);
  /* 一批多商品：逐行登记本次实收（店员是按商品点数的，不是按订单） */
  const [lines, setLines] = useState(itemsOf(doc).map((it) => {
    const remain = Math.max(0, (it.sent || 0) - (it.received || 0));
    return { product: it.product, spec: it.spec, emoji: it.emoji, should: it.sent || 0, done: it.received || 0, got: remain };
  }));
  const [reasons, setReasons] = useState([]);   // 与门店APP「配货差异原因」同字段（多选）
  const [note, setNote] = useState("");
  const [photos, setPhotos] = useState(0);
  const setGot = (i, v) => setLines((a) => a.map((x, j) => (j === i ? { ...x, got: Math.max(0, Math.min(x.should - x.done, v)) } : x)));
  const remain = lines.reduce((a, x) => a + Math.max(0, x.should - x.done), 0);   // 这次能收的 = 已发 − 已收
  const got = lines.reduce((a, x) => a + x.got, 0);

  /* 两笔账分开算：
     · 到货短少 = 能收的没收够 → 收货方要当场举证（原因必选 + 照片至少 1 张）
     · 发货方没发 = 应发 − 已发 → 系统自己就知道，不用举证，确认收货时一并进差异单 */
  const shortRecv = remain - got;
  const shortShip = Math.max(0, qtyTotal - sentTotal);
  const canSubmit = shortRecv <= 0 || (reasons.length > 0 && photos > 0);

  return (
    <div className="drawer-mask" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="drawer" style={{ width: 720 }}>
        <header>确认收货<button className="x" onClick={onClose}>×</button></header>
        <div className="body">
          <div className="filters" style={{ marginBottom: 14 }}>
            <div className="row" style={{ gap: 30 }}>
              <div className="field"><label>供货单号</label><b className="mono">{doc.id}</b></div>
              <div className="field"><label>发货主体</label><b>{doc.shipper}</b></div>
              <div className="field"><label>收货主体</label><b>{doc.receiver}</b></div>
            </div>
          </div>

          <div className="alert" style={{ marginBottom: 12 }}>
            <span className="ic">i</span>本单应发 <b style={{ margin: "0 4px" }}>{qtyTotal}</b> 件，已累计收到 <b style={{ margin: "0 4px" }}>{recv}</b> 件，本次还能收 <b style={{ margin: "0 4px" }}>{remain}</b> 件
            {shortShip > 0 && <>　｜　发货方只发了 {sentTotal} 件：能收的就是这 {sentTotal} 件，未发齐的 {shortShip} 件在确认收货时自动开配送差异单，审核通过后由 {doc.shipper} 补发到 {doc.receiver}</>}
          </div>

          <table>
            <thead><tr><th>商品</th><th className="tw">应发</th><th className="tw">已累计收</th><th className="tw">本次实收</th></tr></thead>
            <tbody>
              {lines.map((l, i) => (
                <tr key={l.product}>
                  <td>
                    <div className="prod-cell">
                      <span className="thumb" style={{ background: "#f4f7f6" }}>{l.emoji}</span>
                      <div><div>{l.product}</div><small>{l.spec}</small></div>
                    </div>
                  </td>
                  <td className="tw mono">{l.should}</td>
                  <td className="tw mono">{l.done}</td>
                  <td>
                    <div className="qty">
                      <button className="btn plain sm" onClick={() => setGot(i, l.got - 1)}>−</button>
                      <input value={l.got} onChange={(e) => setGot(i, Number(e.target.value.replace(/\D/g, "")) || 0)} style={{ width: 64, textAlign: "center" }} />
                      <button className="btn plain sm" onClick={() => setGot(i, l.got + 1)}>＋</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 收满：只有正常收货，不出现任何异常字段 */}
          {shortRecv <= 0 && (
            <div className="frow" style={{ marginTop: 18 }}>
              <label>收货结果</label>
              <div className="fc">
                <span className="hl" data-hl="系统强判" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  {shortShip > 0
                    ? <>
                        <span className="tag warn">开配送差异单</span>
                        <span className="note" style={{ display: "inline" }}>应发 {qtyTotal} 件、实收 {recv} 件：差额 {shortShip} 件（发货方未发齐）随确认收货一并开差异单，走审核 → 补发单关联原供货单</span>
                      </>
                    : <>
                        <span className="tag">正常收货</span>
                        <span className="note" style={{ display: "inline" }}>由「本次实收 vs 应发总量」自动判定，不可人工修改；收满后本单直接入库</span>
                      </>}
                </span>
              </div>
            </div>
          )}

          {/* 到货短少：直接登记异常，字段与门店APP「配送差异」一致 */}
          {shortRecv > 0 && (
            <>
              <div className="frow" style={{ marginTop: 18 }}>
                <label><i>*</i>配货差异原因</label>
                <div className="fc">
                  <div className="radio-row">
                    {["少货", "商品破损", "错货", "其他"].map((r) => (
                      <label key={r}>
                        <input type="checkbox" checked={reasons.includes(r)}
                          onChange={() => setReasons((rs) => (rs.includes(r) ? rs.filter((x) => x !== r) : [...rs, r]))} />{r}
                      </label>
                    ))}
                  </div>
                  <div className="note">
                    本次实收 {got} 件 ≠ 本次能收 {remain} 件：短少的 {shortRecv} 件记入配送差异单（审核通过后按「谁发货谁补发」）
                    {shortShip > 0 && <>；另有发货方未发齐的 {shortShip} 件一并记入同一张差异单</>}
                  </div>
                </div>
              </div>
              <div className="frow">
                <label>说明</label>
                <div className="fc">
                  <textarea rows={2} maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} placeholder="请输入说明，最多200字" />
                  <div className="note" style={{ textAlign: "right" }}>{note.length}/200</div>
                </div>
              </div>
              <div className="frow">
                <label><i>*</i>上传图片（最多上传5张）</label>
                <div className="fc">
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <div className="upload-box" onClick={() => setPhotos((p) => Math.min(5, p + 1))} style={{ cursor: "pointer" }}>
                      ＋<br /><span style={{ fontSize: 12 }}>添加照片</span>
                    </div>
                    {Array.from({ length: photos }, (_, i) => (
                      <span key={i} style={{ width: 62, height: 62, display: "grid", placeItems: "center", background: "#e8ecef", borderRadius: 4 }}>🧾</span>
                    ))}
                  </div>
                  <div className="note">上传文件（单个不超 5M）；举证在收货环节一次完成，提交后自动开配送差异单（总仓收货 → 交供应商审核；门店收货 → 交总部审核）</div>
                </div>
              </div>
            </>
          )}

        </div>
        <div className="foot">
          <button className="btn plain" onClick={onClose}>取消</button>
          <button className="btn primary" disabled={!canSubmit}
            onClick={() => onDone({ lines: lines.map((x) => ({ product: x.product, got: x.got })), reason: reasons.join("、"), note: note.trim(), photos })}>确认收货</button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   下载发货模板 / 导入发货 / 批量发货（进销存新增：真实 SAAS 无对应页面）
   ============================================================================ */
const TPL_COLS = [
  { k: "id", t: "供货单号", locked: true },
  { k: "shipper", t: "发货主体", locked: true },
  { k: "receiver", t: "收货主体", locked: true },
  { k: "receiverAddr", t: "收货地址", locked: true },
  { k: "product", t: "商品", locked: true },
  { k: "qty", t: "未发数量", locked: true },
  { k: "carrier", t: "快递公司", locked: false },
  { k: "tracking", t: "物流单号", locked: false },
];

function downloadCsv(rows) {
  const head = TPL_COLS.map((c) => c.t).join(",");
  const body = rows.map((d) => TPL_COLS.map((c) => (c.locked ? `"${d[c.k] ?? ""}"` : "")).join(",")).join("\n");
  const csv = "﻿" + head + "\n" + body;
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url; a.download = "轻量发货-发货模板.csv";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

export function TemplateDrawer({ rows: rowsProp, onClose }) {
  /* 模板一行 = 一张供货单（一批），商品列展示汇总后的商品数，数量列是这批还没发的件数 */
  const raw = rowsProp || SUPPLY_DOCS.filter(isTenantLeg).filter(canShip);
  const rows = raw.map((d) => {
    const l = itemsLabel(d);
    return { id: d.id, shipper: d.shipper, receiver: d.receiver, receiverAddr: d.receiverAddr,
      product: l.more ? `${l.first} 等 ${itemsOf(d).length} 种` : l.first, qty: Math.max(0, qtyOf(d) - sentOf(d)) };
  });
  const [downloaded, setDownloaded] = useState(false);
  return (
    <div className="drawer-mask" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="drawer" style={{ width: 1080 }}>
        <header>下载发货模板<button className="x" onClick={onClose}>×</button></header>
        <div className="body">
          <div className="alert">
            <span className="ic">i</span>模板已按待发货供货单预填好——<b style={{ margin: "0 4px" }}>灰色列是锁定列，禁止修改</b>；只需填「快递公司」和「物流单号」两列。
            <b style={{ margin: "0 4px" }}>一行一张发货任务、只登记一个包裹</b>；这批要拆多个包裹的，请单张点「发货」逐个登记。
          </div>

          <div className="tbl-wrap">
            <table className="tbl-tight">
              <thead><tr>{TPL_COLS.map((c) => (<th key={c.k} className={c.locked ? "" : "col-new"} data-hl={c.locked ? undefined : "可填"}>{c.t}{c.locked && <span style={{ color: "#bbb", fontWeight: 400, marginLeft: 4 }}>🔒</span>}</th>))}</tr></thead>
              <tbody>
                {rows.map((d) => (
                  <tr key={d.id}>
                    {TPL_COLS.map((c) => (
                      <td key={c.k} className={c.locked ? "tw" : "col-new tw"}
                        style={c.locked ? { background: "#fafafa", color: "#8a949d" } : undefined}>
                        {c.locked ? (d[c.k] ?? "") : <span style={{ color: "#bbb" }}>（待填写）</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
            <button className="btn plain" onClick={onClose}>关闭</button>
            <button className="btn primary" onClick={() => { downloadCsv(rows); setDownloaded(true); }}>
              {downloaded ? "已下载，可再次下载" : "下载模板"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ImportDrawer({ rows, onClose, onDone }) {
  const [step, setStep] = useState(0); // 0 下载模板 → 1 导入文件 → 2 预览确认 → 3 成功
  const [filled, setFilled] = useState({});
  const [count, setCount] = useState(0); // 成功页冻结「本次导入行数」（写入后 rows 会变化）
  const [err, setErr] = useState("");

  React.useEffect(() => {
    // 模拟：导入一个已填好的模板（快递公司统一 顺丰速运，单号按行生成）
    const f = {};
    rows.forEach((d, i) => { f[d.id] = { carrier: "顺丰速运", tracking: "SF77120033" + String(90 + i) }; });
    setFilled(f);
  }, []);

  const submit = () => {
    const miss = rows.filter((d) => !filled[d.id]?.carrier || !filled[d.id]?.tracking);
    if (miss.length) return setErr(`有 ${miss.length} 行未填快递公司或物流单号，导入会被拦下`);
    setErr("");
    if (onDone) onDone(rows.map((d) => ({ doc: d, carrier: filled[d.id].carrier, tracking: filled[d.id].tracking })));
    setCount(rows.length);
    setStep(3);
  };

  const steps = ["下载模板", "导入发货文件", "确认发货", "发货成功"];

  return (
    <div className="drawer-mask" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="drawer" style={{ width: 1080 }}>
        <header>导入发货<button className="x" onClick={onClose}>×</button></header>
        <div className="body">
          {/* 步骤条 */}
          <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
            {steps.map((s, i) => (
              <React.Fragment key={s}>
                {i > 0 && <span style={{ flex: 1, height: 1, background: i <= step ? "#25c7a5" : "#e5e5e5" }} />}
                <span style={{ display: "flex", alignItems: "center", gap: 8, color: i <= step ? "#25c7a5" : "#bbb", fontSize: 13 }}>
                  <span style={{ width: 22, height: 22, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 12, background: i <= step ? "#25c7a5" : "#fff", color: i <= step ? "#fff" : "#bbb", border: i <= step ? "none" : "1px solid #dcdcdc" }}>{i + 1}</span>
                  {s}
                </span>
              </React.Fragment>
            ))}
          </div>

          {step === 0 && (
            <>
              <div className="alert"><span className="ic">i</span>先下载模板：已按待发货供货单逐张预填好，<b style={{ margin: "0 4px" }}>锁定列不可修改</b>，只需填「快递公司」和「物流单号」。
              <b style={{ margin: "0 4px" }}>一行一张任务、只登记一个包裹</b>。</div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button className="btn plain" onClick={() => downloadCsv(rows)}>下载发货模板</button>
                <button className="btn primary" onClick={() => setStep(1)}>我已下载，去导入</button>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="alert"><span className="ic">i</span>选择填好的模板文件导入。</div>
              <div style={{ border: "1px dashed #d9d9d9", borderRadius: 4, padding: 40, textAlign: "center", background: "#fafafa" }}>
                <div style={{ fontSize: 30, color: "#c2c2c2" }}>⇪</div>
                <div className="note" style={{ marginTop: 8 }}>点击或拖拽文件到此处上传（.csv / .xlsx）</div>
                <button className="btn plain" style={{ marginTop: 12 }} onClick={() => setStep(2)}>模拟上传「轻量发货-发货模板(已填).csv」</button>
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
                <button className="btn plain" onClick={() => setStep(0)}>上一步</button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="alert"><span className="ic">i</span>已解析到 <b style={{ margin: "0 4px" }}>{rows.length}</b> 行。<b style={{ margin: "0 4px" }}>灰色列由系统锁定不可改</b>，请核对「快递公司 / 物流单号」。</div>
              <div className="tbl-wrap">
                <table className="tbl-tight">
                  <thead><tr><th style={{ width: 44 }}>行</th>{TPL_COLS.map((c) => (<th key={c.k} className={c.locked ? "" : "col-new"} data-hl={c.locked ? undefined : "可填"}>{c.t}{c.locked && <span style={{ color: "#bbb", fontWeight: 400, marginLeft: 4 }}>🔒</span>}</th>))}</tr></thead>
                  <tbody>
                    {rows.map((d, i) => (
                      <tr key={d.id}>
                        <td>{i + 1}</td>
                        {TPL_COLS.map((c) => (
                          <td key={c.k} className={c.locked ? "tw" : "col-new tw"} style={c.locked ? { background: "#fafafa", color: "#8a949d" } : undefined}>
                            {c.locked ? (d[c.k] ?? "") : (
                              <input value={filled[d.id]?.[c.k] ?? ""} readOnly style={{ height: 28, border: 0, background: "transparent", padding: 0 }} />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {err && <div className="err" style={{ marginTop: 12 }}>{err}</div>}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
                <button className="btn plain" onClick={() => setStep(1)}>上一步</button>
                <button className="btn primary" onClick={submit}>确认发货</button>
              </div>
            </>
          )}

          {step === 3 && (
            <div style={{ textAlign: "center", padding: "30px 0" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#25c7a5", color: "#fff", display: "grid", placeItems: "center", margin: "0 auto 16px", fontSize: 28 }}>✓</div>
              <b style={{ fontSize: 17 }}>发货成功</b>
              <div className="note" style={{ marginTop: 10, lineHeight: 2 }}>
                本次导入 <b>{count}</b> 行，全部发货成功。<br />
                已发货的供货单不再显示「发货」按钮。
              </div>
              <button className="btn primary" style={{ marginTop: 20 }} onClick={onClose}>完成</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function BatchShipDrawer({ rows, onClose, onDone }) {
  const [carrier, setCarrier] = useState("顺丰速运");
  const [done, setDone] = useState(0); // 0=未提交；>0=已写入的条数（冻结用于成功页）
  const [sel, setSel] = useState(() => Object.fromEntries(rows.map((d) => [d.id, true])));
  const [tracking, setTracking] = useState(() => Object.fromEntries(rows.map((d, i) => [d.id, "SF77120033" + String(90 + i)])));
  const [err, setErr] = useState("");

  const submit = () => {
    const picked = rows.filter((d) => sel[d.id]);
    const miss = picked.filter((d) => !tracking[d.id]?.trim());
    if (miss.length) return setErr(`有 ${miss.length} 行未填物流单号`);
    setErr("");
    if (onDone) onDone(picked.map((d) => ({ doc: d, carrier, tracking: tracking[d.id].trim() })));
    setDone(picked.length);
  };

  if (done) {
    return (
      <div className="drawer-mask" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
        <div className="drawer" style={{ width: 620 }}>
          <header>批量发货<button className="x" onClick={onClose}>×</button></header>
          <div className="body" style={{ textAlign: "center", padding: "30px 0" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#25c7a5", color: "#fff", display: "grid", placeItems: "center", margin: "0 auto 16px", fontSize: 28 }}>✓</div>
            <b style={{ fontSize: 17 }}>批量发货成功</b>
            <div className="note" style={{ marginTop: 10, lineHeight: 2 }}>
              已发货 {done} 单，快递公司 {carrier}。<br />
              每单自动生成独立的内部供货物流记录。
            </div>
            <button className="btn primary" style={{ marginTop: 20 }} onClick={onClose}>完成</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="drawer-mask" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="drawer" style={{ width: 900 }}>
        <header>批量发货<button className="x" onClick={onClose}>×</button></header>
        <div className="body">
          <div className="alert"><span className="ic">i</span>一行是一张发货任务（发往一个门店），逐行填各自的物流单号。
            <b style={{ margin: "0 4px" }}>一行只登记一个包裹</b>——这批要拆成多个包裹的，请单张点「发货」逐个登记。</div>
          <div className="frow">
            <label><i>*</i>快递公司</label>
            <div className="fc"><select value={carrier} onChange={(e) => setCarrier(e.target.value)} style={{ maxWidth: 260 }}>
              {["顺丰速运", "圆通速递", "中通快递", "京东物流", "韵达快递", "极兔速递"].map((c) => <option key={c}>{c}</option>)}
            </select></div>
          </div>
          <table className="tbl-tight">
            <thead><tr><th style={{ width: 40 }}><input type="checkbox" defaultChecked /></th><th className="tw">供货单号</th><th className="tw">发货主体</th><th>收货主体</th><th className="tw">商品</th><th className="tw">应发</th><th className="tw">物流单号</th></tr></thead>
            <tbody>
              {rows.map((d, i) => (
                <tr key={d.id}>
                  <td><input type="checkbox" checked={!!sel[d.id]} onChange={(e) => setSel((s) => ({ ...s, [d.id]: e.target.checked }))} /></td>
                  <td className="tw mono">{d.id}</td><td className="tw">{d.shipper}</td>
                  <td>{d.receiver}<small>{d.receiverAddr}</small></td>
                  <td className="tw">{itemsLabel(d).emoji} {itemsLabel(d).more ? `${itemsLabel(d).first} 等 ${itemsOf(d).length} 种` : itemsLabel(d).first}</td>
                  <td className="tw mono">{Math.max(0, qtyOf(d) - sentOf(d))}</td>
                  <td className="tw"><input value={tracking[d.id] ?? ""} onChange={(e) => setTracking((s) => ({ ...s, [d.id]: e.target.value }))} style={{ height: 28, width: 150 }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {err && <div className="err" style={{ marginTop: 12 }}>{err}</div>}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
            <button className="btn plain" onClick={onClose}>取消</button>
            <button className="btn primary" onClick={submit}>确认发货</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- 供货单详情抽屉 ---------------- */
/* 收货异常说明：异常原因不在供货单本身，来自收货点验时生成的配送差异单 */
export function ReceiveAbnormal({ doc, ro }) {
  const diff = diffStore.get().find((d) => d.supplyNo === doc.id);
  return (
    <>
      <h3 style={{ fontSize: 14, margin: "18px 0 10px", borderLeft: "3px solid #f5522e", paddingLeft: 9 }}>收货异常说明</h3>
      <div style={{ border: "1px solid rgba(245,82,46,.35)", background: "rgba(245,82,46,.05)", borderRadius: 4, padding: "10px 14px", lineHeight: 2, fontSize: 13.5 }}>
        {diff ? (
          <>
            <div>异常情况：<b>{diff.summary}</b></div>
            <div>上报来源：{diff.source}（{diff.reporter}收货点验）</div>
            <div>凭证：{diff.evidence && diff.evidence !== "—" ? diff.evidence : "—"}</div>
            <div>关联差异单：<span className="mono">{diff.id}</span>　<span className="tag danger">{diff.status}</span>{diff.makeup && <>　补发单 <span className="mono">{diff.makeup}</span></>}</div>
          </>
        ) : (
          <div>异常情况：<b>补发单收货异常（实收 {receivedOf(doc)} / 应发 {qtyOf(doc)} 件）</b>{doc.reshipOf && <>　源差异单 <span className="mono">{doc.reshipOf}</span></>}</div>
        )}
        <div>处理流程：{diff ? "差异审核由总部执行；" : "按规则补发单不再新开差异单，转线下处理；"}{ro ? "供应商只读知情，" : ""}审核通过后生成补发任务，由原发货方补发。</div>
      </div>
    </>
  );
}

/* ============================================================================
   关联订单 —— 收货方在「待收货」行点开：这张供货单对应的销售订单是给谁的
   ============================================================================ */
function RelatedOrderDrawer({ doc, onClose }) {
  const orders = orderStore.use();
  const all = ordersOf(doc).map((no) => orders.find((o) => o.no === no)).filter(Boolean);
  /* 一批可能上百笔，逐笔铺出来没法看 —— 给搜索（订单号 / 手机号 / 姓名）+ 分页，
     店员和客服手上有的就是这三样，能直接搜到要核的那一笔 */
  const [kw, setKw] = useState("");
  const mine = all.filter((o) => matchOrder(o, kw));
  const paged = usePaged(mine, 10);
  const missing = ordersOf(doc).length - all.length;
  const Row = ({ k, children }) => (
    <tr><td className="tw" style={{ width: 110, color: "var(--text-2)" }}>{k}</td><td>{children}</td></tr>
  );
  /* 这一批是按商品汇总出来的，一张供货单覆盖多笔销售订单 —— 逐笔列，不再假设只有一单 */
  const orderRows = itemsOf(doc).flatMap((it) => (it.from || []).map((f) => ({ it, ...f })));
  return (
    <div className="drawer-mask" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="drawer" style={{ width: 780 }}>
        <header>关联销售订单<button className="x" onClick={onClose}>×</button></header>
        <div className="body">
          {missing > 0 && (
            <div className="alert"><span className="ic">i</span>有 {missing} 笔销售订单不在当前租户的订单列表里（历史或已归档），下面只显示供货单上的快照。</div>
          )}

          <table className="tbl-tight" style={{ marginBottom: 16 }}>
            <tbody>
              <Row k="供货单号"><span className="mono">{doc.id}</span></Row>
              <Row k="本批订单">{ordersOf(doc).length} 笔 · {itemsOf(doc).length} 种商品 · {qtyOf(doc)} 件</Row>
              <Row k="收货方">{doc.receiver}</Row>
            </tbody>
          </table>

          <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontWeight: 600, fontSize: 13.5 }}>这批货是给谁的（{mine.length} 笔订单）</span>
            <input className="ctl" value={kw} onChange={(e) => { setKw(e.target.value); paged.setPage(1); }}
              placeholder="搜订单号 / 手机号 / 姓名" style={{ marginLeft: "auto", width: 240, height: 30 }} />
          </div>
          <table className="tbl-tight">
            <thead>
              <tr>
                <th className="tw">销售订单</th><th>购买者</th><th>联系电话</th>
                <th className="tw">配送方式</th><th className="tw">下单时间</th>
              </tr>
            </thead>
            <tbody>
              {paged.pageRows.map((o) => {
                const b = o.buyer || {};
                return (
                  <tr key={o.no}>
                    <td className="tw mono">{o.no}</td>
                    <td>{b["收件人"] || b["昵称"] || "—"}</td>
                    <td className="mono">{b["收件人电话"] || "—"}</td>
                    <td className="tw">{o.delivery ? `${o.delivery}${o.store ? ` · ${o.store}` : ""}` : "—"}</td>
                    <td className="tw mono">{o.createdAt || "—"}</td>
                  </tr>
                );
              })}
              {!mine.length && <tr><td colSpan={5} style={{ textAlign: "center", padding: 26, color: "#999" }}>{kw ? "没有匹配的订单" : "这批没有销售订单"}</td></tr>}
            </tbody>
          </table>
          <Pager {...paged} />
          <div className="note">自提单货到后按联系电话通知买家来取，取货时按订单核对。</div>

          <div style={{ fontWeight: 600, fontSize: 13.5, margin: "18px 0 8px" }}>商品与订单的对应关系</div>
          <table className="tbl-tight">
            <thead><tr><th className="tw">销售订单</th><th>商品</th><th className="tw">规格</th><th className="tw">本批应发</th></tr></thead>
            <tbody>
              {orderRows.map((r) => {
                const o = orders.find((x) => x.no === r.orderNo);
                return (
                  <tr key={r.orderNo + r.it.product}>
                    <td className="tw mono">{r.orderNo}</td>
                    <td>
                      <div className="prod-cell">
                        <span className="thumb" style={{ background: "#f4f7f6" }}>{r.it.emoji}</span>
                        <div><div>{r.it.product}</div><small>{o ? (o.buyer?.["收件人"] || o.buyer?.昵称 || "") : "订单不在列表里"}</small></div>
                      </div>
                    </td>
                    <td className="tw">{r.it.spec}</td>
                    <td className="tw mono">{r.qty}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
            <button className="btn plain" onClick={onClose}>关闭</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DocDetailDrawer({ doc, onClose, mode }) {
  /* 详情里也要能看到「这批货是哪些订单的」——列表有这一列，详情没有就对不上账；
     商品行按件给订单关联，跟发货弹窗同一套口径 */
  const [rel, setRel] = useState(null);
  return (
    <div className="drawer-mask" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="drawer" style={{ width: 720 }}>
        <header>供货单详情<button className="x" onClick={onClose}>×</button></header>
        <div className="body">
          <div className="filters" style={{ marginBottom: 14 }}>
            <div className="row" style={{ gap: 30 }}>
              <div className="field"><label>供货单号</label><b className="mono">{doc.id}</b></div>
              <div className="field"><label>供货路径</label><b>{legLabelOf(doc)}</b></div>
              <div className="field"><label>供货状态</label><span className={`tag ${doc.status === "收货异常" ? "danger" : ""}`}>{mode === "receive" && doc.status === "已发货" ? "待收货" : doc.status}</span></div>
            </div>
            {doc.isMakeup && (
              <div className="row"><div className="field"><label>单据类型</label>
                <span className="tag" style={{ marginRight: 8 }}>补发单</span>
                <span className="note" style={{ display: "inline" }}>源差异单 <span className="mono">{doc.reshipOf}</span>　原供货单 <span className="mono">{diffStore.get().find((x) => x.id === doc.reshipOf)?.supplyNo || "—"}</span></span>
              </div></div>
            )}
            <div className="row" style={{ gap: 30 }}>
              <div className="field"><label>发货主体</label><b>{doc.shipper}</b></div>
              <div className="field"><label>收货主体</label><b>{doc.receiver}</b></div>
            </div>
            <div className="row"><div className="field"><label>任务来源</label><span>{doc.source}{doc.batchAt ? `　${doc.batchAt}` : ""}</span></div></div>
            <div className="row"><div className="field"><label>收货地址</label><span>{doc.receiverAddr}</span></div></div>
          </div>

          {doc.status === "收货异常" && <ReceiveAbnormal doc={doc} />}

          <h3 style={{ fontSize: 14, margin: "0 0 10px", borderLeft: "3px solid #25c7a5", paddingLeft: 9 }}>供货商品明细</h3>
          <table>
            <thead><tr><th>商品</th><th className="tw">订单关联</th><th className="tw">应发数量</th><th className="tw">已发数量</th><th className="tw">累计实收</th></tr></thead>
            <tbody>
              {itemsOf(doc).map((it) => (
                <tr key={it.product}>
                  <td><div className="prod-cell"><span className="thumb" style={{ background: "#f4f7f6" }}>{it.emoji}</span><div><div>{it.product}</div><small>{it.spec}</small></div></div></td>
                  <td className="tw">
                    <span onClick={() => setRel(it)} style={{ color: "#25c7a5", cursor: "pointer" }}>{(it.from || []).length} 笔订单</span>
                  </td>
                  <td className="tw mono">{it.qty}</td>
                  <td className="tw mono">{it.sent || 0}</td>
                  <td className="tw mono">{it.received || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3 style={{ fontSize: 14, margin: "18px 0 10px", borderLeft: "3px solid #25c7a5", paddingLeft: 9 }}>供货物流</h3>
          {packagesOf(doc).length ? (
            <div className="filters">
              {packagesOf(doc).map((p, i) => (
                <div key={i} style={{ borderTop: i ? "1px solid var(--line)" : "none", paddingTop: i ? 8 : 0, marginTop: i ? 8 : 0 }}>
                  <div className="row" style={{ gap: 30 }}>
                    <div className="field"><label>包裹 {i + 1} · 快递公司</label><b>{p.carrier}</b></div>
                    <div className="field"><label>物流单号</label><b className="mono">{p.tracking}</b></div>
                  </div>
                  <div className="row"><div className="field"><label>最新物流状态</label><span>{p.track}</span></div></div>
                </div>
              ))}
            </div>
          ) : <div className="note">尚未发货，暂无物流信息</div>}

        </div>
        <div className="foot"><button className="btn plain" onClick={onClose}>关闭</button></div>
      </div>
      {rel && <OrderRefsPop item={rel} orders={orderStore.get()} onClose={() => setRel(null)} />}
    </div>
  );
}
