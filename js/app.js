let currentZonaId = '';
let currentCajonId = '';

document.addEventListener("DOMContentLoaded", () => {
  // LÓGICA DE PESTAÑAS (LOGIN / REGISTRO)
  const loginTab = document.getElementById("loginTab");
  const registerTab = document.getElementById("registerTab");
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");

  if (loginTab && registerTab) {
    loginTab.onclick = () => {
      loginTab.classList.add("active");
      registerTab.classList.remove("active");
      loginForm.classList.remove("hidden");
      registerForm.classList.add("hidden");
    };
    registerTab.onclick = () => {
      registerTab.classList.add("active");
      loginTab.classList.remove("active");
      registerForm.classList.remove("hidden");
      loginForm.classList.add("hidden");
    };
  }

  // LÓGICA DE MOVIMIENTO DEL MAPA
  const viewport = document.getElementById('map-viewport');
  const mapContainer = document.getElementById('map-container');
  if (viewport && mapContainer) {
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;
    const startDrag = (e) => {
      isDragging = true;
      const event = e.type.includes('touch') ? e.touches[0] : e;
      startX = event.clientX; startY = event.clientY;
      initialLeft = mapContainer.offsetLeft; initialTop = mapContainer.offsetTop;
      viewport.style.cursor = 'grabbing';
    };
    const move = (e) => {
      if (!isDragging) return;
      const event = e.type.includes('touch') ? e.touches[0] : e;
      const dx = event.clientX - startX; const dy = event.clientY - startY;
      mapContainer.style.left = (initialLeft + dx) + 'px';
      mapContainer.style.top = (initialTop + dy) + 'px';
    };
    const stopDrag = () => { isDragging = false; viewport.style.cursor = 'grab'; };
    viewport.addEventListener('mousedown', startDrag);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', stopDrag);
    viewport.addEventListener('touchstart', startDrag, { passive: false });
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', stopDrag);
  }
});

// DATOS DE ESTACIONAMIENTOS
const zonasEstacionamiento = {
  'E2': { nombre: 'Central (E2)', cajones: 12, ocupados: ['P1', 'P4'], discapacitados: ['P11', 'P12'] },
  'E3': { nombre: 'Norte (E3)', cajones: 8, ocupados: ['P2'], discapacitados: ['P7', 'P8'] },
  'E5': { nombre: 'Sur (E5)', cajones: 10, ocupados: ['P3', 'P9'], discapacitados: ['P1', 'P2'] },
  'E6': { nombre: 'Este (E6)', cajones: 6, ocupados: ['P1', 'P6'], discapacitados: ['P3', 'P4'] }
};

function showInfo(idZona) {
  currentZonaId = idZona;
  const zona = zonasEstacionamiento[idZona];
  const contenedor = document.getElementById('grid-dinamico');
  contenedor.innerHTML = '';
  for (let i = 1; i <= zona.cajones; i++) {
    const idCajon = `P${i}`;
    const esOcupado = zona.ocupados.includes(idCajon);
    const div = document.createElement('div');
    div.className = `spot ${esOcupado ? 'occupied' : 'free'}`;
    if ((zona.discapacitados || []).includes(idCajon)) div.classList.add('disabled-spot');
    div.innerText = idCajon;
    if (!esOcupado) div.onclick = () => abrirModal(idZona, idCajon);
    contenedor.appendChild(div);
  }
}

function abrirModal(idZona, idCajon) {
  currentCajonId = idCajon;
  const zona = zonasEstacionamiento[idZona];
  document.getElementById('modal-zona-nombre').innerText = zona.nombre;
  document.getElementById('modal-cajon-numero').innerText = idCajon;
  document.getElementById('vista-confirmacion').style.display = 'block';
  document.getElementById('vista-qr').style.display = 'none';
  document.getElementById('modal-seleccion').style.display = 'flex';
}

function confirmarReserva() {
  const zonaNombre = document.getElementById('modal-zona-nombre').innerText;
  if (!zonasEstacionamiento[currentZonaId].ocupados.includes(currentCajonId)) {
    zonasEstacionamiento[currentZonaId].ocupados.push(currentCajonId);
  }
  const nuevaReserva = { id: Date.now(), zona: zonaNombre, cajon: currentCajonId, zonaId: currentZonaId, fecha: new Date().toLocaleString() };
  let reservas = JSON.parse(localStorage.getItem('misReservas')) || [];
  reservas.push(nuevaReserva);
  localStorage.setItem('misReservas', JSON.stringify(reservas));

  new QRious({ element: document.getElementById('codigo-qr'), value: `Zona: ${zonaNombre} - Lugar: ${currentCajonId}`, size: 180, foreground: '#ff6600' });
  document.getElementById('qr-zona-info').innerText = zonaNombre;
  document.getElementById('qr-cajon-info').innerText = currentCajonId;

  showInfo(currentZonaId);
  document.getElementById('vista-confirmacion').style.display = 'none';
  document.getElementById('vista-qr').style.display = 'block';
}
function cerrarModal() { document.getElementById('modal-seleccion').style.display = 'none'; }

