import React, { useState } from "react";
import { useToast, useRowSelect, BatchBar, Confirm, usePaged, Pager } from "../ui.jsx";

/* 1:1 复刻真实 SAAS「供应商管理」页（供应商 > 供应商管理） */
const ROWS = [
  { no: "SN00000021", name: "JOJO供应商", contact: "jojo", phone: "18100010002", at: "2026-06-23 09:48:49", qual: "已通过", enabled: true },
  { no: "SN00000023", name: "测试供应商资质", contact: "零度", phone: "13144156669", at: "2026-08-07 19:39:06", qual: "已通过", enabled: true },
  { no: "SN00000031", name: "测试供应商A", contact: "测试联系人", phone: "13800001111", at: "2026-08-11 11:02:56", qual: "已通过", enabled: false },
  { no: "SN00000032", name: "阿萨德", contact: "阿萨德", phone: "13144156669", at: "2026-08-11 11:27:15", qual: "已通过", enabled: false },
  { no: "SN00000033", name: "审核驳回测试", contact: "测试联系人", phone: "13800002222", at: "2026-08-11 11:30:22", qual: "已通过", enabled: false },
  { no: "SN00000034", name: "供应商001", contact: "供应商001", phone: "18100010002", at: "2026-08-12 16:09:13", qual: "已通过", enabled: true },
  { no: "SN00000035", name: "供应商002", contact: "供应商002", phone: "13979554185", at: "2026-08-12 16:09:41", qual: "已通过", enabled: true },
  { no: "SN00000036", name: "供应商003", contact: "供应商003", phone: "13122223333", at: "2026-08-12 16:10:11", qual: "已通过", enabled: true },
  { no: "SN00000037", name: "123", contact: "123", phone: "13144156666", at: "2026-08-12 16:24:09", qual: "已通过", enabled: false },
  { no: "SN00000038", name: "123", contact: "123", phone: "13144156666", at: "2026-08-12 16:34:04", qual: "待审核", enabled: false },
];

const NEW_SUPPLIER = { no: "（保存后生成）", name: "", contact: "", phone: "", at: "—", qual: "待审核", enabled: false };

