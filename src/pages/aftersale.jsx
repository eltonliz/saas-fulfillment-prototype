import React, { useState } from "react";
import { useToast, useRowSelect, BatchBar, usePaged, Pager } from "../ui.jsx";
import { afterSaleStore, orderStore } from "../store.js";
import { EvidencePhotos } from "./supply.jsx";
import { asStatusText, CARRIERS } from "../data.js";

/* 1:1 复刻真实 SAAS「售后管理」页（交易 > 售后管理）：
   列表（页签/筛选/列/备注·详情）+ 整页「售后详情」（状态卡 + 步骤条 + 买家备注 +
   售后申请/订单/客户三栏 + 商品信息 + 维权记录）。
   本页即「总部 / 商家」，所以店铺自营（总部仓直配 · 自有货 / 自提）与一件代发的单据都在这里处理：
   · 自营：待总部审核[同意/拒绝] → 仅退款：待总部退款[原路退款] → 售后完成；
           退货退款：待买家退货 → 待总部签收[同意签收/拒绝签收] → 待总部退款 → 售后完成
   · 一件代发（进销存新增，供应商侧只做货源）：
       待总部审核[同意/拒绝] →（退货退款）待买家退货 → 待供应商签收[供应商签收/拒签]
       → 待总部退款[确认退款] → 售后完成；供应商拒签 → 退货异常[总部裁决：关单 / 仍退款] */

/* 页签按「球在谁手里」分，与真实 SAAS 一致：等商家动手的一栏（审核 + 退款）、等商家收货的一栏
   （总仓 / 供应商签收验收）、等买家动手的一栏（寄回）；退款中 / 退款异常 / 退款成功是钱的状态，
   跟「等谁动」分开。退货异常（供应商拒签 → 总部裁决）也归「待商家处理」——裁决是商家要做的动作，
   状态列用红色「退货异常」标出来。
   列表与详情上的「售后状态」显示的是页签口径（待商家处理 / 待商家收货 / 待买家处理 / 退款成功），
   细分口径（审核 / 退款 / 哪一端签收 / 拒签待裁决）在详情页的步骤条与时间线里 */
const TABS = ["全部", "待商家处理", "待商家收货", "待买家处理", "退款异常", "退款中", "退款成功"];
const inTab = (status, tab) =>
  tab === "全部" ? true
    : tab === "待商家处理" ? ["待总部审核", "待总部退款", "退货异常"].includes(status)
      : tab === "待商家收货" ? ["待总部签收", "待供应商签收"].includes(status)
        : tab === "待买家处理" ? status === "待买家退货"
          : tab === "退款异常" ? status === "退款异常"
            : tab === "退款中" ? status === "退款中"
              : status === "售后完成";

const STEPS_OF = (row) =>
  row.status === "售后关闭" ? ["买家维权", "售后关闭"]
    : row.way === "退货退款" ? ["买家维权", "总部审核", "买家退货", "签收验收", "总部退款", "售后完成"]
      : ["买家维权", "总部审核", "总部退款", "售后完成"];
const STEP_IDX = (row) =>
  row.status === "售后完成" ? 99
    : row.way === "仅退款" ? ({ 待总部审核: 1, 待总部退款: 2, 退款中: 2, 退款异常: 2 }[row.status] ?? 1)
      : ({ 待总部审核: 1, 待买家退货: 2, 待总部签收: 3, 待供应商签收: 3, 退货异常: 3, 待总部退款: 4, 退款中: 4, 退款异常: 4 }[row.status] ?? 1);
const TONE = (s) => (["待总部审核", "待总部退款"].includes(s) ? "warn"
  : s === "退货异常" ? "danger" : s === "售后关闭" ? "gray" : s === "退款异常" ? "danger" : "blue");

