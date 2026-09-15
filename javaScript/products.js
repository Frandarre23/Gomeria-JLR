// URL de tu Google Sheet publicado como CSV
const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTMhLwJpILy0W4pNWkOOnIChiMo-KhwK8tE8D6DpV6s-Sjw1G_6AdsT-dmOMlMxlFYnUT9v8aH_Z5kF/pub?gid=0&single=true&output=csv";

// Array de productos (se llenará desde Sheets)
let products = [];

// Carrito
let cart = JSON.parse(localStorage.getItem("cart")) || [];

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const formatPrice = n => {
  if (!n || isNaN(n)) return "$0";
  return n.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0
  });
};

const rimFromSize = s => {
  if (!s) return 0;
  const match = s.match(/[rR](\d+)/);
  return match ? parseInt(match[1], 10) : 0;
};

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartUI();
}

function addToCart(product) {
  if (!product) return;
  const existing = cart.find(p => p.id === product.id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      id: product.id,
      brand: product.brand,
      model: product.model,
      price: product.price,
      img: product.img,
      qty: 1
    });
  }

  saveCart();
  alert("Producto agregado al carrito 🛒");
}

function removeFromCart(index) {
  if (!cart[index]) return;
  cart.splice(index, 1);
  saveCart();
}

function updateCartUI() {
  const cartCountEl = document.getElementById("cartCount");
  const cartItemsEl = document.getElementById("cartItems");
  const cartTotalEl = document.getElementById("cartTotal");

  // Siempre actualizamos el contador si existe
  if (cartCountEl) {
    const totalQty = cart.reduce((a, b) => a + (b.qty || 0), 0);
    cartCountEl.textContent = totalQty;
  }

  // Si no estamos en la página carrito con estos elementos, salimos
  if (!cartItemsEl || !cartTotalEl) return;

  // Renderizamos solo si existen los elementos
  cartItemsEl.innerHTML = cart.map((item, i) => `
    <li>
      ${item.brand} ${item.model} x${item.qty}
      ${formatPrice((item.price || 0) * (item.qty || 1))}
      <button onclick="removeFromCart(${i})" aria-label="Eliminar producto">❌</button>
    </li>
  `).join("");

  const total = cart.reduce((s, p) => s + (p.price || 0) * (p.qty || 1), 0);
  cartTotalEl.textContent = formatPrice(total);
}

// Carga única y sanitizada de productos desde Google Sheets
Papa.parse(sheetURL, {
  download: true,
  header: true,
  complete: res => {
    products = (res.data || []).map((r, i) => ({
      id: i + 1,
      brand: r.brand ? r.brand.trim() : "",
      model: r.model ? r.model.trim() : "",
      size: r.size ? r.size.trim() : "",
      season: r.season ? r.season.trim() : "",
      price: Number(r.price) || 0,
      img: r.img ? r.img.trim() : ""
    })).filter(p => p.price > 0);

    render(products);
  },
  error: err => {
    console.error("Error al cargar la hoja de productos:", err);
  }
});

function cardHTML(p) {
  return `
    <div class="product-card">
      <img src="${p.img}" alt="${p.brand} ${p.model}">
      <h2>${p.brand} ${p.model}</h2>
      <p><strong>Medida:</strong> ${p.size}</p>
      <p><strong>Temporada:</strong> ${p.season}</p>
      <p><strong>Precio:</strong> ${formatPrice(p.price)}</p>
      <button class="add-to-cart" data-id="${p.id}">Comprar</button>
    </div>
  `;
}

function setupAddToCart() {
  $$(".add-to-cart").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.id);
      const product = products.find(p => p.id === id);
      addToCart(product);
    });
  });
}

function render(list) {
  const grid = $("#productGrid");
  const count = $("#resultCount");

  if (grid) grid.innerHTML = list.map(cardHTML).join("");
  if (count) count.textContent = `Mostrando ${list.length} productos`;
  setupAddToCart();
}

// Filtros
function applyFilters() {
  const searchInput = $("#searchInput");
  const brandFilter = $("#brandFilter");
  const sizeFilter = $("#sizeFilter");
  const seasonFilter = $("#seasonFilter");
  const sortSelect = $("#sortSelect");

  const q = searchInput ? searchInput.value.toLowerCase() : "";
  const brand = brandFilter ? brandFilter.value : "";
  const size = sizeFilter ? sizeFilter.value : "";
  const season = seasonFilter ? seasonFilter.value : "";
  const sort = sortSelect ? sortSelect.value : "";

  let filtered = products.filter(p =>
    (!brand || p.brand === brand) &&
    (!size || p.size === size) &&
    (!season || p.season === season) &&
    (!q || `${p.brand} ${p.model}`.toLowerCase().includes(q))
  );

  if (sort === "priceAsc") filtered.sort((a, b) => a.price - b.price);
  if (sort === "priceDesc") filtered.sort((a, b) => b.price - a.price);
  if (sort === "size") filtered.sort((a, b) => rimFromSize(a.size) - rimFromSize(b.size));

  render(filtered);
}

document.addEventListener("DOMContentLoaded", () => {
  updateCartUI();

  ["#searchInput", "#brandFilter", "#sizeFilter", "#seasonFilter", "#sortSelect"]
    .forEach(s => {
      const el = $(s);
      if (el) {
        el.addEventListener("input", applyFilters);
        el.addEventListener("change", applyFilters);
      }
    });

  const clearBtn = $("#clearBtn");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      const searchInput = $("#searchInput");
      const brandFilter = $("#brandFilter");
      const sizeFilter = $("#sizeFilter");
      const seasonFilter = $("#seasonFilter");
      const sortSelect = $("#sortSelect");

      if (searchInput) searchInput.value = "";
      if (brandFilter) brandFilter.value = "";
      if (sizeFilter) sizeFilter.value = "";
      if (seasonFilter) seasonFilter.value = "";
      if (sortSelect) sortSelect.value = "";
      render(products);
    });
  }

  // UI Drawer / modal si existiese
  const cartDrawer = $("#cart");
  const cartIcon = $(".cart-icon");
  if (cartDrawer && cartIcon) {
    cartIcon.addEventListener("click", e => {
      e.preventDefault();
      cartDrawer.classList.toggle("active");
    });
  }
});
