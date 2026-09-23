// 真实 SAAS（追伴）租户后台 + 供应商后台 —— 进销存MVP 相关数据
// 页面结构与文案照真实系统抄录；供货相关为本期新增

export const PROJECT = { name: "九天教育", status: "营业中", phone: "13300000000" };

export const SUPPLIERS = [
  { no: "SN00000021", name: "JOJO供应商", contact: "jojo", phone: "18100010002", enabled: true },
  { no: "SN00000023", name: "测试供应商资质", contact: "零度", phone: "13144156669", enabled: true },
  { no: "SN00000031", name: "测试供应商A", contact: "测试联系人", phone: "13800001111", enabled: false },
  { no: "SN00000032", name: "阿萨德", contact: "阿萨德", phone: "13144156669", enabled: false },
  { no: "SN00000034", name: "供应商001", contact: "供应商001", phone: "18100010002", enabled: true },
  { no: "SN00000035", name: "供应商002", contact: "供应商002", phone: "13979554185", enabled: true },
  { no: "SN00000036", name: "供应商003", contact: "供应商003", phone: "13122223333", enabled: true },
];
export const SHIP_MODES = ["供应商直配", "总部仓直配"];
/* 总部仓直配的货源：供应商供货（货先由供应商送到总部仓）｜总部自有（货为总部自有、不经供应商） */
export const GOODS_SOURCES = ["供应商供货", "总部自有"];
export const modeLabelOf = (p) => (p && p.shipMode === "总部仓直配" && p.goodsSource === "总部自有" ? "总部仓直配 · 自有货" : (p ? p.shipMode : ""));
export const supplyLabelOf = (o) => (o && o.supplyMode === "总部仓直配" && o.goodsSource === "总部自有" ? "总部仓直配 · 自有货" : (o ? o.supplyMode : ""));

/* ---------------- 商品管理 ---------------- */
const g = (emoji, bg) => ({ emoji, bg });
export const PRODUCTS = [
  { id: "p1", name: "什锦果蔬", vid: "共(1)个", intro: true, no: "3424", stock: 795, purchase: "10.00", sale: "0.01~3.00", freight: "未设置", status: "在售中", supplier: "供应商003", shipMode: "供应商直配" },
  { id: "p2", name: "华为手机", vid: "共(0)个", intro: true, no: "-", stock: 294, purchase: "0.00", sale: "0.01~2.00", freight: "已设置", status: "在售中", supplier: "JOJO供应商", shipMode: "总部仓直配", goodsSource: "供应商供货", customCat: "精选数码" },
  { id: "p3", name: "华为手机(复制)", vid: "共(0)个", intro: true, no: "_CP7784", stock: 292, purchase: "0.00", sale: "0.01", freight: "未设置", status: "已下架", supplier: "JOJO供应商", shipMode: "总部仓直配", goodsSource: "供应商供货" },
  { id: "p4", name: "苹果", vid: "共(0)个", intro: true, no: "23", stock: 200, purchase: "10.00", sale: "0.01~1.00", freight: "未设置", status: "在售中", supplier: "供应商002", shipMode: "供应商直配", customCat: "时令鲜果" },
  { id: "p5", name: "奶粉(复制)", vid: "共(1)个", intro: true, no: "_CP5374", stock: 115, purchase: "0.00", sale: "0.01", freight: "未设置", status: "在售中", supplier: "供应商001", shipMode: "总部仓直配", goodsSource: "供应商供货" },
  { id: "p6", name: "奶粉", vid: "共(1)个", intro: true, no: "_CP6353", stock: 115, purchase: "0.00", sale: "0.01", freight: "未设置", status: "审核中", supplier: "", shipMode: "" },
  { id: "p7", name: "山茶油", vid: "共(0)个", intro: false, no: "-", stock: 0, purchase: "68.00", sale: "128.00", freight: "未设置", status: "审核不通过", supplier: "供应商001", shipMode: "总部仓直配", goodsSource: "供应商供货" },
  /* 总部仓直配 · 总部自有货：不经供应商，总部仓直接发货 */
  { id: "p8", name: "儿童书包", vid: "共(1)个", intro: true, no: "_CP8811", stock: 120, purchase: "—", sale: "129.00", freight: "已设置", status: "在售中", supplier: "", shipMode: "总部仓直配", goodsSource: "总部自有" },
  { id: "p9", name: "保温饭盒", vid: "共(1)个", intro: true, no: "_CP8812", stock: 86, purchase: "—", sale: "99.00", freight: "已设置", status: "在售中", supplier: "", shipMode: "总部仓直配", goodsSource: "总部自有" },
  { id: "p10", name: "文具套装", vid: "共(1)个", intro: false, no: "_CP8813", stock: 240, purchase: "—", sale: "59.00", freight: "未设置", status: "在售中", supplier: "", shipMode: "总部仓直配", goodsSource: "总部自有" },
];
export const PRODUCT_IMG = { p1: g("🧺", "#eefaf1"), p2: g("📱", "#eef4ff"), p3: g("📱", "#f3f0ff"), p4: g("🍎", "#fff0ee"), p5: g("🥛", "#eef4ff"), p6: g("🥛", "#eef4ff"), p7: g("🫙", "#fff7e8"), p8: g("🎒", "#eef4ff"), p9: g("🍱", "#fdf3e7"), p10: g("✏️", "#f0f7ee") };

/* ---------------- 门店商品 ---------------- */
export const SHOP_PRODUCTS = [
  { id: "s1", name: "华为手机", no: "-", purchase: "0", stock: 294, sale: "0.01~2.00", visible: false, emoji: "📱" },
  { id: "s2", name: "苹果", no: "23", purchase: "10", stock: 200, sale: "0.01~1.00", visible: false, emoji: "🍎" },
  { id: "s3", name: "奶粉(复制)", no: "_CP5374", purchase: "0", stock: 115, sale: "0.01", visible: true, emoji: "🥛" },
  { id: "s4", name: "什锦果蔬", no: "3424", purchase: "10", stock: 795, sale: "0.01~3.00", visible: true, emoji: "🧺" },
  { id: "s5", name: "手机(复制)", no: "_CP5753", purchase: "0", stock: 318, sale: "0.01~0.10", visible: true, emoji: "📱" },
  { id: "s6", name: "222", no: "_CP8301", purchase: "0", stock: 117, sale: "0.01", visible: true, emoji: "📦" },
  { id: "s7", name: "111", no: "_CP5698", purchase: "0", stock: 117, sale: "0.01", visible: true, emoji: "📦" },
  /* 总部仓直配 · 自有货商品同步到门店（供货模式列显示「总部仓直配 · 自有货」） */
  { id: "s8", name: "儿童书包", no: "_CP8811", purchase: "—", stock: 120, sale: "129.00", visible: true, emoji: "🎒" },
  { id: "s9", name: "保温饭盒", no: "_CP8812", purchase: "—", stock: 86, sale: "99.00", visible: true, emoji: "🍱" },
  { id: "s10", name: "文具套装", no: "_CP8813", purchase: "—", stock: 240, sale: "59.00", visible: true, emoji: "✏️" },
];

