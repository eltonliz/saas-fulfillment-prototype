import React, { useState } from "react";
import { useToast, useRowSelect, BatchBar, Confirm, usePaged, Pager } from "../ui.jsx";

/* 1:1 复刻真实 SAAS「供应商管理」页（供应商 > 供应商管理） */
const ROWS = [
  { no: "SN00000021", name: "JOJO供应商", contact: "jojo", phone: "18100010002", at: "2026-06-23 09:48:49", qual: "已通过", enabled: true, pay: { method: "对公银行账户", name: "JOJO供应商", bank: "中国工商银行广州天河支行", acct: "4402 2100 8891 **** 6632" } },
  { no: "SN00000023", name: "测试供应商资质", contact: "零度", phone: "13144156669", at: "2026-08-07 19:39:06", qual: "已通过", enabled: true },
  { no: "SN00000031", name: "测试供应商A", contact: "测试联系人", phone: "13800001111", at: "2026-08-11 11:02:56", qual: "已通过", enabled: false },
  { no: "SN00000032", name: "阿萨德", contact: "阿萨德", phone: "13144156669", at: "2026-08-11 11:27:15", qual: "已通过", enabled: false },
  { no: "SN00000033", name: "审核驳回测试", contact: "测试联系人", phone: "13800002222", at: "2026-08-11 11:30:22", qual: "已通过", enabled: false },
  { no: "SN00000034", name: "供应商001", contact: "供应商001", phone: "18100010002", at: "2026-08-12 16:09:13", qual: "已通过", enabled: true, pay: { method: "法人个人账户", name: "陈志强", bank: "招商银行佛山南海支行", acct: "6214 8300 5566 **** 1029" } },
  { no: "SN00000035", name: "供应商002", contact: "供应商002", phone: "13979554185", at: "2026-08-12 16:09:41", qual: "已通过", enabled: true },
  { no: "SN00000036", name: "供应商003", contact: "供应商003", phone: "13122223333", at: "2026-08-12 16:10:11", qual: "已通过", enabled: true },
  { no: "SN00000037", name: "123", contact: "123", phone: "13144156666", at: "2026-08-12 16:24:09", qual: "已通过", enabled: false },
  { no: "SN00000038", name: "123", contact: "123", phone: "13144156666", at: "2026-08-12 16:34:04", qual: "待审核", enabled: false },
];

const NEW_SUPPLIER = { no: "（保存后生成）", name: "", contact: "", phone: "", at: "—", qual: "待审核", enabled: false };

