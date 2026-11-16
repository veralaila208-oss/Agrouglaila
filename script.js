/* ==========================================================
   AGROGEO UG - LÓGICA DEL SIMULADOR DUAL Y MOTOR TÉCNICO
   Autora: Ing. Laila Vera Carrasco - Universidad de Guayaquil (2026)
   ========================================================== */

// Variables globales del estado del simulador
let vistaActual = 'intro';
let currentSlide = 1;
let subTabEstudiante = 'lab';

// Estado del Video Animado
let videoState = {
    cultivo: 'cacao',
    isPlaying: true,
    progress: 0,
    timer: 0,
    interval: null
};

// Estado del Laboratorio Estudiante
let labState = {
    tipoTerreno: 'rectangulo',
    ancho: 50,
    largo: 40,
    m: 1.0,
    b: 10,
    distancia: 3.0
};

let chartPoblacionInstance = null;

// Inicialización general al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    cambiarVista('intro');
    inicializarGraficaPoblacion();
    actualizarSimulacionLab();
    iniciarVideoAnimado();
    generarTalleresDinamicos();
});

// Navegación de Vistas Principales
function cambiarVista(vista) {
    vistaActual = vista;
    document.querySelectorAll('.vista-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('bg-[#0072CE]', 'text-white', 'shadow-md');
        btn.classList.add('bg-[#001226]', 'text-slate-300', 'hover:bg-[#003366]');
    });

    const targetVista = document.getElementById(`vista-${vista}`);
    const targetBtn = document.getElementById(`tab-${vista}`);

    if (targetVista) targetVista.classList.remove('hidden');
    if (targetBtn) {
        targetBtn.classList.remove('bg-[#001226]', 'text-slate-300', 'hover:bg-[#003366]');
        targetBtn.classList.add('bg-[#0072CE]', 'text-white', 'shadow-md');
    }

    if (vista === 'intro') {
        actualizarIntroCanvas();
    } else if (vista === 'videos') {
        redibujarVideoCanvas();
    } else if (vista === 'estudiante') {
        actualizarSimulacionLab();
        if (chartPoblacionInstance) chartPoblacionInstance.update();
    }
}

// Navegación de Diapositivas (Vista 1)
function cambiarSlide(direccion) {
    currentSlide += direccion;
    if (currentSlide > 4) currentSlide = 4;
    if (currentSlide < 1) currentSlide = 1;
    mostrarSlideActual();
}

function irSlide(num) {
    currentSlide = num;
    mostrarSlideActual();
}

function mostrarSlideActual() {
    document.querySelectorAll('.slide-pane').forEach((pane, idx) => {
        if (idx + 1 === currentSlide) {
            pane.classList.remove('hidden');
        } else {
            pane.classList.add('hidden');
        }
    });

    const slideInd = document.getElementById('slide-indicator');
    if (slideInd) slideInd.innerText = `Diapositiva ${currentSlide} de 4`;
    
    // Actualizar puntos
    const dotsContainer = document.getElementById('slide-dots');
    if (dotsContainer) {
        const dots = dotsContainer.children;
        for (let i = 0; i < dots.length; i++) {
            if (i + 1 === currentSlide) {
                dots[i].className = 'w-3 h-3 rounded-full bg-cyan-400 inline-block cursor-pointer';
            } else {
                dots[i].className = 'w-3 h-3 rounded-full bg-slate-700 inline-block cursor-pointer';
            }
        }
    }

    if (currentSlide === 1 || currentSlide === 2 || currentSlide === 3) {
        setTimeout(actualizarIntroCanvas, 50);
    }
}