/* ---------------- 订单管理 ---------------- */
export const ORDERS = [
  {
    id: "o1", no: "ORD260918000018", product: "西瓜", spec: "规格: S", qty: 1, unitPrice: "¥0.01", emoji: "🍉",
    afterSale: "暂无售后",
    amounts: { 商品金额: "0.01", 邮费: "-", 优惠金额: "2", 积分抵现: "-", 应收金额: "0", 实收金额: "0" },
    buyer: { 昵称: "小西瓜", 收件人: "火火", 收件人电话: "13979554185", 收件人地址: "江苏省南通市海门市海门高新区测试" },
    store: "九天门店", delivery: "快递发货", createdAt: "2026-09-18 14:47:36", status: "待发货",
    payMethod: "微信支付", payTime: "2026-09-18 14:47:37", ops: ["发货", "备注", "修改地址", "分配门店"],
    supplyNo: "FHD2609180011", supplyMode: "供应商直配", shipBlock: "由供应商发货",
  },
  /* F3 演示（解锁态）：上游「供应商→总仓」已收货，本单在订单管理即可发货
     —— 消费者那一跳归销售订单，与 o7（待总部仓收货）构成一对状态 */
  {
    id: "o5", no: "ORD260918000021", product: "奶粉(复制)", spec: "800g / 罐", qty: 2, unitPrice: "¥268.00", emoji: "🥛",
    afterSale: "暂无售后",
    amounts: { 商品金额: "536.00", 邮费: "-", 优惠金额: "-", 积分抵现: "-", 应收金额: "536.00", 实收金额: "536.00" },
    buyer: { 昵称: "王悦", 收件人: "王悦", 收件人电话: "13566667777", 收件人地址: "北京市朝阳区建国路 88 号" },
    store: "九天门店", delivery: "快递发货", createdAt: "2026-09-18 09:31:20", status: "待发货",
    payMethod: "微信支付", payTime: "2026-09-18 09:31:22", ops: ["发货", "备注", "修改地址", "分配门店"],
    supplyNo: "FHD2609180009", supplyMode: "总部仓直配", goodsSource: "供应商供货",
  },
  {
    id: "o2", no: "ORD260917000164", product: "什锦果蔬", spec: "规格: 黑色/", qty: 1, unitPrice: "¥3", emoji: "🧺",
    afterSale: "售后完成", afterSaleLink: "查看",
    amounts: { 商品金额: "3", 邮费: "-", 优惠金额: "2", 积分抵现: "-", 应收金额: "1", 实收金额: "1" },
    buyer: { 昵称: "九九" }, store: "9071门店", delivery: "上门自提", pickupCode: "查看自提码",
    createdAt: "2026-09-17 17:09:44", status: "已全额退款", ops: ["详情", "备注", "分配门店"],
    supplyNo: "FHD2609170002", supplyMode: "供应商直配",
  },
  {
    id: "o3", no: "ORD260917000159", product: "什锦果蔬", spec: "规格: 蓝色/", qty: 1, unitPrice: "¥1", emoji: "🧺",
    afterSale: "售后完成", afterSaleLink: "查看",
    amounts: { 商品金额: "1", 邮费: "-", 优惠金额: "-", 积分抵现: "-", 应收金额: "1", 实收金额: "1" },
    buyer: { 昵称: "九九" }, store: "9071门店", delivery: "上门自提", pickupCode: "查看自提码",
    createdAt: "2026-09-17 17:09:10", status: "已全额退款", ops: ["详情", "备注", "分配门店"],
    supplyNo: "FHD2609170001", supplyMode: "供应商直配",
  },
  {
    id: "o4", no: "ORD260917000153", product: "华为手机", spec: "规格: 默认", qty: 1, unitPrice: "¥0.01", emoji: "📱",
    afterSale: "暂无售后",
    amounts: { 商品金额: "0.01", 邮费: "-", 优惠金额: "-", 积分抵现: "-", 应收金额: "0.01", 实收金额: "0.01" },
    buyer: { 昵称: "九九" }, store: "9071门店", delivery: "上门自提",
    createdAt: "2026-09-17 16:52:03", status: "待发货", ops: ["发货", "备注", "分配门店"],
    supplyNo: "FHD2609170004", supplyMode: "总部仓直配", goodsSource: "供应商供货", shipBlock: "待总部仓收货",
  },
  /* G2② 配套订单：自提单，货已到店但门店未确认 → 提货码待激活 */
  {
    id: "o6", no: "ORD260915000077", product: "苹果", spec: "红富士 / 5 斤装", qty: 2, unitPrice: "¥0.01", emoji: "🍎",
    afterSale: "暂无售后",
    amounts: { 商品金额: "0.02", 邮费: "-", 优惠金额: "-", 积分抵现: "-", 应收金额: "0.02", 实收金额: "0.02" },
    buyer: { 昵称: "九九" }, store: "9071门店", delivery: "上门自提", pickupCode: "查看自提码", pickupReady: false,
    createdAt: "2026-09-15 09:58:00", status: "已发货", ops: ["详情", "备注", "分配门店"],
    supplyNo: "FHD2609150001", supplyMode: "供应商直配",
  },
  /* F3 两段链路配套订单：总部仓直配（供应商供货），须等总仓收到上游货后才可发货 */
  {
    id: "o7", no: "ORD260918000033", product: "儿童绘本套装", spec: "全 8 册", qty: 9, unitPrice: "¥0.01", emoji: "📚",
    afterSale: "暂无售后",
    amounts: { 商品金额: "0.09", 邮费: "-", 优惠金额: "-", 积分抵现: "-", 应收金额: "0.09", 实收金额: "0.09" },
    buyer: { 昵称: "小绘本", 收件人: "陈女士", 收件人电话: "13800001234", 收件人地址: "广东省广州市天河区体育西路 100 号" },
    store: "九天门店", delivery: "快递发货", createdAt: "2026-09-18 10:12:00", status: "待发货",
    payMethod: "微信支付", payTime: "2026-09-18 10:12:05", ops: ["发货", "备注", "修改地址", "分配门店"],
    supplyNo: "FHD2609180006", supplyMode: "总部仓直配", goodsSource: "供应商供货",
    shipBlock: "待总部仓收货",
  },
  /* 一件代发·已发货：供应商已直发消费者（发货+售后均归供应商，租户后台只读可见） */
  {
    id: "o8", no: "ORD260918000009", product: "苹果", spec: "红富士 / 5 斤装", qty: 2, unitPrice: "¥0.01", emoji: "🍎",
    afterSale: "暂无售后",
    amounts: { 商品金额: "0.02", 邮费: "-", 优惠金额: "-", 积分抵现: "-", 应收金额: "0.02", 实收金额: "0.02" },
    buyer: { 昵称: "周然", 收件人: "周然", 收件人电话: "13511112222", 收件人地址: "广东省广州市越秀区中山五路 33 号" },
    store: "九天门店", delivery: "快递发货", createdAt: "2026-09-18 11:20:03", status: "已发货",
    payMethod: "微信支付", payTime: "2026-09-18 11:20:05", ops: ["详情", "备注", "分配门店"],
    supplyNo: "FHD2609180010", supplyMode: "供应商直配",
    carrier: "顺丰速运", tracking: "SF7712003388", track: "已发货 2026-09-18 15:20:00",
  },
  /* 进销存新增：第二条「待提货」自提订单 —— 货已到店（照进销存口径：到店确认后才出现待提货），用于买家端演示 */
  {
    id: "o9", no: "ORD260918000202", product: "沐浴露", spec: "持久留香 / 500ml", qty: 1, unitPrice: "¥199.00", emoji: "🧴",
    afterSale: "暂无售后", buyerNote: "麻烦早点发货",
    amounts: { 商品金额: "199.00", 邮费: "0", 优惠金额: "-9.00", 积分抵现: "-", 应收金额: "190.00", 实收金额: "190.00" },
    buyer: { 昵称: "林小满" }, store: "9071门店", delivery: "上门自提", pickupCode: "查看自提码", pickupReady: true,
    createdAt: "2026-09-17 11:20:00", status: "已发货",
    payMethod: "微信支付", payTime: "2026-09-17 11:20:02", ops: ["详情", "备注", "分配门店"],
    supplyNo: "FHD2609170019", supplyMode: "供应商直配",
  },
  /* 进销存新增：待收货自提订单 —— 供应商已发门店、在途（货未到店，提货码未开放） */
  {
    id: "o10", no: "ORD260918000088", product: "儿童保温杯", spec: "500ml / 蓝", qty: 2, unitPrice: "¥89.00", emoji: "🥤",
    afterSale: "暂无售后",
    amounts: { 商品金额: "178.00", 邮费: "0", 优惠金额: "-10.00", 积分抵现: "-", 应收金额: "168.00", 实收金额: "168.00" },
    buyer: { 昵称: "徐一诺" }, store: "9071门店", delivery: "上门自提", pickupCode: "查看自提码", pickupReady: false,
    createdAt: "2026-09-18 15:30:00", status: "已发货",
    payMethod: "微信支付", payTime: "2026-09-18 15:30:02", ops: ["详情", "备注", "分配门店"],
    supplyNo: "FHD2609180012", supplyMode: "供应商直配",
  },
  /* 状态补齐：待付款自提订单（未支付 → 不生成发货任务，提货码不可用） */
  {
    id: "o11", no: "ORD260919000066", product: "山茶油", spec: "500ml / 瓶", qty: 1, unitPrice: "¥128.00", emoji: "🫙",
    afterSale: "暂无售后",
    amounts: { 商品金额: "128.00", 邮费: "0", 优惠金额: "-8.00", 积分抵现: "-", 应收金额: "120.00", 实收金额: "-" },
    buyer: { 昵称: "苏晚" }, store: "九天门店", delivery: "上门自提",
    createdAt: "2026-09-19 20:15:08", status: "待付款", ops: ["详情", "备注", "分配门店"],
    supplyNo: "", supplyMode: "",
  },
  /* 状态补齐：售后中订单（对应售后管理 ② 号单「待总部退款」，订单挂起） */
  {
    id: "o12", no: "ORD260917000147", product: "华为手机", spec: "蓝色/M", qty: 1, unitPrice: "¥1.00", emoji: "📱",
    afterSale: "售后处理中", afterSaleLink: "查看",
    amounts: { 商品金额: "1.00", 邮费: "-", 优惠金额: "-", 积分抵现: "-", 应收金额: "1.00", 实收金额: "1.00" },
    buyer: { 昵称: "九九", 收件人: "T1", 收件人电话: "13911112217", 收件人地址: "重庆市重庆郊县丰都县董家镇测试" },
    store: "9071门店", delivery: "快递发货", createdAt: "2026-09-17 17:44:22", status: "售后中",
    payMethod: "微信支付", payTime: "2026-09-17 17:44:24", ops: ["详情", "备注", "分配门店"],
    carrier: "顺丰速运", tracking: "SF7712003621", track: "已签收 2026-09-17 20:10:00",
    supplyNo: "FHD2609170021", supplyMode: "总部仓直配", goodsSource: "供应商供货",
  },
  /* 状态补齐：已完成自提订单（提货码已核销 → 买家端「已使用」、订单管理「已完成」） */
  {
    id: "o13", no: "ORD260913000055", product: "大米", spec: "5kg / 袋", qty: 1, unitPrice: "¥69.00", emoji: "🌾",
    afterSale: "暂无售后",
    amounts: { 商品金额: "69.00", 邮费: "0", 优惠金额: "-", 积分抵现: "-", 应收金额: "69.00", 实收金额: "69.00" },
    buyer: { 昵称: "陆知行" }, store: "9071门店", delivery: "上门自提", pickupCode: "查看自提码", pickupReady: true, pickupUsed: true,
    createdAt: "2026-09-13 15:02:41", status: "已完成",
    payMethod: "微信支付", payTime: "2026-09-13 15:02:43", ops: ["详情", "备注", "分配门店"],
    supplyNo: "FHD2609130019", supplyMode: "供应商直配",
  },
  /* 状态补齐：售后中自提订单（买家端「售后中」＋售后进度卡；挂起不发货） */
  {
    id: "o14", no: "ORD260918000231", product: "儿童保温杯", spec: "500ml / 蓝", qty: 1, unitPrice: "¥89.00", emoji: "🥤",
    afterSale: "售后处理中", afterSaleLink: "查看", buyerNote: "麻烦早点发货", afterSaleTip: "售后中 请等待商家处理 ›",
    amounts: { 商品金额: "89.00", 邮费: "0", 优惠金额: "-", 积分抵现: "-", 应收金额: "89.00", 实收金额: "89.00" },
    buyer: { 昵称: "徐一诺" }, store: "9071门店", delivery: "上门自提", pickupCode: "查看自提码", pickupReady: false,
    createdAt: "2026-09-18 16:10:22", status: "售后中",
    payMethod: "微信支付", payTime: "2026-09-18 16:10:25", ops: ["详情", "备注", "分配门店"],
    supplyNo: "", supplyMode: "供应商直配",
  },
  /* 状态补齐：已取消自提订单（超时未支付 → 买家端「订单已取消」） */
  {
    id: "o15", no: "ORD260918000232", product: "沐浴露", spec: "持久留香 / 500ml", qty: 1, unitPrice: "¥199.00", emoji: "🧴",
    afterSale: "暂无售后", buyerNote: "麻烦早点发货", cancelReason: "超时未支付",
    amounts: { 商品金额: "199.00", 邮费: "0", 优惠金额: "-", 积分抵现: "-", 应收金额: "199.00", 实收金额: "0" },
    buyer: { 昵称: "苏晚" }, store: "九天门店", delivery: "上门自提",
    createdAt: "2026-09-18 20:33:56", status: "已取消", ops: ["详情", "备注", "分配门店"],
    supplyNo: "", supplyMode: "",
  },
  /* 货源拓展：总部仓直配 · 自有货订单（货在总部仓、无供应商前置，支付后总部直接发货） */
  {
    id: "o16", no: "ORD260919000101", product: "儿童书包", spec: "蓝色 / 大号", qty: 1, unitPrice: "¥129.00", emoji: "🎒",
    afterSale: "暂无售后",
    amounts: { 商品金额: "129.00", 邮费: "0", 优惠金额: "-", 积分抵现: "-", 应收金额: "129.00", 实收金额: "129.00" },
    buyer: { 昵称: "何小北", 收件人: "何小北", 收件人电话: "13800001111", 收件人地址: "广东省广州市天河区体育西路 108 号" },
    store: "九天门店", delivery: "快递发货", createdAt: "2026-09-19 10:12:00", status: "待发货",
    payMethod: "微信支付", payTime: "2026-09-19 10:12:05", ops: ["详情", "备注", "分配门店"],
    supplyNo: "", supplyMode: "总部仓直配", goodsSource: "总部自有",
  },
  {
    id: "o17", no: "ORD260918000103", product: "保温饭盒", spec: "米白 / 双层", qty: 2, unitPrice: "¥99.00", emoji: "🍱",
    afterSale: "暂无售后",
    amounts: { 商品金额: "198.00", 邮费: "0", 优惠金额: "-10.00", 积分抵现: "-", 应收金额: "188.00", 实收金额: "188.00" },
    buyer: { 昵称: "林小满", 收件人: "林小满", 收件人电话: "13822223333", 收件人地址: "浙江省杭州市西湖区文一西路 200 号" },
    store: "九天门店", delivery: "快递发货", createdAt: "2026-09-18 09:40:31", status: "已发货",
    payMethod: "微信支付", payTime: "2026-09-18 09:40:35", ops: ["详情", "备注", "分配门店"],
    carrier: "顺丰速运", tracking: "SF7712003520", track: "已发货 2026-09-18 15:00:00",
    supplyNo: "", supplyMode: "总部仓直配", goodsSource: "总部自有",
  },
  {
    id: "o18", no: "ORD260915000102", product: "文具套装", spec: "12 件套 / 基础版", qty: 1, unitPrice: "¥59.00", emoji: "✏️",
    afterSale: "暂无售后",
    amounts: { 商品金额: "59.00", 邮费: "0", 优惠金额: "-", 积分抵现: "-", 应收金额: "59.00", 实收金额: "59.00" },
    buyer: { 昵称: "周小野", 收件人: "周小野", 收件人电话: "13844445555", 收件人地址: "北京市朝阳区望京街道阜通东大街 6 号" },
    store: "九天门店", delivery: "快递发货", createdAt: "2026-09-15 14:22:18", status: "已完成",
    payMethod: "微信支付", payTime: "2026-09-15 14:22:21", ops: ["详情", "备注", "分配门店"],
    supplyNo: "", supplyMode: "总部仓直配", goodsSource: "总部自有",
  },
  /* 自有货 · 自提单：货在总部仓，总部直发门店（总部自有 → 门店 路径） */
  {
    id: "o19", no: "ORD260920000110", product: "儿童书包", spec: "蓝色 / 大号", qty: 1, unitPrice: "¥129.00", emoji: "🎒",
    afterSale: "暂无售后",
    amounts: { 商品金额: "129.00", 邮费: "0", 优惠金额: "-", 积分抵现: "-", 应收金额: "129.00", 实收金额: "129.00" },
    buyer: { 昵称: "苏晚" }, store: "九天门店", delivery: "上门自提", pickupCode: "查看自提码", pickupReady: false,
    createdAt: "2026-09-18 11:20:00", status: "已发货",
    payMethod: "微信支付", payTime: "2026-09-18 11:20:05", ops: ["详情", "备注", "分配门店"],
    supplyNo: "FHD2609180018", supplyMode: "总部仓直配", goodsSource: "总部自有",
  },
  /* 自提样本（F4 链路）：供应商 → 总仓（FHD2609180008）→ 总仓 → 门店（FHD2609180004），门店收货后提货码激活 */
  {
    id: "o20", no: "ORD260918000012", product: "奶粉(复制)", spec: "800g / 罐", qty: 2, unitPrice: "¥268.00", emoji: "🥛",
    afterSale: "暂无售后",
    amounts: { 商品金额: "536.00", 邮费: "-", 优惠金额: "-", 积分抵现: "-", 应收金额: "536.00", 实收金额: "536.00" },
    buyer: { 昵称: "王悦" }, store: "九天门店", delivery: "上门自提", pickupCode: "查看自提码", pickupReady: false,
    createdAt: "2026-09-18 09:31:20", status: "待发货",
    payMethod: "微信支付", payTime: "2026-09-18 09:31:22", ops: ["详情", "备注", "分配门店"],
    supplyNo: "FHD2609180008", supplyMode: "总部仓直配", goodsSource: "供应商供货",
  },
  /* ---- 一件代发：供应商直发消费者（快递发货）—— 发货与售后均归供应商，租户后台只读可见 ---- */
  /* 待付款：买家下单未支付，尚未生成供货任务（支付后才生成） */
  {
    id: "o21", no: "ORD260919000077", product: "空气炸锅", spec: "5L / 米白", qty: 1, unitPrice: "¥399.00", emoji: "🍳",
    afterSale: "暂无售后",
    amounts: { 商品金额: "399.00", 邮费: "0", 优惠金额: "-20.00", 积分抵现: "-", 应收金额: "379.00", 实收金额: "-" },
    buyer: { 昵称: "陈小满", 收件人: "陈小满", 收件人电话: "13866667777", 收件人地址: "广东省深圳市南山区科技园南路 55 号" },
    store: "九天门店", delivery: "快递发货", createdAt: "2026-09-19 20:12:33", status: "待付款",
    ops: ["详情", "备注", "修改地址"],
    supplyNo: "", supplyMode: "供应商直配",
  },
  /* 售后中：货已签收，买家发起退货退款（对应供应商后台「售后处理」R20260918260918000021） */
  {
    id: "o22", no: "ORD260917000140", product: "相机", spec: "银色 / 标准版", qty: 1, unitPrice: "¥189.00", emoji: "📷",
    afterSale: "售后处理中", afterSaleLink: "查看",
    amounts: { 商品金额: "189.00", 邮费: "0", 优惠金额: "-", 积分抵现: "-", 应收金额: "189.00", 实收金额: "189.00" },
    buyer: { 昵称: "吴桐", 收件人: "吴桐", 收件人电话: "13900001111", 收件人地址: "上海市浦东新区世纪大道 100 号" },
    store: "九天门店", delivery: "快递发货", createdAt: "2026-09-17 16:40:00", status: "售后中",
    payMethod: "微信支付", payTime: "2026-09-17 16:40:02", ops: ["详情", "备注", "分配门店"],
    carrier: "中通快递", tracking: "ZT8800112299", track: "已签收 2026-09-18 09:10:00",
    supplyNo: "FHD2609170009", supplyMode: "供应商直配",
  },
  /* 已完成：货已签收，交易完成 */
  {
    id: "o23", no: "ORD260915000123", product: "沐浴露", spec: "持久留香 / 500ml", qty: 1, unitPrice: "¥199.00", emoji: "🧴",
    afterSale: "暂无售后",
    amounts: { 商品金额: "199.00", 邮费: "0", 优惠金额: "-", 积分抵现: "-", 应收金额: "199.00", 实收金额: "199.00" },
    buyer: { 昵称: "沈知夏", 收件人: "沈知夏", 收件人电话: "13712345678", 收件人地址: "四川省成都市武侯区天府大道 199 号" },
    store: "九天门店", delivery: "快递发货", createdAt: "2026-09-15 10:08:21", status: "已完成",
    payMethod: "微信支付", payTime: "2026-09-15 10:08:24", ops: ["详情", "备注", "分配门店"],
    carrier: "圆通速递", tracking: "YT5598712266", track: "已签收 2026-09-16 14:30:00",
    supplyNo: "FHD2609150021", supplyMode: "供应商直配",
  },
  /* 已关闭：未发货前买家退款，供货任务同步关闭（供应商无需发货） */
  {
    id: "o24", no: "ORD260916000188", product: "智能手环", spec: "黑色 / 标准版", qty: 1, unitPrice: "¥249.00", emoji: "⌚",
    afterSale: "售后完成", afterSaleLink: "查看",
    amounts: { 商品金额: "249.00", 邮费: "0", 优惠金额: "-", 积分抵现: "-", 应收金额: "249.00", 实收金额: "249.00" },
    buyer: { 昵称: "赵一鸣", 收件人: "赵一鸣", 收件人电话: "13600002222", 收件人地址: "江苏省南京市鼓楼区中山北路 8 号" },
    store: "九天门店", delivery: "快递发货", createdAt: "2026-09-16 09:15:44", status: "已全额退款",
    payMethod: "微信支付", payTime: "2026-09-16 09:15:47", ops: ["详情", "备注", "分配门店"],
    supplyNo: "FHD2609160033", supplyMode: "供应商直配",
  },
  /* 已发货：在途，待买家签收 */
  {
    id: "o25", no: "ORD260918000466", product: "电饭煲", spec: "4L / 智能款", qty: 1, unitPrice: "¥499.00", emoji: "🍚",
    afterSale: "暂无售后",
    amounts: { 商品金额: "499.00", 邮费: "0", 优惠金额: "-30.00", 积分抵现: "-", 应收金额: "469.00", 实收金额: "469.00" },
    buyer: { 昵称: "孙小满", 收件人: "孙小满", 收件人电话: "13800009999", 收件人地址: "湖北省武汉市洪山区珞喻路 129 号" },
    store: "九天门店", delivery: "快递发货", createdAt: "2026-09-18 16:22:10", status: "已发货",
    payMethod: "微信支付", payTime: "2026-09-18 16:22:13", ops: ["详情", "备注", "分配门店"],
    carrier: "韵达快递", tracking: "YD1122336801", track: "已发货 2026-09-19 09:30:00",
    supplyNo: "FHD2609180044", supplyMode: "供应商直配",
  },
  /* 待发货补充两单：让「批量发货 / 导入发货」有足够样本 */
  {
    id: "o26", no: "ORD260918000512", product: "篮球", spec: "7号 / 标准", qty: 2, unitPrice: "¥129.00", emoji: "🏀",
    afterSale: "暂无售后", buyerNote: "请发顺丰",
    amounts: { 商品金额: "258.00", 邮费: "0", 优惠金额: "-", 积分抵现: "-", 应收金额: "258.00", 实收金额: "258.00" },
    buyer: { 昵称: "方小北", 收件人: "方小北", 收件人电话: "13755556666", 收件人地址: "福建省厦门市思明区软件园二期 33 号" },
    store: "九天门店", delivery: "快递发货", createdAt: "2026-09-18 18:05:12", status: "待发货",
    payMethod: "微信支付", payTime: "2026-09-18 18:05:15", ops: ["详情", "备注", "修改地址", "分配门店"],
    supplyNo: "FHD2609180051", supplyMode: "供应商直配",
  },
  {
    id: "o27", no: "ORD260919000088", product: "台灯", spec: "护眼 / 白色", qty: 1, unitPrice: "¥159.00", emoji: "💡",
    afterSale: "暂无售后",
    amounts: { 商品金额: "159.00", 邮费: "0", 优惠金额: "-9.00", 积分抵现: "-", 应收金额: "150.00", 实收金额: "150.00" },
    buyer: { 昵称: "唐小满", 收件人: "唐小满", 收件人电话: "13322221111", 收件人地址: "陕西省西安市雁塔区高新路 25 号" },
    store: "九天门店", delivery: "快递发货", createdAt: "2026-09-19 09:14:40", status: "待发货",
    payMethod: "微信支付", payTime: "2026-09-19 09:14:43", ops: ["详情", "备注", "修改地址", "分配门店"],
    supplyNo: "FHD2609190052", supplyMode: "供应商直配",
  },
  /* 待发货补充：让「批量发货 / 导入发货」在三处入口都有成批样本 */
  {
    id: "o28", no: "ORD260920000201", product: "山茶油", spec: "750ml / 瓶", qty: 6, unitPrice: "¥128.00", emoji: "🫒",
    afterSale: "暂无售后",
    amounts: { 商品金额: "768.00", 邮费: "-", 优惠金额: "-", 积分抵现: "-", 应收金额: "768.00", 实收金额: "768.00" },
    buyer: { 昵称: "林一诺" },
    store: "九天门店", delivery: "上门自提", pickupCode: "查看自提码", pickupReady: false,
    createdAt: "2026-09-20 09:12:30", status: "待发货",
    payMethod: "微信支付", payTime: "2026-09-20 09:12:33", ops: ["详情", "备注", "分配门店"],
    supplyNo: "FHD2609200061", supplyMode: "总部仓直配", goodsSource: "供应商供货",
  },
  {
    id: "o29", no: "ORD260920000202", product: "大米", spec: "5kg / 袋", qty: 4, unitPrice: "¥68.00", emoji: "🌾",
    afterSale: "暂无售后",
    amounts: { 商品金额: "272.00", 邮费: "-", 优惠金额: "-", 积分抵现: "-", 应收金额: "272.00", 实收金额: "272.00" },
    buyer: { 昵称: "周婶" },
    store: "9071门店", delivery: "上门自提", pickupCode: "查看自提码", pickupReady: false,
    createdAt: "2026-09-20 10:05:11", status: "待发货",
    payMethod: "微信支付", payTime: "2026-09-20 10:05:14", ops: ["详情", "备注", "分配门店"],
    supplyNo: "FHD2609200062", supplyMode: "总部仓直配", goodsSource: "供应商供货",
  },
  {
    id: "o30", no: "ORD260920000203", product: "画板套装", spec: "12 色 / 含画架", qty: 2, unitPrice: "¥156.00", emoji: "🎨",
    afterSale: "暂无售后", buyerNote: "自提时请帮忙验货",
    amounts: { 商品金额: "312.00", 邮费: "-", 优惠金额: "-", 积分抵现: "-", 应收金额: "312.00", 实收金额: "312.00" },
    buyer: { 昵称: "小画廊" },
    store: "九天门店", delivery: "上门自提", pickupCode: "查看自提码", pickupReady: false,
    createdAt: "2026-09-20 11:40:08", status: "待发货",
    payMethod: "微信支付", payTime: "2026-09-20 11:40:10", ops: ["详情", "备注", "分配门店"],
    supplyNo: "FHD2609200063", supplyMode: "总部仓直配", goodsSource: "供应商供货",
  },
  {
    id: "o31", no: "ORD260920000204", product: "什锦果蔬", spec: "礼盒装 / 6 盒", qty: 5, unitPrice: "¥199.00", emoji: "🧺",
    afterSale: "暂无售后",
    amounts: { 商品金额: "995.00", 邮费: "-", 优惠金额: "-", 积分抵现: "-", 应收金额: "995.00", 实收金额: "995.00" },
    buyer: { 昵称: "果园老张" },
    store: "9071门店", delivery: "上门自提", pickupCode: "查看自提码", pickupReady: false,
    createdAt: "2026-09-20 13:26:45", status: "待发货",
    payMethod: "微信支付", payTime: "2026-09-20 13:26:48", ops: ["详情", "备注", "分配门店"],
    supplyNo: "FHD2609200064", supplyMode: "供应商直配",
  },
  {
    id: "o32", no: "ORD260920000205", product: "苹果", spec: "红富士 / 5 斤装", qty: 8, unitPrice: "¥49.90", emoji: "🍎",
    afterSale: "暂无售后",
    amounts: { 商品金额: "399.20", 邮费: "-", 优惠金额: "-", 积分抵现: "-", 应收金额: "399.20", 实收金额: "399.20" },
    buyer: { 昵称: "橙子汽水" },
    store: "濮源直播间", delivery: "上门自提", pickupCode: "查看自提码", pickupReady: false,
    createdAt: "2026-09-20 14:52:19", status: "待发货",
    payMethod: "微信支付", payTime: "2026-09-20 14:52:22", ops: ["详情", "备注", "分配门店"],
    supplyNo: "FHD2609200065", supplyMode: "供应商直配",
  },
  {
    id: "o33", no: "ORD260920000206", product: "奶粉", spec: "800g / 罐", qty: 3, unitPrice: "¥268.00", emoji: "🥛",
    afterSale: "暂无售后",
    amounts: { 商品金额: "804.00", 邮费: "-", 优惠金额: "-", 积分抵现: "-", 应收金额: "804.00", 实收金额: "804.00" },
    buyer: { 昵称: "团购小分队" },
    store: "九天门店", delivery: "上门自提", pickupCode: "查看自提码", pickupReady: false,
    createdAt: "2026-09-20 16:08:03", status: "待发货",
    payMethod: "微信支付", payTime: "2026-09-20 16:08:06", ops: ["详情", "备注", "分配门店"],
    supplyNo: "FHD2609200066", supplyMode: "供应商直配",
  },
  {
    id: "o34", no: "ORD260920000207", product: "儿童绘本套装", spec: "全 8 册", qty: 3, unitPrice: "¥128.00", emoji: "📚",
    afterSale: "暂无售后",
    amounts: { 商品金额: "384.00", 邮费: "0", 优惠金额: "-", 积分抵现: "-", 应收金额: "384.00", 实收金额: "384.00" },
    buyer: { 昵称: "绘本妈妈", 收件人: "许女士", 收件人电话: "13611112222", 收件人地址: "浙江省杭州市西湖区文三路 90 号" },
    store: "九天门店", delivery: "快递发货", createdAt: "2026-09-20 17:20:44", status: "待发货",
    payMethod: "微信支付", payTime: "2026-09-20 17:20:47", ops: ["发货", "备注", "修改地址", "分配门店"],
    supplyNo: "FHD2609200070", supplyMode: "总部仓直配", goodsSource: "供应商供货", shipBlock: "待总部仓收货",
  },
  {
    id: "o35", no: "ORD260920000208", product: "相机", spec: "银色 / 标准版", qty: 2, unitPrice: "¥1899.00", emoji: "📷",
    afterSale: "暂无售后",
    amounts: { 商品金额: "3798.00", 邮费: "0", 优惠金额: "-200.00", 积分抵现: "-", 应收金额: "3598.00", 实收金额: "3598.00" },
    buyer: { 昵称: "阿泰", 收件人: "郑先生", 收件人电话: "13933334444", 收件人地址: "四川省成都市武侯区天府大道 588 号" },
    store: "九天门店", delivery: "快递发货", createdAt: "2026-09-20 18:02:14", status: "待发货",
    payMethod: "微信支付", payTime: "2026-09-20 18:02:17", ops: ["发货", "备注", "修改地址", "分配门店"],
    supplyNo: "FHD2609200071", supplyMode: "总部仓直配", goodsSource: "供应商供货", shipBlock: "待总部仓收货",
  },
  {
    id: "o36", no: "ORD260920000209", product: "华为手机", spec: "规格: 默认", qty: 1, unitPrice: "¥4999.00", emoji: "📱",
    afterSale: "暂无售后",
    amounts: { 商品金额: "4999.00", 邮费: "0", 优惠金额: "-", 积分抵现: "-", 应收金额: "4999.00", 实收金额: "4999.00" },
    buyer: { 昵称: "老陈头", 收件人: "陈先生", 收件人电话: "13566667777", 收件人地址: "江苏省南京市鼓楼区中山北路 200 号" },
    store: "九天门店", delivery: "快递发货", createdAt: "2026-09-20 18:46:08", status: "待发货",
    payMethod: "微信支付", payTime: "2026-09-20 18:46:11", ops: ["发货", "备注", "修改地址", "分配门店"],
    supplyNo: "FHD2609200072", supplyMode: "总部仓直配", goodsSource: "供应商供货", shipBlock: "待总部仓收货",
  },
];

