import React, { useState } from "react";
import { useToast, useRowSelect, BatchBar, usePaged, Pager } from "../ui.jsx";

/* 1:1 复刻真实 SAAS「售后管理」页（交易 > 售后管理）：
   列表（页签/筛选/列/备注·详情）+ 整页「售后详情」（状态卡 + 步骤条 + 买家备注 +
   售后申请/订单/客户三栏 + 商品信息 + 维权记录）。
   处理流程（真实口径）：待商家处理[同意/拒绝] → 仅退款：待商家退款[原路退款] → 售后完成；
   退货退款：等待买家退货 → 待商家签收[同意签收退货/拒绝签收退货] → 待商家退款 → 售后完成；
   拒绝签收退货 → 填退回物流单号（商家寄回商品）→ 售后关闭。 */

const TABS = ["全部", "待商家处理", "待商家收货", "待买家处理", "退款异常", "退款中", "退款成功"];
const inTab = (status, tab) =>
  tab === "全部" ? true
    : tab === "待商家处理" ? ["待商家处理", "待商家退款"].includes(status)
      : tab === "待商家收货" ? status === "待商家签收"
        : tab === "待买家处理" ? status === "待买家退货"
          : tab === "退款异常" ? status === "退款异常"
            : tab === "退款中" ? status === "退款中"
              : status === "售后完成";

const STEPS_OF = (row) =>
  row.status === "售后关闭" ? ["买家维权", "售后关闭"]
    : row.way === "退货退款" ? ["买家维权", "待商家处理", "待商家签收", "待商家退款", "售后完成"]
      : ["买家维权", "待商家处理", "待商家退款", "售后完成"];
const STEP_IDX = (row) =>
  row.status === "售后完成" ? 99
    : row.way === "仅退款" ? ({ 待商家处理: 1, 待商家退款: 2, 退款中: 2, 退款异常: 2 }[row.status] ?? 1)
      : ({ 待商家处理: 1, 待买家退货: 1, 待商家签收: 2, 待商家退款: 3, 退款中: 3, 退款异常: 3 }[row.status] ?? 1);
const TONE = (s) => (s === "待商家处理" ? "warn" : s === "售后关闭" ? "gray" : s === "退款异常" ? "danger" : "blue");

