import React, { useState, useEffect } from "react";
import { Shell } from "./Shell.jsx";
import { MENU, SUPPLIER_MENU } from "./data.js";
import { ProductManagement, NewProductDrawer } from "./pages/product.jsx";
import { OrderManagement } from "./pages/order.jsx";
import { ShopProduct } from "./pages/shop.jsx";
import { SupplyDispatch, SupplyReceipt, SupplyDiff } from "./pages/supply.jsx";
import { SupDirect, SupToHq, SupToStore, SupDiff, SupAfterSales, SupAccount } from "./pages/supplier.jsx";
import { AfterSales } from "./pages/aftersale.jsx";
import { SupplierMaster } from "./pages/supplierMaster.jsx";
import { GeneralSetting, AddressBook, ExpressTemplate, SupplierAddressBook } from "./pages/settings.jsx";
import { StoreApp } from "./pages/app.jsx";
import { BuyerApp } from "./pages/buyer.jsx";
import { SupplierLogin } from "./pages/login.jsx";
import { TenantReturns, SupplierReturns } from "./pages/returns.jsx";
import { ScenarioList } from "./pages/scenarios.jsx";
import { StateMatrix } from "./pages/states.jsx";
import { FlowsView } from "./pages/flows.jsx";
import { VersionLog } from "./pages/versions.jsx";
import { useToast } from "./ui.jsx";
import { supplyStore, supplierStore, settingStore } from "./store.js";

const SUPPLY_PAGES = ["发货管理", "收货管理", "配送差异", "退货返厂"];

const TENANT = {
  版本记录: { crumbs: ["版本记录"], tabs: ["版本记录"] },
  业务流程图: { crumbs: ["业务流程图"], tabs: ["业务流程图"] },
  场景清单: { crumbs: ["场景清单"], tabs: ["场景清单"] },
  状态与按钮: { crumbs: ["状态与按钮"], tabs: ["状态与按钮"] },
  商品管理: { crumbs: ["商品", "商品管理"], tabs: ["商品管理", "供应商管理", "订单管理"] },
  订单管理: { crumbs: ["交易", "订单管理"], tabs: ["商品管理", "供应商管理", "订单管理"] },
  售后管理: { crumbs: ["交易", "售后管理"], tabs: ["订单管理", "售后管理"] },
  门店商品: { crumbs: ["门店", "门店商品"], tabs: ["商品管理", "门店商品"] },
  供应商管理: { crumbs: ["供应商", "供应商管理"], tabs: ["商品管理", "供应商管理"] },
  发货管理: { crumbs: ["进销存", "发货管理"], tabs: ["发货管理", "收货管理", "配送差异", "退货返厂"] },
  收货管理: { crumbs: ["进销存", "收货管理"], tabs: ["发货管理", "收货管理", "配送差异", "退货返厂"] },
  配送差异: { crumbs: ["进销存", "配送差异"], tabs: ["发货管理", "收货管理", "配送差异", "退货返厂"] },
  退货返厂: { crumbs: ["进销存", "退货返厂"], tabs: ["发货管理", "收货管理", "配送差异", "退货返厂"] },
  快递模板: { crumbs: ["设置", "快递模板"], tabs: ["快递模板"] },
  地址库: { crumbs: ["设置", "地址库"], tabs: ["地址库"] },
  通用设置: { crumbs: ["设置", "通用设置"], tabs: ["通用设置"] },
};
const SUPPLIER = {
  版本记录: { crumbs: ["版本记录"], tabs: ["版本记录"] },
  业务流程图: { crumbs: ["业务流程图"], tabs: ["业务流程图"] },
  场景清单: { crumbs: ["场景清单"], tabs: ["场景清单"] },
  状态与按钮: { crumbs: ["状态与按钮"], tabs: ["状态与按钮"] },
  一件代发: { crumbs: ["供货", "一件代发"], tabs: ["一件代发", "发总部仓", "发门店", "配送差异", "售后处理", "退货返厂"] },
  发总部仓: { crumbs: ["供货", "发总部仓"], tabs: ["一件代发", "发总部仓", "发门店", "配送差异", "售后处理", "退货返厂"] },
  发门店: { crumbs: ["供货", "发门店"], tabs: ["一件代发", "发总部仓", "发门店", "配送差异", "售后处理", "退货返厂"] },
  配送差异: { crumbs: ["供货", "配送差异"], tabs: ["一件代发", "发总部仓", "发门店", "配送差异", "售后处理", "退货返厂"] },
  售后处理: { crumbs: ["供货", "售后处理"], tabs: ["一件代发", "发总部仓", "发门店", "配送差异", "售后处理", "退货返厂"] },
  退货返厂: { crumbs: ["供货", "退货返厂"], tabs: ["一件代发", "发总部仓", "发门店", "配送差异", "售后处理", "退货返厂"] },
  地址库: { crumbs: ["地址库"], tabs: ["地址库"] },
  账号管理: { crumbs: ["设置", "账号管理"], tabs: ["账号管理"] },
};