/* 提货码：16 位，按订单号确定性生成（原型固定数据；买家端 / 门店端展示同一码） */
export function pickupCodeOf(order) {
  const digits = String(order.no || order.id || "0").replace(/\D/g, "");
  let x = 20260919;
  for (const ch of digits) x = (x * 131 + ch.charCodeAt(0) * 7) % 1000000007;
  let out = "";
  for (let i = 0; i < 4; i++) { x = (x * 1103515245 + 12345) % 2147483648; out += String(x % 10000).padStart(4, "0"); }
  return out;
}
export const fmtPickupCode = (c) => String(c).replace(/(\d{4})(?=\d)/g, "$1 ");

/* ==========================================================================
   侧边菜单 —— 已按「与本次业务无关的直接删掉」精简
   ========================================================================== */
export const MENU = [
  { ico: "🕘", label: "版本记录", isNew: true },
  { ico: "🗺", label: "业务流程图", isNew: true },
  { ico: "📋", label: "场景清单" },
  { ico: "⬡", label: "商品", children: ["商品管理"] },
  { ico: "▦", label: "交易", children: ["订单管理", "售后管理"] },
  { ico: "▥", label: "门店", children: ["门店商品"] },
  // ★ 进销存新增一级菜单
  { ico: "⇄", label: "进销存", isNew: true, children: ["发货管理", "收货管理", "配送差异", "退货返厂"] },
  { ico: "⬢", label: "供应商", children: ["供应商管理"] },
  { ico: "⚙", label: "设置", isNew: true, children: ["快递模板", "地址库", "通用设置"] },
];