// Canvas Intro
function actualizarIntroCanvas() {
    const mSlider = document.getElementById('slider-intro-m');
    const bSlider = document.getElementById('slider-intro-b');
    const m1 = mSlider ? parseFloat(mSlider.value) : 0.5;
    const b1 = bSlider ? parseFloat(bSlider.value) : 20;

    const valM = document.getElementById('val-intro-m');
    const valB = document.getElementById('val-intro-b');
    if (valM) valM.innerText = m1;
    if (valB) valB.innerText = b1 + ' m';

    // Canvas 1
    const c1 = document.getElementById('introCanvas1');
    if (c1) {
        const ctx1 = c1.getContext('2d');
        ctx1.clearRect(0, 0, c1.width, c1.height);
        dibujarCuriculaBase(ctx1, c1.width, c1.height);
        // Dibujar surcos simulados
        ctx1.strokeStyle = '#00f2fe';
        ctx1.lineWidth = 2;
        ctx1.beginPath();
        for(let i=0; i<4; i++) {
            ctx1.moveTo(20, 30 + i*40);
            ctx1.lineTo(300, 50 + i*40 + m1*20);
        }
        ctx1.stroke();
    }

    // Canvas 2 y 3
    ['introCanvas2', 'introCanvas3'].forEach(id => {
        const c = document.getElementById(id);
        if (c) {
            const ctx = c.getContext('2d');
            ctx.clearRect(0, 0, c.width, c.height);
            dibujarCuriculaBase(ctx, c.width, c.height);
            
            // Línea y = mx + b simulada
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(0, c.height - (b1));
            ctx.lineTo(c.width, c.height - (b1 + m1 * 100));
            ctx.stroke();

            // Puntos de cultivo
            ctx.fillStyle = '#10b981';
            for(let x=30; x<c.width; x+=40) {
                let y = c.height - (b1 + m1 * x * 0.5);
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI*2);
                ctx.fill();
            }
        }
    });
}

function dibujarCuriculaBase(ctx, w, h) {
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 20) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 20) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
}

// Videos Demostrativos en Canvas
const datosCultivosVideos = {
    cacao: { titulo: "Cacao Nacional CCN-51", desc: "Cultivo perenne de alta demanda en Ecuador. Requiere marco real de 3x3m para insoluminación y evitar monilia.", distancia: "3.0 metros", densidad: "1,111 plantas / ha", cuadras: "~785 plantas / cuadra", m: 0.5, b: 20 },
    banano: { titulo: "Banano Cavendish (Tresbolillo)", desc: "Plantación en triángulo o tresbolillo para maximizar un 15% más de plantas por hectárea sin entorpecer el cable vía.", distancia: "2.5 metros", densidad: "1,840 plantas / ha", cuadras: "~1,298 plantas / cuadra", m: 0.8, b: 15 },
    hortalizas: { titulo: "Hortalizas en Surcos Dobles", desc: "Sistema intensivo en camas altas con riego por goteo automatizado y pendiente controlada para drenaje.", distancia: "0.5 metros", densidad: "20,000 plantas / ha", cuadras: "~14,112 plantas / cuadra", m: 0.2, b: 10 },
    maiz: { titulo: "Maíz Duro en Laderas Topográficas", desc: "Siembra en curvas de nivel siguiendo la pendiente natural para evitar la erosión hídrica del suelo.", distancia: "0.8 metros", densidad: "62,500 plantas / ha", cuadras: "~44,100 plantas / cuadra", m: 1.2, b: 30 }
};

function seleccionarVideo(tipo) {
    videoState.cultivo = tipo;
    videoState.timer = 0;
    videoState.progress = 0;

    document.querySelectorAll('[id^="btn-v-"]').forEach(btn => {
        btn.className = "px-4 py-2 rounded-xl text-xs font-bold transition bg-slate-800 text-slate-300 hover:bg-slate-700";
    });
    const activeBtn = document.getElementById(`btn-v-${tipo}`);
    if (activeBtn) activeBtn.className = "px-4 py-2 rounded-xl text-xs font-bold transition bg-cyan-600 text-white shadow-md";

    const c = datosCultivosVideos[tipo];
    if (c) {
        document.getElementById('info-cultivo-titulo').innerText = c.titulo;
        document.getElementById('info-cultivo-desc').innerText = c.desc;
        document.getElementById('info-distancia').innerText = c.distancia;
        document.getElementById('info-densidad').innerText = c.densidad;
        document.getElementById('info-cuadras').innerText = c.cuadras;
        document.getElementById('video-status-text').innerText = `Simulando: ${c.titulo}`;
    }

    redibujarVideoCanvas();
}

