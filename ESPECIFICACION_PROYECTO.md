# ESPECIFICACIÓN TÉCNICA DEL PROYECTO: GOMERÍA JLR

## 1. DESCRIPCIÓN GENERAL Y OBJETIVO
Plataforma web comercial orientada a una gomería y taller de neumáticos de zona sur (Gran Buenos Aires). Permite a los clientes:
- Explorar el catálogo de neumáticos en tiempo real.
- Filtrar por marca, medida (rodado), temporada y precio.
- Gestionar una lista de neumáticos seleccionados en el carrito de compras (persistente en LocalStorage).
- Enviar el pedido/consulta directamente por WhatsApp para recibir cotización, disponibilidad y formas de pago.
- Consultar servicios mecánicos y de gomería (alineación, balanceo, parches).
- Contactarse y crear una cuenta de usuario.

---

## 2. STACK TECNOLÓGICO
```text
[Frontend Estructural]  --> HTML5 semántico
[Estilos y Diseño]      --> SCSS / CSS3 nativo + Bootstrap 5.3 + FontAwesome 6
[Lógica de Cliente]     --> JavaScript moderno (ES6+, DOM API, LocalStorage, WhatsApp URL API)
[Backend / Base Datos]  --> Google Sheets como CMS Headless (publicado en CSV)
[Librería de Ingesta]   --> PapaParse 5.4.1 (Parseo de CSV remoto en el cliente)
[Control de Versiones]  --> Git y GitHub
```

---

## 3. ARQUITECTURA DE ARCHIVOS
```text
d:\JLR gomeria\
│
├── index.html                   --> Landing Page principal
├── css/
│   ├── style.css                --> CSS compilado
│   └── style.css.map            --> Source map de Sass
├── scss/
│   ├── abstracts/               --> Variables, mixins y funciones
│   ├── base/                    --> Reset, tipografías y bases
│   ├── components/              --> Botones, tarjetas, inputs
│   ├── layout/                  --> Header, footer, navbar
│   └── pages/                   --> Estilos específicos por vista
├── images/                      --> Assets gráficos (WebP de alto rendimiento)
├── javaScript/
│   ├── products.js              --> Ingesta de Google Sheets, filtros y renderizado
│   └── cart.js                  --> Lógica del carrito, cantidades y derivación a WhatsApp
└── pages/
    ├── products.html            --> Catálogo con filtros y grilla dinámica
    ├── carrito.html             --> Vista del carrito (sin precios) y consulta por WhatsApp
    ├── service.html             --> Listado de servicios del taller
    ├── contact.html             --> Formulario de contacto y ubicación
    ├── createAccount.html       --> Formulario de registro de usuarios
    └── politics.html            --> Términos de garantía y políticas
```

---

## 4. WORKFLOW 1: FLUJO DE CARGA DE PRODUCTOS (HEADLESS CMS)

Este flujo describe cómo viaja la información desde la planilla hasta la pantalla del usuario:

```text
[ Administrador ]
       │
       ▼
Actualiza precios/stock/medidas en Google Sheets
       │
       ▼
Google Sheets publica cambios como CSV vía URL pública
       │
       ▼
[ Cliente abre /pages/products.html ]
       │
       ▼
PapaParse descarga el archivo CSV vía HTTP GET
       │
       ├─► [ ¿Fallo de red o CORS? ] ──► Muestra mensaje explicativo en pantalla
       │
       ▼
Mapeo y sanitización de datos (products.js):
   - id: correlativo automático
   - brand / model / size / season: limpieza de espacios (.trim())
   - price: procesado con parsePrice() (muestra valor numérico o "Consultar")
   - img: enlace a imagen del neumático
       │
       ▼
Renderizado en el DOM (#productGrid):
   - Generación de tarjetas con cardHTML()
   - Botón de acción: "Agregar al carrito" con data-id
   - Actualización del contador: "Mostrando X productos"
```

---

## 5. WORKFLOW 2: FILTRADO Y BÚSQUEDA EN TIEMPO REAL

```text
[ Usuario interactúa con la barra de filtros ]
       │
       ├─► Escribe en el buscador (#searchInput)
       ├─► Selecciona una marca (#brandFilter)
       ├─► Elige una medida de llanta (#sizeFilter)
       ├─► Elige temporada (#seasonFilter)
       └─► Selecciona criterio de orden (#sortSelect)
       │
       ▼
Función: applyFilters()
       │
       ├─► Filtra el array global 'products' en memoria (sin nuevas peticiones HTTP)
       ├─► Aplica ordenamiento:
       │      ├─► Precio Ascendente / Descendente
       │      └─► Rodado mediante rimFromSize() (/ [rR](\d+) /)
       │
       ▼
Re-renderizado instantáneo de la grilla (#productGrid)
```

