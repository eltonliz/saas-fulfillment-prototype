import React, { useState } from "react";
import { PRODUCTS, PRODUCT_IMG, SUPPLIERS, SHIP_MODES } from "../data.js";
import { useRowSelect, BatchBar } from "../ui.jsx";
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
  const products = productStore.use();
  const rows = products.filter((p) => (tab === "全部" ? true : tab === "自定义分类" ? !!p.customCat : p.status === tab))
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
                  {/* 列内为原 SaaS 既有操作的展示复刻，原型不提供点击 */}
                  <div className="op-col">
                    <span className="static">{p.status === "在售中" ? "数据" : "编辑"}</span>
                    <span className="static">排序</span>
                    <span className="static">设置配送方式</span>
                    <span className="static">定时上下架</span>
                    {p.status === "审核中" && <span className="static">审核</span>}
                    {p.status === "在售中" && <span className="static gray">下架</span>}
                    {p.status === "已下架" && <span className="static">上架</span>}
                    <span className="static gray">复制</span>
                    <span className="static gray">删除</span>
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
                <Hl label="改动：决定由谁发货 · 走哪条链路">
                  <div style={{ padding: 10, width: "100%" }}>
                    <div className="radio-row">
                      {["供应商直配", "总部仓直配", "总部自营"].map((m) => (
                        <label key={m}><input type="radio" checked={mode === m} onChange={() => setMode(m)} />{m}</label>
                      ))}
                      <label style={{ color: "#bbb" }}><input type="radio" disabled />前置仓配送</label>
                    </div>
                    <div className="note">
                      1、供应商直配：货从供应商仓发出，配送方式选快递，则订单由供应商直发给客户；选自提，则订单由供应商直发到客户所选门店，客户到店自提。发货与售后均由供应商处理，租户后台不展示该类订单。<br />
                      2、总部仓直配：货先由供应商仓发给总部仓，然后由总部仓统一发出，配送方式选快递，则订单由总部仓直发给客户；选自提，则订单由总部仓发到客户所选门店，客户到店自提。<br />
                      3、总部自营：货为总部自有（不经供应商），存在总部仓，支付后由总部直接发货给客户或门店，无「待供应商发货 / 待总部仓收货」前置。<br />
                      4、前置仓配送：由各城市前置仓就近发货给客户（暂未开放）<br />
                      注：模式决定订单由谁来发货、走哪条流转路径。创建后选择了模式将不可修改，该设置针对需要核销的商品有效
                    </div>
                  </div>
                </Hl>
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

/* 设置配送方式 / 商品数据 / 审核 / 排序 / 定时上下架 等弹窗为原 SaaS 功能，
   列表「操作」列仅做展示复刻、不提供点击，对应弹窗暂未接入（保留在 git 历史） */
