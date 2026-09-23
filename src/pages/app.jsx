import React, { useState } from "react";
import { useReturns, setReturns, patchHop, diffStore, addDiff, supplyStore, supplierStore } from "../store.js";
import { diffInTab, DIFF_TABS } from "./supply.jsx";
import { afterAddrOf, fmtAddr } from "../data.js";
import { FlowNode, FlowArrow } from "./buyer.jsx";
import { useReqPage } from "./reqnotes.jsx";

/* ============================================================================
   门店 APP —— 工作台 / 收货管理 / 发货单详情·确认收货 / 温馨提示
   ============================================================================ */
/* 门店APP 的收货方就是登录门店自己，详情页不再重复展示门店信息（原来的写死常量已删） */

const RECEIPT_CARDS = [
  { id: "c1", mode: "供应商直配", state: "待发货", qty: "132件", no: "DB20260420106", orderNo: "ORD260918000310", buyer: "王小美", buyerPhone: "13812345678", delivery: "上门自提", acts: ["查看详情"], name: "得佑婴幼儿手口湿巾 弱酸无残留", spec: "80抽×3包 / 箱", emoji: "🧴", shipper: "供应商001", shippedAt: "", carrier: "", tracking: "" },
  { id: "c2", mode: "供应商直配", state: "待收货", qty: "132件", no: "DB20260420108", orderNo: "ORD260918000310", buyer: "王小美", buyerPhone: "13812345678", delivery: "上门自提", acts: ["查看详情", "查看物流", "确认收货"], name: "得佑婴幼儿手口湿巾 弱酸无残留", spec: "80抽×3包 / 箱", emoji: "🧴", shipper: "供应商001", shippedAt: "2026-04-20 14:30", carrier: "顺丰速运", tracking: "SF7712004901" },
  { id: "c3", mode: "供应商直配", state: "已收货", qty: "132件", no: "DB20260420109", orderNo: "ORD260918000310", buyer: "王小美", buyerPhone: "13812345678", delivery: "上门自提", acts: ["查看详情"], name: "得佑婴幼儿手口湿巾 弱酸无残留", spec: "80抽×3包 / 箱", emoji: "🧴", shipper: "供应商001", shippedAt: "2026-04-18 09:05", carrier: "顺丰速运", tracking: "SF7712004877" },
  /* 总部仓直配（供应商供货）：货先到总仓，再由总仓发到门店 */
  { id: "c4", mode: "总部仓直配", state: "待发货", qty: "40件", no: "FHD2609180005", orderNo: "ORD260918000311", buyer: "李建国", buyerPhone: "13900001111", delivery: "上门自提", acts: ["查看详情"], name: "儿童保温杯 316不锈钢", spec: "500ml / 蓝", emoji: "🥤", shipper: "九天教育总仓", shippedAt: "", carrier: "", tracking: "" },
  { id: "c5", mode: "总部仓直配", state: "待收货", qty: "40件", no: "FHD2609180006", orderNo: "ORD260918000311", buyer: "李建国", buyerPhone: "13900001111", delivery: "上门自提", acts: ["查看详情", "查看物流", "确认收货"], name: "儿童保温杯 316不锈钢", spec: "500ml / 蓝", emoji: "🥤", shipper: "九天教育总仓", shippedAt: "2026-09-19 09:20", carrier: "中通快递", tracking: "ZT8800112601" },
  /* 总部仓直配 · 自有货：不经供应商，总部仓直发门店 */
  { id: "c6", mode: "总部仓直配 · 自有货", state: "待收货", qty: "20件", no: "FHD2609180018", orderNo: "ORD260918000312", buyer: "陈小雨", buyerPhone: "13700002222", delivery: "上门自提", acts: ["查看详情", "查看物流", "确认收货"], name: "儿童书包", spec: "蓝色 / 大号", emoji: "🎒", shipper: "九天教育总仓", shippedAt: "2026-09-19 10:05", carrier: "顺丰速运", tracking: "SF7712007702" },
  { id: "c7", mode: "总部仓直配 · 自有货", state: "已收货", qty: "15件", no: "FHD2609180017", orderNo: "ORD260918000312", buyer: "陈小雨", buyerPhone: "13700002222", delivery: "上门自提", acts: ["查看详情"], name: "保温饭盒", spec: "304不锈钢 / 1.2L", emoji: "🍱", shipper: "九天教育总仓", shippedAt: "2026-09-17 15:40", carrier: "圆通速递", tracking: "YT5500338890" },
  /* 分次收货（上次收部分、剩待补）与收货异常（实收≠应收 → 自动开差异单、门店到差异页举证）：三组各铺一张便于演示 */
  { id: "c8", mode: "供应商直配", state: "待收货", qty: "132件", recv: 100, remain: 32, no: "DB20260420110", orderNo: "ORD260918000313", buyer: "赵一诺", buyerPhone: "13600003333", delivery: "上门自提", acts: ["查看详情", "查看物流", "确认收货"], name: "得佑婴幼儿手口湿巾 弱酸无残留", spec: "80抽×3包 / 箱", emoji: "🧴", shipper: "供应商002", shippedAt: "2026-04-20 11:10", carrier: "顺丰速运", tracking: "SF7712004915" },
  { id: "c9", mode: "供应商直配", state: "收货异常", qty: "132件", recv: 130, remain: 2, no: "DB20260420111", orderNo: "ORD260918000313", buyer: "赵一诺", buyerPhone: "13600003333", delivery: "上门自提", acts: ["查看详情"], name: "得佑婴幼儿手口湿巾 弱酸无残留", spec: "80抽×3包 / 箱", emoji: "🧴", shipper: "供应商002", shippedAt: "2026-04-19 08:45", carrier: "顺丰速运", tracking: "SF7712004862" },
  { id: "c10", mode: "总部仓直配", state: "待收货", qty: "40件", recv: 30, remain: 10, no: "FHD2609180021", orderNo: "ORD260918000314", buyer: "孙丽", buyerPhone: "13500004444", delivery: "上门自提", acts: ["查看详情", "查看物流", "确认收货"], name: "儿童保温杯 316不锈钢", spec: "500ml / 蓝", emoji: "🥤", shipper: "九天教育总仓", shippedAt: "2026-09-19 14:22", carrier: "中通快递", tracking: "ZT8800112644" },
  { id: "c11", mode: "总部仓直配", state: "收货异常", qty: "40件", recv: 38, remain: 2, no: "FHD2609180020", orderNo: "ORD260918000314", buyer: "孙丽", buyerPhone: "13500004444", delivery: "上门自提", acts: ["查看详情"], name: "儿童保温杯 316不锈钢", spec: "500ml / 蓝", emoji: "🥤", shipper: "九天教育总仓", shippedAt: "2026-09-18 16:30", carrier: "中通快递", tracking: "ZT8800112588" },
  { id: "c12", mode: "总部仓直配 · 自有货", state: "待收货", qty: "20件", recv: 12, remain: 8, no: "FHD2609180022", orderNo: "ORD260918000315", buyer: "周慧", buyerPhone: "13400005555", delivery: "上门自提", acts: ["查看详情", "查看物流", "确认收货"], name: "儿童书包", spec: "蓝色 / 大号", emoji: "🎒", shipper: "九天教育总仓", shippedAt: "2026-09-19 09:48", carrier: "顺丰速运", tracking: "SF7712007733" },
  { id: "c13", mode: "总部仓直配 · 自有货", state: "收货异常", qty: "15件", recv: 14, remain: 1, no: "FHD2609180023", orderNo: "ORD260918000315", buyer: "周慧", buyerPhone: "13400005555", delivery: "上门自提", acts: ["查看详情"], name: "保温饭盒", spec: "304不锈钢 / 1.2L", emoji: "🍱", shipper: "九天教育总仓", shippedAt: "2026-09-18 17:12", carrier: "圆通速递", tracking: "YT5500338942" },
  /* 补齐：总部仓直配组「已收货」、自有货组「待发货」→ 三组 × 五状态全有数据 */
  { id: "c14", mode: "总部仓直配", state: "已收货", qty: "25件", no: "FHD2609180019", orderNo: "ORD260918000316", buyer: "吴强", buyerPhone: "13300006666", delivery: "上门自提", acts: ["查看详情"], name: "儿童保温杯 316不锈钢", spec: "500ml / 蓝", emoji: "🥤", shipper: "九天教育总仓", shippedAt: "2026-09-17 10:15", carrier: "中通快递", tracking: "ZT8800112510" },
  { id: "c15", mode: "总部仓直配 · 自有货", state: "待发货", qty: "30件", no: "FHD2609180024", orderNo: "ORD260918000317", buyer: "郑爽", buyerPhone: "13200007777", delivery: "上门自提", acts: ["查看详情"], name: "儿童书包", spec: "蓝色 / 大号", emoji: "🎒", shipper: "九天教育总仓", shippedAt: "", carrier: "", tracking: "" },
];
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
  const [mode, setMode] = useState("preview");
  const [diffCard, setDiffCard] = useState(null);   // 当前查看的配送差异单
  const [cards, setCards] = useState(RECEIPT_CARDS); // 收货管理卡片（确认收货后状态流转）
  const [receiptCard, setReceiptCard] = useState(null); // 当前查看/收货的供货单
  const [pendingReceipt, setPendingReceipt] = useState(null); // 少收待温馨提示确认的收货结果
  useReqPage("app:" + view);

  /* 少收 → 自动生成门店配送差异单（待举证）+ 差异页出现对应卡（幂等：同一供货单不重复生成） */
  const genStoreDiff = (c, got = 0) => {
    if (diffStore.get().some((d) => d.supplyNo === c.no && d.status === "待举证")) return;
    const dt = new Date();
    const ymd = String(dt.getFullYear()).slice(2) + String(dt.getMonth() + 1).padStart(2, "0") + String(dt.getDate()).padStart(2, "0");
    const diffId = "DIFF" + ymd + String(diffStore.get().length + 1).padStart(4, "0");
    const due = c.recv != null ? (c.remain ?? 0) : (parseInt(c.qty, 10) || 0);
    const recvTotal = (c.recv ?? 0) + got;
    /* 差异单只记事实（谁发的、差多少），发货方与商品明细由「来源供货单」承载，后台差异单同此口径 */
    addDiff({
      id: diffId, source: "门店上报", reporter: "门店",
      leg: c.mode === "供应商直配" ? "供应商 → 门店" : "总仓 → 门店",
      supplyNo: c.no, shipper: c.shipper,
      summary: `${c.name} 应收${parseInt(c.qty, 10) || 0}/实收${recvTotal} 差${Math.max(0, due - got)}`,
      diffQty: Math.max(0, due - got), status: "待举证", evidence: "—",
    });
  };

  /* 确认收货：收满 →「已收货」；少收（温馨提示确认后）→「收货异常」+ 自动生成配送差异单 */
  const commitReceipt = (res) => {
    const c = receiptCard;
    if (res?.shortage) {
      genStoreDiff(c, res.got ?? 0);
      setCards((cs) => cs.map((x) => (x.id === c.id ? { ...x, state: "收货异常", acts: ["查看详情"] } : x)));
    } else {
      setCards((cs) => cs.map((x) => (x.id === c.id ? { ...x, state: "已收货", acts: ["查看详情"], recv: undefined, remain: undefined } : x)));
    }
    setPendingReceipt(null);
    setConfirm(false);
    setView("receipts");
  };

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
          {view === "receipts" && <Receipts cards={cards} onOpen={(c) => { setReceiptCard(c); setView("receive"); }} />}
          {view === "receive" && receiptCard && (
            <Receive
              card={receiptCard}
              onBack={() => setView("receipts")}
              onConfirm={(r) => (r.shortage ? (setPendingReceipt(r), setConfirm(true)) : commitReceipt(r))}
              onGoDiffs={() => { genStoreDiff(receiptCard, 0); setView("diffs"); }}
            />
          )}
          {view === "diffs" && <Diffs onDetail={(d) => { setDiffCard(d); setView("diffDetail"); }} onEvidence={(d) => { setDiffCard(d); setView("evidence"); }} />}
          {view === "diffDetail" && <DiffDetail row={diffCard} onBack={() => setView("diffs")} onEvidence={() => { setDiffCard(diffCard); setView("evidence"); }} />}
          {view === "evidence" && <Evidence card={diffCard} onBack={() => setView("diffs")}
            onSubmitted={() => setPhoneDiffs((ds) => ds.map((d) => (d.id === diffCard.id && d.state === "待举证" ? { ...d, state: "待审核" } : d)))} />}
          {view === "returns" && <Returns />}
        </div>

        {confirm && <WarmTip onCancel={() => { setConfirm(false); setPendingReceipt(null); }} onOk={() => commitReceipt(pendingReceipt)} />}
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
        <FlowNode idx="①" title="收货管理 · 全部" sub="供应商直配 / 总部仓直配（含自有货）" n="1" dir="store-flow">
          筛选与后台收货管理一致：全部 / 待收货 / 已收货 / 收货异常；曾部分收货的单归「待收货」并带「部分收货」标记，收满确认后才结案，收货异常到差异页举证。
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
function Receipts({ cards, onOpen }) {
  const [mode, setMode] = useState("供应商直配");
  const [chip, setChip] = useState("全部");
  const [track, setTrack] = useState(null);
  const [order, setOrder] = useState(null);
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
        <span style={{ flex: 1, background: "#f5f7f8", borderRadius: 14, padding: "6px 12px", fontSize: 12, color: "#666" }}>🔍 请输入供货编号/商品名称查询</span>
      </div>

      <div className="mtabs">
        {["全部", "待发货", "待收货", "已收货", "收货异常"].map((t) => (
          <button key={t} className={chip === t ? "active" : ""} onClick={() => setChip(t)}>{t}</button>
        ))}
      </div>

      <div className="mpad">
        {cards.filter((c) => c.mode === mode).filter((c) => chip === "全部" || c.state === chip).map((c) => (
          <div className="mcard" key={c.id}>
            <div className="hd"><b>供货单信息</b>
              {c.state === "待收货" && c.recv != null && <span style={{ marginLeft: "auto", marginRight: 6, fontSize: 10.5, color: "#f5a623", border: "1px solid #ffd8a8", background: "#fff7e8", borderRadius: 3, padding: "0 5px", lineHeight: "17px" }}>部分收货</span>}
              <span style={{ color: STATE_TONE(c.state), fontSize: 12.5 }}>{c.state}</span></div>
            <div className="mrow"><span>商品名称</span><b>{c.name}</b></div>
            <div className="mrow"><span>规格</span><b>{c.spec}</b></div>
            <div className="mrow"><span>发货数量</span><b>{c.qty}</b></div>
            {/* 部分收货是「还差着补」，收货异常是「已经少了」——两种口径不能共用一句话 */}
            {c.recv != null && (c.state === "收货异常"
              ? <div className="mrow"><span>实收数量</span><b style={{ color: STATE_TONE(c.state) }}>实收 {c.recv}｜差 {c.remain} 件</b></div>
              : <div className="mrow"><span>收货进度</span><b style={{ color: STATE_TONE(c.state) }}>已收 {c.recv}｜待补 {c.remain} 件</b></div>)}
            <div className="mrow"><span>供货单号</span><b className="mono">{c.no}</b></div>
            <div className="mrow"><span>发货主体</span><b>{c.shipper}</b></div>
            <div className="mrow"><span>发货时间</span><b className="mono">{c.shippedAt || "未发货"}</b></div>
            {c.tracking && <div className="mrow"><span>物流单号</span><b className="mono">{c.carrier} {c.tracking}</b></div>}
            <div className="macts">
              <button className="btn sm" onClick={() => setOrder(c)}>关联订单</button>
              {/* 待收货时「确认收货」进的就是供货单详情，再挂一个「查看详情」是重复入口 */}
              {c.state !== "待收货" && <button className="btn sm" onClick={() => onOpen(c)}>查看详情</button>}
              {c.acts.includes("查看物流") && <button className="btn sm" onClick={() => setTrack(c)}>查看物流</button>}
              {c.acts.includes("确认收货") && <button className="btn primary sm" onClick={() => onOpen(c)}>确认收货</button>}
            </div>
          </div>
        ))}
      </div>

      {track && <TrackSheet doc={track} onClose={() => setTrack(null)} />}
      {order && <OrderSheet card={order} onClose={() => setOrder(null)} />}
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

/* ---------------- 关联订单（卡片直达）----------------
   自提单的货是给某个客户的，店员随时可能要查「这单给谁」——不用先进供货单详情 */
function OrderSheet({ card, onClose }) {
  const Row = ({ k, children, mono }) => (
    <div className="mrow"><span>{k}</span><b className={mono ? "mono" : undefined} style={{ fontWeight: mono ? undefined : 400 }}>{children}</b></div>
  );
  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.35)", display: "flex", alignItems: "flex-end" }} onClick={onClose}>
      <div style={{ width: "100%", background: "#fff", borderRadius: "12px 12px 0 0", padding: "16px 16px 22px", maxHeight: "76%", overflow: "auto" }}
        onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
          <b style={{ fontSize: 15 }}>关联订单</b>
          <span onClick={onClose} style={{ marginLeft: "auto", color: "#999", fontSize: 20, lineHeight: 1, cursor: "pointer" }}>×</span>
        </div>
        <div style={{ fontSize: 12, color: "#999", marginBottom: 14 }}>供货单号 {card.no} · 客户到本店自提</div>
        <div className="mcard" style={{ margin: 0 }}>
          <Row k="销售订单号" mono>{card.orderNo}</Row>
          <Row k="下单人">{card.buyer}</Row>
          <Row k="联系电话" mono>{card.buyerPhone}</Row>
          <Row k="配送方式">{card.delivery}</Row>
          <Row k="商品">{card.emoji} {card.name} × {card.qty}</Row>
        </div>
      </div>
    </div>
  );
}

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
function Receive({ card, onConfirm, onBack, onGoDiffs }) {
  const qty = parseInt(card.qty, 10) || 0;
  const st = card.state;
  const part = card.recv != null; // 曾部分收货：仍在待收货，续收本次待补量
  const due = part ? (card.remain ?? qty - (card.recv || 0)) : qty; // 本次应收（部分收货 = 待补数量）
  const [items, setItems] = useState([{ name: card.name, qty: due, max: due }]);
  const [note, setNote] = useState("");
  const [photos, setPhotos] = useState(0);
  const [copied, setCopied] = useState(false);
  const copyNo = () => {
    try { navigator.clipboard?.writeText(card.no).catch(() => {}); } catch { /* 非安全上下文下忽略 */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  const short = items.reduce((s, i) => s + i.max, 0) - items.reduce((s, i) => s + i.qty, 0);
  const shortage = short > 0;
  const receivable = st === "待收货";
  const tone = STATE_TONE(st);

  return (
    <div className="mpad">
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ color: tone, fontSize: 15 }}>{STATE_ICON(st)}</span>
        <b>{st}</b>
        <span className="note" style={{ display: "inline", marginLeft: "auto", fontSize: 11.5 }}>供货单编号 {card.no}</span>
        <span onClick={copyNo} style={{ color: "#25c7a5", fontSize: 12, cursor: "pointer" }}>{copied ? "已复制" : "复制"}</span>
      </div>

      <div className="mcard">
        <div className="hd"><b>供货单信息</b><span style={{ color: tone, fontSize: 12.5 }}>{st}</span></div>
        <div className="mrow"><span>供货单号</span><b className="mono">{card.no}</b></div>
        <div className="mrow"><span>供货路径</span><b>{card.mode === "供应商直配" ? "供应商 → 门店" : card.mode.includes("自有货") ? "总部自有 → 门店" : "总部仓 → 门店"}</b></div>
        <div className="mrow"><span>发货主体</span><b>{card.shipper}</b></div>
        <div className="mrow"><span>发货时间</span><b className="mono">{card.shippedAt || "未发货"}</b></div>
        <div className="mrow"><span>快递公司</span><b>{card.carrier || "—"}</b></div>
        <div className="mrow"><span>物流单号</span><b className="mono">{card.tracking || "—"}</b></div>
        {part && <div className="mrow"><span>收货进度</span><b style={{ color: "#f5a623" }}>已收 {card.recv ?? 0}｜待补 {due} 件</b></div>}
        {st === "收货异常" && <div className="mrow"><span>实收数量</span><b style={{ color: "#f5522e" }}>{card.recv ?? 0}｜差 {card.remain ?? 0} 件</b></div>}
      </div>

      {/* 商品信息：四个状态常驻（原来只在「待收货」才出现） */}
      <div className="mcard">
        <div className="hd"><b>商品信息</b></div>
        <div style={{ display: "flex", gap: 10, padding: "6px 0" }}>
          <span style={{ width: 44, height: 44, borderRadius: 5, background: "#f2f6f5", display: "grid", placeItems: "center", fontSize: 20 }}>{card.emoji || "📦"}</span>
          <div style={{ flex: 1, fontSize: 12.5 }}>
            <div>{card.name}</div>
            <div className="note" style={{ marginTop: 3 }}>规格 {card.spec}</div>
            <div className="note" style={{ marginTop: 3 }}>
              发货数量 {card.qty}{receivable ? `　本次应收 ${due} 件` : ""}
            </div>
          </div>
        </div>
      </div>

      {/* 关联订单：这单是给谁的——自提单货到要通知客户来取，店员得知道对应哪张销售订单 */}
      <div className="mcard">
        <div className="hd"><b>关联订单</b><span className="note" style={{ fontSize: 11.5 }}>客户到本店自提</span></div>
        <div className="mrow"><span>销售订单号</span><b className="mono">{card.orderNo}</b></div>
        <div className="mrow"><span>下单人</span><b>{card.buyer}</b></div>
        <div className="mrow"><span>联系电话</span><b className="mono">{card.buyerPhone}</b></div>
        <div className="mrow"><span>配送方式</span><b>{card.delivery}</b></div>
      </div>

      {st === "待发货" && (
        <div className="mcard"><div style={{ fontSize: 12.5, color: "#999", textAlign: "center", padding: "4px 0" }}>{card.mode.includes("总部") ? "总部仓" : "供应商"}尚未发货，发货后可查看物流并确认收货</div></div>
      )}

      {receivable && (
        <>

          <div className="mcard">
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>收货信息(按商品核对,短缺请下调实收)</div>
            <div className="mrow"><span>应收数量</span><b className="mono">{due}</b></div>
            <div className="mrow"><span>少发数量</span><b className="mono" style={{ color: short ? "#f5522e" : "#333" }}>{short}</b></div>
            {items.map((it, i) => (
              <div key={it.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderTop: "1px solid #f2f2f2" }}>
                <span style={{ fontSize: 12.5 }}>{it.name}</span>
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
        </>
      )}

      {st === "收货异常" && (
        <div className="mcard">
          <div style={{ fontSize: 12.5, color: "#f5522e", lineHeight: 1.9 }}>
            实收与应收存在差异，已自动生成配送差异单；请前往「配送差异」页完成举证，待总部审核后按链路补发。
          </div>
          <button className="btn primary sm" style={{ marginTop: 10 }} onClick={onGoDiffs}>去配送差异举证</button>
        </div>
      )}

      {st === "已收货" && (
        <div className="mcard" style={{ textAlign: "center", padding: "16px 0", color: "#25c7a5", fontSize: 13 }}>✓ 该供货单已确认收货</div>
      )}

      <div style={{ display: "flex", gap: 10, paddingBottom: 16 }}>
        <button className="btn plain" style={{ flex: receivable ? 1 : 2 }} onClick={onBack}>返回</button>
        {receivable && <button className="btn primary" style={{ flex: 2 }} disabled={shortage && !note.trim()} onClick={() => onConfirm({ shortage, got: items[0].qty })}>确认收货</button>}
      </div>
    </div>
  );
}

/* ---------------- 配送差异（照收货页风格 + Axure 差异页字段） ---------------- */
/* 状态口径与后台一片：待举证（等门店）/ 待审核（等总部）/ 补发中·补发完成（通过后补发）/ 不通过 / 已关闭 */
const DIFF_TONE = (s) => (s === "待举证" ? "#f5a623"
  : ["待总部审核", "待供应商审核"].includes(s) ? "#2f80ed"
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

function Diffs({ onDetail, onEvidence }) {
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
              {/* 待举证时还没内容可看，详情入口收起来，只留「去举证」 */}
              {d.status === "待举证"
                ? <button className="btn primary sm" onClick={() => onEvidence(d)}>去举证</button>
                : <button className="btn sm" onClick={() => onDetail(d)}>查看详情</button>}
            </div>
          </div>
        ))}
        {!list.length && <div className="mcard" style={{ textAlign: "center", color: "#999", padding: 30 }}>暂无数据</div>}
      </div>
    </div>
  );
}

