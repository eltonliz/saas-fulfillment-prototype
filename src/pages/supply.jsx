import React, { useState } from "react";
import { SUPPLY_DOCS } from "../data.js";
import { TrackDrawer, Confirm, useToast, useRowSelect, BatchBar } from "../ui.jsx";
import { supplyStore, supplierStore, diffStore, orderStore, patchDoc, addDiff, ARRIVAL_TIMEOUT_DAYS } from "../store.js";

const LEG_LABEL = {
  sup_consumer: "供应商 → 消费者",
  supplier_to_hq: "供应商 → 总仓",
  supplier_inbound: "供应商 → 门店",
  hq_store: "总部仓 → 门店",
};
/* 总部 = 租户，门店也属于同一租户 —— 权限一致，本租户的供货单一律可见。
   只有「供应商 → 消费者（一件代发）」是供应商独占的，租户侧不显示。
   另：「总部仓 → 消费者」不是供货单 —— 消费者那一跳由订单管理的「发货」完成，
   故发货管理只承载到内部主体（总仓 / 门店）为止的供货单。 */
const TENANT_LEGS = ["supplier_to_hq", "supplier_inbound", "hq_store"];
const RECEIVE_LEGS = ["supplier_to_hq", "supplier_inbound", "hq_store"];
const isTenantLeg = (d) => TENANT_LEGS.includes(d.leg);
const isSelfShip = (d) => d.leg === "hq_store";
/* F3/F4：总部仓直配的下游段，必须等同一订单「供应商→总仓」那段确认收货后才可发货 */
const upstreamReady = (d) => {
  if (d.leg !== "hq_store") return true;
  const up = supplyStore.get().find((x) => x.leg === "supplier_to_hq" && x.orderNo === d.orderNo);
  return !up || up.status === "已收货";
};
const awaitHqReceive = (d) => isSelfShip(d) && ["待发货", "部分收货"].includes(d.status) && !upstreamReady(d);
const canShip = (d) => isSelfShip(d) && ["待发货", "部分收货"].includes(d.status) && upstreamReady(d);
const awaitSupShip = (d) => !isSelfShip(d) && ["待发货", "部分收货"].includes(d.status);
const canReceive = (d) => ["已发货", "部分收货"].includes(d.status);

/* ============================================================================
   收货提交：数量定状态（决策 3）、异常定差异单（决策 1）、举证并入收货（决策 4）、
   补发闭环终态（决策 5）、预留库存回写字段（决策 6）
   ============================================================================ */
function applyReceive(doc, p) {
  const recv = (doc.received ?? 0) + p.got;
  const full = recv >= doc.qty;
  const status = p.result === "收货异常" ? "收货异常" : full ? "已收货" : "部分收货";

  patchDoc(doc.id, {
    received: recv,
    status,
    /* 决策 6：本期不落到可售库存，但预留字段与 payload，第二版接「存」时直接消费 */
    stockWriteback: { qty: p.got, to: doc.receiver, written: false, note: "第二版接「存」后回写可售库存" },
  });

  if (p.result === "收货异常") {
    /* 决策 5：补发单再出问题 → 只记异常标记，不再开新差异单，转线下 */
    if (doc.isMakeup) {
      patchDoc(doc.id, { makeupAnomaly: true });
      return `补发单 ${doc.id} 记收货异常标记（不再开新差异单，转线下处理）`;
    }
    const d = new Date();
    const ymd = String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0");
    addDiff({
      id: "DIFF" + ymd + String(diffStore.get().length + 1).padStart(4, "0"),
      source: "总部上报", leg: LEG_LABEL[doc.leg], reporter: "总部",
      supplyNo: doc.id, shipper: doc.shipper,
      summary: `${doc.product} 应收${doc.qty}/实收${recv}｜${p.reason}`,
      status: "待总部审核",              /* 决策 4：举证已在收货时完成，跳过「待举证」 */
      evidence: `${p.reason} · 照片 ${p.photos} 张`,
      note: p.note,
    });
    return `供货单 ${doc.id} 已记收货异常，差异单直接进入「待总部审核」（举证已在收货时完成）`;
  }

  /* 决策 5：补发单收满 → 原供货单同步结案 + 差异单转「补发完成」 */
  if (doc.isMakeup && full && doc.reshipOf) {
    const diff = diffStore.get().find((x) => x.id === doc.reshipOf);
    const src = diff?.supplyNo ? supplyStore.get().find((x) => x.id === diff.supplyNo) : null;
    if (src) patchDoc(src.id, { status: "已收货", received: src.qty });
    diffStore.set((ds) => ds.map((x) => (x.id === doc.reshipOf ? { ...x, status: "补发完成" } : x)));
    return `补发单 ${doc.id} 已收货，原供货单 ${diff?.supplyNo || ""} 同步结案，差异单转「补发完成」`;
  }

  /* R4/R5：收满且收货主体是门店 → 关联自提订单提货码激活（与 G2② 自动确认同口径） */
  if (full && ["supplier_inbound", "hq_store"].includes(doc.leg)) {
    orderStore.set((os) => os.map((o) => ((o.supplyNo === doc.id || o.no === doc.orderNo) ? { ...o, pickupReady: true } : o)));
  }
  return full ? `供货单 ${doc.id} 已收货` : `供货单 ${doc.id} 部分收货，待补 ${doc.qty - recv} 件`;
}

