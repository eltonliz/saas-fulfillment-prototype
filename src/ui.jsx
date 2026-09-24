import React, { useState, useRef, useCallback } from "react";
import { packagesOf } from "./data.js";

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

/* 列表分页（真实 SaaS 版式）：const pg = usePaged(list); 渲染 pg.pageRows + <Pager {...pg} /> */
export function usePaged(rows, initialSize = 30) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialSize);
  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const cur = Math.min(page, pages);
  const pageRows = rows.slice((cur - 1) * pageSize, cur * pageSize);
  return { pageRows, page: cur, setPage, pageSize, setPageSize, total };
}

export function Pager({ total, page, setPage, pageSize, setPageSize }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const nums = [];
  for (let p = 1; p <= pages; p++) {
    if (p === 1 || p === pages || Math.abs(p - page) <= 1) nums.push(p);
    else if (nums[nums.length - 1] !== "…") nums.push("…");
  }
  const jump = (e) => {
    if (e.key === "Enter") {
      const n = Number(e.target.value.replace(/\D/g, "")) || 1;
      setPage(Math.min(pages, Math.max(1, n)));
      e.target.value = "";
    }
  };
  return (
    <div className="pager">
      <span>共{total}条记录</span>
      <span className="pg" style={{ opacity: page <= 1 ? 0.4 : 1 }} onClick={() => page > 1 && setPage(page - 1)}>‹</span>
      {nums.map((p, i) => p === "…"
        ? <span key={"e" + i} style={{ padding: "0 2px" }}>…</span>
        : <span key={p} className={`pg ${p === page ? "active" : ""}`} onClick={() => setPage(p)}>{p}</span>)}
      <span className="pg" style={{ opacity: page >= pages ? 0.4 : 1 }} onClick={() => page < pages && setPage(page + 1)}>›</span>
      <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>
        {[10, 20, 30, 50].map((s) => <option key={s} value={s}>{s}/页</option>)}
      </select>
      <span className="jump">跳至<input placeholder="" onKeyDown={jump} />页</span>
    </div>
  );
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
  /* 一批可以拆成多个包裹，每个包裹是独立的一条运单 + 一条轨迹 —— 所以按包裹分页签看。
     页签条最多占 5 个位置：超出的收进「更多」下拉，这样拆到几十个包裹也不会把标题条撑爆，
     且当前选中的那个一定看得见（选中项落在第 5 个之后时，下拉本身变成当前包裹的页签） */
  const pk = packagesOf(doc);
  const [cur, setCur] = useState(0);
  const [more, setMore] = useState(false);
  const MAX_TABS = 5;
  const flat = pk.length <= MAX_TABS ? pk.length : MAX_TABS - 1;
  const p = pk[cur];
  const hidden = Math.max(0, pk.length - flat);

  const parseAt = (label) => {
    const m = String(p?.track || "").match(new RegExp(label + " (\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2})"));
    return m ? m[1] : null;
  };
  const sentAt = parseAt("已发货");
  const signedAt = parseAt("已签收");
  const nodes = [
    { t: "已下单", d: "供货物流单已创建，等待承运商揽收", at: doc.batchAt || doc.createdAt || "—", done: true },
    { t: "已发货", d: `${p?.carrier || "—"} 已揽收，发往 ${doc.receiver}`, at: sentAt || "—", done: true },
  ];
  if (signedAt) nodes.push({ t: "已签收", d: `已送达 ${doc.receiverAddr}`, at: signedAt, done: true });
  else nodes.push({ t: "派送中", d: "待收货方签收", at: "—", done: false });

  const tabStyle = (on) => ({
    padding: "7px 16px", fontSize: 13, cursor: "pointer", borderBottom: on ? "2px solid var(--brand)" : "2px solid transparent",
    color: on ? "var(--brand)" : "var(--text-2)", fontWeight: on ? 600 : 400, whiteSpace: "nowrap",
  });

  return (
    <div className="drawer-mask" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="drawer" style={{ width: 560 }}>
        <header>物流轨迹<button className="x" onClick={onClose}>×</button></header>
        <div className="body">
          <div className="filters" style={{ marginBottom: 10 }}>
            <div className="row" style={{ gap: 30 }}>
              <div className="field"><label>供货单号</label><b className="mono">{doc.id}</b></div>
              <div className="field"><label>收货主体</label><b>{doc.receiver}</b></div>
            </div>
          </div>

          {!pk.length && <div className="note">尚未发货，暂无物流信息</div>}

          {pk.length > 1 && (
            <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid var(--line)", marginBottom: 14, position: "relative" }}>
              {pk.slice(0, flat).map((x, i) => (
                <span key={i} style={tabStyle(cur === i)} onClick={() => setCur(i)}>包裹 {i + 1}</span>
              ))}
              {hidden > 0 && (
                <div style={{ position: "relative" }}>
                  <span style={tabStyle(cur >= flat)} onClick={() => setMore((v) => !v)}>
                    {cur >= flat ? `包裹 ${cur + 1}` : `更多 ${hidden} 个包裹`} ▾
                  </span>
                  {more && (
                    <div style={{ position: "absolute", top: "100%", left: 0, zIndex: 5, background: "#fff", border: "1px solid var(--line)", borderRadius: 4, boxShadow: "0 6px 18px rgba(0,0,0,.10)", maxHeight: 260, overflowY: "auto", minWidth: 190 }}>
                      {pk.slice(flat).map((x, k) => {
                        const i = flat + k;
                        return (
                          <div key={i} onClick={() => { setCur(i); setMore(false); }}
                            style={{ padding: "9px 14px", fontSize: 13, cursor: "pointer", whiteSpace: "nowrap", background: cur === i ? "#f2fbf9" : "#fff", color: cur === i ? "var(--brand)" : "var(--text-1)" }}>
                            包裹 {i + 1}　<span className="note" style={{ display: "inline" }}>{x.carrier || "—"} {x.tracking || ""}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {p && (
            <>
              <div className="filters" style={{ marginBottom: 14 }}>
                <div className="row" style={{ gap: 30 }}>
                  <div className="field"><label>快递公司</label><b>{p.carrier || "—"}</b></div>
                  <div className="field"><label>物流单号</label><b className="mono">{p.tracking || "—"}</b></div>
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
            </>
          )}
        </div>
        {doc.trackEditedAt && (
          <div className="note" style={{ margin: "12px 20px 0", color: "#b7791f", lineHeight: 1.9 }}>
            物流信息于 {doc.trackEditedAt} 修改（原单号 {doc.trackEditFrom || "—"}）
          </div>
        )}
        <div className="foot"><button className="btn plain" onClick={onClose}>关闭</button></div>
      </div>
    </div>
  );
}

/* 通用确认弹窗 */
export function Confirm({ title = "操作确认", text, okText = "确定", onOk, onCancel, rejectText, onReject }) {
  return (
    <div className="gmock" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="gbox">
        <b>{title}</b>
        <p>{text}</p>
        <div className="gfoot">
          <button className="btn plain" onClick={onCancel}>取消</button>
          {onReject && <button className="btn" onClick={onReject}>{rejectText || "驳回"}</button>}
          <button className="btn primary" onClick={onOk}>{okText}</button>
        </div>
      </div>
    </div>
  );
}
