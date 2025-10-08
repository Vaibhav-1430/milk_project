// admin-frontend.js
// Admin dashboard script for GaramDoodh

const API = '/api/admin'; // base admin API endpoint

function formatItems(items) {
  return items.map(it => `${it.name} x${it.quantity}`).join(', ');
}

async function loadOrders() {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('No token found. Please login as admin.');
    window.location = 'login.html';
    return;
  }

  const res = await fetch(API + '/orders?limit=100', {
    headers: { 'Authorization': 'Bearer ' + token }
  });

  if (!res.ok) {
    const j = await res.json().catch(() => ({ message: 'Failed' }));
    alert('Failed to load orders: ' + (j.message || res.status));
    return;
  }

  const data = await res.json();
  const tbody = document.getElementById('ordersTbody');
  tbody.innerHTML = '';
  data.orders.forEach(order => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-gray-50';
    const itemsText = formatItems(order.items || []);
    tr.innerHTML = `
      <td class="px-4 py-2 text-sm">${order.orderNumber || order._id}</td>
      <td class="px-4 py-2 text-sm">${order.contactInfo?.name || (order.user?.name || 'Guest')}</td>
      <td class="px-4 py-2 text-sm">${itemsText}</td>
      <td class="px-4 py-2 text-sm">${new Date(order.deliveryDate).toLocaleDateString()} ${order.deliveryTime || ''}</td>
      <td class="px-4 py-2 text-sm text-center">
        <input type="checkbox" data-id="${order._id}" ${order.isPlaced ? 'checked' : ''} class="placed-checkbox h-4 w-4" />
      </td>
    `;
    tbody.appendChild(tr);
  });

  document.querySelectorAll('.placed-checkbox').forEach(cb => {
    cb.addEventListener('change', async (e) => {
      const id = e.target.getAttribute('data-id');
      const placed = e.target.checked;
      await togglePlaced(id, placed);
    });
  });
}

async function togglePlaced(orderId, placed) {
  const token = localStorage.getItem('token');
  const res = await fetch(API + `/orders/${orderId}/placed`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({ placed })
  });
  if (!res.ok) {
    alert('Failed to update order');
    await loadOrders(); // refresh
  }
}

document.getElementById('signOutBtn').addEventListener('click', () => {
  localStorage.removeItem('token');
  window.location = 'login.html';
});

loadOrders();
