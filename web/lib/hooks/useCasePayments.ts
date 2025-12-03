'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  getCasePayments,
  type PaymentRequestWithRelations,
  type PaymentWithRelations
} from '@/lib/api';

type UseCasePaymentsState = {
  paymentRequests: PaymentRequestWithRelations[];
  payments: PaymentWithRelations[];
  isLoading: boolean;
  error: string | null;
  reload: () => void;
};

export function useCasePayments(caseId: number): UseCasePaymentsState {
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequestWithRelations[]>([]);
  const [payments, setPayments] = useState<PaymentWithRelations[]>([]);
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
      const data = await getCasePayments(token, caseId);
      setPaymentRequests(data.paymentRequests || []);
      setPayments(data.payments || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'No se pudieron cargar los pagos.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [caseId]);

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