export function SupplierMaster() {
  const [tab, setTab] = useState("全部");
  const [rows, setRows] = useState(ROWS);
  const [add, setAdd] = useState(false);      // 新建供应商
  const [toast, tip] = useToast();
  const list = rows.filter((r) => (tab === "全部" ? true : tab === "已启用" ? r.enabled : !r.enabled));
  const { sel, allSel, toggleAll, toggleOne } = useRowSelect(list.map((r) => r.no));
  const pg = usePaged(list);

  return (
    <>
      <div className="filters">
        <div className="row">
          <div className="field"><label>搜索类型</label>
            <select className="ctl w-sm" defaultValue="供应商编号"><option>供应商编号</option><option>供应商名称</option><option>联系人</option></select>
            <span style={{ color: "#c2c2c2" }}>🔍</span>
            <input className="ctl" placeholder="请输入搜索内容" />
          </div>
          <div className="field"><label>状态</label>
            <select className="ctl w-sm" value={tab === "全部" ? "" : tab} onChange={(e) => setTab(e.target.value || "全部")}>
              <option value="">请选择</option><option>已启用</option><option>未启用</option>
            </select>
          </div>
          <div className="field"><label>资质状态</label>
            <select className="ctl w-sm" defaultValue=""><option value="">请选择</option><option>已通过</option><option>待审核</option></select>
          </div>
          <div className="actions">
            <button className="btn primary">查询</button><button className="btn">重置</button>
            <span className="hl r" data-hl="新增：新建·编辑含后台账号开通"><button className="btn primary" onClick={() => setAdd(true)}>新建</button></span>
          </div>
        </div>
        <div className="row">
          <div className="field"><label>创建时间</label>
            <div className="date"><input className="ctl w-sm" placeholder="开始时间" readOnly /><span className="sep">-</span><input className="ctl w-sm" placeholder="结束时间" readOnly /></div>
          </div>
        </div>
      </div>

      <BatchBar allSel={allSel} toggleAll={toggleAll} count={sel.size} />

      <div className="tbl-wrap">
        <table className="tbl-tight">
          <thead>
            <tr>
              <th style={{ width: 36 }}><input type="checkbox" checked={allSel} onChange={toggleAll} /></th>
              <th className="tw">供应商编号</th><th className="tw">供应商名称</th><th className="tw">主要联系人名称</th>
              <th className="tw">主要联系人电话</th><th className="tw">创建时间</th><th className="tw">资质状态</th><th className="tw">启用状态</th>
              <th style={{ minWidth: 92 }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {pg.pageRows.map((r) => (
              <tr key={r.no + r.name}>
                <td><input type="checkbox" checked={sel.has(r.no)} onChange={() => toggleOne(r.no)} /></td>
                <td className="tw mono">{r.no}</td>
                <td className="tw">{r.name}</td>
                <td className="tw">{r.contact}</td>
                <td className="tw mono">{r.phone}</td>
                <td className="tw mono">{r.at}</td>
                <td className="tw"><span className={`tag ${r.qual === "待审核" ? "warn" : ""}`}>{r.qual}</span></td>
                <td className="tw"><span className={`tag ${r.enabled ? "" : "gray"}`}>{r.enabled ? "已启用" : "未启用"}</span></td>
                <td>
                  {/* 列内为原 SaaS 既有操作的展示复刻，原型不提供点击 */}
                  <div className="op-col">
                    <div style={{ display: "flex", gap: 10 }}>
                      <span className={r.enabled ? "static gray" : "static"}>{r.enabled ? "禁用" : "启用"}</span>
                      <span className="static">编辑</span>
                      <span className="static">联系人</span>
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                      <span className={r.pay ? "static gray" : "static"}>{r.pay ? "收款已开通" : "开通收款"}</span>
                      <span className="static">{r.qual === "待审核" ? "审核" : "查看资质"}</span>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pager {...pg} />


      {toast}
      {add && <SupplierEditDrawer row={NEW_SUPPLIER} isNew onClose={() => setAdd(false)} onSaved={() => { setAdd(false); tip("供应商已创建，等待资质审核"); }} />}
    </>
  );
}

/* ---------------- 编辑供应商（含开通后台登录账号） ---------------- */
function SupplierEditDrawer({ row, isNew, onClose, onSaved }) {
  const [opened, setOpened] = useState(isNew ? true : row.enabled);
  const [opName, setOpName] = useState(row.enabled ? "JOJO发货员" : "");
  const [opPhone, setOpPhone] = useState(row.enabled ? "18800008888" : "");
  const [opPwd, setOpPwd] = useState(row.enabled ? "123456" : "");
  const [status, setStatus] = useState("已开启");
  const [resetPwd, setResetPwd] = useState(false);
  const [flash, setFlash] = useState("");

  return (
    <div className="drawer-mask" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="drawer" style={{ width: 720 }}>
        <header>{isNew ? "新建供应商" : "编辑供应商"}<button className="x" onClick={onClose}>×</button></header>
        <div className="body">
          {/* 字段照真实 SAAS「新建供应商」1:1 对齐 */}
          <section className="card">
            <h3><i className="req">*</i> 基本信息</h3>
            <div className="cbody">
              <div className="frow"><label><i>*</i>供应商名称</label><div className="fc"><input defaultValue={row.name} placeholder="请输入供应商名称" /></div></div>
            </div>
          </section>

          <section className="card">
            <h3>业务类型</h3>
            <div className="cbody">
              <div className="frow"><label></label><div className="fc">
                <label style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><input type="checkbox" defaultChecked />代发服务</label>
              </div></div>
            </div>
          </section>

          <section className="card">
            <h3><i className="req">*</i> 联系人信息</h3>
            <div className="cbody">
              <div className="frow"><label><i>*</i>联系人名称</label><div className="fc"><input defaultValue={row.contact} placeholder="请输入联系人名称" /></div></div>
              <div className="frow"><label><i>*</i>联系人电话</label><div className="fc"><input defaultValue={row.phone} placeholder="请输入联系人电话" /></div></div>
              <div className="frow"><label><i>*</i>微信号</label><div className="fc"><input placeholder="请输入微信号" /></div></div>
              <div className="frow"><label>QQ号</label><div className="fc"><input placeholder="请输入QQ号" /></div></div>
            </div>
          </section>

          <div className="hl" data-hl="新增：供应商后台登录账号">
          <section className="card">
            <h3>供应商后台登录账号</h3>
            <div className="cbody">
              <div className="frow">
                <label>账号状态</label>
                <div className="fc">
                  <div className="radio-row">
                    <label><input type="radio" checked={opened} onChange={() => setOpened(true)} />开通后台账号</label>
                    <label><input type="radio" checked={!opened} onChange={() => setOpened(false)} />不开通</label>
                  </div>
                </div>
              </div>
              {opened && (
                <>
                  <div className="frow"><label>账号绑定主体</label><div className="fc"><input value={`${row.name}（${row.no}）`} readOnly /></div></div>
                  <div className="frow"><label><i>*</i>操作员姓名</label><div className="fc"><input value={opName} onChange={(e) => setOpName(e.target.value)} placeholder="请输入操作员姓名" /></div></div>
                  <div className="frow"><label><i>*</i>登录手机号</label><div className="fc"><input value={opPhone} onChange={(e) => setOpPhone(e.target.value)} placeholder="请输入登录手机号" /></div></div>
                  <div className="frow"><label><i>*</i>登录密码</label><div className="fc">
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input type="password" value={opPwd} onChange={(e) => setOpPwd(e.target.value)} placeholder="请输入登录密码" style={{ flex: 1, maxWidth: 260 }} />
                      <button className="btn plain sm" style={{ flex: "none" }} onClick={() => setResetPwd(true)}>重设密码</button>
                    </div>
                  </div></div>
                  <div className="frow"><label>账号状态</label><div className="fc">
                    <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ maxWidth: 200 }}><option>已开启</option><option>已禁用</option></select>
                  </div></div>
                  {flash && <div style={{ paddingLeft: 104, color: "#25c7a5", fontSize: 12.5 }}>{flash}</div>}
                  <div className="note" style={{ paddingLeft: 104 }}>
                    供应商后台支持两种登录方式：<b>账号密码登录</b>（账号 = 登录手机号 / 供应商编号）与<b>账号验证码登录</b>。
                  </div>
                </>
              )}
            </div>
          </section>
          </div>
        </div>
        <div className="foot">
          <button className="btn plain" onClick={onClose}>取消</button>
          <button className="btn primary" onClick={onSaved || onClose}>保存</button>
        </div>
      </div>
      {resetPwd && (
        <Confirm
          title="重设登录密码"
          text={`将为操作员「${opName || "—"}」生成新的随机密码，原密码立即失效；保存后生效，需线下告知本人。是否继续？`}
          okText="确认重设"
          onOk={() => {
            setOpPwd("S" + Math.random().toString(36).slice(2, 10));
            setFlash("新密码已生成，保存后生效");
            setResetPwd(false);
            setTimeout(() => setFlash(""), 2600);
          }}
          onCancel={() => setResetPwd(false)}
        />
      )}
    </div>
  );
}
