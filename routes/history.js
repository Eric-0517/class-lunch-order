// server/routes/history.js
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// 查詢歷史訂單
router.get('/', async (req, res) => {
  const seat = req.query.seat;
  if (!seat) return res.json({ success: false, message: "請選擇座號" });

  try {
    const orders = await Order.find({ seat: Number(seat) }).sort({ createdAt: -1 });
    if (orders.length === 0) return res.json({ success: false, message: "無資料或已刪除" });

    res.json({ success: true, orders });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: err.message });
  }
});

module.exports = router;