/* 供应商后台菜单（照业务规则 §2.3 供应商侧菜单） */
export const SUPPLIER_MENU = [
  { ico: "🕘", label: "版本记录", isNew: true },
  { ico: "🗺", label: "业务流程图", isNew: true },
  { ico: "📋", label: "场景清单" },
  { ico: "⇄", label: "供货", isNew: true, children: ["一件代发", "发总部仓", "发门店", "配送差异", "售后处理", "退货返厂"] },
  { ico: "📍", label: "地址库", isNew: true },
  { ico: "👤", label: "账号管理" },
];

/* ==========================================================================
   供货单（真实 SAAS 里没有，本期新增）
   ========================================================================== */
// docs: leg = sup_consumer | supplier_to_hq | supplier_inbound | hq_store
// （「总部仓 → 消费者」不建供货单：消费者那一跳由订单管理的「发货」完成）
export const SUPPLY_DOCS = [
  {
    id: "FHD2609170002", leg: "supplier_inbound", source: "订单支付自动生成", createdAt: "2026-09-17 17:09:44",
    orderNo: "ORD260917000164", product: "什锦果蔬", spec: "规格: 黑色/", emoji: "🧺", qty: 1, sent: 1,
    shipper: "供应商003", receiver: "9071门店", receiverAddr: "辽宁省铁岭市银州区工人街 28 号",
    carrier: "中通快递", tracking: "ZT8800112233", track: "已签收 2026-09-17 17:12:44", status: "已收货", ops: ["详情"],
  },
  {
    id: "FHD2609170001", leg: "supplier_inbound", source: "订单支付自动生成", createdAt: "2026-09-17 17:09:10",
    orderNo: "ORD260917000159", product: "什锦果蔬", spec: "规格: 蓝色/", emoji: "🧺", qty: 1, sent: 1,
    shipper: "供应商003", receiver: "9071门店", receiverAddr: "辽宁省铁岭市银州区工人街 28 号",
    carrier: "圆通速递", tracking: "YT5598712099", track: "已发货 2026-09-17 17:12:44", status: "已发货", ops: ["详情"],
  },
  {
    id: "FHD2609170003", leg: "supplier_to_hq", source: "订单支付自动生成", createdAt: "2026-09-17 10:22:05",
    orderNo: "ORD260917000151", product: "奶粉", spec: "800g / 罐", emoji: "🥛", qty: 10, sent: 10,
    shipper: "供应商001", receiver: "九天教育总仓", receiverAddr: "广州市天河区科韵路 16 号",
    carrier: "顺丰速运", tracking: "SF9900112200", track: "已签收 2026-09-17 15:20:00", status: "已收货", ops: ["详情"],
  },
  {
    id: "FHD2609160008", leg: "supplier_to_hq", source: "订单支付自动生成", createdAt: "2026-09-16 09:10:00",
    orderNo: "ORD260916000142", product: "苹果", spec: "红富士 / 5 斤装", emoji: "🍎", qty: 6, sent: 6,
    shipper: "供应商002", receiver: "九天教育总仓", receiverAddr: "广州市天河区科韵路 16 号",
    carrier: "圆通速递", tracking: "YT9900887766", track: "已发货 2026-09-17 09:20:00", status: "部分收货", ops: ["详情", "收货"],
  },
  {
    id: "FHD2609160009", leg: "supplier_to_hq", source: "订单支付自动生成", createdAt: "2026-09-16 11:03:00",
    orderNo: "ORD260916000145", product: "什锦果蔬", spec: "礼盒装", emoji: "🧺", qty: 4, sent: 4,
    shipper: "供应商003", receiver: "九天教育总仓", receiverAddr: "广州市天河区科韵路 16 号",
    carrier: "韵达快递", tracking: "YD1122334455", track: "已签收 2026-09-17 08:10:00", status: "收货异常", ops: ["详情"],
  },
  {
    id: "FHD2609180004", leg: "hq_store", source: "订单支付自动生成", createdAt: "2026-09-18 09:31:20",
    orderNo: "ORD260918000012", product: "奶粉(复制)", spec: "800g / 罐", emoji: "🥛", qty: 2, sent: 0,
    shipper: "九天教育总仓", receiver: "九天门店", receiverAddr: "广东省广州市荔湾区宝华路 76 号",
    carrier: "", tracking: "", track: "", status: "待发货", ops: ["详情", "发货"],
  },
  /* 以下两张是差异单 DIFF2609170002 / DIFF2609170004 的来源供货单——原数据缺这两张，
     导致「补发单收货 → 原单同步结案」（决策 5）静默失效，补齐 */
  {
    id: "FHD2609120002", leg: "hq_store", source: "订单支付自动生成", createdAt: "2026-09-12 09:20:00",
    orderNo: "ORD260912000031", product: "什锦果蔬", spec: "礼盒装 / 12 盒", emoji: "🧺", qty: 5, sent: 5,
    shipper: "九天教育总仓", receiver: "9071门店", receiverAddr: "辽宁省铁岭市银州区工人街 28 号",
    carrier: "中通快递", tracking: "ZT8800112301", track: "已签收 2026-09-12 18:00:00", status: "收货异常", ops: ["详情"],
  },
  {
    id: "FHD2609140003", leg: "hq_store", source: "订单支付自动生成", createdAt: "2026-09-14 10:05:00",
    orderNo: "ORD260914000058", product: "儿童绘本套装", spec: "全 8 册", emoji: "📚", qty: 9, sent: 9,
    shipper: "九天教育总仓", receiver: "九天门店", receiverAddr: "广东省广州市荔湾区宝华路 76 号",
    carrier: "韵达快递", tracking: "YD1122334401", track: "已签收 2026-09-14 17:30:00", status: "收货异常", ops: ["详情"],
  },
  /* G2② 演示样本：货已到门店、门店迟迟不点「确认到货」→ 超过 3 天由系统自动确认并激活提货码 */
  {
    /* 超时自动确认样本：签收已满 3 天，打开原型即触发（系统自动确认 + 提货码激活） */
    id: "FHD2609150001", leg: "supplier_inbound", source: "订单支付自动生成", createdAt: "2026-09-15 10:00:00",
    orderNo: "ORD260915000077", product: "苹果", spec: "红富士 / 5 斤装", emoji: "🍎", qty: 2, sent: 2,
    shipper: "供应商002", receiver: "9071门店", receiverAddr: "辽宁省铁岭市银州区工人街 28 号",
    carrier: "圆通速递", tracking: "YT5598712401", track: "已签收 2026-09-15 16:30:00", status: "已发货", ops: ["详情", "收货"],
  },
  /* F3 演示样本（上游段）：同一订单 ORD260918000033 的「供应商→总仓」单。
     总仓确认收货后，订单管理里该订单才出现「发货」—— 发消费者那一跳属于销售订单，不建供货单。 */
  {
    id: "FHD2609180006", leg: "supplier_to_hq", source: "订单支付自动生成", createdAt: "2026-09-18 10:12:05",
    orderNo: "ORD260918000033", product: "儿童绘本套装", spec: "全 8 册", emoji: "📚", qty: 9, sent: 9,
    shipper: "供应商002", receiver: "九天教育总仓", receiverAddr: "广州市天河区科韵路 16 号",
    carrier: "圆通速递", tracking: "YT9900887799", track: "已发货 2026-09-18 15:00:00", status: "已发货", ops: ["详情", "收货"],
  },
  /* F3 演示样本（解锁态）：同一订单 ORD260918000021 的「供应商→总仓」单，已收货 ——
     故订单管理里 o5 打开即可发货，与上面 o7 那张「待收货」构成一对状态。 */
  {
    id: "FHD2609180009", leg: "supplier_to_hq", source: "订单支付自动生成", createdAt: "2026-09-18 09:31:20",
    orderNo: "ORD260918000021", product: "奶粉(复制)", spec: "800g / 罐", emoji: "🥛", qty: 2, sent: 2,
    shipper: "JOJO供应商", receiver: "九天教育总仓", receiverAddr: "广州市天河区科韵路 16 号",
    carrier: "顺丰速运", tracking: "SF7712003390", track: "已签收 2026-09-18 15:40:00", status: "已收货", ops: ["详情"],
  },
  /* 自有货 · 自提：总部直发门店（总部自有 → 门店），门店在收货管理确认收货后提货码激活 */
  {
    id: "FHD2609180018", leg: "hq_store", source: "订单支付自动生成", createdAt: "2026-09-18 11:20:30",
    orderNo: "ORD260920000110", product: "儿童书包", spec: "蓝色 / 大号", emoji: "🎒", qty: 1, sent: 1,
    shipper: "九天教育总仓", receiver: "九天门店", receiverAddr: "广东省广州市荔湾区宝华路 76 号",
    carrier: "顺丰速运", tracking: "SF7712007701", track: "已发货 2026-09-18 16:40:00", status: "已发货", supplyMode: "总部仓直配", goodsSource: "总部自有", ops: ["详情", "收货"],
  },
  /* G2② 演示样本：总仓收货登记少收 → 配送差异单 DIFF2609190001（总部上报 · 待供应商审核）的来源单 */
  {
    id: "FHD2609180017", leg: "supplier_to_hq", source: "订单支付自动生成", createdAt: "2026-09-18 11:20:00",
    orderNo: "ORD260918000066", product: "奶粉", spec: "800g / 罐", emoji: "🥛", qty: 6, sent: 6,
    shipper: "供应商001", receiver: "九天教育总仓", receiverAddr: "广州市天河区科韵路 16 号",
    carrier: "顺丰速运", tracking: "SF7712003501", track: "已签收 2026-09-18 16:05:00", status: "收货异常", ops: ["详情"],
  },
  /* 进销存新增：待收货自提订单（o10）的「供应商→门店」单，在途 —— 门店确认到货后提货码方开放 */
  {
    id: "FHD2609180012", leg: "supplier_inbound", source: "订单支付自动生成", createdAt: "2026-09-18 15:31:00",
    orderNo: "ORD260918000088", product: "儿童保温杯", spec: "500ml / 蓝", emoji: "🥤", qty: 2, sent: 2,
    shipper: "供应商002", receiver: "9071门店", receiverAddr: "辽宁省铁岭市银州区工人街 28 号",
    carrier: "中通快递", tracking: "ZT8800112455", track: "已发货 2026-09-18 18:00:00", status: "已发货", ops: ["详情", "收货"],
  },
  /* F4 两段链路演示样本：同一订单 ORD260918000012
     FHD2609180008 = 上游「供应商→总仓」（在途，未收货）
     FHD2609180004 = 下游「总部仓→门店」（被锁，总仓收货后才可发货） */
  {
    id: "FHD2609180008", leg: "supplier_to_hq", source: "订单支付自动生成", createdAt: "2026-09-18 09:31:15",
    orderNo: "ORD260918000012", product: "奶粉(复制)", spec: "800g / 罐", emoji: "🥛", qty: 2, sent: 2,
    shipper: "JOJO供应商", receiver: "九天教育总仓", receiverAddr: "广州市天河区科韵路 16 号",
    carrier: "中通快递", tracking: "ZT8800112402", track: "已发货 2026-09-18 14:00:00", status: "已发货", ops: ["详情", "收货"],
  },
  /* 差异单 DIFF2609170001 的来源单（画板套装 · 门店上报） */
  {
    id: "FHD2609180007", leg: "hq_store", source: "订单支付自动生成", createdAt: "2026-09-18 08:20:00",
    orderNo: "ORD260918000021", product: "画板套装", spec: "基础版", emoji: "🎨", qty: 2, sent: 2,
    shipper: "九天教育总仓", receiver: "九天门店", receiverAddr: "广东省广州市荔湾区宝华路 76 号",
    carrier: "中通快递", tracking: "ZT8800112500", track: "已签收 2026-09-18 12:40:00", status: "收货异常", ops: ["详情"],
  },
  /* 差异单 DIFF2609170004 的补发单（总部仓 → 门店，在途） */
  {
    id: "FHD2609170907", leg: "hq_store", source: "配送差异补发", createdAt: "2026-09-18 10:30:00",
    orderNo: "ORD260914000058", product: "儿童绘本套装", spec: "全 8 册", emoji: "📚", qty: 1, sent: 1,
    shipper: "九天教育总仓", receiver: "九天门店", receiverAddr: "广东省广州市荔湾区宝华路 76 号",
    carrier: "中通快递", tracking: "ZT8800112488", track: "已发货 2026-09-18 16:00:00", status: "已发货", isMakeup: true, reshipOf: "DIFF2609170004", ops: ["详情", "收货"],
  },
  /* 退货返厂单关联的门店已收货供货单（RTV 来源） */
  {
    id: "FHD2609160003", leg: "hq_store", source: "订单支付自动生成", createdAt: "2026-09-16 09:40:00",
    orderNo: "ORD260916000121", product: "什锦果蔬", spec: "礼盒装 / 12 盒", emoji: "🧺", qty: 3, sent: 3,
    shipper: "九天教育总仓", receiver: "九天门店", receiverAddr: "广东省广州市荔湾区宝华路 76 号",
    carrier: "中通快递", tracking: "ZT8800112466", track: "已签收 2026-09-16 18:20:00", status: "已收货", ops: ["详情"],
  },
  {
    id: "FHD2609150002", leg: "supplier_inbound", source: "订单支付自动生成", createdAt: "2026-09-15 11:02:00",
    orderNo: "ORD260915000088", product: "华为手机", spec: "蓝色 / M", emoji: "📱", qty: 1, sent: 1,
    shipper: "JOJO供应商", receiver: "濮源直播间", receiverAddr: "广州市越秀区东风中路 410 号时代地产中心",
    carrier: "圆通速递", tracking: "YT5598712300", track: "已签收 2026-09-15 19:30:00", status: "已收货", ops: ["详情"],
  },
  {
    id: "FHD2609160005", leg: "hq_store", source: "订单支付自动生成", createdAt: "2026-09-16 13:15:00",
    orderNo: "ORD260916000144", product: "奶粉", spec: "800g / 罐", emoji: "🥛", qty: 2, sent: 2,
    shipper: "九天教育总仓", receiver: "9071门店", receiverAddr: "辽宁省铁岭市银州区工人街 28 号",
    carrier: "中通快递", tracking: "ZT8800112477", track: "已签收 2026-09-16 20:05:00", status: "已收货", ops: ["详情"],
  },
  {
    id: "FHD2609180014", leg: "hq_store", source: "订单支付自动生成", createdAt: "2026-09-18 15:10:00",
    orderNo: "ORD260918000101", product: "华为手机", spec: "黑色 / L", emoji: "📱", qty: 1, sent: 1,
    shipper: "九天教育总仓", receiver: "濮源直播间", receiverAddr: "广州市越秀区东风中路 410 号时代地产中心",
    carrier: "韵达快递", tracking: "YD1122334501", track: "已签收 2026-09-18 19:40:00", status: "已收货", ops: ["详情"],
  },
  {
    id: "FHD2609180016", leg: "supplier_inbound", source: "订单支付自动生成", createdAt: "2026-09-18 10:12:00",
    orderNo: "ORD260918000093", product: "什锦果蔬", spec: "礼盒装 / 6 盒", emoji: "🧺", qty: 6, sent: 6,
    shipper: "供应商003", receiver: "濮源直播间", receiverAddr: "广州市越秀区东风中路 410 号时代地产中心",
    carrier: "中通快递", tracking: "ZT8800112499", track: "已签收 2026-09-18 17:25:00", status: "已收货", ops: ["详情"],
  },
  {
    id: "FHD2609170004", leg: "supplier_to_hq", source: "订单支付自动生成", createdAt: "2026-09-17 16:55:00",
    orderNo: "ORD260917000153", product: "华为手机", spec: "规格: 默认", emoji: "📱", qty: 1, sent: 1,
    shipper: "供应商002", receiver: "九天教育总仓", receiverAddr: "广州市天河区科韵路 16 号",
    carrier: "顺丰速运", tracking: "SF7712003510", track: "已发货 2026-09-17 19:30:00", status: "已发货", ops: ["详情", "收货"],
  },
  {
    id: "FHD2609170019", leg: "supplier_inbound", source: "订单支付自动生成", createdAt: "2026-09-17 11:25:00",
    orderNo: "ORD260918000202", product: "沐浴露", spec: "持久留香 / 500ml", emoji: "🧴", qty: 1, sent: 1,
    shipper: "供应商003", receiver: "9071门店", receiverAddr: "辽宁省铁岭市银州区工人街 28 号",
    carrier: "中通快递", tracking: "ZT8800112244", track: "已签收 2026-09-18 09:10:00", status: "已收货", ops: ["详情"],
  },
  {
    id: "FHD2609130019", leg: "supplier_inbound", source: "订单支付自动生成", createdAt: "2026-09-13 15:05:00",
    orderNo: "ORD260913000055", product: "大米", spec: "5kg / 袋", emoji: "🌾", qty: 1, sent: 1,
    shipper: "供应商002", receiver: "9071门店", receiverAddr: "辽宁省铁岭市银州区工人街 28 号",
    carrier: "圆通速递", tracking: "YT5500338811", track: "已签收 2026-09-14 10:20:00", status: "已收货", ops: ["详情"],
  },
  /* 待发货补充：三处「导入发货」入口都有成批样本（发总部仓 / 发门店 / 租户发货管理） */
  {
    id: "FHD2609200061", leg: "supplier_to_hq", source: "订单支付自动生成", createdAt: "2026-09-20 09:12:33",
    orderNo: "ORD260920000201", product: "山茶油", spec: "750ml / 瓶", emoji: "🫒", qty: 6, sent: 6,
    shipper: "供应商001", receiver: "九天教育总仓", receiverAddr: "广州市天河区科韵路 16 号",
    carrier: "顺丰速运", tracking: "SF7712003821", track: "已签收 2026-09-21 10:30:00", status: "已收货", ops: ["详情"], received: 6,
  },
  {
    id: "FHD2609200062", leg: "supplier_to_hq", source: "订单支付自动生成", createdAt: "2026-09-20 10:05:14",
    orderNo: "ORD260920000202", product: "大米", spec: "5kg / 袋", emoji: "🌾", qty: 4, sent: 4,
    shipper: "供应商002", receiver: "九天教育总仓", receiverAddr: "广州市天河区科韵路 16 号",
    carrier: "圆通速递", tracking: "YT5500338877", track: "已签收 2026-09-21 11:15:00", status: "已收货", ops: ["详情"], received: 4,
  },
  {
    id: "FHD2609200063", leg: "supplier_to_hq", source: "订单支付自动生成", createdAt: "2026-09-20 11:40:10",
    orderNo: "ORD260920000203", product: "画板套装", spec: "12 色 / 含画架", emoji: "🎨", qty: 2, sent: 2,
    shipper: "供应商003", receiver: "九天教育总仓", receiverAddr: "广州市天河区科韵路 16 号",
    carrier: "中通快递", tracking: "ZT8800112511", track: "已签收 2026-09-21 14:05:00", status: "已收货", ops: ["详情"], received: 2,
  },
  {
    id: "FHD2609200064", leg: "supplier_inbound", source: "订单支付自动生成", createdAt: "2026-09-20 13:26:48",
    orderNo: "ORD260920000204", product: "什锦果蔬", spec: "礼盒装 / 6 盒", emoji: "🧺", qty: 5, sent: 0,
    shipper: "供应商003", receiver: "9071门店", receiverAddr: "辽宁省铁岭市银州区工人街 28 号",
    carrier: "", tracking: "", track: "", status: "待发货", ops: ["详情", "发货"], received: 0,
  },
  {
    id: "FHD2609200065", leg: "supplier_inbound", source: "订单支付自动生成", createdAt: "2026-09-20 14:52:22",
    orderNo: "ORD260920000205", product: "苹果", spec: "红富士 / 5 斤装", emoji: "🍎", qty: 8, sent: 0,
    shipper: "供应商002", receiver: "濮源直播间", receiverAddr: "广州市越秀区东风中路 410 号时代地产中心",
    carrier: "", tracking: "", track: "", status: "待发货", ops: ["详情", "发货"], received: 0,
  },
  {
    id: "FHD2609200066", leg: "supplier_inbound", source: "订单支付自动生成", createdAt: "2026-09-20 16:08:06",
    orderNo: "ORD260920000206", product: "奶粉", spec: "800g / 罐", emoji: "🥛", qty: 3, sent: 0,
    shipper: "供应商001", receiver: "九天门店", receiverAddr: "广东省广州市荔湾区宝华路 76 号",
    carrier: "", tracking: "", track: "", status: "待发货", ops: ["详情", "发货"], received: 0,
  },
  /* 上游段已确认收货 → 总部仓这一段才可发货（upstreamReady 门禁） */
  {
    id: "FHD2609200067", leg: "hq_store", source: "订单支付自动生成", createdAt: "2026-09-20 09:12:33",
    orderNo: "ORD260920000201", product: "山茶油", spec: "750ml / 瓶", emoji: "🫒", qty: 6, sent: 0,
    shipper: "九天教育总仓", receiver: "九天门店", receiverAddr: "广东省广州市荔湾区宝华路 76 号",
    carrier: "", tracking: "", track: "", status: "待发货", ops: ["详情", "发货"], received: 0,
  },
  {
    id: "FHD2609200068", leg: "hq_store", source: "订单支付自动生成", createdAt: "2026-09-20 10:05:14",
    orderNo: "ORD260920000202", product: "大米", spec: "5kg / 袋", emoji: "🌾", qty: 4, sent: 0,
    shipper: "九天教育总仓", receiver: "9071门店", receiverAddr: "辽宁省铁岭市银州区工人街 28 号",
    carrier: "", tracking: "", track: "", status: "待发货", ops: ["详情", "发货"], received: 0,
  },
  {
    id: "FHD2609200069", leg: "hq_store", source: "订单支付自动生成", createdAt: "2026-09-20 11:40:10",
    orderNo: "ORD260920000203", product: "画板套装", spec: "12 色 / 含画架", emoji: "🎨", qty: 2, sent: 0,
    shipper: "九天教育总仓", receiver: "九天门店", receiverAddr: "广东省广州市荔湾区宝华路 76 号",
    carrier: "", tracking: "", track: "", status: "待发货", ops: ["详情", "发货"], received: 0,
  },
  {
    id: "FHD2609200070", leg: "supplier_to_hq", source: "订单支付自动生成", createdAt: "2026-09-20 17:20:41",
    orderNo: "ORD260920000207", product: "儿童绘本套装", spec: "全 8 册", emoji: "📚", qty: 3, sent: 0,
    shipper: "供应商002", receiver: "九天教育总仓", receiverAddr: "广州市天河区科韵路 16 号",
    carrier: "", tracking: "", track: "", status: "待发货", ops: ["详情", "发货"], received: 0,
  },
  {
    id: "FHD2609200071", leg: "supplier_to_hq", source: "订单支付自动生成", createdAt: "2026-09-20 18:02:11",
    orderNo: "ORD260920000208", product: "相机", spec: "银色 / 标准版", emoji: "📷", qty: 2, sent: 0,
    shipper: "供应商003", receiver: "九天教育总仓", receiverAddr: "广州市天河区科韵路 16 号",
    carrier: "", tracking: "", track: "", status: "待发货", ops: ["详情", "发货"], received: 0,
  },
  {
    id: "FHD2609200072", leg: "supplier_to_hq", source: "订单支付自动生成", createdAt: "2026-09-20 18:46:05",
    orderNo: "ORD260920000209", product: "华为手机", spec: "规格: 默认", emoji: "📱", qty: 1, sent: 0,
    shipper: "供应商001", receiver: "九天教育总仓", receiverAddr: "广州市天河区科韵路 16 号",
    carrier: "", tracking: "", track: "", status: "待发货", ops: ["详情", "发货"], received: 0,
  },
];