---

## 6. WORKFLOW 3: CICLO DE VIDA DEL CARRITO Y CONSULTA POR WHATSAPP

```text
[ ACCIÓN: Agregar al Carrito ]
       │
       ▼
Usuario pulsa botón "Agregar al carrito" en una tarjeta de producto
       │
       ▼
addToCart(product):
   - Busca si el producto ya existe en el array 'cart' por su ID
   - Si existe: incrementa la propiedad 'qty'
   - Si no existe: inserta nuevo objeto con marca, modelo, medida, temporada y 'qty = 1'
       │
       ▼
saveCart():
   - Serializa a JSON y guarda en 'localStorage.setItem("cart", ...)'
   - Dispara updateCartCount() / updateCartUI()
       │
       ▼
Badge del carrito (#cartCount) se actualiza en la barra de navegación de toda la web
```

```text
[ ACCIÓN: Gestión dentro de /pages/carrito.html ]
       │
       ▼
renderCart() lee localStorage:
   │
   ├─► Si cart.length === 0:
   │      - Muestra alerta: "El carrito está vacío"
   │      - Total de neumáticos = 0 unidades
   │
   └─► Si hay productos:
          - Dibuja tarjeta por cada neumático (imagen, marca, modelo, medida, temporada)
          - NO muestra precios ni subtotales monetarios en el carrito
          - Botones [+]: dispara increaseQty(index) -> guarda y re-renderiza
          - Botones [-]: dispara decreaseQty(index) -> decrementa o elimina si llega a 0
          - Botón [Tacho]: dispara removeItem(index) -> elimina del array
          - Calcula y muestra el Total de neumáticos seleccionados en unidades
```

```text
[ ACCIÓN: Consultar por WhatsApp ]
       │
       ▼
Usuario presiona "Consultar por WhatsApp" (#checkoutBtn)
       │
       ├─► Si el carrito está vacío: Alerta indicando agregar productos
       │
       └─► Si tiene productos:
              - checkoutWhatsApp() genera un mensaje de texto formateado con:
                   * Saludo y solicitud de cotización/stock
                   * Detalle de cada neumático: Marca, Modelo, Medida y Cantidad
              - Construye la URL de la API de WhatsApp:
                   https://wa.me/{WHATSAPP_PHONE}?text={mensaje_codificado}
              - Abre WhatsApp Web o la App móvil en una nueva pestaña
```

---

## 7. ESQUEMA DE DATOS (GOOGLE SHEETS)

Para que el sistema procese correctamente los neumáticos, la hoja debe conservar esta estructura de encabezados en la Fila 1:

| Campo | Tipo | Requerido | Descripción / Ejemplo |
| :--- | :--- | :---: | :--- |
| **id** | Número | Opcional | ID de referencia (ej: `1`, `2`) |
| **brand** | Texto | Sí | Marca del neumático (`Michelin`, `Pirelli`, `Fate`) |
| **model** | Texto | Sí | Modelo comercial (`Sentiva AR-360`, `Primacy 4`) |
| **size** | Texto | Sí | Medida con formato estándar (`175/70 R14`) |
| **season** | Texto | No | `Verano`, `Invierno`, `All Season` |
| **price** | Número/Texto | No | Precio numérico (ej: `125000`). Si está vacío o en 0 muestra *"Consultar"* |
| **img** | URL | No | Enlace público a la foto del neumático |

---

## 8. NORMAS DE DESARROLLO Y MANTENIMIENTO
1. **Entorno local de pruebas:**
   - Debe ejecutarse obligatoriamente bajo un servidor web local (**Live Server** en VS Code) para permitir las solicitudes asíncronas de PapaParse a Google Sheets sin bloqueos de origen (`file://`).
2. **Número de WhatsApp:**
   - Para cambiar el destinatario de las consultas, modificar la constante `WHATSAPP_PHONE` en `javaScript/cart.js` (ej: `"5491112345678"`).
3. **Flujo de despliegue (Git):**
   ```bash
   git status                       # Revisar cambios
   git add .                        # Preparar archivos
   git commit -m "Tipo: descripción" # Registrar cambio
   git push origin main             # Sincronizar con GitHub
   ```
