'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  listPaymentResources,
  type AdminCase,
  type BankAccount,
  type CryptoWallet
} from '@/lib/api';

export function usePaymentResources() {
  const [cases, setCases] = useState<AdminCase[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [wallets, setWallets] = useState<CryptoWallet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    if (!token) {
      setError('Necesitas iniciar sesión para gestionar pagos.');
      return;
    }

    setLoading(true);
    setError(null);

    listPaymentResources(token)
      .then((payload) => {
        setCases(payload.cases || []);
        setBankAccounts(payload.bankAccounts || []);
        setWallets(payload.cryptoWallets || []);
      })
      .catch((err: any) => {
        setError(err?.message || 'No se pudieron cargar los recursos de pagos.');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { cases, bankAccounts, wallets, loading, error, reload };
}
