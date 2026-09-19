import React, { useState, useRef, useCallback } from "react";

/* 轻提示：1.8s 自动消失。用法 const [toast, tip] = useToast(); tip("已下架") */
export function useToast() {
  const [msg, setMsg] = useState("");
  const t = useRef(0);
  const show = useCallback((m) => {
    setMsg(m);
    clearTimeout(t.current);
    t.current = setTimeout(() => setMsg(""), 1800);
  }, []);
  return [msg ? <div className="gtoast">{msg}</div> : null, show];
}

/* 列表行多选：const { sel, allSel, toggleAll, toggleOne } = useRowSelect(rows.map(r => r.id)) */
export function useRowSelect(ids) {
  const [sel, setSel] = useState(() => new Set());
  const allSel = ids.length > 0 && ids.every((id) => sel.has(id));
  const toggleAll = () => setSel(allSel ? new Set() : new Set(ids));
  const toggleOne = (id) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  return { sel, allSel, toggleAll, toggleOne };
}

/* 批量操作条（与 useRowSelect 配套） */
export function BatchBar({ allSel, toggleAll, count, children }) {
  return (
    <div className="batchbar">
      <span className="chk" onClick={toggleAll}>
        <input type="checkbox" checked={allSel} onChange={toggleAll} />批量全选/取消
      </span>
      {count > 0 && <span style={{ marginLeft: 12, color: "#25c7a5", fontSize: 12.5 }}>已选 {count} 项</span>}
      {children}
    </div>
  );
}

/* 物流轨迹抽屉（供货单：租户侧与供应商侧共用） */
export function TrackDrawer({ doc, onClose }) {
  const nodes = [
    { t: "已下单", d: "供货物流单已创建，等待承运商揽收", at: doc.createdAt, done: true },
    { t: "已发货", d: `${doc.carrier} 已揽收，发往 ${doc.receiver}`, at: doc.createdAt, done: true },
  ];
  if (["已收货", "已签收"].includes(doc.status)) nodes.push({ t: "已签收", d: `已送达 ${doc.receiverAddr}`, at: doc.createdAt, done: true });
  else nodes.push({ t: "派送中", d: "待收货方签收", at: "—", done: false });

  return (
    <div className="drawer-mask" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="drawer" style={{ width: 560 }}>
        <header>物流轨迹<button className="x" onClick={onClose}>×</button></header>
        <div className="body">
          <div className="filters" style={{ marginBottom: 14 }}>
            <div className="row" style={{ gap: 30 }}>
              <div className="field"><label>供货单号</label><b className="mono">{doc.id}</b></div>
              <div className="field"><label>快递公司</label><b>{doc.carrier}</b></div>
            </div>
            <div className="row" style={{ gap: 30 }}>
              <div className="field"><label>物流单号</label><b className="mono">{doc.tracking}</b></div>
              <div className="field"><label>收货主体</label><b>{doc.receiver}</b></div>
            </div>
          </div>
          {nodes.map((n, i) => (
            <div key={i} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: "1px dashed #eff2f5" }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", marginTop: 7, flex: "none", background: n.done ? "#25c7a5" : "#cfd7de" }} />
              <div>
                <b>{n.t}</b> <span className="note" style={{ display: "inline" }}>{n.at}</span>
                <div className="note">{n.d}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="foot"><button className="btn plain" onClick={onClose}>关闭</button></div>
      </div>
    </div>
  );
}

/* 通用确认弹窗 */
export function Confirm({ title = "操作确认", text, okText = "确定", onOk, onCancel }) {
  return (
    <div className="gmock" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="gbox">
        <b>{title}</b>
        <p>{text}</p>
        <div className="gfoot">
          <button className="btn plain" onClick={onCancel}>取消</button>
          <button className="btn primary" onClick={onOk}>{okText}</button>
        </div>
      </div>
    </div>
  );
}
