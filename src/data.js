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
export const SHIP_MODES = ["供应商直配", "总部仓直配", "总部自营"];

/* ---------------- 商品管理 ---------------- */
const g = (emoji, bg) => ({ emoji, bg });
export const PRODUCTS = [
  { id: "p1", name: "什锦果蔬", vid: "共(1)个", intro: true, no: "3424", stock: 795, purchase: "10.00", sale: "0.01~3.00", freight: "未设置", status: "在售中", supplier: "供应商003", shipMode: "供应商直配" },
  { id: "p2", name: "华为手机", vid: "共(0)个", intro: true, no: "-", stock: 294, purchase: "0.00", sale: "0.01~2.00", freight: "已设置", status: "在售中", supplier: "JOJO供应商", shipMode: "总部仓直配", customCat: "精选数码" },
  { id: "p3", name: "华为手机(复制)", vid: "共(0)个", intro: true, no: "_CP7784", stock: 292, purchase: "0.00", sale: "0.01", freight: "未设置", status: "已下架", supplier: "JOJO供应商", shipMode: "总部仓直配" },
  { id: "p4", name: "苹果", vid: "共(0)个", intro: true, no: "23", stock: 200, purchase: "10.00", sale: "0.01~1.00", freight: "未设置", status: "在售中", supplier: "供应商002", shipMode: "供应商直配", customCat: "时令鲜果" },
  { id: "p5", name: "奶粉(复制)", vid: "共(1)个", intro: true, no: "_CP5374", stock: 115, purchase: "0.00", sale: "0.01", freight: "未设置", status: "在售中", supplier: "供应商001", shipMode: "总部仓直配" },
  { id: "p6", name: "奶粉", vid: "共(1)个", intro: true, no: "_CP6353", stock: 115, purchase: "0.00", sale: "0.01", freight: "未设置", status: "审核中", supplier: "", shipMode: "" },
  { id: "p7", name: "山茶油", vid: "共(0)个", intro: false, no: "-", stock: 0, purchase: "68.00", sale: "128.00", freight: "未设置", status: "审核不通过", supplier: "供应商001", shipMode: "总部仓直配" },
  /* 总部自营（自有货）：不经供应商，总部仓直接发货 */
  { id: "p8", name: "儿童书包", vid: "共(1)个", intro: true, no: "_CP8811", stock: 120, purchase: "—", sale: "129.00", freight: "已设置", status: "在售中", supplier: "", shipMode: "总部自营" },
  { id: "p9", name: "保温饭盒", vid: "共(1)个", intro: true, no: "_CP8812", stock: 86, purchase: "—", sale: "99.00", freight: "已设置", status: "在售中", supplier: "", shipMode: "总部自营" },
  { id: "p10", name: "文具套装", vid: "共(1)个", intro: false, no: "_CP8813", stock: 240, purchase: "—", sale: "59.00", freight: "未设置", status: "在售中", supplier: "", shipMode: "总部自营" },
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
    supplyNo: "FHD2609180009", supplyMode: "总部仓直配",
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
    supplyNo: "FHD2609170004", supplyMode: "总部仓直配", shipBlock: "待总部仓收货",
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
  /* F3 两段链路配套订单：总部仓直配，须等总仓收到上游货后才可发货 */
  {
    id: "o7", no: "ORD260918000033", product: "儿童绘本套装", spec: "全 8 册", qty: 9, unitPrice: "¥0.01", emoji: "📚",
    afterSale: "暂无售后",
    amounts: { 商品金额: "0.09", 邮费: "-", 优惠金额: "-", 积分抵现: "-", 应收金额: "0.09", 实收金额: "0.09" },
    buyer: { 昵称: "小绘本", 收件人: "陈女士", 收件人电话: "13800001234", 收件人地址: "广东省广州市天河区体育西路 100 号" },
    store: "九天门店", delivery: "快递发货", createdAt: "2026-09-18 10:12:00", status: "待发货",
    payMethod: "微信支付", payTime: "2026-09-18 10:12:05", ops: ["发货", "备注", "修改地址", "分配门店"],
    supplyNo: "FHD2609180006", supplyMode: "总部仓直配",
    shipBlock: "待总部仓收货",
  },
  /* 一件代发·已发货：供应商已直发消费者（代发单发货+售后均归供应商，租户后台不展示该类订单） */
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
  /* 状态补齐：售后中订单（对应售后管理 ② 号单「待商家退款」，订单挂起） */
  {
    id: "o12", no: "ORD260917000147", product: "华为手机", spec: "蓝色/M", qty: 1, unitPrice: "¥1.00", emoji: "📱",
    afterSale: "售后处理中", afterSaleLink: "查看",
    amounts: { 商品金额: "1.00", 邮费: "-", 优惠金额: "-", 积分抵现: "-", 应收金额: "1.00", 实收金额: "1.00" },
    buyer: { 昵称: "九九", 收件人: "T1", 收件人电话: "13911112217", 收件人地址: "重庆市重庆郊县丰都县董家镇测试" },
    store: "9071门店", delivery: "快递发货", createdAt: "2026-09-17 17:44:22", status: "售后中",
    payMethod: "微信支付", payTime: "2026-09-17 17:44:24", ops: ["详情", "备注", "分配门店"],
    carrier: "顺丰速运", tracking: "SF7712003621", track: "已签收 2026-09-17 20:10:00",
    supplyNo: "", supplyMode: "总部仓直配",
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
  /* 货源拓展：总部自营订单（货在总部仓、无供应商前置，支付后总部直接发货） */
  {
    id: "o16", no: "ORD260919000101", product: "儿童书包", spec: "蓝色 / 大号", qty: 1, unitPrice: "¥129.00", emoji: "🎒",
    afterSale: "暂无售后",
    amounts: { 商品金额: "129.00", 邮费: "0", 优惠金额: "-", 积分抵现: "-", 应收金额: "129.00", 实收金额: "129.00" },
    buyer: { 昵称: "何小北", 收件人: "何小北", 收件人电话: "13800001111", 收件人地址: "广东省广州市天河区体育西路 108 号" },
    store: "九天门店", delivery: "快递发货", createdAt: "2026-09-19 10:12:00", status: "待发货",
    payMethod: "微信支付", payTime: "2026-09-19 10:12:05", ops: ["详情", "备注", "分配门店"],
    supplyNo: "", supplyMode: "总部自营",
  },
  {
    id: "o17", no: "ORD260918000103", product: "保温饭盒", spec: "米白 / 双层", qty: 2, unitPrice: "¥99.00", emoji: "🍱",
    afterSale: "暂无售后",
    amounts: { 商品金额: "198.00", 邮费: "0", 优惠金额: "-10.00", 积分抵现: "-", 应收金额: "188.00", 实收金额: "188.00" },
    buyer: { 昵称: "林小满", 收件人: "林小满", 收件人电话: "13822223333", 收件人地址: "浙江省杭州市西湖区文一西路 200 号" },
    store: "九天门店", delivery: "快递发货", createdAt: "2026-09-18 09:40:31", status: "已发货",
    payMethod: "微信支付", payTime: "2026-09-18 09:40:35", ops: ["详情", "备注", "分配门店"],
    carrier: "顺丰速运", tracking: "SF7712003520", track: "已发货 2026-09-18 15:00:00",
    supplyNo: "", supplyMode: "总部自营",
  },
  {
    id: "o18", no: "ORD260915000102", product: "文具套装", spec: "12 件套 / 基础版", qty: 1, unitPrice: "¥59.00", emoji: "✏️",
    afterSale: "暂无售后",
    amounts: { 商品金额: "59.00", 邮费: "0", 优惠金额: "-", 积分抵现: "-", 应收金额: "59.00", 实收金额: "59.00" },
    buyer: { 昵称: "周小野", 收件人: "周小野", 收件人电话: "13844445555", 收件人地址: "北京市朝阳区望京街道阜通东大街 6 号" },
    store: "九天门店", delivery: "快递发货", createdAt: "2026-09-15 14:22:18", status: "已完成",
    payMethod: "微信支付", payTime: "2026-09-15 14:22:21", ops: ["详情", "备注", "分配门店"],
    supplyNo: "", supplyMode: "总部自营",
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
];

/* 供应商后台菜单（照业务规则 §2.3 供应商侧菜单） */
export const SUPPLIER_MENU = [
  { ico: "🕘", label: "版本记录", isNew: true },
  { ico: "🗺", label: "业务流程图", isNew: true },
  { ico: "📋", label: "场景清单" },
  { ico: "⇄", label: "供货", isNew: true, children: ["一件代发", "发总部仓", "发门店", "配送差异", "售后处理", "退货返厂"] },
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
    id: "FHD2609150001", leg: "supplier_inbound", source: "订单支付自动生成", createdAt: "2026-09-15 10:00:00",
    orderNo: "ORD260915000077", product: "苹果", spec: "红富士 / 5 斤装", emoji: "🍎", qty: 2, sent: 2,
    shipper: "供应商002", receiver: "9071门店", receiverAddr: "辽宁省铁岭市银州区工人街 28 号",
    carrier: "圆通速递", tracking: "YT5598712401", track: "已签收 2026-09-19 09:30:00", status: "已发货", ops: ["详情", "收货"],
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
];

// 累计实收（只增不减）：默认已收货=收齐，部分收货/收货异常单独标
SUPPLY_DOCS.forEach((d) => { if (d.received === undefined) d.received = d.status === "已收货" ? d.qty : 0; });
SUPPLY_DOCS.find((d) => d.id === "FHD2609160008").received = 4; // 部分收货
SUPPLY_DOCS.find((d) => d.id === "FHD2609160009").received = 3; // 收货异常
SUPPLY_DOCS.find((d) => d.id === "FHD2609120002").received = 4; // 收货异常（差异单来源）
SUPPLY_DOCS.find((d) => d.id === "FHD2609140003").received = 8; // 收货异常（差异单来源）

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
    carrier: "顺丰速运", tracking: "SF7712003610", track: "已发货 2026-09-18 18:20:00", status: "已发货", isMakeup: true, reshipOf: "DIFF2609170003", ops: ["详情", "收货"],
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


/* 配送差异单（双来源，审核均由总部执行） */
export const DIFFS = [
  { id: "DIFF2609170003", source: "总部上报", leg: "供应商 → 总仓", reporter: "总部", supplyNo: "FHD2609160009", shipper: "供应商003", summary: "什锦果蔬 应收4/实收3 差1", diffQty: 1, status: "补发中", evidence: "少货 · 照片 2 张", makeup: "FHD2609180013" },
  { id: "DIFF2609170001", source: "门店上报", leg: "总仓 → 门店", reporter: "门店", supplyNo: "FHD2609180007", shipper: "九天教育总仓", summary: "画板套装 应收2/实收0 差2", diffQty: 2, status: "待举证", evidence: "—" },
  { id: "DIFF2609170002", source: "门店上报", leg: "总仓 → 门店", reporter: "门店", supplyNo: "FHD2609120002", shipper: "九天教育总仓", summary: "什锦果蔬 应收5/实收4 差1", diffQty: 1, status: "待总部审核", evidence: "少货 · 照片 1 张" },
  { id: "DIFF2609170004", source: "门店上报", leg: "总仓 → 门店", reporter: "门店", supplyNo: "FHD2609140003", shipper: "九天教育总仓", summary: "儿童绘本套装 应收9/实收8 差1", diffQty: 1, status: "补发中", evidence: "少货 · 照片 3 张", makeup: "FHD2609170907" },
  { id: "DIFF2609170005", source: "门店上报", leg: "供应商 → 门店", reporter: "门店", supplyNo: "FHD2609170018", shipper: "供应商002", summary: "相机 应收3/实收2 差1", diffQty: 1, status: "待举证", evidence: "—" },
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
