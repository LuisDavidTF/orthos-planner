# Orthos 📐

**🌐 Aplicación en vivo:** [orthos.markdify.tech](https://orthos.markdify.tech)

> **Planificador de Habitaciones 2D Online Gratis** | **Diseño de Interiores 2D Gratis y Sin Registro**
> Un simulador de cuarto online premium y privado que procesa todo localmente en tu navegador.

Una aplicación web interactiva y premium en 2D diseñada para ayudar a los usuarios a planificar, distribuir y organizar muebles en habitaciones con medidas reales. Construida sobre **React**, **TypeScript**, **Vite** y gráficos vectoriales **SVG** de alta definición.

Esta herramienta opera bajo la filosofía de **Privacidad Absoluta (Zero-Server)**: toda la computación, el renderizado de planos y el guardado de datos ocurre 100% de forma local en la memoria RAM y almacenamiento de tu navegador web. Tus planos e información personal nunca viajan por internet.

---

## ✨ Características Principales

* **Habitaciones Asimétricas y Poligonales**:
  - Ajusta perfiles complejos de habitaciones (formas en L, en T, trapecios, paredes diagonales, etc.).
  - **Esquinas Arrastrables**: Modifica los vértices del cuarto arrastrándolos con precisión magnética (ajuste a rejilla).
  - **Divisor de Paredes**: Añade esquinas haciendo clic en los botones `(+)` situados en el punto medio de cada segmento.
  - **Eliminación de Esquinas**: Haz doble clic en cualquier esquina para removerla (con un mínimo de 3 esquinas).
* **Medidas y CAD Acotado**:
  - Etiquetas de medidas reales orientadas automáticamente al ángulo de cada pared.
  - Conversión instantánea de unidades: **Centímetros (cm)**, **Metros (m)**, **Pulgadas (in)** y **Pies (ft)**.
  - **Guías de Distancia Dinámicas**: Al seleccionar cualquier mueble, se proyectan guías ortogonales hacia las paredes del cuarto mostrando las distancias exactas.
* **Componentes de Interfaz Premium Personalizados (Custom UI)**:
  - **Modales Glassmorphic**: Diálogos de confirmación y alertas integrados con efectos de desenfoque y contrastes oscuros.
  - **Notificaciones Stacked (Toasts)**: Avisos flotantes y animados para confirmaciones de acciones de guardado, duplicación y eliminación. Soporte para tipos: éxito, error, info y advertencia.
  - **Controles Personalizados**: Inputs numéricos, áreas de texto estéticas, selectores con iconos vectoriales integrados e interruptores deslizantes de estilo iOS.
* **Librería de Mobiliario CAD Detallada**:
  - Símbolos interactivos con diseños técnicos (camas, burós, tocadores, armarios, sofás, escritorios, sillas, escaleras, puertas con arco de apertura, ventanas arquitectónicas, etc.).
  - Notas de texto dinámicas para rotular zonas del plano.
* **Herramientas de Exportación Avanzadas**:
  - Guarda tu espacio de trabajo como archivo `.json` local para importarlo y editarlo cuando quieras.
  - Exporta el plano en formato **vectorial SVG limpio** (removiendo controles de edición y con tipografía optimizada para visualizadores externos).
  - Exporta imágenes **PNG de alta resolución** listas para imprimir o enviar.
* **Selección Múltiple y Operaciones en Lote**:
  - **Arrastre de Caja de Selección (Marquee)**: Selecciona múltiples objetos trazando un recuadro de arrastre sobre el fondo; los elementos se iluminan en tiempo real.
  - **Selección Acumulativa**: Mantén pulsada la tecla `Shift` o `Ctrl` al hacer clic para agrupar múltiples elementos de manera fluida.
  - **Operaciones en Lote**: Arrastra, duplica, cambia de color o elimina múltiples objetos en grupo manteniendo sus distancias relativas.
* **Navegación e Interacción Avanzada**:
  - **Desplazamiento del Lienzo (Panning)**: Arrastra el fondo manteniendo presionada la **Barra Espaciadora**, el botón central o el botón derecho del ratón.
  - **Menú Contextual (Clic Derecho)**: Menú flotante glassmorphic con opciones rápidas (Copiar, Pegar, Renombrar, Duplicar, Eliminar, Colores rápidos, Vaciar lienzo).
  - **Atajos de Teclado**: Soporte para `Ctrl+C`, `Ctrl+V`, `Ctrl+D`, `Supr`, `R` y `Ctrl+/` para abrir el manual interactivo.
* **Historial Completo**: Sistema integrado de **Deshacer (Undo)** y **Rehacer (Redo)** con atajos de teclado (`Ctrl + Z` / `Ctrl + Y`).
* **✨ Panel de Inteligencia Espacial Premium**:
  - **Rosa de los Vientos Interactiva**: Brújula clickeable en el lienzo que rota suavemente al hacer clic, cambiando la orientación cardinal del cuarto (`N → E → S → O`) para simular la entrada del sol por las ventanas.
  - **Haz de Luz Solar Dinámico**: Simula y grafica rayos de sol amarillos translúcidos desde las ventanas en base a la orientación cardinal activa.
  - **Pasillos de Circulación Visuales**: Zonas punteadas alrededor de puertas, camas, roperos y escaleras que indican el espacio mínimo de libre circulación requerido por cada mueble.
  - **Medidor Circular de Eficiencia Espacial**: Indicador en tiempo real (0–100%) con tres sub-métricas: Pasillos y Flujo, Luz y Ventanas, Orden y Muros. Cambia de color según el nivel (verde, ámbar, rojo).
  - **Checklist de Diagnóstico en Tiempo Real**: Evalúa la habitación constantemente y emite alertas (mueble tapando puerta, cabecera sobre ventana, tocador tapando ventana, burós lejos de la cama) o felicitaciones cuando todo está bien distribuido.
  - **Perfiles de Sugerencia**: Elige entre tres modos de análisis: *Maximizar Espacio Libre*, *Optimizado para el Descanso* o *Optimizado para Trabajo/Estudio*, y el panel ajusta sus recomendaciones en tiempo real.

---

## 🚀 Instalación y Desarrollo Local

Asegúrate de contar con **Node.js** y el gestor de paquetes **pnpm** instalado en tu sistema.

### 1. Instalación de dependencias
```bash
pnpm install
```

### 2. Iniciar el Servidor de Desarrollo
```bash
pnpm run dev
```
La aplicación estará disponible en `http://localhost:5173`.

### 3. Compilación de Producción (Build)
```bash
pnpm run build
```

---

## 🎮 Instrucciones de Uso

1. **Ajusta las Paredes**: Elige uno de nuestros preajustes (*Rectángulo*, *Forma en L*, o *Asimétrico*) o modifica las medidas de cada pared desde el panel lateral izquierdo. También puedes arrastrar los vértices de las esquinas en el lienzo directamente.
2. **Añade Mobiliario**: Haz clic en cualquier mueble de la librería del panel izquierdo para insertarlo en el cuarto.
3. **Mueve y Rota**: Arrastra los objetos para reposicionarlos. Gira los elementos seleccionados usando el control circular superior o introduce el ángulo exacto en el inspector del panel derecho.
4. **Dimensionado Preciso**: Cambia el ancho y largo de cualquier objeto desde el panel de propiedades para ajustarlo a las medidas de tu mobiliario real.
5. **Analiza la Distribución**: Ve a la pestaña **✨ Optimizar** en el panel derecho para ver el medidor de eficiencia y el diagnóstico en tiempo real. Ajusta la orientación de la Rosa de los Vientos (haciendo clic en ella) para simular la entrada del sol.
6. **Exporta tu Plano**: Guarda como `.json` para continuar editando más tarde, o exporta como SVG o PNG para impresión o compartir.

---

## 📄 Licencia

Este proyecto está bajo la [Licencia MIT](LICENSE). Siéntete libre de usarlo, modificarlo y distribuirlo de manera comercial o privada.
