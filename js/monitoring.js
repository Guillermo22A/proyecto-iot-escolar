import { getDevices, getStatusLogs } from './api.js';

const cardsContainer = document.getElementById('device-cards-container');
const logsContainer = document.getElementById('logs-table-container');

// --- Funciones para obtener imágenes y colores (sin cambios) ---
const getDeviceImage = (device) => {
  switch (device.type) {
    case 'light': return device.status === 'on' ? 'light-on.svg' : 'light-off.svg';
    case 'door': return device.status === 'unlocked' ? 'door-open.svg' : 'door-closed.svg';
    case 'window': return device.status === 'open' ? 'window-closed.svg' : 'window-open.svg';
    case 'motion_sensor': return device.status === 'active' ? 'motion-active.svg' : 'motion-inactive.svg';
    default: return 'light-off.svg';
  }
};
const getStatusVariant = (status) => ['on', 'open', 'unlocked', 'active'].includes(status) ? 'success' : 'secondary';


// --- Funciones de Renderizado ---
const renderDevices = (devices) => {
  let cardsHTML = devices.map(device => {
    const variant = getStatusVariant(device.status);
    return `
      <div class="col-12 col-md-6 col-lg-4">
        <div class="card border-${variant}">
          <div class="card-header bg-${variant} text-white">
            <strong>${device.name}</strong> - ${device.location}
          </div>
          <div class="card-body d-flex align-items-center justify-content-around p-4">
            <img src="assets/${getDeviceImage(device)}" alt="${device.name}" width="80" height="80" />
            <div class="text-center">
              <p class="card-text">Estado:</p>
              <h4 class="text-${variant}">${device.status.toUpperCase()}</h4>
            </div>
          </div>
        </div>
      </div>`;
  }).join('');
  cardsContainer.innerHTML = cardsHTML || '<p>No se encontraron dispositivos.</p>';
};

// --- 👇 FUNCIÓN MODIFICADA 👇 ---
const renderLogs = (logs, devices) => {
  let tableHTML = `
    <table class="table table-striped table-bordered table-hover align-middle">
      <thead>
        <tr>
          <th>Dispositivo</th>
          <th>Ubicación</th>
          <th>Nuevo Estado</th>
          <th>Fecha y Hora</th>
        </tr>
      </thead>
      <tbody>
        ${logs.map(log => {
          // Buscamos el dispositivo en la lista para obtener su ubicación
          const device = devices.find(d => d.id === log.deviceId);
          const location = device ? device.location : 'N/A'; // Mostramos N/A si no se encuentra
          
          return `
          <tr>
            <td>${log.deviceName}</td>
            <td><strong>${location}</strong></td>
            <td><span class="fw-bold text-${getStatusVariant(log.newStatus)}">${log.newStatus.toUpperCase()}</span></td>
            <td>${new Date(log.timestamp).toLocaleString()}</td>
          </tr>`
        }).join('')}
      </tbody>
    </table>`;
  logsContainer.innerHTML = tableHTML;
};


// --- Lógica Principal ---
const fetchAndRender = async () => {
  try {
    // Obtenemos ambos listados, ya que necesitamos los dispositivos para buscar la ubicación
    const devices = await getDevices();
    const logs = await getStatusLogs();

    renderDevices(devices);
    // Pasamos la lista de dispositivos a la función de logs
    renderLogs(logs, devices);

  } catch (error) {
    console.error("Error fetching data:", error);
    cardsContainer.innerHTML = '<div class="alert alert-danger">No se pudo cargar la información.</div>';
  }
};

// Iniciar el ciclo de actualización
document.addEventListener('DOMContentLoaded', () => {
  fetchAndRender(); // Carga inicial
  setInterval(fetchAndRender, 2000); // Refresco cada 2 segundos
});