import React, { useState } from "react";
import { TemplateDrawer, ImportDrawer, BatchShipDrawer, applyShipBatch } from "./supply.jsx";
import { TrackDrawer, useToast, Confirm, useRowSelect, BatchBar } from "../ui.jsx";
import { supplierStore, diffStore, patchDoc } from "../store.js";

const LEG_LABEL = {
  sup_consumer: "供应商 → 消费者",
  supplier_to_hq: "供应商 → 总仓",
  supplier_inbound: "供应商 → 门店",
};
const CARRIERS = ["顺丰速运", "圆通速递", "中通快递", "京东物流", "韵达快递", "极兔速递"];

/* ---------------- 供应商供货任务列表（三个页面共用，含发货/详情/物流轨迹） ---------------- */
export function SupTasks({ leg, title, desc }) {
  const [tab, setTab] = useState("全部");
  const [modal, setModal] = useState(null);
  const [batch, setBatch] = useState(null);
  const [toast, tip] = useToast();
  const docs = supplierStore.use();
  const mine = docs.filter((d) => d.leg === leg);
  const list = mine.filter((d) => (tab === "全部" ? true : d.status === tab));
  const { sel, allSel, toggleAll, toggleOne } = useRowSelect(list.map((d) => d.id));
  const pending = mine.filter((d) => d.status === "待发货").length;
  const canShipRows = mine.filter((d) => d.status === "待发货");
  /* 一件代发到消费者，没有「收货」环节；发总仓 / 发门店 才有 */
  const TABS = leg === "sup_consumer"
    ? ["全部", "待发货", "已发货", "已签收"]
    : ["全部", "待发货", "已发货", "部分收货", "已收货", "收货异常"];

  return (
    <>
      <div className="alert"><span className="ic">i</span>{desc}</div>
      {pending > 0 && (
        <div className="alert" style={{ background: "#fff7e8", color: "#b7791f" }}>
          <span className="ic" style={{ background: "#f5a623" }}>i</span>
          您有 <b style={{ margin: "0 4px" }}>{pending}</b> 笔待发货任务
        </div>
      )}

      <div className="pills">
        {TABS.map((t) => (
          <span key={t} className={`pill ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>{t}</span>
        ))}
      </div>
      <BatchBar allSel={allSel} toggleAll={toggleAll} count={sel.size}>
        <button className="act" onClick={() => setBatch("batch")}>批量发货</button>
        <button className="act" onClick={() => setBatch("import")}>导入发货</button>
        <button className="act" onClick={() => setBatch("template")}>下载发货模板</button>
      </BatchBar>

      <div className="tbl-wrap">
        <table className="tbl-tight">
          <thead>
            <tr>
              <th style={{ width: 36 }}><input type="checkbox" checked={allSel} onChange={toggleAll} /></th>
              <th className="tw">供货单号</th><th className="tw">关联销售订单</th><th>商品</th>
              <th className="tw">供货路径</th><th>收货主体</th><th className="tw">应发/已发</th>
              <th className="tw">快递公司/物流单号</th><th className="tw">供货状态</th><th style={{ minWidth: 92 }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {list.map((d) => (
              <tr key={d.id}>
                <td><input type="checkbox" checked={sel.has(d.id)} onChange={() => toggleOne(d.id)} /></td>
                <td className="tw mono">
                  {d.id}
                  {d.isMakeup && <small style={{ color: "#f5a623" }}>补发单 · 源差异单 {d.reshipOf}</small>}
                </td>
                <td className="tw mono">{d.orderNo}</td>
                <td>
                  <div className="prod-cell">
                    <span className="thumb" style={{ background: "#f4f7f6" }}>{d.emoji}</span>
                    <div><div>{d.product}</div><small>{d.spec}</small></div>
                  </div>
                </td>
                <td className="tw">{LEG_LABEL[d.leg]}</td>
                <td>{d.receiver}<small>{d.receiverAddr}</small></td>
                <td className="tw mono">{d.qty}/{d.sent}
                  {d.status === "部分收货" && <small style={{ color: "#f5a623" }}>已收 {d.received ?? 0}｜待补 {d.qty - (d.received ?? 0)} 件</small>}
                </td>
                <td className="tw mono">{d.tracking ? <>{d.carrier}<small>{d.tracking}</small></> : "-"}</td>
                <td className="tw">
                  <span className={`tag ${d.status === "待发货" ? "warn" : d.status === "已发货" ? "blue" : d.status === "收货异常" ? "danger" : ""}`}>{d.status}</span>
                </td>
                <td>
                  <div className="op-col">
                    <button className="gray" onClick={() => setModal({ k: "detail", d })}>详情</button>
                    {["待发货", "部分收货"].includes(d.status) && <button onClick={() => setModal({ k: "ship", d })}>{d.status === "部分收货" ? "补发" : "发货"}</button>}
                    {d.tracking && <button className="gray" onClick={() => setModal({ k: "track", d })}>物流轨迹</button>}
                  </div>
                </td>
              </tr>
            ))}
            {!list.length && <tr><td colSpan={10} style={{ textAlign: "center", padding: 40, color: "#999" }}>暂无任务</td></tr>}
          </tbody>
        </table>
      </div>

      {modal?.k === "ship" && (
        <SupShipModal
          doc={modal.d}
          onClose={() => setModal(null)}
          onDone={(p) => {
            const sent = (modal.d.sent ?? 0) + p.qty;
            patchDoc(modal.d.id, {
              sent,
              tracking: p.tracking || modal.d.tracking,
              track: "已发货 " + new Date().toISOString().slice(0, 19).replace("T", " "),
              status: "已发货",
            });
            tip(`供货单 ${modal.d.id} 已发货 ${p.qty} 件` + (sent < modal.d.qty ? `，剩余 ${modal.d.qty - sent} 件可再发` : ""));
            setModal(null);
          }}
        />
      )}
      {modal?.k === "detail" && <SupDocDrawer doc={modal.d} onClose={() => setModal(null)} onTrack={() => setModal({ k: "track", d: modal.d })} />}
      {modal?.k === "track" && <TrackDrawer doc={modal.d} onClose={() => setModal(null)} />}
      {toast}
      {batch === "template" && <TemplateDrawer rows={canShipRows} onClose={() => setBatch(null)} />}
      {batch === "import" && <ImportDrawer rows={canShipRows} onClose={() => setBatch(null)} onDone={(items) => tip(`已导入发货 ${applyShipBatch(items)} 单`)} />}
      {batch === "batch" && <BatchShipDrawer rows={canShipRows} onClose={() => setBatch(null)} onDone={(items) => tip(`已批量发货 ${applyShipBatch(items)} 单`)} />}
    </>
  );
}

export const SupDirect = () => <SupTasks leg="sup_consumer" title="一件代发" desc="供应商直发消费者的订单" />;
export const SupToHq = () => <SupTasks leg="supplier_to_hq" title="发总部仓" desc="供应商 → 总部仓供货任务" />;
export const SupToStore = () => <SupTasks leg="supplier_inbound" title="发门店" desc="供应商直配门店任务" />;

/* ---------------- 供应商发货弹窗（版式与真实 SaaS「发货」弹窗一致） ---------------- */
function SupShipModal({ doc, onClose, onDone }) {
  const [qty, setQty] = useState(Math.max(1, doc.status === "部分收货" ? doc.qty - (doc.received ?? 0) : doc.qty - doc.sent));
  const [tracking, setTracking] = useState("");
  const [addr, setAddr] = useState(0);
  const remain = doc.qty - doc.sent;
  const addresses = [
    { name: "JOJO供应商", phone: "18100010002", addr: "广东省广州市天河区科苑路 16 号" },
    { name: "文轩教育供应商", phone: "13700006600", addr: "广东省广州市天河区科韵路 16 号" },
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
                <td>
                  <div className="prod-cell">
                    <span className="thumb" style={{ background: "#f4f7f6" }}>{doc.emoji}</span>
                    <div><div>{doc.product}</div><small>{doc.spec}</small></div>
                  </div>
                </td>
                <td className="tw"><span className="tag gray">已脱敏</span></td>
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
                <td className="tw">未发货</td>
                <td className="tw"><input placeholder="请输入" style={{ height: 30 }} /></td>
              </tr>
            </tbody>
          </table>

          <h3 style={{ fontSize: 14, margin: "18px 0 8px" }}>收货人信息</h3>
          <div style={{ lineHeight: 2, display: "flex", gap: 60 }}>
            <div>
              <div>配送方式： {doc.tracking ? "快递发货" : "快递发货"}</div>
              <div>收货人电话： {doc.leg === "sup_consumer" ? "13979554185" : "—"}</div>
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
              <select className="ctl" defaultValue="" style={{ width: 220, height: 32 }}><option value="">请选择或搜索快递公司</option>
                {CARRIERS.map((c) => <option key={c}>{c}</option>)}
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
          <button className="btn primary" onClick={() => onDone({ qty, tracking: tracking.trim() })}>确定</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- 供货单详情抽屉 ---------------- */
function SupDocDrawer({ doc, onClose, onTrack }) {
  return (
    <div className="drawer-mask" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="drawer" style={{ width: 640 }}>
        <header>供货单详情<button className="x" onClick={onClose}>×</button></header>
        <div className="body">
          <div className="filters" style={{ marginBottom: 14 }}>
            <div className="row" style={{ gap: 30 }}>
              <div className="field"><label>供货单号</label><b className="mono">{doc.id}</b></div>
              <div className="field"><label>供货路径</label><b>{LEG_LABEL[doc.leg]}</b></div>
              <div className="field"><label>供货状态</label><span className="tag">{doc.status}</span></div>
            </div>
          </div>

          <h3 style={{ fontSize: 14, margin: "0 0 8px" }}>供货商品明细</h3>
          <table className="tbl-tight">
            <thead><tr><th>商品</th><th className="tw">应发数量</th><th className="tw">已发数量</th><th className="tw">累计实收</th></tr></thead>
            <tbody><tr>
              <td><div className="prod-cell"><span className="thumb" style={{ background: "#f4f7f6" }}>{doc.emoji}</span><div><div>{doc.product}</div><small>{doc.spec}</small></div></div></td>
              <td className="tw mono">{doc.qty}</td><td className="tw mono">{doc.sent}</td><td className="tw mono">{doc.received ?? 0}</td>
            </tr></tbody>
          </table>

          <h3 style={{ fontSize: 14, margin: "18px 0 8px" }}>收货信息</h3>
          <div style={{ lineHeight: 2 }}>
            <div>收货主体：{doc.receiver}</div>
            <div>收货地址：{doc.receiverAddr}</div>
          </div>

          <h3 style={{ fontSize: 14, margin: "18px 0 8px" }}>供货物流</h3>
          {doc.tracking ? (
            <div style={{ lineHeight: 2 }}>
              <div>快递公司：{doc.carrier}</div>
              <div>物流单号：<span className="mono">{doc.tracking}</span></div>
              <div>最新状态：{doc.track}</div>
              <button className="btn link" onClick={onTrack}>查看物流轨迹</button>
            </div>
          ) : <div className="note">尚未发货，暂无物流信息</div>}

        </div>
        <div className="foot"><button className="btn plain" onClick={onClose}>关闭</button></div>
      </div>
    </div>
  );
}

/* ---------------- 配送差异（供应商只读） ---------------- */
export function SupDiff() {
  const all = diffStore.use();
  const mine = all.filter((d) => d.shipper === "供应商003" || d.shipper === "JOJO供应商");
  return (
    <>
      <div className="alert"><span className="ic">i</span>供应商对差异单<b style={{ margin: "0 4px" }}>只读知情</b>，可查看差异原因、数量、凭证与审核结果，并执行补发任务</div>
      <div className="tbl-wrap">
        <table>
          <thead>
            <tr><th className="tw">差异单号</th><th className="tw">来源链路</th><th className="tw">关联供货单</th><th>差异摘要</th><th>异常原因 / 凭证</th><th className="tw">审核结果</th><th className="tw">状态</th><th className="tw">补发任务</th></tr>
          </thead>
          <tbody>
            {mine.map((d) => (
              <tr key={d.id}>
                <td className="tw mono">{d.id}</td>
                <td className="tw">{d.leg}</td>
                <td className="tw mono">{d.supplyNo}</td>
                <td>{d.summary}</td>
                <td className="tw">{d.evidence}</td>
                <td className="tw">{d.status === "补发中" ? <span className="tag">已通过</span> : <span style={{ color: "#999" }}>—</span>}</td>
                <td className="tw"><span className={`tag ${d.status === "待举证" ? "warn" : d.status === "待总部审核" ? "blue" : ""}`}>{d.status}</span></td>
                <td className="tw">{d.makeup ? <span className="mono" style={{ color: "#25c7a5" }}>{d.makeup}</span> : <span style={{ color: "#999" }}>—</span>}</td>
              </tr>
            ))}
            {!mine.length && <tr><td colSpan={8} style={{ textAlign: "center", padding: 40, color: "#999" }}>暂无涉己差异单</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ---------------- 售后处理（一件代发：供应商审核收货 + 验收/拒收） ---------------- */
const STEPS = ["待商家处理", "待买家退货", "待商家收货", "待验收", "待商家退款", "已完成"];
const AS_ROWS = [
  { no: "AS2609180001", orderNo: "ORD260916000145", product: "什锦果蔬", spec: "礼盒装", emoji: "🧺", way: "退货退款", reason: "不想要了", status: "待商家收货", step: 2, returnNo: "SF1234567890" },
  { no: "AS2609170003", orderNo: "ORD260915000121", product: "苹果", spec: "红富士 / 5 斤装", emoji: "🍎", way: "仅退款", reason: "拍错/多拍", status: "待商家处理", step: 0, returnNo: "" },
];

export function SupAfterSales() {
  const [target, setTarget] = useState(null);
  const [detail, setDetail] = useState(null);
  return (
    <>
      <div className="alert"><span className="ic">i</span>一件代发退货审核与验收由<b style={{ margin: "0 4px" }}>供应商负责收货审核，总部负责退款</b></div>
      <div className="tbl-wrap">
        <table>
          <thead><tr><th className="tw">售后单号</th><th>商品</th><th className="tw">售后方式</th><th className="tw">售后原因</th><th className="tw">寄回物流</th><th className="tw">金额</th><th>进度</th><th className="tw">状态</th><th className="tw">操作</th></tr></thead>
          <tbody>
            {AS_ROWS.map((a) => (
              <tr key={a.no}>
                <td className="tw mono">{a.no}<small>{a.orderNo}</small></td>
                <td><div className="prod-cell"><span className="thumb" style={{ background: "#f4f7f6" }}>{a.emoji}</span><div><div>{a.product}</div><small>{a.spec}</small></div></div></td>
                <td className="tw">{a.way}</td>
                <td className="tw">{a.reason}</td>
                <td className="tw mono">{a.returnNo || "—"}</td>
                <td className="tw"><span className="tag gray">已脱敏</span><small>仅总部可见</small></td>
                <td>
                  <div style={{ display: "flex", gap: 4, whiteSpace: "nowrap", fontSize: 12 }}>
                    {STEPS.map((s, i) => (<span key={s} style={{ color: i <= a.step ? "#25c7a5" : "#c2c2c2" }}>{i ? "›" : ""}{s}</span>))}
                  </div>
                </td>
                <td className="tw"><span className={`tag ${a.status === "待商家处理" ? "warn" : "blue"}`}>{a.status}</span></td>
                <td className="tw">{["待商家收货", "待验收"].includes(a.status)
                  ? <button className="btn link" onClick={() => setTarget(a)}>验收</button>
                  : <button className="btn link" onClick={() => setDetail(a)}>详情</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {target && <InspectModal as={target} onClose={() => setTarget(null)} />}
      {detail && <SupAsDetailModal as={detail} onClose={() => setDetail(null)} />}
    </>
  );
}

/* ---------------- 售后详情（供应商侧，金额脱敏） ---------------- */
function SupAsDetailModal({ as, onClose }) {
  return (
    <div className="gmock" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="gbox">
        <b>售后详情</b>
        <p>{as.no} · {as.product}</p>
        <div style={{ marginTop: 14, fontSize: 13, lineHeight: 2.2, color: "var(--text-2)" }}>
          <div>售后方式：{as.way}</div>
          <div>售后原因：{as.reason}</div>
          <div>寄回物流：<span className="mono">{as.returnNo || "—"}</span></div>
          <div>当前状态：<span className="tag blue">{as.status}</span></div>
        </div>
        <div className="note" style={{ marginTop: 12, lineHeight: 1.9 }}>
          金额、售价、退款金额对供应商<b>脱敏</b>。一件代发的退货审核与验收由<b>供应商</b>做，退款由<b>总部</b>执行。
        </div>
        <div className="gfoot">
          <button className="btn primary" onClick={onClose}>关闭</button>
        </div>
      </div>
    </div>
  );
}

function InspectModal({ as, onClose }) {
  const [result, setResult] = useState("确认验收");
  const [photos, setPhotos] = useState(0);
  const [backNo, setBackNo] = useState("");
  const [err, setErr] = useState("");
  const isReject = result === "拒收收货";

  const submit = () => {
    if (isReject && photos < 1) return setErr("拒收必须上传举证照片（≤5 张）");
    if (isReject && !backNo.trim()) return setErr("拒收必须填写退回物流单号");
    onClose();
  };

  return (
    <div className="drawer-mask" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="drawer" style={{ width: 620 }}>
        <header>退货验收<button className="x" onClick={onClose}>×</button></header>
        <div className="body">
          <div className="filters" style={{ marginBottom: 14 }}>
            <div className="row" style={{ gap: 30 }}>
              <div className="field"><label>售后单号</label><b className="mono">{as.no}</b></div>
              <div className="field"><label>售后方式</label><b>{as.way}</b></div>
            </div>
            <div className="row" style={{ gap: 30 }}>
              <div className="field"><label>商品</label><b>{as.emoji} {as.product} {as.spec}</b></div>
              <div className="field"><label>买家寄回物流</label><b className="mono">{as.returnNo || "—"}</b></div>
            </div>
          </div>

          <div className="frow">
            <label>验收结果</label>
            <div className="fc">
              <div className="radio-row">
                {["确认验收", "拒收收货"].map((r) => (
                  <label key={r}><input type="radio" checked={result === r} onChange={() => { setResult(r); setErr(""); }} />{r}</label>
                ))}
              </div>
            </div>
          </div>

          {isReject && (
            <>
              <div className="frow">
                <label><i>*</i>举证照片</label>
                <div className="fc">
                  <div className="upload">
                    <span className="ph" onClick={() => setPhotos((p) => Math.min(5, p + 1))}>＋</span>
                    {Array.from({ length: photos }, (_, i) => <span className="ph" key={i}>🧾</span>)}
                    <span className="note" style={{ alignSelf: "center" }}>最多 5 张，已传 {photos} 张</span>
                  </div>
                </div>
              </div>
              <div className="frow">
                <label><i>*</i>退回物流单号</label>
                <div className="fc"><input placeholder="请输入退回给买家的物流单号" value={backNo} onChange={(e) => setBackNo(e.target.value)} style={{ maxWidth: 300 }} /></div>
              </div>
            </>
          )}

          {err && <div className="err">{err}</div>}

        </div>
        <div className="foot">
          <button className="btn plain" onClick={onClose}>取消</button>
          <button className="btn primary" onClick={submit}>{isReject ? "确认拒收" : "确认验收"}</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- 设置 > 账号管理 ---------------- */
export function SupAccount() {
  const [rows, setRows] = useState([
    { name: "JOJO发货员", phone: "18800008888", role: "发货员", status: "已开启" },
    { name: "李四", phone: "18800008889", role: "发货员", status: "已开启" },
  ]);
  const [edit, setEdit] = useState(null);
  const [add, setAdd] = useState(false);
  const [toggle, setToggle] = useState(null);
  const [reset, setReset] = useState(null);
  const [toast, tip] = useToast();
  const setStatus = (phone, v) => setRows((rs) => rs.map((r) => (r.phone === phone ? { ...r, status: v } : r)));
  const isOn = (r) => r.status === "已开启";

  return (
    <>
      <div className="hl" data-hl="进销存新增" style={{ padding: "8px 12px", marginBottom: 12, fontSize: 12.5, lineHeight: 1.8 }}>
        进销存新增：供应商账号管理 —— 可开多个操作员账号（发货员），支持重设登录密码
      </div>
      <div className="filters">
        <div className="row">
          <div className="field"><label>操作员姓名</label><input className="ctl" placeholder="请输入姓名" /></div>
          <div className="field"><label>账号状态</label><select className="ctl w-sm" defaultValue=""><option value="">请选择</option><option>已开启</option><option>已禁用</option></select></div>
          <div className="actions"><button className="btn primary">查询</button><button className="btn">重置</button><button className="btn primary" onClick={() => setAdd(true)}>新建账号</button></div>
        </div>
      </div>
      <div className="tbl-wrap">
        <table>
          <thead><tr><th className="tw">账号绑定主体</th><th className="tw">操作员姓名</th><th className="tw">登录手机号</th><th className="tw">角色</th><th className="tw">账号状态</th><th className="tw">操作</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.phone}>
                <td className="tw">JOJO供应商 <span className="mono note" style={{ display: "inline" }}>SN00000021</span></td>
                <td className="tw">{r.name}</td>
                <td className="tw mono">{r.phone}</td>
                <td className="tw">{r.role}</td>
                <td className="tw"><span className={`tag ${isOn(r) ? "" : "gray"}`}>{r.status}</span></td>
                <td className="tw"><div className="op-col" style={{ flexDirection: "row", gap: 10 }}>
                  <button onClick={() => setEdit(r)}>编辑</button>
                  <button className="gray" onClick={() => setToggle(r)}>{isOn(r) ? "禁用" : "启用"}</button>
                  <button className="gray" onClick={() => setReset(r)}>重置密码</button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {toast}
      {edit && <AccountDrawer row={edit} onClose={() => setEdit(null)} onSaved={() => { tip(`操作员「${edit.name}」已保存`); setEdit(null); }} />}
      {add && <AccountDrawer row={NEW_OPERATOR} isNew onClose={() => setAdd(false)} onSaved={() => { setAdd(false); tip("操作员账号已创建"); }} />}
      {toggle && (
        <Confirm
          title={isOn(toggle) ? "确认禁用账号" : "确认启用账号"}
          text={isOn(toggle)
            ? `禁用后「${toggle.name}」（${toggle.phone}）将无法登录供应商后台发货，已发出的货不受影响。是否继续？`
            : `启用后「${toggle.name}」（${toggle.phone}）可重新登录供应商后台发货。是否继续？`}
          okText={isOn(toggle) ? "确认禁用" : "确认启用"}
          onOk={() => { setStatus(toggle.phone, isOn(toggle) ? "已禁用" : "已开启"); tip(`「${toggle.name}」已${isOn(toggle) ? "禁用" : "启用"}`); setToggle(null); }}
          onCancel={() => setToggle(null)}
        />
      )}
      {reset && (
        <Confirm
          title="重置登录密码"
          text={`将为操作员「${reset.name}」（${reset.phone}）生成新的随机密码，原密码立即失效，需线下告知本人。是否继续？`}
          okText="确认重置"
          onOk={() => { tip(`「${reset.name}」密码已重置，请线下告知`); setReset(null); }}
          onCancel={() => setReset(null)}
        />
      )}
    </>
  );
}

const NEW_OPERATOR = { name: "", phone: "", role: "发货员", status: "已开启" };

/* ---------------- 操作员账号抽屉 ---------------- */
function AccountDrawer({ row, isNew, onClose, onSaved }) {
  const [role, setRole] = useState(row.role || "发货员");
  return (
    <div className="drawer-mask" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="drawer" style={{ width: 560 }}>
        <header>{isNew ? "新建账号" : "编辑账号"}<button className="x" onClick={onClose}>×</button></header>
        <div className="body">
          <section className="card">
            <h3>账号绑定主体</h3>
            <div className="cbody">
              <div className="frow"><label>供应商</label><div className="fc"><input value="JOJO供应商（SN00000021）" readOnly /></div></div>
            </div>
          </section>
          <section className="card">
            <h3>操作员信息</h3>
            <div className="cbody">
              <div className="frow"><label><i>*</i>操作员姓名</label><div className="fc"><input defaultValue={row.name} placeholder="请输入操作员姓名" /></div></div>
              <div className="frow"><label><i>*</i>登录手机号</label><div className="fc"><input defaultValue={row.phone} placeholder="请输入登录手机号" /></div></div>
              <div className="frow"><label>角色</label><div className="fc">
                <select value={role} onChange={(e) => setRole(e.target.value)} style={{ maxWidth: 200 }}><option>发货员</option><option>管理员</option></select>
              </div></div>
              <div className="frow"><label>登录密码</label><div className="fc"><input type="password" defaultValue={isNew ? "" : "••••••"} placeholder="请输入登录密码" /></div></div>
            </div>
          </section>
        </div>
        <div className="foot">
          <button className="btn plain" onClick={onClose}>取消</button>
          <button className="btn primary" onClick={onSaved}>保存</button>
        </div>
      </div>
    </div>
  );
}