const ROWS = [
  {
    no: "ORD260918000211", product: "什锦果蔬", spec: "黑色/l", emoji: "🧺",
    asNo: "R20260918260918000008", way: "仅退款", ship: "暂无", amount: "¥1.00", qty: 1, refund: "¥1.00", points: 0,
    at: "2026-09-18 17:44:36", timeout: "-", reason: "包裹为空", status: "待总部审核",
    buyerNote: "-", refundNote: "-",
    order: { 应付金额: "¥3.00", 实付金额: "¥1.00", 配送方式: "快递", 物流状态: "-" },
    customer: { 申请人: "九九", 收货人: "T1", 联系电话: "13911112217", 收货地址: "重庆市重庆郊县丰都县董家镇测试" },
    goods: { 单价: "3.00", 数量: 1, 实付款: "1.00", 退货数量: 0, 退货金额: "1.00" },
    timeline: [{ t: "买家发起退款申请", lines: ["售后类型：仅退款", "申请退款金额：￥1.00", "退款原因：包裹为空", "退款说明：-"], at: "2026-09-18 17:44:36" }],
  },
  {
    no: "ORD260917000147", product: "华为手机", spec: "蓝色/M", emoji: "📱",
    asNo: "R20260918260918000007", way: "仅退款", ship: "暂无", amount: "¥1.00", qty: 1, refund: "¥1.00", points: 0,
    at: "2026-09-18 17:44:22", timeout: "-", reason: "不想要了", status: "待总部退款",
    buyerNote: "测试售后", refundNote: "测试",
    order: { 应付金额: "¥1.00", 实付金额: "¥1.00", 配送方式: "快递", 物流状态: "已签收" },
    customer: { 申请人: "九九", 收货人: "T1", 联系电话: "13911112217", 收货地址: "重庆市重庆郊县丰都县董家镇测试" },
    goods: { 单价: "1.00", 数量: 1, 实付款: "1.00", 退货数量: 0, 退货金额: "1.00" },
    timeline: [
      { t: "买家发起退款申请", lines: ["售后类型：仅退款", "申请退款金额：￥1.00", "退款原因：不想要了", "退款说明：测试"], at: "2026-09-18 17:44:22" },
      { t: "总部已同意售后申请", lines: [], at: "2026-09-18 18:02:10" },
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
      { t: "总部已同意售后申请", lines: [], at: "2026-09-17 19:02:33" },
      { t: "退款完成", lines: ["退款方式：原路退回", "退款金额：￥1.00"], at: "2026-09-17 20:46:10" },
      { t: "售后完成", lines: [], at: "2026-09-17 20:46:11" },
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
      { t: "总部已同意售后申请，等待买家退货", lines: [], at: "2026-09-19 10:02:47" },
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
      { t: "总部已同意售后申请", lines: [], at: "2026-09-19 11:40:15" },
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
      { t: "总部已同意售后申请", lines: [], at: "2026-09-19 14:22:03" },
      { t: "退款处理中", lines: ["退款方式：原路退回", "预计 1-3 个工作日到账"], at: "2026-09-19 14:30:11" },
    ],
  },
  /* 退货签收样本（总部仓直配，对应订单 ORD260918000021）：买家已退货，待总部签收 */
  {
    no: "ORD260918000218", product: "奶粉(复制)", spec: "800g / 罐", emoji: "🥛",
    asNo: "R20260918260918000012", way: "退货退款", ship: "暂无", amount: "¥268.00", qty: 1, refund: "¥268.00", points: 0,
    at: "2026-09-18 09:32:10", timeout: "-", reason: "不想要了", status: "待总部签收",
    buyerNote: "-", refundNote: "-",
    order: { 应付金额: "¥536.00", 实付金额: "¥536.00", 配送方式: "快递", 物流状态: "已签收" },
    customer: { 申请人: "王悦", 收货人: "王悦", 联系电话: "13566667777", 收货地址: "北京市朝阳区建国路 88 号" },
    goods: { 单价: "268.00", 数量: 1, 实付款: "536.00", 退货数量: 1, 退货金额: "268.00" },
    timeline: [
      { t: "买家发起退款申请", lines: ["售后类型：退货退款", "申请退款金额：￥268.00", "退款原因：不想要了", "退款说明：-"], at: "2026-09-18 09:32:10" },
      { t: "总部已同意售后申请，等待买家退货", lines: [], at: "2026-09-18 09:45:02" },
      { t: "买家已退货，待总部签收", lines: ["退货方式：快递", "物流单号：SF7712009988"], at: "2026-09-19 10:12:40" },
    ],
  },
];

const now = () => new Date().toISOString().slice(0, 19).replace("T", " ");

