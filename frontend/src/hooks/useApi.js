import { useState, useEffect, useCallback } from 'react';

export function useApi(apiFunc, autoFetch = true, dependencies = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState(null);

  const fetch = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFunc(...args);
      if (result === null) throw new Error('API request failed');
      setData(result);
      return result;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [apiFunc]);

  useEffect(() => {
    if (autoFetch) {
      fetch();
    }
  }, [...dependencies, autoFetch]); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error, refetch: fetch, setData };
}
