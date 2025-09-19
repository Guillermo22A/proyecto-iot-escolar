// ❗️❗️ REEMPLAZA ESTA URL POR LA DE TU PROYECTO EN MOCKAPI ❗️❗️
const API_URL = 'https://68ccf3ebda4697a7f30411aa.mockapi.io';

// --- Funciones para Dispositivos (Devices) ---
export const getDevices = async () => {
  const response = await fetch(`${API_URL}/devices`);
  return await response.json();
};

export const updateDeviceStatus = async (id, newStatus) => {
  const response = await fetch(`${API_URL}/devices/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: newStatus }),
  });
  return await response.json();
};

// --- Funciones para el Historial (Status Logs) ---
export const getStatusLogs = async (limit = 10) => {
  const response = await fetch(`${API_URL}/status_logs?sortBy=timestamp&order=desc&limit=${limit}`);
  return await response.json();
};

export const createStatusLog = async (logData) => {
  const response = await fetch(`${API_URL}/status_logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(logData),
  });
  return await response.json();
};


export const createDevice = async (deviceData) => {
  const response = await fetch(`${API_URL}/devices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(deviceData),
  });
  return await response.json();
};

export const updateDevice = async (id, deviceData) => {
  const response = await fetch(`${API_URL}/devices/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(deviceData),
  });
  return await response.json();
};

export const deleteDevice = async (id) => {
  const response = await fetch(`${API_URL}/devices/${id}`, {
    method: 'DELETE',
  });
  return await response.json();
};