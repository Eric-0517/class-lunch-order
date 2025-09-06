const express = require("express");
const router = express.Router();

// 驗證 session 中是否為管理員
function isAdmin(req,res,next){
  if(req.session && req.session.admin) return next();
  return res.status(401).json({success:false,message:"請先登入"});
}

// 登入 API
router.post("/login", (req,res)=>{
  const {username,password}=req.body;
  if(username===process.env.ADMIN_USERNAME && password===process.env.ADMIN_PASSWORD){
    req.session.admin = true; // 設置 session
    return res.json({success:true});
  }
  return res.json({success:false,message:"管理員帳密錯誤！"});
});

// 登出 API
router.post("/logout", isAdmin, (req,res)=>{
  req.session.destroy(err=>{
    if(err) return res.json({success:false,message:"登出失敗"});
    return res.json({success:true});
  });
});

// 設定便當價格（需登入）
router.post("/setPrice", isAdmin, (req,res)=>{
  const {type,price} = req.body;
  // 這裡寫入 DB
  // Price.updateOne({type},{price},{upsert:true})...
  res.json({success:true});
});

// 取得每日統計（需登入）
router.get("/stats/:date", isAdmin, (req,res)=>{
  const date = req.params.date;
  // 查 DB 訂單統計
  // 例如：{stats:{正園A:10,...},totalAmount:1230}
  res.json({success:true, stats:{}, totalAmount:0});
});

module.exports = router;
