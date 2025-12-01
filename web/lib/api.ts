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

export type PaymentMethodType = 'BANK_TRANSFER' | 'CRYPTO';
export type PaymentRequestStatus =
  | 'PENDING'
  | 'SENT'
  | 'AWAITING_CONFIRMATION'
  | 'APPROVED'
  | 'PAID'
  | 'REJECTED'
  | 'CANCELLED'
  | 'EXPIRED';
export type PaymentStatus = 'PENDING' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';

export type BankAccount = {
  id: number;
  label: string;
  bankName: string;
  iban: string;
  bic?: string | null;
  country: string;
  currency: string;
  isActive: boolean;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type CryptoWallet = {
  id: number;
  label: string;
  asset: string;
  currency?: string | null;
  network: string;
  address: string;
  isActive: boolean;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type PaymentRequest = {
  id: number;
  caseId: number;
  case?: {
    id: number;
    caseNumber: string;
    trackingCode: string;
    citizenName: string;
    status: string;
  } | null;
  amount: number;
  currency: string;
  methodType: PaymentMethodType;
  methodCode: string;
  bankAccountId?: number | null;
  bankAccount?: BankAccount | null;
  cryptoWalletId?: number | null;
  cryptoWallet?: CryptoWallet | null;
  status: PaymentRequestStatus;
  dueDate?: string | null;
  qrImageUrl?: string | null;
  notesForClient?: string | null;
  internalNotes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Payment = {
  id: number;
  caseId: number;
  case?: {
    id: number;
    caseNumber: string;
    trackingCode: string;
    citizenName: string;
    status: string;
  } | null;
  paymentRequestId?: number | null;
  paymentRequest?: PaymentRequest | null;
  amount: number;
  currency: string;
  methodType: PaymentMethodType;
  methodCode: string;
  bankAccountId?: number | null;
  bankAccount?: BankAccount | null;
  cryptoWalletId?: number | null;
  cryptoWallet?: CryptoWallet | null;
  status: PaymentStatus;
  payerName?: string | null;
  payerBank?: string | null;
  reference?: string | null;
  bankReference?: string | null;
  txHash?: string | null;
  paidAt?: string | null;
  receiptDocumentId?: number | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
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

export async function getCasePayments(
  token: string,
  caseId: number
): Promise<{ paymentRequests: PaymentRequest[]; payments: Payment[] }> {
  const res = await fetch(`${API_BASE}/api/admin/cases/${caseId}/payments`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 0 }
  });
  return handleResponse(res);
}

export async function createPaymentRequest(
  token: string,
  caseId: number,
  payload: Partial<Omit<PaymentRequest, 'id' | 'caseId' | 'status' | 'createdAt' | 'updatedAt'>>
): Promise<PaymentRequest> {
  const res = await fetch(`${API_BASE}/api/admin/cases/${caseId}/payment-requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  return handleResponse(res);
}

export async function updatePaymentRequest(
  token: string,
  id: number,
  payload: Partial<Omit<PaymentRequest, 'id' | 'caseId' | 'createdAt' | 'updatedAt'>>
): Promise<PaymentRequest> {
  const res = await fetch(`${API_BASE}/api/admin/payment-requests/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  return handleResponse(res);
}

export async function createPayment(
  token: string,
  caseId: number,
  payload: Partial<Omit<Payment, 'id' | 'caseId' | 'createdAt' | 'updatedAt'>>
): Promise<Payment> {
  const res = await fetch(`${API_BASE}/api/admin/cases/${caseId}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  return handleResponse(res);
}

export async function updatePayment(
  token: string,
  id: number,
  payload: Partial<Omit<Payment, 'id' | 'caseId' | 'createdAt' | 'updatedAt'>>
): Promise<Payment> {
  const res = await fetch(`${API_BASE}/api/admin/payments/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  return handleResponse(res);
}

export async function listPaymentRequestsAdmin(token: string): Promise<PaymentRequest[]> {
  const res = await fetch(`${API_BASE}/api/admin/payment-requests`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 0 }
  });
  return handleResponse(res);
}

export async function listPaymentsAdmin(token: string): Promise<Payment[]> {
  const res = await fetch(`${API_BASE}/api/admin/payments`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 0 }
  });
  return handleResponse(res);
}

export async function listBankAccounts(token: string): Promise<BankAccount[]> {
  const res = await fetch(`${API_BASE}/api/admin/bank-accounts`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 0 }
  });
  return handleResponse(res);
}

export async function listCryptoWallets(token: string): Promise<CryptoWallet[]> {
  const res = await fetch(`${API_BASE}/api/admin/crypto-wallets`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 0 }
  });
  return handleResponse(res);
}

export type PaymentResources = {
  bankAccounts: BankAccount[];
  cryptoWallets: CryptoWallet[];
  cases: { id: number; caseNumber: string; citizenName: string }[];
};

export async function listPaymentResources(token: string): Promise<PaymentResources> {
  const res = await fetch(`${API_BASE}/api/admin/payment-resources`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 0 }
  });
  return handleResponse(res);
}

export async function createBankAccount(
  token: string,
  payload: Omit<BankAccount, 'id' | 'isActive'> & { isActive?: boolean }
): Promise<BankAccount> {
  const res = await fetch(`${API_BASE}/api/admin/bank-accounts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  return handleResponse(res);
}

export async function updateBankAccountApi(
  token: string,
  id: number,
  payload: Partial<BankAccount>
): Promise<BankAccount> {
  const res = await fetch(`${API_BASE}/api/admin/bank-accounts/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  return handleResponse(res);
}

export async function deactivateBankAccountApi(token: string, id: number): Promise<BankAccount> {
  const res = await fetch(`${API_BASE}/api/admin/bank-accounts/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  return handleResponse(res);
}

export async function createCryptoWalletApi(
  token: string,
  payload: Omit<CryptoWallet, 'id' | 'isActive'> & { isActive?: boolean }
): Promise<CryptoWallet> {
  const res = await fetch(`${API_BASE}/api/admin/crypto-wallets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  return handleResponse(res);
}

export async function updateCryptoWalletApi(
  token: string,
  id: number,
  payload: Partial<CryptoWallet>
): Promise<CryptoWallet> {
  const res = await fetch(`${API_BASE}/api/admin/crypto-wallets/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  return handleResponse(res);
}

export async function deactivateCryptoWalletApi(token: string, id: number): Promise<CryptoWallet> {
  const res = await fetch(`${API_BASE}/api/admin/crypto-wallets/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  return handleResponse(res);
}
