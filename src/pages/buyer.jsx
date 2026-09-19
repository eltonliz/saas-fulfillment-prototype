import React, { useState } from "react";
import { orderStore, supplyStore } from "../store.js";
import { pickupCodeOf, fmtPickupCode } from "../data.js";
import { useReqPage } from "./reqnotes.jsx";

/* ============================================================================
   买家端（消费者）—— 照「自提订单」设计稿复刻：订单详情 / 查看自提码 / 已使用
   进销存口径修正：货到门店并确认到货后，「待提货」与提货码才出现
   ============================================================================ */

const isPickup = (o) => o.delivery === "上门自提" && !/已全额退款|已取消/.test(o.status);
/* 自提订单状态：unship 待发货 / shipping 待收货（在途）/ ready 待提货 / done 已完成
   货未到店的按关联供货单的货物流转定状态（流转路径对买家可见） */
export const buyerStateOf = (o, docs = []) => {
  if (o.pickupUsed) return "done";
  if (o.pickupReady) return "ready";
  const doc = docs.find((d) => (o.supplyNo && d.id === o.supplyNo) || d.orderNo === o.no);
  return doc && doc.status !== "待发货" ? "shipping" : "unship";
};
const STATE_META = {
  unship: { label: "待发货", color: "#25c7a5", icon: "⏳", tip: "商家备货中，货到门店确认后开放提货码" },
  shipping: { label: "待收货", color: "#25c7a5", icon: "🚚", tip: "运输中，货到门店确认后开放提货码" },
  ready: { label: "待提货", color: "#25c7a5", icon: "⏱", tip: "请到自提门店出示提货码" },
  done: { label: "已完成", color: "#999", icon: "✓", tip: "订单已完成" },
};
/* 页签照「我的订单」设计稿；待收货/待自提 合并一档（货已发出，等待客户收/提） */
const TABS = ["全部", "待付款", "待发货", "待收货/待自提", "已完成"];
const inTab = (st, orderStatus, t) =>
  t === "全部" ? true
    : t === "待付款" ? orderStatus === "待付款"
      : t === "待发货" ? st === "unship"
        : t === "待收货/待自提" ? (st === "shipping" || st === "ready")
          : st === "done";