function iniciarVideoAnimado() {
    if (videoState.interval) clearInterval(videoState.interval);
    videoState.interval = setInterval(() => {
        if (!videoState.isPlaying) return;
        videoState.timer += 0.5;
        if (videoState.timer > 30) videoState.timer = 0;
        videoState.progress = (videoState.timer / 30) * 100;

        const progEl = document.getElementById('video-progress');
        const timeEl = document.getElementById('video-timer');
        if (progEl) progEl.style.width = videoState.progress + '%';
        if (timeEl) timeEl.innerText = `00:${Math.floor(videoState.timer) < 10 ? '0':''}${Math.floor(videoState.timer)} / 00:30`;

        redibujarVideoCanvas();
    }, 500);
}

function toggleVideoPlay() {
    videoState.isPlaying = !videoState.isPlaying;
    const icon = document.getElementById('play-icon');
    if (icon) icon.className = videoState.isPlaying ? "fa-solid fa-pause" : "fa-solid fa-play";
}

function reiniciarVideo() {
    videoState.timer = 0;
    videoState.progress = 0;
    redibujarVideoCanvas();
}

function redibujarVideoCanvas() {
    const c = document.getElementById('videoCanvas');
    if (!c) return;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);

    // Fondo terreno agrícola con gradiente
    const grad = ctx.createLinearGradient(0, 0, 0, c.height);
    grad.addColorStop(0, '#020617');
    grad.addColorStop(1, '#0f172a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, c.width, c.height);

    // Cuadrícula y topografía
    dibujarCuriculaBase(ctx, c.width, c.height);

    const datos = datosCultivosVideos[videoState.cultivo];
    
    // Dibujar líneas topográficas (y = mx + b)
    ctx.strokeStyle = '#00f2fe';
    ctx.lineWidth = 2;
    for(let i=0; i<6; i++) {
        ctx.beginPath();
        let yOffset = i * 50 + (videoState.timer * 2) % 50;
        ctx.moveTo(0, yOffset);
        ctx.lineTo(c.width, yOffset + datos.m * 100);
        ctx.stroke();
    }

    // Dibujar plantas animadas en los nodos
    ctx.fillStyle = '#10b981';
    ctx.strokeStyle = '#047857';
    ctx.lineWidth = 2;
    
    let stepX = 40;
    for(let x = 30; x < c.width - 20; x += stepX) {
        for(let y = 40; y < c.height - 30; y += 50) {
            let posX = x;
            let posY = y + Math.sin((x + videoState.timer * 10) * 0.05) * 5;
            
            // Dibujar icono planta estilizada
            ctx.beginPath();
            ctx.arc(posX, posY, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Pequeño brillo
            ctx.fillStyle = '#6ee7b7';
            ctx.beginPath();
            ctx.arc(posX - 2, posY - 2, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#10b981';
        }
    }

    // Overlay de telemetría en canvas
    ctx.fillStyle = 'rgba(3, 7, 18, 0.75)';
    ctx.fillRect(10, c.height - 45, 260, 35);
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
    ctx.strokeRect(10, c.height - 45, 260, 35);

    ctx.fillStyle = '#38bdf8';
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText(`Cultivo: ${datos.titulo}`, 20, c.height - 25);
    ctx.fillStyle = '#10b981';
    ctx.fillText(`Densidad: ${datos.densidad}`, 20, c.height - 12);
}

function cargarParametrosEnLab() {
    const cultivo = videoState.cultivo;
    const datos = datosCultivosVideos[cultivo];
    if (datos) {
        labState.m = datos.m;
        labState.b = datos.b;
        document.getElementById('slider-m').value = datos.m;
        document.getElementById('slider-b').value = datos.b;
        cambiarVista('estudiante');
        cambiarSubTabEstudiante('lab');
        actualizarSimulacionLab();
    }
}

// Subpestaciones de Estudiante
function cambiarSubTabEstudiante(sub) {
    subTabEstudiante = sub;
    const btnLab = document.getElementById('subtab-lab');
    const btnTalleres = document.getElementById('subtab-talleres');
    const divLab = document.getElementById('subvista-lab');
    const divTalleres = document.getElementById('subvista-talleres');

    if (sub === 'lab') {
        btnLab.className = "px-4 py-2 rounded-xl text-xs font-bold transition bg-cyan-600 text-white shadow-md flex items-center gap-2";
        btnTalleres.className = "px-4 py-2 rounded-xl text-xs font-bold transition bg-slate-900 text-slate-300 hover:bg-slate-800 flex items-center gap-2";
        divLab.classList.remove('hidden');
        divTalleres.classList.add('hidden');
        actualizarSimulacionLab();
    } else {
        btnTalleres.className = "px-4 py-2 rounded-xl text-xs font-bold transition bg-cyan-600 text-white shadow-md flex items-center gap-2";
        btnLab.className = "px-4 py-2 rounded-xl text-xs font-bold transition bg-slate-900 text-slate-300 hover:bg-slate-800 flex items-center gap-2";
        divTalleres.classList.remove('hidden');
        divLab.classList.add('hidden');
    }
}

// Laboratorio Interactivo
function actualizarSimulacionLab() {
    const tipoEl = document.getElementById('tipo-terreno');
    const anchoEl = document.getElementById('slider-ancho');
    const largoEl = document.getElementById('slider-largo');
    const mEl = document.getElementById('slider-m');
    const bEl = document.getElementById('slider-b');
    const distEl = document.getElementById('slider-distancia');

    if (!tipoEl || !anchoEl || !largoEl || !mEl || !bEl || !distEl) return;

    labState.tipoTerreno = tipoEl.value;
    labState.ancho = parseFloat(anchoEl.value);
    labState.largo = parseFloat(largoEl.value);
    labState.m = parseFloat(mEl.value);
    labState.b = parseFloat(bEl.value);
    labState.distancia = parseFloat(distEl.value);

    // Actualizar etiquetas UI
    document.getElementById('val-ancho').innerText = labState.ancho + ' m';
    document.getElementById('val-largo').innerText = labState.largo + ' m';
    document.getElementById('val-m').innerText = labState.m;
    document.getElementById('val-b').innerText = labState.b + ' m';
    document.getElementById('val-distancia').innerText = labState.distancia + ' m';
    document.getElementById('eq-m').innerText = labState.m;
    document.getElementById('eq-b').innerText = labState.b;

    // Cálculos de área
    let areaM2 = labState.ancho * labState.largo;
    if (labState.tipoTerreno === 'trapecio') areaM2 = areaM2 * 0.85;
    if (labState.tipoTerreno === 'triangulo') areaM2 = areaM2 * 0.5;

    let hectareas = areaM2 / 10000;
    let cuadras = areaM2 / 7056; // 1 cuadra ecuatoriana = 7,056 m2

    document.getElementById('tele-area-m2').innerText = areaM2.toLocaleString('es-EC', {maximumFractionDigits: 0}) + ' m²';
    document.getElementById('tele-hectareas').innerText = hectareas.toFixed(2) + ' Hectáreas';
    document.getElementById('tele-cuadras').innerText = '~' + cuadras.toFixed(2) + ' Cuadras';

    // Población estimada
    let poblacion = Math.floor(areaM2 / (labState.distancia * labState.distancia));
    document.getElementById('tele-poblacion').innerText = poblacion.toLocaleString('es-EC') + ' plantas';

    redibujarLabCanvas();
    if (chartPoblacionInstance) actualizarGraficaPoblacionDatos();
}

function reiniciarLab() {
    document.getElementById('tipo-terreno').value = 'rectangulo';
    document.getElementById('slider-ancho').value = 50;
    document.getElementById('slider-largo').value = 40;
    document.getElementById('slider-m').value = 1.0;
    document.getElementById('slider-b').value = 10;
    document.getElementById('slider-distancia').value = 3.0;
    actualizarSimulacionLab();
}

function redibujarLabCanvas() {
    const c = document.getElementById('labCanvas');
    if (!c) return;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);

    // Fondo
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, c.width, c.height);
    dibujarCuriculaBase(ctx, c.width, c.height);

    // Dibujar forma del terreno según selección
    ctx.strokeStyle = '#00f2fe';
    ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(0, 114, 206, 0.1)';
    
    ctx.beginPath();
    const startX = 60;
    const startY = c.height - 60;
    const drawW = labState.ancho * 2.2;
    const drawH = labState.largo * 2.2;

    if (labState.tipoTerreno === 'rectangulo') {
        ctx.rect(startX, startY - drawH, drawW, drawH);
    } else if (labState.tipoTerreno === 'trapecio') {
        ctx.moveTo(startX, startY);
        ctx.lineTo(startX + drawW, startY);
        ctx.lineTo(startX + drawW * 0.8, startY - drawH);
        ctx.lineTo(startX + drawW * 0.2, startY - drawH);
        ctx.closePath();
    } else if (labState.tipoTerreno === 'triangulo') {
        ctx.moveTo(startX, startY);
        ctx.lineTo(startX + drawW, startY);
        ctx.lineTo(startX + drawW / 2, startY - drawH);
        ctx.closePath();
    } else { // Libre
        ctx.moveTo(startX, startY);
        ctx.lineTo(startX + drawW, startY - 20);
        ctx.lineTo(startX + drawW * 0.9, startY - drawH);
        ctx.lineTo(startX + 10, startY - drawH * 0.7);
        ctx.closePath();
    }
    ctx.fill();
    ctx.stroke();

    // Dibujar Ecuación Lineal y = mx + b
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    let x1 = startX;
    let y1 = startY - labState.b - (labState.m * 0);
    let x2 = startX + drawW;
    let y2 = startY - labState.b - (labState.m * drawW);
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Dibujar puntos de siembra (matriz basada en distancia)
    ctx.fillStyle = '#10b981';
    let stepDist = labState.distancia * 12; // escala visual
    for (let x = startX + 15; x < startX + drawW - 10; x += stepDist) {
        for (let y = startY - 15; y > startY - drawH + 10; y -= stepDist) {
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// Gráfica con Chart.js
function inicializarGraficaPoblacion() {
    const ctx = document.getElementById('chartPoblacion');
    if (!ctx || typeof Chart === 'undefined') return;
    chartPoblacionInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['1.0m', '2.0m', '3.0m', '4.0m', '5.0m', '6.0m', '7.0m', '8.0m'],
            datasets: [{
                label: 'Densidad Plantas / Hectárea',
                data: [10000, 2500, 1111, 625, 400, 277, 204, 156],
                borderColor: '#00f2fe',
                backgroundColor: 'rgba(0, 242, 254, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#cbd5e1', font: { size: 10 } } }
            },
            scales: {
                x: { ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { color: '#1e293b' } },
                y: { ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { color: '#1e293b' } }
            }
        }
    });
}