// 累计实收（只增不减）：默认已收货=收齐，部分收货/收货异常单独标
SUPPLY_DOCS.forEach((d) => { if (d.received === undefined) d.received = d.status === "已收货" ? d.qty : 0; });
SUPPLY_DOCS.find((d) => d.id === "FHD2609160008").received = 4; // 部分收货
SUPPLY_DOCS.find((d) => d.id === "FHD2609160009").received = 3; // 收货异常
SUPPLY_DOCS.find((d) => d.id === "FHD2609120002").received = 4; // 收货异常（差异单来源）
SUPPLY_DOCS.find((d) => d.id === "FHD2609140003").received = 8; // 收货异常（差异单来源）
SUPPLY_DOCS.find((d) => d.id === "FHD2609180017").received = 5; // 收货异常（差异单 DIFF2609190001 来源）

/* 供应商后台的供货任务（含补发单） */
export const SUPPLIER_DOCS = [
  {
    id: "FHD2609180011", leg: "sup_consumer", source: "订单支付自动生成", createdAt: "2026-09-18 14:47:36",
    orderNo: "ORD260918000018", product: "西瓜", spec: "规格: S", emoji: "🍉", qty: 1, sent: 0,
    shipper: "JOJO供应商", receiver: "火火（消费者）", receiverAddr: "江苏省南通市海门市海门高新区测试",
    carrier: "", tracking: "", track: "", status: "待发货", ops: ["详情", "发货"],
  },
  {
    id: "FHD2609170002", leg: "supplier_inbound", source: "订单支付自动生成", createdAt: "2026-09-17 17:09:44",
    orderNo: "ORD260917000164", product: "什锦果蔬", spec: "规格: 黑色/", emoji: "🧺", qty: 1, sent: 1,
    shipper: "供应商003", receiver: "9071门店", receiverAddr: "辽宁省铁岭市银州区工人街 28 号",
    carrier: "中通快递", tracking: "ZT8800112233", track: "已签收 2026-09-17 17:12:44", status: "已收货", ops: ["详情"],
  },
  {
    id: "FHD2609170001", leg: "supplier_inbound", source: "订单支付自动生成", createdAt: "2026-09-17 17:09:10",
    orderNo: "ORD260917000159", product: "什锦果蔬", spec: "规格: 蓝色/", emoji: "🧺", qty: 1, sent: 1,
    shipper: "供应商003", receiver: "9071门店", receiverAddr: "辽宁省铁岭市银州区工人街 28 号",
    carrier: "圆通速递", tracking: "YT5598712099", track: "已发货 2026-09-17 17:12:44", status: "已发货", ops: ["详情"],
  },
  {
    id: "FHD2609170003", leg: "supplier_to_hq", source: "订单支付自动生成", createdAt: "2026-09-17 10:22:05",
    orderNo: "ORD260917000151", product: "奶粉", spec: "800g / 罐", emoji: "🥛", qty: 10, sent: 10,
    shipper: "供应商001", receiver: "九天教育总仓", receiverAddr: "广州市天河区科韵路 16 号",
    carrier: "顺丰速运", tracking: "SF9900112200", track: "已签收 2026-09-17 15:20:00", status: "已收货", ops: ["详情"],
  },
  {
    id: "FHD2609160009", leg: "supplier_to_hq", source: "订单支付自动生成", createdAt: "2026-09-16 11:03:00",
    orderNo: "ORD260916000145", product: "什锦果蔬", spec: "礼盒装", emoji: "🧺", qty: 4, sent: 4,
    shipper: "供应商003", receiver: "九天教育总仓", receiverAddr: "广州市天河区科韵路 16 号",
    carrier: "韵达快递", tracking: "YD1122334455", track: "已签收 2026-09-17 08:10:00", status: "收货异常", ops: ["详情"],
  },
  {
    id: "FHD2609180013", leg: "supplier_to_hq", source: "配送差异补发", createdAt: "2026-09-18 10:00:00",
    orderNo: "ORD260916000145", product: "什锦果蔬", spec: "礼盒装", emoji: "🧺", qty: 1, sent: 0,
    shipper: "供应商003", receiver: "九天教育总仓", receiverAddr: "广州市天河区科韵路 16 号",
    carrier: "", tracking: "", track: "", status: "待发货", isMakeup: true, reshipOf: "DIFF2609170003", ops: ["详情", "发货"],
  },
  /* 补发单（对应差异种子）：一张在途「补发中」、一张已收货「补发完成」 */
  {
    id: "FHD2609180030", leg: "supplier_to_hq", source: "配送差异补发", createdAt: "2026-09-18 14:00:00",
    orderNo: "ORD260917000136", product: "相机", spec: "银色 / 标准版", emoji: "📷", qty: 1, sent: 1,
    shipper: "供应商002", receiver: "九天教育总仓", receiverAddr: "广州市天河区科韵路 16 号",
    carrier: "顺丰速运", tracking: "SF7712007788", track: "已发货 2026-09-18 18:10:00", status: "已发货", isMakeup: true, reshipOf: "DIFF2609170010", ops: ["详情", "收货"],
  },
  {
    id: "FHD2609160010", leg: "supplier_to_hq", source: "配送差异补发", createdAt: "2026-09-16 15:00:00",
    orderNo: "ORD260918000012", product: "奶粉(复制)", spec: "800g / 罐", emoji: "🥛", qty: 1, sent: 1,
    shipper: "JOJO供应商", receiver: "九天教育总仓", receiverAddr: "广州市天河区科韵路 16 号",
    carrier: "中通快递", tracking: "ZT8800112560", track: "已签收 2026-09-17 11:20:00", status: "已收货", isMakeup: true, reshipOf: "DIFF2609160001", ops: ["详情"],
  },
  // —— 以下用于补齐各 Tab 的状态覆盖 ——
  {
    id: "FHD2609180010", leg: "sup_consumer", source: "订单支付自动生成", createdAt: "2026-09-18 11:20:03",
    orderNo: "ORD260918000009", product: "苹果", spec: "红富士 / 5 斤装", emoji: "🍎", qty: 2, sent: 2,
    shipper: "供应商002", receiver: "周然（消费者）", receiverAddr: "广东省广州市越秀区中山五路 33 号",
    carrier: "顺丰速运", tracking: "SF7712003388", track: "已发货 2026-09-18 15:20:00", status: "已发货", ops: ["详情"],
  },
  {
    id: "FHD2609170009", leg: "sup_consumer", source: "订单支付自动生成", createdAt: "2026-09-17 16:40:00",
    orderNo: "ORD260917000140", product: "相机", spec: "银色 / 标准版", emoji: "📷", qty: 1, sent: 1,
    shipper: "供应商002", receiver: "吴桐（消费者）", receiverAddr: "上海市浦东新区世纪大道 100 号",
    carrier: "中通快递", tracking: "ZT8800112299", track: "已签收 2026-09-18 09:10:00", status: "已签收", ops: ["详情"],
  },
  /* 代发单状态补齐：已完成 / 已关闭 / 已发货 */
  {
    id: "FHD2609150021", leg: "sup_consumer", source: "订单支付自动生成", createdAt: "2026-09-15 10:08:21",
    orderNo: "ORD260915000123", product: "沐浴露", spec: "持久留香 / 500ml", emoji: "🧴", qty: 1, sent: 1,
    shipper: "JOJO供应商", receiver: "沈知夏（消费者）", receiverAddr: "四川省成都市武侯区天府大道 199 号",
    carrier: "圆通速递", tracking: "YT5598712266", track: "已签收 2026-09-16 14:30:00", status: "已签收", ops: ["详情"],
  },
  {
    id: "FHD2609160033", leg: "sup_consumer", source: "订单支付自动生成", createdAt: "2026-09-16 09:15:44",
    orderNo: "ORD260916000188", product: "智能手环", spec: "黑色 / 标准版", emoji: "⌚", qty: 1, sent: 0,
    shipper: "JOJO供应商", receiver: "赵一鸣（消费者）", receiverAddr: "江苏省南京市鼓楼区中山北路 8 号",
    carrier: "", tracking: "", track: "", status: "已取消", ops: ["详情"],
  },
  {
    id: "FHD2609180044", leg: "sup_consumer", source: "订单支付自动生成", createdAt: "2026-09-18 16:22:10",
    orderNo: "ORD260918000466", product: "电饭煲", spec: "4L / 智能款", emoji: "🍚", qty: 1, sent: 1,
    shipper: "JOJO供应商", receiver: "孙小满（消费者）", receiverAddr: "湖北省武汉市洪山区珞喻路 129 号",
    carrier: "韵达快递", tracking: "YD1122336801", track: "已发货 2026-09-19 09:30:00", status: "已发货", ops: ["详情"],
  },
  {
    id: "FHD2609180051", leg: "sup_consumer", source: "订单支付自动生成", createdAt: "2026-09-18 18:05:12",
    orderNo: "ORD260918000512", product: "篮球", spec: "7号 / 标准", emoji: "🏀", qty: 2, sent: 0,
    shipper: "JOJO供应商", receiver: "方小北（消费者）", receiverAddr: "福建省厦门市思明区软件园二期 33 号",
    carrier: "", tracking: "", track: "", status: "待发货", ops: ["详情", "发货"],
  },
  /* 补齐引用：订单 ORD260917000147（总部仓直配·供应商供货）的上游段供货单 */
  {
    id: "FHD2609170021", leg: "supplier_to_hq", source: "订单支付自动生成", createdAt: "2026-09-17 17:44:22",
    orderNo: "ORD260917000147", product: "华为手机", spec: "蓝色/M", emoji: "📱", qty: 1, sent: 1,
    shipper: "JOJO供应商", receiver: "九天教育总仓", receiverAddr: "广州市天河区科韵路 16 号",
    carrier: "顺丰速运", tracking: "SF9900112288", track: "已签收 2026-09-17 09:20:00",
    status: "已收货", ops: ["详情"],
  },
  {
    id: "FHD2609190052", leg: "sup_consumer", source: "订单支付自动生成", createdAt: "2026-09-19 09:14:40",
    orderNo: "ORD260919000088", product: "台灯", spec: "护眼 / 白色", emoji: "💡", qty: 1, sent: 0,
    shipper: "JOJO供应商", receiver: "唐小满（消费者）", receiverAddr: "陕西省西安市雁塔区高新路 25 号",
    carrier: "", tracking: "", track: "", status: "待发货", ops: ["详情", "发货"],
  },
  {
    id: "FHD2609170012", leg: "supplier_to_hq", source: "订单支付自动生成", createdAt: "2026-09-17 14:05:00",
    orderNo: "ORD260917000148", product: "相机", spec: "银色 / 标准版", emoji: "📷", qty: 5, sent: 0,
    shipper: "供应商002", receiver: "九天教育总仓", receiverAddr: "广州市天河区科韵路 16 号",
    carrier: "", tracking: "", track: "", status: "待发货", ops: ["详情", "发货"],
  },
  {
    id: "FHD2609170014", leg: "supplier_to_hq", source: "订单支付自动生成", createdAt: "2026-09-17 09:40:00",
    orderNo: "ORD260917000136", product: "相机", spec: "银色 / 标准版", emoji: "📷", qty: 8, sent: 8,
    shipper: "供应商002", receiver: "九天教育总仓", receiverAddr: "广州市天河区科韵路 16 号",
    carrier: "京东物流", tracking: "JD5566778811", track: "已发货 2026-09-18 08:30:00", status: "已发货", ops: ["详情"],
  },
  {
    id: "FHD2609170015", leg: "supplier_to_hq", source: "订单支付自动生成", createdAt: "2026-09-17 08:15:00",
    orderNo: "ORD260917000130", product: "苹果", spec: "红富士 / 5 斤装", emoji: "🍎", qty: 9, sent: 9,
    shipper: "供应商002", receiver: "九天教育总仓", receiverAddr: "广州市天河区科韵路 16 号",
    carrier: "圆通速递", tracking: "YT9900887711", track: "已发货 2026-09-18 07:20:00", status: "部分收货", ops: ["详情"],
  },
  {
    id: "FHD2609170016", leg: "supplier_inbound", source: "订单支付自动生成", createdAt: "2026-09-17 13:22:00",
    orderNo: "ORD260917000144", product: "什锦果蔬", spec: "礼盒装", emoji: "🧺", qty: 5, sent: 0,
    shipper: "供应商003", receiver: "九天门店", receiverAddr: "广东省广州市荔湾区宝华路 76 号",
    carrier: "", tracking: "", track: "", status: "待发货", ops: ["详情", "发货"],
  },
  {
    id: "FHD2609170017", leg: "supplier_inbound", source: "订单支付自动生成", createdAt: "2026-09-17 11:08:00",
    orderNo: "ORD260917000139", product: "苹果", spec: "红富士 / 5 斤装", emoji: "🍎", qty: 6, sent: 6,
    shipper: "供应商002", receiver: "9071门店", receiverAddr: "辽宁省铁岭市银州区工人街 28 号",
    carrier: "韵达快递", tracking: "YD1122334477", track: "已发货 2026-09-18 10:00:00", status: "部分收货", ops: ["详情"],
  },
  {
    id: "FHD2609170018", leg: "supplier_inbound", source: "订单支付自动生成", createdAt: "2026-09-17 16:02:00",
    orderNo: "ORD260917000152", product: "相机", spec: "银色 / 标准版", emoji: "📷", qty: 3, sent: 3,
    shipper: "供应商002", receiver: "九天门店", receiverAddr: "广东省广州市荔湾区宝华路 76 号",
    carrier: "顺丰速运", tracking: "SF7712003399", track: "已签收 2026-09-18 09:40:00", status: "收货异常", ops: ["详情"],
  },
  /* 进销存新增：待收货自提订单（o10）的「供应商→门店」任务（在途） */
  {
    id: "FHD2609180012", leg: "supplier_inbound", source: "订单支付自动生成", createdAt: "2026-09-18 15:31:00",
    orderNo: "ORD260918000088", product: "儿童保温杯", spec: "500ml / 蓝", emoji: "🥤", qty: 2, sent: 2,
    shipper: "供应商002", receiver: "9071门店", receiverAddr: "辽宁省铁岭市银州区工人街 28 号",
    carrier: "中通快递", tracking: "ZT8800112455", track: "已发货 2026-09-18 18:00:00", status: "已发货", ops: ["详情", "收货"],
  },
  /* 与租户侧同步的门店已收货单（退货返厂单 RTV 的来源） */
  {
    id: "FHD2609150002", leg: "supplier_inbound", source: "订单支付自动生成", createdAt: "2026-09-15 11:02:00",
    orderNo: "ORD260915000088", product: "华为手机", spec: "蓝色 / M", emoji: "📱", qty: 1, sent: 1,
    shipper: "JOJO供应商", receiver: "濮源直播间", receiverAddr: "广州市越秀区东风中路 410 号时代地产中心",
    carrier: "圆通速递", tracking: "YT5598712300", track: "已签收 2026-09-15 19:30:00", status: "已收货", ops: ["详情"],
  },
  {
    id: "FHD2609180016", leg: "supplier_inbound", source: "订单支付自动生成", createdAt: "2026-09-18 10:12:00",
    orderNo: "ORD260918000093", product: "什锦果蔬", spec: "礼盒装 / 6 盒", emoji: "🧺", qty: 6, sent: 6,
    shipper: "供应商003", receiver: "濮源直播间", receiverAddr: "广州市越秀区东风中路 410 号时代地产中心",
    carrier: "中通快递", tracking: "ZT8800112499", track: "已签收 2026-09-18 17:25:00", status: "已收货", ops: ["详情"],
  },
  {
    id: "FHD2609170004", leg: "supplier_to_hq", source: "订单支付自动生成", createdAt: "2026-09-17 16:55:00",
    orderNo: "ORD260917000153", product: "华为手机", spec: "规格: 默认", emoji: "📱", qty: 1, sent: 1,
    shipper: "供应商002", receiver: "九天教育总仓", receiverAddr: "广州市天河区科韵路 16 号",
    carrier: "顺丰速运", tracking: "SF7712003510", track: "已发货 2026-09-17 19:30:00", status: "已发货", ops: ["详情", "收货"],
  },
  {
    id: "FHD2609170019", leg: "supplier_inbound", source: "订单支付自动生成", createdAt: "2026-09-17 11:25:00",
    orderNo: "ORD260918000202", product: "沐浴露", spec: "持久留香 / 500ml", emoji: "🧴", qty: 1, sent: 1,
    shipper: "供应商003", receiver: "9071门店", receiverAddr: "辽宁省铁岭市银州区工人街 28 号",
    carrier: "中通快递", tracking: "ZT8800112244", track: "已签收 2026-09-18 09:10:00", status: "已收货", ops: ["详情"],
  },
  {
    id: "FHD2609130019", leg: "supplier_inbound", source: "订单支付自动生成", createdAt: "2026-09-13 15:05:00",
    orderNo: "ORD260913000055", product: "大米", spec: "5kg / 袋", emoji: "🌾", qty: 1, sent: 1,
    shipper: "供应商002", receiver: "9071门店", receiverAddr: "辽宁省铁岭市银州区工人街 28 号",
    carrier: "圆通速递", tracking: "YT5500338811", track: "已签收 2026-09-14 10:20:00", status: "已收货", ops: ["详情"],
  },
];

