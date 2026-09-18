let cart = JSON.parse(localStorage.getItem("cart")) || [];

// Número oficial de WhatsApp de Gomería JLR (+54 9 11 3199-9002)
const WHATSAPP_PHONE = "5491131999002";

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  const storedCart = JSON.parse(localStorage.getItem("cart")) || [];
  const totalQty = storedCart.reduce((acc, item) => acc + (item.qty || 0), 0);

  const cartCount = document.getElementById("cartCount");
  if (cartCount) {
    cartCount.textContent = totalQty;
  }
}

function renderCart() {
  const container = document.getElementById("cartItems");
  const totalEl = document.getElementById("cartTotal");
  const totalUnitsSpan = document.getElementById("cartTotalUnits");

  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="alert alert-warning">
        El carrito está vacío
      </div>
    `;
    if (totalUnitsSpan) {
      totalUnitsSpan.textContent = "0";
    } else if (totalEl) {
      totalEl.textContent = "0 unidades";
    }
    return;
  }

  const totalUnits = cart.reduce((acc, p) => acc + (p.qty || 1), 0);

  container.innerHTML = cart.map((p, i) => {
    return `
      <div class="card mb-3 p-3 shadow-sm">
        <div class="row align-items-center">
          <div class="col-md-2">
            <img src="${p.img || ''}" alt="${p.brand || ''} ${p.model || ''}" class="img-fluid rounded">
          </div>

          <div class="col-md-5">
            <h5>${p.brand || ''} ${p.model || ''}</h5>
            ${p.size ? `<p class="mb-1 text-muted"><strong>Medida:</strong> ${p.size}</p>` : ''}
            ${p.season ? `<p class="mb-1 text-muted"><strong>Temporada:</strong> ${p.season}</p>` : ''}
            <h5 class="mb-0">${p.brand || ''} ${p.model || ''}</h5>
          </div>

          <div class="col-md-3 d-flex align-items-center gap-2">
            <button class="btn btn-sm btn-outline-dark"
              onclick="decreaseQty(${i})">-</button>

            <span>${p.qty}</span>

            <button class="btn btn-sm btn-outline-dark"
              onclick="increaseQty(${i})">+</button>
          </div>

          <div class="col-md-2 text-end">
            <button class="btn btn-sm btn-danger"
              onclick="removeItem(${i})" aria-label="Eliminar producto">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join("");

  if (totalUnitsSpan) {
    totalUnitsSpan.textContent = totalUnits;
  } else if (totalEl) {
    totalEl.textContent = `${totalUnits} unidad${totalUnits === 1 ? '' : 'es'}`;
  }
}

function increaseQty(i) {
  if (!cart[i]) return;
  cart[i].qty++;
  saveCart();
  renderCart();
}

function decreaseQty(i) {
  if (!cart[i]) return;
  if (cart[i].qty > 1) {
    cart[i].qty--;
  } else {
    cart.splice(i, 1);
  }
  saveCart();
  renderCart();
}

function removeItem(i) {
  if (!cart[i]) return;
  cart.splice(i, 1);
  saveCart();
  renderCart();
}

function clearCart() {
  cart = [];
  saveCart();
  renderCart();
}

function checkoutWhatsApp() {
  if (cart.length === 0) {
    alert("Tu carrito está vacío. Agrega neumáticos antes de consultar.");
    return;
  }

  let text = "¡Hola Gomería JLR! 👋\nQuisiera consultar precio y disponibilidad por los siguientes neumáticos:\n\n";
  
  cart.forEach(p => {
    const sizeInfo = p.size ? ` (Medida: ${p.size})` : "";
    text += `• ${p.brand} ${p.model}${sizeInfo} - Cantidad: ${p.qty} unidad(es)\n`;
  });

  text += "\n¿Tienen stock y me pueden informar los métodos de pago? ¡Gracias!";

  const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(text)}`;
  window.open(whatsappUrl, "_blank");
}

document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();

  const container = document.getElementById("cartItems");
  if (container) {
    renderCart();
  }

  const clearBtn = document.getElementById("clearCart");
  if (clearBtn) {
    clearBtn.addEventListener("click", clearCart);
  }

  const checkoutBtn = document.getElementById("checkoutBtn");
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", checkoutWhatsApp);
  }
});