import { useCallback, useEffect, useState } from 'react';

const EMPTY_LOOKUPS = {
  accounts: [],
  drivers: [],
  vehicles: [],
  goodsTypes: [],
  governorates: [],
  companies: [],
};

export default function useDefaultsLookups({ api, onMessage }) {
  const [lookups, setLookups] = useState(EMPTY_LOOKUPS);
  const [loadingLookups, setLoadingLookups] = useState(true);

  const loadLookups = useCallback(async () => {
    setLoadingLookups(true);
    try {
      const [accounts, drivers, vehicles, goodsTypes, governorates, companies] = await Promise.all([
        api('/accounts'),
        api('/lookups/drivers'),
        api('/lookups/vehicles'),
        api('/lookups/goods-types'),
        api('/lookups/governorates'),
        api('/lookups/companies'),
      ]);

      setLookups({
        accounts,
        drivers,
        vehicles,
        goodsTypes,
        governorates,
        companies,
      });
    } catch (error) {
      onMessage?.(error.message);
    } finally {
      setLoadingLookups(false);
    }
  }, [api, onMessage]);

  useEffect(() => {
    loadLookups();
  }, [loadLookups]);

  return {
    loadingLookups,
    lookups,
    loadLookups,
  };
}
