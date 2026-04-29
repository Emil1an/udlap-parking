// Variables globales para control de estado y temporizador
let currentZonaId = '';
let currentCajonId = '';
let countdownTimer; // Corregido: Declaración necesaria para evitar errores en confirmarReserva

document.addEventListener("DOMContentLoaded", () => {
  // 1. CARGAR TEMA (Modo Oscuro/Claro persistente)
  cargarTema(); //

  // 2. MOSTRAR FECHA ACTUAL
  const d = new Date();
  const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const dateElement = document.getElementById('current-date');
  if (dateElement) {
    dateElement.innerText = d.toLocaleDateString('es-MX', opciones); //
  }

  // 3. LÓGICA DE PESTAÑAS PRINCIPALES (LOGIN / REGISTRO)
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

  // 4. LÓGICA DE CAMBIO DE TIPO DE USUARIO (ESTUDIANTE / PROFESOR / EMPLEADO)
  const typeButtons = document.querySelectorAll(".type-btn");
  const idField = document.getElementById("idField");

  if (typeButtons.length > 0 && idField) {
    typeButtons.forEach(btn => {
      btn.onclick = () => {
        typeButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const type = btn.dataset.type;
        idField.placeholder = "ID de " + type.charAt(0).toUpperCase() + type.slice(1);
        idField.value = "";
      };
    });
  }

  // 5. LÓGICA DE MOVIMIENTO DEL MAPA (Drag & Drop)
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

// --- DATOS DE ESTACIONAMIENTOS (Coches, Discapacitados, Motos, Bicis) ---
const zonasEstacionamiento = {
  'E2': { nombre: 'Central (E2)', cajones: 16, ocupados: ['P1', 'P4'], discapacitados: ['P15', 'P16'], motos: ['P13', 'P14'], bicicletas: ['P11', 'P12'] },
  'E3': { nombre: 'Norte (E3)', cajones: 12, ocupados: ['P2'], discapacitados: ['P11', 'P12'], motos: ['P9', 'P10'], bicicletas: ['P7', 'P8'] },
  'E5': { nombre: 'Sur (E5)', cajones: 10, ocupados: ['P3', 'P9'], discapacitados: ['P1', 'P2'], motos: ['P7', 'P8'], bicicletas: ['P5', 'P6'] },
  'E6': { nombre: 'Este (E6)', cajones: 8, ocupados: ['P1', 'P6'], discapacitados: ['P3', 'P4'], motos: ['P5', 'P6'], bicicletas: ['P3', 'P4'] }
};

// --- INTERFAZ DEL MAPA Y GRILLA ---
function showInfo(idZona) {
  currentZonaId = idZona;
  const zona = zonasEstacionamiento[idZona];
  const contenedor = document.getElementById('grid-dinamico');
  const titulo = document.getElementById('titulo-zona');
  if (titulo) titulo.innerText = zona.nombre;
  contenedor.innerHTML = '';

  // Notificación si la zona está llena
  if (zona.ocupados.length >= zona.cajones) {
    mostrarNotificacion(`⚠️ La zona ${zona.nombre} está llena. Busca en otra.`); //
  }

  for (let i = 1; i <= zona.cajones; i++) {
    const idCajon = `P${i}`;
    const esOcupado = zona.ocupados.includes(idCajon);
    const div = document.createElement('div');
    div.className = `spot ${esOcupado ? 'occupied' : 'free'}`;

    // Asignar clases especiales para iconos
    if ((zona.discapacitados || []).includes(idCajon)) div.classList.add('disabled-spot');
    if ((zona.motos || []).includes(idCajon)) div.classList.add('moto-spot');
    if ((zona.bicicletas || []).includes(idCajon)) div.classList.add('bike-spot');

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

  // Ocupar el lugar
  if (!zonasEstacionamiento[currentZonaId].ocupados.includes(currentCajonId)) {
    zonasEstacionamiento[currentZonaId].ocupados.push(currentCajonId);
  }

  // Guardar en Historial
  const nuevaReserva = {
    id: Date.now(),
    zona: zonaNombre,
    cajon: currentCajonId,
    zonaId: currentZonaId,
    fecha: new Date().toLocaleString()
  };
  let reservas = JSON.parse(localStorage.getItem('misReservas')) || [];
  reservas.push(nuevaReserva);
  localStorage.setItem('misReservas', JSON.stringify(reservas));

  // Iniciar Temporizador de 15 min
  iniciarTemporizador(15 * 60);

  // Generar QR
  new QRious({
    element: document.getElementById('codigo-qr'),
    value: `Zona: ${zonaNombre} - Lugar: ${currentCajonId}`,
    size: 180,
    foreground: '#ff6600'
  });

  document.getElementById('qr-zona-info').innerText = zonaNombre;
  document.getElementById('qr-cajon-info').innerText = currentCajonId;

  showInfo(currentZonaId);
  document.getElementById('vista-confirmacion').style.display = 'none';
  document.getElementById('vista-qr').style.display = 'block';
}

// --- TEMPORIZADOR Y NOTIFICACIONES ---
function iniciarTemporizador(segundos) {
  clearInterval(countdownTimer);
  let tiempo = segundos;
  const display = document.getElementById('timer');

  countdownTimer = setInterval(() => {
    let minutos = Math.floor(tiempo / 60);
    let segs = tiempo % 60;
    if (display) display.innerText = `${minutos}:${segs < 10 ? '0' : ''}${segs}`;

    if (tiempo === 120) mostrarNotificacion("⏳ ¡Quedan 2 minutos para llegar a tu lugar!");

    if (--tiempo < 0) {
      clearInterval(countdownTimer);
      liberarLugar(currentZonaId, currentCajonId);
      mostrarNotificacion("❌ Tiempo agotado. El lugar ha sido liberado.");
      cerrarModal();
    }
  }, 1000);
}

function mostrarNotificacion(mensaje) {
  const bar = document.getElementById('notification-bar');
  if (bar) {
    bar.innerText = mensaje;
    bar.style.display = 'block';
    setTimeout(() => { bar.style.display = 'none'; }, 5000);
  } else {
    alert(mensaje);
  }
}

// --- SOPORTE, HISTORIAL Y CANCELACIÓN ---
function liberarLugar(zonaId, cajonId) {
  zonasEstacionamiento[zonaId].ocupados = zonasEstacionamiento[zonaId].ocupados.filter(p => p !== cajonId);
  let reservas = JSON.parse(localStorage.getItem('misReservas')) || [];
  reservas = reservas.filter(res => !(res.zonaId === zonaId && res.cajon === cajonId));
  localStorage.setItem('misReservas', JSON.stringify(reservas));
  if (currentZonaId === zonaId) showInfo(currentZonaId);
}

function cancelarReservacionActual() {
  if (confirm("¿Seguro que deseas cancelar?")) {
    clearInterval(countdownTimer);
    liberarLugar(currentZonaId, currentCajonId);
    cerrarModal();
  }
}

function verReservaciones() {
  const lista = document.getElementById('lista-reservas');
  const reservas = JSON.parse(localStorage.getItem('misReservas')) || [];
  lista.innerHTML = reservas.length ? '' : '<p style="text-align:center;">No hay reservas activas.</p>';

  reservas.forEach(res => {
    const card = document.createElement('div');
    card.className = 'reserva-card';
    card.innerHTML = `
        <div style="padding: 15px; display: flex; justify-content: space-between; align-items: center; cursor: pointer;"
             onclick="revisualizarQR(${res.id})">
          <div>
            <strong>${res.zona}</strong><br>
            <span>Lugar: ${res.cajon}</span><br>
            <small>${res.fecha}</small>
          </div>
          <button class="danger-btn" style="width: auto; padding: 5px 10px; margin: 0;"
                  onclick="event.stopPropagation(); liberarLugar('${res.zonaId}', '${res.cajon}'); verReservaciones();">❌</button>
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
  const desc = document.getElementById('descReporte').value;
  if (desc.trim() === "") { alert("Por favor describe el problema."); return; }
  alert("Reporte enviado con éxito. Soporte técnico lo revisará pronto.");
  document.getElementById('descReporte').value = "";
  document.getElementById('modal-soporte').style.display = 'none';
}

// --- LOGIN, REGISTRO Y TEMA ---
function register() {
  const nombre = document.getElementById("regNombre").value;
  if (nombre.trim() === "") { alert("Ingresa tu nombre."); return; }
  alert("¡Registro exitoso! Ya puedes iniciar sesión."); //
  document.getElementById("loginTab").click();
}

function login() {
  const id = document.getElementById("loginId").value;
  if (id === "171234") window.location.href = "home.html";
  else alert("ID incorrecto. Usa 171234 para pruebas."); //
}

function cargarTema() {
  const theme = localStorage.getItem("theme") || "light";
  if (theme === "dark") document.body.classList.add("dark-mode");
  else document.body.classList.remove("dark-mode"); //
}

function toggleCamposVehiculo() {
  const tipo = document.getElementById('tipoVehiculo').value;
  const camposExtras = document.getElementById('camposExtrasVehiculo');
  if (camposExtras) camposExtras.style.display = (tipo === 'bicicleta') ? 'none' : 'block'; //
}

function borrarHistorial() { if (confirm("¿Borrar historial?")) { localStorage.removeItem('misReservas'); verReservaciones(); } }
function cerrarModal() { document.getElementById('modal-seleccion').style.display = 'none'; }
function togglePassword(id, el) { const i = document.getElementById(id); i.type = i.type === "password" ? "text" : "password"; el.textContent = i.type === "password" ? "👁" : "🙈"; }