/* 来源供货单：举证和查详情都要对着它看——店员手上是货和快递箱，得知道是哪一单、谁发的、单号多少 */
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
      <div className="mrow"><span>商品</span><b style={{ fontWeight: 400, textAlign: "right" }}>{src.emoji} {src.product}　{src.spec}</b></div>
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
function DiffDetail({ row, onBack, onEvidence }) {
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

      {row.status === "待举证" ? (
        <div className="mcard" style={{ background: "#fff7e8", color: "#b7791f", fontSize: 12.5, lineHeight: 1.8 }}>
          到货点验与发货单存在差异，请<b>尽快上传凭证</b>；提交后由总部（租户）审核，审核通过后按「谁发货谁补发」补发。
        </div>
      ) : (
        <div className="mcard" style={{ background: "#f5f7f8", color: "#666", fontSize: 12.5, lineHeight: 1.8 }}>
          {["待总部审核", "待供应商审核"].includes(row.status) ? "凭证已提交，等待总部（租户）审核。"
            : ["待补发", "补发中"].includes(row.status) ? `总部审核已通过，补发由${row.shipper}按链路执行${row.makeup ? `（补发单 ${row.makeup}）` : ""}。`
              : row.status === "补发完成" ? "补发已完成，本差异单闭环。"
                : row.status === "审核不通过" ? "总部审核不通过，本差异单不再补发，如有疑问请联系总部。"
                  : "本差异单已关闭。"}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, paddingBottom: 16 }}>
        <button className="btn plain" style={{ flex: 1 }} onClick={onBack}>返回</button>
        {row.status === "待举证" && <button className="btn primary" style={{ flex: 2 }} onClick={onEvidence}>去举证</button>}
      </div>
    </div>
  );
}