const ROWS = [
  {
    no: "ORD260918000211", product: "什锦果蔬", spec: "黑色/l", emoji: "🧺",
    asNo: "R20260918260918000008", way: "仅退款", ship: "暂无", amount: "¥1.00", qty: 1, refund: "¥1.00", points: 0,
    at: "2026-09-18 17:44:36", timeout: "-", reason: "包裹为空", status: "待商家处理",
    buyerNote: "-", refundNote: "-",
    order: { 应付金额: "¥3.00", 实付金额: "¥1.00", 配送方式: "快递", 物流状态: "-" },
    customer: { 申请人: "九九", 收货人: "T1", 联系电话: "13911112217", 收货地址: "重庆市重庆郊县丰都县董家镇测试" },
    goods: { 单价: "3.00", 数量: 1, 实付款: "1.00", 退货数量: 0, 退货金额: "1.00" },
    timeline: [{ t: "买家发起退款申请", lines: ["售后类型：仅退款", "申请退款金额：￥1.00", "退款原因：包裹为空", "退款说明：-"], at: "2026-09-18 17:44:36" }],
  },
  {
    no: "ORD260917000147", product: "华为手机", spec: "蓝色/M", emoji: "📱",
    asNo: "R20260918260918000007", way: "仅退款", ship: "暂无", amount: "¥1.00", qty: 1, refund: "¥1.00", points: 0,
    at: "2026-09-18 17:44:22", timeout: "-", reason: "不想要了", status: "待商家退款",
    buyerNote: "测试售后", refundNote: "测试",
    order: { 应付金额: "¥1.00", 实付金额: "¥1.00", 配送方式: "快递", 物流状态: "已签收" },
    customer: { 申请人: "九九", 收货人: "T1", 联系电话: "13911112217", 收货地址: "重庆市重庆郊县丰都县董家镇测试" },
    goods: { 单价: "1.00", 数量: 1, 实付款: "1.00", 退货数量: 0, 退货金额: "1.00" },
    timeline: [
      { t: "买家发起退款申请", lines: ["售后类型：仅退款", "申请退款金额：￥1.00", "退款原因：不想要了", "退款说明：测试"], at: "2026-09-18 17:44:22" },
      { t: "商家已同意售后申请", lines: [], at: "2026-09-18 18:02:10" },
    ],
  },
  {
    no: "ORD260910000069", product: "华为手机", spec: "蓝色/S", emoji: "📱",
    asNo: "R20260910260910000004", way: "退货退款", ship: "暂无", amount: "¥0.01", qty: 1, refund: "¥0.01", points: 0,
    at: "2026-09-10 14:40:57", timeout: "-", reason: "无快递信息", status: "待商家处理",
    buyerNote: "测试", refundNote: "测试",
    order: { 应付金额: "¥0.01", 实付金额: "¥0.01", 配送方式: "快递", 物流状态: "已签收" },
    customer: { 申请人: "JJ代理", 收货人: "JOJO", 联系电话: "18100010002", 收货地址: "北京市北京城区昌平区百善镇测试" },
    goods: { 单价: "0.01", 数量: 1, 实付款: "0.01", 退货数量: 1, 退货金额: "0.01" },
    timeline: [{ t: "买家发起退款申请", lines: ["售后类型：退货退款", "申请退款金额：￥0.01", "退款原因：无快递信息", "退款说明：测试"], at: "2026-09-10 14:40:57" }],
  },
  {
    no: "ORD260918000212", product: "华为手机", spec: "蓝色/M", emoji: "📱",
    asNo: "R20260915260915000002", way: "退货退款", ship: "暂无", amount: "¥1.00", qty: 1, refund: "¥1.00", points: 0,
    at: "2026-09-15 10:22:08", timeout: "-", reason: "商品与描述不符", status: "待商家签收",
    buyerNote: "-", refundNote: "-",
    order: { 应付金额: "¥1.00", 实付金额: "¥1.00", 配送方式: "快递", 物流状态: "已签收" },
    customer: { 申请人: "店员10", 收货人: "欧耶", 联系电话: "13580530583", 收货地址: "安徽省蚌埠市蚌山区宏业村街道 234234234" },
    goods: { 单价: "1.00", 数量: 1, 实付款: "1.00", 退货数量: 1, 退货金额: "1.00" },
    timeline: [
      { t: "买家发起退款申请", lines: ["售后类型：退货退款", "申请退款金额：￥1.00", "退款原因：商品与描述不符", "退款说明：-"], at: "2026-09-15 10:22:08" },
      { t: "商家已同意售后申请，等待买家退货", lines: [], at: "2026-09-15 10:30:41" },
      { t: "买家已退货，待商家确认收货", lines: ["退货方式：快递", "物流单号：2585"], at: "2026-09-17 16:27:15" },
    ],
  },
  {
    no: "ORD260917000120", product: "什锦果蔬", spec: "礼盒装", emoji: "🧺",
    asNo: "R20260917260917000005", way: "仅退款", ship: "暂无", amount: "¥1.00", qty: 1, refund: "¥1.00", points: 0,
    at: "2026-09-17 16:29:57", timeout: "-", reason: "不想要了", status: "售后完成",
    buyerNote: "-", refundNote: "-",
    order: { 应付金额: "¥1.00", 实付金额: "¥1.00", 配送方式: "快递", 物流状态: "-" },
    customer: { 申请人: "九九", 收货人: "T1", 联系电话: "13911112217", 收货地址: "重庆市重庆郊县丰都县董家镇测试" },
    goods: { 单价: "1.00", 数量: 1, 实付款: "1.00", 退货数量: 0, 退货金额: "1.00" },
    timeline: [
      { t: "买家发起退款申请", lines: ["售后类型：仅退款", "申请退款金额：￥1.00", "退款原因：不想要了", "退款说明：-"], at: "2026-09-17 16:29:57" },
      { t: "商家已同意售后申请", lines: [], at: "2026-09-17 19:02:33" },
      { t: "退款完成", lines: ["退款方式：原路退回", "退款金额：￥1.00"], at: "2026-09-17 20:46:10" },
      { t: "售后完成", lines: [], at: "2026-09-17 20:46:11" },
    ],
  },
  {
    no: "ORD260912000016", product: "西瓜", spec: "S", emoji: "🍉",
    asNo: "R20260912260912000004", way: "退货退款", ship: "暂无", amount: "¥0.02", qty: 2, refund: "¥0.02", points: 0,
    at: "2026-09-12 15:18:34", timeout: "-", reason: "不想要了", status: "售后关闭",
    buyerNote: "-", refundNote: "-",
    order: { 应付金额: "¥0.02", 实付金额: "¥0.02", 配送方式: "快递", 物流状态: "已发货" },
    customer: { 申请人: "JJ代理", 收货人: "JOJO", 联系电话: "18100010002", 收货地址: "北京市北京城区昌平区百善镇测试" },
    goods: { 单价: "0.01", 数量: 2, 实付款: "0.02", 退货数量: 2, 退货金额: "0.02" },
    timeline: [
      { t: "买家发起退款申请", lines: ["售后类型：退货退款", "申请退款金额：￥0.02", "退款原因：不想要了", "退款说明：-"], at: "2026-09-12 15:18:34" },
      { t: "商家已同意售后申请，等待买家退货", lines: [], at: "2026-09-12 15:28:52" },
      { t: "买家已退货，待商家确认收货", lines: ["退货方式：快递", "物流单号：2585"], at: "2026-09-12 16:27:15" },
      { t: "商家拒绝签收退货", lines: [], at: "2026-09-12 16:29:13" },
      { t: "商家寄回商品", lines: ["退货方式：快递", "物流单号：3323"], at: "2026-09-12 16:30:40" },
      { t: "售后关闭", lines: ["关闭原因：商家寄回拒签商品,买家签收"], at: "2026-09-12 16:41:46" },
    ],
  },
  /* 状态补齐：待买家退货（退货退款已同意，等待买家寄回） */
  {
    no: "ORD260918000215", product: "苹果", spec: "红富士 / 5 斤装", emoji: "🍎",
    asNo: "R20260919260919000009", way: "退货退款", ship: "暂无", amount: "¥5.00", qty: 1, refund: "¥5.00", points: 0,
    at: "2026-09-19 09:35:20", timeout: "-", reason: "不想要了", status: "待买家退货",
    buyerNote: "-", refundNote: "-",
    order: { 应付金额: "¥5.00", 实付金额: "¥5.00", 配送方式: "快递", 物流状态: "已签收" },
    customer: { 申请人: "苏晚", 收货人: "苏晚", 联系电话: "13511118888", 收货地址: "广东省广州市越秀区中山五路 35 号" },
    goods: { 单价: "5.00", 数量: 1, 实付款: "5.00", 退货数量: 1, 退货金额: "5.00" },
    timeline: [
      { t: "买家发起退款申请", lines: ["售后类型：退货退款", "申请退款金额：￥5.00", "退款原因：不想要了", "退款说明：-"], at: "2026-09-19 09:35:20" },
      { t: "商家已同意售后申请，等待买家退货", lines: [], at: "2026-09-19 10:02:47" },
    ],
  },
  /* 状态补齐：退款异常（微信原路退款失败，可重新发起） */
  {
    no: "ORD260918000216", product: "什锦果蔬", spec: "礼盒装", emoji: "🧺",
    asNo: "R20260919260919000010", way: "仅退款", ship: "暂无", amount: "¥3.00", qty: 1, refund: "¥3.00", points: 0,
    at: "2026-09-19 11:20:08", timeout: "-", reason: "包裹为空", status: "退款异常",
    buyerNote: "-", refundNote: "-",
    order: { 应付金额: "¥3.00", 实付金额: "¥3.00", 配送方式: "快递", 物流状态: "已签收" },
    customer: { 申请人: "苏晚", 收货人: "苏晚", 联系电话: "13911112218", 收货地址: "广东省广州市天河区长兴街道 5 栋 205" },
    goods: { 单价: "3.00", 数量: 1, 实付款: "3.00", 退货数量: 0, 退货金额: "3.00" },
    timeline: [
      { t: "买家发起退款申请", lines: ["售后类型：仅退款", "申请退款金额：￥3.00", "退款原因：包裹为空", "退款说明：-"], at: "2026-09-19 11:20:08" },
      { t: "商家已同意售后申请", lines: [], at: "2026-09-19 11:40:15" },
      { t: "退款异常", lines: ["失败原因：微信支付账户异常，原路退款未成功", "可点击「重新退款」再次发起"], at: "2026-09-19 12:05:33" },
    ],
  },
  /* 状态补齐：退款中（原路退款处理中，1-3 个工作日到账） */
  {
    no: "ORD260918000217", product: "苹果", spec: "红富士 / 5 斤装", emoji: "🍎",
    asNo: "R20260919260919000011", way: "仅退款", ship: "暂无", amount: "¥2.00", qty: 1, refund: "¥2.00", points: 0,
    at: "2026-09-19 14:08:56", timeout: "-", reason: "拍错/多拍", status: "退款中",
    buyerNote: "-", refundNote: "-",
    order: { 应付金额: "¥2.00", 实付金额: "¥2.00", 配送方式: "快递", 物流状态: "已签收" },
    customer: { 申请人: "陆知行", 收货人: "陆知行", 联系电话: "13511112223", 收货地址: "广东省广州市越秀区中山五路 35 号" },
    goods: { 单价: "2.00", 数量: 1, 实付款: "2.00", 退货数量: 0, 退货金额: "2.00" },
    timeline: [
      { t: "买家发起退款申请", lines: ["售后类型：仅退款", "申请退款金额：￥2.00", "退款原因：拍错/多拍", "退款说明：-"], at: "2026-09-19 14:08:56" },
      { t: "商家已同意售后申请", lines: [], at: "2026-09-19 14:22:03" },
      { t: "退款处理中", lines: ["退款方式：原路退回", "预计 1-3 个工作日到账"], at: "2026-09-19 14:30:11" },
    ],
  },
];