export function BuyerApp() {
  const orders = orderStore.use();
  const docs = supplyStore.use();
  const [view, setView] = useState("list");
  const [tab, setTab] = useState("全部");
  const [curId, setCurId] = useState(null);
  const [codeOpen, setCodeOpen] = useState(false);
  const [mode, setMode] = useState("preview");
  useReqPage(view === "list" ? "buyer:list" : "buyer:detail");

  const all = orders.filter(isPickup);
  const list = all.filter((o) => inTab(buyerStateOf(o, docs), o.status, tab));
  const order = orders.find((o) => o.id === curId);
  const back = () => { setView("list"); setCodeOpen(false); };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 16 }}>
        <div style={{ display: "flex", border: "1px solid #e5e8eb", borderRadius: 10, overflow: "hidden", background: "#fff" }}>
          {[["preview", "📱 页面预览"], ["flow", "流程说明"]].map(([m, label]) => (
            <button key={m} onClick={() => setMode(m)} style={{ border: 0, padding: "7px 18px", fontSize: 13.5, cursor: "pointer", background: mode === m ? "#e6f7f2" : "#fff", color: mode === m ? "#25c7a5" : "#666", fontWeight: mode === m ? 600 : 400 }}>{label}</button>
          ))}
        </div>
      </div>
      {mode === "flow" ? <FlowBoard /> : (
    <div className="phone-wrap">
      <div className="phone">
        <div className="status"><span>9:41</span><span>📶 🔋</span></div>
        <div className="mnav">
          {view === "detail" && <button className="back" onClick={back}>‹</button>}
          <span>{view === "list" ? "我的订单" : "订单详情"}</span>
        </div>

        <div className="mscreen" style={{ background: "#eef1f3" }}>
          {view === "list" && (
            <div>
              <div style={{ background: "#fff", padding: "8px 14px 0" }}>
                <div style={{ background: "#f5f7f8", borderRadius: 15, padding: "7px 12px", fontSize: 12.5, color: "#9aa4ad" }}>🔍 搜索订单</div>
              </div>
              <div style={{ display: "flex", gap: 18, padding: "10px 14px 0", background: "#fff", borderBottom: "1px solid #f1f1f1", overflowX: "auto" }}>
                {TABS.map((t) => (
                  <span key={t} onClick={() => setTab(t)}
                    style={{ fontSize: 13.5, whiteSpace: "nowrap", cursor: "pointer", paddingBottom: 8, color: tab === t ? "#10161d" : "#8a949d", fontWeight: tab === t ? 600 : 400, borderBottom: tab === t ? "2px solid #25c7a5" : "2px solid transparent" }}>
                    {t}
                  </span>
                ))}
              </div>
              <div className="mpad">
                {list.map((o) => (
                  <OrderCard key={o.id} o={o} st={buyerStateOf(o, docs)}
                    onOpen={() => { setCurId(o.id); setView("detail"); }}
                    onCode={() => { setCurId(o.id); setCodeOpen(true); }} />
                ))}
                {!list.length && <div className="mcard" style={{ textAlign: "center", color: "#999", padding: 30 }}>暂无订单</div>}
              </div>
            </div>
          )}

          {view === "detail" && order && (() => {
            const st = buyerStateOf(order, docs);
            const m = STATE_META[st];
            const a = order.amounts || {};
            return (
              <div style={{ paddingBottom: 20 }}>
                <div style={{ background: "#fff", padding: "16px", display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 26, height: 26, borderRadius: "50%", background: m.color, color: "#fff", display: "grid", placeItems: "center", fontSize: 15, fontWeight: 700, flex: "none" }}>{m.icon}</span>
                  <b style={{ fontSize: 18 }}>{m.label}</b>
                </div>

                <div style={{ padding: 12 }}>
                  <div className="mcard">
                    <b style={{ fontSize: 14.5 }}>{order.store}</b>
                    <div className="note">自提门店 · {m.tip}</div>
                  </div>

                  <div className="mcard">
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ width: 56, height: 56, borderRadius: 6, background: "#f2f6f5", display: "grid", placeItems: "center", fontSize: 26, flex: "none" }}>{order.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <b style={{ fontSize: 13.5 }}>{order.product}</b>
                        <div className="note" style={{ marginTop: 2 }}>{order.spec}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <b style={{ fontSize: 14 }}>{order.unitPrice}</b>
                        <div className="note">×{order.qty}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
                      {["unship", "shipping"].includes(st) ? (
                        <span style={{ background: "#f5f7f8", color: "#b9c0c7", borderRadius: 15, padding: "6px 16px", fontSize: 12.5 }}>查看自提码</span>
                      ) : (
                        <button onClick={() => setCodeOpen(true)} style={{ border: 0, background: "#e6f7f2", color: "#25c7a5", borderRadius: 15, padding: "6px 16px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>查看自提码</button>
                      )}
                    </div>
                  </div>

                  <div className="mcard">
                    {[["商品总金额", a.商品金额], ["运费", a.邮费], ["优惠金额", a.优惠金额], ["订单应付金额", a.应收金额]].map(([k, v]) => (
                      <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "5px 0" }}>
                        <span style={{ color: "#666" }}>{k}</span><span>{v || "-"}</span>
                      </div>
                    ))}
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, padding: "8px 0 0", borderTop: "1px solid #f2f4f6", marginTop: 4 }}>
                      <b>订单实付金额</b><b style={{ color: "#f04438" }}>¥{a.实收金额 || "-"}</b>
                    </div>
                  </div>

                  <div className="mcard" style={{ marginBottom: 20 }}>
                    {[["订单编号", order.no], ["下单时间", order.createdAt], ["支付时间", order.payTime || "—"], ["支付方式", order.payMethod || "—"], ["买家留言", "—"]].map(([k, v]) => (
                      <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, padding: "5px 0" }}>
                        <span style={{ color: "#8a949d" }}>{k}</span>
                        <span style={{ color: "#333", display: "flex", alignItems: "center", gap: 6 }}>
                          {v}{k === "订单编号" && <CopyMini text={order.no} />}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {codeOpen && order && <PickupCodeModal order={order} done={buyerStateOf(order, docs) === "done"} onClose={() => setCodeOpen(false)} />}
      </div>
    </div>
      )}
    </>
  );
}

