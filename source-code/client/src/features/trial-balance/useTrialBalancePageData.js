import { useCallback, useEffect, useRef, useState } from 'react';
import {
  buildTrialBalanceQuery,
  createTrialBalanceFieldConfigState,
} from './trialBalanceHelpers';
import { TRIAL_BALANCE_ALL_COLUMNS } from './trialBalanceConfig';

const INITIAL_FILTERS = { from: '', to: '', port: '', accountType: '' };

export default function useTrialBalancePageData({ api }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [ports, setPorts] = useState([]);
  const [accountTypes, setAccountTypes] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState(TRIAL_BALANCE_ALL_COLUMNS.map((column) => column.key));
  const [fieldConfigMap, setFieldConfigMap] = useState({});
  const filtersRef = useRef(INITIAL_FILTERS);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  const loadFieldConfig = useCallback(async () => {
    try {
      const config = await api('/field-config/trial-balance');
      const nextState = createTrialBalanceFieldConfigState(config);
      setFieldConfigMap(nextState.fieldConfigMap);
      setVisibleColumns(nextState.visibleColumns);
    } catch {
      console.log('No field config for trial-balance, using defaults');
    }
  }, [api]);

  const loadData = useCallback(async (nextFilters) => {
    setLoading(true);
    try {
      const query = buildTrialBalanceQuery(nextFilters || filtersRef.current);
      const nextData = await api(`/reports/trial-balance${query ? `?${query}` : ''}`);
      setData(nextData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    api('/lookups/ports').then(setPorts).catch(() => {});
    api('/lookups/account-types').then(setAccountTypes).catch(() => {});
    loadData(INITIAL_FILTERS);
    loadFieldConfig();
  }, [api, loadData, loadFieldConfig]);

  return {
    accountTypes,
    data,
    fieldConfigMap,
    filters,
    loadData,
    loading,
    ports,
    setFilters,
    visibleColumns,
  };
}
