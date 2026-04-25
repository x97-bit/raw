import { useCallback, useEffect, useRef, useState } from "react";
import { EMPTY_PORT_SUMMARY } from "../../utils/portSummaryConfig";
import {
  PORT_PAGE_LIMIT,
  buildPortAccountsQuery,
  buildPortTransactionsQuery,
} from "./portPageHelpers";

export default function usePortData({
  api,
  portId,
  accountType,
  filters,
  search,
  page,
}) {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [goods, setGoods] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [govs, setGovs] = useState([]);
  const [total, setTotal] = useState(0);
  const [listSummary, setListSummary] = useState(EMPTY_PORT_SUMMARY);
  const [merchants, setMerchants] = useState([]);

  // Track which portId+accountType we already loaded static lookups for
  // so they are not re-fetched on every filter/page change.
  const lookupsLoadedRef = useRef(null);

  // Load STATIC lookups (accounts, goods, govs, companies, merchants).
  // These only change when portId or accountType changes — NOT on filter/page change.
  const loadLookups = useCallback(async () => {
    const key = `${portId}:${accountType}`;
    if (lookupsLoadedRef.current === key) return; // already loaded for this port
    lookupsLoadedRef.current = key;

    try {
      const accountsQuery = buildPortAccountsQuery({ portId, accountType });

      const [
        accountsResponse,
        goodsResponse,
        governoratesResponse,
        companiesResponse,
        merchantsResponse,
      ] = await Promise.all([
        api(`/accounts${accountsQuery ? `?${accountsQuery}` : ""}`),
        api(`/lookups/goods-types?port=${portId || ""}`),
        api("/lookups/governorates"),
        api("/lookups/companies"),
        api("/accounts?accountType=1"),
      ]);

      setAccounts(accountsResponse);
      setGoods(goodsResponse);
      setGovs(governoratesResponse);
      setCompanies(companiesResponse);
      setMerchants(merchantsResponse);
    } catch (error) {
      console.error("[usePortData] loadLookups error:", error);
    }
  }, [accountType, api, portId]);

  // Load DYNAMIC transactions data — re-fetched on every filter/page/search change.
  const loadTransactions = useCallback(async () => {
    try {
      const transactionsQuery = buildPortTransactionsQuery({
        portId,
        accountType,
        filters,
        search,
        limit: PORT_PAGE_LIMIT,
        page,
      });

      const transactionsResponse = await api(
        `/transactions?${transactionsQuery}`
      );
      setTransactions(transactionsResponse.transactions);
      setTotal(transactionsResponse.total);
      setListSummary({
        ...EMPTY_PORT_SUMMARY,
        ...(transactionsResponse.summary || {}),
      });
    } catch (error) {
      console.error("[usePortData] loadTransactions error:", error);
      setListSummary(EMPTY_PORT_SUMMARY);
    }
  }, [accountType, api, filters, page, portId, search]);

  // Combined loadData (kept for backward compatibility with callers like onAfterSave)
  const loadData = useCallback(async () => {
    await Promise.all([loadLookups(), loadTransactions()]);
  }, [loadLookups, loadTransactions]);

  // When portId / accountType change: reload everything (lookups + transactions)
  useEffect(() => {
    lookupsLoadedRef.current = null; // force lookup reload when port changes
    loadLookups();
  }, [loadLookups]);

  // When filters / search / page change: reload only transactions (not lookups)
  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const loadDriversVehicles = useCallback(async () => {
    const [driversResponse, vehiclesResponse] = await Promise.all([
      api("/lookups/drivers"),
      api("/lookups/vehicles"),
    ]);
    setDrivers(driversResponse);
    setVehicles(vehiclesResponse);
  }, [api]);

  return {
    accounts,
    companies,
    drivers,
    goods,
    govs,
    listSummary,
    loadData,
    loadDriversVehicles,
    merchants,
    setAccounts,
    setCompanies,
    setMerchants,
    total,
    transactions,
    vehicles,
  };
}