function actualizarGraficaPoblacionDatos() {
    if (!chartPoblacionInstance) return;
    let areaBase = 10000; // 1 hectárea
    let distancias = [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0];
    let newData = distancias.map(d => Math.floor(areaBase / (d * d)));
    chartPoblacionInstance.data.datasets[0].data = newData;
    chartPoblacionInstance.update();
}

// 20 Talleres Guiados
const listaTalleres = [
    { id: 1, titulo: "Taller 1: Cálculo de Pendiente en Cacao CCN-51", desc: "Determine el impacto de una pendiente m = 0.5 sobre el escurrimiento de agua en un lote rectangular de 50x40m.", m: 0.5, b: 10, distancia: 3.0 },
    { id: 2, titulo: "Taller 2: Densidad Óptima en Banano Cavendish", desc: "Ajuste el marco de plantación a 2.5m para maximizar la población en una hectárea.", m: 0.8, b: 15, distancia: 2.5 },
    { id: 3, titulo: "Taller 3: Intercepto y Cabecera de Riego", desc: "Modifique el intercepto b = 30m para evaluar la presión hidrostática inicial en laderas.", m: 1.2, b: 30, distancia: 2.0 },
    { id: 4, titulo: "Taller 4: Conversión a Cuadras Ecuatorianas", desc: "Calcule la equivalencia exacta de un terreno de 100x70m en cuadras (7,056 m²).", m: 1.0, b: 20, distancia: 3.0 },
    { id: 5, titulo: "Taller 5: Siembra en Terreno Trapezoidal", desc: "Configure un lote en forma de trapecio y calcule la densidad real de hortalizas.", m: 0.3, b: 10, distancia: 1.5 },
    { id: 6, titulo: "Taller 6: Curvas de Nivel para Maíz Duro", desc: "Establezca la pendiente m = 1.5 para evitar la erosión hídrica en terrenos inclinados.", m: 1.5, b: 25, distancia: 0.8 },
    { id: 7, titulo: "Taller 7: Eficiencia Espacial en Triángulos", desc: "Evalúe la distribución de plantas en un lote triangular irregular de base 80m.", m: 0.9, b: 12, distancia: 3.5 },
    { id: 8, titulo: "Taller 8: Marco Real vs Tresbolillo", desc: "Compare la población resultante reduciendo la distancia entre plantas a 2.0m.", m: 0.7, b: 18, distancia: 2.0 },
    { id: 9, titulo: "Taller 9: Microparrillas de Riego Automatizado", desc: "Simule la distribución lineal de emisores con una pendiente b = 5m.", m: 0.4, b: 5, distancia: 1.0 },
    { id: 10, titulo: "Taller 10: Optimización de Café Arábigo", desc: "Calcule los requerimientos de espacio para 1,500 plantas en terreno rectangular.", m: 1.1, b: 22, distancia: 2.5 },
    { id: 11, titulo: "Taller 11: Ecuación de Líneas de Siembra", desc: "Defina la función lineal exacta para surcos paralelos con m = 1.0 y b = 15.", m: 1.0, b: 15, distancia: 3.0 },
    { id: 12, titulo: "Taller 12: Terrenos de Gran Escala (>2 Hectáreas)", desc: "Mida el comportamiento de la densidad poblacional al ampliar el ancho a 150m.", m: 0.6, b: 35, distancia: 4.0 },
    { id: 13, titulo: "Taller 13: Siembra en Dibujo Libre", desc: "Utilice la opción de terreno libre para modelar una parcela irregular.", m: 0.8, b: 14, distancia: 2.8 },
    { id: 14, titulo: "Taller 14: Control de Escorrentía en Laderas", desc: "Analice cómo un intercepto elevado afecta la velocidad de drenaje agrícola.", m: 1.8, b: 40, distancia: 1.5 },
    { id: 15, titulo: "Taller 15: Densidad de Cítricos (Limón Sutil)", desc: "Configure un marco de plantación de 4x4m y evalúe la producción por hectárea.", m: 0.5, b: 10, distancia: 4.0 },
    { id: 16, titulo: "Taller 16: Validación de Rúbrica UG", desc: "Resuelva el caso práctico evaluado en la matriz de competencias de la universidad.", m: 1.0, b: 20, distancia: 3.0 },
    { id: 17, titulo: "Taller 17: Análisis de Iluminación y Sombra", desc: "Modifique la pendiente para evitar el sombreado excesivo entre surcos contiguos.", m: 0.4, b: 8, distancia: 3.5 },
    { id: 18, titulo: "Taller 18: Siembra de Ciclo Corto (Tomate)", desc: "Optimice el espacio para hortalizas de alto rendimiento con distancia de 0.6m.", m: 0.2, b: 10, distancia: 0.6 },
    { id: 19, titulo: "Taller 19: Simulación Integral de Parcelas", desc: "Combine dimensiones, pendiente e intercepto en un escenario de tesis agronómica.", m: 1.3, b: 28, distancia: 3.2 },
    { id: 20, titulo: "Taller 20: Proyecto Final de Grado - AgroGeo", desc: "Diseño completo de un sistema de plantación validado bajo estándares UG 2026.", m: 1.0, b: 20, distancia: 3.0 }
];

