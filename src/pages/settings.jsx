import React, { useState } from "react";
import { useToast, Pager, usePaged } from "../ui.jsx";
import { addressBookStore, expressTplStore, addrStore, settingStore } from "../store.js";
import { SUPPLIER_SELF } from "../data.js";

/* ============================================================================
   通用设置 —— 照真实 SaaS「设置 › 通用设置」复刻
   本期只做「交易设置」页签；其余三个页签仅作占位、不做点击动作
   「极速退款」及其条件（支付有礼校验 / 寄送商品 / 核销商品）为原系统既有能力，原样保留；
   「限制用户退款申请」是本期为进销存新增的一项，用红框标出（.hl + data-hl）
   ============================================================================ */
const TABS = ["商品设置", "交易设置", "售后设置", "课程营期设置"];

const Num = ({ v, w = 64 }) => <input className="ctl" defaultValue={v} style={{ width: w, textAlign: "center", height: 30 }} />;
const Unit = ({ v, opts = ["分钟", "小时", "天"], w = 88 }) => (
  <select className="ctl" defaultValue={v} style={{ width: w, height: 30, marginLeft: 8 }}>
    {opts.map((o) => <option key={o}>{o}</option>)}
  </select>
);
const Txt = ({ children }) => <span style={{ fontSize: 13.5 }}>{children}</span>;

/* 「限制用户退款申请」的条件——拦的是「货已经动了的单」，与「极速退款」的放行条件不是同一套 */
const COND_NOTE = {
  订单发货: "订单发货或核销后，不允许买家自助发起退款申请",
  商品核销: "自提订单核销后，不允许买家自助发起退款申请",
  全部订单: "不限制条件，买家一律不允许自助发起退款申请",
};

