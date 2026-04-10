import { useCallback, useEffect, useState } from 'react';
import { EMPTY_PORT_SUMMARY } from '../../utils/portSummaryConfig';
import {
  PORT_PAGE_LIMIT,
  buildPortAccountsQuery,
  buildPortTransactionsQuery,
  filterScopedPortAccounts,
} from './portPageHelpers';

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

  const loadData = useCallback(async () => {
    try {
      const transactionsQuery = buildPortTransactionsQuery({
        portId,
        accountType,
        filters,
        search,
        limit: PORT_PAGE_LIMIT,
        page,
      });
      const accountsQuery = buildPortAccountsQuery({ portId, accountType });

      const [transactionsResponse, accountsResponse, goodsResponse, governoratesResponse, companiesResponse] = await Promise.all([
        api(`/transactions?${transactionsQuery}`),
        api(`/accounts${accountsQuery ? `?${accountsQuery}` : ''}`),
        api(`/lookups/goods-types?port=${portId || ''}`),
        api('/lookups/governorates'),
        api('/lookups/companies'),
      ]);

      setTransactions(transactionsResponse.transactions);
      setTotal(transactionsResponse.total);
      setListSummary({ ...EMPTY_PORT_SUMMARY, ...(transactionsResponse.summary || {}) });
      setAccounts(filterScopedPortAccounts(accountsResponse, { portId, accountType }));
      setGoods(goodsResponse);
      setGovs(governoratesResponse);
      setCompanies(companiesResponse);
    } catch (error) {
      console.error(error);
      setListSummary(EMPTY_PORT_SUMMARY);
    }
  }, [accountType, api, filters, page, portId, search]);

  const loadDriversVehicles = useCallback(async () => {
    const [driversResponse, vehiclesResponse] = await Promise.all([
      api('/lookups/drivers'),
      api('/lookups/vehicles'),
    ]);
    setDrivers(driversResponse);
    setVehicles(vehiclesResponse);
  }, [api]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    accounts,
    companies,
    drivers,
    goods,
    govs,
    listSummary,
    loadData,
    loadDriversVehicles,
    setAccounts,
    setCompanies,
    total,
    transactions,
    vehicles,
  };
}
