# Sistema Web de Gestión de Inventario y Ventas - Botica "Nova Salud"

Trabajo Final de Curso - Fullstack Developer Software (SENATI)

## 📌 Tecnologías Utilizadas
* **Backend Framework:** NestJS 11
* **ORM:** TypeORM
* **Base de Datos:** SQLite (`better-sqlite3` / `botica.db`)
* **Validaciones:** `class-validator` y `class-transformer`

---

## 🚀 Instalación y Ejecución

```bash
# 1. Ingresar a la carpeta del proyecto
cd C:\Users\Pc\.gemini\antigravity\scratch\botica-backend

# 2. Iniciar en modo desarrollo
npm run start:dev
```

El servidor iniciará en: `http://localhost:3000`  
*La base de datos SQLite se creará y sembrará automáticamente con medicamentos, lotes y clientes iniciales.*

---

## 📡 Endpoints Principales

### 1. Inventario & Alertas
* `GET /inventory/dashboard`: Resumen de métricas (total productos, unidades totales, valorización del inventario y alertas).
* `GET /inventory/alerts/low-stock`: Lista de productos con stock igual o inferior al stock mínimo.
* `GET /inventory/alerts/expiring?days=60`: Lotes de medicamentos próximos a expirar en los próximos N días.

### 2. Catálogo de Medicamentos
* `GET /products`: Catálogo completo de fármacos con sus lotes y categorías.
* `GET /products?search={texto}`: Búsqueda rápida por nombre comercial, principio activo o código de barra.
* `GET /products/barcode/{codigo}`: Búsqueda instantánea por lector de código de barras.
* `GET /products/equivalents?activeIngredient={principioActivo}`: Sugerencia de medicamentos sustitutos/genéricos cuando un producto comercial esté agotado.
* `POST /products`: Registro de nuevo medicamento.
* `POST /products/:id/batches`: Ingreso de nuevo lote con fecha de caducidad.

### 3. Registro de Ventas (Transaccional & FEFO)
* `POST /sales`: Registra una venta atómica, descuenta stock con política **FEFO** (*First Expired, First Out*) y emite alertas de reposición si se cruza el umbral mínimo.
* `GET /sales`: Listado histórico de ventas y detalles.

**Ejemplo de Payload para `POST /sales`:**
```json
{
  "customerId": 1,
  "paymentMethod": "YAPE",
  "items": [
    {
      "productId": 2,
      "quantity": 2
    }
  ]
}
```

### 4. Clientes
* `GET /customers`: Listado y búsqueda por DNI o nombre.
* `POST /customers`: Registro de cliente.