export function AfterSales() {
  const [own, setOwn] = useState(ROWS);
  /* 一件代发售后单：总部审核 + 总部退款，供应商只做货源（签收验收）。两侧同一份数据 */
  const dropship = afterSaleStore.use().map((r) => ({ ...r, dropship: true }));
  const rows = [...dropship, ...own];
  const [tab, setTab] = useState("全部");
  const [note, setNote] = useState(null);     // 备注
  const [detail, setDetail] = useState(null); // 售后详情（整页复刻）
  const [back, setBack] = useState(null);     // 拒绝签收退货（填退回物流单号）
  const [refundDlg, setRefundDlg] = useState(null);  // 退货异常裁决：原路退款（退款确认）
  const [toast, tip] = useToast();
  const { sel, allSel, toggleAll, toggleOne } = useRowSelect(rows.map((r) => r.no));

  /* 按维权编号更新行 + 同步详情视图；代发单写共享 store（供应商侧同步看到） */
  const act = (row, fn) => {
    const n = fn({ ...row, timeline: [...row.timeline] });
    if (row.dropship) afterSaleStore.set((rs) => rs.map((r) => (r.asNo === row.asNo ? n : r)));
    else setOwn((rs) => rs.map((r) => (r.asNo === row.asNo ? n : r)));
    setDetail({ ...n });
  };
  const addTimeline = (r, t, lines) => { r.timeline = [...r.timeline, { t, lines: lines || [], at: now() }]; };

  /* 待总部审核：同意 / 拒绝 */
  const agree = (row) => {
    act(row, (r) => {
      if (r.way === "仅退款") {
        addTimeline(r, "总部已同意售后申请");
        r.status = "待总部退款";
      } else {
        addTimeline(r, "总部已同意售后申请，等待买家退货");
        r.status = "待买家退货";
      }
      return r;
    });
    tip(row.way === "仅退款" ? "已同意 → 待总部退款" : "已同意 → 等待买家退货");
  };
  /* 代发专属：待总部退款 → 确认退款；退货异常 → 总部裁决 */
  const hqRefund = (row) => {
    act(row, (r) => {
      addTimeline(r, "总部确认退款", ["退款方式：原路退回", `退款金额：￥${r.realRefund || String(r.refund).replace("¥", "")}`]);
      addTimeline(r, "售后完成");
      r.status = "售后完成";
      return r;
    });
    tip("已确认退款（原路退回）→ 售后完成");
  };
  /* 退货异常裁决 · 出口一：认了，原路退款（弹窗可改实退金额、可填说明） */
  const hqForceRefund = (row, { real, note }) => {
    act(row, (r) => {
      const should = String(r.refund).replace("¥", "");
      addTimeline(r, "总部裁决：仍向买家退款", [
        note || "拒签商品由总部与供应商线下处理",
        ...(real === should ? [] : [`应退 ￥${should}，实退 ￥${real}`]),
      ]);
      addTimeline(r, "总部确认退款", ["退款方式：原路退回", `退款金额：￥${real}`]);
      addTimeline(r, "售后完成");
      r.status = "售后完成";
      return r;
    });
    setRefundDlg(null);
    tip("已裁决：原路退款 → 售后完成");
  };
  /* 原型快捷：买家寄回的动作发生在买家端（本原型未做），给个按钮让「审核 → 签收 → 退款」链路能走通 */
  const buyerShipped = (row) => {
    act(row, (r) => {
      addTimeline(r, "买家已退货，待供应商签收", ["退货方式：快递", "物流单号：SF7712009088"]);
      r.status = row.dropship ? "待供应商签收" : "待总部签收";
      return r;
    });
    tip("已模拟买家寄回 → 待" + (row.dropship ? "供应商" : "总部") + "签收");
  };
  const refuseApply = (row) => {
    act(row, (r) => {
      addTimeline(r, "总部拒绝售后申请");
      addTimeline(r, "售后关闭", ["关闭原因：总部拒绝售后申请"]);
      r.status = "售后关闭";
      return r;
    });
    tip("已拒绝 → 售后关闭");
  };
  /* 待总部签收：同意签收 / 拒绝签收（填退回单号） */
  const agreeSign = (row) => {
    act(row, (r) => {
      addTimeline(r, "总部已同意签收退货");
      r.status = "待总部退款";
      return r;
    });
    tip("已同意签收退货 → 待总部退款");
  };
  const refuseSign = (row, backNo, carrier) => {
    act(row, (r) => {
      /* 谁发货谁处理：自营单是总部仓发的货，退回物流由总部登记（与供应商侧同一套流程） */
      addTimeline(r, "总部拒绝签收退货");
      addTimeline(r, "总部寄回商品", [`快递公司：${carrier}`, `物流单号：${backNo}`]);
      addTimeline(r, "售后关闭", ["关闭原因：总部寄回拒签商品,买家签收"]);
      r.status = "售后关闭";
      return r;
    });
    setBack(null);
    tip("已拒绝签收 → 商品寄回 → 售后关闭");
  };
  /* 待总部退款：原路退款 */
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
    const dStatus = asStatusText(d.status);
    const desc =
      d.status === "待总部审核" ? (d.dropship ? "买家已发起售后申请，等待总部审核（总部决定钱款，通过后才轮到供应商处理货）" : "买家已发起售后申请，等待总部审核")
        : d.status === "待总部退款" ? (d.dropship
          ? (d.way === "仅退款" ? "总部已同意售后申请，待总部退款（原路退回买家）；不经供应商，无退货环节" : "供应商已签收验收，待总部退款（原路退回买家）")
          : "总部已同意，待总部退款")
          : d.status === "待买家退货" ? "总部已同意售后申请，等待买家退货"
            : d.status === "待总部签收" ? "买家已退货，待总部签收"
              : d.status === "待供应商签收" ? "买家已退货，待供应商后台签收 / 验收（本页不操作）"
                : d.status === "退货异常" ? "供应商已拒签，待决定钱款：原路退款（退钱给买家）；商品退回由发货方（供应商）处理，它登记寄回物流后本单自动关闭"
                  : d.status === "退款中" ? "退款处理中，预计 1-3 个工作日原路到账"
                    : d.status === "退款异常" ? "原路退款失败（微信支付账户异常），可重新发起退款"
                      : d.status === "售后完成" ? "总部已完成退款"
                        : d.status === "售后关闭"
                          ? ((d.timeline || []).some((t) => /供应商寄回商品|认可供应商拒签/.test(t.t))
                            ? "供应商已登记寄回，商品在退回买家的路上，售后关闭、不退款"
                            : (d.timeline || []).some((t) => /总部拒绝签收退货/.test(t.t))
                              ? "总部拒收退货，商品已寄回买家并经买家签收"
                              : "总部拒绝了本次售后申请，未同意退货、未退款")
                          : "总部拒绝收货已寄回，买家签收";
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
                  {d.dropship ? (
                    <span className="hl" data-hl="进销存：总部审核 + 总部退款，供应商只做货源">
                      {d.status === "待总部审核" && <><button className="btn primary" onClick={() => agree(d)}>同意</button><button className="btn plain" style={{ marginLeft: 10 }} onClick={() => refuseApply(d)}>拒绝</button></>}
                      {d.status === "待总部退款" && <button className="btn primary" onClick={() => hqRefund(d)}>确认退款</button>}
                      {/* 代发单的货在供应商手上，退回只能供应商做——本页只决定钱款；供应商登记寄回后本单自动关闭 */}
                      {d.status === "退货异常" && <button className="btn primary" onClick={() => setRefundDlg(d)}>原路退款</button>}
                      {["待买家退货", "待供应商签收"].includes(d.status) && (
                        <span style={{ fontSize: 12.5, color: "#f5a623" }}>
                          {d.status === "待买家退货" ? "已同意，等待买家寄回" : "买家已寄回，待供应商后台签收验收（本页不操作）"}
                        </span>
                      )}
                      {d.status === "待买家退货" && (
                        <span style={{ color: "#25c7a5", fontSize: 13, cursor: "pointer" }} onClick={() => buyerShipped(d)}>（原型：模拟买家已寄回）</span>
                      )}
                      {["售后完成", "售后关闭"].includes(d.status) && (
                        <span style={{ fontSize: 12.5, color: "#8a949d" }}>{d.status === "售后完成" ? "退款原路退回，去向可在财务中查看" : "该售后单已关闭（不退款）"}</span>
                      )}
                      <span style={{ color: "#25c7a5", fontSize: 13, cursor: "pointer" }} onClick={() => setNote(d)}>备 注</span>
                    </span>
                  ) : (
                    <>
                      {d.status === "待总部审核" && <><button className="btn primary" onClick={() => agree(d)}>同意</button><button className="btn plain" onClick={() => refuseApply(d)}>拒绝</button></>}
                      {d.status === "待总部签收" && <><button className="btn primary" onClick={() => agreeSign(d)}>同意签收退货</button><button className="btn plain" onClick={() => setBack(d)}>拒绝签收退货</button></>}
                      {d.status === "待买家退货" && <span style={{ color: "#25c7a5", fontSize: 13, cursor: "pointer" }} onClick={() => buyerShipped(d)}>（原型：模拟买家已寄回）</span>}
                      {d.status === "待总部退款" && <button className="btn primary" onClick={() => refund(d)}>原路退款</button>}
                      {d.status === "退款异常" && <><button className="btn primary" onClick={() => retryRefund(d)}>重新退款</button><span style={{ fontSize: 12.5, color: "#f5522e" }}>原路退款失败，请重试</span></>}
                      {d.status === "退款中" && <span style={{ fontSize: 12.5, color: "#2f80ed" }}>退款处理中，预计 1-3 个工作日到账</span>}
                      {d.status === "售后完成" && <button className="btn primary" onClick={() => tip("退款原路退回，去向可在财务中查看")}>查看退款去向</button>}
                      <span style={{ color: "#25c7a5", fontSize: 13, cursor: "pointer" }} onClick={() => setNote(d)}>备 注</span>
                    </>
                  )}
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
            {d.note && (
              <div style={{ background: "#f0f7ff", border: "1px solid #cfe3ff", borderRadius: 4, padding: "8px 14px", marginTop: 8, fontSize: 13, color: "var(--text-2)" }}>
                商家备注：{d.note}<span className="note" style={{ marginLeft: 8 }}>仅总部可见</span>
              </div>
            )}

            {d.reject && (
              <div style={{ border: "1px solid var(--line)", borderRadius: 4, padding: "14px 18px", marginTop: 16 }}>
                <b style={{ fontSize: 13.5 }}>拒签信息</b>
                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 9, fontSize: 13, color: "var(--text-2)" }}>
                  <div><span className="note">拒签原因：</span>{d.reject.why}</div>
                  <div><span className="note">退回物流：</span>{d.reject.backNo
                    ? <>{d.reject.carrier ? `${d.reject.carrier} ` : ""}<span className="mono">{d.reject.backNo}</span></>
                    : <span style={{ color: "#8a949d" }}>待发货方（供应商）登记寄回</span>}</div>
                  <div><span className="note">拒签时间：</span><span className="mono">{d.reject.at}</span></div>
                  <div style={{ display: "flex", gap: 8 }}><span className="note" style={{ flex: "none" }}>举证照片：</span><EvidencePhotos evidence={`拒签举证 · 照片 ${d.reject.photos} 张`} size={52} /></div>
                </div>
              </div>
            )}

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
        {note && <NoteModal row={note} onClose={() => setNote(null)} onSaved={(text) => { act(note, (r) => { r.note = text; return r; }); tip("备注已保存（仅总部可见）"); setNote(null); }} />}
        {back && <BackModal row={back} onClose={() => setBack(null)} onOk={(no, carrier) => refuseSign(back, no, carrier)} />}
        {refundDlg && <RefundConfirmModal row={refundDlg} onClose={() => setRefundDlg(null)} onOk={(v) => hqForceRefund(refundDlg, v)} />}
        </>
    );
  }

  /* ---------------- 列表 ---------------- */
  const list = (tab === "全部" ? rows : rows.filter((r) => inTab(r.status, tab)));

  return (
    <>
      <div className="alert"><span className="ic">i</span>一件代发（供应商直发消费者 · 快递）的售后：<b style={{ margin: "0 4px" }}>总部审核 + 总部退款</b>，供应商只处理货源（签收 / 验收）。列表<b style={{ margin: "0 4px" }}>标「代发」</b>的单由本页审核与退款；自营（总部仓直配 · 自有货 / 自提）售后照常</div>

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
              <th style={{ minWidth: 200 }}>商品信息</th><th className="tw">售后编号</th><th className="tw col-new" data-hl="本版新增：代发标" style={{ paddingRight: 92 }}>售后方式</th>
              <th className="tw">发货状态</th><th className="tw">订单金额</th><th className="tw">数量</th>
              <th className="tw">退款金额(元)</th><th className="tw">退还积分</th><th className="tw">申请时间</th><th className="tw">超时时间</th>
              <th className="tw">售后原因</th><th className="tw col-new" data-hl="本版改动：显示词" style={{ paddingRight: 92 }}>售后状态</th>
              <th className="tw col-new" data-hl="本版新增：处理" style={{ paddingRight: 80 }}>操作</th>
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
                <td className="tw col-new">{r.way}{r.dropship && <span className="tag blue" style={{ marginLeft: 6 }}>代发</span>}</td>
                <td className="tw">{r.order.物流状态 && r.order.物流状态 !== "-" ? r.order.物流状态 : r.ship}</td>
                <td className="tw">{r.amount}</td>
                <td className="tw">{r.qty}</td>
                <td className="tw" style={{ color: "#f5522e" }}>{r.refund}</td>
                <td className="tw">{r.points}</td>
                <td className="tw mono">{r.at}</td>
                <td className="tw">{r.timeout}</td>
                <td className="tw">{r.reason}</td>
                <td className="tw col-new"><span className={`tag ${TONE(r.status)}`}>{asStatusText(r.status)}</span></td>
                <td className="tw col-new">
                  <div className="op-col">
                    {r.dropship ? (
                      <>
                        {["待总部审核", "待总部退款", "退货异常"].includes(r.status) && (
                          <span className="hl" data-hl="进销存：代发单由总部审核 / 退款">
                            <button onClick={() => setDetail(r)}>处理</button>
                          </span>
                        )}
                        <button className="gray" onClick={() => setDetail(r)}>详情</button>
                      </>
                    ) : (
                      <>
                        <span style={{ color: "#f5a623", fontSize: 13, height: 20 }}>★★★★★</span>
                        <button className="gray" onClick={() => setNote(r)}>备注</button>
                        <button onClick={() => setDetail(r)}>详情</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pager {...pg} />

      {toast}
      {note && <NoteModal row={note} onClose={() => setNote(null)} onSaved={(text) => { act(note, (r) => { r.note = text; return r; }); tip("备注已保存（仅总部可见）"); setNote(null); }} />}
    </>
  );
}

/* ---------------- 退货异常裁决 · 退款确认（可改实退金额 + 说明） ---------------- */
export function RefundConfirmModal({ row, onClose, onOk }) {
  const should = String(row.refund).replace("¥", "");
  const [real, setReal] = useState(should);
  const [note, setNote] = useState("");
  const valid = real !== "" && !Number.isNaN(Number(real)) && Number(real) >= 0;
  const step = (d) => setReal(String(Math.max(0, Math.round((Number(real || 0) + d) * 100) / 100)));
  return (
    <div className="gmock" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="gbox" style={{ width: 560 }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <b>退款确认</b>
          <span onClick={onClose} style={{ marginLeft: "auto", color: "#bbb", fontSize: 19, cursor: "pointer", lineHeight: 1 }}>×</span>
        </div>
        <div style={{ display: "flex", gap: 26, marginTop: 16, fontSize: 13 }}>
          <span>订单号：<b className="mono">{row.no}</b></span>
          <span>售后单号：<b className="mono">{row.asNo}</b></span>
        </div>
        <div style={{ marginTop: 12, fontSize: 13 }}>售后应退金额：<b style={{ color: "var(--danger)" }}>{should}</b></div>
        <div style={{ marginTop: 8, fontSize: 13 }}>退还积分：<b>{row.points}</b></div>
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 13, marginBottom: 6 }}><i className="req">*</i>售后实退金额</div>
          <span className="qty" style={{ width: "100%" }}>
            <input className="ctl" value={real} onChange={(e) => setReal(e.target.value)} style={{ flex: 1 }} />
            <button className="btn plain" onClick={() => step(-0.01)}>−</button>
            <button className="btn plain" onClick={() => step(0.01)}>＋</button>
          </span>
        </div>
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 13, marginBottom: 6 }}>说明</div>
          <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="请输入说明"
            style={{ width: "100%", padding: 10, border: "1px solid var(--line-2)", borderRadius: 4, fontSize: 13, fontFamily: "inherit", resize: "vertical" }} />
        </div>
        <div className="gfoot">
          <button className="btn plain" onClick={onClose}>取消</button>
          <button className="btn primary" disabled={!valid} onClick={() => onOk({ real: String(Number(real)), note: note.trim() })}>确认</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- 退货异常裁决 · 寄回商品给买家（登记快递公司 + 单号，租户 / 供应商共用） ---------------- */
