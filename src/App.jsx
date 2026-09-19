import React, { useState } from "react";
import { Shell } from "./Shell.jsx";
import { MENU, SUPPLIER_MENU } from "./data.js";
import { ProductManagement, NewProductDrawer } from "./pages/product.jsx";
import { OrderManagement } from "./pages/order.jsx";
import { ShopProduct } from "./pages/shop.jsx";
import { SupplyDispatch, SupplyReceipt, SupplyDiff } from "./pages/supply.jsx";
import { SupDirect, SupToHq, SupToStore, SupDiff, SupAfterSales, SupAccount } from "./pages/supplier.jsx";
import { AfterSales } from "./pages/aftersale.jsx";
import { SupplierMaster } from "./pages/supplierMaster.jsx";
import { StoreApp } from "./pages/app.jsx";
import { BuyerApp } from "./pages/buyer.jsx";
import { SupplierLogin } from "./pages/login.jsx";
import { TenantReturns, SupplierReturns } from "./pages/returns.jsx";
import { ScenarioList } from "./pages/scenarios.jsx";
import { FlowsView } from "./pages/flows.jsx";
import { VersionLog } from "./pages/versions.jsx";
import { useToast } from "./ui.jsx";

const TENANT = {
  版本记录: { crumbs: ["版本记录"], tabs: ["版本记录"] },
  业务流程图: { crumbs: ["业务流程图"], tabs: ["业务流程图"] },
  场景清单: { crumbs: ["场景清单"], tabs: ["场景清单"] },
  商品管理: { crumbs: ["商品", "商品管理"], tabs: ["商品管理", "供应商管理", "订单管理"] },
  订单管理: { crumbs: ["交易", "订单管理"], tabs: ["商品管理", "供应商管理", "订单管理"] },
  售后管理: { crumbs: ["交易", "售后管理"], tabs: ["订单管理", "售后管理"] },
  门店商品: { crumbs: ["门店", "门店商品"], tabs: ["商品管理", "门店商品"] },
  供应商管理: { crumbs: ["供应商", "供应商管理"], tabs: ["商品管理", "供应商管理"] },
  发货管理: { crumbs: ["进销存", "发货管理"], tabs: ["发货管理", "收货管理", "配送差异", "退货返厂"] },
  收货管理: { crumbs: ["进销存", "收货管理"], tabs: ["发货管理", "收货管理", "配送差异", "退货返厂"] },
  配送差异: { crumbs: ["进销存", "配送差异"], tabs: ["发货管理", "收货管理", "配送差异", "退货返厂"] },
  退货返厂: { crumbs: ["进销存", "退货返厂"], tabs: ["发货管理", "收货管理", "配送差异", "退货返厂"] },
};
const SUPPLIER = {
  版本记录: { crumbs: ["版本记录"], tabs: ["版本记录"] },
  业务流程图: { crumbs: ["业务流程图"], tabs: ["业务流程图"] },
  场景清单: { crumbs: ["场景清单"], tabs: ["场景清单"] },
  一件代发: { crumbs: ["供货", "一件代发"], tabs: ["一件代发", "发总部仓", "发门店", "配送差异", "售后处理", "退货返厂"] },
  发总部仓: { crumbs: ["供货", "发总部仓"], tabs: ["一件代发", "发总部仓", "发门店", "配送差异", "售后处理", "退货返厂"] },
  发门店: { crumbs: ["供货", "发门店"], tabs: ["一件代发", "发总部仓", "发门店", "配送差异", "售后处理", "退货返厂"] },
  配送差异: { crumbs: ["供货", "配送差异"], tabs: ["一件代发", "发总部仓", "发门店", "配送差异", "售后处理", "退货返厂"] },
  售后处理: { crumbs: ["供货", "售后处理"], tabs: ["一件代发", "发总部仓", "发门店", "配送差异", "售后处理", "退货返厂"] },
  退货返厂: { crumbs: ["供货", "退货返厂"], tabs: ["一件代发", "发总部仓", "发门店", "配送差异", "售后处理", "退货返厂"] },
  账号管理: { crumbs: ["设置", "账号管理"], tabs: ["账号管理"] },
};

export function App() {
  const [portal, setPortal] = useState("tenant");
  const [page, setPage] = useState("商品管理");
  const [drawer, setDrawer] = useState(false);
  const [supLoggedIn, setSupLoggedIn] = useState(false);
  const [toast, tip] = useToast();

  const switchPortal = (p) => {
    setPortal(p);
    if (p === "tenant") setPage("商品管理");
    if (p === "supplier") setPage("一件代发");
  };

  /* 门店 APP */
  if (portal === "app") {
    return (
      <Shell portal={portal} onPortal={switchPortal} bare crumbs={["门店 APP（濮源直播间）"]} projectLabel="濮源直播间">
        <StoreApp />
      </Shell>
    );
  }

  /* 买家端（消费者） */
  if (portal === "buyer") {
    return (
      <Shell portal={portal} onPortal={switchPortal} bare crumbs={["买家端（消费者）"]} projectLabel="买家端">
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
        menu={isTenant ? MENU : SUPPLIER_MENU}
        projectLabel={isTenant ? "九天教育" : "JOJO供应商"}
        onNav={(t) => canNav(t) && setPage(t)}
      >
        {isTenant && (
          <>
            {page === "版本记录" && <VersionLog />}
            {page === "业务流程图" && <FlowsView />}
            {page === "场景清单" && <ScenarioList />}
            {page === "商品管理" && <ProductManagement onOpenDrawer={() => setDrawer(true)} />}
            {page === "订单管理" && <OrderManagement />}
            {page === "售后管理" && <AfterSales />}
            {page === "门店商品" && <ShopProduct />}
            {page === "供应商管理" && <SupplierMaster />}
            {page === "发货管理" && <SupplyDispatch />}
            {page === "收货管理" && <SupplyReceipt />}
            {page === "配送差异" && <SupplyDiff />}
            {page === "退货返厂" && <TenantReturns />}
          </>
        )}

        {!isTenant && (
          <>
            {page === "版本记录" && <VersionLog />}
            {page === "业务流程图" && <FlowsView />}
            {page === "场景清单" && <ScenarioList />}
            {page === "一件代发" && <SupDirect />}
            {page === "发总部仓" && <SupToHq />}
            {page === "发门店" && <SupToStore />}
            {page === "配送差异" && <SupDiff />}
            {page === "售后处理" && <SupAfterSales />}
            {page === "退货返厂" && <SupplierReturns />}
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
