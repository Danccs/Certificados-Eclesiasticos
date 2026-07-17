# ⛪ Sistema de Certificados Eclesiásticos Digitales

[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.1-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.19-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://sqlite.org/)
[![Sequelize](https://img.shields.io/badge/Sequelize-6.37-52B0E7?style=for-the-badge&logo=sequelize&logoColor=white)](https://sequelize.org/)

Una solución web profesional e integral diseñada para digitalizar, administrar, emitir y validar certificados eclesiásticos (**Bautizos**, **Matrimonios** y **Presentaciones**). El sistema permite al Secretario Local llevar un control estricto de los registros y generar documentos oficiales en PDF con códigos QR únicos para verificación de autenticidad en tiempo real.

---

## 🌟 Características Principales

*   **🔒 Control de Acceso Seguro (Auth):** Autenticación de usuarios mediante JWT y encriptación de contraseñas con bcryptjs.
*   **📑 Gestión Completa de Certificados:**
    *   **Bautizo:** Información del fiel, padres, padrinos, pastor, fecha de nacimiento y fecha del evento.
    *   **Matrimonio:** Información de ambos contrayentes, testigos, pastor oficiante y observaciones.
    *   **Presentación:** Datos del infante, padres, padrinos y pastor.
*   **🔢 Generador Inteligente de Folios:** Folios secuenciales e incrementales automáticos por tipo de certificado y año (ej: `BAU-2026-0001`, `MAT-2026-0001`).
*   **📄 Generación de PDF Profesional:** Descarga inmediata de certificados oficiales diseñados dinámicamente con **PDFKit**.
*   **🔍 Validación por Código QR:** Cada PDF contiene un código QR dinámico. Al ser escaneado, redirige a un portal de consulta pública que valida la legitimidad del folio en la base de datos sin requerir inicio de sesión.
*   **📊 Tablero de Control (Dashboard):** Estadísticas visuales del total de certificados emitidos y gráficos de distribución por tipo.
*   **🔎 Buscador y Filtros Avanzados:** Filtros por rango de fechas, tipo de documento, pastor oficiante, municipio y búsqueda de texto completo por nombre del fiel o número de folio.

---

## 🛠️ Tecnologías Utilizadas

### Frontend
*   **React 19** & **Vite 8** (Estructura de aplicación moderna y rápida).
*   **Lucide React** (Iconografía limpia y estilizada).
*   **CSS Limpio** (Estilos optimizados sin frameworks invasivos).

### Backend & Base de Datos
*   **Node.js** & **Express** (API REST sólida).
*   **Sequelize ORM** (Modelado y control de transacciones seguras en base de datos).
*   **SQLite** (Almacenamiento local ligero y portable para desarrollo ágil).
*   **PDFKit** (Diseño y composición tipográfica de archivos PDF).
*   **QRCode** (Generación de códigos de validación visuales).

---

## 📦 Estructura del Proyecto

El proyecto está organizado en una arquitectura desacoplada de Frontend y Backend:

```text
├── backend/
│   ├── config/             # Configuración de base de datos (Sequelize)
│   ├── controllers/        # Lógica de negocio (Autenticación y Certificados)
│   ├── middleware/         # Middleware de validación y protección de rutas
│   ├── models/             # Esquemas de datos (User, Certificate)
│   ├── routes/             # Puntos de entrada de la API (/api/auth, /api/certificates)
│   ├── utils/              # Generador de PDFs y utilidades auxiliares
│   ├── server.js           # Punto de inicio de la API de Node
│   └── database.sqlite     # Base de datos local autogenerada
│
├── frontend/
│   ├── public/             # Recursos estáticos
│   ├── src/
│   │   ├── components/     # Componentes React (Forms, Dashboard, Search, Validator)
│   │   ├── App.jsx         # Componente principal con el flujo de navegación
│   │   ├── main.jsx        # Punto de entrada de React
│   │   └── styles/         # Hojas de estilo CSS del sistema
│   └── vite.config.js      # Configuración del empaquetador Vite
```

---

## 🚀 Guía de Instalación y Configuración

### Prerrequisitos
Tener instalado [Node.js](https://nodejs.org/) (versión 18 o superior recomendada).

---

### 1. Configuración del Backend

1. Navega al directorio del backend:
   ```bash
   cd backend
   ```

2. Instala las dependencias necesarias:
   ```bash
   npm install
   ```

3. Crea un archivo `.env` en la raíz de la carpeta `backend` (puedes tomar de base los valores de ejemplo):
   ```ini
   PORT=5000
   JWT_SECRET=tu_clave_secreta_super_segura
   DB_DIALECT=sqlite
   DB_STORAGE=./database.sqlite
   ```

4. Inicia el servidor de desarrollo (usa `nodemon` para reinicios automáticos al guardar cambios):
   ```bash
   npm run dev
   ```
   > 💡 **Nota:** La base de datos SQLite se creará automáticamente la primera vez que inicies el servidor. Además, se insertará un usuario Administrador/Secretario por defecto.

---

### 2. Configuración del Frontend

1. Abre otra terminal y navega al directorio del frontend:
   ```bash
   cd ../frontend
   ```

2. Instala las dependencias del frontend:
   ```bash
   npm install
   ```

3. Inicia el servidor de desarrollo con Vite:
   ```bash
   npm run dev
   ```

4. Abre tu navegador en la URL indicada por la consola (usualmente `http://localhost:5173`).

---

## 🔑 Credenciales por Defecto (Entorno de Desarrollo)

Al inicializar la base de datos por primera vez, el backend siembra automáticamente un usuario inicial para realizar pruebas:

*   **Usuario:** `secretario`
*   **Contraseña:** `iglesia123`
*   **Rol:** `Secretario Local`

---

## 🛡️ Flujo de Validación Pública

1. **Generación del Documento:** Al crear un certificado, el sistema calcula un folio único y asocia una URL de verificación (ej. `http://localhost:5000/api/certificates/validate/BAU-2026-0001`).
2. **Generación del QR:** Dicha URL se codifica como un código QR incrustado directamente en el margen del documento PDF generado.
3. **Escaneo y Validación:** Cuando una entidad tercera escanea el QR, el sistema busca el folio correspondiente de forma pública en la base de datos y le muestra una pantalla interactiva con los detalles oficiales para constatar que el documento físico no ha sido adulterado.

---

## 📄 Licencia

Este proyecto es software privado de uso administrativo eclesial. Todos los derechos reservados.
