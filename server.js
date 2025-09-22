const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

let orders = []; // 存放所有訂單

// 新增訂單
app.post("/api/order", (req, res) => {
  const { weekDay, seat, item, quantity, total } = req.body;
  const timestamp = new Date().toISOString();

  const order = { timestamp, weekDay, seat, item, quantity, total };
  orders.push(order);

  res.json({ success: true, order });
});

// 取得所有訂單
app.get("/api/orders", (req, res) => {
  res.json(orders);
});

// 取得每日訂單統計
app.get("/api/daily-summary", (req, res) => {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  let summary = {};
  days.forEach((day) => {
    summary[day] = {
      正圓A: 0,
      正圓B: 0,
      御饌A: 0,
      御饌B: 0,
      悅馨: 0,
      今日不訂購: 0,
      總金額: 0,
    };
  });

  orders.forEach((order) => {
    if (summary[order.weekDay]) {
      if (summary[order.weekDay][order.item] !== undefined) {
        summary[order.weekDay][order.item] += order.quantity;
      }
      summary[order.weekDay].總金額 += order.total;
    }
  });

  res.json(summary);
});

// 刪除訂單
app.delete("/api/order/:timestamp", (req, res) => {
  const { timestamp } = req.params;
  orders = orders.filter((order) => order.timestamp !== timestamp);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