// 累计实收（只增不减）：与租户侧同口径；部分收货/收货异常单独标
SUPPLIER_DOCS.forEach((d) => { if (d.received === undefined) d.received = d.status === "已收货" ? d.qty : 0; });
SUPPLIER_DOCS.find((d) => d.id === "FHD2609160009").received = 3; // 收货异常（差异单 DIFF2609170003 来源）
SUPPLIER_DOCS.find((d) => d.id === "FHD2609170015").received = 6; // 部分收货
SUPPLIER_DOCS.find((d) => d.id === "FHD2609170017").received = 4; // 部分收货
SUPPLIER_DOCS.find((d) => d.id === "FHD2609170018").received = 2; // 收货异常（差异单 DIFF2609170005 来源）

/* 同 id 的供货单在两端是同一张物理单据：共享链路（供应商→总仓 / 供应商→门店）
   必须两端可见；仅供应商侧「供应商→消费者」、仅租户侧「总部仓→门店」不参与同步 */
{
  const SHARED_LEGS = ["supplier_to_hq", "supplier_inbound"];
  const ids = new Set([...SUPPLY_DOCS, ...SUPPLIER_DOCS].filter((d) => SHARED_LEGS.includes(d.leg)).map((d) => d.id));
  for (const id of ids) {
    const a = SUPPLY_DOCS.find((d) => d.id === id);
    const b = SUPPLIER_DOCS.find((d) => d.id === id);
    if (a && !b) SUPPLIER_DOCS.push({ ...a });
    if (b && !a) SUPPLY_DOCS.push({ ...b });
  }
}


