const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

type CasePayload = {
  numero_expediente?: string;
  codigo_seguimiento?: string;
  denunciante_nombre?: string;
  denunciante_documento?: string;
  estado?: string;
  dependencia?: string;
};

export type CaseSearchResponse = {
  case: {
    id: number;
    numero_expediente: string;
    codigo_seguimiento: string;
    denunciante_nombre: string;
    denunciante_documento: string;
    estado: string;
    fecha_inicio: string;
    dependencia: string;
    creado_por_admin_id: number | null;
    actualizado_en: string;
  };
  timeline: {
    id: number;
    case_id: number;
    fecha_evento: string;
    tipo_evento: string;
    descripcion: string;
    document_id: number | null;
    visible_al_ciudadano: boolean;
    creado_en: string;
  }[];
  documents: {
    id: number;
    case_id: number;
    titulo: string;
    tipo: string;
    path_archivo: string;
    visible_al_ciudadano: boolean;
    creado_en: string;
  }[];
  payments: {
    id: number;
    case_id: number;
    concepto: string;
    monto: number;
    estado: string;
    fecha_vencimiento: string;
    fecha_pago: string | null;
    comprobante_path: string | null;
  }[];
};

export type AdminCase = {
  id: number;
  numero_expediente: string;
  codigo_seguimiento: string;
  denunciante_nombre: string;
  denunciante_documento: string;
  estado: string;
  dependencia: string;
  fecha_inicio?: string;
  actualizado_en?: string;
};

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = 'Error en la solicitud';
    try {
      const data = await res.json();
      message = data?.message || message;
    } catch (err) {
      // ignore
    }
    throw new Error(message);
  }
  return res.json();
}

export async function searchCase({
  caseNumber,
  citizenIdNumber,
  trackingCode
}: {
  caseNumber?: string;
  citizenIdNumber?: string;
  trackingCode?: string;
}): Promise<CaseSearchResponse> {
  const res = await fetch(`${API_BASE}/api/cases/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      numero_expediente: caseNumber,
      documento_identidad: citizenIdNumber,
      codigo_seguimiento: trackingCode
    }),
    next: { revalidate: 0 }
  });
  return handleResponse(res);
}

export async function loginAdmin(email: string, password: string): Promise<{ token: string }> {
  const res = await fetch(`${API_BASE}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return handleResponse(res);
}

export async function listAdminCases(token: string): Promise<AdminCase[]> {
  const res = await fetch(`${API_BASE}/api/admin/cases`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 0 }
  });
  return handleResponse(res);
}

export async function createAdminCase(token: string, payload: CasePayload): Promise<AdminCase> {
  const res = await fetch(`${API_BASE}/api/admin/cases`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  return handleResponse(res);
}

export async function updateAdminCase(token: string, id: number, payload: CasePayload): Promise<AdminCase> {
  const res = await fetch(`${API_BASE}/api/admin/cases/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  return handleResponse(res);
}