/* ---------------- 举证信息 ---------------- */
function Evidence({ card, onBack, onSubmitted }) {
  const docs = [...supplyStore.use(), ...supplierStore.use()];
  const [reasons, setReasons] = useState(["少货"]);
  const [note, setNote] = useState("");
  const [photos, setPhotos] = useState(0);
  const [done, setDone] = useState(false);
  if (!card) return null;
  return (
    <div className="mpad">
      <div className="mcard">
        <div className="hd"><b>配货差异单 {card.id}</b><span style={{ color: done ? "#2f80ed" : "#f5a623", fontSize: 12.5 }}>{done ? "待审核" : "待举证"}</span></div>
        <div className="mrow"><span>来源链路</span><b>{card.leg}</b></div>
        <div className="mrow"><span>关联供货单</span><b className="mono">{card.supplyNo}</b></div>
        <div className="mrow"><span>发货方</span><b>{card.shipper}（补发责任方）</b></div>
      </div>

      <SrcDocBlock diff={card} docs={docs} />
      <DiffItemsBlock diff={card} docs={docs} />

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

      {done && <div className="mcard" style={{ background: "#eefbf8", color: "#25c7a5", textAlign: "center", fontSize: 12.5 }}>举证已提交，等待总部审核（租户后台差异单已转「待总部审核」）</div>}

      <div style={{ display: "flex", gap: 10, paddingBottom: 16 }}>
        <button className="btn plain" style={{ flex: 1 }} onClick={onBack}>取消</button>
        <button className="btn primary" style={{ flex: 2 }} disabled={done || !reasons.length || photos < 1}
          onClick={() => {
            /* 举证写回 diffStore：两端同一份数据，租户后台该单即时转「待总部审核」 */
            diffStore.set((ds) => ds.map((x) => (x.id === card.id ? { ...x, status: "待总部审核", evidence: `${reasons.join("、")} · 照片 ${photos} 张` } : x)));
            setDone(true);
            onSubmitted && onSubmitted();
          }}>提交</button>
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
            <div className="mrow"><span>申请时间</span><b className="mono">{r.createdAt}</b></div>
            <div className="mrow"><span>关联销售订单</span><b className="mono">{r.orderNo}</b></div>
            <div className="mrow"><span>关联供货单</span><b className="mono">{r.supplyNo}</b></div>
            <div className="mrow"><span>商品</span><b style={{ fontWeight: 400, textAlign: "right" }}>{r.emoji} {r.product}　{r.spec}</b></div>
            <div className="mrow"><span>退货数量</span><b>{r.qty} 件</b></div>
            <div className="mrow"><span>退货原因</span><b style={{ fontWeight: 400 }}>{r.reason}</b></div>
            <div className="mrow"><span>退回方</span><b>{r.returnTo}</b></div>
            <div className="mrow"><span>返厂路径</span><b style={{ fontWeight: 400, textAlign: "right" }}>{r.viaHq ? `门店 → 总部仓 → ${r.returnTo}` : `门店 → ${r.returnTo}`}</b></div>
            <div className="mrow"><span>退款状态</span><b style={{ fontWeight: 400, textAlign: "right", color: r.refunded ? "#25c7a5" : "#f5a623" }}>{r.refundNote}</b></div>
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
          <div className="hd"><b>退回地址</b><span className="note" style={{ fontSize: 11.5 }}>供应商售后地址</span></div>
          <AddrRows who={row.returnTo} />
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
