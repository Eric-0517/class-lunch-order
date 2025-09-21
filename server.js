const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const app = express();

const PORT = process.env.PORT || 3000;

// -------------------- MongoDB 設定 --------------------
const MONGO_URI = "mongodb+srv://admin:aa980517@cluster0.1yktzwj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(()=>console.log("✅ MongoDB connected"))
  .catch(err=>console.error("MongoDB connection error:", err));

// 訂單 Schema
const orderSchema = new mongoose.Schema({
  seat: String,
  items: Array,
  createdAt: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', orderSchema);

// 送單模式 Schema
const orderModeSchema = new mongoose.Schema({
  open: { type: Boolean, default: false },
  scheduleEnabled: { type: Boolean, default: false },
  scheduleDate: String,  // yyyy-mm-dd
  scheduleTime: String   // HH:mm
});
const OrderMode = mongoose.model('OrderMode', orderModeSchema);

// -------------------- 基本設定 --------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const ADMIN_USER = "admin";
const ADMIN_PASS = "12345678";

let autoCloseTimer = null;

// -------------------- 訂單相關 --------------------

// POST /api/order - 接收訂單
app.post('/api/order', async (req, res) => {
  try {
    const mode = await OrderMode.findOne();
    if(!mode || !mode.open) return res.status(403).json({success:false,message:"目前不開放送單"});

    const { seat, items } = req.body;
    if (!seat || !items) return res.status(400).json({ success: false, message: '座號或訂單資料缺失' });

    const order = new Order({ seat, items });
    await order.save();

    res.json({ success: true, message: '訂單已送出，請至歷史訂單頁面確認！' });
  } catch (err) {
    res.status(500).json({ success: false, message: '伺服器錯誤', error: err.message });
  }
});

// GET /api/orders - 查看全部訂單
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find();
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/orders - 刪除指定座號訂單
app.delete('/api/orders', async (req, res) => {
  try {
    const { seat } = req.body;
    if (!seat) return res.status(400).json({ success: false, message: "缺少座號" });
    await Order.deleteMany({ seat });
    res.json({ success: true, message: `已刪除座號 ${seat} 的訂單` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/orders/all - 刪除全部訂單
app.delete('/api/orders/all', async (req, res) => {
  try {
    await Order.deleteMany();
    res.json({ success: true, message: "已刪除全部訂單" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// -------------------- 管理員相關 --------------------
app.post('/api/admin/login', (req, res) => {
  const { user, pass } = req.body;
  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    res.json({ success: true, message: "登入成功" });
  } else {
    res.status(401).json({ success: false, message: "帳號或密碼錯誤" });
  }
});

// -------------------- 送單模式 --------------------

// 取得送單模式
app.get('/api/orderMode', async (req, res) => {
  try {
    let mode = await OrderMode.findOne();
    if (!mode) {
      mode = new OrderMode();
      await mode.save();
    }
    res.json({ success: true, data: mode });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 修改送單模式 (手動 + 定時)
app.post('/api/orderMode', async (req, res) => {
  try {
    const { open, scheduleEnabled, scheduleDate, scheduleTime } = req.body;

    let mode = await OrderMode.findOne();
    if (!mode) mode = new OrderMode();

    mode.open = !!open;
    mode.scheduleEnabled = !!scheduleEnabled;
    mode.scheduleDate = scheduleDate || "";
    mode.scheduleTime = scheduleTime || "";
    await mode.save();

    res.json({ success: true, message: "送單設定已儲存" });

    // 設定自動關閉
    if (scheduleEnabled && scheduleDate && scheduleTime && open) {
      setupAutoClose(scheduleDate, scheduleTime);
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 強制關閉送單
app.post('/api/orderMode/close', async (req, res) => {
  try {
    let mode = await OrderMode.findOne();
    if (!mode) mode = new OrderMode();
    mode.open = false;
    await mode.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// -------------------- 自動關閉送單 --------------------
function setupAutoClose(dateStr, timeStr){
  if(autoCloseTimer) clearTimeout(autoCloseTimer);

  const [hours, minutes] = timeStr.split(":").map(Number);
  const target = new Date(dateStr);
  target.setHours(hours, minutes, 0, 0);

  const delay = target - new Date();
  if(delay <= 0){
    OrderMode.findOneAndUpdate({}, { open: false });
    return;
  }

  autoCloseTimer = setTimeout(async ()=>{
    await OrderMode.findOneAndUpdate({}, { open: false });
    console.log("⏰ 自動關閉送單");
  }, delay);
}

// -------------------- 啟動伺服器 --------------------
app.listen(PORT, async () => {
  console.log(`✅ Server running on port ${PORT}`);

  // 伺服器啟動時檢查定時送單
  const mode = await OrderMode.findOne();
  if(mode && mode.scheduleEnabled && mode.scheduleDate && mode.scheduleTime && mode.open){
    setupAutoClose(mode.scheduleDate, mode.scheduleTime);
  }
});
