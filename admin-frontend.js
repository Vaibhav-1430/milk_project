// admin-frontend.js
// Admin dashboard script for GaramDoodh (Netlify serverless version)

// 🔧 Base API endpoint for Netlify Functions
const API = '/.netlify/functions/api/admin';

function formatItems(items = []) {
  return items.map(it => `${it.name} x${it.quantity}`).join(', ');
}

async function loadOrders() {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('No token found. Please login as admin.');
    window.location = 'login.html';
    return;
  }

  try {
    const res = await fetch(`${API}/orders?limit=100`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to load orders');
    }

    const data = await res.json();
    const tbody = document.getElementById('ordersTbody');
    tbody.innerHTML = '';

    if (!data.orders || data.orders.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-gray-500">No orders found</td></tr>`;
      return;
    }

    data.orders.forEach(order => {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-gray-50';

      const itemsText = formatItems(order.items || []);
      const deliveryDate = order.deliveryDate
        ? new Date(order.deliveryDate).toLocaleDateString()
        : '—';

      tr.innerHTML = `
        <td class="px-4 py-2 text-sm">${order.orderNumber || order._id}</td>
        <td class="px-4 py-2 text-sm">${order.contactInfo?.name || order.user?.name || 'Guest'}</td>
        <td class="px-4 py-2 text-sm">${itemsText}</td>
        <td class="px-4 py-2 text-sm">${deliveryDate} ${order.deliveryTime || ''}</td>
        <td class="px-4 py-2 text-sm text-center">
          <input type="checkbox" data-id="${order._id}" ${order.isPlaced ? 'checked' : ''} class="placed-checkbox h-4 w-4 cursor-pointer" />
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Attach event listeners to all checkboxes
    document.querySelectorAll('.placed-checkbox').forEach(cb => {
      cb.addEventListener('change', async (e) => {
        const id = e.target.getAttribute('data-id');
        const placed = e.target.checked;
        await togglePlaced(id, placed);
      });
    });
  } catch (err) {
    alert(err.message || 'An error occurred while loading orders.');
  }
}

async function togglePlaced(orderId, placed) {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API}/orders/${orderId}/placed`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ placed })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update order');
    }
  } catch (error) {
    alert(error.message);
  } finally {
    // Reload list after updating (optional, but cleaner)
    await loadOrders();
  }
}

// Handle sign-out
document.getElementById('signOutBtn').addEventListener('click', () => {
  localStorage.removeItem('token');
  window.location = 'login.html';
});

// Load orders on page ready
window.addEventListener('DOMContentLoaded', loadOrders);
