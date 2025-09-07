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

// 模擬管理員帳密（可設置兩組）
const ADMINS = [
  { user: "admin", pass: "12345678" },
  { user: "manager", pass: "87654321" }
];

// 系統訂購設定
let orderSystem = {
  isOpen: true,           // true: 開放訂購, false: 關閉訂購
  closeTime: null         // 自動關閉時間
};

// 自動檢查是否到關閉時間
function checkAutoClose() {
  if (orderSystem.closeTime && new Date() >= orderSystem.closeTime) {
    orderSystem.isOpen = false;
  }
}
setInterval(checkAutoClose, 60 * 1000); // 每分鐘檢查

// ================== API ==================

// POST /api/order - 接收訂單
app.post('/api/order', (req, res) => {
  if (!orderSystem.isOpen) {
    return res.status(403).json({ success: false, message: '訂購系統已關閉！' });
  }

  try {
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

// POST /api/admin/login - 管理員登入
app.post('/api/admin/login', (req, res) => {
  const { user, pass } = req.body;
  const admin = ADMINS.find(a => a.user === user && a.pass === pass);
  if (admin) {
    res.json({ success: true, message: "登入成功" });
  } else {
    res.status(401).json({ success: false, message: "帳號或密碼錯誤" });
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

// GET /api/system-status - 取得系統訂購狀態
app.get('/api/system-status', (req, res) => {
  res.json({ success: true, isOpen: orderSystem.isOpen, closeTime: orderSystem.closeTime });
});

// POST /api/system-status - 管理員設定系統開放或關閉時間
app.post('/api/system-status', (req, res) => {
  const { isOpen, closeTime } = req.body;
  if (typeof isOpen === "boolean") orderSystem.isOpen = isOpen;
  if (closeTime) orderSystem.closeTime = new Date(closeTime);
  res.json({ success: true, message: "系統狀態已更新", orderSystem });
});

// 啟動伺服器
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