/* ============================================================================
   流程说明：自提订单全链路（5 屏拆开 + 红箭头标注跳转），供设计对照
   ============================================================================ */

function FlowBoard() {
  return (
    <div style={{ padding: "26px 34px 46px", overflowX: "auto", minHeight: "100%" }}>
      <div style={{ color: "#e0392f", fontSize: 26, fontWeight: 800, letterSpacing: 1 }}>买家端 · 自提订单流程</div>
      <div style={{ marginTop: 8, fontSize: 13.5, color: "#5b6672" }}>截图订单 ORD260917000153（华为手机 · 9071门店自提）　｜　<b style={{ color: "#e0392f" }}>红色</b>为进销存改造点，核销动作在门店端完成</div>

      <div style={{ display: "flex", alignItems: "flex-start", marginTop: 28, minWidth: "max-content" }}>
        <FlowNode idx="①" title="我的订单" sub="订单列表 · 全部" n="1">
          待到店订单显示<b style={{ color: "#e0392f" }}>红框提示</b>「商家备货中 / 运输中，货到门店确认后开放提货码」；到店后该行出现「查看自提码」按钮。
        </FlowNode>
        <FlowArrow label="点击订单卡片" id="fa1" />
        <FlowNode idx="②" title="订单详情 · 待发货" sub="货未到店（商家备货 / 运输中）" n="2">
          状态为「待发货 / 待收货」；「查看自提码」<b style={{ color: "#e0392f" }}>置灰不可点</b>（货到门店确认后才开放）。
        </FlowNode>
        <FlowArrow label={<>商家收到货并确认到货<br />（系统自动流转）</>} id="fa2" />
        <FlowNode idx="③" title="订单详情 · 待提货" sub="货到门店并确认到货后" n="3">
          状态自动变「待提货」，<b style={{ color: "#e0392f" }}>提货码开放</b>，「查看自提码」按钮可点。<br />（买家无需任何操作）
        </FlowNode>
        <FlowArrow label="点「查看自提码」" id="fa3" />
        <FlowNode idx="④" title="提货码 · 待提货" sub="到店出示" n="4">
          16 位提货码 + 二维码（同一码，全端一致），可复制；「请在门店前台出示此码核销」。
        </FlowNode>
        <FlowArrow label={<>门店前台核销<br />（核销在门店端操作）</>} id="fa4" />
        <FlowNode idx="⑤" title="提货码 · 已使用" sub="核销后" n="5">
          码置灰并盖<b style={{ color: "#e0392f" }}>「已使用」戳</b>，不可再用；订单转「已完成」。
        </FlowNode>
      </div>

      <div style={{ marginTop: 34, border: "2px dashed #e0392f", borderRadius: 12, padding: "14px 20px", maxWidth: 1180 }}>
        <div style={{ fontSize: 14.5, fontWeight: 700 }}>进销存口径（与原「自提订单」设计稿的差异）</div>
        <div style={{ marginTop: 7, fontSize: 13, lineHeight: 1.9, color: "#333" }}>
          原设计：下单支付后即显示「待提货」并可查看提货码。<br />
          改造后：<b>货到门店并确认到货，「待提货」与提货码才开放</b> —— 供应商直配 / 总部仓直配的货先流转到门店，买家端可感知流转路径（备货中 → 运输中 → 待提货）；②→③ 为系统自动流转，买家无需操作。<br />
          核销：买家到店出示提货码，由<b>门店端核销</b>；核销后提货码置灰盖「已使用」戳，订单转「已完成」。
        </div>
      </div>
    </div>
  );
}

