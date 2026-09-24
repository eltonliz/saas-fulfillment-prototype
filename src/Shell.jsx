import React, { useEffect, useState } from "react";
import { MENU, SUPPLIER_MENU } from "./data.js";
import { ReqPanel, ReqPageContext } from "./pages/reqnotes.jsx";
import { StateMatrix } from "./pages/states.jsx";

/* stateGroup：手机端（门店APP / 买家端）没有左侧菜单，「状态与按钮」改从顶栏入口弹出，
   只展示这一端的表；后端传 undefined，仍走左侧菜单那一页 */
export function Shell({ portal, onPortal, active, crumbs, tabs, menu, projectLabel, onNav, children, bare, stateGroup }) {
  const list = menu || MENU;
  const [open, setOpen] = useState(() => new Set(["商品", "交易", "门店", "进销存", "供货", "供应商"]));
  const [showHl, setShowHl] = useState(true);
  const [showReq, setShowReq] = useState(true);
  const [reqW, setReqW] = useState(430);
  const [childPage, setChildPage] = useState(null);
  const [showStates, setShowStates] = useState(false);
  /* 联动：后端页面用 active 菜单项，手机端（门店APP/买家端）由机内切页上报 childPage */
  const reqKey = childPage || (portal === "tenant" ? `t:${active}` : portal === "supplier" ? `s:${active}` : "");
  /* 文档类页面（版本记录 / 业务流程图 / 场景清单）不展示需求注释 */
  const NO_REQ_PAGES = ["版本记录", "业务流程图", "场景清单"];
  const noReq = NO_REQ_PAGES.includes(childPage || active);
  const reqOn = showReq && !noReq;

  useEffect(() => { document.body.classList.toggle("hide-hl", !showHl); }, [showHl]);

  const toggle = (label) => setOpen((s) => { const n = new Set(s); n.has(label) ? n.delete(label) : n.add(label); return n; });

  const controls = (
    <div className="right">
      {stateGroup && (
        <div className={`nav-toggle ${showStates ? "on" : ""}`} onClick={() => setShowStates((v) => !v)}>
          <span>🔀</span>状态与按钮
        </div>
      )}
      {onPortal && (
        <span className="portal-sw">
          <button className={portal === "tenant" ? "on" : ""} onClick={() => onPortal("tenant")}>租户后台</button>
          <button className={portal === "supplier" ? "on" : ""} onClick={() => onPortal("supplier")}>供应商后台</button>
          <button className={portal === "app" ? "on" : ""} onClick={() => onPortal("app")}>门店APP</button>
          <button className={portal === "buyer" ? "on" : ""} onClick={() => onPortal("buyer")}>买家端</button>
        </span>
      )}
      <div className={`hl-toggle ${showHl ? "" : "off"}`} onClick={() => setShowHl((v) => !v)}>
        <span>▢</span>红框标注{showHl ? "开" : "关"}
      </div>
      <div className={`hl-toggle ${reqOn ? "" : "off"}`} onClick={() => !noReq && setShowReq((v) => !v)}>
        <span>📋</span>需求注释{reqOn ? "开" : "关"}
      </div>
    </div>
  );

  if (bare) {
    return (
      <ReqPageContext.Provider value={setChildPage}>
      <div className="app-shell">
        <div className="topbar" style={{ background: "#fff", borderBottom: "1px solid var(--line)" }}>
          <div className="crumb"><b>{crumbs[0]}</b></div>
          {controls}
        </div>
        <div style={{ marginRight: reqOn ? reqW : 0 }}>{children}</div>
        {showStates && stateGroup && (
          <div className="gmock" onMouseDown={(e) => e.target === e.currentTarget && setShowStates(false)}>
            <div className="gbox" style={{ width: "min(1080px, 92vw)", maxHeight: "88vh", overflow: "auto", padding: "18px 22px 8px" }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: 12, position: "sticky", top: -18, background: "#fff", paddingTop: 4, paddingBottom: 8, zIndex: 2 }}>
                <b style={{ fontSize: 15 }}>{stateGroup} · 状态与按钮</b>
                <span className="note" style={{ marginLeft: 12 }}>这一端每个状态下页面上出现哪些按钮、点完流转到哪</span>
                <span onClick={() => setShowStates(false)} style={{ marginLeft: "auto", color: "#999", fontSize: 20, lineHeight: 1, cursor: "pointer" }}>×</span>
              </div>
              <StateMatrix only={stateGroup} />
            </div>
          </div>
        )}
        {reqOn && <ReqPanel reqKey={reqKey} width={reqW} setWidth={setReqW} onClose={() => setShowReq(false)} top={50} />}
      </div>
      </ReqPageContext.Provider>
    );
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="logo"><i>追</i><b>追伴</b></div>
        <nav className="menu">
          {list.map((m) =>
            m.children ? (
              <div key={m.label}>
                <div className={`grp ${open.has(m.label) ? "open" : ""}`} onClick={() => toggle(m.label)}>
                  <span className="ico">{m.ico}</span>{m.label}
                  {m.isNew && <span className="newflag">新</span>}
                  <span className="arrow">▾</span>
                </div>
                {open.has(m.label) && (
                  <div className="sub">
                    {m.children.map((c) => (
                      <span key={c} className={`item ${active === c ? "active" : ""} ${m.isNew ? "under-new" : ""}`} onClick={() => onNav(c)}>{c}</span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div key={m.label} className={`grp ${active === m.label ? "open" : ""}`} onClick={() => onNav(m.label)}>
                <span className="ico">{m.ico}</span>{m.label}
                {m.isNew && <span className="newflag">新</span>}
              </div>
            )
          )}
        </nav>
      </aside>

      <div className="main">
        <div className="topbar">
          <span className="nav-ic">‹</span>
          <span className="nav-ic">›</span>
          <span className="nav-ic" style={{ fontSize: 13 }}>↻</span>
          <div className="crumb">
            {crumbs.map((c, i) => (
              <React.Fragment key={c}>
                {i > 0 && <span style={{ color: "#c2c2c2" }}>›</span>}
                {i === crumbs.length - 1 ? <b>{c}</b> : <span>{c}</span>}
              </React.Fragment>
            ))}
          </div>
          <div className="right">
            {controls.props.children}
          </div>
        </div>

        <div className="tabbar">
          <span className="tab">项目列表</span>
          <span className="tab">工作台 <span className="x">×</span></span>
          {tabs.map((t) => (
            <span key={t} className={`tab ${active === t ? "active" : ""}`} onClick={() => onNav(t)}>
              {t} <span className="x" onClick={(e) => e.stopPropagation()}>×</span>
            </span>
          ))}
          <span className="more">▾</span>
        </div>

        <div className="content" style={{ marginRight: reqOn ? reqW : 0 }}>{children}</div>
      </div>
      {reqOn && <ReqPanel reqKey={reqKey} width={reqW} setWidth={setReqW} onClose={() => setShowReq(false)} top={92} />}
    </div>
  );
}
