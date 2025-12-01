'use client';

import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  createPayment,
  createPaymentRequest,
  listAdminCases,
  updateAdminCase,
  updatePayment,
  updatePaymentRequest
} from '@/lib/api';
import type {
  AdminCase,
  PaymentMethodType,
  PaymentRequestStatus,
  PaymentStatus
} from '@/lib/api';
import { useCasePayments } from './useCasePayments';
import { usePaymentResources } from '../payments/usePaymentResources';

const paymentRequestStatuses: PaymentRequestStatus[] = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED'];
const paymentStatuses: PaymentStatus[] = ['PENDING', 'APPROVED', 'REJECTED'];

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return date.toLocaleString();
}

function formatAmount(amount?: number, currency?: string) {
  if (amount == null) return '—';
  return `${amount} ${currency || ''}`.trim();
}

function StatusBadge({ status }: { status: PaymentRequestStatus | PaymentStatus }) {
  const statusKey = status.toUpperCase();
  let classes = 'bg-slate-100 text-slate-700 border-slate-200';
  if (statusKey === 'PENDING') classes = 'bg-amber-100 text-amber-800 border-amber-200';
  if (statusKey === 'APPROVED') classes = 'bg-emerald-100 text-emerald-800 border-emerald-200';
  if (statusKey === 'REJECTED' || statusKey === 'CANCELLED')
    classes = 'bg-rose-100 text-rose-800 border-rose-200';
  if (statusKey === 'EXPIRED') classes = 'bg-slate-200 text-slate-700 border-slate-300';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${classes}`}>
      {statusKey}
    </span>
  );
}

function MethodLabel({
  methodType,
  methodCode,
  bankLabel,
  walletLabel
}: {
  methodType: PaymentMethodType;
  methodCode?: string;
  bankLabel?: string | null;
  walletLabel?: string | null;
}) {
  if (methodType === 'BANK_TRANSFER') {
    return <span>{bankLabel || `Transferencia ${methodCode || ''}`.trim()}</span>;
  }
  return <span>{walletLabel || methodCode || 'Cripto'}</span>;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-auto bg-black/30 p-4">
      <div className="mt-10 w-full max-w-2xl rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-primary/70">Pagos</p>
            <h2 className="text-lg font-semibold text-primary">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cerrar
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export default function AdminEditCasePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [form, setForm] = useState<AdminCase | null>(null);
  const [activeTab, setActiveTab] = useState<'detalle' | 'pagos'>('detalle');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [requestForm, setRequestForm] = useState({
    amount: '',
    currency: 'EUR',
    methodType: 'BANK_TRANSFER' as PaymentMethodType,
    methodCode: 'SEPA',
    bankAccountId: '',
    cryptoWalletId: '',
    dueDate: '',
    qrImageUrl: '',
    notesForClient: '',
    internalNotes: ''
  });
  const [paymentForm, setPaymentForm] = useState({
    paymentRequestId: '',
    amount: '',
    currency: 'EUR',
    methodType: 'BANK_TRANSFER' as PaymentMethodType,
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
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const caseId = Number(params.id);
  const { bankAccounts, wallets, loading: resourcesLoading, error: resourcesError, reload: reloadResources } =
    usePaymentResources();

  const bankOptionsForRequest = useMemo(
    () =>
      bankAccounts
        .filter((b) => b.isActive && (!requestForm.currency || b.currency === requestForm.currency))
        .map((b) => ({ id: b.id, label: `${b.label} (${b.currency})` })),
    [bankAccounts, requestForm.currency]
  );

  const walletOptionsForRequest = useMemo(
    () => wallets.filter((w) => w.isActive).map((w) => ({ id: w.id, label: `${w.label} · ${w.network}` })),
    [wallets]
  );

  const bankOptionsForPayment = useMemo(
    () =>
      bankAccounts
        .filter((b) => b.isActive && (!paymentForm.currency || b.currency === paymentForm.currency))
        .map((b) => ({ id: b.id, label: `${b.label} (${b.currency})` })),
    [bankAccounts, paymentForm.currency]
  );

  const walletOptionsForPayment = useMemo(
    () => wallets.filter((w) => w.isActive).map((w) => ({ id: w.id, label: `${w.label} · ${w.network}` })),
    [wallets]
  );

  useEffect(() => {
    if (activeTab === 'pagos') {
      reloadResources();
    }
  }, [activeTab, reloadResources]);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      setStatus('Necesitas iniciar sesión.');
      return;
    }

    listAdminCases(token)
      .then((data) => {
        const current = data.find((c) => c.id === Number(params.id));
        if (!current) {
          setStatus('Caso no encontrado.');
          return;
        }
        setForm(current);
        setStatus(null);
      })
      .catch((error: any) => setStatus(error?.message || 'No se pudo cargar el caso'));
  }, [params.id]);

  const handleChange = (key: keyof AdminCase, value: string) => {
    if (!form) return;
    setForm({ ...form, [key]: value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form) return;
    const token = localStorage.getItem('adminToken');
    if (!token) {
      setStatus('Necesitas iniciar sesión.');
      return;
    }
    setStatus('Guardando cambios...');

    try {
      await updateAdminCase(token, form.id, form);
      setStatus('Cambios guardados');
      router.push('/admin/cases');
    } catch (error: any) {
      setStatus(error?.message || 'No se pudo actualizar el caso');
    }
  };

  const handleCreatePaymentRequest = async (e: FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('adminToken');
    if (!token) {
      setStatus('Necesitas iniciar sesión.');
      return;
    }
    setSubmittingRequest(true);
    try {
      await createPaymentRequest(token, caseId, {
        amount: Number(requestForm.amount),
        currency: requestForm.currency,
        methodType: requestForm.methodType,
        methodCode: requestForm.methodCode,
        bankAccountId: requestForm.bankAccountId ? Number(requestForm.bankAccountId) : undefined,
        cryptoWalletId: requestForm.cryptoWalletId ? Number(requestForm.cryptoWalletId) : undefined,
        dueDate: requestForm.dueDate || undefined,
        qrImageUrl: requestForm.qrImageUrl || undefined,
        notesForClient: requestForm.notesForClient || undefined,
        internalNotes: requestForm.internalNotes || undefined
      });
      await reload();
      setShowRequestModal(false);
      setRequestForm({
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
    } catch (error: any) {
      setStatus(error?.message || 'No se pudo crear la solicitud de pago.');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleUpdateRequestStatus = async (id: number, newStatus: PaymentRequestStatus) => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      setStatus('Necesitas iniciar sesión.');
      return;
    }
    try {
      await updatePaymentRequest(token, id, { status: newStatus });
      await reload();
    } catch (error: any) {
      setStatus(error?.message || 'No se pudo actualizar la solicitud.');
    }
  };

  const handleCreatePayment = async (e: FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('adminToken');
    if (!token) {
      setStatus('Necesitas iniciar sesión.');
      return;
    }
    setSubmittingPayment(true);
    try {
      await createPayment(token, caseId, {
        paymentRequestId: paymentForm.paymentRequestId ? Number(paymentForm.paymentRequestId) : undefined,
        amount: Number(paymentForm.amount),
        currency: paymentForm.currency,
        methodType: paymentForm.methodType,
        methodCode: paymentForm.methodCode,
        bankAccountId: paymentForm.bankAccountId ? Number(paymentForm.bankAccountId) : undefined,
        cryptoWalletId: paymentForm.cryptoWalletId ? Number(paymentForm.cryptoWalletId) : undefined,
        status: paymentForm.status,
        payerName: paymentForm.payerName || undefined,
        payerBank: paymentForm.payerBank || undefined,
        reference: paymentForm.reference || undefined,
        txHash: paymentForm.txHash || undefined,
        paidAt: paymentForm.paidAt || undefined,
        notes: paymentForm.notes || undefined
      });
      await reload();
      setShowPaymentModal(false);
      setPaymentForm({
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
    } catch (error: any) {
      setStatus(error?.message || 'No se pudo registrar el pago.');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleUpdatePaymentStatus = async (id: number, newStatus: PaymentStatus) => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      setStatus('Necesitas iniciar sesión.');
      return;
    }
    try {
      await updatePayment(token, id, { status: newStatus });
      await reload();
    } catch (error: any) {
      setStatus(error?.message || 'No se pudo actualizar el pago.');
    }
  };

  const methodSelector = (current: PaymentMethodType, handler: (value: PaymentMethodType) => void) => (
    <select
      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
      value={current}
      onChange={(e) => handler(e.target.value as PaymentMethodType)}
    >
      <option value="BANK_TRANSFER">Transferencia bancaria</option>
      <option value="CRYPTO">Criptomoneda</option>
    </select>
  );

  if (!form) {
    return <p className="text-sm text-slate-600">{status || 'Cargando...'}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="card space-y-4 shadow-md">
        <div className="flex flex-col gap-1">
          <p className="text-xs uppercase tracking-widest text-primary/70">Expediente</p>
          <h1 className="text-2xl font-semibold text-primary">Caso #{form.numero_expediente}</h1>
          <p className="text-sm text-slate-600">Gestión y seguimiento del caso</p>
        </div>
        <div className="flex flex-wrap gap-2 border-b pb-2 text-sm font-semibold text-primary">
          {[
            { key: 'detalle', label: 'Detalle' },
            { key: 'pagos', label: 'Pagos' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as 'detalle' | 'pagos')}
              className={`rounded-full px-4 py-2 transition ${
                activeTab === tab.key ? 'bg-primary text-white' : 'bg-primary/10 text-primary hover:bg-primary/20'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'detalle' && (
        <div className="card space-y-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-primary/70">Edición</p>
              <h2 className="text-xl font-semibold text-primary">Actualizar caso</h2>
            </div>
          </div>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Número de expediente
              <input
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
                value={form.numero_expediente}
                onChange={(e) => handleChange('numero_expediente', e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Código de seguimiento
              <input
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
                value={form.codigo_seguimiento}
                onChange={(e) => handleChange('codigo_seguimiento', e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Nombre del denunciante
              <input
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
                value={form.denunciante_nombre}
                onChange={(e) => handleChange('denunciante_nombre', e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Documento del denunciante
              <input
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
                value={form.denunciante_documento}
                onChange={(e) => handleChange('denunciante_documento', e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Dependencia
              <input
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
                value={form.dependencia}
                onChange={(e) => handleChange('dependencia', e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Estado
              <input
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
                value={form.estado}
                onChange={(e) => handleChange('estado', e.target.value)}
              />
            </label>
            <div className="md:col-span-2 flex flex-wrap gap-3">
              <button type="submit" className="button-primary">
                Guardar cambios
              </button>
              <button type="button" className="button-secondary" onClick={() => router.push('/admin/cases')}>
                Cancelar
              </button>
            </div>
          </form>
          {status && <p className="text-sm text-amber-700">{status}</p>}
        </div>
      )}

      {activeTab === 'pagos' && (
        <div className="space-y-6">
          <div className="card space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-primary/70">Solicitudes</p>
                <h2 className="text-xl font-semibold text-primary">Solicitudes de pago</h2>
              </div>
              <button className="button-primary" onClick={() => setShowRequestModal(true)}>
                Nueva solicitud de pago
              </button>
            </div>
            {resourcesLoading && <p className="text-sm text-slate-500">Cargando cuentas y wallets...</p>}
            {resourcesError && <p className="text-sm text-rose-700">{resourcesError}</p>}
            {isLoadingPayments && <p className="text-sm text-slate-500">Cargando pagos...</p>}
            {paymentsError && <p className="text-sm text-rose-700">{paymentsError}</p>}
            {!isLoadingPayments && paymentRequests.length === 0 && (
              <p className="text-sm text-slate-500">No hay solicitudes de pago registradas.</p>
            )}
            {paymentRequests.length > 0 && (
              <div className="overflow-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-primary/5 text-left text-slate-700">
                    <tr>
                      <th className="p-3 font-semibold">Creada</th>
                      <th className="p-3 font-semibold">Importe</th>
                      <th className="p-3 font-semibold">Método</th>
                      <th className="p-3 font-semibold">Estado</th>
                      <th className="p-3 font-semibold">Vencimiento</th>
                      <th className="p-3 font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentRequests.map((pr, idx) => (
                      <tr key={pr.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                        <td className="p-3 text-slate-700">{formatDate(pr.createdAt)}</td>
                        <td className="p-3 font-semibold text-primary">{formatAmount(Number(pr.amount), pr.currency)}</td>
                        <td className="p-3 text-slate-700">
                          <MethodLabel
                            methodType={pr.methodType}
                            methodCode={pr.methodCode}
                            bankLabel={pr.bankAccount?.label}
                            walletLabel={pr.cryptoWallet?.label}
                          />
                        </td>
                        <td className="p-3">
                          <StatusBadge status={pr.status} />
                        </td>
                        <td className="p-3 text-slate-700">{formatDate(pr.dueDate)}</td>
                        <td className="p-3">
                          <div className="flex flex-col gap-2 text-xs text-slate-600">
                            <span className="font-semibold">Actualizar estado</span>
                            <select
                              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                              defaultValue={pr.status}
                              onChange={(e) => handleUpdateRequestStatus(pr.id, e.target.value as PaymentRequestStatus)}
                            >
                              {paymentRequestStatuses.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-primary/70">Pagos</p>
                <h2 className="text-xl font-semibold text-primary">Pagos registrados</h2>
              </div>
              <button className="button-secondary" onClick={() => setShowPaymentModal(true)}>
                Registrar pago
              </button>
            </div>
            {resourcesLoading && <p className="text-sm text-slate-500">Cargando cuentas y wallets...</p>}
            {resourcesError && <p className="text-sm text-rose-700">{resourcesError}</p>}
            {isLoadingPayments && <p className="text-sm text-slate-500">Cargando pagos...</p>}
            {paymentsError && <p className="text-sm text-rose-700">{paymentsError}</p>}
            {!isLoadingPayments && payments.length === 0 && <p className="text-sm text-slate-500">No hay pagos registrados.</p>}
            {payments.length > 0 && (
              <div className="overflow-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-primary/5 text-left text-slate-700">
                    <tr>
                      <th className="p-3 font-semibold">Fecha</th>
                      <th className="p-3 font-semibold">Importe</th>
                      <th className="p-3 font-semibold">Método</th>
                      <th className="p-3 font-semibold">Estado</th>
                      <th className="p-3 font-semibold">Pagador / Referencia</th>
                      <th className="p-3 font-semibold">Solicitud</th>
                      <th className="p-3 font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p, idx) => (
                      <tr key={p.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                        <td className="p-3 text-slate-700">{formatDate(p.paidAt || p.createdAt)}</td>
                        <td className="p-3 font-semibold text-primary">{formatAmount(Number(p.amount), p.currency)}</td>
                        <td className="p-3 text-slate-700">
                          <MethodLabel
                            methodType={p.methodType}
                            methodCode={p.methodCode}
                            bankLabel={p.bankAccount?.label}
                            walletLabel={p.cryptoWallet?.label}
                          />
                        </td>
                        <td className="p-3">
                          <StatusBadge status={p.status} />
                        </td>
                        <td className="p-3 text-slate-700">
                          {p.methodType === 'BANK_TRANSFER' ? (
                            <div className="space-y-1">
                              {p.payerName && <p className="font-semibold">{p.payerName}</p>}
                              {p.payerBank && <p className="text-xs text-slate-600">{p.payerBank}</p>}
                              {p.reference && <p className="text-xs text-slate-600">Ref: {p.reference}</p>}
                            </div>
                          ) : (
                            <div className="space-y-1">
                              {p.txHash && <p className="text-xs text-slate-600">Hash: {p.txHash}</p>}
                              {p.payerName && <p className="text-xs text-slate-600">Pagador: {p.payerName}</p>}
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-slate-700">{p.paymentRequestId ? `#${p.paymentRequestId}` : '—'}</td>
                        <td className="p-3">
                          <div className="flex flex-col gap-2 text-xs text-slate-600">
                            <span className="font-semibold">Actualizar estado</span>
                            <select
                              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                              defaultValue={p.status}
                              onChange={(e) => handleUpdatePaymentStatus(p.id, e.target.value as PaymentStatus)}
                            >
                              {paymentStatuses.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {status && <p className="text-sm text-amber-700">{status}</p>}
        </div>
      )}

      {showRequestModal && (
        <Modal title="Nueva solicitud de pago" onClose={() => setShowRequestModal(false)}>
          <form className="space-y-4" onSubmit={handleCreatePaymentRequest}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Importe
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  value={requestForm.amount}
                  onChange={(e) => setRequestForm({ ...requestForm, amount: e.target.value })}
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Moneda
                <input
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  value={requestForm.currency}
                  onChange={(e) => setRequestForm({ ...requestForm, currency: e.target.value })}
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Tipo de método
                {methodSelector(requestForm.methodType, (v) =>
                  setRequestForm({ ...requestForm, methodType: v, bankAccountId: '', cryptoWalletId: '' })
                )}
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Código de método
                <input
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  value={requestForm.methodCode}
                  onChange={(e) => setRequestForm({ ...requestForm, methodCode: e.target.value })}
                  placeholder="SEPA, BTC, USDT_TRC20"
                />
              </label>
              {requestForm.methodType === 'BANK_TRANSFER' && (
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Cuenta bancaria
                  <select
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    value={requestForm.bankAccountId}
                    onChange={(e) => setRequestForm({ ...requestForm, bankAccountId: e.target.value, cryptoWalletId: '' })}
                  >
                    <option value="">Selecciona una cuenta</option>
                    {bankOptionsForRequest.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label} (#{option.id})
                      </option>
                    ))}
                  </select>
                  {bankOptionsForRequest.length === 0 && (
                    <span className="text-xs text-amber-700">No hay cuentas bancarias activas disponibles.</span>
                  )}
                </label>
              )}
              {requestForm.methodType === 'CRYPTO' && (
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Wallet cripto
                  <select
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    value={requestForm.cryptoWalletId}
                    onChange={(e) => setRequestForm({ ...requestForm, cryptoWalletId: e.target.value, bankAccountId: '' })}
                  >
                    <option value="">Selecciona una wallet</option>
                    {walletOptionsForRequest.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label} (#{option.id})
                      </option>
                    ))}
                  </select>
                  {walletOptionsForRequest.length === 0 && (
                    <span className="text-xs text-amber-700">No hay wallets activas disponibles.</span>
                  )}
                </label>
              )}
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Fecha de vencimiento
                <input
                  type="datetime-local"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  value={requestForm.dueDate}
                  onChange={(e) => setRequestForm({ ...requestForm, dueDate: e.target.value })}
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                URL QR (cripto)
                <input
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  value={requestForm.qrImageUrl}
                  onChange={(e) => setRequestForm({ ...requestForm, qrImageUrl: e.target.value })}
                  placeholder="https://..."
                />
              </label>
            </div>
            {requestForm.qrImageUrl && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                <p className="font-semibold">Previsualización QR</p>
                <img src={requestForm.qrImageUrl} alt="QR" className="mt-2 max-h-48 rounded-md border border-slate-200" />
              </div>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Notas para el cliente
                <textarea
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  value={requestForm.notesForClient}
                  onChange={(e) => setRequestForm({ ...requestForm, notesForClient: e.target.value })}
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Notas internas
                <textarea
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  value={requestForm.internalNotes}
                  onChange={(e) => setRequestForm({ ...requestForm, internalNotes: e.target.value })}
                />
              </label>
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="submit" className="button-primary" disabled={submittingRequest}>
                {submittingRequest ? 'Creando...' : 'Crear solicitud'}
              </button>
              <button type="button" className="button-secondary" onClick={() => setShowRequestModal(false)}>
                Cancelar
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showPaymentModal && (
        <Modal title="Registrar pago" onClose={() => setShowPaymentModal(false)}>
          <form className="space-y-4" onSubmit={handleCreatePayment}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Solicitud asociada (opcional)
                <select
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  value={paymentForm.paymentRequestId}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentRequestId: e.target.value })}
                >
                  <option value="">Sin solicitud</option>
                  {paymentRequests.map((pr) => (
                    <option key={pr.id} value={pr.id}>
                      Solicitud #{pr.id} - {formatAmount(Number(pr.amount), pr.currency)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Estado del pago
                <select
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  value={paymentForm.status}
                  onChange={(e) => setPaymentForm({ ...paymentForm, status: e.target.value as PaymentStatus })}
                >
                  {paymentStatuses.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Importe
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Moneda
                <input
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  value={paymentForm.currency}
                  onChange={(e) => setPaymentForm({ ...paymentForm, currency: e.target.value })}
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Tipo de método
                {methodSelector(paymentForm.methodType, (v) =>
                  setPaymentForm({ ...paymentForm, methodType: v, bankAccountId: '', cryptoWalletId: '' })
                )}
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Código de método
                <input
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  value={paymentForm.methodCode}
                  onChange={(e) => setPaymentForm({ ...paymentForm, methodCode: e.target.value })}
                  placeholder="SEPA, BTC, USDT_TRC20"
                />
              </label>
              {paymentForm.methodType === 'BANK_TRANSFER' && (
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Cuenta bancaria
                  <select
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    value={paymentForm.bankAccountId}
                    onChange={(e) => setPaymentForm({ ...paymentForm, bankAccountId: e.target.value, cryptoWalletId: '' })}
                  >
                    <option value="">Selecciona una cuenta</option>
                    {bankOptionsForPayment.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label} (#{option.id})
                      </option>
                    ))}
                  </select>
                  {bankOptionsForPayment.length === 0 && (
                    <span className="text-xs text-amber-700">No hay cuentas bancarias activas disponibles.</span>
                  )}
                </label>
              )}
              {paymentForm.methodType === 'CRYPTO' && (
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Wallet cripto
                  <select
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    value={paymentForm.cryptoWalletId}
                    onChange={(e) => setPaymentForm({ ...paymentForm, cryptoWalletId: e.target.value, bankAccountId: '' })}
                  >
                    <option value="">Selecciona una wallet</option>
                    {walletOptionsForPayment.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label} (#{option.id})
                      </option>
                    ))}
                  </select>
                  {walletOptionsForPayment.length === 0 && (
                    <span className="text-xs text-amber-700">No hay wallets activas disponibles.</span>
                  )}
                </label>
              )}
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Pagador
                <input
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  value={paymentForm.payerName}
                  onChange={(e) => setPaymentForm({ ...paymentForm, payerName: e.target.value })}
                  placeholder="Nombre del pagador"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Banco del pagador
                <input
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  value={paymentForm.payerBank}
                  onChange={(e) => setPaymentForm({ ...paymentForm, payerBank: e.target.value })}
                  placeholder="Banco o entidad"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Referencia bancaria
                <input
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  value={paymentForm.reference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                  placeholder="Referencia"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Hash de transacción (cripto)
                <input
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  value={paymentForm.txHash}
                  onChange={(e) => setPaymentForm({ ...paymentForm, txHash: e.target.value })}
                  placeholder="0x..."
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Fecha de pago
                <input
                  type="datetime-local"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  value={paymentForm.paidAt}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paidAt: e.target.value })}
                />
              </label>
            </div>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Notas
              <textarea
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
              />
            </label>
            <div className="flex flex-wrap gap-3">
              <button type="submit" className="button-primary" disabled={submittingPayment}>
                {submittingPayment ? 'Guardando...' : 'Registrar pago'}
              </button>
              <button type="button" className="button-secondary" onClick={() => setShowPaymentModal(false)}>
                Cancelar
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
