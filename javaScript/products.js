// URL de tu Google Sheet publicado como CSV
const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTMhLwJpILy0W4pNWkOOnIChiMo-KhwK8tE8D6DpV6s-Sjw1G_6AdsT-dmOMlMxlFYnUT9v8aH_Z5kF/pub?gid=0&single=true&output=csv";

// Array de productos (se llenará desde Sheets)
let products = [];

// Carrito
let cart = JSON.parse(localStorage.getItem("cart")) || [];

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

// Parsea precios de forma segura soportando vacíos, texto, formato argentino ($ 150.000 o 150000)
function parsePrice(val) {
  if (!val) return 0;
  if (typeof val === "number") return val;

  let str = val.toString().replace(/[^0-9.,]/g, "").trim();
  if (!str) return 0;

  if (str.includes(".") && str.includes(",")) {
    str = str.replace(/\./g, "").replace(",", ".");
  } else if (str.includes(".") && !str.includes(",")) {
    const parts = str.split(".");
    if (parts.length > 1 && parts[parts.length - 1].length === 3) {
      str = str.replace(/\./g, ""); // separador de miles (ej: 120.000 -> 120000)
    }
  } else if (str.includes(",")) {
    str = str.replace(",", ".");
  }

  return parseFloat(str) || 0;
}

const formatPrice = n => {
  if (!n || isNaN(n) || n <= 0) return "Consultar";
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
      size: product.size,
      season: product.season,
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

  if (cartCountEl) {
    const totalQty = cart.reduce((a, b) => a + (b.qty || 0), 0);
    cartCountEl.textContent = totalQty;
  }

  if (!cartItemsEl || !cartTotalEl) return;

  cartItemsEl.innerHTML = cart.map((item, i) => `
    <li>
      ${item.brand} ${item.model} x${item.qty}
      <button onclick="removeFromCart(${i})" aria-label="Eliminar producto">❌</button>
    </li>
  `).join("");

  const total = cart.reduce((s, p) => s + (p.qty || 1), 0);
  cartTotalEl.textContent = `${total} unidad(es)`;
}

// Carga de productos desde Google Sheets con feedback de carga y error
function loadProducts() {
  const grid = $("#productGrid");
  const count = $("#resultCount");

  if (grid) {
    grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 2rem;">Cargando neumáticos desde la planilla...</p>`;
  }

  Papa.parse(sheetURL, {
    download: true,
    header: true,
    complete: res => {
      // Filtra filas que tengan al menos marca o modelo (no descartamos por precio vacío)
      products = (res.data || [])
        .map((r, i) => ({
          id: i + 1,
          brand: r.brand ? r.brand.trim() : "",
          model: r.model ? r.model.trim() : "",
          size: r.size ? r.size.trim() : "",
          season: r.season ? r.season.trim() : "",
          price: parsePrice(r.price),
          img: r.img ? r.img.trim() : ""
        }))
        .filter(p => p.brand !== "" || p.model !== "");

      if (products.length === 0) {
        if (grid) grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center;">No se encontraron productos disponibles.</p>`;
        if (count) count.textContent = "Mostrando 0 productos";
        return;
      }

      render(products);
    },
    error: err => {
      console.error("Error al cargar la hoja de productos:", err);
      if (grid) {
        grid.innerHTML = `
          <div style="grid-column: 1/-1; text-align: center; color: #dc3545; padding: 2rem;">
            <h5>No se pudo cargar la lista de productos</h5>
            <p style="font-size: 0.9rem; color: #666;">
              Si abriste la página con doble clic (file://), el navegador bloquea la conexión por seguridad (CORS).<br>
              Abre el proyecto usando la extensión <strong>Live Server</strong> en VS Code.
            </p>
          </div>
        `;
      }
      if (count) count.textContent = "Error de conexión";
    }
  });
}

function cardHTML(p) {
  return `
    <div class="product-card">
      <img src="${p.img}" alt="${p.brand} ${p.model}">
      <h2>${p.brand} ${p.model}</h2>
      <p><strong>Medida:</strong> ${p.size || 'No especificada'}</p>
      <p><strong>Temporada:</strong> ${p.season || 'All Season'}</p>
      <p><strong>Precio:</strong> ${formatPrice(p.price)}</p>
      <button class="add-to-cart" data-id="${p.id}">Agregar al carrito</button>
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
  loadProducts();

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

  // Drawer / modal si existiera
  const cartDrawer = $("#cart");
  const cartIcon = $(".cart-icon");
  if (cartDrawer && cartIcon) {
    cartIcon.addEventListener("click", e => {
      e.preventDefault();
      cartDrawer.classList.toggle("active");
    });
  }
});