const Thumb = ({ d }) => (
  <div className="prod-cell">
    <span className="thumb" style={{ background: "#f4f7f6" }}>{d.emoji}</span>
    <div><div>{d.product}</div><small>{d.spec}</small></div>
  </div>
);

function DocTable({ rows, tab, setTab, tabs, mode, onOpen, onBatch }) {
  const list = rows.filter((d) => (tab === "全部" ? true : d.status === tab));
  const { sel, allSel, toggleAll, toggleOne } = useRowSelect(list.map((d) => d.id));
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
            {list.map((d) => (
              <tr key={d.id}>
                <td><input type="checkbox" checked={sel.has(d.id)} onChange={() => toggleOne(d.id)} /></td>
                <td className="tw mono">{d.id}</td>
                <td className="tw">{d.source || "订单支付自动生成"}<small className="mono">{d.createdAt}</small>
                  {d.isMakeup && <small style={{ color: "#f5a623" }}>补发单 · 源差异单 {d.reshipOf}</small>}</td>
                <td className="tw mono">{d.orderNo}</td>
                <td><Thumb d={d} /></td>
                <td className="tw">{LEG_LABEL[d.leg]}</td>
                <td className="tw">{d.shipper}</td>
                <td>{d.receiver}<small>{d.receiverAddr}</small></td>
                <td className="tw mono">{d.qty}/{d.sent}
                  {d.status === "部分收货" && <small style={{ color: "#f5a623" }}>已收 {d.received ?? 0}｜待补 {d.qty - (d.received ?? 0)} 件</small>}
                  {d.status === "收货异常" && !d.makeupAnomaly && <small style={{ color: "#f5522e" }}>实收 {d.received ?? 0}｜差 {Math.max(0, d.qty - (d.received ?? 0))} 件</small>}
                  {d.makeupAnomaly && <small style={{ color: "#f5522e" }}>补发仍有异常 · 转线下</small>}
                </td>
                <td className="tw mono">{d.tracking ? <>{d.carrier}<small>{d.tracking}</small></> : "-"}</td>
                <td className="tw">{d.track ? <span onClick={() => onOpen("track", d)} style={{ color: "#25c7a5", cursor: "pointer" }}>查看物流轨迹</span> : "-"}</td>
                <td className="tw">
                  <span className={`tag ${d.status === "待发货" ? "warn" : d.status === "已发货" ? "blue" : d.status === "收货异常" ? "danger" : ""}`}>{d.status}</span>
                  {d.autoConfirmed && <small style={{ color: "#2f80ed" }}>系统自动确认</small>}
                </td>
                <td>
                  <div className="op-col">
                    <button className="gray" onClick={() => onOpen("detail", d)}>详情</button>
                    {mode === "ship" && canShip(d) && <button onClick={() => onOpen("ship", d)}>发货</button>}
                    {mode === "ship" && awaitSupShip(d) && <span style={{ color: "#bbb", fontSize: 14, height: 22 }}>由供应商发货</span>}
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
    </>
  );
}

/* ============================ 供货发货 ============================ */
export function SupplyDispatch() {
  const [tab, setTab] = useState("全部");
  const [modal, setModal] = useState(null);
  const [batch, setBatch] = useState(null);
  const [toast, tip] = useToast();
  const docs = supplyStore.use();
  const rows = docs.filter(isTenantLeg);
  const pending = rows.filter((d) => canShip(d)).length;
  const canShipRows = rows.filter(canShip);

  return (
    <>
      <div className="filters">
        <div className="row">
          <div className="field"><label>供货路径</label>
            <select className="ctl" defaultValue=""><option value="">请选择供货路径</option><option>供应商 → 总仓</option><option>供应商 → 门店</option><option>总部仓 → 门店</option></select>
          </div>
          <div className="field"><label>供货单号</label><input className="ctl w-lg" placeholder="供货单号/销售订单/收货主体" /></div>
          <div className="actions"><button className="btn primary">查询</button><button className="btn">重置</button></div>
        </div>
      </div>

      <div className="alert">
        <span className="ic">i</span>您有 <b style={{ margin: "0 4px" }}>{pending}</b> 笔待发货供货单
      </div>

      <DocTable rows={rows} tab={tab} setTab={setTab} tabs={["全部", "待发货", "已发货", "部分收货", "收货异常", "已收货"]} mode="ship" onOpen={(k, d) => setModal({ k, d })} onBatch={setBatch} />

      {modal?.k === "ship" && <ShipDrawer doc={modal.d} onClose={() => setModal(null)} onDone={(p) => { tip(applyShip(modal.d, p)); setModal(null); }} />}
      {modal?.k === "receive" && <ReceiveDrawer doc={modal.d} onClose={() => setModal(null)} onDone={(p) => { tip(applyReceive(modal.d, p)); setModal(null); }} />}
      {modal?.k === "detail" && <DocDetailDrawer doc={modal.d} onClose={() => setModal(null)} />}
      {modal?.k === "track" && <TrackDrawer doc={modal.d} onClose={() => setModal(null)} />}
      {toast}
      {batch === "template" && <TemplateDrawer onClose={() => setBatch(null)} />}
      {batch === "import" && <ImportDrawer rows={canShipRows} onClose={() => setBatch(null)} onDone={(items) => tip(`已导入发货 ${applyShipBatch(items)} 单`)} />}
      {batch === "batch" && <BatchShipDrawer rows={canShipRows} onClose={() => setBatch(null)} onDone={(items) => tip(`已批量发货 ${applyShipBatch(items)} 单`)} />}
    </>
  );
}

/* ============================ 供货收货 ============================ */
export function SupplyReceipt() {
  const [tab, setTab] = useState("全部");
  const [modal, setModal] = useState(null);
  const [toast, tip] = useToast();
  const docs = supplyStore.use();
  const rows = docs.filter((d) => RECEIVE_LEGS.includes(d.leg));
  const autoList = rows.filter((d) => d.autoConfirmed);

  return (
    <>
      <div className="alert">
        <span className="ic">i</span>确认内部供货到货
      </div>
      {autoList.length > 0 && (
        <div className="alert" style={{ background: "#eef4ff", color: "#1f5fbf" }}>
          <span className="ic" style={{ background: "#2f80ed" }}>i</span>
          系统已自动确认 <b style={{ margin: "0 4px" }}>{autoList.length}</b> 笔超时到货（到店超过 {ARRIVAL_TIMEOUT_DAYS} 天门店未点「确认到货」）
          —— 对应的自提订单<b style={{ margin: "0 4px" }}>提货码已随之激活</b>
        </div>
      )}
      <DocTable rows={rows} tab={tab} setTab={setTab} tabs={["全部", "已发货", "部分收货", "已收货", "收货异常"]} mode="receive" onOpen={(k, d) => setModal({ k, d })} />

      {modal?.k === "receive" && <ReceiveDrawer doc={modal.d} onClose={() => setModal(null)} onDone={(p) => { tip(applyReceive(modal.d, p)); setModal(null); }} />}
      {modal?.k === "ship" && <ShipDrawer doc={modal.d} onClose={() => setModal(null)} onDone={(p) => { tip(applyShip(modal.d, p)); setModal(null); }} />}
      {modal?.k === "detail" && <DocDetailDrawer doc={modal.d} onClose={() => setModal(null)} />}
      {modal?.k === "track" && <TrackDrawer doc={modal.d} onClose={() => setModal(null)} />}
      {toast}
    </>
  );
}

/* ============================ 配送差异 ============================ */
export function SupplyDiff() {
  const [source, setSource] = useState("总部上报");
  const rows = diffStore.use();
  const setRows = diffStore.set;
  const [detail, setDetail] = useState(null);
  const [pass, setPass] = useState(null);
  const [toast, tip] = useToast();
  const list = rows.filter((d) => d.source === source);

  return (
    <>
      <div className="filters">
        <div className="row">
          <div className="field">
            <span className="portal-sw">
              {["总部上报", "门店上报"].map((s) => (
                <button key={s} className={source === s ? "on" : ""} onClick={() => setSource(s)}>{s}</button>
              ))}
            </span>
          </div>
          <div className="field"><label>差异单号 / 供货单号</label><input className="ctl w-lg" placeholder="请输入差异单号或供货单号" /></div>
          <div className="actions"><button className="btn primary">查询</button><button className="btn">重置</button></div>
        </div>
      </div>

      <div className="tbl-wrap">
        <table>
          <thead>
            <tr><th className="tw">差异单号</th><th className="tw">来源链路</th><th className="tw">上报方</th><th className="tw">关联供货单</th><th className="tw">发货方（补发责任）</th><th>差异摘要</th><th>举证信息</th><th className="tw">状态</th><th className="tw">操作</th></tr>
          </thead>
          <tbody>
            {list.map((d) => (
              <tr key={d.id}>
                <td className="tw mono">{d.id}</td>
                <td className="tw">{d.leg}</td>
                <td className="tw">{d.reporter}</td>
                <td className="tw mono">{d.supplyNo}</td>
                <td className="tw">{d.shipper}</td>
                <td>{d.summary}</td>
                <td className="tw">{d.evidence}</td>
                <td className="tw"><span className={`tag ${d.status === "待举证" ? "warn" : d.status === "待总部审核" ? "blue" : d.status === "补发中" || d.status === "补发完成" ? "" : "gray"}`}>{d.status}</span></td>
                <td className="tw">
                  <div className="op-col">
                    <button className="gray" onClick={() => setDetail(d)}>详情</button>
                    {d.status === "待总部审核" && <button onClick={() => setPass(d)}>审核</button>}
                  </div>
                </td>
              </tr>
            ))}
            {!list.length && <tr><td colSpan={9} style={{ textAlign: "center", padding: 40, color: "#999" }}>该来源下暂无差异单</td></tr>}
          </tbody>
        </table>
      </div>

      {toast}
      {detail && <DiffDetailDrawer row={detail} onClose={() => setDetail(null)} />}
      {pass && (
        <Confirm
          title="审核配送差异"
          text={`差异单 ${pass.id}：${pass.summary}。审核通过后将按「谁发货谁补发」自动生成补发供货单，由「${pass.shipper}」执行补发。是否通过？`}
          okText="审核通过"
          onOk={() => {
            /* 决策 5：审核通过 → 按「谁发货谁补发」生成补发供货单，进对应发货页 */
            const all = [...supplyStore.get(), ...supplierStore.get()];
            const orig = all.find((d) => d.id === pass.supplyNo);
            const dt = new Date();
            const ymd = String(dt.getFullYear()).slice(2) + String(dt.getMonth() + 1).padStart(2, "0") + String(dt.getDate()).padStart(2, "0");
            const used = new Set(all.map((d) => d.id));
            let seq = 1, reshipId = "FHD" + ymd + String(seq).padStart(4, "0");
            while (used.has(reshipId)) { seq += 1; reshipId = "FHD" + ymd + String(seq).padStart(4, "0"); }
            const doc = {
              id: reshipId, leg: orig?.leg || "hq_store", source: "配送差异补发",
              orderNo: orig?.orderNo || "—", product: orig?.product || "补发商品", spec: orig?.spec || "",
              emoji: orig?.emoji || "📦", qty: pass.diffQty ?? 1, sent: 0,
              shipper: pass.shipper, receiver: orig?.receiver || "—", receiverAddr: orig?.receiverAddr || "",
              carrier: "", tracking: "", track: "", status: "待发货", ops: ["详情", "发货"],
              isMakeup: true, reshipOf: pass.id,
            };
            /* 谁发货谁补发：供应商发起的链路推送供应商后台，总部仓链路留在发货管理 */
            if (doc.leg === "sup_consumer") supplierStore.set((ds) => [doc, ...ds]);
            else if (["supplier_to_hq", "supplier_inbound"].includes(doc.leg)) { supplyStore.set((ds) => [doc, ...ds]); supplierStore.set((ds) => [doc, ...ds]); }
            else supplyStore.set((ds) => [doc, ...ds]);
            setRows((rs) => rs.map((r) => (r.id === pass.id ? { ...r, status: "补发中", makeup: reshipId } : r)));
            tip(`差异单 ${pass.id} 审核通过，已生成补发供货单 ${reshipId}`);
            setPass(null);
          }}
          onCancel={() => setPass(null)}
        />
      )}
    </>
  );
}

/* ---------------- 配送差异详情 ---------------- */
function DiffDetailDrawer({ row, onClose }) {
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
              <div className="frow"><label>当前状态</label><div className="fc"><span className="tag warn">{row.status}</span></div></div>
              {row.makeup && <div className="frow"><label>补发供货单</label><div className="fc"><input className="mono" value={row.makeup} readOnly /></div></div>}
            </div>
          </section>

          <section className="card">
            <h3>处理口径</h3>
            <div className="cbody">
              <div className="note" style={{ padding: 10, lineHeight: 1.9 }}>
                审核由租户（总部）执行；供应商对差异<b>只读知情、执行补发，不参与钱款</b>（已明确否决两级审核）。
                审核通过后按「<b>谁发货谁补发</b>」自动生成补发供货单。
              </div>
            </div>
          </section>
        </div>
        <div className="foot"><button className="btn plain" onClick={onClose}>关闭</button></div>
      </div>
    </div>
  );
}

/* ============================ 发货弹窗（版式与真实 SaaS「发货」弹窗一致） ============================ */
function ShipDrawer({ doc, onClose, onDone }) {
  /* 决策 2：部分收货后由原发货方补齐，可发数量 = 未收满的差额，而不是「未发数量」 */
  const remain = doc.status === "部分收货" ? doc.qty - (doc.received ?? 0) : doc.qty - doc.sent;
  const [qty, setQty] = useState(Math.max(1, remain));
  const [tracking, setTracking] = useState("");
  const [carrier, setCarrier] = useState("");
  const [addr, setAddr] = useState(0);
  const addresses = [
    { name: "九天教育总仓", phone: "13300000000", addr: "广州市天河区科韵路 16 号" },
    { name: "九天门店", phone: "18100000003", addr: "广东省广州市荔湾区宝华路 76 号" },
  ];

  return (
    <div className="drawer-mask" style={{ justifyContent: "center", alignItems: "center" }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="drawer" style={{ width: 780, height: "auto", maxHeight: "88vh", borderRadius: 4 }}>
        <header>发货<button className="x" onClick={onClose}>×</button></header>
        <div className="body">
          <table className="tbl-tight">
            <thead>
              <tr>
                <th style={{ width: 40 }}><input type="checkbox" /></th>
                <th>商品信息</th><th className="tw">单价(元)</th><th className="tw">数量/单位</th>
                <th className="tw">未发货数量</th><th className="tw">发货数量</th><th className="tw">发货状态</th><th className="tw">运单号</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><input type="checkbox" /></td>
                <td><Thumb d={doc} /></td>
                <td className="tw">￥0.01</td>
                <td className="tw">{doc.qty}</td>
                <td className="tw mono">{remain}</td>
                <td className="tw">
                  <span style={{ display: "inline-flex", alignItems: "center", border: "1px solid #e5e5e5", borderRadius: 3, height: 30 }}>
                    <span style={{ padding: "0 8px", color: "#999", fontSize: 12.5, borderRight: "1px solid #e5e5e5", lineHeight: "28px" }}>发货数</span>
                    <button className="btn" style={{ width: 28, height: 28, padding: 0, background: "transparent" }} onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
                    <input value={qty} onChange={(e) => setQty(Number(e.target.value.replace(/\D/g, "")) || 0)} style={{ width: 44, height: 28, border: 0, textAlign: "center", padding: 0 }} />
                    <button className="btn" style={{ width: 28, height: 28, padding: 0, background: "transparent" }} onClick={() => setQty((q) => Math.min(remain, q + 1))}>＋</button>
                  </span>
                </td>
                <td className="tw">{doc.status}</td>
                <td className="tw"><input placeholder="请输入" style={{ height: 30 }} /></td>
              </tr>
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
            <button className="btn link" style={{ marginLeft: "auto" }}>+ 添加地址</button>
          </div>
          <table className="tbl-tight">
            <thead><tr><th style={{ width: 36 }}></th><th className="tw">联系人</th><th className="tw">联系方式</th><th>地址</th></tr></thead>
            <tbody>
              {addresses.map((a, i) => (
                <tr key={i}>
                  <td><input type="radio" checked={addr === i} onChange={() => setAddr(i)} /></td>
                  <td className="tw">{a.name} <span className="tag gray">默认</span></td>
                  <td className="tw mono">{a.phone}</td>
                  <td>{a.addr}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: "flex", gap: 40, marginTop: 22, alignItems: "center", fontSize: 13, color: "#666" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span>快递公司信息：<i className="req">*</i></span>
              <select className="ctl" value={carrier} onChange={(e) => setCarrier(e.target.value)} style={{ width: 220, height: 32 }}><option value="">请选择或搜索快递公司</option>
                {["顺丰速运", "圆通速递", "中通快递", "京东物流", "韵达快递", "极兔速递"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span>快递单号：<i className="req">*</i></span>
              <input className="ctl" style={{ width: 200, height: 32 }} placeholder="请输入快递单号" value={tracking} onChange={(e) => setTracking(e.target.value)} />
            </div>
          </div>

        </div>
        <div className="foot">
          <button className="btn plain" onClick={onClose}>取消</button>
          <button className="btn primary" onClick={() => onDone({ qty, carrier, tracking: tracking.trim() })}>确定</button>
        </div>
      </div>
    </div>
  );
}

/* 发货提交：写回 sent / 物流，部分发货保持可再发（F6） */
function applyShip(doc, p) {
  const sent = (doc.sent ?? 0) + p.qty;
  patchDoc(doc.id, {
    sent,
    carrier: p.carrier || doc.carrier,
    tracking: p.tracking || doc.tracking,
    track: "已发货 " + new Date().toISOString().slice(0, 19).replace("T", " "),
    status: "已发货",
  });
  return `供货单 ${doc.id} 已发货 ${p.qty} 件` + (sent < doc.qty ? `，剩余 ${doc.qty - sent} 件可再发` : "");
}

/* 批量 / 导入发货共用：逐单写入。数量口径与单笔发货一致（F6 / 决策2：部分收货按未收满的差额） */
export function applyShipBatch(items) {
  items.forEach(({ doc, carrier, tracking }) => {
    const remain = doc.status === "部分收货" ? doc.qty - (doc.received ?? 0) : doc.qty - (doc.sent ?? 0);
    applyShip(doc, { qty: Math.max(0, remain), carrier, tracking });
  });
  return items.length;
}

/* ============================ 收货抽屉（累计实收 F9 / R2 / R3） ============================ */
function ReceiveDrawer({ doc, onClose, onDone }) {
  const recv = doc.received ?? 0;
  const remain = doc.qty - recv;
  const [got, setGot] = useState(remain);
  const [hasIssue, setHasIssue] = useState(false);   // 决策 1：异常独立成维度，不再和数量挤在一个单选里
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [photos, setPhotos] = useState(0);

  /* 决策 3：收货结果由数量【强判】，人工不可覆盖 */
  const derived = got >= remain ? "正常收货" : "部分收货";
  /* 决策 4：举证并入收货环节——异常说明与照片在这里就要齐 */
  const issueComplete = reason && note.trim() && photos > 0;
  const result = hasIssue ? "收货异常" : derived;
  const canSubmit = !hasIssue || issueComplete;

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
            <span className="ic">i</span>已累计收到 <b style={{ margin: "0 4px" }}>{recv}</b> 件，本次还能收 <b style={{ margin: "0 4px" }}>{remain}</b> 件
          </div>

          <table>
            <thead><tr><th>商品</th><th className="tw">应收</th><th className="tw">已累计收</th><th className="tw">本次实收</th></tr></thead>
            <tbody>
              <tr>
                <td><Thumb d={doc} /></td>
                <td className="tw mono">{doc.qty}</td>
                <td className="tw mono">{recv}</td>
                <td>
                  <div className="qty">
                    <button className="btn plain sm" onClick={() => setGot((g) => Math.max(0, g - 1))}>−</button>
                    <input value={got} onChange={(e) => setGot(Math.min(remain, Number(e.target.value.replace(/\D/g, "")) || 0))} style={{ width: 64, textAlign: "center" }} />
                    <button className="btn plain sm" onClick={() => setGot((g) => Math.min(remain, g + 1))}>＋</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* 决策 3：系统按数量强判，只读展示 */}
          <div className="frow" style={{ marginTop: 18 }}>
            <label>收货结果</label>
            <div className="fc">
              <span className="hl" data-hl="系统强判" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span className={`tag ${result === "正常收货" ? "" : result === "部分收货" ? "warn" : "danger"}`}>{result}</span>
                <span className="note" style={{ display: "inline" }}>
                  由「本次实收 vs 剩余应收」自动判定，不可人工修改
                  {result === "部分收货" && `：已收 ${recv + got} / 应收 ${doc.qty}，待补 ${doc.qty - recv - got} 件`}
                </span>
              </span>
            </div>
          </div>

          {/* 决策 4：异常独立维度，勾选即开差异单，且举证必须当场完成 */}
          <div className="frow">
            <label>到货异常</label>
            <div className="fc">
              <div className="radio-row">
                <label><input type="radio" checked={!hasIssue} onChange={() => setHasIssue(false)} />无异常</label>
                <label><input type="radio" checked={hasIssue} onChange={() => setHasIssue(true)} />有异常（破损 / 错货 / 少货）</label>
              </div>
            </div>
          </div>

          {hasIssue && (
            <>
              <div className="frow">
                <label><i>*</i>异常类型</label>
                <div className="fc">
                  <div className="radio-row">
                    {["破损", "错货", "少货"].map((r) => (
                      <label key={r}><input type="radio" checked={reason === r} onChange={() => setReason(r)} />{r}</label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="frow">
                <label><i>*</i>异常说明</label>
                <div className="fc">
                  <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="请描述到货实际情况（必填）" />
                </div>
              </div>
              <div className="frow">
                <label><i>*</i>举证照片</label>
                <div className="fc">
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <div className="upload-box" onClick={() => setPhotos((p) => Math.min(5, p + 1))} style={{ cursor: "pointer" }}>
                      ＋<br /><span style={{ fontSize: 12 }}>添加照片</span>
                    </div>
                    {Array.from({ length: photos }, (_, i) => (
                      <span key={i} style={{ width: 62, height: 62, display: "grid", placeItems: "center", background: "#e8ecef", borderRadius: 4 }}>🧾</span>
                    ))}
                  </div>
                  <div className="note">最多 5 张；<b>举证在收货环节一次完成</b>，事后不再补传，所以本单直接进「待总部审核」，不走「待举证」。</div>
                </div>
              </div>
            </>
          )}

        </div>
        <div className="foot">
          <button className="btn plain" onClick={onClose}>取消</button>
          <button className="btn primary" disabled={!canSubmit}
            onClick={() => onDone({ got, result, reason, note: note.trim(), photos })}>确认收货</button>
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
  { k: "qty", t: "应发数量", locked: true },
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
  const rows = rowsProp || SUPPLY_DOCS.filter(isTenantLeg).filter(canShip);
  const [downloaded, setDownloaded] = useState(false);
  return (
    <div className="drawer-mask" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="drawer" style={{ width: 1080 }}>
        <header>下载发货模板<button className="x" onClick={onClose}>×</button></header>
        <div className="body">
          <div className="alert">
            <span className="ic">i</span>模板已按待发货供货单预填好——<b style={{ margin: "0 4px" }}>灰色列是锁定列，禁止修改</b>；只需填「快递公司」和「物流单号」两列。
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
              <div className="alert"><span className="ic">i</span>先下载模板：已按待发货供货单预填好，<b style={{ margin: "0 4px" }}>锁定列不可修改</b>，只需填「快递公司」和「物流单号」。</div>
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
          <div className="alert"><span className="ic">i</span>批量发货要求<b style={{ margin: "0 4px" }}>同一发货方 + 同一收货人 + 同一收货地址</b>，不符合的会被拦下。</div>
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
                  <td className="tw">{d.emoji} {d.product}</td><td className="tw mono">{d.qty}</td>
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
            <div>凭证：{diff.evidence && diff.evidence !== "—" ? diff.evidence : diff.status === "待举证" ? "收货方待举证" : "—"}</div>
            <div>关联差异单：<span className="mono">{diff.id}</span>　<span className="tag danger">{diff.status}</span>{diff.makeup && <>　补发单 <span className="mono">{diff.makeup}</span></>}</div>
          </>
        ) : (
          <div>异常情况：<b>补发单收货异常（实收 {doc.received ?? 0} / 应发 {doc.qty} 件）</b>{doc.reshipOf && <>　源差异单 <span className="mono">{doc.reshipOf}</span></>}</div>
        )}
        <div>处理流程：{diff ? "差异审核由总部执行；" : "按规则补发单不再新开差异单，转线下处理；"}{ro ? "供应商只读知情，" : ""}审核通过后生成补发任务，由原发货方补发。</div>
      </div>
    </>
  );
}

function DocDetailDrawer({ doc, onClose }) {
  return (
    <div className="drawer-mask" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="drawer" style={{ width: 720 }}>
        <header>供货单详情<button className="x" onClick={onClose}>×</button></header>
        <div className="body">
          <div className="filters" style={{ marginBottom: 14 }}>
            <div className="row" style={{ gap: 30 }}>
              <div className="field"><label>供货单号</label><b className="mono">{doc.id}</b></div>
              <div className="field"><label>供货路径</label><b>{LEG_LABEL[doc.leg]}</b></div>
              <div className="field"><label>供货状态</label><span className={`tag ${doc.status === "收货异常" ? "danger" : ""}`}>{doc.status}</span></div>
            </div>
            <div className="row" style={{ gap: 30 }}>
              <div className="field"><label>发货主体</label><b>{doc.shipper}</b></div>
              <div className="field"><label>收货主体</label><b>{doc.receiver}</b></div>
            </div>
            <div className="row"><div className="field"><label>收货地址</label><span>{doc.receiverAddr}</span></div></div>
          </div>

          {doc.status === "收货异常" && <ReceiveAbnormal doc={doc} />}

          <h3 style={{ fontSize: 14, margin: "0 0 10px", borderLeft: "3px solid #25c7a5", paddingLeft: 9 }}>供货商品明细</h3>
          <table>
            <thead><tr><th>商品</th><th className="tw">应发数量</th><th className="tw">已发数量</th><th className="tw">累计实收</th></tr></thead>
            <tbody><tr><td><Thumb d={doc} /></td><td className="tw mono">{doc.qty}</td><td className="tw mono">{doc.sent}</td><td className="tw mono">{doc.received ?? 0}</td></tr></tbody>
          </table>

          <h3 style={{ fontSize: 14, margin: "18px 0 10px", borderLeft: "3px solid #25c7a5", paddingLeft: 9 }}>供货物流</h3>
          {doc.tracking ? (
            <div className="filters">
              <div className="row" style={{ gap: 30 }}>
                <div className="field"><label>快递公司</label><b>{doc.carrier}</b></div>
                <div className="field"><label>物流单号</label><b className="mono">{doc.tracking}</b></div>
              </div>
              <div className="row"><div className="field"><label>最新物流状态</label><span>{doc.track}</span></div></div>
            </div>
          ) : <div className="note">尚未发货，暂无物流信息</div>}

          {/* 决策 6：本期不回写可售库存，但收货时已留下待回写字段，第二版直接消费 */}
          <h3 style={{ fontSize: 14, margin: "18px 0 10px", borderLeft: "3px solid #25c7a5", paddingLeft: 9 }}>库存回写（本期预留）</h3>
          {doc.stockWriteback ? (
            <div className="filters">
              <div className="row" style={{ gap: 30 }}>
                <div className="field"><label>本次实收</label><b className="mono">{doc.stockWriteback.qty}</b></div>
                <div className="field"><label>回写目标</label><b>{doc.stockWriteback.to}</b></div>
                <div className="field"><label>已回写</label><span className="tag gray">{doc.stockWriteback.written ? "是" : "否（本期不写）"}</span></div>
              </div>
            </div>
          ) : (
            <div className="note">{["已收货", "部分收货", "收货异常"].includes(doc.status) ? "本期收货不落可售库存，该单无待回写记录。" : "该单尚未收货，暂无待回写记录。"}</div>
          )}
          <div className="note" style={{ marginBottom: 12 }}>
            本期「只做销」：收货<b>不产生仓库库存</b>，这批实收也不会落到宿主商品的可售库存上。
            卡片里这条记录是<b>留给第二版接「存」时的回写凭证</b>——届时直接消费即可，不必回头改供货链路。
          </div>

        </div>
        <div className="foot"><button className="btn plain" onClick={onClose}>关闭</button></div>
      </div>
    </div>
  );
}
