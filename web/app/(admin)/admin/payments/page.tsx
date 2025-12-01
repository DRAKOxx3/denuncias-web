'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPayment, createPaymentRequest, updatePayment, updatePaymentRequest, type Payment, type PaymentRequest, type PaymentRequestStatus, type PaymentStatus } from '@/lib/api';
import { useAdminPayments } from './useAdminPayments';
import { usePaymentResources } from './usePaymentResources';
import Link from 'next/link';

const badgeClass = (status: string) => {
  switch (status) {
    case 'APPROVED':
      return 'bg-success/15 text-success border-success/30';
    case 'REJECTED':
    case 'CANCELLED':
      return 'bg-rose-100 text-rose-700 border-rose-200';
    case 'EXPIRED':
      return 'bg-slate-200 text-slate-700 border-slate-300';
    default:
      return 'bg-warning/15 text-amber-700 border-warning/30';
  }
};

const paymentBadgeClass = (status: string) => {
  switch (status) {
    case 'APPROVED':
      return 'bg-success/15 text-success border-success/30';
    case 'REJECTED':
      return 'bg-rose-100 text-rose-700 border-rose-200';
    default:
      return 'bg-warning/15 text-amber-700 border-warning/30';
  }
};

const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleString() : '-');

function MethodSummary({ request }: { request: PaymentRequest }) {
  if (request.methodType === 'CRYPTO') {
    return (
      <div className="flex flex-col text-sm text-slate-700">
        <span className="font-semibold text-primary">Cripto · {request.methodCode}</span>
        {request.cryptoWallet && (
          <>
            <span className="text-xs text-slate-600">Red: {request.cryptoWallet.network}</span>
            <span className="text-xs break-all">{request.cryptoWallet.address}</span>
          </>
        )}
        {request.qrImageUrl && (
          <img src={request.qrImageUrl} alt="QR" className="mt-2 h-14 w-14 rounded-md border object-contain bg-white" />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col text-sm text-slate-700">
      <span className="font-semibold text-primary">Transferencia · {request.methodCode}</span>
      {request.bankAccount && (
        <>
          <span className="text-xs text-slate-600">{request.bankAccount.bankName}</span>
          <span className="text-xs text-slate-600">IBAN: {request.bankAccount.iban}</span>
        </>
      )}
    </div>
  );
}

export default function AdminPaymentsPage() {
  const { paymentRequests, payments, isLoading, error, reload } = useAdminPayments();
  const { cases, bankAccounts, wallets, loading: loadingResources, error: resourceError } = usePaymentResources();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [requestForm, setRequestForm] = useState({
    caseId: '',
    amount: '',
    currency: 'EUR',
    methodType: 'BANK_TRANSFER' as 'BANK_TRANSFER' | 'CRYPTO',
    methodCode: 'SEPA',
    bankAccountId: '',
    cryptoWalletId: '',
    dueDate: '',
    qrImageUrl: '',
    notesForClient: '',
    internalNotes: ''
  });

  const [paymentForm, setPaymentForm] = useState({
    caseId: '',
    paymentRequestId: '',
    amount: '',
    currency: 'EUR',
    methodType: 'BANK_TRANSFER' as 'BANK_TRANSFER' | 'CRYPTO',
    methodCode: 'SEPA',
    bankAccountId: '',
    cryptoWalletId: '',
    status: 'PENDING' as PaymentStatus,
    payerName: '',
    payerBank: '',
    reference: '',
    txHash: '',
    paidAt: '',
    notes: ''
  });

  useEffect(() => {
    if (resourceError) setStatusMessage(resourceError);
  }, [resourceError]);

  const requestsByCase = useMemo(() => {
    const map: Record<number, PaymentRequest[]> = {};
    paymentRequests.forEach((pr) => {
      if (!map[pr.caseId]) map[pr.caseId] = [];
      map[pr.caseId].push(pr);
    });
    return map;
  }, [paymentRequests]);

  const handleCreateRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    if (!token) return;
    try {
      setStatusMessage(null);
      await createPaymentRequest(token, Number(requestForm.caseId), {
        amount: Number(requestForm.amount),
        currency: requestForm.currency,
        methodType: requestForm.methodType,
        methodCode: requestForm.methodCode,
        bankAccountId:
          requestForm.methodType === 'BANK_TRANSFER' && requestForm.bankAccountId
            ? Number(requestForm.bankAccountId)
            : undefined,
        cryptoWalletId:
          requestForm.methodType === 'CRYPTO' && requestForm.cryptoWalletId
            ? Number(requestForm.cryptoWalletId)
            : undefined,
        dueDate: requestForm.dueDate || undefined,
        qrImageUrl: requestForm.qrImageUrl || undefined,
        notesForClient: requestForm.notesForClient || undefined,
        internalNotes: requestForm.internalNotes || undefined
      });
      setShowRequestModal(false);
      setRequestForm({
        caseId: '',
        amount: '',
        currency: 'EUR',
        methodType: 'BANK_TRANSFER',
        methodCode: 'SEPA',
        bankAccountId: '',
        cryptoWalletId: '',
        dueDate: '',
        qrImageUrl: '',
        notesForClient: '',
        internalNotes: ''
      });
      reload();
    } catch (err: any) {
      setStatusMessage(err?.message || 'No se pudo crear la solicitud.');
    }
  };

  const handleCreatePayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    if (!token) return;
    try {
      setStatusMessage(null);
      await createPayment(token, Number(paymentForm.caseId), {
        paymentRequestId: paymentForm.paymentRequestId ? Number(paymentForm.paymentRequestId) : undefined,
        amount: Number(paymentForm.amount),
        currency: paymentForm.currency,
        methodType: paymentForm.methodType,
        methodCode: paymentForm.methodCode,
        bankAccountId:
          paymentForm.methodType === 'BANK_TRANSFER' && paymentForm.bankAccountId
            ? Number(paymentForm.bankAccountId)
            : undefined,
        cryptoWalletId:
          paymentForm.methodType === 'CRYPTO' && paymentForm.cryptoWalletId
            ? Number(paymentForm.cryptoWalletId)
            : undefined,
        status: paymentForm.status,
        payerName: paymentForm.payerName || undefined,
        payerBank: paymentForm.payerBank || undefined,
        reference: paymentForm.reference || undefined,
        txHash: paymentForm.txHash || undefined,
        paidAt: paymentForm.paidAt || undefined,
        notes: paymentForm.notes || undefined
      });
      setShowPaymentModal(false);
      setPaymentForm({
        caseId: '',
        paymentRequestId: '',
        amount: '',
        currency: 'EUR',
        methodType: 'BANK_TRANSFER',
        methodCode: 'SEPA',
        bankAccountId: '',
        cryptoWalletId: '',
        status: 'PENDING',
        payerName: '',
        payerBank: '',
        reference: '',
        txHash: '',
        paidAt: '',
        notes: ''
      });
      reload();
    } catch (err: any) {
      setStatusMessage(err?.message || 'No se pudo registrar el pago.');
    }
  };

  const handleUpdateRequestStatus = async (id: number, status: PaymentRequestStatus) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    if (!token) return;
    try {
      await updatePaymentRequest(token, id, { status });
      reload();
    } catch (err: any) {
      setStatusMessage(err?.message || 'No se pudo actualizar el estado.');
    }
  };

  const handleUpdatePaymentStatus = async (id: number, status: PaymentStatus) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    if (!token) return;
    try {
      await updatePayment(token, id, { status });
      reload();
    } catch (err: any) {
      setStatusMessage(err?.message || 'No se pudo actualizar el estado del pago.');
    }
  };

  const caseOptions = cases.map((c) => ({ value: c.id, label: `${(c as any).numero_expediente || (c as any).caseNumber} · ${c.denunciante_nombre || (c as any).citizenName}` }));

  const paymentRequestsForSelectedCase = paymentForm.caseId
    ? requestsByCase[Number(paymentForm.caseId)] || []
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-primary/70">Pagos</p>
          <h1 className="text-2xl font-semibold text-primary">Centro de control de pagos</h1>
          <p className="text-sm text-slate-600">
            Gestiona solicitudes de pago, pagos registrados y métodos bancarios o cripto asociados a los casos.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button className="button-secondary" onClick={() => setShowPaymentModal(true)}>
            Registrar pago
          </button>
          <button className="button-primary" onClick={() => setShowRequestModal(true)}>
            Nueva solicitud de pago
          </button>
        </div>
      </div>

      {statusMessage && <p className="text-sm text-amber-700">{statusMessage}</p>}
      {error && <p className="text-sm text-amber-700">{error}</p>}
      {isLoading && <p className="text-sm text-slate-500">Cargando pagos...</p>}
      {loadingResources && <p className="text-sm text-slate-500">Cargando cuentas bancarias y wallets...</p>}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b">
            <div>
              <p className="text-xs uppercase tracking-widest text-primary/70">Solicitudes</p>
              <h2 className="text-lg font-semibold text-primary">Solicitudes de pago</h2>
            </div>
            <button className="button-secondary text-sm" onClick={reload}>
              Recargar
            </button>
          </div>
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-primary/5 text-left text-slate-700">
                <tr>
                  <th className="p-3 font-semibold">Caso</th>
                  <th className="p-3 font-semibold">Importe</th>
                  <th className="p-3 font-semibold">Método</th>
                  <th className="p-3 font-semibold">Estado</th>
                  <th className="p-3 font-semibold">Fechas</th>
                  <th className="p-3 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paymentRequests.map((pr, idx) => (
                  <tr key={pr.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                    <td className="p-3 align-top">
                      <div className="flex flex-col gap-1">
                        <span className="text-primary font-semibold">{pr.case?.caseNumber || pr.caseId}</span>
                        <span className="text-xs text-slate-600">{pr.case?.citizenName || '-'}</span>
                        <Link className="text-xs text-primary hover:underline" href={`/admin/cases/${pr.caseId}`}>
                          Ver caso
                        </Link>
                      </div>
                    </td>
                    <td className="p-3 align-top">
                      <div className="font-semibold text-slate-800">
                        {pr.amount} {pr.currency}
                      </div>
                    </td>
                    <td className="p-3 align-top">
                      <MethodSummary request={pr} />
                    </td>
                    <td className="p-3 align-top">
                      <span className={`border px-3 py-1 rounded-full text-xs font-semibold ${badgeClass(pr.status)}`}>
                        {pr.status}
                      </span>
                    </td>
                    <td className="p-3 align-top text-xs text-slate-600">
                      <div>Creada: {formatDate(pr.createdAt as any)}</div>
                      <div>Vence: {pr.dueDate ? formatDate(pr.dueDate as any) : '-'}</div>
                    </td>
                    <td className="p-3 align-top">
                      <select
                        className="w-full border rounded-md px-3 py-2 text-sm"
                        value={pr.status}
                        onChange={(e) => handleUpdateRequestStatus(pr.id, e.target.value as PaymentRequestStatus)}
                      >
                        {['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED'].map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {paymentRequests.length === 0 && !isLoading && (
              <p className="text-sm text-slate-500 p-4">No hay solicitudes registradas.</p>
            )}
          </div>
        </div>

        <div className="card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b">
            <div>
              <p className="text-xs uppercase tracking-widest text-primary/70">Pagos</p>
              <h2 className="text-lg font-semibold text-primary">Pagos registrados</h2>
            </div>
            <button className="button-secondary text-sm" onClick={reload}>
              Recargar
            </button>
          </div>
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-primary/5 text-left text-slate-700">
                <tr>
                  <th className="p-3 font-semibold">Caso</th>
                  <th className="p-3 font-semibold">Monto</th>
                  <th className="p-3 font-semibold">Método</th>
                  <th className="p-3 font-semibold">Estado</th>
                  <th className="p-3 font-semibold">Pagador / referencia</th>
                  <th className="p-3 font-semibold">Solicitud</th>
                  <th className="p-3 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p, idx) => (
                  <tr key={p.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                    <td className="p-3 align-top">
                      <div className="flex flex-col gap-1">
                        <span className="text-primary font-semibold">{p.case?.caseNumber || p.caseId}</span>
                        <span className="text-xs text-slate-600">{p.case?.citizenName || '-'}</span>
                        <Link className="text-xs text-primary hover:underline" href={`/admin/cases/${p.caseId}`}>
                          Ver caso
                        </Link>
                      </div>
                    </td>
                    <td className="p-3 align-top font-semibold text-slate-800">
                      {p.amount} {p.currency}
                    </td>
                    <td className="p-3 align-top text-sm text-slate-700">
                      {p.methodType === 'CRYPTO' ? 'Cripto' : 'Transferencia'} · {p.methodCode}
                      {p.cryptoWallet && (
                        <div className="text-xs text-slate-600 break-all">{p.cryptoWallet.address}</div>
                      )}
                      {p.bankAccount && <div className="text-xs text-slate-600">{p.bankAccount.bankName}</div>}
                    </td>
                    <td className="p-3 align-top">
                      <span className={`border px-3 py-1 rounded-full text-xs font-semibold ${paymentBadgeClass(p.status)}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="p-3 align-top text-xs text-slate-600">
                      <div>{p.payerName || '-'}</div>
                      <div>{p.payerBank || p.txHash || p.reference || '-'}</div>
                      <div>Pagado: {formatDate(p.paidAt as any)}</div>
                    </td>
                    <td className="p-3 align-top text-xs text-slate-600">
                      {p.paymentRequestId ? `Solicitud #${p.paymentRequestId}` : '—'}
                    </td>
                    <td className="p-3 align-top">
                      <select
                        className="w-full border rounded-md px-3 py-2 text-sm"
                        value={p.status}
                        onChange={(e) => handleUpdatePaymentStatus(p.id, e.target.value as PaymentStatus)}
                      >
                        {['PENDING', 'APPROVED', 'REJECTED'].map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {payments.length === 0 && !isLoading && (
              <p className="text-sm text-slate-500 p-4">No hay pagos registrados.</p>
            )}
          </div>
        </div>
      </div>

      {showRequestModal && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center z-20 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div>
                <p className="text-xs uppercase tracking-widest text-primary/70">Nueva solicitud</p>
                <h3 className="text-lg font-semibold text-primary">Crear solicitud de pago</h3>
              </div>
              <button className="text-slate-500 hover:text-slate-800" onClick={() => setShowRequestModal(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateRequest} className="p-5 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <label className="space-y-1 text-sm">
                  <span className="font-semibold text-slate-700">Caso</span>
                  <select
                    required
                    className="w-full border rounded-md px-3 py-2"
                    value={requestForm.caseId}
                    onChange={(e) => setRequestForm({ ...requestForm, caseId: e.target.value })}
                  >
                    <option value="">Selecciona un caso</option>
                    {caseOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1 text-sm">
                  <span className="font-semibold text-slate-700">Importe</span>
                  <input
                    required
                    type="number"
                    step="0.01"
                    className="w-full border rounded-md px-3 py-2"
                    value={requestForm.amount}
                    onChange={(e) => setRequestForm({ ...requestForm, amount: e.target.value })}
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="font-semibold text-slate-700">Moneda</span>
                  <input
                    className="w-full border rounded-md px-3 py-2"
                    value={requestForm.currency}
                    onChange={(e) => setRequestForm({ ...requestForm, currency: e.target.value })}
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="font-semibold text-slate-700">Método</span>
                  <select
                    className="w-full border rounded-md px-3 py-2"
                    value={requestForm.methodType}
                    onChange={(e) => setRequestForm({ ...requestForm, methodType: e.target.value as 'BANK_TRANSFER' | 'CRYPTO' })}
                  >
                    <option value="BANK_TRANSFER">Transferencia bancaria</option>
                    <option value="CRYPTO">Criptomonedas</option>
                  </select>
                </label>
              </div>

              {requestForm.methodType === 'BANK_TRANSFER' ? (
                <div className="grid md:grid-cols-2 gap-4">
                  <label className="space-y-1 text-sm">
                    <span className="font-semibold text-slate-700">Método bancario</span>
                    <input
                      className="w-full border rounded-md px-3 py-2"
                      value={requestForm.methodCode}
                      onChange={(e) => setRequestForm({ ...requestForm, methodCode: e.target.value })}
                      placeholder="SEPA"
                    />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="font-semibold text-slate-700">Cuenta bancaria</span>
                    <select
                    className="w-full border rounded-md px-3 py-2"
                    value={requestForm.bankAccountId}
                    onChange={(e) => setRequestForm({ ...requestForm, bankAccountId: e.target.value })}
                  >
                    <option value="">Selecciona cuenta</option>
                    {bankAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.label} · {acc.iban}
                      </option>
                    ))}
                  </select>
                  {bankAccounts.length === 0 && (
                    <p className="text-xs text-amber-700">No hay cuentas bancarias activas. Carga la semilla o crea una desde el backend.</p>
                  )}
                </label>
              </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  <label className="space-y-1 text-sm">
                    <span className="font-semibold text-slate-700">Cripto / red</span>
                    <input
                      className="w-full border rounded-md px-3 py-2"
                      value={requestForm.methodCode}
                      onChange={(e) => setRequestForm({ ...requestForm, methodCode: e.target.value })}
                      placeholder="BTC, USDT_TRC20"
                    />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="font-semibold text-slate-700">Wallet</span>
                    <select
                    className="w-full border rounded-md px-3 py-2"
                    value={requestForm.cryptoWalletId}
                    onChange={(e) => setRequestForm({ ...requestForm, cryptoWalletId: e.target.value })}
                  >
                    <option value="">Selecciona wallet</option>
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.label} · {w.asset} ({w.network})
                      </option>
                    ))}
                  </select>
                  {wallets.length === 0 && (
                    <p className="text-xs text-amber-700">No hay wallets configuradas. Revisa la semilla o crea una wallet en backend.</p>
                  )}
                </label>
                <label className="space-y-1 text-sm md:col-span-2">
                  <span className="font-semibold text-slate-700">URL imagen QR</span>
                  <input
                      className="w-full border rounded-md px-3 py-2"
                      value={requestForm.qrImageUrl}
                      onChange={(e) => setRequestForm({ ...requestForm, qrImageUrl: e.target.value })}
                      placeholder="https://..."
                    />
                    {requestForm.qrImageUrl && (
                      <img
                        src={requestForm.qrImageUrl}
                        alt="QR preview"
                        className="mt-2 h-24 w-24 rounded border object-contain"
                      />
                    )}
                  </label>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <label className="space-y-1 text-sm">
                  <span className="font-semibold text-slate-700">Fecha límite (opcional)</span>
                  <input
                    type="datetime-local"
                    className="w-full border rounded-md px-3 py-2"
                    value={requestForm.dueDate}
                    onChange={(e) => setRequestForm({ ...requestForm, dueDate: e.target.value })}
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="font-semibold text-slate-700">Mensaje para cliente</span>
                  <input
                    className="w-full border rounded-md px-3 py-2"
                    value={requestForm.notesForClient}
                    onChange={(e) => setRequestForm({ ...requestForm, notesForClient: e.target.value })}
                  />
                </label>
              </div>
              <label className="space-y-1 text-sm block">
                <span className="font-semibold text-slate-700">Notas internas</span>
                <textarea
                  className="w-full border rounded-md px-3 py-2"
                  rows={3}
                  value={requestForm.internalNotes}
                  onChange={(e) => setRequestForm({ ...requestForm, internalNotes: e.target.value })}
                />
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" className="button-secondary" onClick={() => setShowRequestModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="button-primary">
                  Guardar solicitud
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center z-20 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div>
                <p className="text-xs uppercase tracking-widest text-primary/70">Registrar pago</p>
                <h3 className="text-lg font-semibold text-primary">Añadir un pago</h3>
              </div>
              <button className="text-slate-500 hover:text-slate-800" onClick={() => setShowPaymentModal(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleCreatePayment} className="p-5 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <label className="space-y-1 text-sm">
                  <span className="font-semibold text-slate-700">Caso</span>
                  <select
                    required
                    className="w-full border rounded-md px-3 py-2"
                    value={paymentForm.caseId}
                    onChange={(e) => setPaymentForm({ ...paymentForm, caseId: e.target.value, paymentRequestId: '' })}
                  >
                    <option value="">Selecciona un caso</option>
                    {caseOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1 text-sm">
                  <span className="font-semibold text-slate-700">Solicitud asociada (opcional)</span>
                  <select
                    className="w-full border rounded-md px-3 py-2"
                    value={paymentForm.paymentRequestId}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentRequestId: e.target.value })}
                  >
                    <option value="">Sin solicitud</option>
                    {paymentRequestsForSelectedCase.map((pr) => (
                      <option key={pr.id} value={pr.id}>
                        #{pr.id} · {pr.amount} {pr.currency}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1 text-sm">
                  <span className="font-semibold text-slate-700">Importe</span>
                  <input
                    required
                    type="number"
                    step="0.01"
                    className="w-full border rounded-md px-3 py-2"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="font-semibold text-slate-700">Moneda</span>
                  <input
                    className="w-full border rounded-md px-3 py-2"
                    value={paymentForm.currency}
                    onChange={(e) => setPaymentForm({ ...paymentForm, currency: e.target.value })}
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="font-semibold text-slate-700">Método</span>
                  <select
                    className="w-full border rounded-md px-3 py-2"
                    value={paymentForm.methodType}
                    onChange={(e) => setPaymentForm({ ...paymentForm, methodType: e.target.value as 'BANK_TRANSFER' | 'CRYPTO' })}
                  >
                    <option value="BANK_TRANSFER">Transferencia bancaria</option>
                    <option value="CRYPTO">Criptomonedas</option>
                  </select>
                </label>
                <label className="space-y-1 text-sm">
                  <span className="font-semibold text-slate-700">Código método</span>
                  <input
                    className="w-full border rounded-md px-3 py-2"
                    value={paymentForm.methodCode}
                    onChange={(e) => setPaymentForm({ ...paymentForm, methodCode: e.target.value })}
                    placeholder="SEPA, BTC, USDT_TRC20"
                  />
                </label>
              </div>

              {paymentForm.methodType === 'BANK_TRANSFER' ? (
                <div className="grid md:grid-cols-2 gap-4">
                  <label className="space-y-1 text-sm">
                    <span className="font-semibold text-slate-700">Cuenta bancaria</span>
                    <select
                      className="w-full border rounded-md px-3 py-2"
                      value={paymentForm.bankAccountId}
                      onChange={(e) => setPaymentForm({ ...paymentForm, bankAccountId: e.target.value })}
                    >
                      <option value="">Selecciona cuenta</option>
                      {bankAccounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.label} · {acc.iban}
                        </option>
                      ))}
                    </select>
                    {bankAccounts.length === 0 && (
                      <p className="text-xs text-amber-700">No hay cuentas bancarias activas. Ejecuta la semilla o registra una cuenta.</p>
                    )}
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="font-semibold text-slate-700">Banco pagador</span>
                    <input
                      className="w-full border rounded-md px-3 py-2"
                      value={paymentForm.payerBank}
                      onChange={(e) => setPaymentForm({ ...paymentForm, payerBank: e.target.value })}
                    />
                  </label>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  <label className="space-y-1 text-sm">
                    <span className="font-semibold text-slate-700">Wallet</span>
                    <select
                      className="w-full border rounded-md px-3 py-2"
                      value={paymentForm.cryptoWalletId}
                      onChange={(e) => setPaymentForm({ ...paymentForm, cryptoWalletId: e.target.value })}
                    >
                      <option value="">Selecciona wallet</option>
                      {wallets.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.label} · {w.asset} ({w.network})
                        </option>
                      ))}
                    </select>
                    {wallets.length === 0 && (
                      <p className="text-xs text-amber-700">No hay wallets configuradas. Revisa la semilla o crea una wallet en backend.</p>
                    )}
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="font-semibold text-slate-700">Tx Hash</span>
                    <input
                      className="w-full border rounded-md px-3 py-2"
                      value={paymentForm.txHash}
                      onChange={(e) => setPaymentForm({ ...paymentForm, txHash: e.target.value })}
                    />
                  </label>
                </div>
              )}

              <div className="grid md:grid-cols-3 gap-4">
                <label className="space-y-1 text-sm">
                  <span className="font-semibold text-slate-700">Pagador</span>
                  <input
                    className="w-full border rounded-md px-3 py-2"
                    value={paymentForm.payerName}
                    onChange={(e) => setPaymentForm({ ...paymentForm, payerName: e.target.value })}
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="font-semibold text-slate-700">Referencia</span>
                  <input
                    className="w-full border rounded-md px-3 py-2"
                    value={paymentForm.reference}
                    onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="font-semibold text-slate-700">Fecha de pago</span>
                  <input
                    type="datetime-local"
                    className="w-full border rounded-md px-3 py-2"
                    value={paymentForm.paidAt}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paidAt: e.target.value })}
                  />
                </label>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <label className="space-y-1 text-sm">
                  <span className="font-semibold text-slate-700">Estado</span>
                  <select
                    className="w-full border rounded-md px-3 py-2"
                    value={paymentForm.status}
                    onChange={(e) => setPaymentForm({ ...paymentForm, status: e.target.value as PaymentStatus })}
                  >
                    <option value="PENDING">PENDIENTE</option>
                    <option value="APPROVED">APROBADO</option>
                    <option value="REJECTED">RECHAZADO</option>
                  </select>
                </label>
                <label className="space-y-1 text-sm">
                  <span className="font-semibold text-slate-700">Notas</span>
                  <input
                    className="w-full border rounded-md px-3 py-2"
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  />
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" className="button-secondary" onClick={() => setShowPaymentModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="button-primary">
                  Guardar pago
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
