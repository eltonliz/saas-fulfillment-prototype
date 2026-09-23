import React, { useState } from "react";
import { useToast } from "../ui.jsx";

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
          note="开启后，买家在下方设置的条件下，不允许发起退款申请；关闭时，则买家均允许发起退款申请">
          <Sw k="限制用户退款申请" />
        </Row>

        <div style={{ paddingLeft: 40 }}>
          <div style={{ display: "block", width: "fit-content", padding: "10px 14px", marginBottom: 20 }}>
            <div style={{ fontSize: 13.5, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <select className="ctl" value={cond} onChange={(e) => setCond(e.target.value)} style={{ width: 118, height: 30 }}>
                {["用户下单", "商品下架", "订单发货", "无条件"].map((o) => <option key={o}>{o}</option>)}
              </select>
              {cond === "用户下单" && (
                <label style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <input type="radio" name="refundCond" defaultChecked /> 下单后 <Num v={1} /> <Unit v="天" opts={["天", "小时"]} /> 内
                </label>
              )}
              <span>不允许发起退款申请</span>
            </div>
            {cond === "用户下单" && (
              <div style={{ fontSize: 13.5, marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
                <label style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <input type="radio" name="refundCond" /> 第 <Num v={1} />
                  <input className="ctl" defaultValue="00:00:00" style={{ width: 96, height: 30, textAlign: "center" }} />
                  <span>前</span>
                </label>
              </div>
            )}
          </div>
        </div>

        <div className="hl" data-hl="进销存：代发单由供应商执行" style={{ display: "block", marginLeft: 40, marginTop: 6 }}>
          <div style={{ background: "#f7f7f7", padding: "14px 18px", fontSize: 12.5, lineHeight: 2, color: "var(--text-2)" }}>
            <div>用户下单选项1：下单后X天前，指的是每笔订单的下单后X天24小时内不允许发起退款申请；也可切换为直接使用小时制</div>
            <div>用户下单选项2：假如设置第1天12:00:00前，如今天10:00:00下单，则次日的中午12点前该笔订单不允许发起退款申请</div>
            <div>商品下架：不限制下单时间，只要商品处于上架状态，用户在未核销时不允许发起退款申请；下架后买家可以正常发起</div>
            <div>订单发货：不限制下单时间，商品在未核销时，且订单状态为【待发货】时，不允许发起退款申请；核销或者订单发货后，买家可以正常发起</div>
            <div>无条件：不限制任意条件，买家均不允许发起退款申请</div>
            <div>—— 进销存口径：① 不允许发起 ≠ 不能退——买家可联系商家走线下协商退款；② 一件代发订单的退款限制 / 审核由<b>供应商</b>执行（流到供应商后台 · 售后处理），不是平台</div>
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
