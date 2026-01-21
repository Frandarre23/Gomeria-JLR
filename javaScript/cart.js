let cart = JSON.parse(localStorage.getItem("cart")) || [];

const formatPrice = n =>
  n.toLocaleString('es-AR', { style:'currency', currency:'ARS', maximumFractionDigits:0 });

function renderCart(){
    const container = document.getElementById("cartItems");
    const totalEl = document.getElementById("cartTotal");

    updateCartCount(); // 👈 IMPORTANTE

    if(cart.length === 0){
        container.innerHTML = "<p>El carrito está vacío</p>";
        totalEl.textContent = formatPrice(0);
        return;
    }

    let total = 0;

    container.innerHTML = cart.map((p, i) => {
        total += p.price * p.qty;
        return `
            <div class="cart-item">
                <img src="${p.img}">
                <div>
                    <h4>${p.brand} ${p.model}</h4>
                    <p>${formatPrice(p.price)} x ${p.qty}</p>
                </div>
                <button onclick="removeItem(${i})">✖</button>
            </div>
        `;
    }).join("");

    totalEl.textContent = formatPrice(total);
}

function removeItem(i){
    cart.splice(i,1);
    localStorage.setItem("cart", JSON.stringify(cart));
    renderCart();
    updateCartCount(); // 👈 clave
}

renderCart();

function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const count = cart.reduce((acc, item) => acc + item.qty, 0);

  const cartCount = document.getElementById("cartCount");
  if (cartCount) {
    cartCount.textContent = count;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
});