/* 左标签 + 右侧内容；sub=true 用于「极速退款」灰底面板里的子项（标签更窄） */
function Row({ label, children, note, hl, hlText, sub, last }) {
  return (
    <div style={{ display: "flex", gap: 16, marginBottom: last ? 0 : 20 }}>
      <div style={{ width: sub ? 116 : 156, flex: "none", textAlign: "right", paddingTop: 6, fontSize: 13.5, color: "var(--text-1)" }}>
        {label}{!sub && <span style={{ color: "#f5522e", marginLeft: 4 }}>*</span>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className={hl ? "hl" : ""} data-hl={hlText}
          style={hl ? { display: "inline-block", padding: "6px 10px" } : undefined}>
          {children}
        </div>
        {note && <div className="note" style={{ marginTop: 8, lineHeight: 1.9 }}>{note}</div>}
      </div>
    </div>
  );
}

export function GeneralSetting() {
  const [tab, setTab] = useState("交易设置");
  const [sw, setSw] = useState({ 极速退款: true, 支付有礼校验: false, 寄送商品: false, 核销商品: false, 限制用户退款申请: false });
  const setting = settingStore.use();
  const [cond, setCond] = useState("订单发货");
  const [toast, tip] = useToast();
  const flip = (k) => setSw((s) => ({ ...s, [k]: !s[k] }));
  const Sw = ({ k, lock }) => (
    <span className={`switch ${sw[k] ? "on" : ""}`} onClick={() => !lock && flip(k)}
      style={{ cursor: lock ? "not-allowed" : "pointer", opacity: lock ? 0.65 : 1 }} />
  );

  return (
    <>
      <div className="tabs" style={{ display: "flex", gap: 28, borderBottom: "1px solid var(--line)", marginBottom: 22, paddingLeft: 8 }}>
        {TABS.map((t) => (
          <span key={t}
            onClick={() => t === "交易设置" && setTab(t)}
            style={{
              paddingBottom: 12, fontSize: 14, cursor: t === "交易设置" ? "pointer" : "default",
              color: tab === t ? "var(--brand)" : "var(--text-2)",
              borderBottom: tab === t ? "2px solid var(--brand)" : "2px solid transparent",
              fontWeight: tab === t ? 600 : 400,
            }}>{t}</span>
        ))}
      </div>

      <div style={{ paddingLeft: 40, paddingRight: 40, maxWidth: 1180 }}>
        <Row label="默认库存扣减方式" note="发布商品时，库存扣减方式将默认选择拍下减库存，也可手动修改。">
          <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13.5 }}>
            <input type="radio" name="stock" defaultChecked /> 拍下减库存
          </label>
        </Row>

        <Row label="待付款订单取消时间" note="注：订单取消后，订单释放库存">
          <Txt>拍下未付款订单 <Num v={30} /><Unit v="分钟" /> 内未付款，自动取消订单</Txt>
        </Row>

        <Row label="待付款订单支付提醒设置">
          <div style={{ fontSize: 13.5, lineHeight: 2.2 }}>
            <div>首次提醒时间：下单后 <Num v={20} /> 分钟推送消息提醒。（设置0分钟，则不推送提醒）</div>
            <div>首次提醒后，每隔 <Num v={8} /> 分钟推送一次消息提醒。（订单支付完成，或订单取消后将不再推送消息，设置0分钟，则不推送消息）</div>
            <div>单笔订单最多推送 <Num v={1} /> 次消息提醒</div>
          </div>
        </Row>

        <Row label="发货后自动确认收货时间"
          note={<>修改后将对新产生的订单立即生效，已产生的订单自动确认收货时间将在以发货时的设置位准。<br />从2022年10月18日起，同城配送订单和上门自提订单自动确认收货时间，根据不同情况调整为24小时或48小时</>}>
          <Txt>物流发货后 <Num v={14} /> 天，自动确认收货</Txt>
        </Row>

        {/* ---------- 进销存新增：启用进销存（总开关） ---------- */}
        <Row label="启用进销存" hl hlText="新增：启用进销存（原系统无此项）"
          note="开启后，自提订单的货要先由供应商 / 总部仓发到门店，门店确认收货后买家才能提货（这条链路就是左侧「进销存」菜单）；关闭后，自提订单支付成功即可提货，不产生供货单">
          <span className={`switch ${setting.supplyChain ? "on" : ""}`} style={{ cursor: "pointer" }}
            onClick={() => settingStore.set((v) => ({ ...v, supplyChain: !v.supplyChain }))} />
        </Row>

        <div style={{ background: "#f7f7f7", padding: "16px 18px", marginBottom: 22, paddingLeft: 132, fontSize: 12.5, lineHeight: 2, color: "var(--text-2)" }}>
          {setting.supplyChain ? (
            <>
              <div>左侧「进销存」菜单可用：发货管理 / 收货管理 / 配送差异 / 退货返厂</div>
              <div>自提订单：买家付款 → 货到门店 → 门店确认收货 → 提货码激活（未全部到货时提货码不可用）</div>
              <div>快递单不受影响：一直是由发货方直接发到买家手上，不经过门店</div>
            </>
          ) : (
            <>
              <div>左侧「进销存」菜单隐藏；自提订单<b>支付成功即可提货</b>，买家端直接显示提货码，不再等待到货</div>
              <div>适合不做库存周转、门店收到货即上架的租户；重新开启后，未到货的自提订单仍按「货到才可提」执行</div>
              <div>快递单不受影响：一直是由发货方直接发到买家手上，不经过门店</div>
            </>
          )}
        </div>

        {/* ---------- 原系统既有：极速退款（原样保留，不做改动） ---------- */}
        <Row label="极速退款" sub
          note="开启后，买家提交退款申请，将无需审核，自动通过（下方极速退款条件修改后，实时影响所有订单；为符合《消费者权益保护法》，该功能必须保持开启状态，不符合极速退款条件的售后单，商家也需在限定时间内审核）">
          <Sw k="极速退款" lock />
        </Row>

        <div style={{ background: "#f7f7f7", padding: "18px 18px 16px", marginBottom: 22 }}>
          <Row sub label="支付有礼校验"
            note="当申请退款时，校验订单是否参与了支付有礼并且支付有礼赠送的内容是否能回收，如果不能回收则无法极速退款，用户提交申请后，仍然需求审核">
            <Sw k="支付有礼校验" />
          </Row>

          <Row sub label="寄送商品" last
            note="注：退款金额与退款数量不匹配时，为避免损失，仍需要审核">
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <Sw k="寄送商品" />
              <Txt>实物商品（配送方式为商家配送）、线上商品（在线交易）在待发货时，用户发起申请后自动通过，单个用户每天仅限 <Num v={3} w={56} /> 次</Txt>
            </div>
          </Row>

          <div style={{ height: 20 }} />

          <Row sub label="核销商品" last
            note="注：退款金额与退款数量不匹配时，为避免损失，仍需要审核">
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <Sw k="核销商品" />
              <select className="ctl" defaultValue="无条件" style={{ width: 118, height: 30 }}>
                {["无条件", "用户下单", "商品下架", "订单发货"].map((o) => <option key={o}>{o}</option>)}
              </select>
              <Txt>实物商品（配送方式为门店自提）在未核销时， 前用户发起退款申请，自动通过，单个用户每天仅限 <Num v={3} w={56} /> 次</Txt>
            </div>
          </Row>

          <div style={{ marginTop: 16, fontSize: 12.5, lineHeight: 2.1, color: "var(--text-2)", paddingLeft: 132 }}>
            <div>用户下单说明1：下单后X天前，指的是每笔订单的下单后X天24小时内可以进行极速退款；也可切换为X小时前</div>
            <div>用户下单说明2：例如设置是1天12:00:00前，如今天10:00:00下单，则次日的中午12点前该笔订单可极速退款</div>
            <div>商品下架：不限制下单时间，只要商品处于上架状态，用户在未核销时发起退款申请均可极速退款；下架后申请均需要进行审核</div>
            <div>订单发货：不限制下单时间，商品在未核销时，且订单状态为【待发货】时，用户发起退款申请可极速退款；核销或者订单发货后，买家发起申请需要审核</div>
          </div>
        </div>

        {/* ---------- 进销存新增：限制用户退款申请 ---------- */}
        <Row label="限制用户退款申请" hl hlText="新增：限制用户退款申请（原系统无此项）"
          note="开启后，买家在下方设置的条件下，不允许发起退款申请；关闭时，则买家均允许发起退款申请。与「启用进销存」相互独立：不做进销存的租户也可能要限制退款">
          <Sw k="限制用户退款申请" />
        </Row>

        <div style={{ paddingLeft: 40 }}>
          <div style={{ display: "block", width: "fit-content", padding: "10px 14px", marginBottom: 20 }}>
            <div style={{ fontSize: 13.5, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <select className="ctl" value={cond} onChange={(e) => setCond(e.target.value)} style={{ width: 128, height: 30 }}>
                {["订单发货", "商品核销", "全部订单"].map((o) => <option key={o}>{o}</option>)}
              </select>
              <span>{COND_NOTE[cond]}</span>
            </div>
          </div>
        </div>

        {/* 限制条件说明：与「极速退款」的说明区同形式，属于本项设置自身的说明，不进红框 */}
        <div style={{ background: "#f7f7f7", padding: "14px 18px", marginLeft: 0, marginBottom: 22 }}>
          <div style={{ fontSize: 12.5, lineHeight: 2.1, color: "var(--text-2)", paddingLeft: 132 }}>
            <div>订单发货：订单<b>已发货</b>或已核销后，买家不能自助发起退款申请；待发货且未核销时，买家可正常发起</div>
            <div>商品核销：自提订单<b>已核销</b>后，买家不能自助发起退款申请；未核销时，买家可正常发起</div>
            <div>全部订单：不限制条件，买家一律不能自助发起退款申请（谨慎使用）</div>
            <div>—— 三个条件是「货已经动了的单」的递进：发货拦截、核销拦截、全拦。原「用户下单 / 商品下架」两条不适用于限制场景，未引入</div>
          </div>
        </div>

        <div className="hl" data-hl="进销存：代发单由供应商执行" style={{ display: "block", marginLeft: 40, marginBottom: 20 }}>
          <div style={{ background: "#f7f7f7", padding: "14px 18px", fontSize: 12.5, lineHeight: 2, color: "var(--text-2)" }}>
            <div>进销存口径①：不允许发起 ≠ 不能退——买家可联系商家走线下协商退款；买家端「申请售后」入口对该订单置灰并给出提示</div>
            <div>进销存口径②：一件代发订单的退款限制由<b>供应商</b>执行（流到供应商后台 · 售后处理），不是平台</div>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 30, marginBottom: 10 }}>
          <button className="btn primary" style={{ minWidth: 96 }} onClick={() => tip("交易设置已保存")}>保存</button>
        </div>
      </div>

      {toast}
    </>
  );
}