export function FlowNode({ idx, title, sub, n, dir = "buyer-flow", children }) {
  return (
    <div style={{ width: 300, flex: "none" }}>
      <div style={{ fontSize: 15.5, fontWeight: 700 }}><i style={{ color: "#e0392f", fontStyle: "normal", marginRight: 6 }}>{idx}</i>{title}</div>
      <div style={{ fontSize: 12, color: "#8a949d", margin: "3px 0 9px" }}>{sub}</div>
      <img src={`${dir}/${n}.png`} style={{ width: 300, display: "block" }} />
      <div style={{ marginTop: 10, fontSize: 12, lineHeight: 1.75, color: "#5b6672" }}>{children}</div>
    </div>
  );
}

export function FlowArrow({ label, id }) {
  return (
    <div style={{ flex: "none", paddingTop: 262, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ fontSize: 12.5, lineHeight: 1.5, fontWeight: 600, color: "#e0392f", textAlign: "center", background: "#fff", border: "1px solid #f3b7b2", borderRadius: 10, padding: "5px 9px", maxWidth: 138, marginBottom: 9 }}>{label}</div>
      <svg width="150" height="26" viewBox="0 0 150 26">
        <defs><marker id={id} markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto"><path d="M0,0 L7,3 L0,6 z" fill="#e0392f" /></marker></defs>
        <line x1="4" y1="13" x2="137" y2="13" stroke="#e0392f" strokeWidth="3" markerEnd={`url(#${id})`} />
      </svg>
    </div>
  );
}