/* 供应商地址簿：发货地址（发货时选）与售后地址（同意退货时给买家寄回用） */
export const SUP_ADDRESSES = [
  { id: "ad1", type: "ship", name: "JOJO供应商", phone: "18100010002", region: "广东省/广州市/天河区", detail: "科苑路 16 号", postcode: "510630", isDefault: true },
  { id: "ad2", type: "ship", name: "JOJO供应商（备用仓）", phone: "18100010003", region: "广东省/广州市/白云区", detail: "太和镇兴太三路 6 号", postcode: "510080", isDefault: false },
  { id: "ad3", type: "after", name: "JOJO供应商（退货组）", phone: "18100010002", region: "广东省/广州市/天河区", detail: "科苑路 16 号 A 栋 1 楼退货组", postcode: "510630", isDefault: true },
];

/* ==========================================================================
   租户后台 › 设置 › 地址库（照真实 SaaS 复刻）
   三个页签：发货地址 / 售后地址 / 仓库地址；同类型下「默认」互斥
   · 发货地址：供应商发货时选它（发货弹窗）
   · 售后地址：总部在「售后管理」同意退货时选它，随同意发给买家当寄回地址
   · 仓库地址：总部仓 / 门店收货点，供内部单据参照
   ========================================================================== */
export const ADDRESS_BOOK = [
  { id: "ab1", type: "ship", name: "张三", phone: "13800138000", region: "广东省/广州市/天河区", detail: "体育西路100号", postcode: "510000", isDefault: true },
  { id: "ab2", type: "ship", name: "九天教育总仓", phone: "18100020001", region: "广东省/广州市/荔湾区", detail: "宝华路76号", postcode: "510150", isDefault: false },
  { id: "ab3", type: "ship", name: "JOJO供应商", phone: "18100010002", region: "广东省/广州市/天河区", detail: "科苑路16号", postcode: "510630", isDefault: false },
  { id: "ab4", type: "ship", name: "康师傅店长", phone: "18100010003", region: "广东省/佛山市/高明区", detail: "云勇林场", postcode: "528500", isDefault: false },
  { id: "ab5", type: "after", name: "JOJO供应商（退货组）", phone: "18100010002", region: "广东省/广州市/天河区", detail: "科苑路16号 A栋1楼退货组", postcode: "510630", isDefault: true },
  { id: "ab6", type: "after", name: "九天教育退货组", phone: "18100020003", region: "河南省/三门峡市/义马市", detail: "朝阳路街道 8 号退货仓", postcode: "472300", isDefault: false },
  { id: "ab7", type: "after", name: "9071门店退货点", phone: "18100002222", region: "辽宁省/铁岭市/银州区", detail: "工人街 28 号", postcode: "112000", isDefault: false },
  { id: "ab8", type: "warehouse", name: "九天教育总仓", phone: "18100020002", region: "广东省/广州市/荔湾区", detail: "宝华路76号 A栋", postcode: "510150", isDefault: true },
  { id: "ab9", type: "warehouse", name: "备用仓", phone: "13966584556", region: "内蒙古自治区/通辽市/库伦旗", detail: "额勒顺镇", postcode: "028200", isDefault: false },
];

/* ==========================================================================
   租户后台 › 设置 › 快递模板（照真实 SaaS 复刻）
   按「可配送范围 + 计费方式」算运费；同一区域命中多模板时取最后保存的
   ========================================================================== */
export const EXPRESS_TPL = [
  { id: "et1", name: "华东按件", area: "上海市", chargeBy: "按件", first: "1", firstFee: "10", next: "1", nextFee: "5", enabled: true },
  { id: "et2", name: "华南按重量", area: "广东省", chargeBy: "按重量", first: "0.1", firstFee: "10", next: "0.1", nextFee: "5", enabled: true },
  { id: "et3", name: "浙甘京专线", area: "浙江省,甘肃省,北京市", chargeBy: "按重量", first: "0.1", firstFee: "10", next: "0.1", nextFee: "5", enabled: true },
  { id: "et4", name: "东北专线", area: "黑龙江省,吉林省,辽宁省", chargeBy: "按件", first: "1", firstFee: "12", next: "1", nextFee: "6", enabled: false },
];

/* 配送差异单（双来源，谁被上报谁审核：总部上报 → 供应商审核；门店上报 → 总部审核） */
export const DIFFS = [
  { id: "DIFF2609170003", source: "总部上报", leg: "供应商 → 总仓", reporter: "总部", supplyNo: "FHD2609160009", shipper: "供应商003", summary: "什锦果蔬 应收4/实收3 差1", diffQty: 1, status: "待补发", evidence: "少货 · 照片 2 张", makeup: "FHD2609180013" },
  { id: "DIFF2609170001", source: "门店上报", leg: "总仓 → 门店", reporter: "门店", supplyNo: "FHD2609180007", shipper: "九天教育总仓", summary: "画板套装 应收2/实收0 差2", diffQty: 2, status: "待举证", evidence: "—" },
  { id: "DIFF2609170002", source: "门店上报", leg: "总仓 → 门店", reporter: "门店", supplyNo: "FHD2609120002", shipper: "九天教育总仓", summary: "什锦果蔬 应收5/实收4 差1", diffQty: 1, status: "待总部审核", evidence: "少货 · 照片 1 张" },
  { id: "DIFF2609170004", source: "门店上报", leg: "总仓 → 门店", reporter: "门店", supplyNo: "FHD2609140003", shipper: "九天教育总仓", summary: "儿童绘本套装 应收9/实收8 差1", diffQty: 1, status: "补发中", evidence: "少货 · 照片 3 张", makeup: "FHD2609170907" },
  { id: "DIFF2609170005", source: "门店上报", leg: "供应商 → 门店", reporter: "门店", supplyNo: "FHD2609170018", shipper: "供应商002", summary: "相机 应收3/实收2 差1", diffQty: 1, status: "待举证", evidence: "—" },
  { id: "DIFF2609150004", source: "门店上报", leg: "供应商 → 门店", reporter: "门店", supplyNo: "FHD2609150002", shipper: "JOJO供应商", summary: "华为手机 应收1/实收1 错货 1 件", diffQty: 1, status: "审核不通过", evidence: "错货 · 照片 2 张", rejectReason: "举证照片无法证明错货，线下核实商品无误" },
  { id: "DIFF2609190002", source: "总部上报", leg: "供应商 → 总仓", reporter: "总部", supplyNo: "FHD2609180009", shipper: "JOJO供应商", summary: "奶粉(复制) 应收2/实收1 差1", diffQty: 1, status: "已关闭", evidence: "少货 · 照片 1 张" },
  /* 总部上报样例：总仓收货登记少收（举证随收货完成），待供应商审核 → 通过后供应商补发 */
  { id: "DIFF2609190001", source: "总部上报", leg: "供应商 → 总仓", reporter: "总部", supplyNo: "FHD2609180017", shipper: "供应商001", summary: "奶粉 应收6/实收5 差1", diffQty: 1, status: "待供应商审核", evidence: "少货 · 照片 2 张" },
  /* Tab 状态覆盖补齐：总部上报的 补发中 / 补发完成 / 审核不通过，门店上报的 已关闭 */
  { id: "DIFF2609170010", source: "总部上报", leg: "供应商 → 总仓", reporter: "总部", supplyNo: "FHD2609170014", shipper: "供应商002", summary: "相机 应收8/实收7 差1", diffQty: 1, status: "补发中", evidence: "少货 · 照片 2 张", makeup: "FHD2609180030" },
  { id: "DIFF2609160001", source: "总部上报", leg: "供应商 → 总仓", reporter: "总部", supplyNo: "FHD2609180008", shipper: "JOJO供应商", summary: "奶粉(复制) 应收2/实收1 差1", diffQty: 1, status: "补发完成", evidence: "少货 · 照片 1 张", makeup: "FHD2609160010" },
  { id: "DIFF2609150003", source: "总部上报", leg: "供应商 → 总仓", reporter: "总部", supplyNo: "FHD2609170004", shipper: "供应商002", summary: "华为手机 应收1/实收1 错货 1 件", diffQty: 1, status: "审核不通过", evidence: "错货 · 照片 2 张", rejectReason: "错货商品已线下换回，无需补发" },
  { id: "DIFF2609140001", source: "门店上报", leg: "供应商 → 门店", reporter: "门店", supplyNo: "FHD2609170017", shipper: "供应商002", summary: "苹果 应收6/实收5 差1", diffQty: 1, status: "已关闭", evidence: "少货 · 照片 2 张" },
];

/* ==========================================================================
   退货返厂单（本期新增）—— 门店自提链路 F4/F5 的消费者退货，实物退回供应商
   · 路径：F5（供应商→门店）门店直退供应商；F4（供应商→总仓→门店）门店→总部仓→供应商，逐段确认
   · 退款与返厂【解耦】：退款由总部按售后规则独立执行，返厂不阻塞客户退款体验
   · 与「配送差异」无关：差异是正向履约异常，返厂是售后逆向；退给供应商的实物必须接收（返厂单没有「拒收」状态）
   ========================================================================== */
export const RETURN_STEPS = ["待返厂", "返厂中", "已返厂"];
export const RETURNS = [
  {
    id: "RTV2609190001", orderNo: "ORD260917000139", supplyNo: "FHD2609170017",
    store: "9071门店", leg: "supplier_inbound", viaHq: false, returnTo: "供应商002",
    product: "苹果", spec: "红富士 / 5 斤装", emoji: "🍎", qty: 2, reason: "七天无理由退货",
    createdAt: "2026-09-19 09:12:00", status: "待返厂",
    refunded: true, refundNote: "总部已退款 ¥0.02",
    hops: [{ from: "9071门店", to: "供应商002", carrier: "", tracking: "", status: "待发货" }],
  },
  {
    id: "RTV2609190002", orderNo: "ORD260917000152", supplyNo: "FHD2609170018",
    store: "九天门店", leg: "supplier_inbound", viaHq: false, returnTo: "供应商002",
    product: "相机", spec: "银色 / 标准版", emoji: "📷", qty: 1, reason: "商品与描述不符",
    createdAt: "2026-09-18 16:40:00", status: "返厂中",
    refunded: true, refundNote: "总部已退款 ¥0.01",
    hops: [{ from: "九天门店", to: "供应商002", carrier: "顺丰速运", tracking: "SF7712003411", status: "运输中" }],
  },
  {
    id: "RTV2609190003", orderNo: "ORD260916000121", supplyNo: "FHD2609160003",
    store: "九天门店", leg: "hq_store", viaHq: true, returnTo: "供应商003",
    product: "什锦果蔬", spec: "礼盒装 / 12 盒", emoji: "🧺", qty: 3, reason: "客户取消（未提货）",
    createdAt: "2026-09-18 11:05:00", status: "返厂中",
    refunded: true, refundNote: "总部已退款 ¥0.03",
    hops: [
      { from: "九天门店", to: "九天教育总仓", carrier: "中通快递", tracking: "ZT8800112401", status: "已收货" },
      { from: "九天教育总仓", to: "供应商003", carrier: "", tracking: "", status: "待发货" },
    ],
  },
  {
    id: "RTV2609190004", orderNo: "ORD260915000088", supplyNo: "FHD2609150002",
    store: "濮源直播间", leg: "supplier_inbound", viaHq: false, returnTo: "JOJO供应商",
    product: "华为手机", spec: "蓝色 / M", emoji: "📱", qty: 1, reason: "七天无理由退货",
    createdAt: "2026-09-15 14:22:00", status: "已返厂",
    refunded: true, refundNote: "总部已退款 ¥0.01",
    hops: [{ from: "濮源直播间", to: "JOJO供应商", carrier: "圆通速递", tracking: "YT5598712300", status: "已收货" }],
  },
  {
    id: "RTV2609190005", orderNo: "ORD260916000144", supplyNo: "FHD2609160005",
    store: "9071门店", leg: "hq_store", viaHq: true, returnTo: "供应商001",
    product: "奶粉", spec: "800g / 罐", emoji: "🥛", qty: 2, reason: "客户取消（未提货）",
    createdAt: "2026-09-19 08:30:00", status: "待返厂",
    refunded: false, refundNote: "退款由总部按售后规则独立执行",
    hops: [
      { from: "9071门店", to: "九天教育总仓", carrier: "", tracking: "", status: "待发货" },
      { from: "九天教育总仓", to: "供应商001", carrier: "", tracking: "", status: "待发货" },
    ],
  },
  {
    id: "RTV2609190006", orderNo: "ORD260918000093", supplyNo: "FHD2609180016",
    store: "濮源直播间", leg: "supplier_inbound", viaHq: false, returnTo: "供应商003",
    product: "什锦果蔬", spec: "礼盒装 / 6 盒", emoji: "🧺", qty: 1, reason: "商品质量问题",
    createdAt: "2026-09-19 10:05:00", status: "待返厂",
    refunded: true, refundNote: "总部已退款 ¥0.01",
    hops: [{ from: "濮源直播间", to: "供应商003", carrier: "", tracking: "", status: "待发货" }],
  },
  {
    id: "RTV2609190007", orderNo: "ORD260918000101", supplyNo: "FHD2609180014",
    store: "濮源直播间", leg: "hq_store", viaHq: true, returnTo: "JOJO供应商",
    product: "华为手机", spec: "黑色 / L", emoji: "📱", qty: 1, reason: "七天无理由退货",
    createdAt: "2026-09-18 19:48:00", status: "返厂中",
    refunded: true, refundNote: "总部已退款 ¥0.01",
    hops: [
      { from: "濮源直播间", to: "九天教育总仓", carrier: "韵达快递", tracking: "YD1122334501", status: "运输中" },
      { from: "九天教育总仓", to: "JOJO供应商", carrier: "", tracking: "", status: "待发货" },
    ],
  },
];