/* ============================================================================
   地址库 —— 照真实 SaaS「设置 › 地址库」复刻
   租户三个页签：发货地址 / 售后地址 / 仓库地址；供应商只有前两个（供应商不持有仓，2026-09-24 elton 明确去掉）
   同类型下「默认」互斥；地址在主数据维护，使用方（供应商发货、总部同意退货）都只做「选」
   ============================================================================ */
const ADDR_TABS = [
  { k: "ship", t: "发货地址", hint: "发货时从地址库里选，随发货记入订单的配送信息" },
  { k: "after", t: "售后地址", hint: "总部在「售后管理」同意退货时从这里选，随同意发给买家当寄回地址" },
  { k: "warehouse", t: "仓库地址", hint: "总部仓 / 门店收货点，供内部单据参照" },
];
const SUP_ADDR_TABS = ADDR_TABS.filter((t) => t.k !== "warehouse");

/* 省 / 市 / 区 / 街道 四级联动的最小数据集（原型够用即可） */
const REGION = {
  广东省: { 广州市: { 天河区: ["体育西路", "科苑路"], 荔湾区: ["宝华路", "逢源街"] }, 佛山市: { 高明区: ["云勇林场", "荷城街道"] } },
  河南省: { 洛阳市: { 孟津县: ["城关镇", "朝阳镇"] }, 三门峡市: { 义马市: ["朝阳路街道"] } },
  辽宁省: { 铁岭市: { 银州区: ["工人街", "红旗街"] } },
  上海市: { 上海市: { 黄浦区: ["南京东路", "人民广场"] } },
};
const PROVINCES = Object.keys(REGION);
const citiesOf = (p) => Object.keys(REGION[p] || {});
const districtsOf = (p, c) => Object.keys(REGION[p]?.[c] || {});
const streetsOf = (p, c, d) => REGION[p]?.[c]?.[d] || [];

