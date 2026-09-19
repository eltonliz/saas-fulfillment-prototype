import React, { useState } from "react";
import { PRODUCTS, PRODUCT_IMG, SUPPLIERS, SHIP_MODES } from "../data.js";
import { useToast, useRowSelect, BatchBar, Confirm } from "../ui.jsx";
import { productStore } from "../store.js";

const Hl = ({ label, children, cell, cls = "" }) => (
  <span className={`hl ${cell ? "cell" : ""} ${cls}`} data-hl={label}>{children}</span>
);

const Field = ({ label, req, children, cls = "" }) => (
  <div className={`field ${cls}`}>
    {label && <label>{req && <i className="req">*</i>}{label}</label>}
    {children}
  </div>
);

export function ProductManagement({ onOpenDrawer }) {
  const [tab, setTab] = useState("全部");
  const [mode, setMode] = useState("全部");
  const [edit, setEdit] = useState(null);   // 编辑商品抽屉
  const [ship, setShip] = useState(null);   // 设置配送方式
  const [data, setData] = useState(null);   // 经营数据抽屉
  const [off, setOff] = useState(null);     // 下架二次确认
  const [audit, setAudit] = useState(null); // 审核（同步真实 SAAS 行操作）
  const [sort, setSort] = useState(null);   // 排序
  const [timed, setTimed] = useState(null); // 定时上下架
  const [del, setDel] = useState(null);     // 删除
  const [toast, tip] = useToast();
  const products = productStore.use();
  const setProducts = productStore.set;
  const patch = (id, p) => setProducts((ps) => ps.map((x) => (x.id === id ? { ...x, ...p } : x)));
  const rows = products.filter((p) => (tab === "全部" ? true : p.status === tab))
    .filter((p) => (mode === "全部" ? true : p.shipMode === mode));
  const { sel, allSel, toggleAll, toggleOne } = useRowSelect(rows.map((p) => p.id));

  return (
    <>
      <div className="alert">
        <span className="ic">i</span>商品到店自提：根据下单人所属门店选择门店自提点
      </div>

      <div className="filters">
        <div className="row">
          <Field label="创建时间">
            <div className="date">
              <input className="ctl w-sm" placeholder="开始日期" readOnly />
              <span className="sep">→</span>
              <input className="ctl w-sm" placeholder="结束日期" readOnly />
            </div>
          </Field>
          <Field label="商品名称"><input className="ctl" placeholder="请输入商品名称" /></Field>
          <Field label="商品码/条码">
            <select className="ctl w-sm" defaultValue="商品编号"><option>商品编号</option><option>商品条码</option><option>规格编码</option><option>规格条码</option></select>
            <input className="ctl" placeholder="请输入" />
          </Field>
          <Field label="商品类型"><select className="ctl" defaultValue="全部"><option>全部</option><option>实物类商品</option></select></Field>
        </div>
        <div className="row">
          <Field label="销量"><div className="range"><input className="ctl w-xs" placeholder="最小值" /><span className="sep">至</span><input className="ctl w-xs" placeholder="最大值" /></div></Field>
          <Field label="价格"><div className="range"><input className="ctl w-xs" placeholder="最小值" /><span className="sep">至</span><input className="ctl w-xs" placeholder="最大值" /></div></Field>
          <Field label="商品详情"><select className="ctl" defaultValue="全部"><option>全部</option><option>已完成</option><option>未完成</option></select></Field>
          <Field label="商品类目"><select className="ctl" defaultValue=""><option value="">请选择类目</option></select></Field>
        </div>
        <div className="row">
          <Field label="所属门店"><select className="ctl" defaultValue="全部"><option>全部</option><option>九天门店</option><option>9071门店</option></select></Field>
          <Field label="商品图片"><select className="ctl" defaultValue="全部"><option>全部</option><option>已上传</option><option>未上传</option></select></Field>
          <Field label="商品状态"><select className="ctl" defaultValue="全部"><option>全部</option><option>在售中</option><option>已售罄</option><option>在审核</option><option>审核不通过</option><option>已下架</option></select></Field>
          <Field label="所属供应商"><select className="ctl" defaultValue="全部"><option>全部</option>{SUPPLIERS.map((s) => <option key={s.no}>{s.name}</option>)}</select></Field>
          <span className="hl" data-hl="新增筛选">
            <span className="field"><label>供货模式</label>
              <select className="ctl w-sm" value={mode} onChange={(e) => setMode(e.target.value)}>
                <option>全部</option>
                {SHIP_MODES.map((m) => <option key={m}>{m}</option>)}
              </select>
            </span>
          </span>
          <div className="actions">
            <button className="btn primary">查询</button>
            <button className="btn">重置</button>
            <button className="btn">导出</button>
            <Hl label="新增：抽屉含供应商·供货模式" cls="r"><button className="btn primary" onClick={onOpenDrawer}>发布商品</button></Hl>
          </div>
        </div>
      </div>

      <div className="pills">
        {["全部", "审核中", "在售中", "已下架", "审核不通过", "自定义分类"].map((t) => (
          <span key={t} className={`pill ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>{t}</span>
        ))}
      </div>

      <BatchBar allSel={allSel} toggleAll={toggleAll} count={sel.size} />

      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th style={{ width: 40 }}><input type="checkbox" checked={allSel} onChange={toggleAll} /></th>
              <th style={{ width: 56 }}>排序</th>
              <th>商品主图</th><th>商品视频</th><th>商品图文介绍</th><th>商品名称</th><th>商品编号</th>
              <th>可售总库存</th><th>*采购价</th><th>*售价</th><th className="tw">运费</th>
              <th className="col-new" data-hl="新增">关联供应商</th>
              <th className="col-new" data-hl="新增">供货模式</th>
              <th>商品状态</th><th style={{ minWidth: 92 }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td><input type="checkbox" checked={sel.has(p.id)} onChange={() => toggleOne(p.id)} /></td>
                <td>0</td>
                <td>
                  <div className="prod-cell">
                    <span className="thumb" style={{ background: PRODUCT_IMG[p.id].bg }}>{PRODUCT_IMG[p.id].emoji}</span>
                    <small>共(1)张</small>
                  </div>
                </td>
                <td><small style={{ color: "#25c7a5" }}>{p.vid}</small></td>
                <td>{p.intro ? <span className="tag">有内容</span> : <span className="tag gray">无内容</span>}</td>
                <td>{p.name}</td>
                <td className="mono">{p.no}</td>
                <td>{p.stock}</td>
                <td>{p.purchase}</td>
                <td>{p.sale}</td>
                <td className="tw"><span className={p.freight === "已设置" ? "" : "mono"}>{p.freight}</span></td>
                <td className="col-new tw">{p.supplier || <span style={{ color: "#f5a623" }}>未绑定</span>}</td>
                <td className="col-new tw">{p.shipMode || <span style={{ color: "#f5a623" }}>未设置</span>}</td>
                <td><span className={`tag ${p.status === "在售中" ? "" : p.status === "审核中" ? "warn" : "gray"}`}>{p.status}</span></td>
                <td>
                  <div className="op-col">
                    {p.status === "在售中"
                      ? <button onClick={() => setData(p)}>数据</button>
                      : <button onClick={() => setEdit(p)}>编辑</button>}
                    <button onClick={() => setSort(p)}>排序</button>
                    <button onClick={() => setShip(p)}>设置配送方式</button>
                    <button onClick={() => setTimed(p)}>定时上下架</button>
                    {p.status === "审核中" && <button onClick={() => setAudit(p)}>审核</button>}
                    {p.status === "在售中" && <button className="gray" onClick={() => setOff(p)}>下架</button>}
                    {p.status === "已下架" && <button onClick={() => { patch(p.id, { status: "在售中" }); tip(`「${p.name}」已上架`); }}>上架</button>}
                    <button className="gray" onClick={() => tip(`已复制「${p.name}」为草稿`)}>复制</button>
                    <button className="gray" onClick={() => setDel(p)}>删除</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pager">
        <span>共{rows.length}条记录</span>
        <span className="pg">‹</span>
        <span className="pg active">1</span><span className="pg">2</span><span className="pg">›</span>
        <select defaultValue="30"><option>30/页</option><option>50/页</option></select>
        <span className="jump">跳至<input defaultValue="1" />页</span>
      </div>

      {toast}
      {edit && <NewProductDrawer row={edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); tip(`「${edit.name}」已保存`); }} />}
      {ship && <ShipModeDrawer row={ship} onClose={() => setShip(null)} onSaved={() => { tip(`「${ship.name}」配送方式已更新`); setShip(null); }} />}
      {data && <ProductDataDrawer row={data} onClose={() => setData(null)} />}
      {audit && (
        <AuditModal
          row={audit}
          onClose={() => setAudit(null)}
          onPass={() => { patch(audit.id, { status: "在售中" }); tip(`「${audit.name}」审核通过，已上架销售`); setAudit(null); }}
          onReject={() => { patch(audit.id, { status: "审核不通过" }); tip(`「${audit.name}」审核不通过`); setAudit(null); }}
        />
      )}
      {sort && <SortDrawer row={sort} onClose={() => setSort(null)} onSaved={() => { tip(`「${sort.name}」排序已更新`); setSort(null); }} />}
      {timed && <TimedDrawer row={timed} onClose={() => setTimed(null)} onSaved={() => { tip(`「${timed.name}」定时上下架已设置`); setTimed(null); }} />}
      {del && (
        <Confirm
          title="确认删除"
          text={`删除后「${del.name}」不可恢复，历史订单中的商品快照不受影响。是否继续？`}
          okText="确认删除"
          onOk={() => { setProducts((ps) => ps.filter((x) => x.id !== del.id)); tip(`「${del.name}」已删除`); setDel(null); }}
          onCancel={() => setDel(null)}
        />
      )}
      {off && (
        <Confirm
          title="确认下架"
          text={`下架后「${off.name}」将从门店与商城下架，已售订单不受影响。是否继续？`}
          okText="确认下架"
          onOk={() => { tip(`「${off.name}」已下架`); setOff(null); }}
          onCancel={() => setOff(null)}
        />
      )}
    </>
  );
}

/* ---------------- 新增商品（右侧抽屉） ---------------- */
export function NewProductDrawer({ row, onClose, onSaved }) {
  const [mode, setMode] = useState(row?.shipMode || "供应商直配");
  const [supplier, setSupplier] = useState(row?.supplier || "");
  const [delivery, setDelivery] = useState("快递");
  const done = () => (onSaved || onClose)();

  return (
    <div className="drawer-mask" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="drawer">
        <header>{row ? "编辑商品" : "新增商品"}<button className="x" onClick={onClose}>×</button></header>
        <div className="body">
          <section className="card">
            <h3>基本信息</h3>
            <div className="cbody">
              <div className="frow"><label>商品主图</label><div className="fc">
                <div style={{ display: "flex", gap: 10 }}>
                  <div className="upload-box">＋<br /><span style={{ fontSize: 12 }}>添加图片</span></div>
                  <button className="btn plain">AI文生图</button><button className="btn plain">AI图生图</button>
                </div>
                <div className="note">可拖拽图片调整顺序，最多上传 15 张图片；建议宽比 1:1</div>
              </div></div>
              <div className="frow"><label>讲解视频</label><div className="fc">
                <div className="upload-box">＋<br /><span style={{ fontSize: 12 }}>添加视频</span></div>
                <div className="note">展示讲解视频可提高商品下单转化，最多上传 1 个视频，建议宽高比 9:16</div>
              </div></div>
              <div className="frow"><label><i>*</i>商品名称</label><div className="fc"><input defaultValue={row?.name} placeholder="请输入商品名称" /><div className="note">{(row?.name || "").length} / 100</div></div></div>
              <div className="frow"><label>商品编码</label><div className="fc"><input defaultValue={row?.no} placeholder="请输入商品编码" /><div className="note">{(row?.no || "").length} / 30</div></div></div>
              <div className="frow"><label><i>*</i>商品类目</label><div className="fc"><input placeholder="点击选择商品类目" readOnly /></div></div>
              <div className="frow"><label>商品分类</label><div className="fc"><input placeholder="点击选择商品分类" readOnly /></div></div>

              <div className="frow">
                <label></label>
                <div className="fc">
                  <Hl label="新增">
                    <div style={{ padding: 10, width: "100%" }}>
                      <div className="field" style={{ marginBottom: 6 }}>
                        <label><i className="req">*</i>供应商（发货方）</label>
                        <select className="ctl w-lg" value={supplier} onChange={(e) => setSupplier(e.target.value)}>
                          <option value="">请选择供应商</option>
                          {SUPPLIERS.map((s) => <option key={s.no} value={s.name}>{s.name}（{s.no}）</option>)}
                        </select>
                      </div>
                      <div className="note">发货主体有源可循：商品必须绑定供应商，付后自动派单才知道该派给谁。仅启用状态的供应商可选。</div>
                    </div>
                  </Hl>
                </div>
              </div>
            </div>
          </section>

          <section className="card">
            <h3>价格和库存</h3>
            <div className="cbody">
              <div className="frow"><label>商品规格</label><div className="fc">
                <div style={{ display: "flex", gap: 10 }}>
                  <select style={{ maxWidth: 220 }} defaultValue=""><option value="">类目已经存在的规格</option></select>
                  <button className="btn plain">+ 添加规格</button>
                </div>
                <div className="note">若有颜色、尺码、型号等多种规格供买家选择，可添加商品规格。</div>
              </div></div>

              <div className="frow"><label>规格明细</label><div className="fc">
                <table>
                  <thead><tr><th>*名称</th><th>*编码</th><th>*总库存<br /><span style={{ fontWeight: 400, fontSize: 12, color: "#25c7a5" }}>批量</span></th>
                    <th>*采购价<br /><span style={{ fontWeight: 400, fontSize: 12, color: "#25c7a5" }}>批量</span></th>
                    <th>*建议售价<br /><span style={{ fontWeight: 400, fontSize: 12, color: "#25c7a5" }}>批量</span></th>
                    <th>重量(KG)<br /><span style={{ fontWeight: 400, fontSize: 12, color: "#25c7a5" }}>批量</span></th>
                    <th>单位</th><th>操作</th></tr></thead>
                  <tbody><tr>
                    <td><input placeholder="请输入" /></td><td><input placeholder="请输入" /></td>
                    <td><input placeholder="0" /></td><td><input placeholder="0" /></td><td><input placeholder="0" /></td>
                    <td><input placeholder="0" /></td>
                    <td><select defaultValue="件" style={{ width: 78 }}><option>件</option></select></td>
                    <td><span style={{ color: "#25c7a5", cursor: "pointer" }}>删除</span></td>
                  </tr></tbody>
                </table>
              </div></div>

              <div className="frow"><label>采购价格</label><div className="fc">
                <div className="range"><input className="ctl w-xs" placeholder="0" /><span className="sep">~</span><input className="ctl w-xs" placeholder="0" /></div>
                <div className="note">采购价：如果商品与供应商进行绑定，则此处修改会同步修改供应商处的该商品的采购价；在供应商处修改采购价，也会同步至此</div>
              </div></div>
              <div className="frow"><label>商品售价</label><div className="fc"><div className="range"><input className="ctl w-xs" placeholder="0" /><span className="sep">~</span><input className="ctl w-xs" placeholder="0" /></div></div></div>
              <div className="frow"><label>划线价</label><div className="fc"><input style={{ maxWidth: 200 }} placeholder="请输入划线价" /><div className="note">说明：合理填写划线价，对用户有更好的购买吸引力</div></div></div>
              <div className="frow"><label>按单限购</label><div className="fc"><input className="ctl w-xs" placeholder="0" /><div className="note">单笔订单限制购买的数量</div></div></div>

              <div className="frow"><label>发货模式</label><div className="fc">
                <div className="radio-row">
                  {["供应商直配", "总部仓直配"].map((m) => (
                    <label key={m}><input type="radio" checked={mode === m} onChange={() => setMode(m)} />{m}</label>
                  ))}
                  <label style={{ color: "#bbb" }}><input type="radio" disabled />前置仓配送</label>
                </div>
                <div className="note">
                  1、供应商直配：货从供应商仓发出，配送方式选快递，则订单由供应商直发给客户；选自提，则订单由供应商直发到客户所选门店，客户到店自提。<br />
                  2、总部仓直配：货先由供应商仓发给总部仓，然后由总部仓统一发出，配送方式选快递，则订单由总部仓直发给客户；选自提，则订单由总部仓发到客户所选门店，客户到店自提。<br />
                  3、前置仓配送：由各城市前置仓就近发货给客户（暂未开放）<br />
                  注：模式决定订单由谁来发货、走哪条流转路径。创建后选择了模式将不可修改，该设置针对需要核销的商品有效
                </div>
              </div></div>
            </div>
          </section>

          <section className="card">
            <h3>物流配送</h3>
            <div className="cbody">
              <div className="frow"><label><i>*</i>配送方式</label><div className="fc">
                <div className="radio-row">
                  {["快递", "到店自提"].map((d) => (
                    <label key={d}><input type="radio" checked={delivery === d} onChange={() => setDelivery(d)} />{d}</label>
                  ))}
                </div>
              </div></div>
              <div className="frow"><label>邮费</label><div className="fc">
                <div className="radio-row">
                  <label><input type="radio" name="fr" defaultChecked />统一邮费</label><input className="ctl w-xs" placeholder="0" />
                  <label><input type="radio" name="fr" />运费模板</label>
                  <select className="ctl" defaultValue=""><option value="">请选择模板</option></select>
                  <button className="btn link">新增</button><button className="btn link">刷新</button>
                  <label><input type="radio" name="fr" />免除邮费</label>
                </div>
              </div></div>
            </div>
          </section>

          <section className="card">
            <h3>服务保障</h3>
            <div className="cbody">
              <div className="radio-row">
                <label><input type="checkbox" defaultChecked />7 天无理由退换货</label><input className="ctl w-sm" placeholder="请输入" />
              </div>
              <div className="radio-row" style={{ marginTop: 12 }}>
                <label><input type="checkbox" />破碎包退</label><input className="ctl w-sm" placeholder="请输入" />
              </div>
              <div className="radio-row" style={{ marginTop: 12 }}>
                <label><input type="checkbox" />假一赔</label><input className="ctl w-sm" placeholder="请输入" /><input className="ctl w-sm" placeholder="请输入" />
              </div>
            </div>
          </section>

          <section className="card">
            <h3>商品介绍</h3>
            <div className="cbody">
              <div style={{ border: "1px solid #e5e5e5", borderRadius: 3 }}>
                <div style={{ height: 38, borderBottom: "1px solid #efefef", display: "flex", alignItems: "center", gap: 14, padding: "0 12px", color: "#666" }}>
                  <span>Normal ▾</span><b>B</b><i>I</i><u>U</u><span style={{ textDecoration: "underline" }}>S</span><span>A</span>
                  <span>🖼</span><span>🔗</span><span>H₁</span><span>≡</span><span>⋮≡</span>
                </div>
                <div style={{ height: 160 }} />
              </div>
            </div>
          </section>
        </div>
        <div className="foot">
          <button className="btn plain" onClick={onClose}>取消</button>
          <button className="btn primary" onClick={done}>保存</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- 设置配送方式（发货模式创建后不可改） ---------------- */
function ShipModeDrawer({ row, onClose, onSaved }) {
  const locked = !!row.shipMode;
  const [mode, setMode] = useState(row.shipMode || "供应商直配");
  const [delivery, setDelivery] = useState("快递");

  return (
    <div className="drawer-mask" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="drawer" style={{ width: 560 }}>
        <header>设置配送方式<button className="x" onClick={onClose}>×</button></header>
        <div className="body">
          <section className="card">
            <h3>商品</h3>
            <div className="cbody">
              <div className="frow"><label>商品名称</label><div className="fc"><input value={row.name} readOnly /></div></div>
              <div className="frow"><label>商品编号</label><div className="fc"><input value={row.no} readOnly /></div></div>
            </div>
          </section>

          <section className="card">
            <h3>发货模式</h3>
            <div className="cbody">
              {locked && (
                <div className="note" style={{ padding: 10, marginBottom: 12, background: "#fff7e8", border: "1px solid #f5a623", borderRadius: 3 }}>
                  该商品创建时已选定发货模式，<b>创建后不可修改</b>；如需变更请使用「复制」另建商品。
                </div>
              )}
              <div className="radio-row">
                {["供应商直配", "总部仓直配"].map((m) => (
                  <label key={m} style={{ color: locked && m !== mode ? "#bbb" : undefined }}>
                    <input type="radio" checked={mode === m} disabled={locked} onChange={() => setMode(m)} />{m}
                  </label>
                ))}
                <label style={{ color: "#bbb" }}><input type="radio" disabled />前置仓配送</label>
              </div>
              <div className="note">
                1、供应商直配：货从供应商仓发出，配送方式选快递，则订单由供应商直发给客户；选自提，则订单由供应商直发到客户所选门店，客户到店自提。<br />
                2、总部仓直配：货先由供应商仓发给总部仓，然后由总部仓统一发出，配送方式选快递，则订单由总部仓直发给客户；选自提，则订单由总部仓发到客户所选门店，客户到店自提。<br />
                3、前置仓配送：由各城市前置仓就近发货给客户（暂未开放）<br />
                注：模式决定订单由谁来发货、走哪条流转路径。创建后选择了模式将不可修改，该设置针对需要核销的商品有效
              </div>
            </div>
          </section>

          <section className="card">
            <h3>配送方式</h3>
            <div className="cbody">
              <div className="radio-row">
                {["快递", "到店自提"].map((d) => (
                  <label key={d}><input type="radio" checked={delivery === d} onChange={() => setDelivery(d)} />{d}</label>
                ))}
              </div>
              <div className="note">与发货模式联动：总部仓直配 + 到店自提 ⇒ 供应商→总部仓→门店→客户自提。</div>
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

/* ---------------- 商品经营数据 ---------------- */
function ProductDataDrawer({ row, onClose }) {
  const stats = [
    ["近30天销量", "1,286"], ["近30天销售额", "¥38,580.00"], ["近30天退款", "16 单"],
    ["可售总库存", String(row.stock)], ["采购价", String(row.purchase)], ["售价", String(row.sale)],
  ];
  return (
    <div className="drawer-mask" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="drawer" style={{ width: 560 }}>
        <header>商品数据<button className="x" onClick={onClose}>×</button></header>
        <div className="body">
          <section className="card">
            <h3>商品</h3>
            <div className="cbody">
              <div className="frow"><label>商品名称</label><div className="fc"><input value={row.name} readOnly /></div></div>
              <div className="frow"><label>关联供应商</label><div className="fc"><input value={row.supplier || "未绑定"} readOnly /></div></div>
              <div className="frow"><label>供货模式</label><div className="fc"><input value={row.shipMode || "未设置"} readOnly /></div></div>
            </div>
          </section>

          <section className="card">
            <h3>经营数据</h3>
            <div className="cbody">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
                {stats.map(([k, v]) => (
                  <div key={k} style={{ border: "1px solid var(--line)", borderRadius: 4, padding: "12px 14px" }}>
                    <div style={{ fontSize: 12, color: "var(--text-3)" }}>{k}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, marginTop: 6 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
        <div className="foot">
          <button className="btn plain" onClick={onClose}>关闭</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- 商品审核（复刻真实 SAAS「审核商品」弹窗） ---------------- */
function AuditModal({ row, onClose, onPass, onReject }) {
  const [result, setResult] = useState("");
  const [reason, setReason] = useState("");
  const needReason = result === "不通过";
  const ok = result === "通过" || (needReason && reason.trim());

  return (
    <div className="gmock" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="gbox">
        <b>商品审核</b>
        <p>{row.name} · 商品编号 {row.no}</p>
        <div style={{ marginTop: 16 }}>
          <div className="radio-row">
            <label><input type="radio" checked={result === "通过"} onChange={() => setResult("通过")} />通过</label>
            <label><input type="radio" checked={needReason} onChange={() => setResult("不通过")} />不通过</label>
          </div>
        </div>
        {needReason && (
          <textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)}
            placeholder="请填写不通过理由（必填）"
            style={{ width: "100%", marginTop: 12, padding: 10, border: "1px solid var(--line)", borderRadius: 4, fontSize: 13, fontFamily: "inherit", resize: "vertical" }} />
        )}
        <div className="gfoot">
          <button className="btn plain" onClick={onClose}>取消</button>
          <button className="btn primary" disabled={!ok} onClick={() => (needReason ? onReject() : onPass())}>确定</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- 商品排序（复刻真实 SAAS「排序」弹窗） ---------------- */
function SortDrawer({ row, onClose, onSaved }) {
  const [val, setVal] = useState("0");
  return (
    <div className="gmock" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="gbox">
        <b>排序</b>
        <p>{row.name}（列表按排序值升序展示）</p>
        <input className="ctl" value={val} onChange={(e) => setVal(e.target.value.replace(/[^\d]/g, ""))}
          style={{ width: "100%", marginTop: 14 }} placeholder="请输入排序值" />
        <div className="note" style={{ marginTop: 8 }}>数字越小越靠前，默认为 0。</div>
        <div className="gfoot">
          <button className="btn plain" onClick={onClose}>取消</button>
          <button className="btn primary" onClick={onSaved}>保存</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- 定时上下架（复刻真实 SAAS「定时上下架」弹窗） ---------------- */
function TimedDrawer({ row, onClose, onSaved }) {
  const [mode, setMode] = useState("定时上架");
  return (
    <div className="gmock" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="gbox">
        <b>定时上下架</b>
        <p>{row.name}</p>
        <div className="radio-row" style={{ marginTop: 14 }}>
          {["定时上架", "定时下架"].map((m) => (
            <label key={m}><input type="radio" checked={mode === m} onChange={() => setMode(m)} />{m}</label>
          ))}
        </div>
        <div className="field" style={{ marginTop: 14 }}>
          <label>执行时间</label>
          <input className="ctl" type="datetime-local" style={{ width: "100%" }} />
        </div>
        <div className="gfoot">
          <button className="btn plain" onClick={onClose}>取消</button>
          <button className="btn primary" onClick={onSaved}>保存</button>
        </div>
      </div>
    </div>
  );
}