/* 订单卡片（照「我的订单」设计稿：店铺卡头 + 商品行 + 状态副行 + 共N件实付 + 状态按钮） */
function OrderCard({ o, st, onOpen, onCode }) {
  const m = STATE_META[st];
  const a = o.amounts || {};
  const btnStyle = { border: "1px solid #dcdcdc", background: "#fff", borderRadius: 15, padding: "5px 14px", fontSize: 12.5, color: "#333", cursor: "pointer" };
  return (
    <div className="mcard" style={{ marginBottom: 10 }}>
      <div className="hd" style={{ borderBottom: "1px solid #f5f7f8", paddingBottom: 8, marginBottom: 0 }}>
        <span style={{ fontSize: 13, color: "#333" }}>🏬 {o.store} ›</span>
        <span style={{ color: m.color, fontSize: 12.5, fontWeight: 600 }}>{m.label}</span>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 10, cursor: "pointer" }} onClick={onOpen}>
        <span style={{ width: 58, height: 58, borderRadius: 6, background: "#f2f6f5", display: "grid", placeItems: "center", fontSize: 26, flex: "none" }}>{o.emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <b style={{ fontSize: 13.5 }}>{o.product}</b>
          <div className="note" style={{ marginTop: 2 }}>{o.spec}</div>
          {(st === "ready" || st === "done") && (
            <div style={{ marginTop: 5, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              {st === "ready" ? (
                <span style={{ color: "#25c7a5", fontSize: 12 }}>请前往门店提货 ›</span>
              ) : (
                <span style={{ color: "#999", fontSize: 12 }}>已提货 订单已完成 ›</span>
              )}
              {st === "ready" && (
                <button onClick={(e) => { e.stopPropagation(); onCode(); }}
                  style={{ border: 0, background: "#e6f7f2", color: "#25c7a5", borderRadius: 13, padding: "4px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", flex: "none" }}>查看自提码</button>
              )}
            </div>
          )}
        </div>
        <div style={{ textAlign: "right", flex: "none" }}>
          <b style={{ fontSize: 13 }}>{o.unitPrice}</b>
          <div className="note" style={{ marginTop: 2 }}>×{o.qty}</div>
        </div>
      </div>
      {(st === "unship" || st === "shipping") && (
        <div className="mhl" data-hl="进销存修改" style={{ margin: "10px 0 0", padding: "9px 9px 5px", fontSize: 11.5, color: "#8a949d", background: "#fff" }}>
          {st === "unship" ? "商家备货中" : "运输中"}，货到门店确认后开放提货码 ›
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10, paddingTop: 8, borderTop: "1px solid #f5f7f8" }}>
        <span className="note" style={{ marginTop: 0 }}>共 {o.qty} 件　实付 <b style={{ color: "#333" }}>¥{a.实收金额 || "-"}</b></span>
        <span style={{ display: "flex", gap: 8 }}>
          {st === "done" ? <button style={btnStyle}>去评价</button> : <button style={btnStyle}>申请售后</button>}
        </span>
      </div>
    </div>
  );
}

/* 复制（照设计稿的复制成功态） */
function CopyMini({ text }) {
  const [ok, setOk] = useState(false);
  return (
    <span onClick={() => { try { navigator.clipboard?.writeText(text).catch(() => {}); } catch { /* 非安全上下文下忽略 */ } setOk(true); setTimeout(() => setOk(false), 1500); }}
      style={{ color: "#25c7a5", cursor: "pointer" }}>{ok ? "已复制" : "复制"}</span>
  );
}

/* 提货码弹层（照设计稿：二维码 + 16 位码 + 复制；已核销时置灰盖「已使用」戳） */
function PickupCodeModal({ order, done, onClose }) {
  const [copied, setCopied] = useState(false);
  const code = pickupCodeOf(order);
  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.4)", display: "grid", placeItems: "center", padding: 26, zIndex: 40 }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ width: 286, background: "#fff", borderRadius: 16, padding: "18px 18px 16px", position: "relative", textAlign: "center" }}>
        <div style={{ fontSize: 15.5, fontWeight: 600 }}>{done ? "已提货" : "待提货"}</div>
        <button onClick={onClose} style={{ position: "absolute", right: 10, top: 8, border: 0, background: "none", fontSize: 20, color: "#c0c6cc", cursor: "pointer", lineHeight: 1 }}>×</button>
        <div style={{ position: "relative", width: 170, margin: "16px auto 0" }}>
          <FakeQR code={code} dim={done} />
          {done && (
            <span style={{ position: "absolute", right: -12, bottom: 4, transform: "rotate(-14deg)", border: "2px solid #e0392f", color: "#e0392f", borderRadius: "50%", width: 62, height: 62, display: "grid", placeItems: "center", fontSize: 13, fontWeight: 700, background: "rgba(255,255,255,.75)" }}>已使用</span>
          )}
        </div>
        <div style={{ fontSize: 19, letterSpacing: 1.2, fontWeight: 700, margin: "14px 0 6px", color: done ? "#c2c8ce" : "#10161d", whiteSpace: "nowrap" }}>{fmtPickupCode(code)}</div>
        <button className="btn plain sm" style={{ borderRadius: 14 }}
          onClick={() => { try { navigator.clipboard?.writeText(code).catch(() => {}); } catch { /* 非安全上下文下忽略 */ } setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
          {copied ? "已复制" : "复制"}
        </button>
        <div className="note" style={{ marginTop: 12, textAlign: "center" }}>{done ? "订单已完成" : "请在门店前台出示此码核销"}</div>
      </div>
    </div>
  );
}

/* 伪二维码：由提货码确定性生成图案（原型示意用，非真实二维码） */
function FakeQR({ code, dim }) {
  const n = 21;
  let x = 7;
  for (const ch of code) x = (x * 31 + ch.charCodeAt(0)) % 999983;
  const cells = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    const finder = (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);
    if (finder) continue;
    x = (x * 1103515245 + 12345) % 2147483648;
    if (x % 100 < 46) cells.push([r, c]);
  }
  const ink = dim ? "#c6ccd2" : "#10161d";
  return (
    <svg width={170} height={170} viewBox={`0 0 ${n} ${n}`} style={{ display: "block" }}>
      {cells.map(([r, c], i) => <rect key={i} x={c} y={r} width={1} height={1} fill={ink} />)}
      {[[0, 0], [0, n - 7], [n - 7, 0]].map(([r, c], i) => (
        <g key={i}>
          <rect x={c + 0.5} y={r + 0.5} width={6} height={6} fill="none" stroke={ink} strokeWidth={1} />
          <rect x={c + 2} y={r + 2} width={3} height={3} fill={ink} />
        </g>
      ))}
    </svg>
  );
}
