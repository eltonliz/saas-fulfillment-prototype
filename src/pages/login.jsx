import React, { useState } from "react";

/* 供应商后台登录（新版页面）：账号密码登录 / 账号验证码登录 两种模式 */
export function SupplierLogin({ onSuccess }) {
  const [mode, setMode] = useState("pwd"); // pwd | code
  const [account, setAccount] = useState("");
  const [pwd, setPwd] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [agree, setAgree] = useState(true);
  const [err, setErr] = useState("");
  const [sent, setSent] = useState(false);

  const submit = () => {
    if (!agree) return setErr("请先阅读并同意《账号安全使用协议》");
    if (mode === "pwd") {
      if (!account.trim()) return setErr("请输入账号 / 手机号");
      if (!pwd) return setErr("请输入密码");
      if (!(account.trim() === "18800008888" || account.trim() === "SN00000021") || pwd !== "123456") {
        return setErr("账号或密码错误");
      }
    } else {
      if (!phone.trim()) return setErr("请输入手机号");
      if (!code.trim()) return setErr("请输入验证码");
      if (code.trim() !== "1502") return setErr("验证码错误");
    }
    onSuccess();
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f3f5f8", display: "grid", placeItems: "center" }}>
      <div style={{ width: 420, background: "#fff", borderRadius: 8, boxShadow: "0 12px 40px rgba(0,0,0,.08)", padding: "36px 40px 32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center", marginBottom: 6 }}>
          <span style={{ width: 30, height: 30, borderRadius: "50%", background: "#25c7a5", color: "#fff", display: "grid", placeItems: "center", fontWeight: 700 }}>追</span>
          <b style={{ fontSize: 22, color: "#25c7a5", letterSpacing: 1 }}>追伴</b>
        </div>
        <div style={{ textAlign: "center", color: "#999", fontSize: 13, marginBottom: 24 }}>供应商后台</div>

        <div style={{ display: "flex", gap: 26, borderBottom: "1px solid #efefef", marginBottom: 22 }}>
          {[["pwd", "账号密码登录"], ["code", "验证码登录"]].map(([k, t]) => (
            <span key={k} onClick={() => { setMode(k); setErr(""); }}
              style={{ paddingBottom: 10, cursor: "pointer", fontSize: 14, color: mode === k ? "#25c7a5" : "#666", borderBottom: mode === k ? "2px solid #25c7a5" : "2px solid transparent", fontWeight: mode === k ? 600 : 400 }}>
              {t}
            </span>
          ))}
        </div>

        {mode === "pwd" ? (
          <>
            <div className="mfield" style={{ marginBottom: 14 }}>
              <input placeholder="请输入账号 / 手机号" value={account} onChange={(e) => { setAccount(e.target.value); setErr(""); }} style={{ height: 42 }} />
            </div>
            <div className="mfield" style={{ marginBottom: 14 }}>
              <input type="password" placeholder="请输入密码" value={pwd} onChange={(e) => { setPwd(e.target.value); setErr(""); }} style={{ height: 42 }} />
            </div>
          </>
        ) : (
          <>
            <div className="mfield" style={{ marginBottom: 14 }}>
              <input placeholder="请输入手机号" value={phone} onChange={(e) => { setPhone(e.target.value); setErr(""); }} style={{ height: 42 }} />
            </div>
            <div className="mfield" style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", gap: 10 }}>
                <input placeholder="请输入验证码" value={code} onChange={(e) => { setCode(e.target.value); setErr(""); }} style={{ height: 42 }} />
                <button className="btn plain" style={{ width: 116, height: 42, flex: "none" }} onClick={() => setSent(true)}>{sent ? "已发送" : "获取验证码"}</button>
              </div>
            </div>
          </>
        )}

        <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, color: "#666", margin: "4px 0 14px" }}>
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} style={{ width: 14, height: 14, accentColor: "#25c7a5" }} />
          阅读并同意 <span style={{ color: "#25c7a5" }}>《账号安全使用协议》</span>
        </label>

        {err && <div className="err" style={{ marginBottom: 12 }}>{err}</div>}

        <button className="btn primary" style={{ width: "100%", height: 44, fontSize: 16 }} onClick={submit}>登录</button>
        <button className="btn plain" style={{ width: "100%", height: 40, marginTop: 10 }} onClick={() => onSuccess()}>免登录进入（演示）</button>

        <div style={{ marginTop: 16, textAlign: "center", color: "#bbb", fontSize: 12 }}>
          供应商为全局主体，无需切换项目　|　账号由租户在「供应商管理 → 编辑」中开通　|　演示环境聚合展示多供应商单据，正式版按登录账号隔离
        </div>
      </div>
    </div>
  );
}
