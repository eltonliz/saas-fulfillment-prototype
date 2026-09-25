# -*- coding: utf-8 -*-
"""供应商后台加「项目名称」列 / 详情行"""
import io

def edit(path, pairs):
    s = io.open(path, encoding='utf-8').read()
    for old, new, tag in pairs:
        c = s.count(old)
        print(('OK ' if c == 1 else 'MISS'), c, path.split('/')[-1], tag)
        assert c == 1, (path, tag)
        s = s.replace(old, new)
    io.open(path, 'w', encoding='utf-8').write(s)

# ---------------- 1. store.js：单据带「所属项目」字段 ----------------
edit('src/store.js', [
(
'''export const supplyStore = createStore(SUPPLY_DOCS);         // 供货单（租户侧可见范围）
export const supplierStore = createStore(SUPPLIER_DOCS);     // 供货单（供应商侧可见范围）
export const diffStore = createStore(DIFFS);                 // 配送差异单
export const returnStore = createStore(RETURNS);             // 退货返厂单
export const orderStore = createStore(ORDERS_READY);         // 销售订单（已生成任务的订单带 batchNos，按链路判重见 poolOf）''',
'''/* 供应商是**全局主体**：同一个供应商账号可以在多个项目（租户）下都有单 ——
   所以每张单据都带「所属项目」，供应商后台的列表与详情要显示它，否则多项目的单混在一起分不清是谁的。
   本原型只有一个项目，正式版这个值来自登录身份（租户 × 供应商） */
export const PROJECT_NAME = "九天教育";
const withProject = (rows) => rows.map((r) => ({ ...r, project: r.project || PROJECT_NAME }));

export const supplyStore = createStore(withProject(SUPPLY_DOCS));         // 供货单（租户侧可见范围）
export const supplierStore = createStore(withProject(SUPPLIER_DOCS));     // 供货单（供应商侧可见范围）
export const diffStore = createStore(withProject(DIFFS));                 // 配送差异单
export const returnStore = createStore(withProject(RETURNS));             // 退货返厂单
export const orderStore = createStore(withProject(ORDERS_READY));         // 销售订单（已生成任务的订单带 batchNos，按链路判重见 poolOf）''',
'store 定义'),
('''export const afterSaleStore = createStore(AFTER_SALES);      // 售后单（代发：总部审核退款、供应商只做货源，两侧同一份）''',
 '''export const afterSaleStore = createStore(withProject(AFTER_SALES));      // 售后单（代发：总部审核退款、供应商只做货源，两侧同一份）''',
 '售后 store'),
('''export const addDoc = (doc) => {
  const SHARED = ["supplier_to_hq", "supplier_inbound"];
  if (SHARED.includes(doc.leg)) { supplyStore.set((ds) => [doc, ...ds]); supplierStore.set((ds) => [doc, ...ds]); }
  else if (doc.leg === "sup_consumer") supplierStore.set((ds) => [doc, ...ds]);
  else supplyStore.set((ds) => [doc, ...ds]);
};''',
 '''export const addDoc = (raw) => {
  const doc = { ...raw, project: raw.project || PROJECT_NAME };
  const SHARED = ["supplier_to_hq", "supplier_inbound"];
  if (SHARED.includes(doc.leg)) { supplyStore.set((ds) => [doc, ...ds]); supplierStore.set((ds) => [doc, ...ds]); }
  else if (doc.leg === "sup_consumer") supplierStore.set((ds) => [doc, ...ds]);
  else supplyStore.set((ds) => [doc, ...ds]);
};''',
 'addDoc'),
('''export const addDiff = (diff) => diffStore.set((ds) => [diff, ...ds]);''',
 '''export const addDiff = (raw) => diffStore.set((ds) => [{ ...raw, project: raw.project || PROJECT_NAME }, ...ds]);''',
 'addDiff'),
])

