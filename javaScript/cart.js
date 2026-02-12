let cart = JSON.parse(localStorage.getItem("cart")) || [];

const formatPrice = n => {
  if (!n || isNaN(n)) return "$0";
  return n.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0
  });
};

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function renderCart() {
  const container = document.getElementById("cartItems");
  const totalEl = document.getElementById("cartTotal");

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="alert alert-warning">
        El carrito está vacío
      </div>
    `;
    totalEl.textContent = formatPrice(0);
    return;
  }

  let total = 0;

  container.innerHTML = cart.map((p, i) => {
    const subtotal = p.price * p.qty;
    total += subtotal;

    return `
      <div class="card mb-3 p-3 shadow-sm">
        <div class="row align-items-center">
          <div class="col-md-2">
            <img src="${p.img}" class="img-fluid rounded">
          </div>

          <div class="col-md-4">
            <h5>${p.brand} ${p.model}</h5>
            <p class="mb-1">Precio: ${formatPrice(p.price)}</p>
            <strong>Subtotal: ${formatPrice(subtotal)}</strong>
          </div>

          <div class="col-md-3 d-flex align-items-center gap-2">
            <button class="btn btn-sm btn-outline-dark"
              onclick="decreaseQty(${i})">-</button>

            <span>${p.qty}</span>

            <button class="btn btn-sm btn-outline-dark"
              onclick="increaseQty(${i})">+</button>
          </div>

          <div class="col-md-3 text-end">
            <button class="btn btn-sm btn-danger"
              onclick="removeItem(${i})">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join("");

  totalEl.textContent = formatPrice(total);
}

function increaseQty(i) {
  cart[i].qty++;
  saveCart();
  renderCart();
}

function decreaseQty(i) {
  if (cart[i].qty > 1) {
    cart[i].qty--;
  } else {
    cart.splice(i, 1);
  }
  saveCart();
  renderCart();
}

function removeItem(i) {
  cart.splice(i, 1);
  saveCart();
  renderCart();
}

function clearCart() {
  cart = [];
  saveCart();
  renderCart();
}

function checkout() {
  if (cart.length === 0) {
    alert("Tu carrito está vacío");
    return;
  }

  alert("Compra finalizada correctamente 🚀");
  clearCart();
}

document.addEventListener("DOMContentLoaded", () => {
  renderCart();

  document.getElementById("clearCart")
    .addEventListener("click", clearCart);

  document.getElementById("checkoutBtn")
    .addEventListener("click", checkout);
});

function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const totalQty = cart.reduce((acc, item) => acc + item.qty, 0);

  const cartCount = document.getElementById("cartCount");
  if (cartCount) {
    cartCount.textContent = totalQty;
  }
}

document.addEventListener("DOMContentLoaded", updateCartCount);