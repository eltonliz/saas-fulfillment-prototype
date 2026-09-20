import React, { useState } from "react";
import { useReturns, setReturns, patchHop } from "../store.js";
import { FlowNode, FlowArrow } from "./buyer.jsx";
import { useReqPage } from "./reqnotes.jsx";

/* ============================================================================
   门店 APP —— 严格 1:1 还原用户 Axure 原型（工作台 / 收货管理 / 发货单详情·确认收货 / 温馨提示）
   ============================================================================ */
const STORE = { name: "濮源直播间", contact: "阿远", phone: "15554174768", addr: "广州市越秀区东风中路 410 号时代地产中心" };
const SUPPLY_NO = "23441231235554";

const RECEIPT_CARDS = [
  { id: "c1", state: "待发货", qty: "132件", no: "DB20260420106", acts: ["查看详情"] },
  { id: "c2", state: "已发货", qty: "132件", no: "DB20260420108", acts: ["查看详情", "查看物流", "确认收货"] },
  { id: "c3", state: "已收货", qty: "132件", no: "DB20260420109", acts: ["查看详情"] },
];

/* 配送差异单（照 Axure 原型的差异页字段） */
const DIFF_CARDS = [
  { id: "CY136465", state: "待举证", skuCount: 22, diffCount: 10, supplyNo: "5000029" },
  { id: "CY1936", state: "待举证", skuCount: 22, diffCount: 5, supplyNo: "5000027" },
  { id: "CY1943", state: "待审核", skuCount: 22, diffCount: 3, supplyNo: "5000029" },
  { id: "CY1906", state: "审核通过", skuCount: 50, diffCount: 20, supplyNo: "5000018" },
  { id: "CY130", state: "审核不通过", skuCount: 50, diffCount: 20, supplyNo: "5000018" },
  { id: "CY94", state: "已关闭", skuCount: 22, diffCount: 8, supplyNo: "5000014" },
];
const DIFF_ITEMS = [
  { name: "裤子", shouldQty: 30, realQty: 25, diffQty: 5 },
  { name: "裤子", shouldQty: 30, realQty: 25, diffQty: 5 },
];

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
  const [mode, setMode] = useState("preview");
  const [diffCard, setDiffCard] = useState(null);   // 当前查看的配送差异单
  useReqPage("app:" + view);

  return (
    <>
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 16 }}>
        <div style={{ display: "flex", border: "1px solid #e5e8eb", borderRadius: 10, overflow: "hidden", background: "#fff" }}>
          {[["preview", "📱 页面预览"], ["flow", "流程说明"]].map(([m, label]) => (
            <button key={m} onClick={() => setMode(m)} style={{ border: 0, padding: "7px 18px", fontSize: 13.5, cursor: "pointer", background: mode === m ? "#e6f7f2" : "#fff", color: mode === m ? "#25c7a5" : "#666", fontWeight: mode === m ? 600 : 400 }}>{label}</button>
          ))}
        </div>
      </div>
      {mode === "flow" ? <StoreFlowBoard /> : (
    <div className="phone-wrap">
      <div className="phone">
        <div className="status"><span>9:41</span><span>📶 🔋</span></div>

        <div className="mnav">
          <button className="back" onClick={() => { setView("home"); setConfirm(false); }}>‹</button>
          <span>{view === "home" ? "工作台" : view === "receipts" ? "收货管理" : view === "receive" ? "供货单详情" : view === "diffs" ? "配送差异" : view === "diffDetail" ? "差异单详情" : view === "returns" ? "退货返厂" : "举证信息"}</span>
          {view !== "home" && <span style={{ marginLeft: "auto", color: "#666", fontSize: 18, letterSpacing: 1 }}>⋯</span>}
        </div>

        <div className="mscreen">
          {view === "home" && <Home onGo={setView} />}
          {view === "receipts" && <Receipts onOpen={() => setView("receive")} />}
          {view === "receive" && <Receive onConfirm={(shortage) => (shortage ? setConfirm(true) : setView("receipts"))} onBack={() => setView("receipts")} />}
          {view === "diffs" && <Diffs onDetail={(c) => { setDiffCard(c); setView("diffDetail"); }} onEvidence={(c) => { setDiffCard(c); setView("evidence"); }} />}
          {view === "diffDetail" && <DiffDetail card={diffCard} onBack={() => setView("diffs")} onEvidence={() => setView("evidence")} />}
          {view === "evidence" && <Evidence card={diffCard} onBack={() => setView("diffs")} />}
          {view === "returns" && <Returns />}
        </div>

        {confirm && <WarmTip onCancel={() => setConfirm(false)} onOk={() => setConfirm(false)} />}
      </div>
    </div>
      )}
    </>
  );
}

