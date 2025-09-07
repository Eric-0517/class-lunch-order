const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;

// 解析 JSON 與表單
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 靜態檔案
app.use(express.static(path.join(__dirname, 'public')));

// 訂單暫存（測試用）
let orders = [];

// 模擬管理員帳密
const ADMIN_USER = "admin";
const ADMIN_PASS = "12345678";

// 送單模式（true = 開放, false = 未開放）
let orderMode = { open: false };

// -------------------- 訂單相關 --------------------

// POST /api/order - 接收訂單
app.post('/api/order', (req, res) => {
  try {
    if (!orderMode.open) {
      // 後端保護層，禁止送單
      return res.status(403).json({ success: false, message: "系統未開放送單！" });
    }

    const { seat, items } = req.body;
    if (!seat || !items) {
      return res.status(400).json({ success: false, message: '座號或訂單資料缺失' });
    }

    orders.push({ seat, items, createdAt: new Date() });
    res.json({ success: true, message: '訂單已送出，請至歷史訂單頁面確認！' });
  } catch (err) {
    res.status(500).json({ success: false, message: '伺服器錯誤', error: err.message });
  }
});

// GET /api/orders - 查看全部訂單
app.get('/api/orders', (req, res) => {
  res.json({ success: true, data: orders });
});

// DELETE /api/orders - 刪除指定座號訂單
app.delete('/api/orders', (req, res) => {
  const { seat } = req.body;
  if (!seat) return res.status(400).json({ success: false, message: "缺少座號" });
  orders = orders.filter(o => o.seat !== seat);
  res.json({ success: true, message: `已刪除座號 ${seat} 的訂單` });
});

// DELETE /api/orders/all - 刪除全部訂單
app.delete('/api/orders/all', (req, res) => {
  orders = [];
  res.json({ success: true, message: "已刪除全部訂單" });
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

// GET /api/orderMode - 取得送單狀態
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
