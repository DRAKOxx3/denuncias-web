'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  listPaymentResources,
  type BankAccount,
  type CryptoWallet,
  type PaymentResources
} from '@/lib/api';

type PaymentResourceCase = PaymentResources['cases'][number];

export type UsePaymentResourcesState = {
  cases: PaymentResourceCase[];
  bankAccounts: BankAccount[];
  cryptoWallets: CryptoWallet[];
  isLoading: boolean;
  isError: string | null;
  reload: () => void;
};

export function usePaymentResources(): UsePaymentResourcesState {
  const [cases, setCases] = useState<PaymentResourceCase[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [cryptoWallets, setCryptoWallets] = useState<CryptoWallet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState<string | null>(null);

  const reload = useCallback(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    if (!token) {
      setIsError('Necesitas iniciar sesión para gestionar pagos.');
      return;
    }

    setIsLoading(true);
    setIsError(null);

    listPaymentResources(token)
      .then((payload) => {
        const activeBanks = (payload.bankAccounts || []).filter((b) => b.isActive !== false);
        const activeWallets = (payload.cryptoWallets || []).filter((w) => w.isActive !== false);

        setCases(payload.cases || []);
        setBankAccounts(activeBanks);
        setCryptoWallets(activeWallets);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'No se pudieron cargar los recursos de pagos.';
        setIsError(message);
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { cases, bankAccounts, cryptoWallets, isLoading, isError, reload };
}
