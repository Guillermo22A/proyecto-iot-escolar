import { getDevices, createDevice, updateDevice, deleteDevice } from './api.js';

// --- Selectores del DOM ---
const tableBody = document.getElementById('devices-table-body');
const addDeviceBtn = document.getElementById('add-device-btn');
const deviceModalEl = document.getElementById('device-modal');
const deviceForm = document.getElementById('device-form');
const modalTitle = document.getElementById('modal-title');
const deviceIdInput = document.getElementById('device-id');
const deviceTypeSelect = document.getElementById('device-type');
const deviceStatusSelect = document.getElementById('device-status');

// Instancia del Modal de Bootstrap
const deviceModal = new bootstrap.Modal(deviceModalEl);

// --- Opciones de estado según el tipo de dispositivo ---
const statusOptions = {
    light: ['on', 'off'],
    door: ['locked', 'unlocked'],
    window: ['open', 'closed'],
    motion_sensor: ['active', 'inactive']
};

// --- Lógica de Renderizado ---
const renderTable = (devices) => {
    tableBody.innerHTML = ''; // Limpiar tabla
    if (devices.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No hay dispositivos registrados.</td></tr>';
        return;
    }
    devices.forEach(device => {
        const row = `
            <tr>
                <td>${device.name}</td>
                <td><span class="badge bg-info">${device.type}</span></td>
                <td>${device.status}</td>
                <td>${device.location}</td>
                <td>
                    <button class="btn btn-sm btn-warning edit-btn" data-id="${device.id}"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${device.id}"><i class="bi bi-trash"></i></button>
                </td>
            </tr>`;
        tableBody.insertAdjacentHTML('beforeend', row);
    });
};

// --- Carga inicial de datos ---
const loadAndRenderDevices = async () => {
    try {
        const devices = await getDevices();
        renderTable(devices);
    } catch (error) {
        console.error('Error al cargar dispositivos:', error);
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error al cargar los datos.</td></tr>';
    }
};

// --- Manejo del Formulario (Crear y Actualizar) ---
const handleFormSubmit = async (e) => {
    e.preventDefault();
    const deviceData = {
        name: document.getElementById('device-name').value,
        location: document.getElementById('device-location').value,
        type: document.getElementById('device-type').value,
        status: document.getElementById('device-status').value,
    };

    const id = deviceIdInput.value;

    try {
        if (id) {
            // Actualizar
            await updateDevice(id, deviceData);
        } else {
            // Crear
            await createDevice(deviceData);
        }
        deviceModal.hide(); // Ocultar modal
        loadAndRenderDevices(); // Recargar tabla
    } catch (error) {
        console.error('Error al guardar el dispositivo:', error);
        alert('No se pudo guardar el dispositivo.');
    }
};

// --- Abrir el Modal ---
const openModalForCreate = () => {
    deviceForm.reset();
    deviceIdInput.value = '';
    modalTitle.textContent = 'Agregar Nuevo Dispositivo';
    updateStatusOptions(); // Actualiza el select de status
    deviceModal.show();
};

const openModalForEdit = async (id) => {
    try {
        // En un caso real, haríamos un GET /devices/:id. Aquí lo buscamos del array cargado.
        const devices = await getDevices();
        const device = devices.find(d => d.id === id);

        if (device) {
            deviceForm.reset();
            deviceIdInput.value = device.id;
            modalTitle.textContent = 'Editar Dispositivo';
            document.getElementById('device-name').value = device.name;
            document.getElementById('device-location').value = device.location;
            document.getElementById('device-type').value = device.type;
            
            // Actualizar y seleccionar el estado correcto
            updateStatusOptions();
            document.getElementById('device-status').value = device.status;
            
            deviceModal.show();
        }
    } catch (error) {
        console.error('Error al obtener datos para editar:', error);
    }
};


// --- Eliminar Dispositivo ---
const handleDelete = async (id) => {
    if (confirm('¿Estás seguro de que quieres eliminar este dispositivo?')) {
        try {
            await deleteDevice(id);
            loadAndRenderDevices();
        } catch (error) {
            console.error('Error al eliminar:', error);
            alert('No se pudo eliminar el dispositivo.');
        }
    }
};

// --- Lógica Auxiliar ---
const updateStatusOptions = () => {
    const selectedType = deviceTypeSelect.value;
    const options = statusOptions[selectedType] || [];
    deviceStatusSelect.innerHTML = options
        .map(opt => `<option value="${opt}">${opt}</option>`)
        .join('');
};


// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    loadAndRenderDevices();
    
    addDeviceBtn.addEventListener('click', openModalForCreate);
    
    deviceForm.addEventListener('submit', handleFormSubmit);

    deviceTypeSelect.addEventListener('change', updateStatusOptions);

    // Event Delegation para botones de la tabla
    tableBody.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        const id = target.dataset.id;
        if (target.classList.contains('edit-btn')) {
            openModalForEdit(id);
        }
        if (target.classList.contains('delete-btn')) {
            handleDelete(id);
        }
    });
});