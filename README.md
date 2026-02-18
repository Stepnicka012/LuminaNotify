# LuminaNotify

Una librería de notificaciones tipo "Toast" para la web moderna. Ligera, agnóstica a frameworks y diseñada con animaciones físicas fluidas y efectos visuales de alta calidad.

## Características

* **Sin Dependencias:** Construido con Web Components nativos y TypeScript. Funciona en cualquier sitio web.
* **Animaciones Físicas:** Uso de `linear()` easing para movimientos elásticos y naturales.
* **Efecto Gooey:** Transiciones orgánicas entre estados utilizando filtros SVG.
* **Promesas Nativas:** Manejo automático de estados de carga (`loading`, `success`, `error`) para operaciones asíncronas.
* **Interactivo:** Soporta gestos de deslizamiento (swipe) para descartar y expansión al pasar el mouse.

## Instalación

Como es una librería para web vanilla, solo necesitas los archivos compilados (`.js` y `.css`) en tu proyecto.

1. Asegúrate de compilar tu `lumina.scss` a `lumina.css`.
2. Compila/transpila tu `index.ts` a `lumina.js`.

---

## 🛠 Integración (HTML Vanilla)

Para integrar LuminaNotify, necesitas dos cosas:

1. Vincular la hoja de estilos con el atributo `data-lumina` (importante para que el Shadow DOM la encuentre).
2. Importar la librería como módulo.

Agrega esto en el `<head>` o al final del `<body>` de tu `index.html`:

```html
<link rel="stylesheet" href="./css/lumina.css" data-lumina>

<script type="module">
  import { lumina } from './js/lumina.js';

  // Hacemos 'lumina' global para usarlo en cualquier parte (opcional)
  window.lumina = lumina; 
</script>

```

---

## Ejemplos de Uso

### 1. Notificaciones Básicas

Lanza notificaciones simples con una sola línea de código.

```javascript
// Éxito simple
lumina.success({
  title: '¡Listo!',
  description: 'Los cambios se han guardado correctamente.'
});

// Error
lumina.error({
  title: 'Error de conexión',
  description: 'No pudimos conectar con el servidor.'
});

// Información con posición personalizada
lumina.info({
  title: 'Nueva actualización',
  position: 'bottom-center' // top-left, top-right, etc.
});

```

### 2. Promesas (Async/Await) ✨

Esta es la característica estrella. Pasa una promesa (como un `fetch`) y Lumina manejará el estado de carga y el resultado automáticamente.

```javascript
const guardarDatos = async () => {
  // Simulación de una petición a API
  const miPeticion = new Promise((resolve, reject) => {
    setTimeout(() => {
        // Cambia a true/false para probar
        Math.random() > 0.5 ? resolve("ID: 8842") : reject("Timeout");
    }, 2000);
  });

  // Lumina maneja la UI por ti:
  lumina.promise(miPeticion, {
    loading: {
      title: 'Guardando...',
      icon: null // Usa el spinner por defecto
    },
    success: (data) => ({
      title: 'Guardado',
      description: `Referencia creada: ${data}`
    }),
    error: (err) => ({
      title: 'Falló el guardado',
      description: `Causa: ${err}`
    })
  });
};

```

### 3. Notificaciones con Acción

Añade un botón interactivo dentro de la notificación.

```javascript
lumina.action({
  title: 'Archivo eliminado',
  description: 'El elemento se movió a la papelera.',
  button: {
    label: 'Deshacer',
    onClick: () => {
      console.log('Acción deshecha');
      // Lógica para restaurar...
    }
  }
});

```

---

## ⚙️ Opciones de Configuración

Todas las notificaciones aceptan un objeto `LuminaOptions`:

| Propiedad | Tipo | Descripción |
| --- | --- | --- |
| `title` | `string` | Título principal de la notificación. |
| `description` | `string` | Texto secundario detallado. |
| `state` | `string` | `'success'`, `'error'`, `'warning'`, `'info'`, `'loading'`, `'action'`. |
| `position` | `string` | `'top-left'`, `'top-center'`, `'top-right'`, etc. (Default: `top-right`). |
| `duration` | `number` | Tiempo en ms antes de desaparecer (Default: 6000). Usa `null` para mantenerla fija. |
| `icon` | `string` | SVG en formato string para reemplazar el icono por defecto. |
| `fill` | `string` | Color de fondo personalizado (HEX, RGB, etc.). |
