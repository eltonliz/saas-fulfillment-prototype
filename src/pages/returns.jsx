import React, { useState } from "react";
import { RETURN_STEPS } from "../data.js";
import { useToast, Confirm, usePaged, Pager } from "../ui.jsx";
import { useReturns, setReturns, patchHop } from "../store.js";

const HOP_TAG = { 待发货: "warn", 运输中: "blue", 已收货: "" };

/* ============================ 租户后台：退货返厂 ============================ */
export function TenantReturns() {
  const rows = useReturns();
  const [tab, setTab] = useState("全部");
  const [detail, setDetail] = useState(null);
  const [shipTo, setShipTo] = useState(null);   // 总仓转发供应商
  const [recv, setRecv] = useState(null);       // 总仓确认收货
  const [toast, tip] = useToast();
  const list = rows.filter((r) => (tab === "全部" ? true : r.status === tab));
  const pg = usePaged(list);

  const patch = (id, idx, p, msg) => { patchHop(id, idx, p); if (msg) tip(msg); };

  return (
    <>
      <div className="filters">
        <div className="row">
          <div className="field"><label>返厂单号 / 供货单号</label><input className="ctl w-lg" placeholder="请输入返厂单号或供货单号" /></div>
          <div className="field"><label>退货门店</label>
            <select className="ctl" defaultValue="全部"><option>全部</option><option>濮源直播间</option><option>九天门店</option><option>9071门店</option></select>
          </div>
          <div className="field"><label>返厂路径</label>
            <select className="ctl" defaultValue="全部"><option>全部</option><option>门店 → 供应商</option><option>门店 → 总部仓 → 供应商</option></select>
          </div>
          <div className="actions"><button className="btn primary">查询</button><button className="btn">重置</button></div>
        </div>
      </div>

      <div className="alert">
        <span className="ic">i</span>
        门店自提链路的消费者退货，实物退回供应商
      </div>

      <div className="pills">
        {["全部", ...RETURN_STEPS].map((t) => (
          <span key={t} className={`pill ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>{t}</span>
        ))}
      </div>

      <div className="tbl-wrap">
        <table className="tbl-tight">
          <thead>
            <tr>
              <th className="tw">返厂单号</th><th className="tw">退货门店</th><th className="tw">关联供货单</th>
              <th>商品</th><th className="tw">退货数量</th><th className="tw">退货原因</th>
              <th className="tw">返厂路径</th><th className="tw">退回方</th><th className="tw">状态</th>
              <th style={{ minWidth: 120 }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {pg.pageRows.map((r) => {
              const hqHop = r.viaHq ? r.hops[0] : null;
              const canRecvByHq = hqHop && hqHop.status === "运输中";
              const canForward = r.viaHq && r.hops[0].status === "已收货" && r.hops[1].status === "待发货";
              return (
                <tr key={r.id}>
                  <td className="tw mono">{r.id}<small>{r.createdAt}</small></td>
                  <td className="tw">{r.store}</td>
                  <td className="tw mono">{r.supplyNo}<small>{r.orderNo}</small></td>
                  <td>
                    <div className="prod-cell">
                      <span className="thumb" style={{ background: "#f4f7f6" }}>{r.emoji}</span>
                      <div><div>{r.product}</div><small>{r.spec}</small></div>
                    </div>
                  </td>
                  <td className="tw mono">{r.qty}</td>
                  <td className="tw">{r.reason}</td>
                  <td className="tw">
                    {r.viaHq
                      ? <span className="hl" data-hl="经总仓">门店 → 总部仓 → {r.returnTo}</span>
                      : <>门店 → {r.returnTo}</>}
                  </td>
                  <td className="tw">{r.returnTo}</td>
                  <td className="tw">
                    <span className={`tag ${r.status === "待返厂" ? "warn" : r.status === "已返厂" ? "" : "blue"}`}>{r.status}</span>
                  </td>
                  <td className="tw">
                    <div className="op-col">
                      <button className="gray" onClick={() => setDetail(r)}>详情</button>
                      {canRecvByHq && <button onClick={() => setRecv(r)}>确认收货</button>}
                      {canForward && <button onClick={() => setShipTo(r)}>转发供应商</button>}
                    </div>
                  </td>
                </tr>
              );
            })}
            {!list.length && <tr><td colSpan={10} style={{ textAlign: "center", padding: 40, color: "#999" }}>该状态下暂无退货返厂单</td></tr>}
          </tbody>
        </table>
      </div>
      <Pager {...pg} />


      {toast}
      {detail && <ReturnDetailDrawer row={detail} portal="tenant" onClose={() => setDetail(null)} />}
      {recv && (
        <Confirm
          title="确认收到返厂货"
          text={`确认已收到「${recv.store}」退回的 ${recv.product} × ${recv.qty}，货已入总部仓中转，下一步转发 ${recv.returnTo}。是否确认？`}
          okText="确认收货"
          onOk={() => { patch(recv.id, 0, { status: "已收货" }, `返厂单 ${recv.id} 总仓已收货，待转发供应商`); setRecv(null); }}
          onCancel={() => setRecv(null)}
        />
      )}
      {shipTo && (
        <ForwardDrawer
          row={shipTo}
          onClose={() => setShipTo(null)}
          onDone={(carrier, tracking) => {
            patch(shipTo.id, 1, { status: "运输中", carrier, tracking }, `返厂单 ${shipTo.id} 已转发 ${shipTo.returnTo}`);
            setShipTo(null);
          }}
        />
      )}
    </>
  );
}

/* ---------------- 总仓转发供应商 ---------------- */
function ForwardDrawer({ row, onClose, onDone }) {
  const [carrier, setCarrier] = useState("中通快递");
  const [tracking, setTracking] = useState("");
  const ok = carrier && tracking.trim();
  return (
    <div className="drawer-mask" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="drawer" style={{ width: 560 }}>
        <header>转发供应商<button className="x" onClick={onClose}>×</button></header>
        <div className="body">
          <section className="card">
            <h3>返厂单 {row.id}</h3>
            <div className="cbody">
              <div className="frow"><label>退回方</label><div className="fc"><input value={row.returnTo} readOnly /></div></div>
              <div className="frow"><label>商品</label><div className="fc"><input value={row.product} readOnly /></div></div>
              <div className="frow"><label>规格</label><div className="fc"><input value={row.spec} readOnly /></div></div>
              <div className="frow"><label>退货数量</label><div className="fc"><input value={`${row.qty} 件`} readOnly /></div></div>
              <div className="frow"><label>退货原因</label><div className="fc"><input value={row.reason} readOnly /></div></div>
            </div>
          </section>
          <section className="card">
            <h3>总仓 → 供应商 物流</h3>
            <div className="cbody">
              <div className="frow"><label><i>*</i>快递公司</label><div className="fc">
                <select className="ctl" value={carrier} onChange={(e) => setCarrier(e.target.value)} style={{ maxWidth: 220 }}>
                  {["中通快递", "顺丰速运", "圆通速递", "韵达快递", "京东物流"].map((c) => <option key={c}>{c}</option>)}
                </select>
              </div></div>
              <div className="frow"><label><i>*</i>快递单号</label><div className="fc">
                <input className="ctl" style={{ maxWidth: 260 }} value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="请输入快递单号" />
              </div></div>
              <div className="note">转发后由 {row.returnTo} 确认收到，本单闭环。</div>
            </div>
          </section>
        </div>
        <div className="foot">
          <button className="btn plain" onClick={onClose}>取消</button>
          <button className="btn primary" disabled={!ok} onClick={() => onDone(carrier, tracking.trim())}>确认转发</button>
        </div>
      </div>
    </div>
  );
}

/* ============================ 供应商后台：退货返厂 ============================ */
export function SupplierReturns() {
  const rows = useReturns();
  const [tab, setTab] = useState("全部");
  const [detail, setDetail] = useState(null);
  const [accept, setAccept] = useState(null);
  const [toast, tip] = useToast();
  const list = rows.filter((r) => (tab === "全部" ? true : r.status === tab));
  const pgS = usePaged(list);

  return (
    <>
      <div className="filters">
        <div className="row">
          <div className="field"><label>返厂单号</label><input className="ctl w-lg" placeholder="请输入返厂单号" /></div>
          <div className="field"><label>退货门店</label>
            <select className="ctl" defaultValue="全部"><option>全部</option><option>濮源直播间</option><option>九天门店</option><option>9071门店</option></select>
          </div>
          <div className="field"><label>状态</label>
            <select className="ctl" defaultValue="全部"><option>全部</option><option>待返厂</option><option>返厂中</option><option>已返厂</option></select>
          </div>
          <div className="actions"><button className="btn primary">查询</button><button className="btn">重置</button></div>
        </div>
      </div>

      <div className="alert">
        <span className="ic">i</span>门店自提订单的消费者退货，实物退回给你，你只需确认收到
      </div>

      <div className="pills">
        {["全部", ...RETURN_STEPS].map((t) => (
          <span key={t} className={`pill ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>{t}</span>
        ))}
      </div>

      <div className="tbl-wrap">
        <table className="tbl-tight">
          <thead>
            <tr><th className="tw">返厂单号</th><th className="tw">项目</th><th className="tw">退货门店</th><th>商品</th><th className="tw">退货数量</th><th className="tw">退货原因</th><th className="tw">金额</th><th className="tw">状态</th><th style={{ minWidth: 92 }}>操作</th></tr>
          </thead>
          <tbody>
            {pgS.pageRows.map((r) => {
              const last = r.hops[r.hops.length - 1];
              const canAccept = last.status === "运输中";
              return (
                <tr key={r.id}>
                  <td className="tw mono">{r.id}<small>{r.createdAt}</small></td>
                  <td className="tw">{r.project}</td>
                  <td className="tw">{r.store}</td>
                  <td>
                    <div className="prod-cell">
                      <span className="thumb" style={{ background: "#f4f7f6" }}>{r.emoji}</span>
                      <div><div>{r.product}</div><small>{r.spec}</small></div>
                    </div>
                  </td>
                  <td className="tw mono">{r.qty}</td>
                  <td className="tw">{r.reason}</td>
                  <td className="tw"><span className="tag gray">已脱敏</span><small>仅总部可见</small></td>
                  <td className="tw">
                    <span className={`tag ${r.status === "待返厂" ? "warn" : r.status === "已返厂" ? "" : "blue"}`}>{r.status}</span>
                  </td>
                  <td className="tw">
                    <div className="op-col">
                      <button className="gray" onClick={() => setDetail(r)}>详情</button>
                      {canAccept && <button onClick={() => setAccept(r)}>确认收到</button>}
                    </div>
                  </td>
                </tr>
              );
            })}
            {!list.length && <tr><td colSpan={8} style={{ textAlign: "center", padding: 40, color: "#999" }}>该状态下暂无退给你的返厂单</td></tr>}
          </tbody>
        </table>
      </div>
      <Pager {...pgS} />

      {toast}
      {detail && <ReturnDetailDrawer row={detail} portal="supplier" onClose={() => setDetail(null)} />}
      {accept && (
        <Confirm
          title="确认收到返厂货"
          text={`确认已收到「${accept.store}」退回的 ${accept.product} × ${accept.qty}（${accept.reason}）。确认后本返厂单闭环。`}
          okText="确认收到"
          onOk={() => {
            patchHop(accept.id, accept.hops.length - 1, { status: "已收货" });
            tip(`返厂单 ${accept.id} 已确认收到，流程闭环`);
            setAccept(null);
          }}
          onCancel={() => setAccept(null)}
        />
      )}
    </>
  );
}

/* ============================ 详情（两端共用） ============================ */
function ReturnDetailDrawer({ row, portal, onClose }) {
  const supplier = portal === "supplier";
  return (
    <div className="drawer-mask" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="drawer" style={{ width: 620 }}>
        <header>退货返厂详情<button className="x" onClick={onClose}>×</button></header>
        <div className="body">
          <section className="card">
            <h3>返厂单 {row.id}</h3>
            <div className="cbody">
              <div className="frow"><label>所属项目</label><div className="fc"><input value={row.project} readOnly /></div></div>
              <div className="frow"><label>退货门店</label><div className="fc"><input value={row.store} readOnly /></div></div>
              <div className="frow"><label>关联供货单</label><div className="fc"><input className="mono" value={row.supplyNo} readOnly /></div></div>
              {!supplier && <div className="frow"><label>关联销售订单</label><div className="fc"><input className="mono" value={row.orderNo} readOnly /></div></div>}
              <div className="frow"><label>商品</label><div className="fc"><input value={row.product} readOnly /></div></div>
              <div className="frow"><label>规格</label><div className="fc"><input value={row.spec} readOnly /></div></div>
              <div className="frow"><label>退货数量</label><div className="fc"><input value={`${row.qty} 件`} readOnly /></div></div>
              <div className="frow"><label>退货原因</label><div className="fc"><input value={row.reason} readOnly /></div></div>
              <div className="frow"><label>退回方</label><div className="fc"><input value={row.returnTo} readOnly /></div></div>
              <div className="frow"><label>当前状态</label><div className="fc">
                <span className={`tag ${row.status === "待返厂" ? "warn" : row.status === "已返厂" ? "" : "blue"}`}>{row.status}</span>
              </div></div>
            </div>
          </section>

          <section className="card">
            <h3>返厂路径</h3>
            <div className="cbody">
              {row.hops.map((h, i) => (
                <div key={i} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: i === row.hops.length - 1 ? "none" : "1px dashed #eff2f5" }}>
                  <span style={{ width: 9, height: 9, borderRadius: "50%", marginTop: 7, flex: "none", background: h.status === "已收货" ? "#25c7a5" : h.status === "运输中" ? "#2f80ed" : "#cfd7de" }} />
                  <div style={{ flex: 1 }}>
                    <b>{h.from} → {h.to}</b>
                    <span className={`tag ${HOP_TAG[h.status] || ""}`} style={{ marginLeft: 8 }}>{h.status}</span>
                    <div className="note">
                      {h.carrier ? `${h.carrier} · ${h.tracking}` : "尚未发货"}
                    </div>
                  </div>
                </div>
              ))}
              {row.viaHq && (
                <div className="note" style={{ marginTop: 10 }}>
                  该单属 <b>F4 链路</b>（供应商→总部仓→门店），按决策由<b>总部仓汇总</b>后统一转发 {row.returnTo}，比各门店分头寄回更经济。
                </div>
              )}
            </div>
          </section>

          {/* 返厂单只管货：退款归售后管理，本单不承载退款信息。
              供应商视角保留一条口径说明——它本来就不该看到钱 */}
          {supplier && (
            <section className="card">
              <h3>关于退款</h3>
              <div className="cbody">
                <div className="note" style={{ padding: 10, lineHeight: 1.9 }}>
                  退款金额与消费者 PII <b>已脱敏</b>。退款由总部按售后规则独立执行，<b>不阻塞</b>返厂流程。
                </div>
              </div>
            </section>
          )}
        </div>
        <div className="foot"><button className="btn plain" onClick={onClose}>关闭</button></div>
      </div>
    </div>
  );
}
