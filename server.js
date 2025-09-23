const express = require('express');
const path = require('path');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB 設定
const MONGO_URL = "mongodb+srv://admin:aa980517@cluster0.1yktzwj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"; // ⚠️ 請改成你的 MongoDB 連線字串
const DB_NAME = "bentoSystem";
let db;

// 連線 MongoDB
MongoClient.connect(MONGO_URL)
  .then(client => {
    db = client.db(DB_NAME);
    console.log("✅ 已連線 MongoDB");
  })
  .catch(err => console.error("❌ MongoDB 連線失敗:", err));

// 解析 JSON 與表單
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 靜態檔案
app.use(express.static(path.join(__dirname, 'public')));

// 管理員帳密
const ADMIN_USER = "admin";
const ADMIN_PASS = "12345678";

// 送單模式（true = 開放, false = 未開放）
let orderMode = { open: false };

// -------------------- 訂單相關 --------------------

// POST /api/order - 接收訂單
app.post('/api/order', async (req, res) => {
  try {
    const { seat, items } = req.body;
    if (!seat || !items) {
      return res.status(400).json({ success: false, message: '座號或訂單資料缺失' });
    }

    await db.collection("orders").insertOne({ seat, items, createdAt: new Date() });
    res.json({ success: true, message: '訂單已送出，請至歷史訂單頁面確認！' });
  } catch (err) {
    res.status(500).json({ success: false, message: '伺服器錯誤', error: err.message });
  }
});

// GET /api/orders - 查看全部訂單
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await db.collection("orders").find().toArray();
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: "讀取訂單失敗", error: err.message });
  }
});

// DELETE /api/orders - 刪除指定座號訂單
app.delete('/api/orders', async (req, res) => {
  try {
    const { seat } = req.body;
    if (!seat) return res.status(400).json({ success: false, message: "缺少座號" });

    await db.collection("orders").deleteMany({ seat });
    res.json({ success: true, message: `已刪除座號 ${seat} 的訂單` });
  } catch (err) {
    res.status(500).json({ success: false, message: "刪除失敗", error: err.message });
  }
});

// DELETE /api/orders/all - 刪除全部訂單
app.delete('/api/orders/all', async (req, res) => {
  try {
    await db.collection("orders").deleteMany({});
    res.json({ success: true, message: "已刪除全部訂單" });
  } catch (err) {
    res.status(500).json({ success: false, message: "刪除全部訂單失敗", error: err.message });
  }
});

// -------------------- 管理員相關 --------------------

// POST /api/admin/login - 管理員登入
app.post('/api/admin/login', (req, res) => {
  const { user, pass } = req.body;
  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    res.json({ success: true, message: "登入成功" });
  } else {
    res.status(401).json({ success: false, message: "帳號或密碼錯誤" });
  }
});

// -------------------- 送單開放狀態 --------------------

// GET /api/orderMode - 取得送單狀態（前端用於按鈕顏色）
app.get('/api/orderMode', (req, res) => {
  res.json({ success: true, data: orderMode });
});

// POST /api/orderMode - 修改送單狀態 (管理端)
app.post('/api/orderMode', (req, res) => {
  const { open } = req.body;
  if (typeof open !== "boolean") {
    return res.status(400).json({ success: false, message: "請傳 boolean" });
  }
  orderMode.open = open;
  res.json({ success: true, message: `送單狀態已更新為 ${open ? '開放' : '未開放'}` });
});

// -------------------- 啟動伺服器 --------------------
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
