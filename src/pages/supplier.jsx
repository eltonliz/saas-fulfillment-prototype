import React, { useState } from "react";
import { TemplateDrawer, ImportDrawer, BatchShipDrawer, applyShipBatch, applyShip, ReceiveAbnormal, EvidencePhotos, DIFF_TABS, diffInTab, newFhdId, MakeupTag, DiffAuditModal } from "./supply.jsx";
import { itemsOf, ordersOf, packagesOf, qtyOf, sentOf, receivedOf, itemsLabel, SUPPLIER_SELF } from "../data.js";
import { OrderPool, GenTaskModal, poolOf, OrderRefsPop } from "./supply.jsx";
import { TrackDrawer, useToast, useRowSelect, BatchBar, usePaged, Pager, Confirm } from "../ui.jsx";
import { supplierStore, supplyStore, diffStore, orderStore, patchDoc, addrStore, afterSaleStore } from "../store.js";

const LEG_LABEL = {
  supplier_to_hq: "供应商 → 总仓",
  supplier_inbound: "供应商 → 门店",
};
const CARRIERS = ["顺丰速运", "圆通速递", "中通快递", "京东物流", "韵达快递", "极兔速递"];
/* 供货单物流可改窗口：已发货且收货方未收货（部分收货/已收货/收货异常一律锁定） */
const canEditDocTrack = (d) => !!packagesOf(d).length && ["待发货", "已发货"].includes(d.status);

/* ---------------- 供应商供货任务列表（三个页面共用，含发货/详情/物流轨迹） ---------------- */
export function SupTasks({ leg, title, desc }) {
  /* 供应商侧同样是「订单池 → 生成发货任务」两步：日常按订单看，发货按任务看 */
  const scope = leg === "supplier_to_hq" ? "sup_hq" : "sup_store";
  const [view, setView] = useState("pool");
  const [tab, setTab] = useState("全部");
  const [modal, setModal] = useState(null);
  const [batch, setBatch] = useState(null);
  const [toast, tip] = useToast();
  const docs = supplierStore.use();
  const mine = docs.filter((d) => d.leg === leg);
  /* 部分收货为过程态（对方收了一部分、未收完），归「已发货」并带标记 */
  const statusText = (d) => (d.status === "部分收货" ? "已发货" : d.status);
  const list = mine.filter((d) => (tab === "全部" ? true : statusText(d) === tab));
  const { sel, allSel, toggleAll, toggleOne } = useRowSelect(list.map((d) => d.id));
  const pg = usePaged(list);
  const pending = mine.filter((d) => d.status === "待发货" && !d.isMakeup).length;
  /* 补发单发货收口在配送差异页：批量 / 导入 / 模板不含补发单 */
  const canShipRows = mine.filter((d) => d.status === "待发货" && !d.isMakeup);
  const TABS = ["全部", "待发货", "已发货", "已收货", "收货异常"];

  return (
    <>
      <div className="tabs" style={{ display: "flex", gap: 28, borderBottom: "1px solid var(--line)", marginBottom: 16, paddingLeft: 8 }}>
        {[["pool", "自提订单"], ["tasks", "发货任务"]].map(([k, t]) => (
          <span key={k} onClick={() => setView(k)}
            style={{ paddingBottom: 12, fontSize: 14, cursor: "pointer",
              color: view === k ? "var(--brand)" : "var(--text-2)",
              borderBottom: view === k ? "2px solid var(--brand)" : "2px solid transparent",
              fontWeight: view === k ? 600 : 400 }}>{t}</span>
        ))}
      </div>

      {view === "pool" ? <OrderPool scope={scope} /> : (<>
      <div className="filters">
        <div className="row">
          <div className="field"><label>供货单号 / 销售订单</label><input className="ctl w-lg" placeholder="请输入供货单号或销售订单号" /></div>
          <div className="field"><label>收货主体</label>
            <select className="ctl" defaultValue="全部">
              <option>全部</option>
              {leg === "supplier_to_hq"
                ? <option>九天教育总仓</option>
                : <><option>九天门店</option><option>9071门店</option><option>濮源直播间</option></>}
            </select>
          </div>
          <div className="actions"><button className="btn primary">查询</button><button className="btn">重置</button></div>
        </div>
      </div>

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
            {pg.pageRows.map((d) => (
              <tr key={d.id}>
                <td><input type="checkbox" checked={sel.has(d.id)} onChange={() => toggleOne(d.id)} /></td>
                <td className="tw mono">
                  {d.id}
                  <MakeupTag d={d} />
                </td>
                <td className="tw mono">{ordersOf(d).length > 1
                  ? <>{ordersOf(d)[0]}<small style={{ display: "block", color: "#999" }}>等 {ordersOf(d).length} 笔订单</small></>
                  : <>{ordersOf(d)[0] || "-"}</>}</td>
                <td>
                  <div className="prod-cell">
                    <span className="thumb" style={{ background: "#f4f7f6" }}>{itemsLabel(d).emoji}</span>
                    <div>
                      <div>{itemsLabel(d).first}{itemsLabel(d).more > 0 && <span className="note"> 等 {itemsOf(d).length} 种</span>}</div>
                      <small>{itemsLabel(d).spec}</small>
                    </div>
                  </div>
                </td>
                <td className="tw">{LEG_LABEL[d.leg]}</td>
                <td>{d.receiver}<small>{d.receiverAddr}</small></td>
                <td className="tw mono">{qtyOf(d)}/{sentOf(d)}
                  {d.status === "部分收货" && <small style={{ color: "#f5a623" }}>已收 {receivedOf(d)}｜待补 {qtyOf(d) - receivedOf(d)} 件</small>}
                  {d.status === "收货异常" && !d.makeupAnomaly && <small style={{ color: "#f5522e" }}>实收 {receivedOf(d)}｜差 {Math.max(0, qtyOf(d) - receivedOf(d))} 件</small>}
                  {d.makeupAnomaly && <small style={{ color: "#f5522e" }}>补发仍有异常 · 转线下</small>}
                </td>
                <td className="tw mono">{packagesOf(d).length
                  ? <>{packagesOf(d)[0].carrier}<small>{packagesOf(d)[0].tracking}</small>
                    {packagesOf(d).length > 1 && <small style={{ display: "block", color: "#999" }}>共 {packagesOf(d).length} 个包裹</small>}</>
                  : "-"}</td>
                <td className="tw">
                  <span className={`tag ${statusText(d) === "待发货" ? "warn" : statusText(d) === "已发货" ? "blue" : statusText(d) === "收货异常" ? "danger" : ""}`}>{statusText(d)}</span>
                  {d.status === "部分收货" && <small style={{ color: "#f5a623" }}>部分收货</small>}
                </td>
                <td>
                  <div className="op-col">
                    <button className="gray" onClick={() => setModal({ k: "detail", d })}>详情</button>
                    {/* 补发单的发货操作收口在配送差异页，本列表只读监控 */}
                    {["待发货", "部分收货"].includes(d.status) && (d.isMakeup
                      ? <span style={{ color: "#bbb", fontSize: 14, height: 22 }}>在配送差异发货</span>
                      : <button onClick={() => setModal({ k: "ship", d })}>{d.status === "部分收货" ? "发货（补齐）" : "发货"}</button>)}
                    {packagesOf(d).length > 0 && <button className="gray" onClick={() => setModal({ k: "track", d })}>物流轨迹</button>}
                    {canEditDocTrack(d) && <button className="gray" onClick={() => setModal({ k: "edit", d })}>修改物流</button>}
                  </div>
                </td>
              </tr>
            ))}
            {!list.length && <tr><td colSpan={10} style={{ textAlign: "center", padding: 40, color: "#999" }}>暂无任务</td></tr>}
          </tbody>
        </table>
      </div>
      <Pager {...pg} />

      {modal?.k === "ship" && (
        <SupShipModal
          doc={modal.d}
          onClose={() => setModal(null)}
          onDone={(p) => {
            /* 与租户侧共用 applyShip：多商品行 + 多包裹，两端同一份写回口径 */
            tip(applyShip(modal.d, p));
            setModal(null);
          }}
        />
      )}
      {modal?.k === "detail" && <SupDocDrawer doc={modal.d} onClose={() => setModal(null)} onTrack={() => setModal({ k: "track", d: modal.d })} />}
      {modal?.k === "track" && <TrackDrawer doc={modal.d} onClose={() => setModal(null)} />}
      {modal?.k === "edit" && <SupEditTrackModal
        no={modal.d.id}
        desc={`${itemsLabel(modal.d).first}　${itemsLabel(modal.d).spec}${packagesOf(modal.d).length > 1 ? `（本批共 ${packagesOf(modal.d).length} 个包裹，此处改第 1 个）` : ""}`}
        carrier={packagesOf(modal.d)[0]?.carrier || ""}
        tracking={packagesOf(modal.d)[0]?.tracking || ""}
        lockText="收货方确认收货后不可再改"
        syncText="修改会同步更新本单物流，租户侧发货管理看到的也是修改后的单号。"
        onClose={() => setModal(null)}
        onDone={(p) => {
          const ts = new Date().toISOString().slice(0, 19).replace("T", " ");
          /* 只改快递公司 + 单号并留痕；多包裹时此处改第 1 个 */
          const pk = packagesOf(modal.d).map((x, i) => (i === 0 ? { ...x, carrier: p.carrier, tracking: p.tracking } : x));
          patchDoc(modal.d.id, { packages: pk, trackEditedAt: ts, trackEditFrom: packagesOf(modal.d)[0]?.tracking });
          tip(`供货单 ${modal.d.id} 物流信息已更新`);
          setModal(null);
        }}
      />}
      {toast}
      {batch === "template" && <TemplateDrawer rows={canShipRows} onClose={() => setBatch(null)} />}
      {batch === "import" && <ImportDrawer rows={canShipRows} onClose={() => setBatch(null)} onDone={(items) => tip(`已导入发货 ${applyShipBatch(items)} 单`)} />}
      {batch === "batch" && <BatchShipDrawer rows={canShipRows} onClose={() => setBatch(null)} onDone={(items) => tip(`已批量发货 ${applyShipBatch(items)} 单`)} />}
      </>)}
    </>
  );
}

