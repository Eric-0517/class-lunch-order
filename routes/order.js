const express = require("express");
const router = express.Router();
const Order = require("../models/Order");

// 新增訂單
router.post("/", async (req, res) => {
  const { seatNumber, items, total } = req.body;

  if (!seatNumber || !items || items.length === 0) {
    return res.status(400).json({ success: false, message: "所有欄位必填" });
  }

  const order = new Order({
    seatNumber,
    date: new Date().toISOString().split("T")[0],
    items,
    total
  });

  try {
    await order.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 查詢歷史訂單
router.get("/:seatNumber", async (req, res) => {
  const seat = req.params.seatNumber;
  try {
    const orders = await Order.find({ seatNumber: seat });
    if (orders.length === 0) return res.status(404).json({ success: false, message: "無資料或已刪除" });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