export function BackToBuyerModal({ row, onClose, onOk }) {
  /* 拒签的商品要寄回买家，所以这里必须给全收件信息（取订单买家快照；没有就回落到售后单的客户信息） */
  const order = orderStore.get().find((o) => o.no === row.no);
  const b = order?.buyer || {};
  const who = b["收件人"] || b["昵称"] || row.customer?.["收件人"] || "—";
  const phone = b["收件人电话"] || row.customer?.["收件人电话"] || "—";
  const addr = b["收件人地址"] || row.customer?.["收货地址"] || "—";
  const [carrier, setCarrier] = useState(CARRIERS[0]);
  const [tracking, setTracking] = useState("");
  return (
    <div className="gmock" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="gbox" style={{ width: 560 }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <b>寄回</b>
          <span onClick={onClose} style={{ marginLeft: "auto", color: "#bbb", fontSize: 19, cursor: "pointer", lineHeight: 1 }}>×</span>
        </div>
        <div style={{ marginTop: 16, fontSize: 13, lineHeight: 2 }}>
          <div>收件人：<b>{who}</b>　收件人电话：<b className="mono">{phone}</b></div>
          <div>收货地址：<b>{addr}</b></div>
        </div>
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 13, marginBottom: 6 }}><i className="req">*</i>快递公司信息</div>
          <select className="ctl" style={{ width: "100%" }} value={carrier} onChange={(e) => setCarrier(e.target.value)}>
            {CARRIERS.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 13, marginBottom: 6 }}><i className="req">*</i>快递单号</div>
          <input className="ctl" style={{ width: "100%" }} placeholder="请填写物流单号" value={tracking} onChange={(e) => setTracking(e.target.value)} />
        </div>
        <div className="gfoot">
          <button className="btn plain" onClick={onClose}>取消</button>
          <button className="btn primary" disabled={!tracking.trim()} onClick={() => onOk({ carrier, tracking: tracking.trim() })}>确认发货</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- 拒绝签收退货（自营单：总部仓发的货，退回物流由总部登记） ---------------- */
