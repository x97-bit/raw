import { useCallback, useEffect, useRef, useState } from "react";
import {
  createTrialBalanceFieldConfigState,
} from "./trialBalanceHelpers";
import { TRIAL_BALANCE_ALL_COLUMNS } from "./trialBalanceConfig";
import { trpc } from "../../utils/trpc";

const INITIAL_FILTERS = { from: "", to: "", port: "", accountType: "" };

export default function useTrialBalancePageData({ api }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [ports, setPorts] = useState([]);
  const [accountTypes, setAccountTypes] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState(
    TRIAL_BALANCE_ALL_COLUMNS.map(column => column.key)
  );
  const [fieldConfigMap, setFieldConfigMap] = useState({});
  const filtersRef = useRef(INITIAL_FILTERS);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  const loadFieldConfig = useCallback(async () => {
    try {
      const config = await api("/field-config/trial-balance");
      const nextState = createTrialBalanceFieldConfigState(config);
      setFieldConfigMap(nextState.fieldConfigMap);
      setVisibleColumns(nextState.visibleColumns);
    } catch {
      console.log("No field config for trial-balance, using defaults");
    }
  }, [api]);

  const loadData = useCallback(
    async nextFilters => {
      setLoading(true);
      setError(null);
      try {
        const isEvent = nextFilters && typeof nextFilters.preventDefault === "function";
        const activeFilters = (!isEvent && nextFilters) ? nextFilters : filtersRef.current;
        const nextData = await trpc.trialBalance.getTrialBalance.query({
          startDate: activeFilters.from || undefined,
          endDate: activeFilters.to || undefined,
          portId: activeFilters.port || undefined,
          accountType: activeFilters.accountType || undefined,
        });
        setData(nextData);
      } catch (error) {
        console.error("TrialBalance Error:", error);
        setError(error.message || String(error));
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    api("/lookups/ports")
      .then(setPorts)
      .catch(() => {});
    api("/lookups/account-types")
      .then(setAccountTypes)
      .catch(() => {});
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
    error,
    ports,
    setFilters,
    visibleColumns,
  };
}
