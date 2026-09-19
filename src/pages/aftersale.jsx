import React, { useState } from "react";
import { useToast, useRowSelect, BatchBar } from "../ui.jsx";

/* 1:1 复刻真实 SAAS「售后管理」页（交易 > 售后管理） */
const TABS = ["全部", "待商家处理", "待商家收货", "待买家处理", "退款异常", "退款中", "退款成功"];

const ROWS = [
  { no: "ORD260917000164", product: "什锦果蔬", spec: "黑色/", emoji: "🧺", asNo: "R2026091826091", way: "仅退款", ship: "暂无", amount: "¥1.00", qty: 1, refund: "¥1.00", points: 0, at: "2026-09-18 17:44:36", timeout: "-", status: "待商家处理" },
  { no: "ORD260917000147", product: "华为手机", spec: "蓝色/M", emoji: "📱", asNo: "R2026091826091", way: "仅退款", ship: "暂无", amount: "¥1.00", qty: 1, refund: "¥1.00", points: 0, at: "2026-09-18 17:44:22", timeout: "-", status: "待商家处理" },
  { no: "ORD260917000159", product: "什锦果蔬", spec: "蓝色/", emoji: "🧺", asNo: "R2026091826091", way: "仅退款", ship: "暂无", amount: "¥1.00", qty: 1, refund: "¥1.00", points: 0, at: "2026-09-18 17:42:38", timeout: "-", status: "待商家处理" },
  { no: "ORD260917000153", product: "华为手机", spec: "蓝色/", emoji: "📱", asNo: "R2026091826091", way: "仅退款", ship: "暂无", amount: "¥2.00", qty: 1, refund: "¥2.00", points: 0, at: "2026-09-18 17:42:16", timeout: "-", status: "待商家处理" },
  { no: "ORD260917000120", product: "什锦果蔬", spec: "礼盒装", emoji: "🧺", asNo: "R2026091726091", way: "仅退款", ship: "暂无", amount: "¥1.00", qty: 1, refund: "¥1.00", points: 0, at: "2026-09-17 16:29:57", timeout: "-", status: "退款成功" },
];