function BackModal({ row, onClose, onOk }) {
  const [no, setNo] = useState("");
  const [carrier, setCarrier] = useState(CARRIERS[0]);
  return (
    <div className="gmock" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="gbox">
        <b>拒绝签收退货</b>
        <p>{row.asNo} · {row.product}</p>
        <div className="note" style={{ marginTop: 10, lineHeight: 1.9 }}>
          拒绝签收后，商品将<b>寄回给买家</b>（售后单关闭，不退款）。
        </div>
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 13, marginBottom: 6 }}><i style={{ color: "#f5522e" }}>*</i> 快递公司</div>
          <select className="ctl" style={{ width: "100%" }} value={carrier} onChange={(e) => setCarrier(e.target.value)}>
            {CARRIERS.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 13, marginBottom: 6 }}><i style={{ color: "#f5522e" }}>*</i> 退回物流单号</div>
          <input className="ctl" style={{ width: "100%" }} placeholder="请输入寄回给买家的物流单号" value={no} onChange={(e) => setNo(e.target.value)} />
        </div>
        <div className="gfoot">
          <button className="btn plain" onClick={onClose}>取消</button>
          <button className="btn primary" disabled={!no.trim()} onClick={() => onOk(no.trim(), carrier)}>确认拒绝签收</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- 售后备注 ---------------- */
function NoteModal({ row, onClose, onSaved }) {
  const [text, setText] = useState(row.note || "");
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
          <button className="btn primary" disabled={!text.trim()} onClick={() => onSaved(text.trim())}>保存</button>
        </div>
      </div>
    </div>
  );
}