const now = () => new Date().toISOString().slice(0, 19).replace("T", " ");

export function AfterSales() {
  const [rows, setRows] = useState(ROWS);
  const [tab, setTab] = useState("全部");
  const [note, setNote] = useState(null);     // 备注
  const [detail, setDetail] = useState(null); // 售后详情（整页复刻）
  const [back, setBack] = useState(null);     // 拒绝签收退货（填退回物流单号）
  const [toast, tip] = useToast();
  const { sel, allSel, toggleAll, toggleOne } = useRowSelect(rows.map((r) => r.no));

  /* 按维权编号更新行 + 同步详情视图 */
  const act = (row, fn) => {
    const n = fn({ ...row, timeline: [...row.timeline] });
    setRows((rs) => rs.map((r) => (r.asNo === row.asNo ? n : r)));
    setDetail({ ...n });
  };
  const addTimeline = (r, t, lines) => { r.timeline = [...r.timeline, { t, lines: lines || [], at: now() }]; };

  /* 待商家处理：同意 / 拒绝 */
  const agree = (row) => {
    act(row, (r) => {
      if (r.way === "仅退款") {
        addTimeline(r, "商家已同意售后申请");
        r.status = "待商家退款";
      } else {
        addTimeline(r, "商家已同意售后申请，等待买家退货");
        r.status = "待买家退货";
      }
      return r;
    });
    tip(row.way === "仅退款" ? "已同意 → 待商家退款" : "已同意 → 等待买家退货");
  };
  const refuseApply = (row) => {
    act(row, (r) => {
      addTimeline(r, "商家拒绝售后申请");
      addTimeline(r, "售后关闭", ["关闭原因：商家拒绝售后申请"]);
      r.status = "售后关闭";
      return r;
    });
    tip("已拒绝 → 售后关闭");
  };
  /* 待商家签收：同意签收 / 拒绝签收（填退回单号） */
  const agreeSign = (row) => {
    act(row, (r) => {
      addTimeline(r, "商家已同意签收退货");
      r.status = "待商家退款";
      return r;
    });
    tip("已同意签收退货 → 待商家退款");
  };
  const refuseSign = (row, backNo) => {
    act(row, (r) => {
      addTimeline(r, "商家拒绝签收退货");
      addTimeline(r, "商家寄回商品", ["退货方式：快递", `物流单号：${backNo}`]);
      addTimeline(r, "售后关闭", ["关闭原因：商家寄回拒签商品,买家签收"]);
      r.status = "售后关闭";
      return r;
    });
    setBack(null);
    tip("已拒绝签收 → 商品寄回 → 售后关闭");
  };
  /* 待商家退款：原路退款 */
  const refund = (row) => {
    act(row, (r) => {
      addTimeline(r, "退款完成", ["退款方式：原路退回", `退款金额：￥${r.refund.replace("¥", "")}`]);
      addTimeline(r, "售后完成");
      r.status = "售后完成";
      return r;
    });
    tip("原路退款完成 → 售后完成");
  };
  /* 退款异常：重新发起原路退款 */
  const retryRefund = (row) => {
    act(row, (r) => {
      addTimeline(r, "重新发起退款", ["退款方式：原路退回"]);
      addTimeline(r, "退款完成", [`退款金额：￥${r.refund.replace("¥", "")}`]);
      addTimeline(r, "售后完成");
      r.status = "售后完成";
      return r;
    });
    tip("已重新发起退款，退款完成 → 售后完成");
  };

  /* 分页 hooks 必须写在任何早退（详情页）之前，否则两次渲染 hooks 数量不一致会崩 */
  const pg = usePaged((tab === "全部" ? rows : rows.filter((r) => inTab(r.status, tab))));

  /* ---------------- 整页售后详情（复刻真实 SaaS） ---------------- */
  if (detail) {
    const d = detail;
    const steps = STEPS_OF(d);
    const idx = STEP_IDX(d);
    const dStatus = d.status;
    const desc =
      d.status === "待商家处理" ? "买家已发起售后申请，等待商家处理"
        : d.status === "待商家退款" ? "商家已同意，待商家退款"
          : d.status === "待买家退货" ? "商家已同意售后申请，等待买家退货"
            : d.status === "待商家签收" ? "买家已退货，待商家确认收货"
              : d.status === "退款中" ? "退款处理中，预计 1-3 个工作日原路到账"
                : d.status === "退款异常" ? "原路退款失败（微信支付账户异常），可重新发起退款"
                  : d.status === "售后完成" ? "商家已完成退款"
                    : "商家拒绝收货已寄回，卖家签收";
    return (
      <>
        <div className="card">
          <div className="cbody">
            <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 12, borderBottom: "1px solid var(--line)" }}>
              <span style={{ cursor: "pointer", fontSize: 16 }} onClick={() => setDetail(null)}>←</span>
              <b style={{ fontSize: 15 }}>售后详情</b>
            </div>
            <div style={{ display: "flex", gap: 40, padding: "12px 4px", fontSize: 13, color: "var(--text-2)" }}>
              <span>订单编号：<b className="mono" style={{ color: "var(--text-1)" }}>{d.no}</b></span>
              <span>维权编号：<b className="mono" style={{ color: "var(--text-1)" }}>{d.asNo}</b></span>
            </div>

            <div style={{ display: "flex", border: "1px solid var(--line)", borderRadius: 4 }}>
              <div style={{ width: 340, flex: "none", padding: "18px 20px", borderRight: "1px solid var(--line)" }}>
                <b style={{ fontSize: 15, color: "#25c7a5" }}>{dStatus}</b>
                <div style={{ marginTop: 6, fontSize: 13, color: "var(--text-2)" }}>{desc}</div>
                <div style={{ marginTop: 14, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  {d.status === "待商家处理" && <><button className="btn primary" onClick={() => agree(d)}>同意</button><button className="btn plain" onClick={() => refuseApply(d)}>拒绝</button></>}
                  {d.status === "待商家签收" && <><button className="btn primary" onClick={() => agreeSign(d)}>同意签收退货</button><button className="btn plain" onClick={() => setBack(d)}>拒绝签收退货</button></>}
                  {d.status === "待商家退款" && <button className="btn primary" onClick={() => refund(d)}>原路退款</button>}
                  {d.status === "退款异常" && <><button className="btn primary" onClick={() => retryRefund(d)}>重新退款</button><span style={{ fontSize: 12.5, color: "#f5522e" }}>原路退款失败，请重试</span></>}
                  {d.status === "退款中" && <span style={{ fontSize: 12.5, color: "#2f80ed" }}>退款处理中，预计 1-3 个工作日到账</span>}
                  {d.status === "售后完成" && <button className="btn primary" onClick={() => tip("退款原路退回，去向可在财务中查看")}>查看退款去向</button>}
                  <span style={{ color: "#25c7a5", fontSize: 13, cursor: "pointer" }} onClick={() => setNote(d)}>备 注</span>
                </div>
              </div>
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "18px 10px", overflowX: "auto" }}>
                <div style={{ display: "flex", alignItems: "center", width: "100%", maxWidth: 720, minWidth: 560 }}>
                  {steps.map((s, i) => {
                    const done = idx === 99 || i < idx || d.status === "售后关闭";
                    const cur = i === idx;
                    return (
                      <div key={s} style={{ display: "flex", alignItems: "center", flex: i === steps.length - 1 ? "none" : 1 }}>
                        <div style={{ textAlign: "center", flex: "none" }}>
                          <span style={{ width: 26, height: 26, borderRadius: "50%", display: "grid", placeItems: "center", margin: "0 auto",
                            border: cur ? "none" : "1px solid #25c7a5", background: cur ? "#25c7a5" : "#fff",
                            color: cur ? "#fff" : "#25c7a5", fontSize: 13 }}>
                            {done && !cur ? "✓" : i + 1}
                          </span>
                          <div style={{ marginTop: 6, fontSize: 13, color: cur || done ? "#25c7a5" : "#c2c2c2", fontWeight: cur ? 600 : 400, whiteSpace: "nowrap" }}>{s}</div>
                          {i === 0 && <div style={{ marginTop: 2, fontSize: 12, color: "#b6bdc4" }}>{d.timeline[0]?.at}</div>}
                          {i === steps.length - 1 && idx === 99 && <div style={{ marginTop: 2, fontSize: 12, color: "#b6bdc4" }}>{d.timeline[d.timeline.length - 1]?.at}</div>}
                        </div>
                        {i < steps.length - 1 && <div style={{ flex: 1, height: 1, background: i < idx ? "#25c7a5" : "#e5e5e5", margin: "0 8px", marginBottom: 26 }} />}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div style={{ background: "#fffbe6", border: "1px solid #ffe58f", borderRadius: 4, padding: "8px 14px", marginTop: 14, fontSize: 13, color: "var(--text-2)" }}>
              买家备注：{d.buyerNote}
            </div>

            <div style={{ display: "flex", gap: 24, marginTop: 16 }}>
              {[
                ["售后申请信息", [["售后类型", d.way], ["退款金额", `￥ ${d.refund.replace("¥", "")}`], ["退还积分", d.points], ["退款原因", d.reason], ["退款说明", d.refundNote]]],
                ["订单信息", Object.entries(d.order)],
                ["客户信息", Object.entries(d.customer)],
              ].map(([title, kv]) => (
                <div key={title} style={{ flex: 1, border: "1px solid var(--line)", borderRadius: 4, padding: "14px 18px" }}>
                  <b style={{ fontSize: 13.5 }}>{title}</b>
                  <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 9, fontSize: 13, color: "var(--text-2)" }}>
                    {kv.map(([k, v]) => <div key={k}><span style={{ color: "var(--text-3)" }}>{k}：</span>{String(v)}</div>)}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 16, border: "1px solid var(--line)", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ padding: "10px 16px", fontWeight: 600, fontSize: 13.5, background: "var(--th-bg, #f7f7f7)" }}>商品信息</div>
              <table className="tbl-tight">
                <thead><tr><th>商品</th><th className="tw">单价(元)</th><th className="tw">数量</th><th className="tw">实付款</th><th className="tw">退货数量</th><th className="tw">退货金额</th></tr></thead>
                <tbody><tr>
                  <td><div className="prod-cell"><span className="thumb" style={{ background: "#f4f7f6" }}>{d.emoji}</span><div><div>{d.product}</div><small>规格：{d.spec}</small></div></div></td>
                  <td className="tw">{d.goods.单价}</td><td className="tw">{d.goods.数量}</td><td className="tw">{d.goods.实付款}</td><td className="tw">{d.goods.退货数量}</td><td className="tw">{d.goods.退货金额}</td>
                </tr></tbody>
              </table>
            </div>

            <div style={{ marginTop: 16, border: "1px solid var(--line)", borderRadius: 4, padding: "14px 18px" }}>
              <b style={{ fontSize: 13.5 }}>维权记录</b>
              <div style={{ marginTop: 12 }}>
                {d.timeline.map((t, i) => (
                  <div key={i} style={{ display: "flex", gap: 12 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "none" }}>
                      <span style={{ width: 10, height: 10, borderRadius: "50%", border: "2px solid #25c7a5", background: "#fff", marginTop: 5 }} />
                      {i < d.timeline.length - 1 && <span style={{ flex: 1, width: 1, background: "#dde5e2" }} />}
                    </div>
                    <div style={{ paddingBottom: 18, fontSize: 13 }}>
                      <div style={{ fontWeight: 600 }}>{t.t}</div>
                      {t.lines.map((l, j) => <div key={j} style={{ color: "var(--text-2)", marginTop: 4 }}>{l}</div>)}
                      <div style={{ color: "#b6bdc4", marginTop: 4 }}>{t.at}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {toast}
        {note && <NoteModal row={note} onClose={() => setNote(null)} onSaved={() => { tip("备注已保存"); setNote(null); }} />}
        {back && <BackModal row={back} onClose={() => setBack(null)} onOk={(no) => refuseSign(back, no)} />}
      </>
    );
  }

  /* ---------------- 列表 ---------------- */
  const list = (tab === "全部" ? rows : rows.filter((r) => inTab(r.status, tab)));

  return (
    <>
      <div className="alert"><span className="ic">i</span>一件代发（供应商直发消费者 · 快递）的售后由<b style={{ margin: "0 4px" }}>供应商全流程处理</b>，本页不展示；此处处理总部仓发货（含自有货）/ 自提订单的售后</div>

      <div className="filters">
        <div className="row">
          <div className="field"><label>订单编号</label><input className="ctl" placeholder="请输入订单编号" /></div>
          <span style={{ color: "#666", cursor: "pointer" }}>▾ 展开</span>
          <div className="actions"><button className="btn primary">查询</button><button className="btn">重置</button></div>
        </div>
      </div>

      <div className="pills">
        {TABS.map((t) => (
          <span key={t} className={`pill ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>{t}</span>
        ))}
        <div className="right">
          <select className="ctl" style={{ width: 160 }} defaultValue="按照申请时间降序"><option>按照申请时间降序</option><option>按照申请时间升序</option></select>
        </div>
      </div>

      <BatchBar allSel={allSel} toggleAll={toggleAll} count={sel.size} />

      <div className="tbl-wrap">
        <table className="tbl-tight">
          <thead>
            <tr>
              <th style={{ width: 36 }}><input type="checkbox" checked={allSel} onChange={toggleAll} /></th>
              <th style={{ width: 40 }}>序号</th>
              <th style={{ minWidth: 200 }}>商品信息</th><th className="tw">售后编号</th><th className="tw">售后方式</th>
              <th className="tw">发货状态</th><th className="tw">订单金额</th><th className="tw">数量</th>
              <th className="tw">退款金额(元)</th><th className="tw">退还积分</th><th className="tw">申请时间</th><th className="tw">超时时间</th>
              <th className="tw">售后原因</th><th className="tw">售后状态</th>
              <th className="tw">操作</th>
            </tr>
          </thead>
          <tbody>
            {pg.pageRows.map((r, i) => (
              <tr key={r.no + r.asNo}>
                <td><input type="checkbox" checked={sel.has(r.no)} onChange={() => toggleOne(r.no)} /></td>
                <td>{(pg.page - 1) * pg.pageSize + i + 1}</td>
                <td>
                  <div className="prod-cell">
                    <span className="thumb" style={{ background: "#f4f7f6" }}>{r.emoji}</span>
                    <div>
                      <div>订单号：<span className="mono" style={{ color: "#25c7a5" }}>{r.no}</span></div>
                      <div>{r.product}</div>
                      <small>{r.spec}</small>
                    </div>
                  </div>
                </td>
                <td className="tw mono">{r.asNo}…</td>
                <td className="tw">{r.way}</td>
                <td className="tw">{r.order.物流状态 && r.order.物流状态 !== "-" ? r.order.物流状态 : r.ship}</td>
                <td className="tw">{r.amount}</td>
                <td className="tw">{r.qty}</td>
                <td className="tw" style={{ color: "#f5522e" }}>{r.refund}</td>
                <td className="tw">{r.points}</td>
                <td className="tw mono">{r.at}</td>
                <td className="tw">{r.timeout}</td>
                <td className="tw">{r.reason}</td>
                <td className="tw"><span className={`tag ${TONE(r.status)}`}>{r.status}</span></td>
                <td className="tw">
                  <div className="op-col">
                    <span style={{ color: "#f5a623", fontSize: 13, height: 20 }}>★★★★★</span>
                    <button className="gray" onClick={() => setNote(r)}>备注</button>
                    <button onClick={() => setDetail(r)}>详情</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pager {...pg} />

      {toast}
      {note && <NoteModal row={note} onClose={() => setNote(null)} onSaved={() => { tip("备注已保存"); setNote(null); }} />}
    </>
  );
}

/* ---------------- 拒绝签收退货（商家寄回商品，必填退回物流单号） ---------------- */
function BackModal({ row, onClose, onOk }) {
  const [no, setNo] = useState("");
  return (
    <div className="gmock" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="gbox">
        <b>拒绝签收退货</b>
        <p>{row.asNo} · {row.product}</p>
        <div className="note" style={{ marginTop: 10, lineHeight: 1.9 }}>
          拒绝签收后，商品将<b>寄回给买家</b>（售后单关闭，不退款）。
        </div>
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 13, marginBottom: 6 }}><i style={{ color: "#f5522e" }}>*</i> 退回物流单号</div>
          <input className="ctl" style={{ width: "100%" }} placeholder="请输入寄回给买家的物流单号" value={no} onChange={(e) => setNo(e.target.value)} />
        </div>
        <div className="gfoot">
          <button className="btn plain" onClick={onClose}>取消</button>
          <button className="btn primary" disabled={!no.trim()} onClick={() => onOk(no.trim())}>确认拒绝签收</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- 售后备注 ---------------- */
function NoteModal({ row, onClose, onSaved }) {
  const [text, setText] = useState("");
  return (
    <div className="gmock" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="gbox">
        <b>售后备注</b>
        <p>订单号 {row.no} · {row.product}</p>
        <textarea rows={4} value={text} onChange={(e) => setText(e.target.value)}
          placeholder="填写内部备注，仅商家侧可见（不展示给买家与供应商）"
          style={{ width: "100%", marginTop: 12, padding: 10, border: "1px solid var(--line)", borderRadius: 4, fontSize: 13, fontFamily: "inherit", resize: "vertical" }} />
        <div className="gfoot">
          <button className="btn plain" onClick={onClose}>取消</button>
          <button className="btn primary" disabled={!text.trim()} onClick={onSaved}>保存</button>
        </div>
      </div>
    </div>
  );
}