export function SupplierMaster() {
  const [tab, setTab] = useState("全部");
  const [rows, setRows] = useState(ROWS);
  const [edit, setEdit] = useState(null);     // 编辑既有供应商
  const [add, setAdd] = useState(false);      // 新建供应商
  const [contact, setContact] = useState(null);
  const [qual, setQual] = useState(null);
  const [toggle, setToggle] = useState(null); // 启用/禁用二次确认
  const [toast, tip] = useToast();
  const list = rows.filter((r) => (tab === "全部" ? true : tab === "已启用" ? r.enabled : !r.enabled));
  const { sel, allSel, toggleAll, toggleOne } = useRowSelect(list.map((r) => r.no));
  const pg = usePaged(list);
  const setEnabled = (no, v) => setRows((rs) => rs.map((r) => (r.no === no ? { ...r, enabled: v } : r)));

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
                  <div className="op-col">
                    <div style={{ display: "flex", gap: 10 }}>
                      <button className={r.enabled ? "gray" : ""} onClick={() => setToggle(r)}>{r.enabled ? "禁用" : "启用"}</button>
                      <button className="gray" onClick={() => setEdit(r)}>编辑</button>
                      <button className="gray" onClick={() => setContact(r)}>联系人</button>
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button className="gray" style={{ textDecoration: "line-through", color: "#c2c2c2" }} title="进销存口径：供应商不参与钱款，本期置灰">开通收款</button>
                      <button className="gray" onClick={() => setQual(r)}>{r.qual === "待审核" ? "审核" : "查看资质"}</button>
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
      {edit && <SupplierEditDrawer row={edit} onClose={() => setEdit(null)} onSaved={() => { tip(`「${edit.name}」已保存`); setEdit(null); }} />}
      {add && <SupplierEditDrawer row={NEW_SUPPLIER} isNew onClose={() => setAdd(false)} onSaved={() => { setAdd(false); tip("供应商已创建，等待资质审核"); }} />}
      {contact && <SupplierContactDrawer row={contact} onClose={() => setContact(null)} />}
      {qual && (
        <SupplierQualDrawer
          row={qual}
          onClose={() => setQual(null)}
          onPassed={() => {
            setRows((rs) => rs.map((r) => (r.no === qual.no ? { ...r, qual: "已通过", enabled: true } : r)));
            tip(`「${qual.name}」资质审核已通过`);
            setQual(null);
          }}
          onRejected={() => {
            setRows((rs) => rs.map((r) => (r.no === qual.no ? { ...r, qual: "审核不通过", enabled: false } : r)));
            tip(`已驳回「${qual.name}」的资质申请`);
            setQual(null);
          }}
        />
      )}
      {toggle && (
        <Confirm
          title={toggle.enabled ? "确认禁用" : "确认启用"}
          text={toggle.enabled
            ? `禁用后「${toggle.name}」将不能再被商品绑定为发货方；已生效的订单不受影响。是否继续？`
            : `启用后「${toggle.name}」可被商品绑定为发货方。是否继续？`}
          okText={toggle.enabled ? "确认禁用" : "确认启用"}
          onOk={() => { setEnabled(toggle.no, !toggle.enabled); tip(`「${toggle.name}」已${toggle.enabled ? "禁用" : "启用"}`); setToggle(null); }}
          onCancel={() => setToggle(null)}
        />
      )}
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
          <section className="card">
            <h3><i className="req">*</i> 基本信息</h3>
            <div className="cbody">
              <div className="frow"><label><i>*</i>供应商名称</label><div className="fc"><input defaultValue={row.name} /></div></div>
              <div className="frow"><label>供应商编号</label><div className="fc"><input defaultValue={row.no} readOnly /></div></div>
              <div className="frow"><label><i>*</i>联系人</label><div className="fc"><input defaultValue={row.contact} /></div></div>
              <div className="frow"><label><i>*</i>联系人电话</label><div className="fc"><input defaultValue={row.phone} /></div></div>
              <div className="frow"><label>业务类型</label><div className="fc">
                <select className="ctl" defaultValue="食品饮料" style={{ maxWidth: 220 }}>
                  {["食品饮料", "日用百货", "美妆个护", "母婴用品", "其他"].map((t) => <option key={t}>{t}</option>)}
                </select>
              </div></div>
            </div>
          </section>

          <section className="card">
            <h3><i className="req">*</i> 发货地址 / 业务地址 / 联系人信息</h3>
            <div className="cbody">
              <div className="frow"><label>区域</label><div className="fc"><input placeholder="请选择省 / 市 / 区" readOnly /></div></div>
              <div className="frow"><label>详细地址</label><div className="fc"><input placeholder="请输入详细地址（发货弹窗的「选择发货地址」取自这里）" /></div></div>
            </div>
          </section>

          <section className="card">
            <h3><i className="req">*</i> 联系人信息</h3>
            <div className="cbody">
              <div className="frow"><label><i>*</i>联系人名称</label><div className="fc"><input defaultValue={row.contact} /></div></div>
              <div className="frow"><label><i>*</i>微信号</label><div className="fc"><input placeholder="请输入微信号" /></div></div>
              <div className="frow"><label>QQ号</label><div className="fc"><input placeholder="请输入QQ号" /></div></div>
            </div>
          </section>

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

/* ---------------- 联系人 ---------------- */
function SupplierContactDrawer({ row, onClose }) {
  const contacts = [
    { name: row.contact || "—", role: "主要联系人", phone: row.phone },
    { name: "李主管", role: "发货对接人", phone: row.phone },
  ];
  return (
    <div className="drawer-mask" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="drawer" style={{ width: 520 }}>
        <header>联系人<button className="x" onClick={onClose}>×</button></header>
        <div className="body">
          <section className="card">
            <h3>{row.name}（{row.no}）</h3>
            <div className="cbody">
              <table className="tbl-tight">
                <thead><tr><th>姓名</th><th>角色</th><th className="tw">联系电话</th></tr></thead>
                <tbody>
                  {contacts.map((c) => (
                    <tr key={c.role}>
                      <td>{c.name}</td><td>{c.role}</td><td className="tw mono">{c.phone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="note" style={{ marginTop: 12 }}>发货对接人用于承接发货异常与配送差异的线下沟通，不参与钱款结算。</div>
            </div>
          </section>
        </div>
        <div className="foot"><button className="btn plain" onClick={onClose}>关闭</button></div>
      </div>
    </div>
  );
}

/* ---------------- 资质审核 / 查看资质 ---------------- */
const QUAL_FILES = [
  ["营业执照", "已上传", "2026-06-23"],
  ["开户许可证", "已上传", "2026-06-23"],
  ["法定代表人身份证", "已上传", "2026-06-23"],
];

function SupplierQualDrawer({ row, onClose, onPassed, onRejected }) {
  const pending = row.qual === "待审核";
  return (
    <div className="drawer-mask" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="drawer" style={{ width: 560 }}>
        <header>{pending ? "资质审核" : "查看资质"}<button className="x" onClick={onClose}>×</button></header>
        <div className="body">
          <section className="card">
            <h3>{row.name}（{row.no}）</h3>
            <div className="cbody">
              <div className="frow"><label>资质状态</label><div className="fc">
                <span className={`tag ${pending ? "warn" : ""}`}>{row.qual}</span>
              </div></div>
              <div className="frow"><label>提交时间</label><div className="fc"><input value={row.at} readOnly /></div></div>
            </div>
          </section>

          <section className="card">
            <h3>资质材料</h3>
            <div className="cbody">
              <table className="tbl-tight">
                <thead><tr><th>材料名称</th><th>状态</th><th className="tw">上传日期</th></tr></thead>
                <tbody>
                  {QUAL_FILES.map(([n, s, d]) => (
                    <tr key={n}><td>{n}</td><td><span className="tag">{s}</span></td><td className="tw mono">{d}</td></tr>
                  ))}
                </tbody>
              </table>
              <div className="note" style={{ marginTop: 12 }}>审核通过后供应商方可被商品绑定为发货方；资质材料本身不对供应商脱敏，仅内部可见。</div>
            </div>
          </section>
        </div>
        <div className="foot">
          <button className="btn plain" onClick={pending ? onRejected : onClose}>{pending ? "驳回" : "关闭"}</button>
          {pending && <button className="btn primary" onClick={onPassed}>审核通过</button>}
        </div>
      </div>
    </div>
  );
}
