// URL de tu Google Sheet publicado como CSV
const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTMhLwJpILy0W4pNWkOOnIChiMo-KhwK8tE8D6DpV6s-Sjw1G_6AdsT-dmOMlMxlFYnUT9v8aH_Z5kF/pub?gid=0&single=true&output=csv";

// Array de productos (se llenará desde Sheets)
let products = [];

// Carrito

let cart = JSON.parse(localStorage.getItem("cart")) || [];

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const formatPrice = n => n.toLocaleString("es-AR", { style:"currency", currency:"ARS", maximumFractionDigits:0 });
const rimFromSize = s => parseInt(s.split("R")[1]);

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function addToCart(product) {
  const existing = cart.find(p => p.id === product.id);
  if (existing) existing.qty++;
  else cart.push({ ...product, qty: 1 });
  saveCart();
  updateCartUI();
}

function removeFromCart(index) {
  cart.splice(index, 1);
  saveCart();
  updateCartUI();
}

function updateCartUI() {
  $("#cartCount").textContent = cart.reduce((a,b)=>a+b.qty,0);

  $("#cartItems").innerHTML = cart.map((item,i)=>`
    <li>
      ${item.brand} ${item.model} x${item.qty}
      ${formatPrice(item.price * item.qty)}
      <button onclick="removeFromCart(${i})">❌</button>
    </li>
  `).join("");

  const total = cart.reduce((s,p)=>s+p.price*p.qty,0);
  $("#cartTotal").textContent = formatPrice(total);
}

// Productos

Papa.parse(sheetURL, {
  download: true,
  header: true,
  complete: res => {
    products = res.data.map((r,i)=>({
      id: i+1,
      brand: r.brand,
      model: r.model,
      size: r.size,
      season: r.season,
      price: parseFloat(r.price),
      img: r.img
    }));
    render(products);
  }
});

function cardHTML(p){
  return `
    <div class="product-card">
      <img src="${p.img}" alt="${p.model}">
      <h2>${p.brand} ${p.model}</h2>
      <p><strong>Medida:</strong> ${p.size}</p>
      <p><strong>Temporada:</strong> ${p.season}</p>
      <p><strong>Precio:</strong> ${formatPrice(p.price)}</p>
      <button class="add-to-cart" data-id="${p.id}">Comprar</button>
    </div>
  `;
}

function setupAddToCart(){
  $$(".add-to-cart").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const id = Number(btn.dataset.id);
      const product = products.find(p=>p.id===id);
      addToCart(product);
    });
  });
}

function render(list){
  $("#productGrid").innerHTML = list.map(cardHTML).join("");
  $("#resultCount").textContent = `Mostrando ${list.length} productos`;
  setupAddToCart();
}


// Filtros

function applyFilters(){
  const q = $("#searchInput").value.toLowerCase();
  const brand = $("#brandFilter").value;
  const size = $("#sizeFilter").value;
  const season = $("#seasonFilter").value;
  const sort = $("#sortSelect").value;

  let filtered = products.filter(p =>
    (!brand || p.brand === brand) &&
    (!size || p.size === size) &&
    (!season || p.season === season) &&
    (!q || `${p.brand} ${p.model}`.toLowerCase().includes(q))
  );

  if (sort==="priceAsc") filtered.sort((a,b)=>a.price-b.price);
  if (sort==="priceDesc") filtered.sort((a,b)=>b.price-a.price);
  if (sort==="size") filtered.sort((a,b)=>rimFromSize(a.size)-rimFromSize(b.size));

  render(filtered);
}

["#searchInput","#brandFilter","#sizeFilter","#seasonFilter","#sortSelect"]
.forEach(s=>{
  $(s).addEventListener("input",applyFilters);
  $(s).addEventListener("change",applyFilters);
});

$("#clearBtn").addEventListener("click",()=>{
  $("#searchInput").value = "";
  $("#brandFilter").value = "";
  $("#sizeFilter").value = "";
  $("#seasonFilter").value = "";
  $("#sortSelect").value = "";
  render(products);
});

// Ui

$(".cart-icon").addEventListener("click",()=>{
  $("#cart").classList.toggle("active");
});

updateCartUI();

