const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const session = require("express-session");
const app = express();

const PORT = process.env.PORT || 3000;

// -------------------- MongoDB 設定 --------------------
const MONGO_URI = "mongodb+srv://admin:aa980517@cluster0.1yktzwj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(()=>console.log("✅ MongoDB connected"))
  .catch(err=>console.error("MongoDB connection error:", err));

// -------------------- Schema --------------------
const orderSchema = new mongoose.Schema({
  seat: String,
  items: Array, // [{ typeName: "正圓A", qty: 1 }]
  createdAt: { type: Date, default: Date.now }
});
const Order = mongoose.model("Order", orderSchema);

const orderModeSchema = new mongoose.Schema({
  open: { type: Boolean, default: false },
  scheduleEnabled: { type: Boolean, default: false },
  scheduleDate: String,
  scheduleTime: String
});
const OrderMode = mongoose.model("OrderMode", orderModeSchema);

// -------------------- Middleware --------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: "secretKey",
  resave: false,
  saveUninitialized: true,
}));
app.use(express.static(path.join(__dirname, "public")));

// -------------------- 管理員帳密 --------------------
const ADMIN = { username: "admin", password: "12345678" };

// -------------------- 品項單價 --------------------
const ITEM_PRICES = {
  "正圓A": 70,
  "正圓B": 70,
  "御饌A": 70,
  "御饌B": 70,
  "悅馨": 70,
  "今日不訂購": 0
};

// -------------------- 訂單 API --------------------
app.post("/api/order", async (req,res)=>{
  const { seat, items } = req.body;
  if(!seat || !items) return res.status(400).json({ success:false, message:"座號或訂單資料缺失" });
  const order = new Order({ seat, items });
  await order.save();
  res.json({ success:true, message:"訂單已送出" });
});

app.get("/api/orders", async (req,res)=>{
  const orders = await Order.find();
  res.json({ success:true, data: orders });
});

app.delete("/api/orders", async (req,res)=>{
  const { seat } = req.body;
  if(!seat) return res.status(400).json({ success:false, message:"缺少座號" });
  await Order.deleteMany({ seat });
  res.json({ success:true, message:`已刪除座號 ${seat} 的訂單` });
});

app.delete("/api/orders/all", async (req,res)=>{
  await Order.deleteMany();
  res.json({ success:true, message:"已刪除全部訂單" });
});

// -------------------- 訂單統計 --------------------
app.get("/api/orders/stats", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });

    // 所有訂單統計
    const allOrders = orders.map(o => {
      let total = 0;
      const itemsDetail = o.items.map(i => {
        const price = ITEM_PRICES[i.typeName] || 0;
        total += price * i.qty;
        return { ...i, price };
      });
      return {
        id: o._id,
        createdAt: o.createdAt,
        seat: o.seat,
        items: itemsDetail,
        total
      };
    });

    // 每日訂單統計 (星期一 ~ 星期五)
    const dailyOrdersMap = {};
    orders.forEach(o => {
      const dateStr = o.createdAt.toISOString().split("T")[0];
      if(!dailyOrdersMap[dateStr]) dailyOrdersMap[dateStr] = {
        date: dateStr,
        "正圓A":0, "正圓B":0, "御饌A":0, "御饌B":0, "悅馨":0, "今日不訂購":0,
        total: 0
      };
      o.items.forEach(i=>{
        dailyOrdersMap[dateStr][i.typeName] = (dailyOrdersMap[dateStr][i.typeName] || 0) + i.qty;
        dailyOrdersMap[dateStr].total += (ITEM_PRICES[i.typeName]||0) * i.qty;
      });
    });

    const dailyOrders = Object.values(dailyOrdersMap);

    res.json({ success:true, allOrders, dailyOrders });

  } catch(err){
    res.status(500).json({ success:false, message: err.message });
  }
});

// -------------------- 管理員登入 --------------------
app.post("/api/admin/login", (req,res)=>{
  const username = req.body?.username || "";
  const password = req.body?.password || "";
  if(username===ADMIN.username && password===ADMIN.password){
    req.session.admin = true;
    return res.json({ success:true });
  }
  return res.json({ success:false, message:"帳號或密碼錯誤" });
});

// -------------------- 送單模式 --------------------
let autoCloseTimer = null;

app.get("/api/orderMode", async (req,res)=>{
  try {
    let mode = await OrderMode.findOne();
    if(!mode){
      mode = new OrderMode();
      await mode.save();
    }
    res.json({ success:true, data: mode });
  } catch(err){
    res.status(500).json({ success:false, message: err.message });
  }
});

app.post("/api/orderMode", async (req,res)=>{
  try {
    const { open, scheduleEnabled, scheduleDate, scheduleTime } = req.body;
    let mode = await OrderMode.findOne();
    if(!mode) mode = new OrderMode();
    mode.open = !!open;
    mode.scheduleEnabled = !!scheduleEnabled;
    mode.scheduleDate = scheduleDate || "";
    mode.scheduleTime = scheduleTime || "";
    await mode.save();

    res.json({ success:true, message:"送單設定已儲存" });

    // 設定自動關閉
    if(scheduleEnabled && scheduleDate && scheduleTime){
      setupAutoClose(scheduleDate, scheduleTime);
    }
  } catch(err){
    res.status(500).json({ success:false, message: err.message });
  }
});

app.post("/api/orderMode/close", async (req,res)=>{
  try{
    let mode = await OrderMode.findOne();
    if(!mode) mode = new OrderMode();
    mode.open = false;
    await mode.save();
    res.json({ success:true });
  } catch(err){
    res.status(500).json({ success:false, message: err.message });
  }
});

// -------------------- 自動關閉函式 --------------------
function setupAutoClose(dateStr, timeStr){
  if(autoCloseTimer) clearTimeout(autoCloseTimer);
  const [hours, minutes] = timeStr.split(":").map(Number);
  const target = new Date(dateStr);
  target.setHours(hours, minutes, 0, 0);
  const delay = target - new Date();
  if(delay <= 0){
    OrderMode.findOneAndUpdate({}, { open:false });
    return;
  }
  autoCloseTimer = setTimeout(async ()=>{
    await OrderMode.findOneAndUpdate({}, { open:false });
    console.log("⏰ 自動關閉送單");
  }, delay);
}

// -------------------- 啟動伺服器 --------------------
app.listen(PORT, ()=>console.log(`✅ Server running on port ${PORT}`));
