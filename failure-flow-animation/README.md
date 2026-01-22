# Animación de Flujo de Fallos - App Móvil

Esta es una animación creada con Remotion que visualiza cómo los fallos de una aplicación móvil viajan a través de diferentes canales de soporte y equipos dentro de una organización bancaria.

## 🎬 Descripción

La animación muestra partículas brillantes que representan fallos moviéndose a través de múltiples rutas:

1. **Ruta 1 (Rojo)**: Cliente → Call Center → Asesores → Áreas del Banco
2. **Ruta 2 (Naranja)**: Cliente → WhatsApp → SOS Digital → Áreas del Banco
3. **Ruta 3 (Naranja claro)**: WhatsApp → Correo → Product Owner → Gerentes de Productos
4. **Ruta 4 (Naranja rojizo)**: Formulario → Áreas del Banco → Gerentes de Productos

## 📋 Requisitos Previos

- Node.js (versión 18 o superior recomendada)
- npm o yarn

## 🚀 Instalación

Las dependencias ya están instaladas, pero si necesitas reinstalarlas:

```bash
npm install
```

## 📸 Configuración de la Imagen

**IMPORTANTE**: Necesitas colocar la imagen del diagrama de flujo en el proyecto:

1. Guarda tu imagen del diagrama como `flow-diagram.png`
2. Colócala en la carpeta `public/` (crea la carpeta si no existe)
3. La ruta completa debe ser: `public/flow-diagram.png`

## 🎥 Uso

### Ver la animación en tiempo real

Para iniciar el Remotion Studio y ver la animación en tu navegador:

```bash
npm start
```

Esto abrirá el Remotion Studio en `http://localhost:3000` donde podrás:
- Ver la animación en tiempo real
- Ajustar los parámetros
- Reproducir frame por frame
- Ver el timeline completo

### Renderizar el video

Para exportar la animación como archivo de video MP4:

```bash
npm run build
```

El video renderizado se guardará en `out/video.mp4`

## 🎨 Personalización

### Modificar las rutas de flujo

Edita el archivo `src/FailureFlow.tsx` y modifica el array `flowPaths` para:
- Cambiar las coordenadas de los nodos
- Añadir o eliminar rutas
- Cambiar los colores de las partículas
- Modificar las etiquetas

### Ajustar la duración

Edita `src/Root.tsx` y cambia el valor de `durationInFrames`:
- Valor actual: 450 frames (15 segundos a 30 fps)
- Para 10 segundos: `durationInFrames={300}`
- Para 20 segundos: `durationInFrames={600}`

### Cambiar la resolución

Edita `src/Root.tsx`:
- `width`: ancho en píxeles
- `height`: alto en píxeles

Valores actuales: 1920x1080 (Full HD)

## 🎯 Características de la Animación

- **Partículas animadas**: Representan los fallos moviéndose por el sistema
- **Efecto de pulso**: Las partículas pulsan para mayor visibilidad
- **Estelas**: Cada partícula deja una estela luminosa
- **Múltiples oleadas**: Varios fallos ocurren simultáneamente
- **Colores diferenciados**: Cada ruta tiene su propio color
- **Leyenda interactiva**: Muestra el origen y destino de cada ruta
- **Animaciones suaves**: Usa spring animations para movimientos naturales

## 📦 Estructura del Proyecto

```
failure-flow-animation/
├── src/
│   ├── index.ts          # Punto de entrada
│   ├── Root.tsx          # Configuración de composiciones
│   └── FailureFlow.tsx   # Componente principal de animación
├── public/
│   └── flow-diagram.png  # (REQUERIDO) Tu imagen del diagrama
├── out/                  # Video renderizado
├── package.json
├── tsconfig.json
└── remotion.config.ts
```

## 🔧 Problemas Comunes

### La imagen no se muestra
- Verifica que `flow-diagram.png` esté en la carpeta `public/`
- Asegúrate de que el nombre del archivo coincida exactamente
- Reinicia el servidor Remotion (`npm start`)

### Las coordenadas no coinciden
- Las coordenadas en `flowPaths` son aproximadas
- Ajústalas según tu imagen específica
- Usa el Remotion Studio para ver los cambios en tiempo real

### El video tarda mucho en renderizar
- Es normal, el renderizado puede tomar varios minutos
- Reduce `durationInFrames` para videos más cortos
- Reduce la resolución si no necesitas Full HD

## 📚 Recursos

- [Documentación de Remotion](https://www.remotion.dev/docs)
- [Ejemplos de Remotion](https://www.remotion.dev/showcase)
- [API Reference](https://www.remotion.dev/api)

## 🤝 Contribuciones

Para modificar la animación:
1. Haz tus cambios en `src/FailureFlow.tsx`
2. Prueba con `npm start`
3. Renderiza con `npm run build`

## 📄 Licencia

ISC
