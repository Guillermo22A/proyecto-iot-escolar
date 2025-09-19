import { getDevices, updateDeviceStatus, createStatusLog } from './api.js';

// --- Elementos del DOM ---
const classroomSelectorContainer = document.getElementById('classroom-selector-container');
const classroomList = document.getElementById('classroom-list');
const controlPanelContainer = document.getElementById('control-panel-container');
const titleEl = document.getElementById('classroom-title');
const alertContainer = document.getElementById('alert-container');
const deviceListContainer = document.getElementById('device-list-container');
const secureBtn = document.getElementById('secure-classroom-btn');
const secureBtnHelp = document.getElementById('secure-btn-help');
const backBtn = document.getElementById('back-to-selector-btn');

// --- Variables de Estado ---
let allDevices = [];
let selectedLocation = null;

// --- Funciones de Renderizado ---

/** Muestra la lista de salones únicos para que el usuario elija uno. */
const renderClassroomSelector = () => {
    // Obtener salones únicos usando un Set para evitar duplicados
    const uniqueLocations = [...new Set(allDevices.map(device => device.location))];

    if (uniqueLocations.length === 0) {
        classroomList.innerHTML = '<p class="text-center">No se encontraron salones. Agrega dispositivos en la página de Admin.</p>';
        return;
    }

    classroomList.innerHTML = uniqueLocations.map(location => `
        <a href="#" class="list-group-item list-group-item-action fs-5" data-location="${location}">
            <i class="bi bi-door-open"></i> ${location}
        </a>
    `).join('');
};

/** Muestra el panel de control para el salón seleccionado. */
const renderControlPanel = () => {
    const classroomDevices = allDevices.filter(d => d.location === selectedLocation);
    const motionSensor = classroomDevices.find(d => d.type === 'motion_sensor');
    const isMotionActive = motionSensor?.status === 'active';

    titleEl.textContent = `Panel de Control - ${selectedLocation}`;

    // Renderizar Alerta del Sensor
    if (motionSensor) {
        alertContainer.innerHTML = `
            <div class="alert alert-${isMotionActive ? 'warning' : 'info'}">
                Sensor de Movimiento: <strong>${isMotionActive ? 'MOVIMIENTO DETECTADO' : 'Inactivo'}</strong>
            </div>`;
    } else {
        alertContainer.innerHTML = '';
    }

    // Renderizar Lista de Controles
    deviceListContainer.innerHTML = classroomDevices
        .filter(d => d.type !== 'motion_sensor')
        .map(device => `
            <div class="list-group-item d-flex justify-content-between align-items-center">
                <div><h5>${device.name}</h5><span>Estado: ${device.status}</span></div>
                <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" role="switch" id="switch-${device.id}" data-device-id="${device.id}" ${['on', 'unlocked', 'open'].includes(device.status) ? 'checked' : ''}>
                </div>
            </div>`
        ).join('');

    // Actualizar estado del botón principal
    secureBtn.disabled = isMotionActive;
    secureBtnHelp.style.display = isMotionActive ? 'block' : 'none';

    // Mostrar panel de control y ocultar selector
    classroomSelectorContainer.style.display = 'none';
    controlPanelContainer.style.display = 'block';
};

// --- Manejadores de Eventos ---

const handleToggle = async (deviceId) => {
    const device = allDevices.find(d => d.id === deviceId);
    if (!device) return;

    let newStatus;
    if (device.type === 'light') newStatus = device.status === 'on' ? 'off' : 'on';
    if (device.type === 'door') newStatus = device.status === 'locked' ? 'unlocked' : 'locked';
    if (device.type === 'window') newStatus = device.status === 'open' ? 'closed' : 'open';

    try {
        await updateDeviceStatus(device.id, newStatus);
        await createStatusLog({ deviceId: device.id, deviceName: device.name, newStatus: newStatus, timestamp: new Date().toISOString() });
        
        // Actualizar el estado localmente y volver a renderizar el panel
        device.status = newStatus;
        renderControlPanel();
    } catch (error) {
        console.error("Error al actualizar:", error);
        alertContainer.innerHTML = `<div class="alert alert-danger">Error al actualizar el dispositivo.</div>`;
    }
};

const handleSecureClassroom = async () => {
    alert("Iniciando protocolo de cierre seguro...");
    secureBtn.disabled = true;
    
    const devicesToSecure = allDevices.filter(d => d.location === selectedLocation && ['light', 'window', 'door'].includes(d.type));
    
    const promises = devicesToSecure.map(device => {
        let targetStatus;
        if (device.type === 'light' && device.status !== 'off') targetStatus = 'off';
        if (device.type === 'window' && device.status !== 'closed') targetStatus = 'closed';
        if (device.type === 'door' && device.status !== 'locked') targetStatus = 'locked';

        if (targetStatus) {
            return updateDeviceStatus(device.id, targetStatus).then(() => {
                device.status = targetStatus; // Actualiza estado local
                return createStatusLog({ deviceId: device.id, deviceName: device.name, newStatus: targetStatus, timestamp: new Date().toISOString() });
            });
        }
        return Promise.resolve();
    });

    await Promise.all(promises);
    renderControlPanel(); // Recargar el panel con los nuevos estados
};

// --- Lógica de Inicialización ---
const init = async () => {
    try {
        allDevices = await getDevices();
        renderClassroomSelector();
    } catch (error) {
        console.error("Error al cargar:", error);
        classroomList.innerHTML = `<div class="alert alert-danger">No se pudieron cargar los salones.</div>`;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    init();

    // Evento para seleccionar un salón
    classroomList.addEventListener('click', (e) => {
        e.preventDefault();
        const target = e.target.closest('a');
        if (target && target.dataset.location) {
            selectedLocation = target.dataset.location;
            renderControlPanel();
        }
    });

    // Evento para los switches (usando delegación)
    deviceListContainer.addEventListener('click', (e) => {
        if (e.target.matches('.form-check-input')) {
            handleToggle(e.target.dataset.deviceId);
        }
    });

    // Evento para el botón de asegurar salón
    secureBtn.addEventListener('click', handleSecureClassroom);
    
    // Evento para el botón de volver
    backBtn.addEventListener('click', () => {
        controlPanelContainer.style.display = 'none';
        classroomSelectorContainer.style.display = 'block';
        selectedLocation = null;
    });
});