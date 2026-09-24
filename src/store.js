import { useState, useEffect } from "react";
import { SUPPLY_DOCS, SUPPLIER_DOCS, DIFFS, RETURNS, ORDERS_READY, PRODUCTS, SUP_ADDRESSES, AFTER_SALES, ADDRESS_BOOK, EXPRESS_TPL } from "./data.js";

/* 极简共享 store —— 原型内替代后端：让三端与各页面读写同一份数据。
   否则每个组件各自 useState(种子数据)，A 页面的改动 B 页面看不到（"后台同步"就是假的）。 */
export function createStore(initial) {
  let state = initial;
  const subs = new Set();
  const get = () => state;
  const set = (updater) => {
    state = typeof updater === "function" ? updater(state) : updater;
    subs.forEach((f) => f());
  };
  const use = () => {
    const [, force] = useState(0);
    useEffect(() => {
      const f = () => force((n) => n + 1);
      subs.add(f);
      return () => { subs.delete(f); };
    }, []);
    return state;
  };
  return { get, set, use };
}

export const supplyStore = createStore(SUPPLY_DOCS);         // 供货单（租户侧可见范围）
export const supplierStore = createStore(SUPPLIER_DOCS);     // 供货单（供应商侧可见范围）
export const diffStore = createStore(DIFFS);                 // 配送差异单
export const returnStore = createStore(RETURNS);             // 退货返厂单
export const orderStore = createStore(ORDERS_READY);         // 销售订单（已生成任务的订单带 batchNos，按链路判重见 poolOf）
export const productStore = createStore(PRODUCTS);           // 商品（租户后台）
export const addrStore = createStore(SUP_ADDRESSES);         // 供应商地址簿（发货地址 / 售后地址）
export const afterSaleStore = createStore(AFTER_SALES);      // 售后单（代发：总部审核退款、供应商只做货源，两侧同一份）
export const addressBookStore = createStore(ADDRESS_BOOK);   // 租户地址库（发货 / 售后 / 仓库）
export const expressTplStore = createStore(EXPRESS_TPL);     // 快递模板

/* ============================================================================
   G2②：门店长时间不点「确认到货」→ 系统自动确认，避免客户提货码一直不生效
   · 适用：收货主体是门店的两条链路（供应商直配门店 / 总部仓发门店）
   · 阈值：到店 3 天未确认
   · 触发：打开原型即应用（照上一代原型 applyTimeouts 的做法，原型不做真倒计时）
   ============================================================================ */
export const ARRIVAL_TIMEOUT_DAYS = 3;
const STORE_BOUND_LEGS = ["supplier_inbound", "hq_store"];

export function isStoreBound(d) {
  return STORE_BOUND_LEGS.includes(d.leg);
}

export function daysSince(ts, now = new Date()) {
  return (now - new Date(String(ts).replace(" ", "T"))) / 86400000;
}

/* 返回本次被自动确认的供货单号数组；同时把关联自提订单的提货码置为生效 */
export function applyArrivalTimeouts(now = new Date()) {
  const fired = [];
  /* 到店计时以「签收」时间为准（物流未签收才回退到创建时间） */
  const baseOf = (d) => {
    /* 到店计时只认「已签收」时间：在途（未签收）单不进超时池，避免创建时间误触发 */
    const m = String(d.track || "").match(/已签收 (\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/);
    return m ? m[1] : null;
  };
  const apply = (d) => {
    if (!isStoreBound(d) || d.status !== "已发货") return d;
    const base = baseOf(d);
    if (!base || daysSince(base, now) < ARRIVAL_TIMEOUT_DAYS) return d;
    if (!fired.includes(d.id)) fired.push(d.id);
    return {
      ...d,
      status: "已收货",
      received: d.qty,                       // 超时按「货齐」处理
      autoConfirmed: true,
      autoConfirmedAt: now.toISOString().slice(0, 19).replace("T", " "),
      autoConfirmRule: `到店签收超过 ${ARRIVAL_TIMEOUT_DAYS} 天门店未确认，系统自动确认到货`,
    };
  };
  supplyStore.set((ds) => ds.map(apply));
  supplierStore.set((ds) => ds.map(apply));   // 同 id 是同一张物理单据，两端同步
  if (fired.length) {
    /* 补发单到店自动确认 → 与原单结案同口径（决策 5）：源单收货 + 差异单转补发完成 */
    for (const d of supplyStore.get().filter((x) => fired.includes(x.id))) {
      if (!(d.isMakeup && d.reshipOf)) continue;
      const diff = diffStore.get().find((x) => x.id === d.reshipOf);
      const src = diff?.supplyNo ? supplyStore.get().find((x) => x.id === diff.supplyNo) : null;
      if (src) {
        const patch = (ds) => ds.map((x) => (x.id === src.id ? { ...x, status: "已收货", received: x.qty } : x));
        supplyStore.set(patch); supplierStore.set(patch);
      }
      diffStore.set((ds) => ds.map((x) => (x.id === d.reshipOf ? { ...x, status: "补发完成" } : x)));
    }
    /* R6：已完成 / 已取消 / 已退款订单不被重新激活提货码；按 supplyNo 或 orderNo 匹配（只认本次被自动确认的单） */
    const docsNow = [...supplyStore.get(), ...supplierStore.get()].filter((x) => fired.includes(x.id));
    orderStore.set((os) => os.map((o) => {
      const hit = fired.includes(o.supplyNo) || docsNow.some((d) => d.orderNo && d.orderNo === o.no);
      return hit && !["已完成", "已取消", "已全额退款"].includes(o.status) ? { ...o, pickupReady: true } : o;
    }));
  }
  return fired;
}

/* 打开原型即应用一次 */
applyArrivalTimeouts();

/* 更新某张供货单：同 id 的单据在两端是同一张物理单据，两个 store 同步写 */
export const patchDoc = (id, patch) => {
  const apply = (ds) => ds.map((d) => (d.id === id ? { ...d, ...patch } : d));
  supplyStore.set(apply);
  supplierStore.set(apply);
};

/* 新增一张供货单并落到**该看到它的那一端**：
   共享链路（供应商→总仓 / 供应商→门店）两端都是同一张物理单据，必须双写；
   供应商→消费者只有供应商看得到，总部仓→门店只有租户看得到 */
export const addDoc = (doc) => {
  const SHARED = ["supplier_to_hq", "supplier_inbound"];
  if (SHARED.includes(doc.leg)) { supplyStore.set((ds) => [doc, ...ds]); supplierStore.set((ds) => [doc, ...ds]); }
  else if (doc.leg === "sup_consumer") supplierStore.set((ds) => [doc, ...ds]);
  else supplyStore.set((ds) => [doc, ...ds]);
};

/* 新增一张配送差异单（收货异常时产生） */
export const addDiff = (diff) => diffStore.set((ds) => [diff, ...ds]);

/* ---------------- 退货返厂：整体状态由各段派生 ---------------- */
export const useReturns = returnStore.use;
export const setReturns = returnStore.set;

export function deriveStatus(hops) {
  if (hops.every((h) => h.status === "已收货")) return "已返厂";
  if (hops.some((h) => h.status === "运输中" || h.status === "已收货")) return "返厂中";
  return "待返厂";
}

/* 更新某张返厂单的第 idx 段，并重算整体状态 */
export function patchHop(id, idx, patch) {
  returnStore.set((rs) => rs.map((r) => {
    if (r.id !== id) return r;
    const hops = r.hops.map((h, i) => (i === idx ? { ...h, ...patch } : h));
    return { ...r, hops, status: deriveStatus(hops) };
  }));
}
