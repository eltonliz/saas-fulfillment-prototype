import React, { useState } from "react";
import { useToast, useRowSelect, BatchBar, Confirm, usePaged, Pager } from "../ui.jsx";
import { orderStore, supplyStore } from "../store.js";
import { pickupCodeOf, fmtPickupCode, supplyLabelOf } from "../data.js";

/* 自提单的最后一跳（总部仓 → 门店）是内部段，走发货管理（供货单）；
   订单管理的「发货」只发消费者那一跳（快递单） */
const upstreamReady = (o) => {
  if (o.goodsSource === "总部自有") return true;
  const up = supplyStore.get().find((d) => d.leg === "supplier_to_hq" && d.orderNo === o.no);
  return !!up && up.status === "已收货";
};
const canShipOrder = (o) => {
  if (o.status !== "待发货") return false;
  if (o.delivery === "上门自提") return false;
  if (o.goodsSource === "总部自有") return true;
  if (o.supplyMode !== "总部仓直配") return false;
  return upstreamReady(o);
};

/* 一件代发（供应商直发消费者·快递）：租户后台只读——能看到、不能操作；
   发货与售后均在供应商后台完成，两侧共享同一份数据 */
const isDropship = (o) => o.supplyMode === "供应商直配" && o.delivery === "快递发货";

const STEPS = ["买家下单", "买家付款", "商家发货", "买家签收", "交易完成"];
/* 发货状态统一口径：有发货记录（部分/全部/物流单）才算已发货 */
const hasShipped = (o) => !!(o.shippedQty > 0 || o.tracking || ["已发货", "已完成"].includes(o.status));

