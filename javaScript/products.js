// URL de tu Google Sheet publicado como CSV
const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTMhLwJpILy0W4pNWkOOnIChiMo-KhwK8tE8D6DpV6s-Sjw1G_6AdsT-dmOMlMxlFYnUT9v8aH_Z5kF/pub?gid=0&single=true&output=csv";

// Array de productos (se llenará desde Sheets)
let products = [];

// Cargar productos desde Google Sheets con PapaParse
Papa.parse(sheetURL, {
  download: true,
  header: true,
  complete: function(results) {
    products = results.data.map((row, index) => ({
      id: index + 1,
      brand: row.brand,
      model: row.model,
      size: row.size,
      season: row.season,
      price: parseFloat(row.price),
      img: row.img
    }));

    render(products); // Renderiza los productos al cargar
  }
});
// Helpers
const $ = sel => document.querySelector(sel);
const $$ = sel => document.querySelectorAll(sel);
const formatPrice = n => n.toLocaleString('es-AR', { style:'currency', currency:'ARS', maximumFractionDigits:0 });
const rimFromSize = size => parseInt(size.split("R")[1]);

// Render de productos
function cardHTML(p){
  return `
    <div class="product-card">
      <img src="${p.img}" alt="${p.model}">
      <h2>${p.brand} ${p.model}</h2>
      <p><strong>Medida:</strong> ${p.size}</p>
      <p><strong>Temporada:</strong> ${p.season}</p>
      <p><strong>Precio:</strong> ${formatPrice(p.price)}</p>
      <button>Comprar</button>
    </div>
  `;
}

function render(list){
  $("#productGrid").innerHTML = list.map(cardHTML).join("");
  $("#resultCount").textContent = `Mostrando ${list.length} productos`;
}

// Filtros
function applyFilters(){
  const q = $("#searchInput").value.trim().toLowerCase();
  const brand = $("#brandFilter").value;
  const size  = $("#sizeFilter").value;
  const season= $("#seasonFilter").value;
  const sort  = $("#sortSelect").value;

  let filtered = products.filter(p => {
    return (!brand || p.brand === brand) &&
           (!size  || p.size === size) &&
           (!season|| p.season === season) &&
           (!q || (p.model.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)));
  });

  if (sort === 'priceAsc')  filtered.sort((a,b)=>a.price-b.price);
  if (sort === 'priceDesc') filtered.sort((a,b)=>b.price-a.price);
  if (sort === 'size')      filtered.sort((a,b)=>rimFromSize(a.size)-rimFromSize(b.size));

  render(filtered);
}

// Eventos
["#searchInput","#brandFilter","#sizeFilter","#seasonFilter","#sortSelect"].forEach(sel=>{
  $(sel).addEventListener("input", applyFilters);
  $(sel).addEventListener("change", applyFilters);
});

$("#clearBtn").addEventListener("click", ()=>{
  $("#searchInput").value="";
  $("#brandFilter").value="";
  $("#sizeFilter").value="";
  $("#seasonFilter").value="";
  $("#sortSelect").value="";
  render(products);
});

// Inicial
render(products);

