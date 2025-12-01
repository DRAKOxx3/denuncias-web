'use client';

import { useEffect, useState } from 'react';
import {
  listAdminCases,
  listBankAccounts,
  listCryptoWallets,
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

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    if (!token) {
      setError('Necesitas iniciar sesión para gestionar pagos.');
      return;
    }

    setLoading(true);
    setError(null);

    Promise.all([
      listAdminCases(token),
      listBankAccounts(token),
      listCryptoWallets(token)
    ])
      .then(([casesResponse, bankResponse, walletResponse]) => {
        setCases(casesResponse || []);
        setBankAccounts(bankResponse || []);
        setWallets(walletResponse || []);
      })
      .catch((err: any) => {
        setError(err?.message || 'No se pudieron cargar los recursos de pagos.');
      })
      .finally(() => setLoading(false));
  }, []);

  return { cases, bankAccounts, wallets, loading, error };
}
