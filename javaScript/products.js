// Datos de productos
const products = [
  { id:1, brand:'Michelin', model:'Primacy 4', size:'205/55 R16', season:'All Season', price:159999, img:'https://via.placeholder.com/300x200?text=Michelin+Primacy+4' },
  { id:2, brand:'Pirelli', model:'Cinturato P1', size:'195/65 R15', season:'All Season', price:129999, img:'https://via.placeholder.com/300x200?text=Pirelli+Cinturato+P1' },
  { id:3, brand:'Bridgestone', model:'Turanza T005', size:'225/45 R17', season:'All Season', price:179999, img:'https://via.placeholder.com/300x200?text=Bridgestone+Turanza+T005' },
  { id:4, brand:'Fate', model:'Prestiva', size:'175/45 R14', season:'All Season', price:120999, img:'https://calzetta.com.ar/producto/175-70r14-84t-fate-prestiva/'}
];

// Helpers
const $ = sel => document.querySelector(sel);
const $$ = sel => document.querySelectorAll(sel);
const formatPrice = n => n.toLocaleString('es-AR', { style:'currency', currency:'ARS', maximumFractionDigits:0 });
const rimFromSize = size => parseInt(size.split("R")[1]);

// Render de productos
function cardHTML(p){
  return `
    <div class="col-md-4">
      <div class="card h-100 shadow-sm">
        <img src="${p.img}" class="card-img-top" alt="${p.model}">
        <div class="card-body">
          <h5 class="card-title">${p.brand} ${p.model}</h5>
          <p class="card-text">
            <strong>Medida:</strong> ${p.size}<br>
            <strong>Temporada:</strong> ${p.season}<br>
            <strong>Precio:</strong> ${formatPrice(p.price)}
          </p>
        </div>
      </div>
    </div>`;
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
