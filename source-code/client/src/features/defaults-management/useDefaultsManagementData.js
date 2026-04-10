import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createEmptyAccountForm,
  createEmptyRouteForm,
} from './defaultsManagementConfig';
import {
  buildAccountDefaultsPayload,
  buildRouteDefaultsPayload,
  createAccountFormFromRow,
  createRouteFormFromRow,
  filterDefaultsRows,
} from './defaultsManagementHelpers';

const ACCOUNT_REQUIRED_MESSAGE = 'اختر التاجر أولاً';
const ACCOUNT_SAVE_SUCCESS_MESSAGE = 'تم حفظ افتراضيات التاجر';
const ACCOUNT_DELETE_CONFIRM_MESSAGE = 'هل تريد حذف افتراضيات هذا التاجر؟';
const ACCOUNT_DELETE_SUCCESS_MESSAGE = 'تم حذف افتراضيات التاجر';
const ROUTE_REQUIRED_MESSAGE = 'اختر المحافظة أولاً';
const ROUTE_SAVE_SUCCESS_MESSAGE = 'تم حفظ افتراضيات المسار';
const ROUTE_DELETE_CONFIRM_MESSAGE = 'هل تريد حذف افتراضيات هذا المسار؟';
const ROUTE_DELETE_SUCCESS_MESSAGE = 'تم حذف افتراضيات المسار';

export default function useDefaultsManagementData({
  api,
  selectedSection,
  search,
  onMessage,
}) {
  const [accountDefaultsList, setAccountDefaultsList] = useState([]);
  const [routeDefaultsList, setRouteDefaultsList] = useState([]);
  const [accountForm, setAccountForm] = useState(createEmptyAccountForm());
  const [routeForm, setRouteForm] = useState(createEmptyRouteForm());
  const [loadingDefaults, setLoadingDefaults] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadDefaults = useCallback(async () => {
    setLoadingDefaults(true);
    try {
      const [accountRows, routeRows] = await Promise.all([
        api(`/defaults/account?sectionKey=${encodeURIComponent(selectedSection)}`),
        api(`/defaults/route?sectionKey=${encodeURIComponent(selectedSection)}`),
      ]);

      setAccountDefaultsList(accountRows);
      setRouteDefaultsList(routeRows);
    } catch (error) {
      onMessage?.(error.message);
    } finally {
      setLoadingDefaults(false);
    }
  }, [api, onMessage, selectedSection]);

  useEffect(() => {
    loadDefaults();
  }, [loadDefaults]);

  const filteredAccountDefaults = useMemo(
    () => filterDefaultsRows(accountDefaultsList, search, ['accountName', 'defaultDriverName', 'defaultGovName', 'defaultCompanyName']),
    [accountDefaultsList, search],
  );

  const filteredRouteDefaults = useMemo(
    () => filterDefaultsRows(routeDefaultsList, search, ['govName', 'currency', 'sectionKey']),
    [routeDefaultsList, search],
  );

  const resetAccountForm = useCallback(() => {
    setAccountForm(createEmptyAccountForm());
  }, []);

  const resetRouteForm = useCallback(() => {
    setRouteForm(createEmptyRouteForm());
  }, []);

  const saveAccount = useCallback(async () => {
    if (!accountForm.accountId) {
      onMessage?.(ACCOUNT_REQUIRED_MESSAGE);
      return;
    }

    setSaving(true);
    try {
      await api('/defaults/account', {
        method: 'POST',
        body: JSON.stringify(buildAccountDefaultsPayload(accountForm, selectedSection)),
      });
      onMessage?.(ACCOUNT_SAVE_SUCCESS_MESSAGE);
      await loadDefaults();
      resetAccountForm();
    } catch (error) {
      onMessage?.(error.message);
    } finally {
      setSaving(false);
    }
  }, [accountForm, api, loadDefaults, onMessage, resetAccountForm, selectedSection]);

  const saveRoute = useCallback(async () => {
    if (!routeForm.govId) {
      onMessage?.(ROUTE_REQUIRED_MESSAGE);
      return;
    }

    setSaving(true);
    try {
      await api('/defaults/route', {
        method: 'POST',
        body: JSON.stringify(buildRouteDefaultsPayload(routeForm, selectedSection)),
      });
      onMessage?.(ROUTE_SAVE_SUCCESS_MESSAGE);
      await loadDefaults();
      resetRouteForm();
    } catch (error) {
      onMessage?.(error.message);
    } finally {
      setSaving(false);
    }
  }, [api, loadDefaults, onMessage, resetRouteForm, routeForm, selectedSection]);

  const removeAccount = useCallback(async (id) => {
    if (!window.confirm(ACCOUNT_DELETE_CONFIRM_MESSAGE)) return;

    try {
      await api(`/defaults/account/${id}`, { method: 'DELETE' });
      await loadDefaults();
      if (accountForm.id === id) {
        resetAccountForm();
      }
      onMessage?.(ACCOUNT_DELETE_SUCCESS_MESSAGE);
    } catch (error) {
      onMessage?.(error.message);
    }
  }, [accountForm.id, api, loadDefaults, onMessage, resetAccountForm]);

  const removeRoute = useCallback(async (id) => {
    if (!window.confirm(ROUTE_DELETE_CONFIRM_MESSAGE)) return;

    try {
      await api(`/defaults/route/${id}`, { method: 'DELETE' });
      await loadDefaults();
      if (routeForm.id === id) {
        resetRouteForm();
      }
      onMessage?.(ROUTE_DELETE_SUCCESS_MESSAGE);
    } catch (error) {
      onMessage?.(error.message);
    }
  }, [api, loadDefaults, onMessage, resetRouteForm, routeForm.id]);

  const selectAccountRow = useCallback((row) => {
    setAccountForm(createAccountFormFromRow(row));
  }, []);

  const selectRouteRow = useCallback((row) => {
    setRouteForm(createRouteFormFromRow(row));
  }, []);

  return {
    accountDefaultsList,
    accountForm,
    filteredAccountDefaults,
    filteredRouteDefaults,
    loadingDefaults,
    removeAccount,
    removeRoute,
    resetAccountForm,
    resetRouteForm,
    routeDefaultsList,
    routeForm,
    saveAccount,
    saveRoute,
    saving,
    selectAccountRow,
    selectRouteRow,
    setAccountForm,
    setRouteForm,
  };
}
