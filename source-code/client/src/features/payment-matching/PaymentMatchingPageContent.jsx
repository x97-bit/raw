import { useCallback, useEffect, useMemo, useState } from 'react';
import PaymentMatchingAccountDetailView from './components/PaymentMatchingAccountDetailView';
import PaymentMatchingDashboardView from './components/PaymentMatchingDashboardView';
import { useAuth } from '../../contexts/AuthContext';
import { buildPaymentDashboardStats } from '../../utils/paymentMatchingConfig';

export default function PaymentMatchingPage({ onBack }) {
  const { api, can } = useAuth();
  const [view, setView] = useState('dashboard');
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [accountShipments, setAccountShipments] = useState({ rows: [], total: 0 });
  const [accountDetail, setAccountDetail] = useState(null);
  const [shipmentDetail, setShipmentDetail] = useState(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api('/payment-matching/dashboard');
      setDashboard(response);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const runAutoMatch = async () => {
    if (!window.confirm('سيتم ربط كل التسديدات غير المربوطة بالشحنات تلقائيًا. هل أنت متأكد؟')) {
      return;
    }

    setMatching(true);
    try {
      const result = await api('/payment-matching/auto-match-all', { method: 'POST' });
      window.alert(result.message);
      loadDashboard();
    } catch (error) {
      window.alert(error.message);
    } finally {
      setMatching(false);
    }
  };

  const openAccount = async (account) => {
    setSelectedAccount(account);
    try {
      const [shipments, summary] = await Promise.all([
        api(`/payment-matching/shipments?account=${account.account_id}&limit=200`),
        api(`/payment-matching/summary/${account.account_id}`),
      ]);
      setAccountShipments(shipments);
      setAccountDetail(summary);
      setView('account-detail');
    } catch (error) {
      console.error(error);
    }
  };

  const openShipment = async (shipmentId) => {
    try {
      const response = await api(`/payment-matching/shipments/${shipmentId}`);
      setShipmentDetail(response);
    } catch (error) {
      console.error(error);
    }
  };

  const deleteAllocation = async (allocationId) => {
    if (!window.confirm('حذف هذا الربط؟')) {
      return;
    }

    try {
      await api(`/payment-matching/allocate/${allocationId}`, { method: 'DELETE' });
      if (shipmentDetail) {
        openShipment(shipmentDetail.shipment.shipment_id);
      }
      if (selectedAccount) {
        openAccount(selectedAccount);
      }
    } catch (error) {
      window.alert(error.message);
    }
  };

  const stats = useMemo(() => buildPaymentDashboardStats(dashboard), [dashboard]);

  if (view === 'dashboard') {
    return (
      <PaymentMatchingDashboardView
        onBack={onBack}
        canAutoMatch={can.isAdmin || can.editTransaction}
        matching={matching}
        onAutoMatch={runAutoMatch}
        loading={loading}
        stats={stats}
        topRemaining={dashboard?.topRemaining}
        onOpenAccount={openAccount}
      />
    );
  }

  if (view === 'account-detail' && selectedAccount) {
    return (
      <PaymentMatchingAccountDetailView
        selectedAccount={selectedAccount}
        accountDetail={accountDetail}
        accountShipments={accountShipments}
        shipmentDetail={shipmentDetail}
        canDeleteAllocation={can.isAdmin || can.deleteTransaction}
        onBack={() => {
          setView('dashboard');
          setShipmentDetail(null);
          loadDashboard();
        }}
        onOpenShipment={openShipment}
        onDeleteAllocation={deleteAllocation}
        onCloseShipment={() => setShipmentDetail(null)}
      />
    );
  }

  return null;
}
