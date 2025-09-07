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

// === 新增：送單模式設定 ===
let systemConfig = {
  isOpen: true, // true=開放，false=未開放
  closeAt: null // Date 物件，時間到自動關閉
};

// POST /api/order - 接收訂單
app.post('/api/order', (req, res) => {
  try {
    // 先檢查系統狀態
    if (!systemConfig.isOpen) {
      return res.status(403).json({ success: false, message: "系統未開放送單或時間到自動關閉系統！詳情聯繫：s11316021@fsvs.khc.edu.tw" });
    }
    if (systemConfig.closeAt && new Date() >= new Date(systemConfig.closeAt)) {
      systemConfig.isOpen = false;
      return res.status(403).json({ success: false, message: "系統未開放送單或時間到自動關閉系統！詳情聯繫：s11316021@fsvs.khc.edu.tw" });
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

// POST /api/admin/login - 管理員登入
app.post('/api/admin/login', (req, res) => {
  const { user, pass } = req.body;
  if (user === ADMIN_USER && pass === ADMIN_PASS) {
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

// === 新增：查詢 / 設定 系統狀態 API ===

// 查詢狀態
app.get('/api/system/status', (req, res) => {
  // 如果設定了時間，但已過期，直接更新狀態為關閉
  if (systemConfig.closeAt && new Date() >= new Date(systemConfig.closeAt)) {
    systemConfig.isOpen = false;
  }
  res.json({ success: true, data: systemConfig });
});

// 設定狀態（管理用）
app.post('/api/system/status', (req, res) => {
  const { isOpen, closeAt } = req.body;
  if (typeof isOpen === "boolean") systemConfig.isOpen = isOpen;
  if (closeAt) systemConfig.closeAt = new Date(closeAt);
  res.json({ success: true, message: "系統狀態已更新", data: systemConfig });
});

// 啟動伺服器
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