export function App() {
  const [portal, setPortal] = useState("tenant");
  const [page, setPage] = useState("商品管理");
  const [drawer, setDrawer] = useState(false);
  const [supLoggedIn, setSupLoggedIn] = useState(false);
  const [toast, tip] = useToast();
  const supplyChain = settingStore.use().supplyChain;

  const switchPortal = (p) => {
    setPortal(p);
    if (p === "tenant") setPage("商品管理");
    if (p === "supplier") setPage("一件代发");
  };

  /* 订单「关联供货单」的真实跳转：租户侧可见 → 发货管理；一件代发单（租户侧无此单）→ 供应商后台·一件代发。
     提示用 App 级 toast（跨页面导航后仍可见） */
  const gotoSupply = (no) => {
    const doc = supplyStore.get().find((d) => d.id === no);
    const dest = doc ? "发货管理" : "供应商后台 · 一件代发";
    if (doc) setPage("发货管理");
    else { setPortal("supplier"); setPage("一件代发"); }
    tip(`已跳转「${dest}」，查找供货单 ${no}`);
  };

  /* 已经站在进销存某个页上再把开关关掉 → 退回订单管理，别停在空气页。
     注意：这个 effect 必须留在上面那些提前 return **之前**，否则切到门店APP/买家端时
     App 的 hooks 数量会变，React 会直接报「Rendered fewer hooks than expected」 */
  useEffect(() => {
    if (portal === "tenant" && !supplyChain && SUPPLY_PAGES.includes(page)) setPage("订单管理");
  }, [portal, supplyChain, page]);

  /* 补发单的发货操作已收口在「配送差异」页内，无需跨页跳转 */

  /* 门店 APP */
  if (portal === "app") {
    return (
      <Shell portal={portal} onPortal={switchPortal} bare stateGroup="门店APP" crumbs={["门店 APP（濮源直播间）"]} projectLabel="濮源直播间">
        <StoreApp />
      </Shell>
    );
  }

  /* 买家端（消费者） */
  if (portal === "buyer") {
    return (
      <Shell portal={portal} onPortal={switchPortal} bare stateGroup="买家端" crumbs={["买家端（消费者）"]} projectLabel="买家端">
        <BuyerApp />
      </Shell>
    );
  }

  /* 供应商后台：先过登录页 */
  if (portal === "supplier" && !supLoggedIn) {
    return (
      <div style={{ position: "relative" }}>
        <SupplierLogin onSuccess={() => setSupLoggedIn(true)} />
        <div style={{ position: "fixed", left: 16, bottom: 16, zIndex: 80 }} className="roleswitch">
          <b>切换端</b>
          <div className="row">
            <button onClick={() => switchPortal("tenant")}>租户后台</button>
            <button className="active" onClick={() => switchPortal("supplier")}>供应商后台</button>
            <button onClick={() => switchPortal("app")}>门店APP</button>
            <button onClick={() => switchPortal("buyer")}>买家端</button>
          </div>
        </div>
      </div>
    );
  }

  const isTenant = portal === "tenant";
  /* 关掉进销存的租户看不到左侧「进销存」这一组 —— 菜单是能力的入口，能力关了入口就不该在 */
  const menu = isTenant && !supplyChain ? MENU.filter((m) => m.label !== "进销存") : isTenant ? MENU : SUPPLIER_MENU;
  const routes = isTenant ? TENANT : SUPPLIER;
  const r = routes[page] || routes[Object.keys(routes)[0]];
  const canNav = (t) => (isTenant ? TENANT[t] : SUPPLIER[t]);

  return (
    <>
      <Shell
        portal={portal}
        onPortal={switchPortal}
        active={page}
        crumbs={r.crumbs}
        tabs={r.tabs}
        menu={menu}
        projectLabel={isTenant ? "九天教育" : "JOJO供应商"}
        onNav={(t) => canNav(t) && setPage(t)}
      >
        {isTenant && (
          <>
            {page === "版本记录" && <VersionLog />}
            {page === "业务流程图" && <FlowsView />}
            {page === "场景清单" && <ScenarioList />}
            {page === "状态与按钮" && <StateMatrix />}
            {page === "商品管理" && <ProductManagement onOpenDrawer={() => setDrawer(true)} />}
            {page === "订单管理" && <OrderManagement onOpenSupply={gotoSupply} />}
            {page === "售后管理" && <AfterSales />}
            {page === "门店商品" && <ShopProduct />}
            {page === "供应商管理" && <SupplierMaster />}
            {page === "发货管理" && <SupplyDispatch />}
            {page === "收货管理" && <SupplyReceipt />}
            {page === "配送差异" && <SupplyDiff />}
            {page === "退货返厂" && <TenantReturns />}
            {page === "快递模板" && <ExpressTemplate />}
            {page === "地址库" && <AddressBook />}
            {page === "通用设置" && <GeneralSetting />}
          </>
        )}

        {!isTenant && (
          <>
            {page === "版本记录" && <VersionLog />}
            {page === "业务流程图" && <FlowsView />}
            {page === "场景清单" && <ScenarioList />}
            {page === "状态与按钮" && <StateMatrix />}
            {page === "一件代发" && <SupDirect onNav={setPage} />}
            {page === "发总部仓" && <SupToHq />}
            {page === "发门店" && <SupToStore />}
            {page === "配送差异" && <SupDiff />}
            {page === "售后处理" && <SupAfterSales />}
            {page === "退货返厂" && <SupplierReturns />}
            {page === "地址库" && <SupplierAddressBook />}
            {page === "账号管理" && <SupAccount />}
          </>
        )}
      </Shell>

      {toast}
      {drawer && (
        <NewProductDrawer
          onClose={() => setDrawer(false)}
          onSaved={() => { setDrawer(false); tip("商品已发布"); }}
        />
      )}
    </>
  );
}
