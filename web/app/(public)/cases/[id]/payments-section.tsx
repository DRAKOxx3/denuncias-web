'use client';

import { useMemo, useState } from 'react';
import {
  confirmPaymentRequestPublic,
  type PublicPayment,
  type PublicPaymentRequest
} from '@/lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

const statusColors: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
  SENT: 'bg-amber-100 text-amber-800 border-amber-200',
  AWAITING_CONFIRMATION: 'bg-amber-100 text-amber-800 border-amber-200',
  PAID: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  APPROVED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-rose-100 text-rose-700 border-rose-200',
  CANCELLED: 'bg-rose-100 text-rose-700 border-rose-200',
  EXPIRED: 'bg-slate-100 text-slate-700 border-slate-200'
};

function Badge({ status }: { status: string }) {
  const cls = statusColors[status] || 'bg-slate-100 text-slate-700 border-slate-200';
  return <span className={`text-xs font-semibold border rounded-full px-3 py-1 ${cls}`}>{status}</span>;
}

function formatMethod(item: { method_type: string; method_code: string; bank_account?: any | null; crypto_wallet?: any | null }) {
  if (item.method_type === 'CRYPTO' && item.crypto_wallet) {
    return `${item.method_code || item.crypto_wallet.asset} · ${item.crypto_wallet.network}`;
  }
  if (item.method_type === 'BANK_TRANSFER' && item.bank_account) {
    return `${item.method_code || 'Transferencia'} · ${item.bank_account.bankName}`;
  }
  return item.method_type || 'Método';
}

function PaymentRequestCard({ request }: { request: PublicPaymentRequest }) {
  return (
    <div className="rounded-lg border border-slate-200 p-4 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">Importe</p>
          <p className="text-lg font-semibold text-primary">
            {request.amount} {request.currency}
          </p>
        </div>
        <Badge status={request.status} />
      </div>
      <div className="mt-3 text-sm text-slate-700 space-y-1">
        <p>
          Método: <span className="font-semibold">{formatMethod(request)}</span>
        </p>
        {request.bank_account && (
          <p className="text-slate-600">
            IBAN: <span className="font-medium">{request.bank_account.iban}</span>
          </p>
        )}
        {request.crypto_wallet && (
          <p className="text-slate-600">
            Wallet: <span className="font-medium">{request.crypto_wallet.address}</span>
          </p>
        )}
        {request.due_date && (
          <p className="text-slate-600">Vencimiento: {new Date(request.due_date).toLocaleDateString()}</p>
        )}
        {request.qr_image_url && (
          <p className="text-slate-600">
            QR: <a href={request.qr_image_url} className="text-primary underline" target="_blank" rel="noreferrer">Ver</a>
          </p>
        )}
      </div>
    </div>
  );
}

type Props = {
  caseId: number;
  paymentRequests: PublicPaymentRequest[];
  payments: PublicPayment[];
};

