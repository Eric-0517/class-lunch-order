// public/js/main.js

// 計算總金額
function updateTotal() {
  const items = [];
  document.querySelectorAll('.day-card').forEach(card => {
    const checked = card.querySelector('input[type=radio]:checked');
    if (checked) {
      items.push({ typeName: checked.value, quantity: 1 });
    } else {
      items.push({ typeName: '今日不訂購', quantity: 0 });
    }
  });

  const total = items.reduce((sum, i) => sum + (i.typeName === '今日不訂購' ? 0 : 70), 0);
  document.getElementById('total-price').textContent = total;
}

// 監聽便當選擇改變
document.querySelectorAll('input[type=radio]').forEach(radio => {
  radio.addEventListener('change', updateTotal);
});

// 送出訂單
document.getElementById('submit-order').addEventListener('click', async () => {
  const seat = document.getElementById('seat-select').value;
  if (!seat) return alert("請選擇座號");

  const items = [];
  document.querySelectorAll('.day-card').forEach(card => {
    const checked = card.querySelector('input[type=radio]:checked');
    if (checked) {
      items.push({ typeName: checked.value, quantity: 1 });
    } else {
      items.push({ typeName: '今日不訂購', quantity: 0 });
    }
  });

  const totalPrice = items.reduce((sum, i) => sum + (i.typeName === '今日不訂購' ? 0 : 70), 0);

  if (!confirm(`確認便當是否訂購無誤？\n共計金額：${totalPrice} 元`)) return;

  try {
    const res = await fetch('/api/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seat, items })
    });
    const data = await res.json();
    alert(data.message);
    if (data.success) {
      // 清空選擇
      document.querySelectorAll('input[type=radio]').forEach(r => r.checked = false);
      document.getElementById('total-price').textContent = 0;
    }
  } catch (err) {
    alert("訂單送出失敗：" + err.message);
  }
});
