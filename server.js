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

// POST /api/order - 接收訂單
app.post('/api/order', (req, res) => {
  try {
    const { seat, items } = req.body;
    if (!seat || !items) {
      return res.status(400).json({ success: false, message: '座號或訂單資料缺失' });
    }

    // 將每個 item 加入 day
    const itemsWithDay = items.map((item, index) => ({
      typeName: item.typeName,
      quantity: item.quantity || 1,
      day: ["禮拜一","禮拜二","禮拜三","禮拜四","禮拜五"][index]
    }));

    orders.push({ seat, items: itemsWithDay, createdAt: new Date() });
    res.json({ success: true, message: '訂單已送出' });
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
  if (!seat) return res.status(400).json({ success: false, message: '請提供座號' });
  orders = orders.filter(o => o.seat !== seat);
  res.json({ success: true, message: '已刪除該座號訂單' });
});

// DELETE /api/orders/all - 刪除全部訂單
app.delete('/api/orders/all', (req, res) => {
  orders = [];
  res.json({ success: true, message: '全部訂單已刪除' });
});

// 啟動伺服器
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
