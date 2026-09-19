import React, { useEffect, useRef, useState } from "react";

/* ============================================================================
   业务流程图 —— 正向履约主流程 / 逆向与异常流程
   内嵌 public/flow/ 下的自包含单页（iframe 按内容自适应高度）
   ============================================================================ */

const DIAGRAMS = {
  正向履约主流程: "flow/forward.html",
  逆向与异常流程: "flow/reverse.html",
};

function DiagramFrame({ src, title }) {
  const ref = useRef(null);

  const fit = () => {
    const f = ref.current;
    if (!f || !f.contentDocument) return;
    const h = f.contentDocument.documentElement.scrollHeight;
    if (h) f.style.height = h + "px";
  };

  useEffect(() => {
    const onResize = () => fit();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const onLoad = () => {
    fit();
    const f = ref.current;
    if (f && f.contentDocument && f.contentDocument.fonts) f.contentDocument.fonts.ready.then(fit);
  };

  return (
    <div style={{ border: "1px solid var(--line)", borderRadius: "var(--radius)", overflow: "hidden" }}>
      <iframe ref={ref} src={src} title={title} onLoad={onLoad}
        style={{ width: "100%", height: 760, border: 0, display: "block" }} />
    </div>
  );
}

export function FlowsView() {
  const [tab, setTab] = useState("正向履约主流程");
  return (
    <div>
      <div className="mtabs" style={{ marginBottom: 14 }}>
        {Object.keys(DIAGRAMS).map((t) => (
          <button key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>
      <DiagramFrame key={tab} src={DIAGRAMS[tab]} title={tab} />
    </div>
  );
}