// ====== LÓGICA DE SOPORTE Y REGLAS (NUEVO) ======
function abrirSoporte() {
  document.getElementById('modal-soporte').style.display = 'flex';
  switchSoporte('reglas');
}

function switchSoporte(seccion) {
  const tReglas = document.getElementById('tabReglas');
  const tReporte = document.getElementById('tabReporte');
  const sReglas = document.getElementById('seccion-reglas');
  const sReporte = document.getElementById('seccion-reporte');

  if (seccion === 'reglas') {
    tReglas.classList.add('active'); tReporte.classList.remove('active');
    sReglas.classList.remove('hidden'); sReporte.classList.add('hidden');
  } else {
    tReporte.classList.add('active'); tReglas.classList.remove('active');
    sReporte.classList.remove('hidden'); sReglas.classList.add('hidden');
  }
}

function enviarReporte() {
  const tipo = document.getElementById('tipoReporte').value;
  const desc = document.getElementById('descReporte').value;

  if (desc.trim() === "") {
    alert("Por favor describe el problema antes de enviar.");
    return;
  }

  alert(`Reporte enviado con éxito.\nTipo: ${tipo}\nSoporte revisará tu caso pronto.`);
  document.getElementById('descReporte').value = "";
  document.getElementById('modal-soporte').style.display = 'none';
}

function liberarLugar(zonaId, cajonId) {
  zonasEstacionamiento[zonaId].ocupados = zonasEstacionamiento[zonaId].ocupados.filter(p => p !== cajonId);
  let reservas = JSON.parse(localStorage.getItem('misReservas')) || [];
  reservas = reservas.filter(res => !(res.zonaId === zonaId && res.cajon === cajonId));
  localStorage.setItem('misReservas', JSON.stringify(reservas));
  showInfo(currentZonaId);
}

// ====== CARGADOR DE TEMA GLOBAL ======
function cargarTema() {
  const theme = localStorage.getItem("theme") || "light";
  if (theme === "dark") {
    document.body.classList.add("dark-mode");
  } else {
    document.body.classList.remove("dark-mode");
  }
}

// Ejecutar al cargar el documento
document.addEventListener("DOMContentLoaded", () => {
  cargarTema(); // Aplica el modo oscuro de inmediato

  // ... resto de tu código existente (Tabs, Mapa, etc.) ...
  const loginTab = document.getElementById("loginTab");
  // [Mantén toda la lógica de movimiento de mapa y modales aquí abajo]
});

function cancelarReservacionActual() {
  if (confirm("¿Cancelar reserva?")) { liberarLugar(currentZonaId, currentCajonId); cerrarModal(); }
}

function verReservaciones() {
  const lista = document.getElementById('lista-reservas');
  const reservas = JSON.parse(localStorage.getItem('misReservas')) || [];
  lista.innerHTML = reservas.length ? '' : '<p style="text-align:center;">No hay reservas.</p>';
  reservas.forEach(res => {
    const card = document.createElement('div');
    card.className = 'reserva-card';
    card.innerHTML = `<div style="padding: 15px; display: flex; justify-content: space-between; align-items: center;" onclick="revisualizarQR(${res.id})">
      <div><strong>${res.zona}</strong><br>Lugar: ${res.cajon}</div>
      <button class="danger-btn" style="width: auto;" onclick="event.stopPropagation(); liberarLugar('${res.zonaId}', '${res.cajon}'); verReservaciones();">❌</button>
    </div>`;
    lista.appendChild(card);
  });
  document.getElementById('modal-historial').style.display = 'flex';
}

function revisualizarQR(id) {
  const res = (JSON.parse(localStorage.getItem('misReservas')) || []).find(r => r.id === id);
  if (res) {
    document.getElementById('qr-zona-info').innerText = res.zona;
    document.getElementById('qr-cajon-info').innerText = res.cajon;
    currentZonaId = res.zonaId; currentCajonId = res.cajon;
    new QRious({ element: document.getElementById('codigo-qr'), value: `Zona: ${res.zona} - Lugar: ${res.cajon}`, size: 180, foreground: '#ff6600' });
    document.getElementById('modal-historial').style.display = 'none';
    document.getElementById('modal-seleccion').style.display = 'flex';
    document.getElementById('vista-confirmacion').style.display = 'none';
    document.getElementById('vista-qr').style.display = 'block';
  }
}

function borrarHistorial() { if (confirm("¿Borrar historial?")) { localStorage.removeItem('misReservas'); verReservaciones(); } }
function cerrarModal() { document.getElementById('modal-seleccion').style.display = 'none'; }
function login() { if (document.getElementById("loginId").value === "171234") window.location.href = "home.html"; else alert("Error"); }
function togglePassword(id, el) { const i = document.getElementById(id); i.type = i.type === "password" ? "text" : "password"; el.textContent = i.type === "password" ? "👁" : "🙈"; }