function AddrModal({ store, type, editing, onClose, onSaved }) {
  const [name, setName] = useState(editing?.name || "");
  const [phone, setPhone] = useState(editing?.phone || "");
  const [detail, setDetail] = useState(editing?.detail || "");
  const [postcode, setPostcode] = useState(editing?.postcode || "");
  const [isDefault, setIsDefault] = useState(editing?.isDefault || false);
  const init = (editing?.region || "").split("/");
  const [prov, setProv] = useState(init[0] || "");
  const [city, setCity] = useState(init[1] || "");
  const [dist, setDist] = useState(init[2] || "");
  const [street, setStreet] = useState(init[3] || "");
  const tab = ADDR_TABS.find((t) => t.k === type);
  const region = [prov, city, dist, street].filter(Boolean).join("/");
  const ok = name.trim() && phone.trim() && region && detail.trim();

  const save = () => {
    const patch = { name: name.trim(), phone: phone.trim(), region, detail: detail.trim(), postcode: postcode.trim(), isDefault };
    store.set((as) => {
      /* 默认互斥：同类型下只留一个默认 */
      const cleared = isDefault ? as.map((a) => (a.type === type ? { ...a, isDefault: false } : a)) : as;
      return editing
        ? cleared.map((a) => (a.id === editing.id ? { ...a, ...patch } : a))
        : [...cleared, { id: "ab" + Date.now(), type, ...patch }];
    });
    onSaved();
  };

  const Sel = ({ v, opts, onPick, ph }) => (
    <select className="ctl" style={{ width: 128 }} value={v} onChange={(e) => onPick(e.target.value)}>
      <option value="">{ph}</option>
      {opts.map((o) => <option key={o}>{o}</option>)}
    </select>
  );

  return (
    <div className="gmock" style={{ zIndex: 130 }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="gbox" style={{ width: 660 }}>
        <b>{editing ? "编辑" : "新增"}{tab?.t}</b>
        <div className="frow" style={{ marginTop: 16 }}>
          <label><i>*</i>联系人</label>
          <div className="fc"><input className="ctl" style={{ width: "100%" }} maxLength={20} placeholder="请输入联系人" value={name} onChange={(e) => setName(e.target.value)} /><span className="note">{name.length}/20</span></div>
        </div>
        <div className="frow">
          <label><i>*</i>联系电话</label>
          <div className="fc"><input className="ctl" style={{ width: "100%" }} maxLength={11} placeholder="请输入联系电话" value={phone} onChange={(e) => setPhone(e.target.value)} /><span className="note">{phone.length}/11</span></div>
        </div>
        <div className="frow">
          <label><i>*</i>所在地区</label>
          <div className="fc" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Sel v={prov} opts={PROVINCES} ph="请选择省份" onPick={(v) => { setProv(v); setCity(""); setDist(""); setStreet(""); }} />
            <Sel v={city} opts={citiesOf(prov)} ph="请选择城市" onPick={(v) => { setCity(v); setDist(""); setStreet(""); }} />
            <Sel v={dist} opts={districtsOf(prov, city)} ph="请选择区县" onPick={(v) => { setDist(v); setStreet(""); }} />
            <Sel v={street} opts={streetsOf(prov, city, dist)} ph="请选择街道" onPick={setStreet} />
          </div>
        </div>
        <div className="frow">
          <label><i>*</i>详细地址</label>
          <div className="fc"><textarea className="ctl" rows={2} maxLength={100} placeholder="请输入详细地址" style={{ width: "100%", padding: 8, fontFamily: "inherit", resize: "vertical" }} value={detail} onChange={(e) => setDetail(e.target.value)} /><span className="note">{detail.length}/100</span></div>
        </div>
        <div className="frow">
          <label>邮编</label>
          <div className="fc"><input className="ctl" maxLength={8} placeholder="请输入邮编" value={postcode} onChange={(e) => setPostcode(e.target.value)} /><span className="note">{postcode.length}/8</span></div>
        </div>
        <div className="frow">
          <label>设为默认</label>
          <div className="fc">
            <label style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13 }}>
              <input type="checkbox" checked={isDefault} onChange={() => setIsDefault((v) => !v)} />
              设为{tab?.t}的默认地址（同类型下互斥）
            </label>
          </div>
        </div>
        <div className="gfoot">
          <button className="btn plain" onClick={onClose}>取消</button>
          <button className="btn primary" disabled={!ok} onClick={save}>确定</button>
        </div>
      </div>
    </div>
  );
}