/* ============================================================================
   一件代发 —— 供应商视角的销售订单
   页面形态与租户后台「订单管理」逐项一致（同一批单、两个视角）：
   Tab / 筛选 / 列 / 详情抽屉 / 发货弹窗均照订单管理；发货由供应商处理，售后由总部审核退款、供应商只做签收验收
   ============================================================================ */
const SUP_STEPS = ["买家下单", "买家付款", "供应商发货", "买家签收", "交易完成"];
const supHasShipped = (o) => !!(o.shippedQty > 0 || o.tracking || ["已发货", "已完成"].includes(o.status));
/* 物流信息可改的窗口：已发货且在途（未签收）；买家签收 / 售后中 / 已完成 / 已关闭一律锁定 */
const canEditLogistics = (o) => !!o.tracking && !/已签收/.test(o.track || "") && ["待发货", "已发货"].includes(o.status);

export function SupDirect({ onNav }) {
  const [tab, setTab] = useState("全部");
  const [detail, setDetail] = useState(null);
  const [ship, setShip] = useState(null);
  const [after, setAfter] = useState(null);   // 查看售后
  const [track, setTrack] = useState(null);   // 查看物流
  const [edit, setEdit] = useState(null);     // 修改物流
  const [batch, setBatch] = useState(null);   // 批量发货 / 导入发货 / 下载发货模板
  const [toast, tip] = useToast();
  /* 代发单 = 供应商直发消费者（快递）：与租户订单管理页互补——那页恰好过滤掉这批单 */
  const mine = orderStore.use().filter((o) => o.supplyMode === "供应商直配" && o.delivery === "快递发货");
  const rows = mine.filter((o) =>
    tab === "全部" ? true
      : tab === "已关闭" ? ["已关闭", "已全额退款", "已取消"].includes(o.status)
        : o.status === tab);
  /* 批量回传只针对待发货（含部分发货、剩余可再发）的单 */
  const canShipRows = mine.filter((o) => o.status === "待发货");
  const pg = usePaged(rows);

  /* 发货回写：订单与供货任务同源同步（同一张物理单据，两端一致） */
  const doShip = (o, p) => {
    const shipped = (o.shippedQty || 0) + p.qty;
    const full = shipped >= o.qty;
    const ts = new Date().toISOString().slice(0, 19).replace("T", " ");
    const from = p.from || o.shipFrom;
    orderStore.set((os) => os.map((x) => (x.id === o.id
      ? { ...x, shippedQty: shipped, carrier: p.carrier, tracking: p.tracking, shipFrom: from, track: "已发货 " + ts, status: full ? "已发货" : x.status }
      : x)));
    if (o.supplyNo) patchDoc(o.supplyNo, { sent: shipped, carrier: p.carrier, tracking: p.tracking, shipFrom: from, track: "已发货 " + ts, status: full ? "已发货" : "待发货" });
    return full;
  };

  /* 批量回传（批量发货 / 导入）：默认用地址簿的「发货地址」，逐单同步订单与供货任务 */
  const shipMany = (items) => {
    const list = addrStore.get().filter((a) => a.type === "ship");
    const def = list.find((a) => a.isDefault) || list[0];
    const from = def ? `${def.region} ${def.detail}` : "";
    items.forEach(({ order, carrier, tracking }) =>
      doShip(order, { qty: order.qty - (order.shippedQty || 0), carrier, tracking, from }));
    return items.length;
  };

  /* 修改物流：只改快递公司与单号，不动发货/签收时间；留痕便于追溯 */
  const doEditTrack = (o, p) => {
    const ts = new Date().toISOString().slice(0, 19).replace("T", " ");
    const from = o.tracking;
    orderStore.set((os) => os.map((x) => (x.id === o.id
      ? { ...x, carrier: p.carrier, tracking: p.tracking, trackEditedAt: ts, trackEditFrom: from }
      : x)));
    if (o.supplyNo) patchDoc(o.supplyNo, { carrier: p.carrier, tracking: p.tracking, trackEditedAt: ts, trackEditFrom: from });
  };

  return (
    <>
      <div className="alert"><span className="ic">i</span>一件代发（供应商直发消费者 · 快递）订单由本后台<b style={{ margin: "0 4px" }}>发货</b>；售后是<b style={{ margin: "0 4px" }}>总部管钱、供应商管货</b>——总部审核与退款，本后台只做签收验收</div>

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

      <div className="batchbar">
        <button className="act" onClick={() => setBatch("batch")}>批量发货</button>
        <button className="act" onClick={() => setBatch("import")}>导入发货</button>
        <button className="act" onClick={() => setBatch("template")}>下载发货模板</button>
        <span className="note" style={{ marginLeft: 4 }}>
          面向当前 {canShipRows.length} 笔待发货订单——批量发货在线逐单填单号；导入发货用于线下填好模板后批量回传
        </span>
      </div>

      <div className="tbl-wrap">
        <table className="tbl-tight">
          <thead>
            <tr>
              <th style={{ minWidth: 196 }}>商品信息</th>
              <th style={{ minWidth: 84 }}>售后信息</th>
              <th style={{ minWidth: 120 }}>实收金额</th>
              <th style={{ minWidth: 180 }}>买家/收货人</th>
              <th style={{ minWidth: 132 }}>下单时间</th>
              <th style={{ minWidth: 120 }}>订单状态</th>
              <th style={{ minWidth: 88 }}>订单类型</th>
              <th style={{ minWidth: 88 }}>买家备注</th>
              <th style={{ minWidth: 96 }}>订单操作</th>
            </tr>
          </thead>
          <tbody>
            {pg.pageRows.map((o) => (
              <tr key={o.id}>
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
                <td className="mono">{o.createdAt}</td>
                <td>
                  <div>{o.status}</div>
                  {o.payMethod && <small>支付方式: {o.payMethod}</small>}
                  {o.payTime && <small>支付时间: {o.payTime}</small>}
                  {o.tracking && <small>物流单号: {o.tracking}</small>}
                  {o.shippedQty > 0 && o.status === "待发货" && <small style={{ color: "#f5a623" }}>部分发货：已发 {o.shippedQty}/{o.qty} 件，可再发</small>}
                </td>
                <td className="tw">{o.orderType || "销售订单"}</td>
                <td className="tw">{o.buyerNote || "-"}</td>
                <td>
                  <div className="op-col">
                    {o.status === "待发货" && <button onClick={() => setShip(o)}>发货</button>}
                    {canEditLogistics(o) && <button className="gray" onClick={() => setEdit(o)}>修改物流</button>}
                    {o.tracking && <button className="gray" onClick={() => setTrack(o)}>物流轨迹</button>}
                    {o.status === "售后中"
                      ? <button className="gray" onClick={() => onNav && onNav("售后处理")}>售后处理</button>
                      : <button className="gray" onClick={() => setDetail(o)}>详情</button>}
                  </div>
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={9} style={{ textAlign: "center", padding: 40, color: "#999" }}>暂无订单</td></tr>}
          </tbody>
        </table>
      </div>

      <Pager {...pg} />

      {toast}
      {detail && <SupOrderDetailDrawer order={detail} onClose={() => setDetail(null)} onShip={() => { setShip(detail); setDetail(null); }} onNote={() => tip("商家备注已保存")} />}
      {ship && <SupOrderShipModal order={ship} onClose={() => setShip(null)} onDone={(p) => {
        const full = doShip(ship, p);
        tip(full ? `订单 ${ship.no} 已发货` : `订单 ${ship.no} 部分发货：已发 ${(ship.shippedQty || 0) + p.qty}/${ship.qty} 件，剩余可再发`);
        setShip(null);
      }} />}
      {after && <SupAfterSalePop order={after} onClose={() => setAfter(null)} />}
      {track && <SupOrderTrackModal order={track} onClose={() => setTrack(null)} />}
      {batch === "template" && <SupOrderTemplateDrawer rows={canShipRows} onClose={() => setBatch(null)} />}
      {batch === "import" && <SupOrderImportDrawer rows={canShipRows} onClose={() => setBatch(null)} onDone={(items) => { tip(`已导入发货 ${shipMany(items)} 单`); }} />}
      {batch === "batch" && <SupOrderBatchShipDrawer rows={canShipRows} onClose={() => setBatch(null)} onDone={(items) => { tip(`已批量发货 ${shipMany(items)} 单`); }} />}
      {edit && <SupEditTrackModal
        no={edit.no}
        desc={`${edit.product}　${edit.spec}`}
        carrier={edit.carrier}
        tracking={edit.tracking}
        onClose={() => setEdit(null)}
        onDone={(p) => {
          doEditTrack(edit, p);
          tip(`订单 ${edit.no} 物流信息已更新`);
          setEdit(null);
        }}
      />}
    </>
  );
}

/* ---------------- 查看售后（供应商侧） ---------------- */
function SupAfterSalePop({ order, onClose }) {
  return (
    <div className="gmock" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="gbox">
        <b>售后信息</b>
        <p>订单号 {order.no} · {order.product}</p>
        <div style={{ marginTop: 14, fontSize: 13, lineHeight: 2.2, color: "var(--text-2)" }}>
          <div>售后状态：<span className="tag warn">{order.afterSale}</span></div>
          <div>关联供货单：<span className="mono">{order.supplyNo || "—"}</span></div>
          <div>发货状态：{supHasShipped(order) ? "已发货" : "未发货"}</div>
        </div>
        <div className="note" style={{ marginTop: 12, lineHeight: 1.9 }}>
          一件代发的售后：总部审核与退款（钱款），本后台只做签收验收（货源）。详见「供货 → 售后处理」。
        </div>
        <div className="gfoot">
          <button className="btn primary" onClick={onClose}>知道了</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- 物流轨迹（代发包裹；与订单管理同版式） ---------------- */
function SupOrderTrackModal({ order, onClose }) {
  const raw = order.track || "";
  const signed = /已签收/.test(raw);
  const stamp = (re) => (raw.replace(re, "").trim() || "—");

  const nodes = [
    { t: "订单已支付", d: supHasShipped(order) ? "订单已支付，等待发货" : "等待供应商发货", at: order.payTime || order.createdAt, done: true },
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
        {order.trackEditedAt && (
          <div className="note" style={{ marginTop: 14, marginBottom: 0, color: "#b7791f", lineHeight: 1.9 }}>
            物流信息于 {order.trackEditedAt} 修改（原单号 {order.trackEditFrom || "—"}）
            {canEditLogistics(order) ? "，买家签收前仍可再次修改" : "，订单已签收，不可再修改"}
          </div>
        )}
        <div className="gfoot">
          <button className="btn primary" onClick={onClose}>关闭</button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   代发订单详情（与租户订单管理详情同版式：左状态/右进度条 → 买家备注条 → 5 列信息块 → 商品表）
   ============================================================================ */
function SupOrderDetailDrawer({ order, onClose, onShip, onNote }) {
  const total = order.amounts["应收金额"];
  const doneN = { 待付款: 1, 待发货: 2, 已发货: 3, 售后中: 3, 已完成: 5, 已全额退款: 2, 已取消: 1, 已关闭: 1 }[order.status] ?? 2;

  return (
    <div className="drawer-mask" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="drawer" style={{ width: 1180 }}>
        <header>订单详情<button className="x" onClick={onClose}>×</button></header>
        <div className="body" style={{ padding: "18px 22px 30px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <button className="btn" style={{ padding: 0, width: 22, height: 22, fontSize: 16 }} onClick={onClose}>‹</button>
            <span style={{ color: "#666" }}>订单编号：<span className="mono">{order.no}</span></span>
          </div>

          <div style={{ border: "1px solid #ececec", borderRadius: 4, display: "flex", padding: "20px 24px", alignItems: "center" }}>
            <div style={{ width: 250, flex: "none" }}>
              <div style={{ fontSize: 22, color: "#333", marginBottom: 8 }}>{order.status}</div>
              <div style={{ color: "#999", fontSize: 13, marginBottom: 14 }}>
                {order.status === "待付款" ? "等待买家付款" : order.status === "待发货" ? "买家已付款，待供应商发货" : order.status === "已发货" ? "供应商已发货，等待买家签收" : order.status === "售后中" ? "售后处理中，订单已挂起" : order.status === "已完成" ? "交易完成" : order.status === "已全额退款" ? "已退款，供货任务已关闭" : "—"}
              </div>
              {order.status === "待发货" && <button className="btn primary" style={{ marginBottom: 14 }} onClick={onShip}>发货</button>}
              <div style={{ fontSize: 13, color: "#666" }}>商家备注：<span onClick={onNote} style={{ color: "#25c7a5", cursor: "pointer" }}>备注</span></div>
            </div>

            <div style={{ borderLeft: "1px solid #ececec", flex: 1, paddingLeft: 30, display: "flex", alignItems: "flex-start" }}>
              {SUP_STEPS.map((s, i) => (
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

          <div style={{ background: "#fdf9d0", padding: "12px 20px", marginTop: 16, fontSize: 13, color: "#666" }}>买家备注：{order.buyerNote || ""}</div>

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
              <div className="note" style={{ lineHeight: 2.1, fontSize: 13 }}>
                <div>配送方式：{order.delivery}</div>
                {order.shipFrom && <div>发货地址：{order.shipFrom}</div>}
              </div>
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
                <td className="tw">￥{order.amounts["实收金额"] && order.amounts["实收金额"] !== "-" ? order.amounts["实收金额"] : total}</td><td className="tw">{order.afterSale === "售后处理中" ? "退款中" : (order.status === "已全额退款" || order.afterSale === "售后完成") ? "已退款" : "未退款"}</td><td className="tw">{supHasShipped(order) ? "已发货" : "未发货"}</td>
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
   发货弹窗（与订单管理发货弹窗同版式；发货地址 = 供应商自己的）
   ============================================================================ */
function SupOrderShipModal({ order, onClose, onDone }) {
  const remainQty = order.qty - (order.shippedQty || 0);
  const [qty, setQty] = useState(remainQty);
  const [carrier, setCarrier] = useState("");
  const [tracking, setTracking] = useState("");
  /* 发货地址取地址簿中「发货地址」类；默认地址优先选中 */
  const addresses = addrStore.use().filter((a) => a.type === "ship");
  const [addrId, setAddrId] = useState(() => (addresses.find((a) => a.isDefault) || addresses[0] || {}).id);

  return (
    <div className="drawer-mask" style={{ justifyContent: "center", alignItems: "center" }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="drawer" style={{ width: 820, height: "auto", maxHeight: "90vh", borderRadius: 4 }}>
        <header>发货<button className="x" onClick={onClose}>×</button></header>
        <div className="body" style={{ padding: "16px 22px 22px" }}>
          <table className="tbl-tight">
            <thead>
              <tr>
                <th style={{ width: 40 }}><input type="checkbox" defaultChecked /></th>
                <th>商品信息</th><th className="tw">单价(元)</th><th className="tw">数量/单位</th>
                <th className="tw">未发货数量</th><th className="tw">发货数量</th><th className="tw">发货状态</th><th className="tw">运单号</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><input type="checkbox" defaultChecked /></td>
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
            <span className="note" style={{ marginLeft: "auto" }}>地址在「地址库」维护，这里只做选择</span>
          </div>
          <table className="tbl-tight">
            <thead><tr><th style={{ width: 46, background: "#fff" }}></th><th className="tw">联系人</th><th className="tw">联系方式</th><th>地址</th></tr></thead>
            <tbody>
              {addresses.map((a) => (
                <tr key={a.id}>
                  <td><input type="radio" checked={addrId === a.id} onChange={() => setAddrId(a.id)} /></td>
                  <td className="tw">{a.name} {a.isDefault && <span style={{ color: "#999" }}>【默认】</span>}</td>
                  <td className="tw mono">{a.phone}</td>
                  <td>{a.region} {a.detail}</td>
                </tr>
              ))}
              {!addresses.length && <tr><td colSpan={4} style={{ textAlign: "center", padding: 20, color: "#999" }}>暂无发货地址，请先添加</td></tr>}
            </tbody>
          </table>

          <div style={{ display: "flex", gap: 40, marginTop: 22, alignItems: "center", fontSize: 13, color: "#666" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span>快递公司信息：<i className="req">*</i></span>
              <select className="ctl" value={carrier} onChange={(e) => setCarrier(e.target.value)} style={{ width: 220, height: 32, color: carrier ? "#333" : "#bbb" }}><option value="">请选择或搜索快递公司</option>
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
          <button className="btn primary" disabled={qty < 1 || !carrier || !tracking.trim()} onClick={() => {
            const picked = addresses.find((a) => a.id === addrId);
            onDone({ qty, carrier, tracking: tracking.trim(), from: picked ? `${picked.region} ${picked.detail}` : "" });
          }}>确定</button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   修改物流（发货填错可改）
   可改窗口：已发货且在途（未签收）；买家签收后 / 售后中 / 已完成 / 已关闭一律锁定
   ============================================================================ */
function SupEditTrackModal({ no, desc, carrier: c0, tracking: t0, lockText, syncText, onClose, onDone }) {
  const [carrier, setCarrier] = useState(c0 || "");
  const [tracking, setTracking] = useState(t0 || "");
  const changed = carrier !== (c0 || "") || tracking.trim() !== (t0 || "");

  return (
    <div className="drawer-mask" style={{ justifyContent: "center", alignItems: "center" }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="drawer" style={{ width: 620, height: "auto", borderRadius: 4 }}>
        <header>修改物流<button className="x" onClick={onClose}>×</button></header>
        <div className="body">
          <div className="alert"><span className="ic">i</span>发货后填错可在此修改；<b style={{ margin: "0 4px" }}>{lockText || "买家签收后不可再改"}</b>。{syncText || "修改会同步更新供货任务与消费者查到的物流。"}</div>

          <div className="frow">
            <label>单号</label>
            <div className="fc">{desc}　<span className="mono">{no}</span></div>
          </div>
          <div className="frow">
            <label>原物流</label>
            <div className="fc" style={{ color: "var(--text-2)" }}>{c0 || "—"}　<span className="mono">{t0 || "—"}</span></div>
          </div>
          <div className="frow">
            <label><i>*</i>快递公司</label>
            <div className="fc">
              <select className="ctl" value={carrier} onChange={(e) => setCarrier(e.target.value)} style={{ maxWidth: 260 }}>
                <option value="">请选择快递公司</option>
                {CARRIERS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="frow">
            <label><i>*</i>快递单号</label>
            <div className="fc">
              <input className="ctl" style={{ maxWidth: 260 }} value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="请输入快递单号" />
            </div>
          </div>
        </div>
        <div className="foot">
          <button className="btn plain" onClick={onClose}>取消</button>
          <button className="btn primary" disabled={!carrier || !tracking.trim() || !changed} onClick={() => onDone({ carrier, tracking: tracking.trim() })}>保存</button>
        </div>
      </div>
    </div>
  );
}
/* ============================================================================
   代发批量回传三件套（订单维度模板）
   列：订单号 / 收件人 / 收件人电话 / 收货地址 / 商品 / 规格 / 待发数量（锁定）+ 快递公司 / 物流单号（待填）
   与「发总部仓 / 发门店」的供货单维度模板区分：代发收货人是消费者，无发货主体 / 收货主体
   ============================================================================ */
const ORD_TPL_COLS = [
  { k: "no", t: "订单号", locked: true, get: (o) => o.no },
  { k: "receiver", t: "收件人", locked: true, get: (o) => o.buyer["收件人"] || o.buyer["昵称"] || "" },
  { k: "phone", t: "收件人电话", locked: true, get: (o) => o.buyer["收件人电话"] || "" },
  { k: "addr", t: "收货地址", locked: true, get: (o) => o.buyer["收件人地址"] || "" },
  { k: "product", t: "商品", locked: true, get: (o) => o.product },
  { k: "spec", t: "规格", locked: true, get: (o) => o.spec },
  { k: "qty", t: "待发数量", locked: true, get: (o) => o.qty - (o.shippedQty || 0) },
  { k: "carrier", t: "快递公司", locked: false },
  { k: "tracking", t: "物流单号", locked: false },
];

function downloadOrderCsv(rows) {
  const head = ORD_TPL_COLS.map((c) => c.t).join(",");
  const body = rows.map((o) => ORD_TPL_COLS.map((c) => (c.locked ? `"${c.get(o) ?? ""}"` : "")).join(",")).join("\n");
  const csv = "﻿" + head + "\n" + body;
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url; a.download = "一件代发-发货模板.csv";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

/* ---------------- 下载发货模板（订单维度） ---------------- */
function SupOrderTemplateDrawer({ rows, onClose }) {
  const [downloaded, setDownloaded] = useState(false);
  return (
    <div className="drawer-mask" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="drawer" style={{ width: 1180 }}>
        <header>下载发货模板<button className="x" onClick={onClose}>×</button></header>
        <div className="body">
          <div className="alert"><span className="ic">i</span>模板已按待发货代发订单预填好——<b style={{ margin: "0 4px" }}>灰色列是锁定列，禁止修改</b>；只需填「快递公司」和「物流单号」两列，填好后用「导入发货」回传。</div>

          <div className="tbl-wrap">
            <table className="tbl-tight">
              <thead><tr>{ORD_TPL_COLS.map((c) => (<th key={c.k} className={c.locked ? "" : "col-new"} data-hl={c.locked ? undefined : "可填"}>{c.t}{c.locked && <span style={{ color: "#bbb", fontWeight: 400, marginLeft: 4 }}>🔒</span>}</th>))}</tr></thead>
              <tbody>
                {rows.map((o) => (
                  <tr key={o.id}>
                    {ORD_TPL_COLS.map((c) => (
                      <td key={c.k} className={c.locked ? "tw" : "col-new tw"}
                        style={c.locked ? { background: "#fafafa", color: "#8a949d" } : undefined}>
                        {c.locked ? (c.get(o) ?? "") : <span style={{ color: "#bbb" }}>（待填写）</span>}
                      </td>
                    ))}
                  </tr>
                ))}
                {!rows.length && <tr><td colSpan={ORD_TPL_COLS.length} style={{ textAlign: "center", padding: 30, color: "#999" }}>暂无待发货订单</td></tr>}
              </tbody>
            </table>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
            <button className="btn plain" onClick={onClose}>关闭</button>
            <button className="btn primary" onClick={() => { downloadOrderCsv(rows); setDownloaded(true); }}>
              {downloaded ? "已下载，可再次下载" : "下载模板"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- 导入发货（订单维度：下载模板 → 导入文件 → 确认 → 成功） ---------------- */
function SupOrderImportDrawer({ rows, onClose, onDone }) {
  const [step, setStep] = useState(0);
  const [filled, setFilled] = useState({});
  const [count, setCount] = useState(0);
  const [err, setErr] = useState("");

  React.useEffect(() => {
    /* 模拟：导入一份已填好的模板 */
    const f = {};
    rows.forEach((o, i) => { f[o.id] = { carrier: "顺丰速运", tracking: "SF77120045" + String(30 + i) }; });
    setFilled(f);
  }, []);

  const submit = () => {
    const miss = rows.filter((o) => !filled[o.id]?.carrier || !filled[o.id]?.tracking);
    if (miss.length) return setErr(`有 ${miss.length} 行未填快递公司或物流单号，导入会被拦下`);
    setErr("");
    if (onDone) onDone(rows.map((o) => ({ order: o, carrier: filled[o.id].carrier, tracking: filled[o.id].tracking })));
    setCount(rows.length);
    setStep(3);
  };

  const steps = ["下载模板", "导入发货文件", "确认发货", "发货成功"];

  return (
    <div className="drawer-mask" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="drawer" style={{ width: 1180 }}>
        <header>导入发货<button className="x" onClick={onClose}>×</button></header>
        <div className="body">
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
              <div className="alert"><span className="ic">i</span>先下载模板：已按待发货代发订单预填好，<b style={{ margin: "0 4px" }}>锁定列不可修改</b>，只需填「快递公司」和「物流单号」。</div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button className="btn plain" onClick={() => downloadOrderCsv(rows)}>下载发货模板</button>
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
                <button className="btn plain" style={{ marginTop: 12 }} onClick={() => setStep(2)}>模拟上传「一件代发-发货模板(已填).csv」</button>
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
                  <thead><tr><th style={{ width: 44 }}>行</th>{ORD_TPL_COLS.map((c) => (<th key={c.k} className={c.locked ? "" : "col-new"} data-hl={c.locked ? undefined : "可填"}>{c.t}{c.locked && <span style={{ color: "#bbb", fontWeight: 400, marginLeft: 4 }}>🔒</span>}</th>))}</tr></thead>
                  <tbody>
                    {rows.map((o, i) => (
                      <tr key={o.id}>
                        <td>{i + 1}</td>
                        {ORD_TPL_COLS.map((c) => (
                          <td key={c.k} className={c.locked ? "tw" : "col-new tw"} style={c.locked ? { background: "#fafafa", color: "#8a949d" } : undefined}>
                            {c.locked ? (c.get(o) ?? "") : (
                              <input value={filled[o.id]?.[c.k] ?? ""} readOnly style={{ height: 28, border: 0, background: "transparent", padding: 0 }} />
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
                订单状态与供货任务已同步更新，消费者可查物流。
              </div>
              <button className="btn primary" style={{ marginTop: 20 }} onClick={onClose}>完成</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- 批量发货（在线：勾选多单 + 统一快递公司 + 逐单运单号） ---------------- */
function SupOrderBatchShipDrawer({ rows, onClose, onDone }) {
  const [carrier, setCarrier] = useState("顺丰速运");
  const [done, setDone] = useState(0);
  const [sel, setSel] = useState(() => Object.fromEntries(rows.map((o) => [o.id, true])));
  const [tracking, setTracking] = useState(() => Object.fromEntries(rows.map((o, i) => [o.id, "SF77120045" + String(60 + i)])));
  const [err, setErr] = useState("");

  const submit = () => {
    const picked = rows.filter((o) => sel[o.id]);
    if (!picked.length) return setErr("请至少勾选一笔订单");
    const miss = picked.filter((o) => !tracking[o.id]?.trim());
    if (miss.length) return setErr(`有 ${miss.length} 行未填物流单号`);
    setErr("");
    if (onDone) onDone(picked.map((o) => ({ order: o, carrier, tracking: tracking[o.id].trim() })));
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
              每单的订单状态与供货任务已同步更新。
            </div>
            <button className="btn primary" style={{ marginTop: 20 }} onClick={onClose}>完成</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="drawer-mask" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="drawer" style={{ width: 940 }}>
        <header>批量发货<button className="x" onClick={onClose}>×</button></header>
        <div className="body">
          <div className="alert"><span className="ic">i</span>批量发货<b style={{ margin: "0 4px" }}>统一快递公司 + 逐单运单号</b>，收货人可不同；发货地址取地址簿的默认发货地址。</div>
          <div className="frow">
            <label><i>*</i>快递公司</label>
            <div className="fc"><select value={carrier} onChange={(e) => setCarrier(e.target.value)} style={{ maxWidth: 260 }}>
              {CARRIERS.map((c) => <option key={c}>{c}</option>)}
            </select></div>
          </div>
          <table className="tbl-tight">
            <thead><tr><th style={{ width: 40 }}><input type="checkbox" defaultChecked /></th><th className="tw">订单号</th><th>收货人</th><th className="tw">商品</th><th className="tw">数量</th><th className="tw">物流单号</th></tr></thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id}>
                  <td><input type="checkbox" checked={!!sel[o.id]} onChange={(e) => setSel((s) => ({ ...s, [o.id]: e.target.checked }))} /></td>
                  <td className="tw mono">{o.no}</td>
                  <td>{(o.buyer["收件人"] || o.buyer["昵称"])}<small>{o.buyer["收件人地址"] || "—"}</small></td>
                  <td className="tw">{o.emoji} {o.product}</td>
                  <td className="tw mono">{o.qty - (o.shippedQty || 0)}</td>
                  <td className="tw"><input value={tracking[o.id] ?? ""} onChange={(e) => setTracking((s) => ({ ...s, [o.id]: e.target.value }))} style={{ height: 28, width: 150 }} /></td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan={6} style={{ textAlign: "center", padding: 30, color: "#999" }}>暂无待发货订单</td></tr>}
            </tbody>
          </table>
          {err && <div className="err" style={{ marginTop: 12 }}>{err}</div>}
        </div>
        <div className="foot">
          <button className="btn plain" onClick={onClose}>取消</button>
          <button className="btn primary" onClick={submit}>确认发货</button>
        </div>
      </div>
    </div>
  );
}

export const SupToHq = () => <SupTasks leg="supplier_to_hq" title="发总部仓" desc="供应商 → 总部仓供货任务" />;
export const SupToStore = () => <SupTasks leg="supplier_inbound" title="发门店" desc="供应商直配门店任务" />;

/* ---------------- 供应商发货弹窗（版式与真实 SaaS「发货」弹窗一致） ---------------- */
function SupShipModal({ doc, onClose, onDone }) {
  /* 汇总批次整批发，不逐商品问数量 */
  const lines = itemsOf(doc).map((it) => {
    const remain = doc.status === "部分收货" ? it.qty - (it.received || 0) : it.qty - (it.sent || 0);
    return { product: it.product, spec: it.spec, emoji: it.emoji, qty: it.qty, out: Math.max(0, remain), from: it.from || [] };
  });
  const [pk, setPk] = useState([{ carrier: "", tracking: "" }]);
  const setPkAt = (i, k, v) => setPk((a) => a.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  const totalOut = lines.reduce((a, x) => a + x.out, 0);
  const parcels = pk.filter((x) => x.carrier && x.tracking.trim());
  /* 发货地址只从供应商自己的「地址库 › 发货地址」里选，默认地址唯一 */
  const addresses = addrStore.use().filter((a) => a.type === "ship" && a.owner === SUPPLIER_SELF);
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
                <th style={{ width: 40 }}><input type="checkbox" /></th>
                <th>商品信息</th><th className="tw">订单关联</th><th className="tw">单价(元)</th><th className="tw">数量/单位</th>
                <th className="tw">未发货数量</th><th className="tw">本次发货</th><th className="tw">发货状态</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => (
                <tr key={l.product}>
                  <td><input type="checkbox" checked readOnly /></td>
                  <td>
                    <div className="prod-cell">
                      <span className="thumb" style={{ background: "#f4f7f6" }}>{l.emoji}</span>
                      <div><div>{l.product}</div><small>{l.spec}</small></div>
                    </div>
                  </td>
                  <td className="tw">
                    <span onClick={() => setRel(l)} style={{ color: "#25c7a5", cursor: "pointer" }}>{l.from.length} 笔订单</span>
                  </td>
                  <td className="tw"><span className="tag gray">已脱敏</span></td>
                  <td className="tw">{l.qty}</td>
                  <td className="tw mono">{l.out}</td>
                  <td className="tw"><span style={{ color: "#25c7a5" }}>本次发 {l.out}</span></td>
                  <td className="tw">{doc.status}</td>
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
            <span className="note" style={{ marginLeft: "auto" }}>地址在「地址库」维护，这里只做选择</span>
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
              {!addresses.length && <tr><td colSpan={4} className="note" style={{ padding: 16 }}>地址库里还没有发货地址，请先到「地址库」添加</td></tr>}
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
                    <select className="ctl" value={p.carrier} onChange={(e) => setPkAt(i, "carrier", e.target.value)} style={{ width: 180, height: 30, color: p.carrier ? "#333" : "#bbb" }}>
                      <option value="">请选择或搜索快递公司</option>
                      {CARRIERS.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </td>
                  <td className="tw"><input className="ctl" style={{ height: 30 }} placeholder="请输入快递单号" value={p.tracking} onChange={(e) => setPkAt(i, "tracking", e.target.value)} /></td>
                  <td>{pk.length > 1 && <button className="btn link" onClick={() => setPk((a) => a.filter((_, j) => j !== i))}>删除</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="note">这一批（{lines.length} 种商品、{totalOut} 件）整批发往 {doc.receiver}；装不下时可以拆成多个包裹，每个包裹一条运单号。</div>

        </div>
        <div className="foot">
          <button className="btn plain" onClick={onClose}>取消</button>
          <button className="btn primary" disabled={!parcels.length || totalOut < 1}
            onClick={() => onDone({ lines: lines.filter((x) => x.out > 0).map((x) => ({ product: x.product, qty: x.out })), packages: parcels })}>确认发货</button>
        </div>
      </div>
      {rel && <OrderRefsPop item={rel} orders={orderStore.get()} mask onClose={() => setRel(null)} />}
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
              <div className="field"><label>供货状态</label><span className={`tag ${doc.status === "收货异常" ? "danger" : ""}`}>{doc.status === "部分收货" ? "已发货" : doc.status}</span>{doc.status === "部分收货" && <span className="note" style={{ display: "inline", marginLeft: 6, color: "#f5a623" }}>部分收货</span>}</div>
            </div>
            {doc.isMakeup && (
              <div className="row"><div className="field"><label>单据类型</label>
                <span className="tag" style={{ marginRight: 8 }}>补发单</span>
                <span className="note" style={{ display: "inline" }}>源差异单 <span className="mono">{doc.reshipOf}</span>　原供货单 <span className="mono">{diffStore.get().find((x) => x.id === doc.reshipOf)?.supplyNo || "—"}</span></span>
              </div></div>
            )}
          </div>

          {doc.status === "收货异常" && <ReceiveAbnormal doc={doc} ro />}

          <h3 style={{ fontSize: 14, margin: "0 0 8px" }}>供货商品明细</h3>
          <table className="tbl-tight">
            <thead><tr><th>商品</th><th className="tw">应发数量</th><th className="tw">已发数量</th><th className="tw">累计实收</th></tr></thead>
            <tbody>
              {itemsOf(doc).map((it) => (
                <tr key={it.product}>
                  <td><div className="prod-cell"><span className="thumb" style={{ background: "#f4f7f6" }}>{it.emoji}</span><div><div>{it.product}</div><small>{it.spec}</small></div></div></td>
                  <td className="tw mono">{it.qty}</td><td className="tw mono">{it.sent || 0}</td><td className="tw mono">{it.received || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3 style={{ fontSize: 14, margin: "18px 0 8px" }}>收货信息</h3>
          <div style={{ lineHeight: 2 }}>
            <div>收货主体：{doc.receiver}</div>
            <div>收货地址：{doc.receiverAddr}</div>
          </div>

          <h3 style={{ fontSize: 14, margin: "18px 0 8px" }}>供货物流</h3>
          {packagesOf(doc).length ? (
            <div style={{ lineHeight: 2 }}>
              {packagesOf(doc).map((p, i) => (
                <div key={i} style={{ borderTop: i ? "1px solid var(--line)" : "none", paddingTop: i ? 8 : 0, marginTop: i ? 8 : 0 }}>
                  <div>包裹 {i + 1}：{p.carrier}　<span className="mono">{p.tracking}</span></div>
                  <div className="note">{p.track}</div>
                </div>
              ))}
              <button className="btn link" onClick={onTrack}>查看物流轨迹</button>
            </div>
          ) : <div className="note">尚未发货，暂无物流信息</div>}

        </div>
        <div className="foot"><button className="btn plain" onClick={onClose}>关闭</button></div>
      </div>
    </div>
  );
}

/* ---------------- 配送差异（总部上报单由本方审核，门店上报单只读+补发） ---------------- */
export function SupDiff() {
  const all = diffStore.use();
  const docs = supplierStore.use();
  const [tab, setTab] = useState("全部");
  const [audit, setAudit] = useState(null);
  const [ship, setShip] = useState(null);   // 本方补发单：差异单在配送差异页内直接发货
  const [toast, tip] = useToast();
  /* 与门店端 / 租户后台同一套状态 Tab；两种来源合并展示：
     总部上报（供应商 → 总仓）：本方审核 → 本方补发；门店上报：总部审核后本方执行补发 */
  const mine = all.filter((d) => d.leg.startsWith("供应商") && diffInTab(d.status, tab));
  const pgD = usePaged(mine);
  const makeupOf = (d) => (d.makeup ? docs.find((x) => x.id === d.makeup) : null);

  /* 审核通过 → 按「谁发货谁补发」生成补发供货单，进入本方发货列表（补发标签 + 关联原供货单） */
  const approveAudit = (d) => {
    const orig = [...supplierStore.get(), ...supplyStore.get()].find((x) => x.id === d.supplyNo);
    const reshipId = newFhdId();
    /* 补发只补**少的那几个商品**，不复制整批 */
    const miss = itemsOf(orig).map((it) => {
      const need = (it.sent || 0) - (it.received || 0);
      return need > 0 ? { ...it, qty: need, sent: 0, received: 0 } : null;
    }).filter(Boolean);
    const its = miss.length ? miss : [{ product: "补发商品", spec: "", emoji: "📦", qty: d.diffQty ?? 1, sent: 0, received: 0, from: [] }];
    const doc = {
      id: reshipId, leg: orig?.leg || "supplier_to_hq", source: "配送差异补发",
      batchAt: new Date().toISOString().slice(0, 19).replace("T", " "),
      shipper: d.shipper, receiver: orig?.receiver || "九天教育总仓", receiverAddr: orig?.receiverAddr || "",
      orderNos: ordersOf(orig), items: its, packages: [],
      qty: its.reduce((a, x) => a + x.qty, 0), sent: 0, received: 0, status: "待发货",
      supplyMode: orig?.supplyMode, goodsSource: orig?.goodsSource,
      isMakeup: true, reshipOf: d.id,
    };
    supplierStore.set((ds) => [doc, ...ds]);
    if (["supplier_to_hq", "supplier_inbound"].includes(doc.leg)) supplyStore.set((ds) => [doc, ...ds]);
    diffStore.set((ds) => ds.map((x) => (x.id === d.id ? { ...x, status: "待补发", makeup: reshipId } : x)));
    tip(`差异单 ${d.id} 审核通过，已生成补发供货单 ${reshipId}（在本页「补发任务」列点「发货」）`);
  };

  return (
    <>
      <div className="filters">
        <div className="row">
          <div className="field"><label>差异单号 / 供货单号</label><input className="ctl w-lg" placeholder="请输入差异单号或供货单号" /></div>
          <div className="field"><label>来源链路</label>
            <select className="ctl" defaultValue="全部"><option>全部</option><option>供应商 → 总仓</option><option>供应商 → 门店</option></select>
          </div>
          <div className="actions"><button className="btn primary">查询</button><button className="btn">重置</button></div>
        </div>
      </div>

      <div className="alert"><span className="ic">i</span><b>谁被上报谁审核</b>：总部上报（供应商 → 总仓）由本方审核、审核通过后补发；门店上报由总部审核，本方只读知情、执行补发任务</div>
      <div className="pills" style={{ marginTop: 12 }}>
        {DIFF_TABS.map((t) => (
          <span key={t} className={`pill ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>{t}</span>
        ))}
      </div>
      <div className="tbl-wrap">
        <table>
          <thead>
            <tr><th className="tw">差异单号</th><th className="tw">来源链路</th><th className="tw">关联供货单</th><th>差异摘要</th><th>异常原因 / 凭证</th><th className="tw">审核结果</th><th className="tw">状态</th><th className="tw">补发任务</th><th className="tw">操作</th></tr>
          </thead>
          <tbody>
            {pgD.pageRows.map((d) => (
              <tr key={d.id}>
                <td className="tw mono">{d.id}</td>
                <td className="tw">{d.leg}</td>
                <td className="tw mono">{d.supplyNo}</td>
                <td>{d.summary}</td>
                <td className="tw">{d.evidence}<div style={{ marginTop: 4 }}><EvidencePhotos evidence={d.evidence} size={30} /></div></td>
                <td className="tw">{d.status === "审核不通过" ? (<><span className="tag danger">不通过</span>{d.rejectReason && <small style={{ color: "#f5522e", display: "block" }}>原因：{d.rejectReason}</small>}</>) : ["待补发", "补发中", "补发完成"].includes(d.status) ? <span className="tag">已通过</span> : <span style={{ color: "#999" }}>—</span>}</td>
                <td className="tw"><span className={`tag ${d.status === "待举证" || d.status === "待补发" ? "warn" : ["待供应商审核", "待总部审核"].includes(d.status) ? "blue" : d.status === "审核不通过" ? "danger" : d.status === "已关闭" ? "gray" : ""}`}>{d.status}</span></td>
                <td className="tw">{d.makeup
                  ? <span className="mono" style={{ color: "#25c7a5" }}>{d.makeup}<small style={{ display: "block", fontFamily: "inherit" }}>{makeupOf(d) ? `${makeupOf(d).status}${makeupOf(d).tracking ? " · 已发物流" : ""}` : "—"}</small></span>
                  : <span style={{ color: "#999" }}>—</span>}</td>
                <td className="tw">
                  <div className="op-col">
                    {d.status === "待供应商审核" && <button onClick={() => setAudit(d)}>审核</button>}
                    {d.makeup && makeupOf(d)?.status === "待发货" && <button onClick={() => setShip(makeupOf(d))}>发货</button>}
                  </div>
                </td>
              </tr>
            ))}
            {!mine.length && <tr><td colSpan={9} style={{ textAlign: "center", padding: 40, color: "#999" }}>当前筛选下暂无涉己差异单</td></tr>}
          </tbody>
        </table>
      </div>
      <Pager {...pgD} />

      {toast}
      {ship && (
        <SupShipModal
          doc={ship}
          onClose={() => setShip(null)}
          onDone={(p) => {
            const sent = (ship.sent ?? 0) + p.qty;
            patchDoc(ship.id, {
              sent,
              carrier: p.carrier || ship.carrier,
              tracking: p.tracking || ship.tracking,
              track: "已发货 " + new Date().toISOString().slice(0, 19).replace("T", " "),
              status: sent >= ship.qty ? "已发货" : "待发货",
            });
            tip(`补发单 ${ship.id} 已发货 ${p.qty} 件`);
            /* 补发发货 → 差异单推进：待补发 → 补发中（在途） */
            if (sent >= ship.qty) diffStore.set((ds) => ds.map((x) => (x.makeup === ship.id && x.status === "待补发" ? { ...x, status: "补发中" } : x)));
            setShip(null);
          }}
        />
      )}
      {audit && (
        <DiffAuditModal
          row={audit}
          onClose={() => setAudit(null)}
          onPass={() => { approveAudit(audit); setAudit(null); }}
          onReject={(reason) => {
            diffStore.set((ds) => ds.map((x) => (x.id === audit.id ? { ...x, status: "审核不通过", rejectReason: reason } : x)));
            tip(`差异单 ${audit.id} 已驳回：${reason}（不补发，转线下处理）`);
            setAudit(null);
          }}
        />
      )}
    </>
  );
}

/* ---------------- 售后处理 ----------------
   供应商侧只做货源：总部审核通过后才轮到供应商，供应商只有「签收退货 / 验收」与「拒签」两个动作。
   · 审核（同意/拒绝）与退款都在总部（租户后台 · 售后管理），供应商不参与钱款决策
   · 仅退款单不涉及货，不在本页展示
   · 拒签不直接关单，转「退货异常」由总部裁决（认可拒签并关单，或仍向买家退款）
   · 金额只读展示（不可操作）；消费者信息仍脱敏 */
const AS_TABS = ["全部", "待总部审核", "待买家退货", "待签收", "待总部退款", "退货异常", "售后完成", "售后关闭"];
const asInTab = (status, tab) =>
  tab === "全部" ? true
    : tab === "待签收" ? status === "待供应商签收"
      : tab === "待总部审核" ? status === "待总部审核"
        : tab === "待买家退货" ? status === "待买家退货"
          : tab === "待总部退款" ? status === "待总部退款"
            : tab === "退货异常" ? status === "退货异常"
              : tab === "售后完成" ? status === "售后完成"
                : status === "售后关闭";
const AS_STEPS_OF = (row) =>
  row.status === "售后关闭" ? ["买家申请", "总部关闭"]
    : ["买家申请", "总部审核", "买家退货", "供应商签收", "总部退款", "售后完成"];
const AS_STEP_IDX = (row) =>
  row.status === "售后完成" ? 99
    : row.status === "售后关闭" ? 1
      : ({ 待总部审核: 1, 待买家退货: 2, 待供应商签收: 3, 退货异常: 3, 待总部退款: 4 }[row.status] ?? 1);
const asTone = (s) => (s === "待供应商签收" ? "warn" : s === "退货异常" ? "danger" : s === "售后关闭" ? "gray" : "blue");
const MASK = <span className="tag gray">已脱敏</span>;


const asNow = () => new Date().toISOString().slice(0, 19).replace("T", " ");

export function SupAfterSales() {
  /* 只展示涉及货源的售后（退货退款）；仅退款不涉及货，供应商不参与、不展示 */
  const rows = afterSaleStore.use().filter((r) => r.way === "退货退款");
  const [tab, setTab] = useState("全部");
  const [note, setNote] = useState(null);
  const [detail, setDetail] = useState(null);
  const [back, setBack] = useState(null);
  const [toast, tip] = useToast();
  const { sel, allSel, toggleAll, toggleOne } = useRowSelect(rows.map((r) => r.asNo));

  const act = (row, fn) => {
    const n = fn({ ...row, timeline: [...row.timeline] });
    afterSaleStore.set((rs) => rs.map((r) => (r.asNo === row.asNo ? n : r)));
    setDetail({ ...n });
  };
  const add = (r, t, lines) => { r.timeline = [...r.timeline, { t, lines: lines || [], at: asNow() }]; };

  /* 供应商只有这两个动作，都不涉及钱款 */
  const sign = (row) => {
    act(row, (r) => { add(r, "供应商已签收验收通过", ["验收结果：实物与申请一致，可退款"]); r.status = "待总部退款"; return r; });
    tip("已签收验收 → 待总部退款");
  };
  const refuse = (row, backNo, why) => {
    act(row, (r) => {
      add(r, "供应商拒绝签收退货", [`拒签原因：${why}`]);
      add(r, "供应商寄回商品", ["退货方式：快递", `物流单号：${backNo}`]);
      add(r, "进入退货异常，待总部处理", ["待总部裁决：认可拒签并关闭售后，或仍向买家退款"]);
      r.status = "退货异常";
      return r;
    });
    setBack(null);
    tip("已拒绝签收 → 退货异常，等总部裁决");
  };

  /* 分页 hooks 必须写在任何早退（详情页）之前，否则两次渲染 hooks 数量不一致会崩 */
  const pgA = usePaged(tab === "全部" ? rows : rows.filter((r) => asInTab(r.status, tab)));

  /* ---------------- 整页售后详情（复刻 SaaS + 进销存修改） ---------------- */
  if (detail) {
    const d = detail;
    const steps = AS_STEPS_OF(d);
    const idx = AS_STEP_IDX(d);
    const desc =
      d.status === "待总部审核" ? "买家已发起售后申请，等待总部审核（供应商暂无需处理）"
        : d.status === "待买家退货" ? "总部已同意，等待买家按寄回地址退货"
          : d.status === "待供应商签收" ? "买家已退货，待本供应商签收 / 验收"
            : d.status === "待总部退款" ? "已签收验收，等待总部退款（原路退回买家）"
              : d.status === "退货异常" ? "本供应商已拒签、商品已寄回买家，等总部裁决"
                : d.status === "售后完成" ? "售后已完成，退款由总部执行"
                  : d.status === "售后关闭" ? "总部已关闭该售后单"
                    : "—";
    return (
      <>
        <div className="card">
          <div className="cbody">
            <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 12, borderBottom: "1px solid var(--line)" }}>
              <span style={{ cursor: "pointer", fontSize: 16 }} onClick={() => setDetail(null)}>←</span>
              <b style={{ fontSize: 15 }}>售后详情</b>
            </div>
            <div style={{ display: "flex", gap: 40, padding: "12px 4px", fontSize: 13, color: "var(--text-2)" }}>
              <span>订单编号：<b className="mono" style={{ color: "var(--text-1)" }}>{d.no}</b></span>
              <span>维权编号：<b className="mono" style={{ color: "var(--text-1)" }}>{d.asNo}</b></span>
            </div>

            <div style={{ display: "flex", border: "1px solid var(--line)", borderRadius: 4 }}>
              <div style={{ width: 340, flex: "none", padding: "18px 20px", borderRight: "1px solid var(--line)" }}>
                <b style={{ fontSize: 15, color: "#25c7a5" }}>{d.status}</b>
                <div style={{ marginTop: 6, fontSize: 13, color: "var(--text-2)" }}>{desc}</div>
                <div style={{ marginTop: 14, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  {d.status === "待供应商签收" && (
                    <span className="hl" data-hl="供应商只做货源：签收验收 / 拒签">
                      <button className="btn primary" onClick={() => sign(d)}>签收验收</button>
                      <button className="btn plain" style={{ marginLeft: 10 }} onClick={() => setBack(d)}>拒绝签收</button>
                    </span>
                  )}
                  {d.status === "待总部审核" && (
                    <span style={{ fontSize: 12.5, color: "#f5a623" }}>等总部审核，审核通过后才会流转到本后台</span>
                  )}
                  {d.status === "待买家退货" && (
                    <span style={{ fontSize: 12.5, color: "#f5a623" }}>等待买家退货，退货寄回本供应商</span>
                  )}
                  {d.status === "待总部退款" && (
                    <span style={{ fontSize: 12.5, color: "#f5a623" }}>已验收，等待总部退款（原路退回买家）</span>
                  )}
                  {d.status === "退货异常" && (
                    <span className="hl" data-hl="拒签不直接关单，转总部裁决">
                      <span style={{ fontSize: 12.5, color: "#f5522e" }}>已拒签、商品已寄回买家，等总部裁决</span>
                    </span>
                  )}
                  {["售后完成", "售后关闭"].includes(d.status) && (
                    <span style={{ fontSize: 12.5, color: "#8a949d" }}>{d.status === "售后完成" ? "售后已完成，退款由总部执行" : "该售后单已由总部关闭"}</span>
                  )}
                  <span style={{ color: "#25c7a5", fontSize: 13, cursor: "pointer" }} onClick={() => setNote(d)}>备 注</span>
                </div>
                <div className="mhl" data-hl="改动：供应商只做货源，钱款归总部" style={{ marginTop: 16, marginBottom: 0, padding: "8px 10px", fontSize: 12.5, color: "var(--text-2)" }}>
                  本后台只处理货源：<b>签收退货 / 验收</b>（退货对象＝本供应商）。<br />
                  审核与退款都在<b>总部</b>，金额仅只读展示、不可操作。
                </div>
              </div>
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "18px 10px", overflowX: "auto" }}>
                <div style={{ display: "flex", alignItems: "center", width: "100%", maxWidth: 720, minWidth: 560 }}>
                  {steps.map((s, i) => {
                    const done = idx === 99 || i < idx || d.status === "售后关闭";
                    const cur = i === idx;
                    return (
                      <div key={s} style={{ display: "flex", alignItems: "center", flex: i === steps.length - 1 ? "none" : 1 }}>
                        <div style={{ textAlign: "center", flex: "none" }}>
                          <span style={{ width: 26, height: 26, borderRadius: "50%", display: "grid", placeItems: "center", margin: "0 auto",
                            border: cur ? "none" : "1px solid #25c7a5", background: cur ? "#25c7a5" : "#fff",
                            color: cur ? "#fff" : "#25c7a5", fontSize: 13 }}>
                            {done && !cur ? "✓" : i + 1}
                          </span>
                          <div style={{ marginTop: 6, fontSize: 13, color: cur || done ? "#25c7a5" : "#c2c2c2", fontWeight: cur ? 600 : 400, whiteSpace: "nowrap" }}>{s}</div>
                          {i === 0 && <div style={{ marginTop: 2, fontSize: 12, color: "#b6bdc4" }}>{d.timeline[0]?.at}</div>}
                          {i === steps.length - 1 && idx === 99 && <div style={{ marginTop: 2, fontSize: 12, color: "#b6bdc4" }}>{d.timeline[d.timeline.length - 1]?.at}</div>}
                        </div>
                        {i < steps.length - 1 && <div style={{ flex: 1, height: 1, background: i < idx ? "#25c7a5" : "#e5e5e5", margin: "0 8px", marginBottom: 26 }} />}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div style={{ background: "#fffbe6", border: "1px solid #ffe58f", borderRadius: 4, padding: "8px 14px", marginTop: 14, fontSize: 13, color: "var(--text-2)" }}>
              买家备注：{d.buyerNote}
            </div>

            <div style={{ display: "flex", gap: 24, marginTop: 16 }}>
              <div style={{ flex: 1, border: "1px solid var(--line)", borderRadius: 4, padding: "14px 18px" }}>
                <b style={{ fontSize: 13.5 }}>售后申请信息</b>
                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 9, fontSize: 13, color: "var(--text-2)" }}>
                  <div><span className="note">售后类型：</span>{d.way}</div>
                  <div><span className="note">退款金额：</span><b>￥{d.refund}</b></div>
                  <div><span className="note">退还积分：</span>{d.points}</div>
                  <div><span className="note">退款原因：</span>{d.reason}</div>
                  <div><span className="note">退款说明：</span>{d.refundNote}</div>
                </div>
              </div>
              <div style={{ flex: 1, border: "1px solid var(--line)", borderRadius: 4, padding: "14px 18px" }}>
                <b style={{ fontSize: 13.5 }}>订单信息</b>
                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 9, fontSize: 13, color: "var(--text-2)" }}>
                  <div><span className="note">应付金额：</span>{d.order.应付金额}</div>
                  <div><span className="note">实付金额：</span>{d.order.实付金额}</div>
                  <div><span className="note">配送方式：</span>{d.order.配送方式}</div>
                  <div><span className="note">物流状态：</span>{d.order.物流状态}</div>
                </div>
              </div>
              <div style={{ flex: 1, border: "1px solid var(--line)", borderRadius: 4, padding: "14px 18px" }}>
                <b style={{ fontSize: 13.5 }}>客户信息</b>
                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 9, fontSize: 13, color: "var(--text-2)" }}>
                  <div><span className="note">申请人：</span>{MASK}</div>
                  <div><span className="note">收货人：</span>{MASK}</div>
                  <div><span className="note">联系电话：</span>{MASK}</div>
                  <div><span className="note">收货地址：</span>{MASK}</div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 16, border: "1px solid var(--line)", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ padding: "10px 16px", fontWeight: 600, fontSize: 13.5, background: "var(--th-bg, #f7f7f7)" }}>商品信息</div>
              <table className="tbl-tight">
                <thead><tr><th>商品</th><th className="tw">单价(元)</th><th className="tw">数量</th><th className="tw">实付款</th><th className="tw">退货数量</th><th className="tw">退货金额</th></tr></thead>
                <tbody><tr>
                  <td><div className="prod-cell"><span className="thumb" style={{ background: "#f4f7f6" }}>{d.emoji}</span><div><div>{d.product}</div><small>规格：{d.spec}</small></div></div></td>
                  <td className="tw">￥{d.goods.单价}</td><td className="tw">{d.goods.数量}</td><td className="tw">￥{d.goods.实付款}</td><td className="tw">{d.goods.退货数量}</td><td className="tw">￥{d.goods.退货金额}</td>
                </tr></tbody>
              </table>
            </div>

            <div style={{ marginTop: 16, border: "1px solid var(--line)", borderRadius: 4, padding: "14px 18px" }}>
              <b style={{ fontSize: 13.5 }}>维权记录</b>
              <div style={{ marginTop: 12 }}>
                {d.timeline.map((t, i) => (
                  <div key={i} style={{ display: "flex", gap: 12 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "none" }}>
                      <span style={{ width: 10, height: 10, borderRadius: "50%", border: "2px solid #25c7a5", background: "#fff", marginTop: 5 }} />
                      {i < d.timeline.length - 1 && <span style={{ flex: 1, width: 1, background: "#dde5e2" }} />}
                    </div>
                    <div style={{ paddingBottom: 18, fontSize: 13 }}>
                      <div style={{ fontWeight: 600 }}>{t.t}</div>
                      {t.lines.map((l, j) => <div key={j} style={{ color: "var(--text-2)", marginTop: 4 }}>{l}</div>)}
                      <div style={{ color: "#b6bdc4", marginTop: 4 }}>{t.at}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {toast}
        {note && <AsNoteModal row={note} onClose={() => setNote(null)} onSaved={() => { tip("备注已保存"); setNote(null); }} />}
        {back && <RefuseModal row={back} onClose={() => setBack(null)} onOk={(no, why) => refuse(back, no, why)} />}
      </>
    );
  }

  /* ---------------- 列表（复刻 SaaS 售后管理列表） ---------------- */
  const list = tab === "全部" ? rows : rows.filter((r) => asInTab(r.status, tab));

  return (
    <>
      <div className="alert"><span className="ic">i</span>一件代发售后：<b style={{ margin: "0 4px" }}>总部审核 + 总部退款</b>，本后台<b style={{ margin: "0 4px" }}>只处理货源</b>——签收退货、验收。仅退款单不在本页展示；金额只读、不可操作；消费者信息仍脱敏</div>

      <div className="filters">
        <div className="row">
          <div className="field"><label>订单编号</label><input className="ctl" placeholder="请输入订单编号" /></div>
          <span style={{ color: "#666", cursor: "pointer" }}>▾ 展开</span>
          <div className="actions">
            <button className="btn primary">查询</button>
            <button className="btn">重置</button>
          </div>
        </div>
      </div>

      <div className="pills">
        {AS_TABS.map((t) => (
          <span key={t} className={`pill ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>{t}</span>
        ))}
        <div className="right">
          <select className="ctl" style={{ width: 160 }} defaultValue="按照申请时间降序"><option>按照申请时间降序</option><option>按照申请时间升序</option></select>
        </div>
      </div>

      <BatchBar allSel={allSel} toggleAll={toggleAll} count={sel.size} />

      <div className="tbl-wrap">
        <table className="tbl-tight">
          <thead>
            <tr>
              <th style={{ width: 36 }}><input type="checkbox" checked={allSel} onChange={toggleAll} /></th>
              <th style={{ width: 40 }}>序号</th>
              <th style={{ minWidth: 200 }}>商品信息</th><th className="tw">售后编号</th><th className="tw">售后方式</th>
              <th className="tw">发货状态</th><th className="tw">订单金额</th><th className="tw">数量</th>
              <th className="tw">退款金额(元)</th><th className="tw">退还积分</th><th className="tw">申请时间</th><th className="tw">超时时间</th>
              <th className="tw">售后原因</th><th className="tw">售后状态</th>
              <th className="tw">操作</th>
            </tr>
          </thead>
          <tbody>
            {pgA.pageRows.map((r, i) => (
              <tr key={r.asNo}>
                <td><input type="checkbox" checked={sel.has(r.asNo)} onChange={() => toggleOne(r.asNo)} /></td>
                <td>{(pgA.page - 1) * pgA.pageSize + i + 1}</td>
                <td>
                  <div className="prod-cell">
                    <span className="thumb" style={{ background: "#f4f7f6" }}>{r.emoji}</span>
                    <div>
                      <div>订单号：<span className="mono" style={{ color: "#25c7a5" }}>{r.no}</span></div>
                      <div>{r.product}</div>
                      <small>{r.spec}</small>
                    </div>
                  </div>
                </td>
                <td className="tw mono">{r.asNo}…</td>
                <td className="tw">{r.way}</td>
                <td className="tw">{r.order.物流状态 && r.order.物流状态 !== "-" ? r.order.物流状态 : r.ship}</td>
                <td className="tw">￥{r.amount}</td>
                <td className="tw">{r.qty}</td>
                <td className="tw">￥{r.refund}</td>
                <td className="tw">{r.points}</td>
                <td className="tw mono">{r.at}</td>
                <td className="tw">{r.timeout}</td>
                <td className="tw">{r.reason}</td>
                <td className="tw"><span className={`tag ${asTone(r.status)}`}>{r.status}</span></td>
                <td className="tw">
                  <div className="op-col">
                    <button className="gray" onClick={() => setNote(r)}>备注</button>
                    <button onClick={() => setDetail(r)}>详情</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pager {...pgA} />

      {toast}
      {note && <AsNoteModal row={note} onClose={() => setNote(null)} onSaved={() => { tip("备注已保存"); setNote(null); }} />}
    </>
  );
}

/* ---------------- 拒绝签收退货（拒签原因 + 举证照片 + 退回物流单号，必填） ----------------
   拒签不直接关单：转「退货异常」，由总部裁决（认可拒签并关单，或仍向买家退款） */
function RefuseModal({ row, onClose, onOk }) {
  const [photos, setPhotos] = useState(0);
  const [no, setNo] = useState("");
  const [why, setWhy] = useState("");
  const ok = photos >= 1 && no.trim() && why.trim();
  return (
    <div className="gmock" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="gbox">
        <b>拒绝签收退货</b>
        <p>{row.asNo} · {row.product}</p>
        <div className="note" style={{ marginTop: 10, lineHeight: 1.9 }}>
          拒绝签收后商品<b>寄回给买家</b>，售后单转「退货异常」——<b>是否退款由总部裁决</b>，本后台不决定钱款。
        </div>
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 13, marginBottom: 6 }}><i style={{ color: "#f5522e" }}>*</i> 拒签原因</div>
          <input className="ctl" style={{ width: "100%" }} placeholder="如：退回商品为其他型号，与订单不符" value={why} onChange={(e) => setWhy(e.target.value)} />
        </div>
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 13, marginBottom: 6 }}><i style={{ color: "#f5522e" }}>*</i> 举证照片（最多 5 张）</div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div className="upload-box" style={{ width: 62, height: 62, cursor: "pointer" }} onClick={() => setPhotos((p) => Math.min(5, p + 1))}>
              ＋<br /><span style={{ fontSize: 12 }}>添加照片</span>
            </div>
            {Array.from({ length: photos }, (_, i) => (
              <span key={i} style={{ width: 62, height: 62, display: "grid", placeItems: "center", background: "#e8ecef", borderRadius: 4 }}>🧾</span>
            ))}
            <span className="note">已传 {photos} 张</span>
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 13, marginBottom: 6 }}><i style={{ color: "#f5522e" }}>*</i> 退回物流单号</div>
          <input className="ctl" style={{ width: "100%" }} placeholder="请输入寄回给买家的物流单号" value={no} onChange={(e) => setNo(e.target.value)} />
        </div>
        <div className="gfoot">
          <button className="btn plain" onClick={onClose}>取消</button>
          <button className="btn primary" disabled={!ok} onClick={() => onOk(no.trim(), why.trim())}>确认拒绝签收</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- 售后备注 ---------------- */
function AsNoteModal({ row, onClose, onSaved }) {
  const [text, setText] = useState("");
  return (
    <div className="gmock" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="gbox">
        <b>售后备注</b>
        <p>订单号 {row.no} · {row.product}</p>
        <textarea rows={4} value={text} onChange={(e) => setText(e.target.value)}
          placeholder="填写内部备注，仅供应商侧可见"
          style={{ width: "100%", marginTop: 12, padding: 10, border: "1px solid var(--line)", borderRadius: 4, fontSize: 13, fontFamily: "inherit", resize: "vertical" }} />
        <div className="gfoot">
          <button className="btn plain" onClick={onClose}>取消</button>
          <button className="btn primary" disabled={!text.trim()} onClick={onSaved}>保存</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- 设置 > 账号管理（进销存新增：本供应商唯一账号，自助改密） ---------------- */
export function SupAccount() {
  const [reset, setReset] = useState(false);
  const [toast, tip] = useToast();

  return (
    <>
      <div className="hl" data-hl="进销存新增" style={{ padding: "8px 12px", marginBottom: 12, fontSize: 12.5, lineHeight: 1.8 }}>
        进销存新增：供应商账号管理 —— 本供应商一个登录账号（由租户创建 / 重设），可自助修改登录密码
      </div>
      <div className="tbl-wrap">
        <table>
          <thead><tr><th className="tw">账号绑定主体</th><th className="tw">登录手机号</th><th className="tw">账号状态</th><th className="tw">操作</th></tr></thead>
          <tbody>
            <tr>
              <td className="tw">JOJO供应商 <span className="mono note" style={{ display: "inline" }}>SN00000021</span></td>
              <td className="tw mono">18800008888</td>
              <td className="tw"><span className="tag">已开启</span></td>
              <td className="tw"><button className="btn link" style={{ padding: 0 }} onClick={() => setReset(true)}>修改密码</button></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="note" style={{ marginTop: 12, lineHeight: 1.9 }}>
        账号由租户在「供应商管理」中创建 / 重设；供应商后台支持 <b>账号密码登录</b> 与 <b>账号验证码登录</b>。忘记密码可自助修改，或联系租户重设。
      </div>
      {toast}
      {reset && <ChangePwdModal onClose={() => setReset(false)} onSaved={() => { tip("登录密码已修改，下次登录请使用新密码"); setReset(false); }} />}
    </>
  );
}

/* ---------------- 修改登录密码（自助） ---------------- */
function ChangePwdModal({ onClose, onSaved }) {
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const err = p1 && p1.length < 6 ? "新密码至少 6 位" : p2 && p1 !== p2 ? "两次输入的新密码不一致" : "";
  const ok = p1.length >= 6 && p1 === p2;
  return (
    <div className="gmock" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="gbox">
        <b>修改登录密码</b>
        <p>账号 JOJO供应商（SN00000021）· 登录手机号 18800008888</p>
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 13, marginBottom: 6 }}><i style={{ color: "#f5522e" }}>*</i> 新密码</div>
          <input className="ctl" type="password" style={{ width: "100%" }} placeholder="请设置新密码（至少 6 位）" value={p1} onChange={(e) => setP1(e.target.value)} />
        </div>
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 13, marginBottom: 6 }}><i style={{ color: "#f5522e" }}>*</i> 确认新密码</div>
          <input className="ctl" type="password" style={{ width: "100%" }} placeholder="请再次输入新密码" value={p2} onChange={(e) => setP2(e.target.value)} />
        </div>
        {err && <div style={{ marginTop: 8, color: "#f5522e", fontSize: 12.5 }}>{err}</div>}
        <div className="gfoot">
          <button className="btn plain" onClick={onClose}>取消</button>
          <button className="btn primary" disabled={!ok} onClick={onSaved}>确认修改</button>
        </div>
      </div>
    </div>
  );
}
