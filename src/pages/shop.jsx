import React, { useState } from "react";
import { SHOP_PRODUCTS, PRODUCTS } from "../data.js";
import { useToast, useRowSelect, BatchBar } from "../ui.jsx";

const modeOf = (name) => (PRODUCTS.find((p) => p.name.replace("(复制)", "") === name.replace("(复制)", "")) || {}).shipMode || "";

export function ShopProduct() {
  const [vis, setVis] = useState(() => Object.fromEntries(SHOP_PRODUCTS.map((p) => [p.id, p.visible])));
  const [shop, setShop] = useState(null);   // 设置门店
  const [toast, tip] = useToast();
  const { sel, allSel, toggleAll, toggleOne } = useRowSelect(SHOP_PRODUCTS.map((p) => p.id));

  return (
    <>
      <div className="filters">
        <div className="row">
          <div className="field"><label>创建时间</label>
            <div className="date"><input className="ctl w-sm" placeholder="开始时间" readOnly /><span className="sep">-</span><input className="ctl w-sm" placeholder="结束时间" readOnly /></div>
          </div>
          <div className="field"><label>商品名称</label><input className="ctl" placeholder="请输入商品名称" /></div>
          <div className="field"><label>商品编码/规格编码</label>
            <select className="ctl w-sm" defaultValue="商品编码"><option>商品编码</option><option>规格编码</option></select>
            <input className="ctl" placeholder="请输入编码" />
          </div>
        </div>
        <div className="row">
          <div className="field"><label>商品类型</label><select className="ctl" style={{ width: 130 }} defaultValue="全部"><option>全部</option></select></div>
          <div className="field"><label>销量</label><div className="range"><input className="ctl w-xs" placeholder="最小值" /><span className="sep">至</span><input className="ctl w-xs" placeholder="最大值" /></div></div>
          <div className="field"><label>价格</label><div className="range"><input className="ctl w-xs" placeholder="最小值" /><span className="sep">至</span><input className="ctl w-xs" placeholder="最大值" /></div></div>
          <div className="field"><label>商品详情</label><select className="ctl" style={{ width: 150 }} defaultValue=""><option value="">请选择</option></select></div>
          <div className="actions"><button className="btn primary">查询</button><button className="btn">重置</button></div>
        </div>
        <div className="row">
          <div className="field"><label>商品类目</label><select className="ctl" defaultValue=""><option value="">请选择类目</option></select></div>
          <div className="field"><label>所属门店</label><select className="ctl" defaultValue="全部"><option>全部</option><option>九天门店</option><option>9071门店</option></select></div>
          <div className="field"><label>商品图片</label><select className="ctl" defaultValue=""><option value="">请选择</option></select></div>
        </div>
      </div>

      <BatchBar allSel={allSel} toggleAll={toggleAll} count={sel.size} />

      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th style={{ width: 40 }}><input type="checkbox" checked={allSel} onChange={toggleAll} /></th>
              <th>商品主图</th><th>商品视频</th><th>商品图文介绍</th><th>商品名</th><th>商品编号</th>
              <th>*采购价</th><th>*总库存</th><th>*售价</th>
              <th className="col-new" data-hl="新增">供货模式</th>
              <th>店员推广</th><th>操作</th>
            </tr>
          </thead>
          <tbody>
            {SHOP_PRODUCTS.map((p) => (
              <tr key={p.id}>
                <td><input type="checkbox" checked={sel.has(p.id)} onChange={() => toggleOne(p.id)} /></td>
                <td>
                  <div className="prod-cell">
                    <span className="thumb" style={{ background: "#f4f7f6" }}>{p.emoji}</span>
                    <small>共(1)张</small>
                  </div>
                </td>
                <td><small style={{ color: "#25c7a5" }}>共(0)个</small></td>
                <td><span className="tag">有内容</span></td>
                <td>{p.name}</td>
                <td className="mono">{p.no}</td>
                <td>{p.purchase}</td>
                <td>{p.stock}</td>
                <td>{p.sale}</td>
                <td className="col-new tw">{modeOf(p.name) || <span style={{ color: "#f5a623" }}>未设置</span>}</td>
                <td>
                  <span className={`switch ${vis[p.id] ? "on" : ""}`} onClick={() => setVis((v) => ({ ...v, [p.id]: !v[p.id] }))} />
                </td>
                <td><button className="btn link" onClick={() => setShop(p)}>设置门店</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pager">
        <span>共{SHOP_PRODUCTS.length}条记录</span>
        <span className="pg">‹</span><span className="pg active">1</span><span className="pg">›</span>
        <select defaultValue="30"><option>30/页</option></select>
        <span className="jump">跳至<input defaultValue="1" />页</span>
      </div>

      {toast}
      {shop && <ProductStoreDrawer row={shop} onClose={() => setShop(null)} onSaved={() => { tip(`「${shop.name}」可售门店已更新`); setShop(null); }} />}
    </>
  );
}

/* ---------------- 设置门店 ---------------- */
const STORES = ["九天门店", "9071门店", "濮源直播间", "天河旗舰店"];

function ProductStoreDrawer({ row, onClose, onSaved }) {
  const [picked, setPicked] = useState(() => new Set(["九天门店", "9071门店"]));
  const toggle = (s) => setPicked((p) => { const n = new Set(p); n.has(s) ? n.delete(s) : n.add(s); return n; });

  return (
    <div className="drawer-mask" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="drawer" style={{ width: 520 }}>
        <header>设置门店<button className="x" onClick={onClose}>×</button></header>
        <div className="body">
          <section className="card">
            <h3>商品</h3>
            <div className="cbody">
              <div className="frow"><label>商品名</label><div className="fc"><input value={row.name} readOnly /></div></div>
              <div className="frow"><label>商品编号</label><div className="fc"><input className="mono" value={row.no} readOnly /></div></div>
              <div className="frow"><label>供货模式</label><div className="fc"><input value={modeOf(row.name) || "未设置"} readOnly /></div></div>
            </div>
          </section>

          <section className="card">
            <h3>可售门店</h3>
            <div className="cbody">
              {STORES.map((s) => (
                <div key={s} className="radio-row" style={{ marginBottom: 12 }}>
                  <label><input type="checkbox" checked={picked.has(s)} onChange={() => toggle(s)} />{s}</label>
                </div>
              ))}
              <div className="note" style={{ marginTop: 4 }}>
                只有被勾选的门店才能在门店端看到并销售该商品。到店自提订单的提货码在<b>全部到货</b>后才激活。
              </div>
            </div>
          </section>
        </div>
        <div className="foot">
          <button className="btn plain" onClick={onClose}>取消</button>
          <button className="btn primary" onClick={onSaved}>保存</button>
        </div>
      </div>
    </div>
  );
}
