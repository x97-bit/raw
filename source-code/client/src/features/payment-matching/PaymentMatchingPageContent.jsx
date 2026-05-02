import { useCallback, useEffect, useMemo, useState } from "react";
import PaymentMatchingAccountDetailView from "./components/PaymentMatchingAccountDetailView";
import PaymentMatchingDashboardView from "./components/PaymentMatchingDashboardView";
import { useAuth } from "../../contexts/AuthContext";
import { buildPaymentDashboardStats } from "../../utils/paymentMatchingConfig";
import { trpc } from "../../utils/trpc";

export default function PaymentMatchingPage({ onBack }) {
  const { can } = useAuth();
  const [view, setView] = useState("dashboard");
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [accountShipments, setAccountShipments] = useState({
    rows: [],
    total: 0,
  });
  const [accountDetail, setAccountDetail] = useState(null);
  const [shipmentDetail, setShipmentDetail] = useState(null);

  // Unmatched payments state
  const [unmatchedPayments, setUnmatchedPayments] = useState(null);
  const [loadingUnmatched, setLoadingUnmatched] = useState(false);

  // Auto-match preview state
  const [previewData, setPreviewData] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const response = await trpc.paymentMatching.getDashboard.query();
      setDashboard(response);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUnmatchedPayments = useCallback(async () => {
    setLoadingUnmatched(true);
    try {
      const response = await trpc.paymentMatching.getUnmatchedPayments.query();
      setUnmatchedPayments(response);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingUnmatched(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
    loadUnmatchedPayments();
  }, [loadDashboard, loadUnmatchedPayments]);

  const runAutoMatchWithPreview = async () => {
    // First load preview
    setLoadingPreview(true);
    setShowPreview(true);
    try {
      const preview = await trpc.paymentMatching.autoMatchPreview.query();
      setPreviewData(preview);
    } catch (error) {
      console.error(error);
      window.alert("حدث خطأ أثناء تحميل المعاينة");
      setShowPreview(false);
    } finally {
      setLoadingPreview(false);
    }
  };

  const confirmAutoMatch = async () => {
    setShowPreview(false);
    setMatching(true);
    try {
      const result = await trpc.paymentMatching.autoMatchAll.mutate();
      window.alert(result.message);
      loadDashboard();
      loadUnmatchedPayments();
    } catch (error) {
      window.alert(error.message);
    } finally {
      setMatching(false);
    }
  };

  const openAccount = async account => {
    setSelectedAccount(account);
    try {
      const [shipments, summary] = await Promise.all([
        trpc.paymentMatching.getShipments.query({ account: account.account_id, limit: 200 }),
        trpc.paymentMatching.getSummary.query({ accountId: account.account_id }),
      ]);
      setAccountShipments(shipments);
      setAccountDetail(summary);
      setView("account-detail");
    } catch (error) {
      console.error(error);
    }
  };

  const openShipment = async shipmentId => {
    try {
      const response = await trpc.paymentMatching.getShipmentDetail.query({ shipmentId });
      setShipmentDetail(response);
    } catch (error) {
      console.error(error);
    }
  };

  const deleteAllocation = async allocationId => {
    if (!window.confirm("حذف هذا الربط؟")) {
      return;
    }

    try {
      await trpc.paymentMatching.deleteAllocation.mutate({ allocationId });
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

  const stats = useMemo(
    () => buildPaymentDashboardStats(dashboard),
    [dashboard]
  );

  if (view === "dashboard") {
    return (
      <PaymentMatchingDashboardView
        onBack={onBack}
        canAutoMatch={can.isAdmin || can.editTransaction}
        matching={matching}
        onAutoMatch={runAutoMatchWithPreview}
        loading={loading}
        stats={stats}
        topRemaining={dashboard?.topRemaining}
        onOpenAccount={openAccount}
        unmatchedPayments={unmatchedPayments}
        loadingUnmatched={loadingUnmatched}
        showPreview={showPreview}
        previewData={previewData}
        loadingPreview={loadingPreview}
        onConfirmAutoMatch={confirmAutoMatch}
        onCancelPreview={() => { setShowPreview(false); setPreviewData(null); }}
      />
    );
  }

  if (view === "account-detail" && selectedAccount) {
    return (
      <PaymentMatchingAccountDetailView
        selectedAccount={selectedAccount}
        accountDetail={accountDetail}
        accountShipments={accountShipments}
        shipmentDetail={shipmentDetail}
        canDeleteAllocation={can.isAdmin || can.deleteTransaction}
        onBack={() => {
          setView("dashboard");
          setShipmentDetail(null);
          loadDashboard();
          loadUnmatchedPayments();
        }}
        onOpenShipment={openShipment}
        onDeleteAllocation={deleteAllocation}
        onCloseShipment={() => setShipmentDetail(null)}
      />
    );
  }

  return null;
}
