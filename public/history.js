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
  let opt=document.createElement("option"); opt.value=i; opt.textContent=i; seatNumberSelect.appendChild(opt);
}

const resultDiv = document.getElementById("result");
const searchBtn = document.getElementById("searchBtn");

searchBtn.addEventListener("click", ()=>{
  const seat = seatNumberSelect.value;
  if(!seat){ alert("請選擇座號"); return; }

  fetch(`/api/history/${seat}`,{method:"GET", headers:{"Content-Type":"application/json"}})
    .then(res=>res.json())
    .then(data=>{
      if(!data.success){
        resultDiv.innerHTML=`<div style="color:red">${data.message}</div>`;
        return;
      }

      if(data.orders.length===0){
        resultDiv.innerHTML=`<div style="color:red">無資料或已刪除</div>`;
        return;
      }

      // 顯示訂單明細
      resultDiv.innerHTML="";
      data.orders.forEach(order=>{
        const dayDiv=document.createElement("div");
        dayDiv.className="day-card";
        let html=`<h3>${order.date}</h3>`;
        order.items.forEach(it=>{
          html+=`<div>${it.type} x${it.quantity}</div>`;
        });
        html+=`<div>總金額：${order.total} 元</div>`;
        dayDiv.innerHTML=html;
        resultDiv.appendChild(dayDiv);
      });
    });
});