# ---------------- 2. supplier.jsx：五个列表加「项目」列 + 详情加行 ----------------
edit('src/pages/supplier.jsx', [
# 发总部仓 / 发门店
('''              <th className="tw">供货单号</th><th className="tw">关联销售订单</th><th>商品</th>''',
 '''              <th className="tw">供货单号</th><th className="tw">项目</th><th className="tw">关联销售订单</th><th>商品</th>''',
 'SupTasks 表头'),
('''                <td className="tw mono">
                  {d.id}
                  <MakeupTag d={d} />
                </td>''',
 '''                <td className="tw mono">
                  {d.id}
                  <MakeupTag d={d} />
                </td>
                <td className="tw">{d.project}</td>''',
 'SupTasks 行'),
# 一件代发
('''              <th style={{ minWidth: 196 }}>商品信息</th>
              <th style={{ minWidth: 84 }}>售后信息</th>''',
 '''              <th style={{ minWidth: 96 }}>项目</th>
              <th style={{ minWidth: 196 }}>商品信息</th>
              <th style={{ minWidth: 84 }}>售后信息</th>''',
 'SupDirect 表头'),
('''            {pg.pageRows.map((o) => (
              <tr key={o.id}>
                <td>
                  <div className="prod-cell">
                    <span className="thumb" style={{ background: "#f4f7f6" }}>{o.emoji}</span>
                    <div>
                      <div>订单号：<span className="mono" style={{ color: "#25c7a5" }}>{o.no}</span></div>''',
 '''            {pg.pageRows.map((o) => (
              <tr key={o.id}>
                <td className="tw">{o.project}</td>
                <td>
                  <div className="prod-cell">
                    <span className="thumb" style={{ background: "#f4f7f6" }}>{o.emoji}</span>
                    <div>
                      <div>订单号：<span className="mono" style={{ color: "#25c7a5" }}>{o.no}</span></div>''',
 'SupDirect 行'),
# 配送差异
('''            <tr><th className="tw">差异单号</th><th className="tw">来源链路</th><th className="tw">关联供货单</th><th>差异摘要</th><th className="tw">异常原因 / 凭证</th><th className="tw">审核结果</th><th className="tw">状态</th><th className="tw">补发任务</th><th className="tw">操作</th></tr>''',
 '''            <tr><th className="tw">差异单号</th><th className="tw">项目</th><th className="tw">来源链路</th><th className="tw">关联供货单</th><th>差异摘要</th><th className="tw">异常原因 / 凭证</th><th className="tw">审核结果</th><th className="tw">状态</th><th className="tw">补发任务</th><th className="tw">操作</th></tr>''',
 'SupDiff 表头'),
('''                <td className="tw mono">{d.id}</td>
                <td className="tw">{d.leg}</td>
                <td className="tw mono">{d.supplyNo}</td>''',
 '''                <td className="tw mono">{d.id}</td>
                <td className="tw">{d.project}</td>
                <td className="tw">{d.leg}</td>
                <td className="tw mono">{d.supplyNo}</td>''',
 'SupDiff 行'),
# 售后处理
('''              <th style={{ width: 40 }}>序号</th>
              <th style={{ minWidth: 200 }}>商品信息</th><th className="tw">售后编号</th><th className="tw">售后方式</th>''',
 '''              <th style={{ width: 40 }}>序号</th>
              <th className="tw">项目</th>
              <th style={{ minWidth: 200 }}>商品信息</th><th className="tw">售后编号</th><th className="tw">售后方式</th>''',
 'SupAfterSales 表头'),
('''                <td><input type="checkbox" checked={sel.has(r.asNo)} onChange={() => toggleOne(r.asNo)} /></td>
                <td>{(pgA.page - 1) * pgA.pageSize + i + 1}</td>''',
 '''                <td><input type="checkbox" checked={sel.has(r.asNo)} onChange={() => toggleOne(r.asNo)} /></td>
                <td>{(pgA.page - 1) * pgA.pageSize + i + 1}</td>
                <td className="tw">{r.project}</td>''',
 'SupAfterSales 行'),
# 供货单详情：供货状态后加「所属项目」
('''              <div className="field"><label>供货状态</label><span className={`tag ${doc.status === "收货异常" ? "danger" : ""}`}>{doc.status === "部分收货" ? "已发货" : doc.status}</span>{doc.status === "部分收货" && <span className="note" style={{ display: "inline", marginLeft: 6, color: "#f5a623" }}>部分收货</span>}</div>''',
 '''              <div className="field"><label>供货状态</label><span className={`tag ${doc.status === "收货异常" ? "danger" : ""}`}>{doc.status === "部分收货" ? "已发货" : doc.status}</span>{doc.status === "部分收货" && <span className="note" style={{ display: "inline", marginLeft: 6, color: "#f5a623" }}>部分收货</span>}</div>
              <div className="field"><label>所属项目</label><b>{doc.project}</b></div>''',
 'SupDocDrawer 项目行'),
# 订单详情：订单编号后加「所属项目」
('''            <span style={{ color: "#666" }}>订单编号：<span className="mono">{order.no}</span></span>''',
 '''            <span style={{ color: "#666" }}>订单编号：<span className="mono">{order.no}</span></span>
            <span style={{ marginLeft: "auto", fontSize: 13, color: "#666" }}>所属项目：<b style={{ color: "#333" }}>{order.project}</b></span>''',
 'SupOrderDetailDrawer 项目'),
# 售后详情：售后申请信息块加「所属项目」
('''                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 9, fontSize: 13, color: "var(--text-2)" }}>
                  <div><span className="note">售后类型：</span>{d.way}</div>''',
 '''                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 9, fontSize: 13, color: "var(--text-2)" }}>
                  <div><span className="note">所属项目：</span>{d.project}</div>
                  <div><span className="note">售后类型：</span>{d.way}</div>''',
 'SupAfterSales 详情'),
])

# ---------------- 3. returns.jsx：供应商返厂列表 + 详情 ----------------
edit('src/pages/returns.jsx', [
('''            <tr><th className="tw">返厂单号</th><th className="tw">退货门店</th><th>商品</th><th className="tw">退货数量</th><th className="tw">退货原因</th><th className="tw">金额</th><th className="tw">状态</th><th style={{ minWidth: 92 }}>操作</th></tr>''',
 '''            <tr><th className="tw">返厂单号</th><th className="tw">项目</th><th className="tw">退货门店</th><th>商品</th><th className="tw">退货数量</th><th className="tw">退货原因</th><th className="tw">金额</th><th className="tw">状态</th><th style={{ minWidth: 92 }}>操作</th></tr>''',
 '供应商返厂表头'),
('''                  <td className="tw mono">{r.id}<small>{r.createdAt}</small></td>
                  <td className="tw">{r.store}</td>''',
 '''                  <td className="tw mono">{r.id}<small>{r.createdAt}</small></td>
                  <td className="tw">{r.project}</td>
                  <td className="tw">{r.store}</td>''',
 '供应商返厂行'),
('''            <div className="cbody">
              <div className="frow"><label>退货门店</label><div className="fc"><input value={row.store} readOnly /></div></div>''',
 '''            <div className="cbody">
              <div className="frow"><label>所属项目</label><div className="fc"><input value={row.project} readOnly /></div></div>
              <div className="frow"><label>退货门店</label><div className="fc"><input value={row.store} readOnly /></div></div>''',
 '返厂详情项目行'),
])
print('done')
