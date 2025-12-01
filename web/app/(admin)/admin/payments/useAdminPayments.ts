'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  listPaymentRequestsAdmin,
  listPaymentsAdmin,
  type PaymentRequest,
  type Payment
} from '@/lib/api';

export function useAdminPayments() {
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    if (!token) {
      setError('Necesitas iniciar sesión.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [requests, paymentList] = await Promise.all([
        listPaymentRequestsAdmin(token),
        listPaymentsAdmin(token)
      ]);
      setPaymentRequests(requests || []);
      setPayments(paymentList || []);
    } catch (err: any) {
      setError(err?.message || 'No se pudieron cargar los pagos.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return {
    paymentRequests,
    payments,
    isLoading,
    error,
    reload
  };
}