function generarTalleresDinamicos() {
    const grid = document.getElementById('grid-talleres');
    if (!grid) return;
    grid.innerHTML = '';

    listaTalleres.forEach(t => {
        const card = document.createElement('div');
        card.className = "bg-slate-950 border border-slate-800 hover:border-cyan-500/40 rounded-xl p-4 transition flex flex-col justify-between space-y-3";
        card.innerHTML = `
            <div>
                <span class="text-xs text-cyan-400 font-mono font-bold">Taller #${t.id}</span>
                <h4 class="text-sm font-bold text-white mt-1">${t.titulo}</h4>
                <p class="text-xs text-slate-300 mt-1">${t.desc}</p>
            </div>
            <div class="pt-2 border-t border-slate-800 flex justify-between items-center">
                <span class="text-xs text-slate-400 font-mono">m=${t.m}, b=${t.b}m</span>
                <button onclick="cargarTallerEnLab(${t.m}, ${t.b}, ${t.distancia})" class="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5">
                    <i class="fa-solid fa-play text-xs"></i> Iniciar Taller
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function cargarTallerEnLab(m, b, dist) {
    labState.m = m;
    labState.b = b;
    labState.distancia = dist;
    document.getElementById('slider-m').value = m;
    document.getElementById('slider-b').value = b;
    document.getElementById('slider-distancia').value = dist;
    cambiarSubTabEstudiante('lab');
    actualizarSimulacionLab();
}

function filtrarTalleres() {
    const filtro = document.getElementById('filtro-talleres').value.toLowerCase();
    const cards = document.getElementById('grid-talleres').children;
    listaTalleres.forEach((t, idx) => {
        const texto = (t.titulo + ' ' + t.desc).toLowerCase();
        if (texto.includes(filtro)) {
            cards[idx].style.display = 'flex';
        } else {
            cards[idx].style.display = 'none';
        }
    });
}

// Funciones Modo Docente
function generarDesafioAleatorio() {
    const cultivos = ["Cacao CCN-51", "Banano Cavendish", "Maíz Duro", "Hortalizas Intensivas"];
    const c = cultivos[Math.floor(Math.random() * cultivos.length)];
    const m = (Math.random() * 1.5 + 0.2).toFixed(1);
    const b = Math.floor(Math.random() * 30 + 5);
    const ancho = Math.floor(Math.random() * 100 + 30);
    const largo = Math.floor(Math.random() * 100 + 30);

    const txt = `Desafío Generado: Diseñar un lote para <strong>${c}</strong> de <strong>${ancho}x${largo}m</strong> con función lineal <strong>y = ${m}x + ${b}</strong>. Calcule la población estimada y la densidad por cuadra ecuatoriana.`;
    document.getElementById('desafio-texto').innerHTML = txt;
}

function exportarJsonDocente() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ autor: "Ing. Laila Vera Carrasco", institucion: "Universidad de Guayaquil", talleres: listaTalleres, estadoLab: labState }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "AgroGeo_UG_Reporte_Docente.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

function generarReporteHtml() {
    const w = window.open('', '_blank');
    w.document.write(`
        <html>
        <head>
            <title>Acta de Desempeño - AgroGeo UG</title>
            <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-white text-slate-900 p-8 font-sans">
            <div class="max-w-3xl mx-auto space-y-6">
                <div class="border-b-2 border-[#002855] pb-4 flex justify-between items-center">
                    <div>
                        <h1 class="text-2xl font-black text-[#002855]">UNIVERSIDAD DE GUAYAQUIL</h1>
                        <p class="text-sm font-semibold text-[#0072CE]">Facultad de Ciencias Matemáticas y Físicas • Ingeniería Agrícola</p>
                    </div>
                    <div class="text-right text-xs text-slate-600 font-mono">
                        <p>Fecha: 2026-11-15</p>
                        <p>Autora: Ing. Laila Vera Carrasco</p>
                    </div>
                </div>
                <div class="space-y-4">
                    <h2 class="text-lg font-bold text-slate-800">Acta de Validación de Competencias de Simulador</h2>
                    <p class="text-sm text-slate-700">El presente documento certifica que el estudiante ha completado satisfactoriamente los módulos de modelado geométrico, pendiente, intercepto y cálculo de densidades agrícolas mediante la aplicación AgroGeo UG.</p>
                    <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                        <p><strong>Configuración Evaluada:</strong> Ancho: ${labState.ancho}m | Largo: ${labState.largo}m</p>
                        <p><strong>Ecuación Lineal:</strong> y = ${labState.m}x + ${labState.b}</p>
                        <p><strong>Distancia de Plantación:</strong> ${labState.distancia}m</p>
                        <p><strong>Población Estimada:</strong> ${Math.floor((labState.ancho * labState.largo) / (labState.distancia * labState.distancia))} plantas</p>
                    </div>
                </div>
                <div class="pt-8 border-t border-slate-300 flex justify-between text-xs text-slate-600">
                    <div class="text-center"><div class="w-48 border-b border-slate-400 mb-1"></div>Docente / Investigador</div>
                    <div class="text-center"><div class="w-48 border-b border-slate-400 mb-1"></div>Estudiante Becario</div>
                </div>
            </div>
        </body>
        </html>
    `);
    w.document.close();
    w.print();
}

// Función de Instalación PWA simulada (sin saltos de línea sin escapar)
function instalarApp() {
    alert("¡Instalación Iniciada!\n\nAgroGeo UG se ha empaquetado correctamente como aplicación web progresiva y autónoma para su uso en escritorios y dispositivos móviles.");
}
