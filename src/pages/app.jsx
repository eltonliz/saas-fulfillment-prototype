import React, { useState } from "react";
import { useReturns, setReturns, patchHop, diffStore, addDiff, supplyStore, supplierStore, orderStore } from "../store.js";
import { diffInTab, DIFF_TABS, applyReceive } from "./supply.jsx";
import { afterAddrOf, fmtAddr, itemsOf, qtyOf, sentOf, receivedOf, packagesOf, ordersOf, itemsLabel, matchOrder, matchDoc } from "../data.js";
import { FlowNode, FlowArrow } from "./buyer.jsx";
import { useReqPage } from "./reqnotes.jsx";

/* ============================================================================
   门店 APP —— 工作台 / 收货管理 / 发货单详情·确认收货 / 温馨提示
   ============================================================================ */
/* 门店APP 的收货方就是登录门店自己，详情页不再重复展示门店信息（原来的写死常量已删） */

/* 门店 APP 的登录门店。收货卡片 = 发到本门店的供货单（一张单 = 一批货），
   数据与租户后台的收货管理是同一份（supplyStore / supplierStore），门店确认收货即时回写 */
export const STORE_SELF = "濮源直播间";
const STORE_LEGS = ["supplier_inbound", "hq_store"];

/* 发到本门店的单据；同一条链路两端各存一份，按 id 去重 */
export const storeDocsOf = (supplyDocs, supplierDocs) => {
  const seen = new Set();
  return [...supplyDocs, ...supplierDocs].filter((d) => {
    if (!STORE_LEGS.includes(d.leg) || d.receiver !== STORE_SELF || seen.has(d.id)) return false;
    seen.add(d.id);
    return true;
  }).sort((a, b) => String(b.batchAt || "").localeCompare(String(a.batchAt || "")));
};

/* 门店看到的三档：供应商直配 / 总部仓直配 / 总部仓直配 · 自有货 —— 与后台的供货模式同口径 */
const MODES = ["供应商直配", "总部仓直配", "总部仓直配 · 自有货"];
const modeOf = (d) => (d.leg === "supplier_inbound" ? MODES[0] : d.goodsSource === "总部自有" ? MODES[2] : MODES[1]);
const legTextOf = (d) => (d.leg === "supplier_inbound" ? "供应商 → 门店" : d.goodsSource === "总部自有" ? "总部自有 → 门店" : "总部仓 → 门店");
/* 发货方的状态词换成收货方的：已发货 → 待收货；「部分收货」在收货方这边仍是「待收货」（加标记），
   只有确认收货那一刻实收 ≠ 应收才判「收货异常」——与后台收货管理同一口径 */
const stateOf = (d) => (["已发货", "部分收货"].includes(d.status) ? "待收货" : d.status);
const isPartial = (d) => d.status === "部分收货";

/* 移动端底部弹层的壳，物流 / 关联订单共用 */
function MPop({ title, sub, onClose, children }) {
  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.35)", display: "flex", alignItems: "flex-end" }} onClick={onClose}>
      <div style={{ width: "100%", background: "#fff", borderRadius: "12px 12px 0 0", padding: "16px 16px 22px", maxHeight: "80%", overflow: "auto" }}
        onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
          <b style={{ fontSize: 15 }}>{title}</b>
          <span onClick={onClose} style={{ marginLeft: "auto", color: "#999", fontSize: 20, lineHeight: 1, cursor: "pointer" }}>×</span>
        </div>
        {sub && <div style={{ fontSize: 12, color: "#999", marginBottom: 14 }}>{sub}</div>}
        {children}
      </div>
    </div>
  );
}

/* 页签条最多占 5 个位置：超出的收进「更多」下拉，且当前选中的那个一定看得见
   —— 与后台「物流轨迹」同一套处理 */