export function OrderManagement({ onOpenSupply }) {
  const [tab, setTab] = useState("全部");
  const [detail, setDetail] = useState(null);
  const [ship, setShip] = useState(null);
  const [after, setAfter] = useState(null);   // 查看售后
  const [pickup, setPickup] = useState(null); // 查看自提码
  const [track, setTrack] = useState(null);   // 查看物流（供应商发货的只读监控）
  const [batch, setBatch] = useState(null);   // 批量操作
  const [toast, tip] = useToast();
  const rows = orderStore.use().filter((o) =>
    tab === "全部" ? true
      : tab === "已关闭" ? ["已关闭", "已全额退款", "已取消"].includes(o.status)
        : o.status === tab);
  const { sel, allSel, toggleAll, toggleOne } = useRowSelect(rows.map((o) => o.id));
  const pg = usePaged(rows);

  /* 真实行为：列表点「发货」先进订单详情，详情里再点「发货」才开发货弹窗 */
  const openDetail = (o) => setDetail(o);

  const batchAct = (kind) => {
    if (!sel.size) { tip("请先勾选订单"); return; }
    setBatch({ kind, count: sel.size });
  };

  return (
    <>
      <div className="alert"><span className="ic">i</span>一件代发（供应商直发消费者 · 快递）订单的<b style={{ margin: "0 4px" }}>发货与售后均在供应商后台操作</b>，本页<b style={{ margin: "0 4px" }}>只读可见</b>、两侧数据实时共享</div>

      <div className="filters">
        <div className="row">
          <div className="field">
            <label>查询订单</label>
            <select className="ctl w-sm" defaultValue="订单编号"><option>订单编号</option><option>收件人姓名</option><option>手机号后四位</option><option>买家昵称</option><option>商品名称</option></select>
            <span style={{ color: "#c2c2c2" }}>🔍</span>
            <input className="ctl" placeholder="请输入订单编号" />
          </div>
          <span style={{ color: "#666", cursor: "pointer" }}>▾ 展开</span>
          <div className="actions"><button className="btn primary">查询</button><button className="btn">重置</button></div>
        </div>
      </div>

      <div className="pills">
        {["全部", "待付款", "待发货", "已发货", "售后中", "已完成", "已关闭"].map((t) => (
          <span key={t} className={`pill ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>{t}</span>
        ))}
        <div className="right">
          <select className="ctl w-sm" defaultValue="是否标星" style={{ width: 120 }}><option>是否标星</option><option>已标星</option><option>未标星</option></select>
          <select className="ctl w-sm" defaultValue="是否留言" style={{ width: 120 }}><option>是否留言</option><option>有留言</option><option>无留言</option></select>
          <select className="ctl w-sm" defaultValue="" style={{ width: 120 }}><option value="">请选择</option><option>微信支付</option><option>余额支付</option></select>
        </div>
      </div>

      <BatchBar allSel={allSel} toggleAll={toggleAll} count={sel.size}>
        <button className="act" onClick={() => batchAct("设置售后")}>设置售后</button>
        <button className="act" onClick={() => batchAct("批量分配门店")}>批量分配门店</button>
        <button className="act" onClick={() => batchAct("批量退款")}>批量退款</button>
      </BatchBar>

      <div className="tbl-wrap">
        <table className="tbl-tight">
          <thead>
            <tr>
              <th style={{ width: 36 }}><input type="checkbox" checked={allSel} onChange={toggleAll} /></th>
              <th style={{ minWidth: 196 }}>商品信息</th>
              <th style={{ minWidth: 84 }}>售后信息</th>
              <th style={{ minWidth: 120 }}>实收金额</th>
              <th style={{ minWidth: 180 }}>买家/收货人</th>
              <th style={{ minWidth: 132 }}>门店/配送方式</th>
              <th style={{ minWidth: 132 }}>下单时间</th>
              <th style={{ minWidth: 120 }}>订单状态</th>
              <th style={{ minWidth: 88 }}>订单类型</th>
              <th style={{ minWidth: 88 }}>买家备注</th>
              <th className="col-new" data-hl="新增">关联供货单</th>
              <th style={{ minWidth: 96 }}>订单操作</th>
            </tr>
          </thead>
          <tbody>
            {pg.pageRows.map((o) => (
              <tr key={o.id}>
                <td><input type="checkbox" checked={sel.has(o.id)} onChange={() => toggleOne(o.id)} /></td>
                <td>
                  <div className="prod-cell">
                    <span className="thumb" style={{ background: "#f4f7f6" }}>{o.emoji}</span>
                    <div>
                      <div>订单号：<span className="mono" style={{ color: "#25c7a5" }}>{o.no}</span></div>
                      <div>{o.product}</div><small>{o.spec}</small>
                      <small>数量: {o.qty}件　单价: {o.unitPrice}</small>
                    </div>
                  </div>
                </td>
                <td>{o.afterSale}{o.afterSaleLink && <div><span onClick={() => setAfter(o)} style={{ color: "#25c7a5", cursor: "pointer" }}>{o.afterSaleLink}</span></div>}</td>
                <td>{Object.entries(o.amounts).map(([k, v]) => (<div key={k} style={{ display: "flex", gap: 6, whiteSpace: "nowrap" }}><span style={{ color: "#999" }}>{k}:</span><span>{v}</span></div>))}</td>
                <td>
                  <div>收件人信息：</div>
                  {Object.entries(o.buyer).map(([k, v]) => (<div key={k} style={{ display: "flex", gap: 4 }}><span style={{ color: "#999", whiteSpace: "nowrap" }}>{k}:</span><span>{v}</span></div>))}
                </td>
                <td><div>门店: {o.store}</div><div>方式: {o.delivery}</div>
                  {o.carrier && <div style={{ marginTop: 4 }}>服务商: {o.carrier}</div>}
                  {o.tracking && <div><span onClick={() => setTrack(o)} style={{ color: "#25c7a5", cursor: "pointer" }}>查看</span></div>}
                  {o.pickupCode && <div><span onClick={() => setPickup(o)} style={{ color: "#25c7a5", cursor: "pointer" }}>{o.pickupCode}</span></div>}
                </td>
                <td className="mono">{o.createdAt}</td>
                <td>
                  <div>{o.status}</div>
                  {o.payMethod && <small>支付方式: {o.payMethod}</small>}
                  {o.payTime && <small>支付时间: {o.payTime}</small>}
                  {o.shippedQty > 0 && o.status === "待发货" && <small style={{ color: "#f5a623" }}>部分发货：已发 {o.shippedQty}/{o.qty} 件，可再发</small>}
                </td>
                <td className="tw">{o.orderType || "销售订单"}</td>
                <td className="tw">{o.buyerNote || "-"}</td>
                <td className="col-new">
                  {/* 统一两段式：主字段（供货单号 / 自有货直发 / —）+ 模式副标签 */}
                  {o.supplyNo ? (<><span onClick={() => onOpenSupply && onOpenSupply(o.supplyNo)} className="mono" style={{ color: "#25c7a5", cursor: "pointer" }}>{o.supplyNo}</span><small style={{ color: "#999" }}>{supplyLabelOf(o)}</small></>)
                    : o.goodsSource === "总部自有" ? (<><span style={{ color: "#25c7a5" }}>自有货直发</span><small style={{ color: "#999" }}>总部仓直配 · 自有货</small></>)
                      : o.supplyMode ? (<><span style={{ color: "#999" }}>—</span><small style={{ color: "#999" }}>{supplyLabelOf(o)}</small></>)
                        : (<span style={{ color: "#999" }}>—</span>)}
                </td>
                <td>
                  <div className="op-col">
                    {isDropship(o) ? (
                      /* 代发单只读：不提供发货 / 备注 / 改地址等操作，只看 */
                      <>
                        {o.status === "待发货" && <span style={{ color: "#bbb", fontSize: 14, height: 22 }}>由供应商发货</span>}
                        <span className="hl" data-hl="进销存：只读"><button className="gray" onClick={() => openDetail(o)}>详情</button></span>
                      </>
                    ) : (
                      <>
                        {o.status === "待发货" && (canShipOrder(o)
                          ? <button onClick={() => openDetail(o)}>发货</button>
                          : o.supplyMode === "供应商直配" ? <span style={{ color: "#bbb", fontSize: 14, height: 22 }}>由供应商发货</span>
                            : o.delivery === "上门自提" ? <span style={{ color: "#f5a623", fontSize: 13, height: 22 }}>{upstreamReady(o) ? "总部仓直配（见发货管理）" : "待总部仓收货"}</span>
                              : <span style={{ color: "#f5a623", fontSize: 13, height: 22 }}>{o.shipBlock || "待总部仓收货"}</span>)}
                        {o.ops.filter((x) => x !== "发货").map((op) => (<button key={op} className="gray" onClick={() => openDetail(o)}>{op}</button>))}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pager {...pg} />

      {toast}
      {detail && (
        <OrderDetailDrawer
          order={detail}
          onClose={() => setDetail(null)}
          onShip={() => { setShip(detail); setDetail(null); }}
          onNote={() => tip("商家备注已保存（仅商家侧可见）")}
        />
      )}
      {ship && <ShipModal order={ship} onClose={() => setShip(null)} onDone={(p) => {
            const shipped = (ship.shippedQty || 0) + p.qty;
            const full = shipped >= ship.qty;
            orderStore.set((os) => os.map((o) => (o.id === ship.id ? {
              ...o, shippedQty: shipped, carrier: p.carrier, tracking: p.tracking,
              track: "已发货 " + new Date().toISOString().slice(0, 19).replace("T", " "),
              status: full ? "已发货" : o.status,
            } : o)));
            tip(full ? `订单 ${ship.no} 已发货` : `订单 ${ship.no} 部分发货：已发 ${shipped}/${ship.qty} 件，剩余可再发`);
            setShip(null);
          }} />}
      {after && <AfterSalePop order={after} onClose={() => setAfter(null)} />}
      {pickup && <PickupCodePop order={pickup} onClose={() => setPickup(null)} />}
      {track && <OrderTrackModal order={track} onClose={() => setTrack(null)} />}
      {batch && (
        <Confirm
          title={batch.kind}
          text={batchText(batch.kind, batch.count)}
          okText="确认"
          onOk={() => { tip(`${batch.kind}：已处理 ${batch.count} 笔订单`); setBatch(null); }}
          onCancel={() => setBatch(null)}
        />
      )}
    </>
  );
}

function batchText(kind, n) {
  if (kind === "批量退款") return `将对已勾选的 ${n} 笔订单发起整单退款，对应未发货的供货任务会同步关闭。是否继续？`;
  if (kind === "批量分配门店") return `将为已勾选的 ${n} 笔订单重新分配所属门店。到店自提订单的提货码会随门店变更一并作废并重发。是否继续？`;
  return `将为已勾选的 ${n} 笔订单设置售后处理人，仅影响商家侧工单流转，不改变订单状态。是否继续？`;
}

/* ---------------- 查看售后 ---------------- */
function AfterSalePop({ order, onClose }) {
  return (
    <div className="gmock" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="gbox">
        <b>售后信息</b>
        <p>订单号 {order.no} · {order.product}</p>
        <div style={{ marginTop: 14, fontSize: 13, lineHeight: 2.2, color: "var(--text-2)" }}>
          <div>售后状态：<span className="tag warn">{order.afterSale}</span></div>
          <div>关联供货单：<span className="mono">{order.supplyNo || "—"}</span></div>
          <div>发货状态：{hasShipped(order) ? "已发货" : "未发货"}</div>
        </div>
        <div className="note" style={{ marginTop: 12, lineHeight: 1.9 }}>
          {order.status === "已全额退款"
            ? "该订单为未发货退款，对应的发货任务已同步关闭。"
            : order.status === "售后中"
              ? "售后处理中：售后单在「交易 → 售后管理」按 同意 → 退款 流程处理，退款原路退回，完成后本订单转「已完成」。"
              : "该订单已发货，售后转线下协商。"}
        </div>
        <div className="gfoot">
          <button className="btn primary" onClick={onClose}>知道了</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- 查看自提码 ---------------- */
function PickupCodePop({ order, onClose }) {
  const ready = !!order.pickupReady;
  const used = !!order.pickupUsed;
  return (
    <div className="gmock" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="gbox">
        <b>提货码</b>
        <p>订单号 {order.no} · 自提门店 {order.store}</p>
        <div style={{ margin: "18px 0", textAlign: "center", padding: "16px 0", background: ready && !used ? "#eefbf8" : "#f5f7f8", borderRadius: 6 }}>
          <div style={{ fontSize: 26, letterSpacing: 4, fontWeight: 700, color: ready && !used ? "#25c7a5" : "#bbb" }}>
            {ready ? fmtPickupCode(pickupCodeOf(order)) : "尚不可用"}
          </div>
          <div style={{ fontSize: 12, color: "#999", marginTop: 8 }}>
            {used ? "已核销使用，订单已完成" : ready ? "请在门店前台出示此码核销" : "尚未全部到货，提货码不可用"}
          </div>
        </div>
        <div className="note" style={{ lineHeight: 1.9 }}>
          进销存口径：只有<b>全部到货</b>后提货码才激活；未到齐时门店端提示「尚未全部到货，提货码不可用」。<br />
          <b>G2②</b>：若门店长时间不点「确认到货」，系统在<b>到店满 3 天</b>后自动确认到货并激活提货码，避免客户到店却取不了货。
        </div>
        <div className="gfoot">
          <button className="btn primary" onClick={onClose}>关闭</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- 查看物流（销售包裹轨迹；供应商发货时租户侧只读监控） ---------------- */
function OrderTrackModal({ order, onClose }) {
  const raw = order.track || "";
  const signed = /已签收/.test(raw) || order.status === "已签收";
  const stamp = (re) => (raw.replace(re, "").trim() || "—");

  /* 由旧到新构造，展示时倒序（最新在上） */
  const nodes = [
    { t: "订单已支付", d: "等待发货方揽收", at: order.payTime || order.createdAt, done: true },
    { t: "已发货", d: `${order.carrier} 已揽收`, at: stamp(/^已发货\s*/), done: true },
    signed
      ? { t: "已签收", d: `已送达 ${order.buyer["收件人地址"] || "收货地址"}`, at: stamp(/^已签收\s*/), done: true }
      : { t: "派送中", d: "待收件人签收", at: "—", done: false },
  ];

  return (
    <div className="gmock" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="gbox" style={{ width: 460 }}>
        <b>物流轨迹</b>
        <p>订单号 {order.no} · {order.carrier} {order.tracking}</p>
        <div style={{ marginTop: 16 }}>
          {nodes.slice().reverse().map((n, i, arr) => (
            <div key={n.t} style={{ display: "flex", gap: 10 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 12, flex: "none" }}>
                <span style={{ width: 9, height: 9, borderRadius: "50%", marginTop: 5, background: n.done ? "#25c7a5" : "#cfd7de" }} />
                {i !== arr.length - 1 && <span style={{ flex: 1, width: 1, background: "#e8ecef", marginTop: 3 }} />}
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.6, paddingBottom: i === arr.length - 1 ? 0 : 16 }}>
                <b>{n.t}</b>
                <div style={{ color: "#666", fontSize: 12.5, marginTop: 2 }}>{n.d}</div>
                <div style={{ color: "#bbb", fontSize: 11.5, marginTop: 2 }}>{n.at}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="gfoot">
          <button className="btn primary" onClick={onClose}>关闭</button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   订单详情（1:1 真实后台版式：左状态/右进度条 → 黄色买家备注条 → 灰色 5 列信息块 → 商品表）
   ============================================================================ */
function OrderDetailDrawer({ order, onClose, onShip, onNote }) {
  const total = order.amounts["应收金额"];
  /* 步骤条完成度：按订单状态点亮 —— 待付款 1 步；待发货/售后中 2 步；已发货 3 步；已完成 5 步 */
  const doneN = { 待付款: 1, 待发货: 2, 已发货: 3, 售后中: 2, 已完成: 5, 已全额退款: 2, 已取消: 1, 已关闭: 1 }[order.status] ?? 2;

  return (
    <div className="drawer-mask" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="drawer" style={{ width: 1180 }}>
        <header>订单详情<button className="x" onClick={onClose}>×</button></header>
        <div className="body" style={{ padding: "18px 22px 30px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <button className="btn" style={{ padding: 0, width: 22, height: 22, fontSize: 16 }} onClick={onClose}>‹</button>
            <span style={{ color: "#666" }}>订单编号：<span className="mono">{order.no}</span></span>
          </div>

          {/* 左：状态 / 发货 / 商家备注　右：进度条 */}
          <div style={{ border: "1px solid #ececec", borderRadius: 4, display: "flex", padding: "20px 24px", alignItems: "center" }}>
            <div style={{ width: 250, flex: "none" }}>
              <div style={{ fontSize: 22, color: "#333", marginBottom: 8 }}>{order.status}</div>
              <div style={{ color: "#999", fontSize: 13, marginBottom: 14 }}>
                {order.status === "待付款" ? "等待买家付款" : order.status === "待发货" ? "买家已付款，待商家发货" : order.status === "已发货" ? "商家已发货，等待买家签收" : order.status === "售后中" ? "售后处理中，订单已挂起" : order.status === "已完成" ? "交易完成" : order.status === "已取消" ? "超时未支付，订单自动取消" : order.status === "已全额退款" ? "已退款" : "—"}
              </div>
              {order.status === "待发货" && (canShipOrder(order)
                ? <button className="btn primary" style={{ marginBottom: 14 }} onClick={onShip}>发货</button>
                : <div style={{ marginBottom: 14 }}>
                    <span className="hl" data-hl="进销存"><span style={{ color: "#f5a623" }}>{order.shipBlock || "待总部仓收货"}</span></span>
                  </div>)}
              <div style={{ fontSize: 13, color: "#666" }}>商家备注：<span onClick={onNote} style={{ color: "#25c7a5", cursor: "pointer" }}>备注</span></div>
              {!canShipOrder(order) && order.shipHint && <div className="note" style={{ marginTop: 8, maxWidth: 240 }}>{order.shipHint}</div>}
            </div>

            <div style={{ borderLeft: "1px solid #ececec", flex: 1, paddingLeft: 30, display: "flex", alignItems: "flex-start" }}>
              {STEPS.map((s, i) => (
                <React.Fragment key={s}>
                  {i > 0 && <span style={{ flex: 1, height: 1, background: "#e5e5e5", marginTop: 13 }} />}
                  <div style={{ textAlign: "center", width: 96, flex: "none" }}>
                    <span style={{
                      width: 26, height: 26, borderRadius: "50%", display: "grid", placeItems: "center", margin: "0 auto 8px",
                      background: i < doneN ? "#25c7a5" : "#fff", color: i < doneN ? "#fff" : "#bbb",
                      border: i < doneN ? "none" : "1px solid #dcdcdc", fontSize: 13,
                    }}>{i + 1}</span>
                    <div style={{ fontSize: 13, color: i < doneN ? "#333" : "#bbb" }}>{s}</div>
                    <div style={{ fontSize: 12, color: "#999", marginTop: 4 }}>{i === 0 ? order.createdAt : i === 1 ? order.payTime : ""}</div>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* 买家备注条 */}
          <div style={{ background: "#fdf9d0", padding: "12px 20px", marginTop: 16, fontSize: 13, color: "#666" }}>买家备注：</div>

          {/* 灰色 5 列信息块 */}
          <div style={{ background: "#f7f7f7", padding: "18px 20px", marginTop: 16, display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1.2fr", gap: 24 }}>
            <div>
              <div style={{ fontSize: 14, color: "#333", marginBottom: 10 }}>收货人信息</div>
              <div className="note" style={{ lineHeight: 2.1, fontSize: 13 }}>
                <div>收货人：{order.buyer["收件人"] || order.buyer["昵称"]}</div>
                <div>联系电话：{order.buyer["收件人电话"] || "—"}</div>
                <div>收货地址：{order.buyer["收件人地址"] || "—"}</div>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 14, color: "#333", marginBottom: 10 }}>配送信息</div>
              <div className="note" style={{ lineHeight: 2.1, fontSize: 13 }}>配送方式：{order.delivery}</div>
            </div>
            <div>
              <div style={{ fontSize: 14, color: "#333", marginBottom: 10 }}>付款信息</div>
              <div className="note" style={{ lineHeight: 2.1, fontSize: 13 }}>
                <div>应付金额： ￥{total}</div><div>实付金额： ￥{order.amounts["实收金额"] && order.amounts["实收金额"] !== "-" ? order.amounts["实收金额"] : total}</div>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 14, color: "#333", marginBottom: 10 }}>买家信息</div>
              <div className="note" style={{ lineHeight: 2.1, fontSize: 13 }}>买家：{order.buyer["昵称"]}</div>
            </div>
            <div>
              <div style={{ fontSize: 14, color: "#333", marginBottom: 10 }}>营销信息</div>
              <div className="note" style={{ lineHeight: 2.1, fontSize: 13 }}>
                <div>满减优惠总金额： ￥{order.amounts["优惠金额"]}</div>
                <div>折扣优惠总金额： -</div>
                <div>红包优惠总金额： -</div>
              </div>
            </div>
          </div>

          {/* 商品信息 */}
          <table className="tbl-tight" style={{ marginTop: 20 }}>
            <thead><tr><th>商品信息</th><th className="tw">单价(元)</th><th className="tw">数量</th><th className="tw">单位</th><th className="tw">优惠后金额(元)</th><th className="tw">售后状态</th><th className="tw">发货状态</th></tr></thead>
            <tbody>
              <tr>
                <td>
                  <div className="prod-cell">
                    <span className="thumb" style={{ background: "#f4f7f6" }}>{order.emoji}</span>
                    <div><div>{order.product}</div><small>{order.spec}</small><small className="mono">商品编码：JY123　商品SKU：01</small></div>
                  </div>
                </td>
                <td className="tw">{order.unitPrice}</td><td className="tw">{order.qty}</td><td className="tw">件</td>
                <td className="tw">￥{order.amounts["实收金额"] && order.amounts["实收金额"] !== "-" ? order.amounts["实收金额"] : total}</td><td className="tw">{order.afterSale === "售后处理中" ? "退款中" : (order.status === "已全额退款" || order.afterSale === "售后完成") ? "已退款" : "未退款"}</td><td className="tw">{hasShipped(order) ? "已发货" : "未发货"}</td>
              </tr>
            </tbody>
          </table>

          <div style={{ textAlign: "right", lineHeight: 2.4, marginTop: 14, color: "#666", fontSize: 13 }}>
            <div>商品总价： ￥{order.amounts["商品金额"]}</div>
            <div>优惠总价： ￥{order.amounts["优惠金额"]}</div>
            <div>积分抵扣：（消耗0积分） -</div>
            <div style={{ color: "#333", fontSize: 15 }}>订单应收总价： <b style={{ color: "#f5522e" }}>￥{total}</b></div>
          </div>
        </div>
        <div className="foot"><button className="btn plain" onClick={onClose}>关闭</button></div>
      </div>
    </div>
  );
}

/* ============================================================================
   发货弹窗（1:1 真实后台）
   ============================================================================ */
function ShipModal({ order, onClose, onDone }) {
  const remainQty = order.qty - (order.shippedQty || 0);
  const [qty, setQty] = useState(remainQty);
  const [carrier, setCarrier] = useState("");
  const [tracking, setTracking] = useState("");
  const [addr, setAddr] = useState(0);
  const addresses = [
    { name: "张三", phone: "13800138000", addr: "广东省广州市天河区体育西路100号" },
    { name: "张三", phone: "13800138001", addr: "广东省广州市天河区天河路208号天河城广场1楼" },
    { name: "张三", phone: "13800138001", addr: "广东省广州市天河区天河路208号天河城广场1楼" },
    { name: "李四", phone: "13800138009", addr: "广东省深圳市南山区科技中一路1001号" },
  ];

  return (
    <div className="drawer-mask" style={{ justifyContent: "center", alignItems: "center" }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="drawer" style={{ width: 820, height: "auto", maxHeight: "90vh", borderRadius: 4 }}>
        <header>发货<button className="x" onClick={onClose}>×</button></header>
        <div className="body" style={{ padding: "16px 22px 22px" }}>
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
                    <span className="thumb" style={{ background: "#f4f7f6" }}>{order.emoji}</span>
                    <div><div>{order.product}</div><small>{order.spec}</small></div>
                  </div>
                </td>
                <td className="tw">{order.unitPrice}</td>
                <td className="tw">{order.qty}</td>
                <td className="tw mono">{remainQty}</td>
                <td className="tw">
                  <span style={{ display: "inline-flex", alignItems: "center", border: "1px solid #e5e5e5", borderRadius: 3, height: 30 }}>
                    <span style={{ padding: "0 8px", color: "#999", fontSize: 12.5, borderRight: "1px solid #e5e5e5", lineHeight: "28px" }}>发货数</span>
                    <button className="btn" style={{ width: 28, height: 28, padding: 0, background: "transparent" }} onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
                    <input value={qty} onChange={(e) => setQty(Math.min(remainQty, Math.max(1, Number(e.target.value.replace(/\D/g, "")) || 0)))} style={{ width: 44, height: 28, border: 0, textAlign: "center", padding: 0 }} />
                    <button className="btn" style={{ width: 28, height: 28, padding: 0, background: "transparent" }} onClick={() => setQty((q) => Math.min(remainQty, q + 1))}>＋</button>
                  </span>
                </td>
                <td className="tw">未发货</td>
                <td className="tw"><input placeholder="请输入" style={{ height: 30 }} /></td>
              </tr>
            </tbody>
          </table>

          <h3 style={{ fontSize: 15, margin: "26px 0 12px", borderLeft: "none", paddingLeft: 0 }}>收货人信息</h3>
          <div style={{ lineHeight: 2.2, display: "flex", fontSize: 13, color: "#666" }}>
            <div style={{ width: 420 }}>
              <div>配送方式：　{order.delivery}</div>
              <div>收货人电话：{order.buyer["收件人电话"] || "—"}</div>
              <div>收货地址：　{order.buyer["收件人地址"] || "—"}</div>
            </div>
            <div>收货人：　{order.buyer["收件人"] || order.buyer["昵称"]}</div>
          </div>

          <div style={{ display: "flex", alignItems: "center", margin: "26px 0 12px" }}>
            <h3 style={{ fontSize: 15, margin: 0, borderLeft: "none", paddingLeft: 0 }}>选择发货地址</h3>
            <button className="btn link" style={{ marginLeft: "auto" }}>+ 添加地址</button>
          </div>
          <table className="tbl-tight">
            <thead><tr><th style={{ width: 46, background: "#fff" }}></th><th className="tw">联系人</th><th className="tw">联系方式</th><th>地址</th></tr></thead>
            <tbody>
              {addresses.map((a, i) => (
                <tr key={i}>
                  <td><input type="radio" checked={addr === i} onChange={() => setAddr(i)} /></td>
                  <td className="tw">{a.name} <span style={{ color: "#999" }}>【默认】</span></td>
                  <td className="tw mono">{a.phone}</td>
                  <td>{a.addr}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: "flex", gap: 40, marginTop: 22, alignItems: "center", fontSize: 13, color: "#666" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span>快递公司信息：<i className="req">*</i></span>
              <select className="ctl" value={carrier} onChange={(e) => setCarrier(e.target.value)} style={{ width: 220, height: 32, color: carrier ? "#333" : "#bbb" }}><option value="">请选择或搜索快递公司</option>
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
          <button className="btn primary" disabled={qty < 1 || !carrier || !tracking.trim()} onClick={() => onDone({ qty, carrier, tracking: tracking.trim() })}>确定</button>
        </div>
      </div>
    </div>
  );
}