/* store 可传：租户用 addressBookStore，供应商用自己的 addrStore —— 一份地址、各自维护 */
export function AddressBook({ store = addressBookStore, filter, tabs = ADDR_TABS }) {
  const all = store.use().filter((a) => !filter || filter(a));
  const [tab, setTab] = useState("ship");
  const [modal, setModal] = useState(null);   // null | {} | 编辑的行
  const [toast, tip] = useToast();
  const list = all.filter((a) => a.type === tab);
  const pd = usePaged(list, 10);
  const tabDef = tabs.find((t) => t.k === tab);

  const setDefault = (id) => {
    store.set((as) => as.map((a) => (a.type === tab ? { ...a, isDefault: a.id === id } : a)));
    tip("已设为默认");
  };
  const del = (id) => { store.set((as) => as.filter((a) => a.id !== id)); tip("已删除"); };

  return (
    <>
      <div className="tabs" style={{ display: "flex", gap: 28, borderBottom: "1px solid var(--line)", marginBottom: 16, paddingLeft: 8 }}>
        {tabs.map((t) => (
          <span key={t.k} onClick={() => { setTab(t.k); pd.setPage(1); }}
            style={{
              paddingBottom: 12, fontSize: 14, cursor: "pointer",
              color: tab === t.k ? "var(--brand)" : "var(--text-2)",
              borderBottom: tab === t.k ? "2px solid var(--brand)" : "2px solid transparent",
              fontWeight: tab === t.k ? 600 : 400,
            }}>{t.t}</span>
        ))}
      </div>

      <div className="alert"><span className="ic">i</span>{tabDef?.hint}</div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, margin: "10px 0" }}>
        <button className="btn primary" onClick={() => setModal({})}>添加地址</button>
        <button className="btn" onClick={() => tip("已刷新")}>刷新</button>
      </div>

      <div className="tbl-wrap">
        <table className="tbl-tight">
          <thead><tr>
            <th>联系人</th><th className="tw">联系电话</th><th className="tw">所在地区</th>
            <th>详细地址</th><th className="tw">邮编</th><th className="tw" style={{ width: 90 }}>是否默认</th><th className="tw" style={{ width: 170 }}>操作</th>
          </tr></thead>
          <tbody>
            {pd.pageRows.map((a) => (
              <tr key={a.id}>
                <td>{a.name}</td>
                <td className="tw mono">{a.phone}</td>
                <td className="tw">{a.region}</td>
                <td>{a.detail}</td>
                <td className="tw mono">{a.postcode || "-"}</td>
                <td className="tw">{a.isDefault ? <span className="tag">默认</span> : "否"}</td>
                <td className="tw">
                  <div className="op-col">
                    <button className="gray" onClick={() => setModal(a)}>编辑</button>
                    {!a.isDefault && <button className="gray" onClick={() => setDefault(a.id)}>设置默认</button>}
                    <button className="gray" style={{ color: "#f5522e" }} onClick={() => del(a.id)}>删除</button>
                  </div>
                </td>
              </tr>
            ))}
            {!list.length && <tr><td colSpan={7} style={{ textAlign: "center", padding: 40, color: "#999" }}>暂无地址</td></tr>}
          </tbody>
        </table>
      </div>
      <Pager {...pd} />

      {modal && <AddrModal store={store} type={tab} editing={modal.id ? modal : null} onClose={() => setModal(null)} onSaved={() => { tip(modal.id ? "已保存" : "地址已添加"); setModal(null); }} />}
      {toast}
    </>
  );
}

