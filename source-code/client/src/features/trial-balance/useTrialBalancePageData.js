import { useCallback, useEffect, useRef, useState } from "react";
import {
  createTrialBalanceFieldConfigState,
} from "./trialBalanceHelpers";
import { TRIAL_BALANCE_ALL_COLUMNS } from "./trialBalanceConfig";
import { trpc } from "../../utils/trpc";

const INITIAL_FILTERS = { from: "", to: "", port: "", accountType: "" };

// ── Module-level lookup cache (survives re-mounts, cleared on page refresh) ──
let _cachedPorts = null;
let _cachedAccountTypes = null;
let _cachedFieldConfig = null;

export default function useTrialBalancePageData({ api }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [ports, setPorts] = useState(_cachedPorts || []);
  const [accountTypes, setAccountTypes] = useState(_cachedAccountTypes || []);
  const [visibleColumns, setVisibleColumns] = useState(
    TRIAL_BALANCE_ALL_COLUMNS.map(column => column.key)
  );
  const [fieldConfigMap, setFieldConfigMap] = useState({});
  const filtersRef = useRef(INITIAL_FILTERS);
  const abortRef = useRef(null);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  const loadData = useCallback(
    async nextFilters => {
      // Cancel previous in-flight request
      if (abortRef.current) abortRef.current.abort?.();
      const controller = new AbortController();
      abortRef.current = controller;

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
        // Only update if this request wasn't superseded
        if (!controller.signal.aborted) {
          setData(nextData);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("TrialBalance Error:", error);
          setError(error.message || String(error));
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    },
    []
  );

  // ── Load all initial data in parallel ──
  useEffect(() => {
    const loadAll = async () => {
      // Fire all requests simultaneously
      const promises = [];

      // 1. Ports (use cache if available)
      if (_cachedPorts) {
        setPorts(_cachedPorts);
      } else {
        promises.push(
          api("/lookups/ports")
            .then(result => {
              _cachedPorts = result;
              setPorts(result);
            })
            .catch(() => {})
        );
      }

      // 2. Account types (use cache if available)
      if (_cachedAccountTypes) {
        setAccountTypes(_cachedAccountTypes);
      } else {
        promises.push(
          api("/lookups/account-types")
            .then(result => {
              _cachedAccountTypes = result;
              setAccountTypes(result);
            })
            .catch(() => {})
        );
      }

      // 3. Field config (use cache if available)
      if (_cachedFieldConfig) {
        setFieldConfigMap(_cachedFieldConfig.fieldConfigMap);
        setVisibleColumns(_cachedFieldConfig.visibleColumns);
      } else {
        promises.push(
          api("/field-config/trial-balance")
            .then(config => {
              const nextState = createTrialBalanceFieldConfigState(config);
              _cachedFieldConfig = nextState;
              setFieldConfigMap(nextState.fieldConfigMap);
              setVisibleColumns(nextState.visibleColumns);
            })
            .catch(() => {
              console.log("No field config for trial-balance, using defaults");
            })
        );
      }

      // 4. Main data (always fresh)
      promises.push(loadData(INITIAL_FILTERS));

      // Wait for all to complete
      await Promise.all(promises);
    };

    loadAll();

    // Cleanup: abort in-flight data request on unmount
    return () => {
      if (abortRef.current) abortRef.current.abort?.();
    };
  }, [api, loadData]);

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