export function AfterSales() {
  const [tab, setTab] = useState("全部");
  const [note, setNote] = useState(null);     // 备注
  const [detail, setDetail] = useState(null); // 详情
  const [toast, tip] = useToast();
  const list = ROWS.filter((r) => (tab === "全部" ? true : r.status === tab));
  const { sel, allSel, toggleAll, toggleOne } = useRowSelect(list.map((r) => r.no));

  return (
    <>
      <div className="filters">
        <div className="row">
          <div className="field"><label>订单编号</label><input className="ctl" placeholder="请输入订单编号" /></div>
          <span style={{ color: "#666", cursor: "pointer" }}>▾ 展开</span>
          <div className="actions"><button className="btn primary">查询</button><button className="btn">重置</button></div>
        </div>
      </div>

      <div className="pills">
        {TABS.map((t) => (
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
            {list.map((r, i) => (
              <tr key={r.no + i}>
                <td><input type="checkbox" checked={sel.has(r.no)} onChange={() => toggleOne(r.no)} /></td>
                <td>{i + 1}</td>
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
                <td className="tw">{r.ship}</td>
                <td className="tw">{r.amount}</td>
                <td className="tw">{r.qty}</td>
                <td className="tw" style={{ color: "#f5522e" }}>{r.refund}</td>
                <td className="tw">{r.points}</td>
                <td className="tw mono">{r.at}</td>
                <td className="tw">{r.timeout}</td>
                <td className="tw">{r.reason || "七天无理由退货"}</td>
                <td className="tw"><span className={`tag ${r.status === "待商家处理" ? "warn" : "blue"}`}>{r.status}</span></td>
                <td className="tw">
                  <div className="op-col">
                    <span style={{ color: "#f5a623", fontSize: 13, height: 20 }}>★★★★★</span>
                    <button className="gray" onClick={() => setNote(r)}>备注</button>
                    <button onClick={() => setDetail(r)}>详情</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pager">
        <span>共132条记录</span>
        <span className="pg">‹</span><span className="pg active">1</span><span className="pg">2</span><span className="pg">3</span><span className="pg">4</span><span className="pg">5</span><span className="pg">›</span>
        <select defaultValue="30"><option>30/页</option></select>
        <span className="jump">跳至<input defaultValue="1" />页</span>
      </div>


      {toast}
      {note && <NoteModal row={note} onClose={() => setNote(null)} onSaved={() => { tip("备注已保存"); setNote(null); }} />}
      {detail && (
        <AfterSaleDetailDrawer
          row={detail}
          onClose={() => setDetail(null)}
          onNote={() => { setNote(detail); setDetail(null); }}
        />
      )}
    </>
  );
}

/* ---------------- 售后备注 ---------------- */
function NoteModal({ row, onClose, onSaved }) {
  const [text, setText] = useState("");
  return (
    <div className="gmock" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="gbox">
        <b>售后备注</b>
        <p>订单号 {row.no} · {row.product}</p>
        <textarea rows={4} value={text} onChange={(e) => setText(e.target.value)}
          placeholder="填写内部备注，仅商家侧可见（不展示给买家与供应商）"
          style={{ width: "100%", marginTop: 12, padding: 10, border: "1px solid var(--line)", borderRadius: 4, fontSize: 13, fontFamily: "inherit", resize: "vertical" }} />
        <div className="gfoot">
          <button className="btn plain" onClick={onClose}>取消</button>
          <button className="btn primary" disabled={!text.trim()} onClick={onSaved}>保存</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- 售后详情 ---------------- */
function AfterSaleDetailDrawer({ row, onClose, onNote }) {
  const shipped = row.ship !== "暂无";
  return (
    <div className="drawer-mask" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="drawer" style={{ width: 620 }}>
        <header>售后详情<button className="x" onClick={onClose}>×</button></header>
        <div className="body">
          <section className="card">
            <h3>售后单</h3>
            <div className="cbody">
              <div className="frow"><label>售后编号</label><div className="fc"><input className="mono" value={row.asNo} readOnly /></div></div>
              <div className="frow"><label>订单编号</label><div className="fc"><input className="mono" value={row.no} readOnly /></div></div>
              <div className="frow"><label>售后方式</label><div className="fc"><input value={row.way} readOnly /></div></div>
              <div className="frow"><label>当前状态</label><div className="fc"><span className="tag warn">{row.status}</span></div></div>
              <div className="frow"><label>申请时间</label><div className="fc"><input className="mono" value={row.at} readOnly /></div></div>
            </div>
          </section>

          <section className="card">
            <h3>商品与金额</h3>
            <div className="cbody">
              <div className="frow"><label>商品</label><div className="fc"><input value={`${row.product} ${row.spec}`} readOnly /></div></div>
              <div className="frow"><label>数量</label><div className="fc"><input value={row.qty} readOnly /></div></div>
              <div className="frow"><label>订单金额</label><div className="fc"><input value={row.amount} readOnly /></div></div>
              <div className="frow"><label>退款金额</label><div className="fc"><input value={row.refund} readOnly style={{ color: "#f5522e" }} /></div></div>
            </div>
          </section>

          <section className="card">
            <h3>退款处理说明</h3>
            <div className="cbody">
              <div className="note" style={{ padding: 10, lineHeight: 1.9 }}>
                {shipped
                  ? <>该售后<b>已发货</b> → 转<b>线下协商</b>。</>
                  : <>该售后<b>未发货</b> → 退款同时<b>同步关闭对应的发货任务</b>。</>}
              </div>
            </div>
          </section>
        </div>
        <div className="foot">
          <button className="btn plain" onClick={onNote}>备注</button>
          <button className="btn primary" onClick={onClose}>关闭</button>
        </div>
      </div>
    </div>
  );
}