/* ============================================================================
   快递模板 —— 照真实 SaaS「设置 › 快递模板」复刻
   按「可配送范围 + 计费方式」算运费；计费方式决定表头是「首件/续件」还是「首重/续重」
   ============================================================================ */
/* 供应商后台的地址库：同一套表单，数据是自己的地址簿（发货弹窗从这里选发货地址） */
export function SupplierAddressBook() {
  /* 地址簿按主体归属过滤：原型只有一个供应商登录态（JOJO），正式版一供应商一登录态、无需过滤 */
  return <AddressBook store={addrStore} filter={(a) => a.owner === SUPPLIER_SELF} tabs={SUP_ADDR_TABS} />;
}

export function ExpressTemplate() {
  const list = expressTplStore.use();
  const [sel, setSel] = useState({});
  const [open, setOpen] = useState(false);
  const [toast, tip] = useToast();
  const allSel = list.length > 0 && list.every((t) => sel[t.id]);
  const toggleAll = () => setSel(allSel ? {} : Object.fromEntries(list.map((t) => [t.id, true])));
  const flip = (id) => { expressTplStore.set((ts) => ts.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t))); };
  const del = (id) => { expressTplStore.set((ts) => ts.filter((t) => t.id !== id)); tip("已删除"); };

  return (
    <>
      <div className="alert"><span className="ic">i</span>快递模板按「可配送范围 + 计费方式」算运费，下单时按收货地址命中；同一区域命中多个模板时取最后保存的那个</div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, margin: "10px 0" }}>
        <button className="btn primary" onClick={() => setOpen(true)}>新增快递模板</button>
        <button className="btn" onClick={() => tip("已刷新")}>刷新</button>
      </div>

      <div className="batchbar" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
          <input type="checkbox" checked={allSel} onChange={toggleAll} />批量全选/取消
        </label>
        {Object.keys(sel).filter((k) => sel[k]).length > 0 && (
          <span className="note">已选 {Object.keys(sel).filter((k) => sel[k]).length} 个</span>
        )}
      </div>

      <div className="tbl-wrap">
        <table className="tbl-tight">
          <thead><tr>
            <th style={{ width: 36 }}></th>
            <th>模板名称</th><th className="tw">可配送范围</th><th className="tw">计费方式</th>
            <th className="tw">首件(个)/首重(kg)</th><th className="tw">运费(元)</th>
            <th className="tw">续件(个)/续重(kg)</th><th className="tw">续费(元)</th>
            <th className="tw" style={{ width: 160 }}>操作</th>
          </tr></thead>
          <tbody>
            {list.map((t) => (
              <tr key={t.id}>
                <td><input type="checkbox" checked={!!sel[t.id]} onChange={() => setSel((s) => ({ ...s, [t.id]: !s[t.id] }))} /></td>
                <td>{t.name}{!t.enabled && <span className="tag gray" style={{ marginLeft: 6 }}>已禁用</span>}</td>
                <td className="tw">{t.area}</td>
                <td className="tw">{t.chargeBy}</td>
                <td className="tw mono">{t.first}</td>
                <td className="tw mono">{t.firstFee}</td>
                <td className="tw mono">{t.next}</td>
                <td className="tw mono">{t.nextFee}</td>
                <td className="tw">
                  <div className="op-col">
                    <button className="gray" onClick={() => tip("编辑快递模板（原型未展开）")}>编辑</button>
                    <button className="gray" onClick={() => flip(t.id)}>{t.enabled ? "禁用" : "启用"}</button>
                    <button className="gray" style={{ color: "#f5522e" }} onClick={() => del(t.id)}>删除</button>
                  </div>
                </td>
              </tr>
            ))}
            {!list.length && <tr><td colSpan={9} style={{ textAlign: "center", padding: 40, color: "#999" }}>暂无快递模板</td></tr>}
          </tbody>
        </table>
      </div>

      {open && <TplModal onClose={() => setOpen(false)} onSaved={() => { tip("快递模板已保存"); setOpen(false); }} />}
      {toast}
    </>
  );
}

