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
  - **Notificaciones Stacked (Toasts)**: Avisos flotantes y animados para confirmaciones de acciones de guardado, duplicación y eliminación.
  - **Controles Personalizados**: Inputs numéricos sin flechas nativas molestas, áreas de texto estéticas, selectores con iconos vectoriales integrados, barras de rotación con perillas de degradado interactivo e interruptores deslizantes de estilo iOS.
* **Librería de Mobiliario CAD Detallada**:
  - Símbolos interactivos con diseños técnicos (camas, burós, tocadores, armarios, sofás, escritorios, sillas, escaleras, puertas con arco de apertura, ventanas arquitectónicas, etc.).
  - Notas de texto dinámicas para rotular zonas del plano.
* **Herramientas de Exportación Avanzadas**:
  - Guarda tu espacio de trabajo como archivo `.json` local para importarlo y editarlo cuando quieras.
  - Exporta el plano en formato **vectorial SVG limpio** (removiendo controles de edición y con tipografía optimizada para visualizadores externos).
  - Exporta imágenes **PNG de alta resolución** listas para imprimir o enviar.
* **Selección Múltiple y Operaciones en Lote**:
  - **Arrastre de Caja de Selección (Marquee)**: Selecciona múltiples objetos trazando un recuadro de arrastre sobre el fondo; los elementos se iluminan en tiempo real con un borde y resplandor de selección.
  - **Selección Acumulativa**: Mantén pulsada la tecla `Shift` o `Ctrl` al hacer clic para agrupar múltiples elementos de manera fluida.
  - **Operaciones en Lote**: Arrastra, duplica, cambia de color o elimina múltiples objetos en grupo manteniendo sus distancias relativas.
* **Navegación e Interacción Avanzada**:
  - **Desplazamiento del Lienzo (Panning)**: Arrastra el fondo manteniendo presionada la **Barra Espaciadora** (cursor `grab`/`grabbing`), el botón central o el botón derecho del ratón.
  - **Menú Contextual (Clic Derecho)**: Menú flotante y de diseño glassmorphic con opciones rápidas (Copiar, Pegar, Renombrar, Duplicar, Eliminar, Colores rápidos, Vaciar lienzo).
  - **Indicadores y Atajos de Teclado**: Soporte para comandos rápidos (`Ctrl+C`, `Ctrl+V`, `Ctrl+D`, `Supr`, `R`) con etiquetas recordatorias integradas en el menú contextual y un botón de ayuda flotante persistente en la esquina del lienzo con el atajo global `Ctrl + /` para abrir el manual interactivo.
* **Historial Completo**: Sistema integrado de **Deshacer (Undo)** y **Rehacer (Redo)** con atajos de teclado (`Ctrl + Z` / `Ctrl + Y`).

---

## 🚀 Instalación y Desarrollo Local

Asegúrate de contar con **Node.js** y el gestor de paquetes **pnpm** instalado en tu sistema.

### 1. Instalación de dependencias
Ejecuta el siguiente comando en la raíz del proyecto para descargar e instalar los paquetes de manera rápida y segura:
```bash
pnpm install
```

### 2. Iniciar el Servidor de Desarrollo
Para levantar el servidor interactivo local en tiempo real:
```bash
pnpm run dev
```
La aplicación estará disponible en `http://localhost:5173`.

### 3. Compilación de Producción (Build)
Para compilar y empaquetar la aplicación en código minificado optimizado para producción (carpeta `/dist`):
```bash
pnpm run build
```

---

## 🎮 Instrucciones de Uso

1. **Ajusta las Paredes**: Elige uno de nuestros preajustes (*Rectángulo*, *Forma en L*, o *Asimétrico*) o modifica las medidas de cada pared escribiendo su longitud en el panel lateral izquierdo. También puedes arrastrar los vértices de las esquinas en el lienzo.
2. **Añade Mobiliario**: Haz clic en cualquier mueble de la librería del panel izquierdo para insertarlo en el cuarto.
3. **Mueve y Rota**: Arrastra los objetos para reposicionarlos. Gira los elementos seleccionados usando el control circular superior o introduce el ángulo exacto en el inspector del panel derecho.
4. **Dimensionado Preciso**: Cambia el ancho y largo de cualquier objeto desde el panel de propiedades para ajustarlo a las medidas de tu mobiliario real.
5. **Configura la Rejilla**: Activa o desactiva la cuadrícula visual y el snapping magnético (5cm, 10cm, 20cm, 50cm) para alinear tus muebles con facilidad.

---

## 📄 Licencia

Este proyecto está bajo la [Licencia MIT](LICENSE). Siéntete libre de usarlo, modificarlo y distribuirlo de manera comercial o privada.