/* ============================================================================
   流程说明：收货管理 / 配送差异 / 退货返厂 三条流程（拆屏 + 红箭头），供设计对照
   ============================================================================ */

function StoreFlowBoard() {
  return (
    <div style={{ padding: "26px 34px 46px", overflowX: "auto", minHeight: "100%" }}>
      <div style={{ color: "#e0392f", fontSize: 26, fontWeight: 800, letterSpacing: 1 }}>门店APP · 收货 / 差异 / 返厂流程</div>
      <div style={{ marginTop: 8, fontSize: 13.5, color: "#5b6672" }}>入口：工作台宫格（底部 Tab 已移除）　｜　<b style={{ color: "#e0392f" }}>红色</b>箭头为跳转路径</div>

      <div style={{ display: "flex", alignItems: "flex-start", marginTop: 28, minWidth: "max-content" }}>
        <FlowNode idx="①" title="收货管理 · 全部" sub="供应商直配 / 总部仓直配" n="1" dir="store-flow">
          筛选 全部 / 待发货 / 已发货 / 已收货；「已发货」单可 查看物流 / 确认收货。
        </FlowNode>
        <FlowArrow label="查看详情 / 确认收货" id="sa1" />
        <FlowNode idx="②" title="发货单详情 · 确认收货" sub="按商品核对实收" n="2" dir="store-flow">
          实收不可超过应收（＋到顶置灰）；少发时自动展开备注与图片凭证，且必填备注才能确认。
        </FlowNode>
        <FlowArrow label="点「确认收货」" id="sa2" />
        <FlowNode idx="③" title="温馨提示" sub="实收 ≠ 应收时" n="3" dir="store-flow">
          收货数量与实际送货有差异时，先弹此提示，确认后自动生成配送差异单。
        </FlowNode>
        <FlowArrow label={<>确认后生成差异单<br />（有差异时）</>} id="sa3" />
        <FlowNode idx="④" title="配送差异 · 全部" sub="收货环节自动生成" n="4" dir="store-flow">
          状态 待举证 / 待审核 / 审核通过 / 审核不通过 / 已关闭；待举证可「去举证」。
        </FlowNode>
        <FlowArrow label="待举证单「去举证」" id="sa4" />
        <FlowNode idx="⑤" title="举证信息" sub="提交凭证等总部审核" n="5" dir="store-flow">
          勾选差异原因（少货 / 破损 / 错货 / 其他）+ 说明 + 图片凭证。
        </FlowNode>
      </div>

      <div style={{ display: "flex", alignItems: "flex-start", marginTop: 34, minWidth: "max-content" }}>
        <FlowNode idx="⑥" title="退货返厂 · 全部" sub="自提链路的消费者退货" n="6" dir="store-flow">
          关联门店已收货的供货单发起返厂；状态 待返厂 / 返厂中 / 已返厂。
        </FlowNode>
        <FlowArrow label="＋ 发起退货返厂" id="sb1" />
        <FlowNode idx="⑦" title="发起退货返厂" sub="选单与原因" n="7" dir="store-flow">
          选关联供货单自动带出退回方与返厂路径；填退货数量与退货原因。
        </FlowNode>
        <FlowArrow label={<>提交后尽快寄出<br />（填物流）</>} id="sb2" />
        <FlowNode idx="⑧" title="填写寄出物流" sub="登记快递公司 + 单号" n="8" dir="store-flow">
          待返厂单寄出后登记物流，状态转「返厂中」。
        </FlowNode>
        <FlowArrow label="查看详情" id="sb3" />
        <FlowNode idx="⑨" title="返厂详情" sub="路径逐跳可查" n="9" dir="store-flow">
          门店 → 供应商，或经总部仓汇总转发；退款与返厂解耦。
        </FlowNode>
      </div>

      <div style={{ marginTop: 34, border: "2px dashed #e0392f", borderRadius: 12, padding: "14px 20px", maxWidth: 1180 }}>
        <div style={{ fontSize: 14.5, fontWeight: 700 }}>口径说明</div>
        <div style={{ marginTop: 7, fontSize: 13, lineHeight: 1.9, color: "#333" }}>
          入口：底部 Tab 已移除，收货管理 / 配送差异 / 退货返厂 统一从工作台宫格进入，‹ 返回工作台。<br />
          收货校验：实收<b>不可超过应收</b>；少发（实收 &lt; 应收）自动展开备注与图片凭证，<b>必填备注</b>后方可确认收货。<br />
          收货 → 差异：确认收货时<b>实收 ≠ 应收</b> → 自动生成配送差异单 → 门店举证 → 总部审核。<br />
          退货返厂：与退款<b>解耦</b>（门店收到退货触发总部退款，返厂独立走 待返厂 → 返厂中 → 已返厂）；返厂路径 门店 → 供应商，或经总部仓汇总转发。
        </div>
      </div>
    </div>
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
function Receipts({ onOpen }) {
  const [mode, setMode] = useState("供应商直配");
  const [chip, setChip] = useState("全部");
  const [track, setTrack] = useState(null);
  return (
    <div>
      <div style={{ display: "flex", gap: 20, padding: "12px 14px 0", borderBottom: "1px solid #f1f1f1", background: "#fff" }}>
        {["供应商直配", "总部仓直配"].map((m) => (
          <span key={m} onClick={() => setMode(m)}
            style={{ fontSize: 14, paddingBottom: 10, cursor: "pointer", color: mode === m ? "#25c7a5" : "#666", borderBottom: mode === m ? "2px solid #25c7a5" : "2px solid transparent", fontWeight: mode === m ? 600 : 400 }}>
            {m}
          </span>
        ))}
      </div>

      <div style={{ background: "#fff", padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid #f1f1f1" }}>
        <span style={{ flex: 1, background: "#f5f7f8", borderRadius: 14, padding: "6px 12px", fontSize: 12, color: "#666" }}>🔍 请输入供货编号/商品名称查询</span>
      </div>

      <div className="mtabs">
        {["全部", "待发货", "已发货", "已收货"].map((t) => (
          <button key={t} className={chip === t ? "active" : ""} onClick={() => setChip(t)}>{t}</button>
        ))}
      </div>

      <div className="mpad">
        {RECEIPT_CARDS.filter((c) => chip === "全部" || c.state === chip).map((c) => (
          <div className="mcard" key={c.id}>
            <div className="hd"><b>供货单信息</b><span style={{ color: c.state === "待发货" ? "#f5a623" : c.state === "已发货" ? "#2f80ed" : "#25c7a5", fontSize: 12.5 }}>{c.state}</span></div>
            <div className="mrow"><span>商品名称</span><b>得佑婴幼儿手口湿巾 弱酸无残留</b></div>
            <div className="mrow"><span>发货数量</span><b>{c.qty}</b></div>
            <div className="mrow"><span>供货单号</span><b className="mono">{c.no}</b></div>
            <div className="macts">
              <button className="btn sm" onClick={onOpen}>查看详情</button>
              {c.acts.includes("查看物流") && <button className="btn sm" onClick={() => setTrack(c)}>查看物流</button>}
              {c.acts.includes("确认收货") && <button className="btn primary sm" onClick={onOpen}>确认收货</button>}
            </div>
          </div>
        ))}
      </div>

      {track && <TrackSheet doc={track} onClose={() => setTrack(null)} />}
    </div>
  );
}

/* ---------------- 物流轨迹 ---------------- */
const TRACK_STEPS = [
  { at: "2026-04-21 16:22", text: "快件已签收，签收人：门店前台", done: true },
  { at: "2026-04-21 08:41", text: "派送中，配送员 王师傅 138****6621", done: true },
  { at: "2026-04-20 22:10", text: "快件到达【广州荔湾分拨中心】", done: true },
  { at: "2026-04-20 14:03", text: "快件已发出【东莞转运中心】", done: true },
  { at: "2026-04-20 09:15", text: "顺丰速运 已揽收，运单号 SF1234567890123", done: true },
];

function TrackSheet({ doc, onClose }) {
  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.35)", display: "flex", alignItems: "flex-end" }} onClick={onClose}>
      <div style={{ width: "100%", background: "#fff", borderRadius: "12px 12px 0 0", padding: "16px 16px 22px", maxHeight: "76%", overflow: "auto" }}
        onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
          <b style={{ fontSize: 15 }}>物流轨迹</b>
          <span onClick={onClose} style={{ marginLeft: "auto", color: "#999", fontSize: 20, lineHeight: 1, cursor: "pointer" }}>×</span>
        </div>
        <div style={{ fontSize: 12, color: "#999", marginBottom: 14 }}>
          供货单号 {doc.no} · 顺丰速运 SF1234567890123
        </div>
        {TRACK_STEPS.map((s, i) => (
          <div key={i} style={{ display: "flex", gap: 10, paddingBottom: i === TRACK_STEPS.length - 1 ? 0 : 16, position: "relative" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 12, flex: "none" }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: i === 0 ? "#25c7a5" : "#d8dde1", marginTop: 4 }} />
              {i !== TRACK_STEPS.length - 1 && <span style={{ flex: 1, width: 1, background: "#e8ecef", marginTop: 3 }} />}
            </div>
            <div style={{ fontSize: 12.5, lineHeight: 1.6 }}>
              <div style={{ color: i === 0 ? "#25c7a5" : "#333" }}>{s.text}</div>
              <div style={{ color: "#aaa", fontSize: 11.5, marginTop: 2 }}>{s.at}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- 发货单详情 · 确认收货 ---------------- */
function Receive({ onConfirm, onBack }) {
  const [items, setItems] = useState([
    { name: "什锦果蔬", spec: "礼盒装-应收5", qty: 5, max: 5 },
    { name: "奶粉", spec: "800g-应收4", qty: 4, max: 4 },
  ]);
  const [note, setNote] = useState("");
  const [photos, setPhotos] = useState(0);
  const [copied, setCopied] = useState(false);
  const copyNo = () => {
    try { navigator.clipboard?.writeText(SUPPLY_NO).catch(() => {}); } catch { /* 非安全上下文下忽略 */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  const shouldTotal = items.reduce((s, i) => s + i.max, 0);
  const short = shouldTotal - items.reduce((s, i) => s + i.qty, 0);
  const shortage = short > 0;

  return (
    <div className="mpad">
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ color: "#25c7a5", fontSize: 15 }}>✓</span>
        <b>确认收货</b>
        <span className="note" style={{ display: "inline", marginLeft: "auto", fontSize: 11.5 }}>供货单编号 {SUPPLY_NO}</span>
        <span onClick={copyNo} style={{ color: "#25c7a5", fontSize: 12, cursor: "pointer" }}>{copied ? "已复制" : "复制"}</span>
      </div>

      <div className="mcard">
        <div className="hd"><b>门店信息</b></div>
        <div className="mrow"><span>名称</span><b>{STORE.name}</b></div>
        <div className="mrow"><span>联系人</span><b>{STORE.contact}</b></div>
        <div className="mrow"><span>联系电话</span><b className="mono">{STORE.phone}</b></div>
        <div className="mrow"><span>地址</span><b style={{ textAlign: "right" }}>{STORE.addr}</b></div>
      </div>

      <div className="mcard">
        <div className="hd"><b>商品信息</b></div>
        {[1, 2].map((n) => (
          <div key={n} style={{ display: "flex", gap: 10, padding: "6px 0" }}>
            <span style={{ width: 44, height: 44, borderRadius: 5, background: "#f2f6f5", display: "grid", placeItems: "center", fontSize: 20 }}>💊</span>
            <div style={{ flex: 1, fontSize: 12.5 }}>
              <div>斯维诗男士锯棕榈番茄红素 <span style={{ color: "#999" }}>×1</span></div>
              <div style={{ color: "#999", fontSize: 11.5, marginTop: 2 }}>锯棕榈番茄红素锌硒<br />番茄红素片 5片</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mcard">
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>收货信息(按商品核对,短缺请下调实收)</div>
        <div className="mrow"><span>应收数量</span><b className="mono">{shouldTotal}</b></div>
        <div className="mrow"><span>少发数量</span><b className="mono" style={{ color: short ? "#f5522e" : "#333" }}>{short}</b></div>
        {items.map((it, i) => (
          <div key={it.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderTop: "1px solid #f2f2f2" }}>
            <span style={{ fontSize: 12.5 }}>{it.name}<br /><span style={{ color: "#999", fontSize: 11.5 }}>{it.spec}</span></span>
            <span className="qty">
              <button className="btn plain sm" onClick={() => setItems((a) => a.map((x, j) => (j === i ? { ...x, qty: Math.max(0, x.qty - 1) } : x)))}>−</button>
              <input value={it.qty} readOnly style={{ width: 44, textAlign: "center", height: 28 }} />
              <button className="btn plain sm" disabled={it.qty >= it.max} onClick={() => setItems((a) => a.map((x, j) => (j === i ? { ...x, qty: Math.min(x.max, x.qty + 1) } : x)))}>＋</button>
            </span>
          </div>
        ))}
      </div>

      {shortage && (
        <div className="mcard">
          <div className="mfield">
            <label><i>*</i>备注</label>
            <textarea rows={2} placeholder="例：XX商品 500ml 少发2瓶/破损1瓶" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <div className="mfield" style={{ marginBottom: 0 }}>
            <label>图片凭证</label>
            <div style={{ fontSize: 11.5, color: "#999", marginBottom: 8 }}>支持上传PNG、JPG、JPEG、GIF格式，最多只能上传5张</div>
            <div className="mupload">
              <span className="ph" onClick={() => setPhotos((p) => Math.min(5, p + 1))}>📷<br /><span style={{ fontSize: 11 }}>上传图片</span></span>
              {Array.from({ length: photos }, (_, i) => <span className="ph" key={i} style={{ background: "#e8ecef" }}>🧾</span>)}
            </div>
          </div>
        </div>
      )}

      {shortage && !note.trim() && (
        <div style={{ fontSize: 11.5, color: "#f5522e", marginBottom: 8 }}>有少发，请填写备注后再确认收货</div>
      )}
      <div style={{ display: "flex", gap: 10, paddingBottom: 16 }}>
        <button className="btn plain" style={{ flex: 1 }} onClick={onBack}>取消</button>
        <button className="btn primary" style={{ flex: 2 }} disabled={shortage && !note.trim()} onClick={() => onConfirm(shortage)}>确认收货</button>
      </div>
    </div>
  );
}

/* ---------------- 配送差异（照收货页风格 + Axure 差异页字段） ---------------- */
const DIFF_TONE = (s) => (s === "待举证" ? "#f5a623" : s === "审核通过" ? "#25c7a5" : s === "审核不通过" ? "#f5522e" : "#999");

function Diffs({ onDetail, onEvidence }) {
  const [chip, setChip] = useState("全部");
  const list = DIFF_CARDS.filter((c) => chip === "全部" || c.state === chip);
  return (
    <div>
      <div className="mtabs">
        {["全部", "待举证", "待审核", "审核通过", "审核不通过", "已关闭"].map((t) => (
          <button key={t} className={chip === t ? "active" : ""} onClick={() => setChip(t)}>{t}</button>
        ))}
      </div>
      <div className="mpad">
        {list.map((c) => (
          <div className="mcard" key={c.id}>
            <div className="hd">
              <b>配送差异单</b>
              <span style={{ color: DIFF_TONE(c.state), fontSize: 12.5 }}>{c.state}</span>
            </div>
            <div className="mrow"><span>配货差异单编号</span><b className="mono">{c.id}</b></div>
            <div className="mrow"><span>商品数</span><b>{c.skuCount}</b></div>
            <div className="mrow"><span>配货差异总数量</span><b style={{ color: "#f5522e" }}>{c.diffCount}</b></div>
            <div className="mrow"><span>关联供货编号</span><b className="mono">{c.supplyNo}</b></div>
            <div className="macts">
              <button className="btn sm" onClick={() => onDetail(c)}>查看详情</button>
              {c.state === "待举证" && <button className="btn primary sm" onClick={() => onEvidence(c)}>去举证</button>}
            </div>
          </div>
        ))}
        {!list.length && <div className="mcard" style={{ textAlign: "center", color: "#999", padding: 30 }}>暂无数据</div>}
      </div>
    </div>
  );
}

/* ---------------- 差异单详情（查看详情落点） ---------------- */
function DiffDetail({ card, onBack, onEvidence }) {
  if (!card) return null;
  return (
    <div className="mpad">
      <div className="mcard">
        <div className="hd">
          <b>配送差异单 {card.id}</b>
          <span style={{ color: DIFF_TONE(card.state), fontSize: 12.5 }}>{card.state}</span>
        </div>
        <div className="mrow"><span>商品数</span><b>{card.skuCount}</b></div>
        <div className="mrow"><span>配货差异总数量</span><b style={{ color: "#f5522e" }}>{card.diffCount}</b></div>
        <div className="mrow"><span>关联供货编号</span><b className="mono">{card.supplyNo}</b></div>
      </div>

      <div className="mcard">
        <div style={{ fontSize: 12.5, fontWeight: 600, margin: "4px 0 8px" }}>抽查指令（破）</div>
        {DIFF_ITEMS.map((it, i) => (
          <div key={i} style={{ borderTop: "1px solid #f2f2f2", padding: "9px 0", fontSize: 12.5 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>👜 {it.name}</span><b>差异数量 {it.diffQty}</b>
            </div>
            <div className="mrow" style={{ paddingTop: 4 }}><span>应发 {it.shouldQty}　实发 {it.realQty}</span></div>
          </div>
        ))}
      </div>

      {card.state === "待举证" ? (
        <div className="mcard" style={{ background: "#fff7e8", color: "#b7791f", fontSize: 12.5, lineHeight: 1.8 }}>
          到货点验与发货单存在差异，请<b>尽快上传凭证</b>；提交后由总部（租户）审核，审核通过后按「谁发货谁补发」补发。
        </div>
      ) : (
        <div className="mcard" style={{ background: "#f5f7f8", color: "#666", fontSize: 12.5, lineHeight: 1.8 }}>
          {card.state === "待审核" ? "凭证已提交，等待总部（租户）审核。"
            : card.state === "审核通过" ? "总部审核已通过，差异补发由总部按链路跟进。"
              : card.state === "审核不通过" ? "总部审核不通过，本差异单不再补发，如有疑问请联系总部。"
                : "本差异单已关闭。"}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, paddingBottom: 16 }}>
        <button className="btn plain" style={{ flex: 1 }} onClick={onBack}>返回</button>
        {card.state === "待举证" && <button className="btn primary" style={{ flex: 2 }} onClick={onEvidence}>去举证</button>}
      </div>
    </div>
  );
}

/* ---------------- 举证信息 ---------------- */
function Evidence({ card, onBack }) {
  const [reasons, setReasons] = useState(["少货"]);
  const [note, setNote] = useState("");
  const [photos, setPhotos] = useState(0);
  const [done, setDone] = useState(false);
  return (
    <div className="mpad">
      <div className="mcard">
        <div className="hd"><b>配货差异单 {card?.id || DIFF_CARDS[0].id}</b><span style={{ color: "#f5a623", fontSize: 12.5 }}>待举证</span></div>
        <div style={{ fontSize: 12.5, fontWeight: 600, margin: "4px 0 8px" }}>抽查指令（破）</div>
        {DIFF_ITEMS.map((it, i) => (
          <div key={i} style={{ borderTop: "1px solid #f2f2f2", padding: "9px 0", fontSize: 12.5 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>👜 {it.name}</span><b>差异数量 {it.diffQty}</b>
            </div>
            <div className="mrow" style={{ paddingTop: 4 }}><span>应发 {it.shouldQty}　实发 {it.realQty}</span></div>
          </div>
        ))}
      </div>

      <div className="mcard">
        <div className="mfield">
          <label><i>*</i>配货差异原因</label>
          <div className="mchips">
            {["少货", "商品破损", "错货", "其他"].map((r) => (
              <label key={r}>
                <input type="checkbox" checked={reasons.includes(r)}
                  onChange={() => setReasons((rs) => (rs.includes(r) ? rs.filter((x) => x !== r) : [...rs, r]))} />
                {r}
              </label>
            ))}
          </div>
        </div>

        <div className="mfield">
          <label>说明</label>
          <textarea rows={3} placeholder="请输入说明，最多200字" maxLength={200}
            value={note} onChange={(e) => setNote(e.target.value)} />
          <div style={{ textAlign: "right", fontSize: 11.5, color: "#bbb" }}>{note.length}/200</div>
        </div>

        <div className="mfield" style={{ marginBottom: 0 }}>
          <label><i>*</i>上传图片（最多上传5张）</label>
          <div className="mupload">
            <span className="ph" onClick={() => setPhotos((p) => Math.min(5, p + 1))}>＋</span>
            {Array.from({ length: photos }, (_, i) => <span className="ph" key={i} style={{ background: "#e8ecef" }}>🧾</span>)}
          </div>
          <div style={{ fontSize: 11.5, color: "#999", marginTop: 6 }}>上传文件（单个不超5M）</div>
        </div>
      </div>

      {done && <div className="mcard" style={{ background: "#eefbf8", color: "#25c7a5", textAlign: "center", fontSize: 12.5 }}>举证已提交，等待总部审核</div>}

      <div style={{ display: "flex", gap: 10, paddingBottom: 16 }}>
        <button className="btn plain" style={{ flex: 1 }} onClick={onBack}>取消</button>
        <button className="btn primary" style={{ flex: 2 }} disabled={!reasons.length || photos < 1}
          onClick={() => setDone(true)}>提交</button>
      </div>
    </div>
  );
}

/* ---------------- 退货返厂（门店自提链路的消费者退货） ---------------- */
const STORE_NAME = "濮源直播间";
const RETURN_REASONS = ["七天无理由退货", "商品质量问题", "商品与描述不符", "客户取消（未提货）"];
/* 可发起返厂的来源（该门店已收货的供货单） */
const RETURN_SOURCES = [
  { supplyNo: "FHD2609180016", orderNo: "ORD260918000093", product: "什锦果蔬", spec: "礼盒装 / 6 盒", emoji: "🧺", returnTo: "供应商003", viaHq: false, qty: 6 },
  { supplyNo: "FHD2609150002", orderNo: "ORD260915000088", product: "华为手机", spec: "蓝色 / M", emoji: "📱", returnTo: "JOJO供应商", viaHq: false, qty: 1 },
  { supplyNo: "FHD2609180014", orderNo: "ORD260918000101", product: "华为手机", spec: "黑色 / L", emoji: "📱", returnTo: "JOJO供应商", viaHq: true, qty: 1 },
];
const RET_TONE = (s) => (s === "待返厂" ? "#f5a623" : s === "返厂中" ? "#2f80ed" : "#25c7a5");

function Returns() {
  const all = useReturns();
  const rows = all.filter((r) => r.store === STORE_NAME);
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
            <div className="mrow"><span>商品</span><b>{r.emoji} {r.product} × {r.qty}</b></div>
            <div className="mrow"><span>退货原因</span><b style={{ fontWeight: 400 }}>{r.reason}</b></div>
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
      {sheet?.k === "new" && <NewReturnSheet onClose={() => setSheet(null)} onSubmit={create} />}
      {sheet?.k === "ship" && <ShipReturnSheet row={sheet.r} onClose={() => setSheet(null)} onSubmit={ship} />}
    </div>
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
          <div className="mrow"><span>商品</span><b>{row.product} {row.spec} × {row.qty}</b></div>
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
          <div className="hd"><b>退款说明</b></div>
          <div style={{ fontSize: 12.5, color: "#666", lineHeight: 1.9 }}>
            {row.refundNote}。门店收到退货即触发总部退款，返厂在途不影响客户退款。
          </div>
        </div>

        <button className="btn plain" style={{ width: "100%" }} onClick={onClose}>关闭</button>
      </div>
    </div>
  );
}

/* 发起返厂 */
function NewReturnSheet({ onClose, onSubmit }) {
  const [idx, setIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [reason, setReason] = useState(RETURN_REASONS[0]);
  const src = RETURN_SOURCES[idx];
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
            {RETURN_SOURCES.map((s, i) => (
              <option key={s.supplyNo} value={i}>{s.supplyNo} · {s.product}</option>
            ))}
          </select>
        </div>

        <div className="mcard" style={{ margin: "0 0 12px" }}>
          <div className="mrow"><span>商品</span><b>{src.emoji} {src.product}</b></div>
          <div className="mrow"><span>规格</span><b style={{ fontWeight: 400 }}>{src.spec}</b></div>
          <div className="mrow"><span>退回方</span><b>{src.returnTo}</b></div>
          <div className="mrow"><span>返厂路径</span><b style={{ fontWeight: 400, textAlign: "right" }}>{src.viaHq ? `门店 → 总部仓 → ${src.returnTo}` : `门店 → ${src.returnTo}`}</b></div>
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
        <div style={{ fontSize: 12.5, color: "#666", marginBottom: 12 }}>
          返厂单 {row.id} · 寄往 {row.hops[0].to}
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
          当前供货单确认收货数量和实际送货数量有差异，确认收货后会自动生成配送差异单，并需要完成举证。
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
          <button className="btn plain" style={{ flex: 1, height: 38 }} onClick={onCancel}>取消</button>
          <button className="btn" style={{ flex: 1, height: 38, background: "#2f80ed", borderColor: "#2f80ed", color: "#fff" }} onClick={onOk}>确认</button>
        </div>
      </div>
    </div>
  );
}
