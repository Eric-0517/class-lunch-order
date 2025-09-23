// 側邊欄收合
const toggleBtn = document.getElementById("toggleSidebar");
const sidebar = document.getElementById("sidebar");
toggleBtn.addEventListener("click", () => {
  if(sidebar.classList.contains("expanded")){
    sidebar.classList.remove("expanded");
    sidebar.classList.add("collapsed");
  } else {
    sidebar.classList.remove("collapsed");
    sidebar.classList.add("expanded");
  }
});

// 座號下拉選單
const seatNumberSelect = document.getElementById("seatNumber");
for(let i=1;i<=32;i++){
  let opt=document.createElement("option"); 
  opt.value=i; 
  opt.textContent=i; 
  seatNumberSelect.appendChild(opt);
}

const resultDiv = document.getElementById("result");
const searchBtn = document.getElementById("searchBtn");

searchBtn.addEventListener("click", async ()=>{
  const seat = seatNumberSelect.value;
  if(!seat){ alert("請選擇座號"); return; }

  try {
    const res = await fetch(`/api/history/${seat}`,{
      method:"GET", 
      headers:{"Content-Type":"application/json"}
    });
    const data = await res.json();

    if(!data.success){
      resultDiv.innerHTML=`<div style="color:red">${data.message}</div>`;
      return;
    }

    if(!data.orders || data.orders.length===0){
      resultDiv.innerHTML=`<div style="color:red">無資料或已刪除</div>`;
      return;
    }

    // 顯示訂單明細
    resultDiv.innerHTML="";
    data.orders.forEach(order=>{
      const dayDiv=document.createElement("div");
      dayDiv.className="day-card";

      // 計算每個日期的總金額
      let totalAmount = 0;
      order.items.forEach(it=>{
        if(it.typeName !== "今日不訂購") totalAmount += 70 * (it.quantity || 1);
      });

      let html=`<h3>${order.date}</h3>`;
      order.items.forEach(it=>{
        html+=`<div>${it.typeName} x${it.quantity || 1}</div>`;
      });
      html+=`<div>總金額：${totalAmount} 元</div>`;

      dayDiv.innerHTML=html;
      resultDiv.appendChild(dayDiv);
    });

  } catch(err){
    console.error(err);
    resultDiv.innerHTML=`<div style="color:red">載入失敗：${err.message}</div>`;
  }
});