function PkgChips({ count, cur, onPick }) {
  const [more, setMore] = useState(false);
  const flat = count <= 5 ? count : 4;
  const chip = (on) => ({
    flex: "none", padding: "5px 12px", borderRadius: 14, fontSize: 12, cursor: "pointer",
    background: on ? "#e6f7f2" : "#f5f7f8", color: on ? "#25c7a5" : "#666", fontWeight: on ? 600 : 400,
  });
  return (
    <div style={{ display: "flex", gap: 8, paddingBottom: 12, position: "relative", flexWrap: "wrap" }}>
      {Array.from({ length: flat }, (_, i) => (
        <span key={i} style={chip(cur === i)} onClick={() => onPick(i)}>包裹 {i + 1}</span>
      ))}
      {count > 5 && (
        <>
          <span style={chip(cur >= flat)} onClick={() => setMore((v) => !v)}>
            {cur >= flat ? `包裹 ${cur + 1}` : `更多 ${count - flat} 个`} ▾
          </span>
          {more && (
            <div style={{ position: "absolute", top: "100%", left: 0, zIndex: 5, background: "#fff", border: "1px solid #eee", borderRadius: 6, boxShadow: "0 6px 18px rgba(0,0,0,.10)", maxHeight: 220, overflowY: "auto", minWidth: 150 }}>
              {Array.from({ length: count - flat }, (_, k) => {
                const i = flat + k;
                return (
                  <div key={i} onClick={() => { onPick(i); setMore(false); }}
                    style={{ padding: "9px 14px", fontSize: 12.5, cursor: "pointer", background: cur === i ? "#f2fbf9" : "#fff", color: cur === i ? "#25c7a5" : "#333" }}>
                    包裹 {i + 1}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* 状态色 / 图标（与后台收货管理口径一致） */
const STATE_TONE = (s) => (s === "待发货" ? "#f5a623" : s === "待收货" ? "#2f80ed" : s === "收货异常" ? "#f5522e" : "#25c7a5");
const STATE_ICON = (s) => (s === "已收货" ? "✓" : s === "待收货" ? "🚚" : s === "收货异常" ? "⚠️" : "⏳");

const GRID = [
  ["自提核销", "🎫"], ["核销优惠券", "🎟"], ["订单管理", "📋"], ["客户管理", "👤"],
  ["售后管理", "↩️"], ["直播管理", "📺"], ["添加渠道", "➕"], ["审核门店", "✅"],
  ["门店商品", "📦"], ["门店报表", "📊"], ["虚拟账户", "💳"], ["营销管理", "📣"],
  ["核销记录", "🧾"], ["课程管理", "📚"], ["收货管理", "📥"], ["配送差异", "⚠️"],
  ["退货返厂", "🏭"],
];

export function StoreApp() {
  const [view, setView] = useState("home");
  const [confirm, setConfirm] = useState(false);
  const [diffCard, setDiffCard] = useState(null);   // 当前查看的配送差异单
  /* 收货卡片直接由 store 派生：门店这边收货，后台收货管理立刻同步，不需要另存一份本地状态 */
  const cards = storeDocsOf(supplyStore.use(), supplierStore.use());
  const [receiptCard, setReceiptCard] = useState(null); // 当前查看/收货的供货单
  /* 收货管理的页签与状态筛选放在这里：进详情再返回不该跳回第一个页签 */
  const [rcpMode, setRcpMode] = useState(MODES[0]);
  const [rcpChip, setRcpChip] = useState("全部");
  const [rcpKw, setRcpKw] = useState("");
  const [pendingReceipt, setPendingReceipt] = useState(null); // 少收待温馨提示确认的收货结果
  useReqPage("app:" + view);

  /* 确认收货：走的是后台「收货管理」同一个提交函数 —— 同一条链路两端必须一套口径：
     按商品行登记实收、少收开差异单、并按「先下单先满足」分配自提提货码 */
  const commitReceipt = (res) => {
    const d = receiptCard;
    if (!d) return;
    applyReceive(d, { lines: res.lines, reason: res.reason, note: res.note, photos: res.photos });
    setPendingReceipt(null);
    setConfirm(false);
    setView("receipts");
  };

  return (
    <>
      {(
    <div className="phone-wrap">
      <div className="phone">
        <div className="status"><span>9:41</span><span>📶 🔋</span></div>

        <div className="mnav">
          <button className="back" onClick={() => { setView("home"); setConfirm(false); }}>‹</button>
          <span>{view === "home" ? "工作台" : view === "receipts" ? "收货管理" : view === "receive" ? "供货单详情" : view === "diffs" ? "配送差异" : view === "diffDetail" ? "差异单详情" : view === "returns" ? "退货返厂" : "配送差异"}</span>
          {view !== "home" && <span style={{ marginLeft: "auto", color: "#666", fontSize: 18, letterSpacing: 1 }}>⋯</span>}
        </div>

        <div className="mscreen">
          {view === "home" && <Home onGo={setView} />}
          {view === "receipts" && <Receipts cards={cards} mode={rcpMode} setMode={setRcpMode} chip={rcpChip} setChip={setRcpChip} kw={rcpKw} setKw={setRcpKw}
            onOpen={(c) => { setReceiptCard(c); setView("receive"); }} />}
          {view === "receive" && receiptCard && (
            <Receive
              card={receiptCard}
              onBack={() => setView("receipts")}
              onConfirm={(r) => (r.shortage ? (setPendingReceipt(r), setConfirm(true)) : commitReceipt(r))}
              onGoDiffs={() => setView("diffs")}
            />
          )}
          {view === "diffs" && <Diffs onDetail={(d) => { setDiffCard(d); setView("diffDetail"); }} />}
          {view === "diffDetail" && <DiffDetail row={diffCard} onBack={() => setView("diffs")} />}
          {/* 差异单与凭证在确认收货时一次性写入 diffStore，列表读的是同一份数据，不需要回调再改本地 state */}
          {view === "returns" && <Returns />}
        </div>

        {confirm && <WarmTip onCancel={() => { setConfirm(false); setPendingReceipt(null); }} onOk={() => commitReceipt(pendingReceipt)} />}
      </div>
    </div>
      )}
    </>
  );
}

/* ---------------- 工作台 ---------------- */
function Home({ onGo }) {
  const [range, setRange] = useState("昨日");
  return (
    <div>
      <div style={{ background: "#fff", padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ width: 40, height: 40, borderRadius: "50%", background: "#e8eef2", display: "grid", placeItems: "center", fontSize: 20 }}>🙂</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>阿远要快快乐乐</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
            <span style={{ background: "#25c7a5", color: "#fff", fontSize: 11, borderRadius: 9, padding: "1px 8px" }}>店长</span>
            <span style={{ color: "#25c7a5", fontSize: 12 }}>切换角色 ›</span>
          </div>
        </div>
        <span style={{ background: "#eef4f2", color: "#5b6875", fontSize: 11, borderRadius: 4, padding: "3px 7px" }}>早 · 咨询师</span>
      </div>

      <div style={{ margin: "0 12px", borderRadius: 8, overflow: "hidden", background: "#2b2f36", height: 84, display: "flex", alignItems: "center", padding: "0 14px", color: "#fff" }}>
        <span style={{ width: 44, height: 44, borderRadius: 6, background: "#4a505a", display: "grid", placeItems: "center", marginRight: 12 }}>🏫</span>
        <div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>濮源直播间</div>
          <div style={{ fontSize: 11.5, opacity: .85, marginTop: 3 }}>📞 15554174768</div>
          <div style={{ fontSize: 11.5, opacity: .85, marginTop: 2 }}>📍 东风中路410号时代地产中心</div>
        </div>
      </div>

      <div className="mcard" style={{ margin: "10px 12px" }}>
        <div className="hd"><b>经营数据</b></div>
        <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#666", marginBottom: 12 }}>
          {["昨日", "近7天", "近30天", "近90天", "更多"].map((r) => (
            <span key={r} onClick={() => setRange(r)} style={r === range ? { color: "#25c7a5", fontWeight: 600, borderBottom: "2px solid #25c7a5", paddingBottom: 2 } : {}}>{r}</span>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", textAlign: "center", marginBottom: 12 }}>
          {[["¥37624.03", "订单金额"], ["¥3762.03", "交易金额"], ["¥372.03", "退款金额"], ["¥32.03", "客单价"]].map(([v, k]) => (
            <div key={k}><div style={{ fontSize: 13, color: "#333", fontWeight: 600 }}>{v}</div><div style={{ fontSize: 11, color: "#999", marginTop: 3 }}>{k}</div></div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", textAlign: "center", borderTop: "1px solid #f2f2f2", paddingTop: 12 }}>
          {[["636", "订单总数"], ["925", "签收总数"], ["925", "退款总数"], ["14393", "客户总数"]].map(([v, k]) => (
            <div key={k}><div style={{ fontSize: 13, color: "#333", fontWeight: 600 }}>{v}</div><div style={{ fontSize: 11, color: "#999", marginTop: 3 }}>{k}</div></div>
          ))}
        </div>
      </div>

      <div className="mcard" style={{ margin: "10px 12px 20px" }}>
        <div className="hd"><b>门店管理</b></div>
        <div className="mgrid">
          {GRID.map(([t, i]) => {
            const target = t === "收货管理" ? "receipts" : t === "配送差异" ? "diffs" : t === "退货返厂" ? "returns" : null;
            return (
              <button key={t} className={["收货管理", "配送差异", "退货返厂"].includes(t) ? "hl" : ""} data-hl="新增" onClick={() => target && onGo(target)}>
                <i>{i}</i>{t}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------------- 收货管理 ---------------- */
function Receipts({ cards, onOpen, mode, setMode, chip, setChip, kw, setKw }) {
  const [track, setTrack] = useState(null);
  const [order, setOrder] = useState(null);
  /* 收货台前是照着快递面单收的：供货单号和快递单号都得能查，才能快速定位要收哪一批 */
  const hit = (d) => matchDoc(d, kw);
  return (
    <div>
      <div style={{ display: "flex", gap: 20, padding: "12px 14px 0", borderBottom: "1px solid #f1f1f1", background: "#fff" }}>
        {["供应商直配", "总部仓直配", "总部仓直配 · 自有货"].map((m) => (
          <span key={m} onClick={() => setMode(m)}
            style={{ fontSize: 14, paddingBottom: 10, cursor: "pointer", color: mode === m ? "#25c7a5" : "#666", borderBottom: mode === m ? "2px solid #25c7a5" : "2px solid transparent", fontWeight: mode === m ? 600 : 400 }}>
            {m}
          </span>
        ))}
      </div>

      <div style={{ background: "#fff", padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid #f1f1f1" }}>
        <input value={kw} onChange={(e) => setKw(e.target.value)} placeholder="🔍 供货单号 / 快递单号 / 商品名称"
          style={{ flex: 1, background: "#f5f7f8", borderRadius: 14, padding: "6px 12px", fontSize: 12, color: "#333", border: 0, outline: "none" }} />
        {kw && <span onClick={() => setKw("")} style={{ color: "#999", fontSize: 12, cursor: "pointer" }}>清空</span>}
      </div>

      <div className="mtabs">
        {["全部", "待发货", "待收货", "已收货", "收货异常"].map((t) => (
          <button key={t} className={chip === t ? "active" : ""} onClick={() => setChip(t)}>{t}</button>
        ))}
      </div>

      <div className="mpad">
        {cards.filter((c) => modeOf(c) === mode).filter((c) => chip === "全部" || stateOf(c) === chip).filter(hit).map((d) => {
          const st = stateOf(d);
          const sent = sentOf(d);
          const received = receivedOf(d);
          const pk = packagesOf(d);
          const l = itemsLabel(d);
          const n = itemsOf(d).length;
          return (
            <div className="mcard" key={d.id}>
              <div className="hd"><b>供货单信息</b>
                {isPartial(d) && <span style={{ marginLeft: "auto", marginRight: 6, fontSize: 10.5, color: "#f5a623", border: "1px solid #ffd8a8", background: "#fff7e8", borderRadius: 3, padding: "0 5px", lineHeight: "17px" }}>部分收货</span>}
                <span style={{ color: STATE_TONE(st) }}>{st}</span></div>
              <div className="mrow"><span>供货单号</span><b className="mono">{d.id}</b></div>
              <div className="mrow"><span>供货路径</span><b>{legTextOf(d)}</b></div>
              <div className="mrow"><span>商品</span><b>{l.emoji} {l.more ? `${l.first} 等 ${n} 种` : l.first}</b></div>
              {!l.more && <div className="mrow"><span>规格</span><b>{l.spec}</b></div>}
              <div className="mrow"><span>{isPartial(d) ? "应发 / 已发" : sent ? "发货数量" : "应发数量"}</span><b>{isPartial(d) ? `${qtyOf(d)} / ${sent}` : sent || qtyOf(d)} 件</b></div>
              {/* 部分收货是「还差着补」，收货异常是「已经少了」——两种口径不能共用一句话 */}
              {isPartial(d) && <div className="mrow"><span>收货进度</span><b style={{ color: "#f5a623" }}>已收 {received}｜待补 {qtyOf(d) - received} 件</b></div>}
              {isPartial(d) && sent < qtyOf(d) && <div className="mrow"><span>发货方待发</span><b style={{ color: "#f5a623" }}>{qtyOf(d) - sent} 件</b></div>}
              {d.status === "收货异常" && <div className="mrow"><span>实收数量</span><b style={{ color: "#f5522e" }}>实收 {received}｜差 {qtyOf(d) - received} 件</b></div>}
              <div className="mrow"><span>发货主体</span><b>{d.shipper}</b></div>
              <div className="mrow"><span>发货时间</span><b className="mono">{sent ? d.batchAt || "—" : "未发货"}</b></div>
              {pk.length > 0 && (
                <div className="mrow"><span>{pk.length > 1 ? "包裹" : "物流单号"}</span>
                  {pk.length > 1
                    ? <b onClick={() => setTrack(d)} style={{ color: "#25c7a5" }}>共 {pk.length} 个包裹</b>
                    : <b className="mono">{pk[0].carrier} {pk[0].tracking}</b>}
                </div>
              )}
              <div className="macts">
                <button className="btn sm" onClick={() => setOrder(d)}>关联订单</button>
                {/* 待收货时「确认收货」进的就是供货单详情，再挂一个「查看详情」是重复入口 */}
                {st !== "待收货" && <button className="btn sm" onClick={() => onOpen(d)}>查看详情</button>}
                {pk.length > 0 && <button className="btn sm" onClick={() => setTrack(d)}>查看物流</button>}
                {st === "待收货" && <button className="btn primary sm" onClick={() => onOpen(d)}>确认收货</button>}
              </div>
            </div>
          );
        })}
        {!cards.filter((c) => modeOf(c) === mode).filter((c) => chip === "全部" || stateOf(c) === chip).filter(hit).length && (
          <div className="mcard" style={{ textAlign: "center", color: "#999", fontSize: 12.5, padding: "26px 0" }}>{kw ? "没有匹配的供货单" : "该状态下暂无供货单"}</div>
        )}
      </div>

      {track && <TrackSheet doc={track} onClose={() => setTrack(null)} />}
      {order && <OrderSheet doc={order} onClose={() => setOrder(null)} />}
    </div>
  );
}

/* ---------------- 物流轨迹（一批可能拆多个包裹，逐个包裹一条运单 + 一条轨迹） ---------------- */
const trackNodesOf = (doc, p) => {
  const at = String(p?.track || "");
  const sent = at.match(/已发货 (\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/);
  const signed = at.match(/已签收 (\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/);
  const nodes = [
    { t: "已下单", d: "供货物流单已创建，等待承运商揽收", at: doc.batchAt || "—" },
    { t: "已发货", d: `${p?.carrier || "—"} 已揽收，发往 ${STORE_SELF}`, at: sent ? sent[1] : "—" },
  ];
  if (signed) nodes.push({ t: "已签收", d: `已送达 ${doc.receiverAddr}`, at: signed[1] });
  else nodes.push({ t: "派送中", d: "待收货方签收", at: "—" });
  return nodes;
};

function TrackSheet({ doc, onClose }) {
  const pk = packagesOf(doc);
  const [cur, setCur] = useState(0);
  const p = pk[cur];
  const nodes = trackNodesOf(doc, p);
  return (
    <MPop title="物流轨迹" onClose={onClose} sub={`供货单号 ${doc.id}${pk.length > 1 ? ` · 共 ${pk.length} 个包裹` : ""}`}>
      {!pk.length && <div className="note">尚未发货，暂无物流信息</div>}
      {pk.length > 1 && <PkgChips count={pk.length} cur={cur} onPick={setCur} />}
      {p && (
        <>
          <div className="mcard" style={{ margin: 0 }}>
            <div className="mrow"><span>快递公司</span><b>{p.carrier || "—"}</b></div>
            <div className="mrow"><span>物流单号</span><b className="mono">{p.tracking || "—"}</b></div>
          </div>
          <div style={{ marginTop: 14 }}>
            {nodes.map((n, i) => (
              <div key={i} style={{ display: "flex", gap: 10, paddingBottom: i === nodes.length - 1 ? 0 : 16 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 12, flex: "none" }}>
                  <span style={{ width: 9, height: 9, borderRadius: "50%", background: i === 0 ? "#25c7a5" : "#d8dde1", marginTop: 4 }} />
                  {i !== nodes.length - 1 && <span style={{ flex: 1, width: 1, background: "#e8ecef", marginTop: 3 }} />}
                </div>
                <div style={{ fontSize: 12.5, lineHeight: 1.6 }}>
                  <div style={{ color: i === 0 ? "#25c7a5" : "#333" }}>{n.d}</div>
                  <div style={{ color: "#aaa", fontSize: 11.5, marginTop: 2 }}>{n.at}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </MPop>
  );
}

/* ---------------- 关联订单（卡片直达）----------------
   一批货覆盖多笔自提订单，每张单是给一个客户的 —— 店员要挨个通知来取，
   所以这里列的是这一批的**全部**订单，不是一笔 */
function OrderSheet({ doc, onClose }) {
  const orders = orderStore.use();
  const all = ordersOf(doc).map((no) => orders.find((o) => o.no === no)).filter(Boolean);
  /* 一批可能上百笔：店员手上有的是「手机号 / 姓名 / 订单号」和一个「这单取走没」的问题，
     所以给搜索 + 待提货筛选 + 分页，而不是把上百张卡一口气铺出来 */
  const [kw, setKw] = useState("");
  const [onlyPending, setOnlyPending] = useState(true);
  const [limit, setLimit] = useState(20);
  const pending = all.filter((o) => !o.pickupUsed);
  const list = (onlyPending ? pending : all).filter((o) => matchOrder(o, kw));
  const shown = list.slice(0, limit);
  const chip = (on) => ({
    padding: "4px 12px", borderRadius: 14, fontSize: 12, cursor: "pointer",
    background: on ? "#e6f7f2" : "#f5f7f8", color: on ? "#25c7a5" : "#666", fontWeight: on ? 600 : 400,
  });
  return (
    <MPop title="关联订单" onClose={onClose}
      sub={`供货单号 ${doc.id} · 共 ${ordersOf(doc).length} 笔 · 待提货 ${pending.length} 笔`}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
        <input value={kw} onChange={(e) => { setKw(e.target.value); setLimit(20); }}
          placeholder="搜订单号 / 手机号 / 姓名"
          style={{ flex: 1, height: 34, borderRadius: 17, border: 0, background: "#f5f7f8", padding: "0 14px", fontSize: 12.5 }} />
        <span style={chip(onlyPending)} onClick={() => { setOnlyPending(true); setLimit(20); }}>待提货</span>
        <span style={chip(!onlyPending)} onClick={() => { setOnlyPending(false); setLimit(20); }}>全部</span>
      </div>

      {shown.map((o) => (
        <div key={o.no} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 0", borderTop: "1px solid #f4f6f7" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13 }}>
              <b>{o.buyer?.["昵称"] || "—"}</b>
              <span className="mono" style={{ color: "#666", marginLeft: 8, fontSize: 12 }}>{o.buyer?.["收件人电话"] || "—"}</span>
            </div>
            <div className="note" style={{ marginTop: 3 }}>
              <span className="mono">{o.no}</span>　{o.emoji} {o.product} × {o.qty}
            </div>
          </div>
          <span style={{ flex: "none", fontSize: 11, color: o.pickupUsed ? "#999" : "#25c7a5", border: `1px solid ${o.pickupUsed ? "#e5e8eb" : "#b7ebdf"}`, background: o.pickupUsed ? "#fafbfc" : "#f2fbf9", borderRadius: 3, padding: "1px 6px" }}>
            {o.pickupUsed ? "已提货" : "待提货"}
          </span>
        </div>
      ))}

      {!shown.length && <div className="note" style={{ padding: "18px 0", textAlign: "center" }}>{kw ? "没有匹配的订单" : "这批没有待提货的订单"}</div>}
      {list.length > limit && (
        <button className="btn plain" style={{ width: "100%", marginTop: 12 }} onClick={() => setLimit((n) => n + 20)}>
          加载更多（还有 {list.length - limit} 笔）
        </button>
      )}
      <div className="note">自提单货到后按联系电话通知买家来取，取货时按订单核对。</div>
    </MPop>
  );
}

/* ---------------- 发货单详情 · 确认收货 ---------------- */
function Receive({ card, onConfirm, onBack, onGoDiffs }) {
  const st = stateOf(card);
  const items = itemsOf(card);
  const sent = sentOf(card);
  const received = receivedOf(card);
  const qtyTotal = items.reduce((a, it) => a + (it.qty || 0), 0);
  const due = Math.max(0, sent - received);     // 本次应收 = 还没收到的那部分（发货方少发时就是已到的那部分）
  const unshipped = Math.max(0, qtyTotal - sent);   // 发货方还没发的：系统自己知道，不用门店举证
  /* 「待收货」就能确认结案：没发齐的部分要在确认这一刻开差异单，不能因为「这次没货可收」把单子憋住 */
  const receivable = st === "待收货";
  const canCollect = due > 0;                   // 这一刻还有能收的货
  /* 按商品逐行登记实收 —— 店员是照着货点数，不是按订单点 */
  const [lines, setLines] = useState(items.map((it) => ({
    product: it.product, spec: it.spec, emoji: it.emoji,
    max: Math.max(0, (it.sent || 0) - (it.received || 0)),
    got: Math.max(0, (it.sent || 0) - (it.received || 0)),
  })));
  const [reasons, setReasons] = useState([]);
  const [note, setNote] = useState("");
  const [photos, setPhotos] = useState(0);
  const [copied, setCopied] = useState(false);
  const copyNo = () => {
    try { navigator.clipboard?.writeText(card.id).catch(() => {}); } catch { /* 非安全上下文下忽略 */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  const got = lines.reduce((a, x) => a + x.got, 0);
  const short = due - got;
  const shortage = short > 0;
  const pk = packagesOf(card);
  const label = itemsLabel(card);
  const [track, setTrack] = useState(false);
  const [order, setOrder] = useState(false);
  const tone = STATE_TONE(st);

  return (
    <div className="mpad">
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ color: tone, fontSize: 15 }}>{STATE_ICON(st)}</span>
        <b>{st}</b>
        {isPartial(card) && <span style={{ fontSize: 10.5, color: "#f5a623", border: "1px solid #ffd8a8", background: "#fff7e8", borderRadius: 3, padding: "0 5px", lineHeight: "17px" }}>部分收货</span>}
        <span className="note" style={{ display: "inline", marginLeft: "auto", fontSize: 11.5 }}>供货单编号 {card.id}</span>
        <span onClick={copyNo} style={{ color: "#25c7a5", fontSize: 12, cursor: "pointer" }}>{copied ? "已复制" : "复制"}</span>
      </div>

      <div className="mcard">
        <div className="hd"><b>供货单信息</b><span style={{ color: tone, fontSize: 12.5 }}>{st}</span></div>
        <div className="mrow"><span>供货单号</span><b className="mono">{card.id}</b></div>
        <div className="mrow"><span>供货路径</span><b>{legTextOf(card)}</b></div>
        <div className="mrow"><span>商品</span><b>{label.emoji} {label.more ? `${label.first} 等 ${items.length} 种` : label.first}</b></div>
        {!label.more && <div className="mrow"><span>规格</span><b>{label.spec}</b></div>}
        <div className="mrow"><span>{isPartial(card) ? "应发 / 已发" : sent ? "发货数量" : "应发数量"}</span><b>{isPartial(card) ? `${qtyOf(card)} / ${sent}` : sent || qtyOf(card)} 件</b></div>
        <div className="mrow"><span>发货主体</span><b>{card.shipper}</b></div>
        <div className="mrow"><span>发货时间</span><b className="mono">{sent ? card.batchAt || "—" : "未发货"}</b></div>
        {/* 部分收货是「还差着补」，收货异常是「已经少了」—— 两种口径不共用一句话 */}
        {isPartial(card) && <div className="mrow"><span>收货进度</span><b style={{ color: "#f5a623" }}>已收 {received}｜待补 {qtyOf(card) - received} 件</b></div>}
        {isPartial(card) && sent < qtyOf(card) && <div className="mrow"><span>发货方待发</span><b style={{ color: "#f5a623" }}>{qtyOf(card) - sent} 件</b></div>}
        {card.status === "收货异常" && <div className="mrow"><span>实收数量</span><b style={{ color: "#f5522e" }}>实收 {received}｜差 {qtyOf(card) - received} 件</b></div>}
        {pk.length > 0 && (
          <div className="mrow"><span>{pk.length > 1 ? "包裹" : "物流单号"}</span>
            {pk.length > 1
              ? <b onClick={() => setTrack(true)} style={{ color: "#25c7a5" }}>共 {pk.length} 个包裹</b>
              : <b className="mono">{pk[0].carrier} {pk[0].tracking}</b>}
          </div>
        )}
      </div>

      {/* 商品信息：一批多商品，逐个列出（门店是按商品点数的） */}
      <div className="mcard">
        <div className="hd"><b>商品信息</b><span className="note" style={{ fontSize: 11.5 }}>共 {items.length} 种 · {sent || qtyOf(card)} 件</span></div>
        {items.map((it) => (
          <div key={it.product} style={{ display: "flex", gap: 10, padding: "8px 0", borderTop: "1px solid #f4f6f7" }}>
            <span style={{ width: 40, height: 40, borderRadius: 5, background: "#f2f6f5", display: "grid", placeItems: "center", fontSize: 18, flex: "none" }}>{it.emoji || "📦"}</span>
            <div style={{ flex: 1, fontSize: 12.5 }}>
              <div>{it.product}</div>
              <div className="note" style={{ marginTop: 3 }}>规格 {it.spec}</div>
              <div className="note" style={{ marginTop: 3 }}>
                应发 {it.qty}　已发 {it.sent || 0}{it.received ? `　已收 ${it.received}` : ""}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 关联订单：一批覆盖多笔自提订单，货到了要挨个通知 —— 列的是全部，不是一笔 */}
      <div className="mcard">
        <div className="hd"><b>关联订单</b>
          <span onClick={() => setOrder(true)} style={{ marginLeft: "auto", color: "#25c7a5", fontSize: 12, cursor: "pointer" }}>
            共 {ordersOf(card).length} 笔 · 查看
          </span>
        </div>
        <div className="note">客户到本店自提，货到后按联系电话通知买家来取。</div>
      </div>

      {st === "待发货" && (
        <div className="mcard"><div style={{ fontSize: 12.5, color: "#999", textAlign: "center", padding: "4px 0" }}>{card.shipper} 尚未发货，发货后可查看物流并确认收货</div></div>
      )}

      {receivable && !canCollect && (
        <div className="mcard">
          <div style={{ fontSize: 12.5, color: "#f5a623", lineHeight: 1.9 }}>
            已到的 {received} 件都收完了；本单应发 {qtyTotal} 件，发货方只发了 {sent} 件。确认收货后未到齐的 {qtyTotal - received} 件会自动开配送差异单，审核通过后以补发单补到门店。
          </div>
        </div>
      )}

      {receivable && canCollect && (
        <>
          <div className="mcard">
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>收货信息（按商品核对，短缺请下调实收）</div>
            <div className="mrow"><span>本次应收</span><b className="mono">{due}</b></div>
            {unshipped > 0 && (
              <div className="note" style={{ marginTop: 4 }}>
                发货方只发了 {sent} 件（应发 {qtyTotal}）：能收的就是这 {sent} 件；未发齐的 {unshipped} 件在确认收货时自动开配送差异单，走补发单补到门店。
              </div>
            )}
            <div className="mrow"><span>少发数量</span><b className="mono" style={{ color: shortage ? "#f5522e" : "#333" }}>{short}</b></div>
            {lines.map((it, i) => (
              <div key={it.product} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderTop: "1px solid #f2f2f2" }}>
                <span style={{ fontSize: 12.5 }}>{it.emoji} {it.product}<span className="note" style={{ display: "block", fontSize: 11 }}>本次应收 {it.max}</span></span>
                <span className="qty">
                  <button className="btn plain sm" onClick={() => setLines((a) => a.map((x, j) => (j === i ? { ...x, got: Math.max(0, x.got - 1) } : x)))}>−</button>
                  <input value={it.got} readOnly style={{ width: 44, textAlign: "center", height: 28 }} />
                  <button className="btn plain sm" disabled={it.got >= it.max} onClick={() => setLines((a) => a.map((x, j) => (j === i ? { ...x, got: Math.min(x.max, x.got + 1) } : x)))}>＋</button>
                </span>
              </div>
            ))}
          </div>

          {/* 实收 ≠ 应收：当场登记异常，字段与后台收货管理一致 */}
          {shortage && (
            <div className="mcard">
              <div className="mfield">
                <label><i>*</i>配货差异原因</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 14, fontSize: 12.5 }}>
                  {["少货", "商品破损", "错货", "其他"].map((r) => (
                    <label key={r} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <input type="checkbox" checked={reasons.includes(r)}
                        onChange={() => setReasons((rs) => (rs.includes(r) ? rs.filter((x) => x !== r) : [...rs, r]))} />{r}
                    </label>
                  ))}
                </div>
              </div>
              <div className="mfield">
                <label><i>*</i>说明</label>
                <textarea rows={2} placeholder="例：XX商品 500ml 少发2瓶/破损1瓶" value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
              <div className="mfield" style={{ marginBottom: 0 }}>
                <label><i>*</i>图片凭证</label>
                <div style={{ fontSize: 11.5, color: "#999", marginBottom: 8 }}>支持上传PNG、JPG、JPEG、GIF格式，最多只能上传5张</div>
                <div className="mupload">
                  <span className="ph" onClick={() => setPhotos((p) => Math.min(5, p + 1))}>📷<br /><span style={{ fontSize: 11 }}>上传图片</span></span>
                  {Array.from({ length: photos }, (_, i) => <span className="ph" key={i} style={{ background: "#e8ecef" }}>🧾</span>)}
                </div>
              </div>
              {(!reasons.length || !note.trim() || !photos) && (
                <div style={{ fontSize: 11.5, color: "#f5522e", marginTop: 8 }}>有少发，需选差异原因、填说明并至少传 1 张图片才能确认收货</div>
              )}
            </div>
          )}
        </>
      )}

      {card.status === "收货异常" && (
        <div className="mcard">
          <div style={{ fontSize: 12.5, color: "#f5522e", lineHeight: 1.9 }}>
            实收与应收存在差异，差异单已自动生成，收货时填的差异原因与图片凭证已一并提交；可在「配送差异」页跟踪总部审核与补发进度。
          </div>
          <button className="btn primary sm" style={{ marginTop: 10 }} onClick={onGoDiffs}>去配送差异</button>
        </div>
      )}

      {card.status === "已收货" && (
        <div className="mcard" style={{ textAlign: "center", padding: "16px 0", color: "#25c7a5", fontSize: 13 }}>✓ 该供货单已确认收货</div>
      )}

      <div style={{ display: "flex", gap: 10, paddingBottom: 16 }}>
        <button className="btn plain" style={{ flex: receivable ? 1 : 2 }} onClick={onBack}>返回</button>
        {receivable && (
          <button className="btn primary" style={{ flex: 2 }}
            disabled={shortage && (!reasons.length || !note.trim() || !photos)}
            onClick={() => onConfirm({ lines: lines.map((x) => ({ product: x.product, got: x.got })), reason: reasons.join("、"), note: note.trim(), photos })}>
            确认收货
          </button>
        )}
      </div>

      {track && <TrackSheet doc={card} onClose={() => setTrack(false)} />}
      {order && <OrderSheet doc={card} onClose={() => setOrder(false)} />}
    </div>
  );
}

/* ---------------- 配送差异（照收货页风格 + Axure 差异页字段） ---------------- */
/* 状态口径与后台一片：待审核（等总部）/ 补发中·补发完成（通过后补发）/ 不通过 / 已关闭
   没有「待举证」：门店确认收货少收时，就在收货页当场填了原因 + 说明 + 图片，差异单一开出来就是「待总部审核」 */
const DIFF_TONE = (s) => (["待总部审核", "待供应商审核"].includes(s) ? "#2f80ed"
    : ["待补发", "补发中", "补发完成"].includes(s) ? "#25c7a5"
      : s === "审核不通过" ? "#f5522e" : "#999");

/* ---------------- 配送差异：读 diffStore 的「门店上报」部分，与后台是同一份数据 ----------------
   原来这里是一套写死的演示卡（商品数 / 差异总量），与后台差异单对不上账，现在直接读 store */
/* 来源供货单：发货方、物流单号、商品都从它取，差异单里不另存一份 */
const srcDocOf = (docs, no) => docs.find((d) => d.id === no) || null;
/* 差异摘要形如「画板套装 应收2/实收0 差2」，应收/实收从这句里取。
   不能用「应发 − 差异」反推实发：错货时实收等于应收（「华为手机 应收1/实收1 错货 1 件」），反推会得出实发 0 */
const parseSummary = (s) => {
  const m = /应收\s*(\d+)\s*\/\s*实收\s*(\d+)/.exec(s || "");
  return m ? { shouldQty: Number(m[1]), realQty: Number(m[2]) } : null;
};

function Diffs({ onDetail }) {
  const rows = diffStore.use().filter((d) => d.source === "门店上报");
  const docs = [...supplyStore.use(), ...supplierStore.use()];
  const [chip, setChip] = useState("全部");
  const list = rows.filter((d) => diffInTab(d.status, chip));
  return (
    <div>
      <div className="mtabs">
        {DIFF_TABS.map((t) => (
          <button key={t} className={chip === t ? "active" : ""} onClick={() => setChip(t)}>{t}</button>
        ))}
      </div>
      <div className="mpad">
        {list.map((d) => (
          <div className="mcard" key={d.id}>
            <div className="hd">
              <b>配送差异单</b>
              <span style={{ color: DIFF_TONE(d.status), fontSize: 12.5 }}>{d.status}</span>
            </div>
            <div className="mrow"><span>差异单号</span><b className="mono">{d.id}</b></div>
            <div className="mrow"><span>来源链路</span><b>{d.leg}</b></div>
            <div className="mrow"><span>关联供货单</span><b className="mono">{d.supplyNo}</b></div>
            <div className="mrow"><span>发货方</span><b>{d.shipper}（补发责任方）</b></div>
            <div className="mrow"><span>差异摘要</span><b style={{ fontWeight: 400, textAlign: "right" }}>{d.summary}</b></div>
            <div className="mrow"><span>举证信息</span><b style={{ fontWeight: 400 }}>{d.evidence}</b></div>
            {d.makeup && <div className="mrow"><span>补发供货单</span><b className="mono">{d.makeup}</b></div>}
            {d.rejectReason && <div className="mrow"><span>驳回原因</span><b style={{ fontWeight: 400, textAlign: "right", color: "#f5522e" }}>{d.rejectReason}</b></div>}
            <div className="macts">
              <button className="btn sm" onClick={() => onDetail(d)}>查看详情</button>
            </div>
          </div>
        ))}
        {!list.length && <div className="mcard" style={{ textAlign: "center", color: "#999", padding: 30 }}>暂无数据</div>}
      </div>
    </div>
  );
}

/* 来源供货单：查详情时对着它看——店员手上是货和快递箱，得知道是哪一单、谁发的、单号多少 */
function SrcDocBlock({ diff, docs }) {
  const src = srcDocOf(docs, diff.supplyNo);
  if (!src) return (
    <div className="mcard">
      <div className="hd"><b>来源供货单</b></div>
      <div className="mrow"><span>供货单号</span><b className="mono">{diff.supplyNo}</b></div>
      <div className="mrow"><span>发货方</span><b>{diff.shipper}</b></div>
      <div className="note" style={{ marginTop: 6 }}>该供货单不在当前门店可见范围内</div>
    </div>
  );
  return (
    <div className="mcard">
      <div className="hd"><b>来源供货单</b><span className="note" style={{ fontSize: 11.5 }}>{src.leg === "hq_store" ? "总仓 → 门店" : "供应商 → 门店"}</span></div>
      <div className="mrow"><span>供货单号</span><b className="mono">{src.id}</b></div>
      <div className="mrow"><span>发货方</span><b>{src.shipper}</b></div>
      <div className="mrow"><span>商品</span><b style={{ fontWeight: 400, textAlign: "right" }}>{src.emoji} {src.product}</b></div>
      <div className="mrow"><span>规格</span><b style={{ fontWeight: 400, textAlign: "right" }}>{src.spec}</b></div>
      <div className="mrow"><span>快递公司</span><b>{src.carrier || "—"}</b></div>
      <div className="mrow"><span>物流单号</span><b className="mono">{src.tracking || "—"}</b></div>
      <div className="mrow"><span>物流轨迹</span><b style={{ fontWeight: 400, textAlign: "right" }}>{src.track || "尚未发货"}</b></div>
    </div>
  );
}

/* 差异明细：商品取自来源供货单、数量取自差异摘要 */
function DiffItemsBlock({ diff, docs }) {
  const src = srcDocOf(docs, diff.supplyNo);
  const n = parseSummary(diff.summary);
  if (!src && !n) return null;
  return (
    <div className="mcard">
      <div className="hd"><b>差异明细</b></div>
      <div style={{ display: "flex", gap: 10, padding: "6px 0", borderTop: "1px solid #f2f2f2" }}>
        <span style={{ width: 44, height: 44, borderRadius: 5, background: "#f2f6f5", display: "grid", placeItems: "center", fontSize: 20 }}>{src?.emoji || "📦"}</span>
        <div style={{ flex: 1, fontSize: 12.5 }}>
          <div>{src ? `${src.product}　${src.spec}` : diff.summary}</div>
          <div className="note" style={{ marginTop: 3 }}>
            {n ? `应发 ${n.shouldQty}　实发 ${n.realQty}　差异 ${diff.diffQty ?? Math.max(0, n.shouldQty - n.realQty)} 件` : `差异 ${diff.diffQty ?? "—"} 件`}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- 差异单详情（查看详情落点） ---------------- */
function DiffDetail({ row, onBack }) {
  const docs = [...supplyStore.use(), ...supplierStore.use()];
  if (!row) return null;
  return (
    <div className="mpad">
      <div className="mcard">
        <div className="hd"><b>配送差异单 {row.id}</b><span style={{ color: DIFF_TONE(row.status), fontSize: 12.5 }}>{row.status}</span></div>
        <div className="mrow"><span>来源链路</span><b>{row.leg}</b></div>
        <div className="mrow"><span>上报方</span><b>{row.reporter}</b></div>
        <div className="mrow"><span>关联供货单</span><b className="mono">{row.supplyNo}</b></div>
        <div className="mrow"><span>发货方</span><b>{row.shipper}（补发责任方）</b></div>
        <div className="mrow"><span>差异摘要</span><b style={{ fontWeight: 400, textAlign: "right" }}>{row.summary}</b></div>
        <div className="mrow"><span>举证信息</span><b style={{ fontWeight: 400 }}>{row.evidence}</b></div>
        {row.rejectReason && <div className="mrow"><span>驳回原因</span><b style={{ fontWeight: 400, textAlign: "right", color: "#f5522e" }}>{row.rejectReason}</b></div>}
        {row.makeup && <div className="mrow"><span>补发供货单</span><b className="mono">{row.makeup}</b></div>}
      </div>

      <SrcDocBlock diff={row} docs={docs} />
      <DiffItemsBlock diff={row} docs={docs} />

      <div className="mcard" style={{ background: "#f5f7f8", color: "#666", fontSize: 12.5, lineHeight: 1.8 }}>
        {["待总部审核", "待供应商审核"].includes(row.status) ? "收货时已提交凭证，等待总部（租户）审核。"
            : ["待补发", "补发中"].includes(row.status) ? `总部审核已通过，补发由${row.shipper}按链路执行${row.makeup ? `（补发单 ${row.makeup}）` : ""}。`
            : row.status === "补发完成" ? "补发已完成，本差异单闭环。"
              : row.status === "审核不通过" ? "总部审核不通过，本差异单不再补发，如有疑问请联系总部。"
                : "本差异单已关闭。"}
      </div>

      <div style={{ display: "flex", gap: 10, paddingBottom: 16 }}>
        <button className="btn plain" style={{ flex: 1 }} onClick={onBack}>返回</button>
      </div>
    </div>
  );
}

/* ---------------- 退货返厂（门店自提链路的消费者退货） ---------------- */
const STORE_NAME = STORE_SELF;
const RETURN_REASONS = ["七天无理由退货", "商品质量问题", "商品与描述不符", "客户取消（未提货）"];
/* 可发起返厂的来源 = 本门店**已收货**的供货单上的商品（不再写死演示卡：
   返厂是从「手上这批货」发起的，必须能对上是哪张供货单的哪笔订单） */
export const returnSourcesOf = (supplyDocs, supplierDocs, orders) => {
  const rows = [];
  for (const d of storeDocsOf(supplyDocs, supplierDocs)) {
    if (d.status !== "已收货") continue;
    /* 供应商直发的直接退供应商；经总部仓的走「门店 → 总仓 → 供应商」 */
    const returnTo = d.leg === "supplier_inbound" ? d.shipper : "JOJO供应商";
    for (const it of itemsOf(d)) for (const f of it.from || []) {
      const o = orders.find((x) => x.no === f.orderNo);
      rows.push({
        supplyNo: d.id, orderNo: f.orderNo, product: it.product, spec: it.spec, emoji: it.emoji,
        qty: f.qty, returnTo, viaHq: d.leg !== "supplier_inbound",
        buyer: o?.buyer?.["昵称"] || "—",
      });
    }
  }
  return rows;
};
const RET_TONE = (s) => (s === "待返厂" ? "#f5a623" : s === "返厂中" ? "#2f80ed" : "#25c7a5");

function Returns() {
  const all = useReturns();
  const rows = all.filter((r) => r.store === STORE_NAME);
  const sources = returnSourcesOf(supplyStore.use(), supplierStore.use(), orderStore.use());
  const [chip, setChip] = useState("全部");
  const [detail, setDetail] = useState(null);
  const [sheet, setSheet] = useState(null);   // {k:"new"} | {k:"ship", r}
  const [flash, setFlash] = useState("");
  const list = rows.filter((r) => (chip === "全部" ? true : r.status === chip));

  const say = (m) => { setFlash(m); setTimeout(() => setFlash(""), 2200); };

  const create = (src, qty, reason) => {
    const id = "RTV260919" + String(all.length + 1).padStart(4, "0");
    setReturns((rs) => [{
      id, orderNo: src.orderNo, supplyNo: src.supplyNo, store: STORE_NAME, viaHq: src.viaHq,
      returnTo: src.returnTo, product: src.product, spec: src.spec, emoji: src.emoji, qty, reason,
      createdAt: new Date().toISOString().slice(0, 19).replace("T", " "), status: "待返厂",
      refunded: false, refundNote: "退款由总部按售后规则独立执行",
      hops: src.viaHq
        ? [{ from: STORE_NAME, to: "九天教育总仓", carrier: "", tracking: "", status: "待发货" },
           { from: "九天教育总仓", to: src.returnTo, carrier: "", tracking: "", status: "待发货" }]
        : [{ from: STORE_NAME, to: src.returnTo, carrier: "", tracking: "", status: "待发货" }],
    }, ...rs]);
    say("退货返厂单已提交，请尽快寄出");
  };

  const ship = (r, carrier, tracking) => {
    patchHop(r.id, 0, { carrier, tracking, status: "运输中" });
    say(`已登记寄出物流：${carrier} ${tracking}`);
  };

  return (
    <div>
      <div className="mtabs">
        {["全部", "待返厂", "返厂中", "已返厂"].map((t) => (
          <button key={t} className={chip === t ? "active" : ""} onClick={() => setChip(t)}>{t}</button>
        ))}
      </div>

      <div className="mpad">
        {flash && <div className="mcard" style={{ background: "#eefbf8", color: "#25c7a5", textAlign: "center", fontSize: 12.5 }}>{flash}</div>}

        <button className="btn primary" style={{ width: "100%", marginBottom: 10 }} onClick={() => setSheet({ k: "new" })}>+ 发起退货返厂</button>

        {list.map((r) => (
          <div className="mcard" key={r.id}>
            <div className="hd"><b>退货返厂单</b><span style={{ color: RET_TONE(r.status), fontSize: 12.5 }}>{r.status}</span></div>
            <div className="mrow"><span>返厂单号</span><b className="mono">{r.id}</b></div>
            <div className="mrow"><span>申请时间</span><b className="mono">{r.createdAt}</b></div>
            <div className="mrow"><span>关联销售订单</span><b className="mono">{r.orderNo}</b></div>
            <div className="mrow"><span>关联供货单</span><b className="mono">{r.supplyNo}</b></div>
            <div className="mrow"><span>商品</span><b style={{ fontWeight: 400, textAlign: "right" }}>{r.emoji} {r.product}</b></div>
            <div className="mrow"><span>规格</span><b style={{ fontWeight: 400, textAlign: "right" }}>{r.spec}</b></div>
            <div className="mrow"><span>退货数量</span><b>{r.qty} 件</b></div>
            <div className="mrow"><span>退货原因</span><b style={{ fontWeight: 400 }}>{r.reason}</b></div>
            <div className="mrow"><span>退回方</span><b>{r.returnTo}</b></div>
            <div className="mrow"><span>返厂路径</span><b style={{ fontWeight: 400, textAlign: "right" }}>{r.viaHq ? `门店 → 总部仓 → ${r.returnTo}` : `门店 → ${r.returnTo}`}</b></div>
            <div className="macts">
              <button className="btn sm" onClick={() => setDetail(r)}>查看详情</button>
              {r.status === "待返厂" && <button className="btn primary sm" onClick={() => setSheet({ k: "ship", r })}>填写寄出物流</button>}
            </div>
          </div>
        ))}
        {!list.length && <div className="mcard" style={{ textAlign: "center", color: "#999", padding: 30 }}>暂无退货返厂单</div>}
      </div>

      {detail && <ReturnDetail row={detail} onClose={() => setDetail(null)} />}
      {sheet?.k === "new" && sources.length > 0 && <NewReturnSheet sources={sources} onClose={() => setSheet(null)} onSubmit={create} />}
      {sheet?.k === "ship" && <ShipReturnSheet row={sheet.r} onClose={() => setSheet(null)} onSubmit={ship} />}
    </div>
  );
}

/* 退回地址：门店寄件时照着填快递单，取自供应商「地址库 › 售后地址」，不在返厂单里另存 */
function AddrRows({ who }) {
  const a = afterAddrOf(who);
  if (!a) return <div className="note">「{who}」尚未在供应商地址库维护售后地址，请联系总部补充</div>;
  return (
    <>
      <div className="mrow"><span>收件人</span><b>{a.name}</b></div>
      <div className="mrow"><span>联系电话</span><b className="mono">{a.phone}</b></div>
      <div className="mrow"><span>收货地址</span><b style={{ fontWeight: 400, textAlign: "right" }}>{fmtAddr(a)}</b></div>
      <div className="mrow"><span>邮编</span><b className="mono">{a.postcode}</b></div>
    </>
  );
}

/* 返厂单详情 */
function ReturnDetail({ row, onClose }) {
  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.35)", display: "flex", alignItems: "flex-end" }} onClick={onClose}>
      <div style={{ width: "100%", background: "#fff", borderRadius: "12px 12px 0 0", padding: "16px 16px 22px", maxHeight: "80%", overflow: "auto" }}
        onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
          <b style={{ fontSize: 15 }}>退货返厂详情</b>
          <span onClick={onClose} style={{ marginLeft: "auto", color: "#999", fontSize: 20, lineHeight: 1, cursor: "pointer" }}>×</span>
        </div>
        <div className="mcard">
          <div className="mrow"><span>返厂单号</span><b className="mono">{row.id}</b></div>
          <div className="mrow"><span>关联供货单</span><b className="mono">{row.supplyNo}</b></div>
          <div className="mrow"><span>商品</span><b>{row.product}</b></div>
          <div className="mrow"><span>规格</span><b style={{ fontWeight: 400 }}>{row.spec}</b></div>
          <div className="mrow"><span>退货数量</span><b>{row.qty} 件</b></div>
          <div className="mrow"><span>退货原因</span><b style={{ fontWeight: 400 }}>{row.reason}</b></div>
          <div className="mrow"><span>当前状态</span><b style={{ color: RET_TONE(row.status) }}>{row.status}</b></div>
        </div>

        <div className="mcard">
          <div className="hd"><b>返厂路径</b></div>
          {row.hops.map((h, i) => (
            <div key={i} style={{ display: "flex", gap: 10, padding: "9px 0", borderTop: i ? "1px solid #f2f2f2" : "none" }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", marginTop: 5, flex: "none", background: h.status === "已收货" ? "#25c7a5" : h.status === "运输中" ? "#2f80ed" : "#cfd7de" }} />
              <div style={{ fontSize: 12.5 }}>
                <b>{h.from} → {h.to}</b>
                <span style={{ marginLeft: 8, color: RET_TONE(h.status === "已收货" ? "已返厂" : h.status === "运输中" ? "返厂中" : "待返厂") }}>{h.status}</span>
                <div style={{ color: "#999", fontSize: 11.5, marginTop: 2 }}>
                  {h.carrier ? `${h.carrier} · ${h.tracking}` : "尚未寄出"}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mcard">
          <div className="hd"><b>退回地址</b><span className="note" style={{ fontSize: 11.5 }}>供应商售后地址</span></div>
          <AddrRows who={row.returnTo} />
        </div>

        <button className="btn plain" style={{ width: "100%" }} onClick={onClose}>关闭</button>
      </div>
    </div>
  );
}

/* 发起返厂 */
function NewReturnSheet({ sources, onClose, onSubmit }) {
  const [idx, setIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [reason, setReason] = useState(RETURN_REASONS[0]);
  const src = sources[idx];
  if (!src) return null;
  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.35)", display: "flex", alignItems: "flex-end" }} onClick={onClose}>
      <div style={{ width: "100%", background: "#fff", borderRadius: "12px 12px 0 0", padding: "16px 16px 22px", maxHeight: "86%", overflow: "auto" }}
        onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
          <b style={{ fontSize: 15 }}>发起退货返厂</b>
          <span onClick={onClose} style={{ marginLeft: "auto", color: "#999", fontSize: 20, lineHeight: 1, cursor: "pointer" }}>×</span>
        </div>

        <div className="mfield">
          <label><i>*</i>关联供货单</label>
          <select value={idx} onChange={(e) => setIdx(Number(e.target.value))} style={{ width: "100%", height: 38 }}>
            {sources.map((s, i) => (
              <option key={s.supplyNo + s.orderNo} value={i}>{s.supplyNo} · {s.product} · {s.orderNo} · {s.buyer}</option>
            ))}
          </select>
        </div>

        <div className="mcard" style={{ margin: "0 0 12px" }}>
          <div className="mrow"><span>销售订单</span><b className="mono">{src.orderNo}</b></div>
          <div className="mrow"><span>买家</span><b>{src.buyer}</b></div>
          <div className="mrow"><span>商品</span><b>{src.emoji} {src.product}</b></div>
          <div className="mrow"><span>规格</span><b style={{ fontWeight: 400 }}>{src.spec}</b></div>
          <div className="mrow"><span>退回方</span><b>{src.returnTo}</b></div>
          <div className="mrow"><span>返厂路径</span><b style={{ fontWeight: 400, textAlign: "right" }}>{src.viaHq ? `门店 → 总部仓 → ${src.returnTo}` : `门店 → ${src.returnTo}`}</b></div>
          <div className="mrow"><span>退回地址</span><b style={{ fontWeight: 400, textAlign: "right" }}>{fmtAddr(afterAddrOf(src.returnTo)) || "该供应商未维护"}</b></div>
        </div>

        <div className="mfield">
          <label><i>*</i>退货数量</label>
          <span className="qty">
            <button className="btn plain sm" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
            <input value={qty} readOnly style={{ width: 52, textAlign: "center", height: 30 }} />
            <button className="btn plain sm" onClick={() => setQty((q) => Math.min(src.qty ?? 99, q + 1))}>＋</button>
          </span>
        </div>

        <div className="mfield">
          <label><i>*</i>退货原因</label>
          <div className="mchips">
            {RETURN_REASONS.map((r) => (
              <label key={r}>
                <input type="radio" checked={reason === r} onChange={() => setReason(r)} />{r}
              </label>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn plain" style={{ flex: 1 }} onClick={onClose}>取消</button>
          <button className="btn primary" style={{ flex: 2 }} onClick={() => { onSubmit(src, qty, reason); onClose(); }}>提交返厂单</button>
        </div>
      </div>
    </div>
  );
}

/* 填写寄出物流 */
function ShipReturnSheet({ row, onClose, onSubmit }) {
  const [carrier, setCarrier] = useState("顺丰速运");
  const [tracking, setTracking] = useState("");
  const ok = tracking.trim();
  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.35)", display: "flex", alignItems: "flex-end" }} onClick={onClose}>
      <div style={{ width: "100%", background: "#fff", borderRadius: "12px 12px 0 0", padding: "16px 16px 22px" }}
        onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
          <b style={{ fontSize: 15 }}>填写寄出物流</b>
          <span onClick={onClose} style={{ marginLeft: "auto", color: "#999", fontSize: 20, lineHeight: 1, cursor: "pointer" }}>×</span>
        </div>
        <div className="mcard" style={{ margin: "0 0 12px" }}>
          <div className="hd"><b>寄往</b><span className="note" style={{ fontSize: 11.5 }}>返厂单 {row.id}</span></div>
          <AddrRows who={row.hops[0].to} />
        </div>

        <div className="mfield">
          <label><i>*</i>快递公司</label>
          <select value={carrier} onChange={(e) => setCarrier(e.target.value)} style={{ width: "100%", height: 38 }}>
            {["顺丰速运", "圆通速递", "中通快递", "韵达快递", "京东物流"].map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="mfield">
          <label><i>*</i>快递单号</label>
          <input value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="请输入快递单号" />
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn plain" style={{ flex: 1 }} onClick={onClose}>取消</button>
          <button className="btn primary" style={{ flex: 2 }} disabled={!ok} onClick={() => { onSubmit(row, carrier, tracking.trim()); onClose(); }}>确认寄出</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- 温馨提示弹窗 ---------------- */
function WarmTip({ onCancel, onOk }) {
  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.35)", display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ width: 300, background: "#fff", borderRadius: 8, padding: 20 }}>
        <b style={{ display: "block", textAlign: "center", fontSize: 15, marginBottom: 14 }}>温馨提示</b>
        <div style={{ fontSize: 12.5, lineHeight: 1.9, color: "#666" }}>
          当前供货单确认收货数量和实际送货数量有差异。下一步需填写差异原因、说明并上传图片凭证，确认收货后自动生成配送差异单。
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
          <button className="btn plain" style={{ flex: 1, height: 38 }} onClick={onCancel}>取消</button>
          <button className="btn" style={{ flex: 1, height: 38, background: "#2f80ed", borderColor: "#2f80ed", color: "#fff" }} onClick={onOk}>确认</button>
        </div>
      </div>
    </div>
  );
}