function TplModal({ onClose, onSaved }) {
  const [name, setName] = useState("");
  const [chargeBy, setChargeBy] = useState("按件");
  const [area, setArea] = useState([]);
  const [first, setFirst] = useState(chargeBy === "按件" ? "1" : "0.1");
  const [firstFee, setFirstFee] = useState("10");
  const [next, setNext] = useState(chargeBy === "按件" ? "1" : "0.1");
  const [nextFee, setNextFee] = useState("5");
  const ok = name.trim() && area.length > 0;
  const unit = chargeBy === "按件" ? "件" : "kg";

  const save = () => {
    expressTplStore.set((ts) => [...ts, {
      id: "et" + Date.now(), name: name.trim(), area: area.join(","),
      chargeBy, first, firstFee, next, nextFee, enabled: true,
    }]);
    onSaved();
  };

  return (
    <div className="gmock" style={{ zIndex: 130 }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="gbox" style={{ width: 760 }}>
        <b>新增快递模板</b>
        <div className="frow" style={{ marginTop: 16 }}>
          <label><i>*</i>模板名称</label>
          <div className="fc"><input className="ctl" style={{ width: "100%" }} maxLength={30} placeholder="请输入模板名称" value={name} onChange={(e) => setName(e.target.value)} /><span className="note">{name.length}/30</span></div>
        </div>
        <div className="frow">
          <label><i>*</i>计费方式</label>
          <div className="fc" style={{ display: "flex", gap: 20 }}>
            {["按件", "按重量"].map((c) => (
              <label key={c} style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13 }}>
                <input type="radio" checked={chargeBy === c} onChange={() => { setChargeBy(c); setFirst(c === "按件" ? "1" : "0.1"); setNext(c === "按件" ? "1" : "0.1"); }} />{c}
              </label>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 8 }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
            <b style={{ fontSize: 13.5 }}>配送区域</b>
            <button className="btn link" style={{ marginLeft: "auto", fontSize: 13 }}
              onClick={() => setArea((a) => (a.length === PROVINCES.length ? [] : [...PROVINCES]))}>
              {area.length === PROVINCES.length ? "取消全选" : "选择可配送范围"}
            </button>
          </div>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 10 }}>
            {PROVINCES.map((p) => (
              <label key={p} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                <input type="checkbox" checked={area.includes(p)} onChange={() => setArea((a) => (a.includes(p) ? a.filter((x) => x !== p) : [...a, p]))} />{p}
              </label>
            ))}
          </div>
          <table className="tbl-tight">
            <thead><tr>
              <th>可配送范围</th>
              <th className="tw">首{unit}</th><th className="tw">运费(元)</th>
              <th className="tw">续{unit}</th><th className="tw">续费(元)</th>
            </tr></thead>
            <tbody>
              {area.length ? (
                <tr>
                  <td>{area.join("，")}</td>
                  <td className="tw"><input className="ctl" style={{ width: 70 }} value={first} onChange={(e) => setFirst(e.target.value)} /></td>
                  <td className="tw"><input className="ctl" style={{ width: 70 }} value={firstFee} onChange={(e) => setFirstFee(e.target.value)} /></td>
                  <td className="tw"><input className="ctl" style={{ width: 70 }} value={next} onChange={(e) => setNext(e.target.value)} /></td>
                  <td className="tw"><input className="ctl" style={{ width: 70 }} value={nextFee} onChange={(e) => setNextFee(e.target.value)} /></td>
                </tr>
              ) : (
                <tr><td colSpan={5} style={{ textAlign: "center", padding: 28, color: "#999" }}>无数据</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="gfoot">
          <button className="btn plain" onClick={onClose}>取消</button>
          <button className="btn primary" disabled={!ok} onClick={save}>保存</button>
        </div>
      </div>
    </div>
  );
}