/* 售后单（一件代发：总部审核 + 总部退款，供应商只做货源——两侧同一份数据） */
export const AFTER_SALES = [
  {
    no: "ORD260917000140", asNo: "R20260918260918000021", product: "相机", spec: "银色 / 标准版", emoji: "📷",
    way: "退货退款", ship: "暂无", qty: 1, points: 0, reason: "不想要了",
    amount: "189.00", refund: "189.00",
    at: "2026-09-17 16:05:12", timeout: "-", status: "待供应商签收",
    buyerNote: "-", refundNote: "-",
    order: { 应付金额: "￥189.00", 实付金额: "￥189.00", 配送方式: "快递", 物流状态: "已签收" },
    customer: {},
    goods: { 单价: "189.00", 数量: 1, 实付款: "189.00", 退货数量: 1, 退货金额: "189.00" },
    timeline: [
      { t: "买家发起退款申请", lines: ["售后类型：退货退款", "申请退款金额：￥189.00", "退款原因：不想要了", "退款说明：-"], at: "2026-09-17 16:05:12" },
      { t: "总部已同意售后申请，等待买家退货", lines: [], at: "2026-09-17 17:20:33" },
      { t: "退货地址已发送给买家", lines: ["寄回地址：广东省 广州市 天河区 科苑路 16 号 A 栋 1 楼退货组", "联系人：JOJO供应商（退货组）　电话：18100010002"], at: "2026-09-17 17:20:33" },
      { t: "买家已退货，待供应商签收", lines: ["退货方式：快递", "物流单号：SF7712003402"], at: "2026-09-18 14:22:09" },
    ],
  },
  {
    no: "ORD260915000121", asNo: "R20260917260917000022", product: "苹果", spec: "红富士 / 5 斤装", emoji: "🍎",
    way: "仅退款", ship: "暂无", qty: 1, points: 0, reason: "拍错/多拍",
    amount: "29.90", refund: "29.90",
    at: "2026-09-15 16:22:41", timeout: "-", status: "待总部审核",
    buyerNote: "-", refundNote: "-",
    order: { 应付金额: "￥29.90", 实付金额: "￥29.90", 配送方式: "快递", 物流状态: "已签收" },
    customer: {},
    goods: { 单价: "29.90", 数量: 1, 实付款: "29.90", 退货数量: 0, 退货金额: "29.90" },
    timeline: [
      { t: "买家发起退款申请", lines: ["售后类型：仅退款", "申请退款金额：￥29.90", "退款原因：拍错/多拍", "退款说明：-"], at: "2026-09-15 16:22:41" },
    ],
  },
  {
    no: "ORD260918000213", asNo: "R20260918260918000023", product: "苹果", spec: "红富士 / 5 斤装", emoji: "🍎",
    way: "退货退款", ship: "暂无", qty: 1, points: 0, reason: "商品与描述不符",
    amount: "29.90", refund: "29.90",
    at: "2026-09-17 10:05:33", timeout: "-", status: "待总部退款",
    buyerNote: "-", refundNote: "-",
    order: { 应付金额: "￥29.90", 实付金额: "￥29.90", 配送方式: "快递", 物流状态: "已签收" },
    customer: {},
    goods: { 单价: "29.90", 数量: 1, 实付款: "29.90", 退货数量: 1, 退货金额: "29.90" },
    timeline: [
      { t: "买家发起退款申请", lines: ["售后类型：退货退款", "申请退款金额：￥29.90", "退款原因：商品与描述不符", "退款说明：-"], at: "2026-09-17 10:05:33" },
      { t: "总部已同意售后申请，等待买家退货", lines: [], at: "2026-09-17 11:12:08" },
      { t: "退货地址已发送给买家", lines: ["寄回地址：广东省 广州市 天河区 科苑路 16 号 A 栋 1 楼退货组", "联系人：JOJO供应商（退货组）　电话：18100010002"], at: "2026-09-17 11:12:08" },
      { t: "买家已退货，待供应商签收", lines: ["退货方式：快递", "物流单号：2585"], at: "2026-09-18 10:26:47" },
      { t: "供应商已签收验收", lines: [], at: "2026-09-18 11:02:19" },
    ],
  },
  {
    no: "ORD260918000214", asNo: "R20260918260918000024", product: "什锦果蔬", spec: "礼盒装 / 6 盒", emoji: "🧺",
    way: "退货退款", ship: "暂无", qty: 1, points: 0, reason: "不想要了",
    amount: "99.00", refund: "99.00",
    at: "2026-09-18 14:30:12", timeout: "-", status: "售后关闭",
    buyerNote: "-", refundNote: "-",
    order: { 应付金额: "￥99.00", 实付金额: "￥99.00", 配送方式: "快递", 物流状态: "已签收" },
    customer: {},
    goods: { 单价: "99.00", 数量: 1, 实付款: "99.00", 退货数量: 1, 退货金额: "99.00" },
    timeline: [
      { t: "买家发起退款申请", lines: ["售后类型：退货退款", "申请退款金额：￥99.00", "退款原因：不想要了", "退款说明：-"], at: "2026-09-18 14:30:12" },
      { t: "总部已同意售后申请，等待买家退货", lines: [], at: "2026-09-18 15:02:40" },
      { t: "退货地址已发送给买家", lines: ["寄回地址：广东省 广州市 天河区 科苑路 16 号 A 栋 1 楼退货组", "联系人：JOJO供应商（退货组）　电话：18100010002"], at: "2026-09-18 15:02:40" },
      { t: "买家已退货，待供应商签收", lines: ["退货方式：快递", "物流单号：3322"], at: "2026-09-19 09:12:33" },
      { t: "供应商拒绝签收退货", lines: ["拒签原因：商品包装破损、无法二次销售"], at: "2026-09-19 09:40:15" },
      { t: "进入退货异常，待总部处理", lines: [], at: "2026-09-19 09:40:16" },
      { t: "供应商寄回商品", lines: ["退货方式：快递", "物流单号：3323"], at: "2026-09-19 09:45:02" },
      { t: "总部关闭售后", lines: ["关闭原因：认可供应商拒签，商品已寄回买家，不退款"], at: "2026-09-19 10:02:48" },
    ],
  },
  /* 状态补齐：待买家退货 / 退款异常 / 退款中 / 售后完成 */
  {
    no: "ORD260918000221", asNo: "R20260919260919000025", product: "什锦果蔬", spec: "礼盒装", emoji: "🧺",
    way: "退货退款", ship: "暂无", qty: 1, points: 0, reason: "不想要了",
    amount: "99.00", refund: "99.00",
    at: "2026-09-19 09:35:20", timeout: "-", status: "待买家退货",
    buyerNote: "-", refundNote: "-",
    order: { 应付金额: "￥99.00", 实付金额: "￥99.00", 配送方式: "快递", 物流状态: "已签收" },
    customer: {},
    goods: { 单价: "99.00", 数量: 1, 实付款: "99.00", 退货数量: 1, 退货金额: "99.00" },
    timeline: [
      { t: "买家发起退款申请", lines: ["售后类型：退货退款", "申请退款金额：￥99.00", "退款原因：不想要了", "退款说明：-"], at: "2026-09-19 09:35:20" },
      { t: "总部已同意售后申请，等待买家退货", lines: [], at: "2026-09-19 10:02:47" },
      { t: "退货地址已发送给买家", lines: ["寄回地址：广东省 广州市 天河区 科苑路 16 号 A 栋 1 楼退货组", "联系人：JOJO供应商（退货组）　电话：18100010002"], at: "2026-09-19 10:02:47" },
    ],
  },
  /* 退货退款 · 待总部审核：总部同意时随同意一起把供应商的售后地址发给买家 */
  {
    no: "ORD260918000226", asNo: "R20260920260920000028", product: "相机", spec: "银色 / 标准版", emoji: "📷",
    way: "退货退款", ship: "暂无", qty: 1, points: 0, reason: "商品与描述不符",
    amount: "189.00", refund: "189.00",
    at: "2026-09-20 10:12:36", timeout: "-", status: "待总部审核",
    buyerNote: "-", refundNote: "-",
    order: { 应付金额: "￥189.00", 实付金额: "￥189.00", 配送方式: "快递", 物流状态: "已签收" },
    customer: {},
    goods: { 单价: "189.00", 数量: 1, 实付款: "189.00", 退货数量: 1, 退货金额: "189.00" },
    timeline: [
      { t: "买家发起退款申请", lines: ["售后类型：退货退款", "申请退款金额：￥189.00", "退款原因：商品与描述不符", "退款说明：-"], at: "2026-09-20 10:12:36" },
    ],
  },
  {
    no: "ORD260918000222", asNo: "R20260919260919000026", product: "苹果", spec: "红富士 / 5 斤装", emoji: "🍎",
    way: "仅退款", ship: "暂无", qty: 1, points: 0, reason: "包裹为空",
    amount: "29.90", refund: "29.90",
    at: "2026-09-19 11:20:08", timeout: "-", status: "退款异常",
    buyerNote: "-", refundNote: "-",
    order: { 应付金额: "￥29.90", 实付金额: "￥29.90", 配送方式: "快递", 物流状态: "已签收" },
    customer: {},
    goods: { 单价: "29.90", 数量: 1, 实付款: "29.90", 退货数量: 0, 退货金额: "29.90" },
    timeline: [
      { t: "买家发起退款申请", lines: ["售后类型：仅退款", "申请退款金额：￥29.90", "退款原因：包裹为空", "退款说明：-"], at: "2026-09-19 11:20:08" },
      { t: "总部已同意售后申请", lines: [], at: "2026-09-19 11:40:15" },
      { t: "退款异常", lines: ["失败原因：买家支付账户异常，原路退款未成功", "可点击「重新退款」再次发起退款"], at: "2026-09-19 12:05:33" },
    ],
  },
  {
    no: "ORD260918000223", asNo: "R20260919260919000027", product: "什锦果蔬", spec: "礼盒装", emoji: "🧺",
    way: "仅退款", ship: "暂无", qty: 1, points: 0, reason: "拍错/多拍",
    amount: "99.00", refund: "99.00",
    at: "2026-09-19 14:08:56", timeout: "-", status: "退款中",
    buyerNote: "-", refundNote: "-",
    order: { 应付金额: "￥99.00", 实付金额: "￥99.00", 配送方式: "快递", 物流状态: "已签收" },
    customer: {},
    goods: { 单价: "99.00", 数量: 1, 实付款: "99.00", 退货数量: 0, 退货金额: "99.00" },
    timeline: [
      { t: "买家发起退款申请", lines: ["售后类型：仅退款", "申请退款金额：￥99.00", "退款原因：拍错/多拍", "退款说明：-"], at: "2026-09-19 14:08:56" },
      { t: "总部已同意售后申请", lines: [], at: "2026-09-19 14:22:03" },
      { t: "退款处理中", lines: ["退款方式：原路退回", "预计 1-3 个工作日到账"], at: "2026-09-19 14:30:11" },
    ],
  },
  {
    no: "ORD260918000224", asNo: "R20260919260919000028", product: "苹果", spec: "红富士 / 5 斤装", emoji: "🍎",
    way: "仅退款", ship: "暂无", qty: 1, points: 0, reason: "不想要了",
    amount: "29.90", refund: "29.90",
    at: "2026-09-18 09:12:40", timeout: "-", status: "售后完成",
    buyerNote: "-", refundNote: "-",
    order: { 应付金额: "￥29.90", 实付金额: "￥29.90", 配送方式: "快递", 物流状态: "已签收" },
    customer: {},
    goods: { 单价: "29.90", 数量: 1, 实付款: "29.90", 退货数量: 0, 退货金额: "29.90" },
    timeline: [
      { t: "买家发起退款申请", lines: ["售后类型：仅退款", "申请退款金额：￥29.90", "退款原因：不想要了", "退款说明：-"], at: "2026-09-18 09:12:40" },
      { t: "总部已同意售后申请", lines: [], at: "2026-09-18 09:40:02" },
      { t: "退款完成", lines: ["退款方式：原路退回", "退款金额：￥29.90"], at: "2026-09-18 10:15:27" },
      { t: "售后完成", lines: [], at: "2026-09-18 10:15:28" },
    ],
  },
  /* 退货退款 · 退货异常：供应商拒签 → 等总部裁决（退款还是关单） */
  {
    no: "ORD260918000088", asNo: "R20260921260921000029", product: "儿童保温杯", spec: "500ml / 蓝", emoji: "🥤",
    way: "退货退款", ship: "暂无", qty: 1, points: 0, reason: "商品破损",
    amount: "89.00", refund: "89.00",
    at: "2026-09-21 09:18:20", timeout: "-", status: "退货异常",
    buyerNote: "-", refundNote: "-",
    order: { 应付金额: "￥89.00", 实付金额: "￥89.00", 配送方式: "快递", 物流状态: "已签收" },
    customer: {},
    goods: { 单价: "89.00", 数量: 1, 实付款: "89.00", 退货数量: 1, 退货金额: "89.00" },
    timeline: [
      { t: "买家发起退款申请", lines: ["售后类型：退货退款", "申请退款金额：￥89.00", "退款原因：商品破损", "退款说明：-"], at: "2026-09-21 09:18:20" },
      { t: "总部已同意售后申请，等待买家退货", lines: [], at: "2026-09-21 09:40:05" },
      { t: "退货地址已发送给买家", lines: ["寄回地址：广东省 广州市 天河区 科苑路 16 号 A 栋 1 楼退货组", "联系人：JOJO供应商（退货组）　电话：18100010002"], at: "2026-09-21 09:40:05" },
      { t: "买家已退货，待供应商签收", lines: ["退货方式：快递", "物流单号：SF7712003999"], at: "2026-09-22 14:05:11" },
      { t: "供应商拒绝签收退货", lines: ["拒签原因：退回商品为其他型号，与订单不符"], at: "2026-09-22 15:30:44" },
      { t: "进入退货异常，待总部处理", lines: ["待总部裁决：认可拒签并关闭售后，或仍向买家退款"], at: "2026-09-22 15:30:45" },
    ],
  },
];
