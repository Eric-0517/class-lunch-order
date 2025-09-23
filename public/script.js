// 側邊欄收合功能
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

// 座號下拉
const seatNumberSelect = document.getElementById("seatNumber");
for(let i=1;i<=32;i++){
  let opt = document.createElement("option");
  opt.value = i;
  opt.textContent = i;
  seatNumberSelect.appendChild(opt);
}

// 訂餐設定
const prices = { "正園A":70,"正園B":70,"御饌A":70,"御饌B":70,"悦馨A":70,"悦馨B":70 };
const days = ["星期一","星期二","星期三","星期四","星期五"];
const menuDiv = document.getElementById("menu"),
      totalPriceEl = document.getElementById("totalPrice"),
      orderDetailsEl = document.getElementById("orderDetails");

// 生成每日卡片
days.forEach((day,idx)=>{
  const card = document.createElement("div"); 
  card.className = "day-card"; 
  card.innerHTML = `<h3>${day}</h3>`;
  Object.keys(prices).forEach(item=>{
    const div = document.createElement("div"); 
    div.innerHTML = `
      <label>
        <input type="checkbox" data-day="${idx}" data-item="${item}"> ${item} (${prices[item]} 元)
      </label>
      <input type="number" min="1" value="1" data-qty="${item}-${idx}" disabled>
    `;
    const cb = div.querySelector("input[type=checkbox]");
    const qtyInput = div.querySelector("input[type=number]");
    cb.addEventListener("change", e => { 
      qtyInput.disabled = !e.target.checked; 
      calcTotal(); 
    });
    qtyInput.addEventListener("input", calcTotal);
    card.appendChild(div);
  });
  menuDiv.appendChild(card);
});

// 計算總金額與顯示明細
function calcTotal(){
  let total = 0;
  orderDetailsEl.innerHTML = "";
  days.forEach((day,idx)=>{
    const dayItems = [];
    Object.keys(prices).forEach(item=>{
      const cb = document.querySelector(`input[type=checkbox][data-day="${idx}"][data-item="${item}"]`);
      const qtyInput = document.querySelector(`input[type=number][data-qty="${item}-${idx}"]`);
      if(cb.checked){
        dayItems.push(`${item} x${qtyInput.value}`);
        total += prices[item] * parseInt(qtyInput.value);
      }
    });
    if(dayItems.length > 0){
      orderDetailsEl.innerHTML += `<div>${day}: ${dayItems.join(", ")}</div>`;
    }
  });
  totalPriceEl.textContent = total;
}

// 🔒 根據後台送單狀態鎖定按鈕
const submitBtn = document.getElementById("submitBtn");
async function updateSubmitButton() {
  try {
    const res = await fetch("/api/orderMode");
    const data = await res.json();
    if(data.success && data.data.open){
      submitBtn.disabled = false;
      submitBtn.classList.remove("locked");
    } else {
      submitBtn.disabled = true;
      submitBtn.classList.add("locked");
    }
  } catch(err){
    submitBtn.disabled = false;
    submitBtn.classList.remove("locked");
  }
}
updateSubmitButton();
// 每分鐘自動刷新狀態
setInterval(updateSubmitButton, 60*1000);

// 送出訂單
submitBtn.addEventListener("click", ()=>{
  if(submitBtn.disabled) return;
  if(!confirm("確認便當是否訂購無誤！")) return;
  const seat = seatNumberSelect.value;
  if(!seat) return alert("請選擇座號");

  const items = [];
  days.forEach((day,idx)=>{
    Object.keys(prices).forEach(item=>{
      const cb = document.querySelector(`input[type=checkbox][data-day="${idx}"][data-item="${item}"]`);
      const qtyInput = document.querySelector(`input[type=number][data-qty="${item}-${idx}"]`);
      if(cb.checked) items.push({type:item, quantity:parseInt(qtyInput.value), day: day});
    });
  });

  if(items.length === 0){
    alert("所有欄位必填");
    return;
  }

  fetch("/api/order",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({
      seatNumber: seat,
      items: items,
      total: parseInt(totalPriceEl.textContent)
    })
  })
  .then(res => res.json())
  .then(data => {
    if(data.success){
      alert("訂單已送出");
      menuDiv.querySelectorAll("input[type=checkbox]").forEach(cb=>{
        cb.checked = false; 
        cb.dispatchEvent(new Event("change"));
      });
      totalPriceEl.textContent = 0;
      orderDetailsEl.innerHTML = "";
    } else {
      alert(data.message || "訂單送出失敗");
    }
  })
  .catch(err => {
    console.error("送單錯誤：", err);
    alert("訂單送出失敗，請稍後再試");
  });
});