export function CitizenPaymentsSection({ caseId, paymentRequests, payments }: Props) {
  const [requests, setRequests] = useState(paymentRequests);
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selected, setSelected] = useState<PublicPaymentRequest | null>(null);
  const [formState, setFormState] = useState({
    payerName: '',
    payerBank: '',
    bankReference: '',
    txHash: '',
    paidAt: ''
  });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const approvedPayments = useMemo(() => payments.filter((p) => p.status === 'APPROVED'), [payments]);
  const activeRequests = useMemo(
    () => requests.filter((r) => ['PENDING', 'SENT', 'AWAITING_CONFIRMATION'].includes(r.status)),
    [requests]
  );

  const handleSubmit = async () => {
    if (!selected) return;
    if (!receiptFile) {
      setError('Debes adjuntar el comprobante del pago.');
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const form = new FormData();
      form.append('payerName', formState.payerName);
      if (formState.payerBank) form.append('payerBank', formState.payerBank);
      if (formState.bankReference) form.append('bankReference', formState.bankReference);
      if (formState.txHash) form.append('txHash', formState.txHash);
      if (formState.paidAt) form.append('paidAt', formState.paidAt);
      form.append('caseId', String(caseId));
      form.append('receipt', receiptFile);

      const result = await confirmPaymentRequestPublic(selected.id, form);
      setRequests((prev) => prev.map((r) => (r.id === selected.id ? { ...r, status: 'AWAITING_CONFIRMATION' } : r)));
      setSuccess('Hemos recibido tu comprobante. Un administrador revisará tu pago.');
      setSelected(null);
      setFormState({ payerName: '', payerBank: '', bankReference: '', txHash: '', paidAt: '' });
      setReceiptFile(null);
      return result;
    } catch (err: any) {
      setError(err?.message || 'No pudimos registrar tu pago. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="card shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-lg text-primary">Solicitudes de pago</h2>
            <p className="text-sm text-slate-600">Revisa las instrucciones de pago y registra tu comprobante.</p>
          </div>
          {success && <span className="text-sm text-emerald-700 font-medium">{success}</span>}
        </div>
        {activeRequests.length === 0 && <p className="text-sm text-slate-500">No tienes solicitudes pendientes en este momento.</p>}
        <div className="grid gap-4 lg:grid-cols-2">
          {activeRequests.map((request) => (
            <div key={request.id} className="space-y-3">
              <PaymentRequestCard request={request} />
              {['PENDING', 'SENT'].includes(request.status) && (
                <button
                  className="btn btn-primary w-full"
                  onClick={() => setSelected(request)}
                >
                  He realizado el pago
                </button>
              )}
              {request.status === 'AWAITING_CONFIRMATION' && (
                <p className="text-xs text-amber-700">Comprobante enviado. Esperando revisión del administrador.</p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="card shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg text-primary">Pagos registrados</h2>
          <span className="text-xs text-slate-500">Aprobados por administración</span>
        </div>
        {approvedPayments.length === 0 && <p className="text-sm text-slate-500">No hay pagos aprobados aún.</p>}
        <div className="space-y-3">
          {approvedPayments.map((payment) => (
            <div key={payment.id} className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">Monto</p>
                  <p className="text-lg font-semibold text-primary">
                    {payment.amount} {payment.currency}
                  </p>
                  <p className="text-sm text-slate-600">Método: {payment.method_type}</p>
                </div>
                <Badge status={payment.status} />
              </div>
              <div className="text-sm text-slate-600 mt-2 space-y-1">
                {payment.paid_at && <p>Pagado el {new Date(payment.paid_at).toLocaleDateString()}</p>}
                {payment.receipt_path && (
                  <a
                    className="text-primary underline"
                    href={payment.receipt_path.startsWith('http') ? payment.receipt_path : `${API_BASE}${payment.receipt_path}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Ver comprobante
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {selected && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-30 px-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-primary">Confirmar pago</h3>
                <p className="text-sm text-slate-600">Adjunta el comprobante y los datos del pago.</p>
              </div>
              <button className="text-slate-500" onClick={() => setSelected(null)}>
                ✕
              </button>
            </div>

            <div className="grid gap-3">
              <label className="text-sm font-medium text-slate-700">
                Nombre del pagador
                <input
                  className="input"
                  value={formState.payerName}
                  onChange={(e) => setFormState((s) => ({ ...s, payerName: e.target.value }))}
                  placeholder="Tu nombre completo"
                />
              </label>
              <div className="grid md:grid-cols-2 gap-3">
                <label className="text-sm font-medium text-slate-700">
                  Banco del pagador
                  <input
                    className="input"
                    value={formState.payerBank}
                    onChange={(e) => setFormState((s) => ({ ...s, payerBank: e.target.value }))}
                    placeholder="Nombre del banco"
                  />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Referencia bancaria
                  <input
                    className="input"
                    value={formState.bankReference}
                    onChange={(e) => setFormState((s) => ({ ...s, bankReference: e.target.value }))}
                    placeholder="Número de referencia"
                  />
                </label>
              </div>
              <label className="text-sm font-medium text-slate-700">
                Hash / TX (cripto)
                <input
                  className="input"
                  value={formState.txHash}
                  onChange={(e) => setFormState((s) => ({ ...s, txHash: e.target.value }))}
                  placeholder="Hash de transacción"
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Fecha de pago
                <input
                  type="datetime-local"
                  className="input"
                  value={formState.paidAt}
                  onChange={(e) => setFormState((s) => ({ ...s, paidAt: e.target.value }))}
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Comprobante (PDF/imagen)
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="input"
                  onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>

            {error && <p className="text-sm text-rose-600">{error}</p>}

            <div className="flex items-center justify-end gap-3">
              <button className="btn btn-ghost" onClick={() => setSelected(null)} disabled={isSubmitting}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Enviando...' : 'Enviar comprobante'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
