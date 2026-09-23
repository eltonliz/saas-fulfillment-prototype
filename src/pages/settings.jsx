import React, { useState } from "react";
import { useToast } from "../ui.jsx";

/* ============================================================================
   通用设置 —— 照真实 SaaS「设置 › 通用设置」复刻
   本期只做「交易设置」页签；其余三个页签仅作占位、不做点击动作
   进销存带来的执行差异用红框标出（.hl + data-hl），其余照抄原系统
   ============================================================================ */
const TABS = ["商品设置", "交易设置", "售后设置", "课程营期设置"];

const Num = ({ v, w = 64 }) => <input className="ctl" defaultValue={v} style={{ width: w, textAlign: "center", height: 30 }} />;
const Unit = ({ v, opts = ["分钟", "小时", "天"], w = 88 }) => (
  <select className="ctl" defaultValue={v} style={{ width: w, height: 30, marginLeft: 8 }}>
    {opts.map((o) => <option key={o}>{o}</option>)}
  </select>
);

function Row({ label, children, note, hl, hlText }) {
  return (
    <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
      <div style={{ width: 156, flex: "none", textAlign: "right", paddingTop: 6, fontSize: 13.5, color: "var(--text-1)" }}>
        {label}<span style={{ color: "#f5522e", marginLeft: 4 }}>*</span>
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
  const [sw, setSw] = useState({ 限制用户退款申请: true, 支付有礼校验: false });
  const [toast, tip] = useToast();
  const flip = (k) => setSw((s) => ({ ...s, [k]: !s[k] }));
  const Sw = ({ k }) => <span className={`switch ${sw[k] ? "on" : ""}`} onClick={() => flip(k)} style={{ cursor: "pointer" }} />;

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
          <span style={{ fontSize: 13.5 }}>拍下未付款订单 <Num v={30} /><Unit v="分钟" /> 内未付款，自动取消订单</span>
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
          <span style={{ fontSize: 13.5 }}>物流发货后 <Num v={14} /> 天，自动确认收货</span>
        </Row>

        <Row label="支付有礼校验" note="当申请退款时，校验订单是否参与了支付有礼并且支付有礼赠送的内容是否能回收，如果不能回收则无法极速退款，用户提交申请后，仍然需求审核">
          <Sw k="支付有礼校验" />
        </Row>

        <Row label="限制用户退款申请" hl hlText="改动：原「极速退款」改为「限制用户退款申请」" note="开启后，买家在下方设置的条件下，不允许发起退款申请；关闭时，则买家均允许发起退款申请">
          <Sw k="限制用户退款申请" />
        </Row>

        <div style={{ paddingLeft: 40 }}>
          <div style={{ display: "block", width: "fit-content", padding: "10px 14px", marginBottom: 20 }}>
            <div style={{ fontSize: 13.5, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <select className="ctl" defaultValue="订单发货" style={{ width: 118, height: 30 }}>
                {["用户下单", "商品下架", "订单发货", "无条件"].map((o) => <option key={o}>{o}</option>)}
              </select>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <input type="radio" name="refundCond" defaultChecked /> <Num v={1} /> <Unit v="天" opts={["天", "小时"]} />
              </label>
            </div>
            <div style={{ fontSize: 13.5, marginTop: 10, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <input type="radio" name="refundCond" /> 第 <Num v={1} />
                <input className="ctl" defaultValue="00:00:00" style={{ width: 96, height: 30, textAlign: "center" }} />
              </label>
              <span>前用户发起退款申请，自动通过，单个用户每天仅限 <Num v={3} /> 次</span>
            </div>
            <div className="note" style={{ marginTop: 8 }}>注：退款金额与退款数量不匹配时，为避免损失，仍需要审核</div>
          </div>
        </div>

        <div className="hl" data-hl="进销存：代发单由供应商执行" style={{ display: "block", marginLeft: 40, marginTop: 6 }}>
          <div style={{ background: "#f7f7f7", padding: "14px 18px", fontSize: 12.5, lineHeight: 2, color: "var(--text-2)" }}>
            <div>用户下单选项1：下单后X天前，指的是每笔订单的下单后X天24小时内可以进行极速退款；也可切换为直接使用小时制</div>
            <div>用户下单选项2：假如设置第1天12:00:00前，如今天10:00:00下单，则次日的中午12点前该笔订单可极速退款</div>
            <div>商品下架：不限制下单时间，只要商品处于上架状态，用户在未核销时发起退款申请均可极速退款；下架后申请均需要进行审核</div>
            <div>订单发货：不限制下单时间，商品在未核销时，且订单状态为【待发货】时，用户发起退款申请可极速退款；核销或者订单发货后，买家发起申请需要审核</div>
            <div>无条件：不限制任意条件，只要用户申请退款，即可通过（支付有礼校验也会无效）</div>
            <div>—— 进销存口径：① 条件内自动通过退款时，须同步关闭对应的供货任务（否则供应商会继续发货）；② 一件代发订单的退款限制 / 审核由<b>供应商</b>执行（流到供应商后台 · 售后处理），不是平台</div>
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
