const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const jsonHeaders = {
  'Content-Type': 'application/json'
};

export const searchCase = async (payload) => {
  const res = await fetch(`${API_URL}/cases/search`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || 'No se pudo consultar el expediente');
  }
  return data;
};

export const fetchAdminCases = async (token) => {
  const res = await fetch(`${API_URL}/admin/cases`, {
    headers: { ...jsonHeaders, Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || 'No se pudo obtener la lista de casos');
  }
  return data;
};
