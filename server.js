const express = require('express'); 
const path = require('path');
const app = express();

// Render 會提供 PORT 環境變數，沒有的話預設用 3000
const PORT = process.env.PORT || 3000;

// 解析 JSON
app.use(express.json());

// 靜態檔案
app.use(express.static(path.join(__dirname, 'public')));

// 訂單暫存（測試用，重啟會消失）
let orders = [];

// POST /api/order - 接收訂單
app.post('/api/order', (req, res) => {
  const { seat, items } = req.body;
  if (!seat || !items) {
    return res.status(400).json({ success: false, message: '座號或訂單資料缺失' });
  }

  orders.push({ seat, items, createdAt: new Date() });
  res.json({ success: true, message: '訂單已送出' });
});

// GET /api/orders - 查看全部訂單（測試用）
app.get('/api/orders', (req, res) => {
  res.json({ success: true, data: orders });
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
