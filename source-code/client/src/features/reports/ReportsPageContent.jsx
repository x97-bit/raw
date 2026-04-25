import { useEffect, useState } from "react";
import ReportsAddTraderView from "./components/ReportsAddTraderView";
import ReportsExpensesView from "./components/ReportsExpensesView";
import ReportsHaiderProfitsView from "./components/ReportsHaiderProfitsView";
import ReportsLandingView from "./components/ReportsLandingView";
import ReportsProfitsView from "./components/ReportsProfitsView";
import {
  buildReportRequestPath,
  buildSpecialAccountReportRequestPath,
  buildTraderFormForPort,
  createEmptyTraderForm,
  getReportPortById,
  getReportSpecialAccountById,
} from "./reportsPageHelpers";
import { useAuth } from "../../contexts/AuthContext";

export default function ReportsPage({ onBack }) {
  const { api } = useAuth();
  const [view, setView] = useState("main");
  const [activePort, setActivePort] = useState(null);
  const [activeSpecialAccount, setActiveSpecialAccount] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ from: "", to: "" });
  const [traderForm, setTraderForm] = useState(createEmptyTraderForm());
  const [saving, setSaving] = useState(false);
  const [allAccounts, setAllAccounts] = useState([]);

  useEffect(() => {
    api("/accounts")
      .then(setAllAccounts)
      .catch(() => {});
  }, [api]);

  const updateDateFilter = (key, value) => {
    setFilters(current => ({ ...current, [key]: value }));
  };

  const updateTraderField = (field, value) => {
    setTraderForm(current => ({ ...current, [field]: value }));
  };

  const backToMain = () => {
    setView("main");
    setData(null);
    setActiveSpecialAccount(null);
  };

  const openAction = async (portId, action) => {
    const port = getReportPortById(portId);
    setActivePort(port);

    if (action === "add-trader") {
      setTraderForm(buildTraderFormForPort(portId));
      setView("add-trader");
      return;
    }

    const requestPath = buildReportRequestPath(action, portId, filters);
    if (!requestPath) {
      return;
    }

    setLoading(true);
    setView(action);

    try {
      const response = await api(requestPath);
      setData(response);
    } catch (error) {
      console.error(error);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const openSpecialAction = async (accountId, action) => {
    const account = getReportSpecialAccountById(accountId);
    setActiveSpecialAccount(account);

    const requestPath = buildSpecialAccountReportRequestPath(
      accountId,
      filters
    );
    if (!requestPath) {
      return;
    }

    setLoading(true);
    setView(`special-${accountId}-${action}`);

    try {
      const response = await api(requestPath);
      setData(response);
    } catch (error) {
      console.error(error);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTrader = async () => {
    if (!traderForm.AccountName) {
      window.alert("أدخل اسم التاجر");
      return;
    }

    setSaving(true);
    try {
      await api("/accounts", {
        method: "POST",
        body: JSON.stringify(traderForm),
      });
      window.alert("تمت إضافة التاجر بنجاح");
      backToMain();
    } catch (error) {
      window.alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (view === "main") {
    return (
      <ReportsLandingView
        onBack={onBack}
        onOpenAction={openAction}
        onOpenSpecialAction={openSpecialAction}
      />
    );
  }

  if (view === "add-trader") {
    return (
      <ReportsAddTraderView
        activePort={activePort}
        allAccounts={allAccounts}
        traderForm={traderForm}
        saving={saving}
        onBack={backToMain}
        onSave={handleSaveTrader}
        onFieldChange={updateTraderField}
      />
    );
  }

  if (view === "expenses") {
    return (
      <ReportsExpensesView
        activePort={activePort}
        data={data}
        filters={filters}
        loading={loading}
        onBack={backToMain}
        onFilterChange={updateDateFilter}
        onRefresh={() => openAction(activePort.id, "expenses")}
      />
    );
  }

  if (view === "profits") {
    return (
      <ReportsProfitsView
        activePort={activePort}
        data={data}
        filters={filters}
        loading={loading}
        onBack={backToMain}
        onFilterChange={updateDateFilter}
        onRefresh={() => openAction(activePort.id, "profits")}
      />
    );
  }

  if (view === "special-haider-profits") {
    return (
      <ReportsHaiderProfitsView
        activeAccount={activeSpecialAccount}
        data={data}
        filters={filters}
        loading={loading}
        onBack={backToMain}
        onFilterChange={updateDateFilter}
        onRefresh={() => openSpecialAction("haider", "profits")}
      />
    );
  }

  return null;
}
