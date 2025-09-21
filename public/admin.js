const loginSection = document.getElementById("loginSection");
const adminPanel = document.getElementById("adminPanel");
const loginBtn = document.getElementById("loginBtn");
const loginMsg = document.getElementById("loginMsg");
const statsResult = document.getElementById("statsResult");

const mealTypes = ["正園A","正園B","御饌A","御饌B","悦馨A","悦馨B","今日不訂購"];

// ===== 送單模式相關 =====
const orderOpenCheckbox = document.getElementById("orderOpen");
const scheduleEnabled = document.getElementById("scheduleEnabled");
const scheduleDate = document.getElementById("scheduleDate");
const scheduleTime = document.getElementById("scheduleTime"); // 新增時間欄位
const saveOrderModeBtn = document.getElementById("saveOrderModeBtn");
const orderModeMsg = document.getElementById("orderModeMsg");

// 登入功能
loginBtn.addEventListener("click", () => {
  const username = document.getElementById("adminUser").value;
  const password = document.getElementById("adminPass").value;

  fetch("/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user: username, pass: password })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      loginSection.style.display = "none";
      adminPanel.style.display = "block";
      loginMsg.textContent = "";
      loadOrders();
      loadOrderMode();
    } else {
      loginMsg.textContent = "帳號或密碼錯誤";
    }
  })
  .catch(err => {
    loginMsg.textContent = "登入失敗：" + err.message;
  });
});

// 載入訂單資料
function loadOrders() {
  fetch("/api/orders")
    .then(res => res.json())
    .then(d => {
      if(d.success){
        // 整理訂單資料，依座號與品項統計
        const ordersBySeat = {};
        let totalCount = 0;
        let totalAmount = 0;

        d.data.forEach(o => {
          if(!ordersBySeat[o.seat]) ordersBySeat[o.seat] = {};
          o.items.forEach(it=>{
            ordersBySeat[o.seat][it.typeName] = (ordersBySeat[o.seat][it.typeName]||0)+1;
            if(it.typeName !== "今日不訂購") totalAmount += 70;
            totalCount +=1;
          });
        });

        let html = `<table>
                      <tr>
                        <th>座號</th>
                        ${mealTypes.map(t=>`<th>${t}</th>`).join('')}
                        <th>總金額</th>
                        <th>操作</th>
                      </tr>`;

        Object.keys(ordersBySeat).forEach(seat=>{
          const counts = ordersBySeat[seat];
          html += `<tr>
                    <td>${seat}</td>
                    ${mealTypes.map(t=>`<td>${counts[t]||0}</td>`).join('')}
                    <td>${Object.keys(counts).reduce((sum,t)=> t!=='今日不訂購'?sum+(counts[t]*70):sum,0)}</td>
                    <td><button class="delete-btn" data-seat="${seat}">刪除</button></td>
                   </tr>`;
        });

        html += `<tr>
                  <td colspan="${mealTypes.length+2}"><strong>總訂單數：${totalCount}，總金額：${totalAmount} 元</strong></td>
                 </tr>`;
        html += `</table>`;

        statsResult.innerHTML = html;

        // 綁定刪除事件
        document.querySelectorAll('.delete-btn').forEach(btn=>{
          btn.addEventListener('click', ()=>{
            if(!confirm(`確定要刪除座號 ${btn.dataset.seat} 的所有訂單嗎？`)) return;
            fetch(`/api/orders`, { method:'DELETE', headers:{'Content-Type':'application/json'}, body:JSON.stringify({seat:btn.dataset.seat}) })
              .then(res=>res.json())
              .then(r=>{
                if(r.success) loadOrders();
                else alert(r.message);
              });
          });
        });

      } else {
        statsResult.innerHTML = `<div style="color:red">${d.message}</div>`;
      }
    })
    .catch(err=>{
      statsResult.innerHTML = `<div style="color:red">載入失敗：${err.message}</div>`;
    });
}

// ===== 送單模式設定 =====
function loadOrderMode() {
  fetch("/api/orderMode")
    .then(res => res.json())
    .then(data => {
      if(data.success){
        const mode = data.data;
        orderOpenCheckbox.checked = mode.open;
        scheduleEnabled.checked = mode.scheduleEnabled;
        scheduleDate.value = mode.scheduleDate || "";
        scheduleTime.value = mode.scheduleTime || "";
      }
    });
}

saveOrderModeBtn.addEventListener("click", () => {
  const mode = {
    open: orderOpenCheckbox.checked,
    scheduleEnabled: scheduleEnabled.checked,
    scheduleDate: scheduleDate.value,
    scheduleTime: scheduleTime.value
  };

  fetch("/api/orderMode", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(mode)
  })
  .then(res=>res.json())
  .then(data=>{
    orderModeMsg.textContent = data.message;
    setTimeout(()=>orderModeMsg.textContent="",2000);
  })
  .catch(err=>{
    orderModeMsg.textContent = "儲存失敗：" + err.message;
  });
});

// ===== 自動關閉送單 =====
function checkAutoClose() {
  if(!scheduleEnabled.checked) return;
  if(!scheduleDate.value || !scheduleTime.value) return;

  const now = new Date();
  const target = new Date(scheduleDate.value + "T" + scheduleTime.value);
  if(now >= target) orderOpenCheckbox.checked = false;
}

// 每分鐘檢查一次
setInterval(checkAutoClose, 60000);
