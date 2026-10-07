import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';

/**
 * Loads data whenever the screen gains focus or its inputs change, and supports
 * pull-to-refresh. Refetching on focus is what makes edits made on the web (or on another
 * screen) show up when the user comes back.
 *
 * @param fetcher () => Promise<data>
 * @param deps    serialisable inputs of the request (ids, filters)
 */
export function useApiResource(fetcher, deps) {
  const key = JSON.stringify(deps);
  const [result, setResult] = useState({ key: null, data: undefined, error: null });
  const [refreshing, setRefreshing] = useState(false);
  const latestRequestId = useRef(0);
  const fetcherRef = useRef(fetcher);

  useLayoutEffect(() => {
    fetcherRef.current = fetcher;
  });

  const load = useCallback(
    async ({ isRefresh = false } = {}) => {
      latestRequestId.current += 1;
      const requestId = latestRequestId.current;
      if (isRefresh) setRefreshing(true);
      // Retrying after a failed first load shows the loading state again instead of the old error.
      else setResult((previous) => (previous.data === undefined ? { ...previous, error: null } : previous));
      try {
        const data = await fetcherRef.current();
        if (requestId === latestRequestId.current) setResult({ key, data, error: null });
      } catch (error) {
        // Keep showing the last good data; screens surface the error next to it.
        if (requestId === latestRequestId.current) {
          setResult((previous) => ({ key, data: previous.data, error }));
        }
      } finally {
        if (isRefresh) setRefreshing(false);
      }
    },
    [key],
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const refresh = useCallback(() => load({ isRefresh: true }), [load]);
  const setData = useCallback(
    (updater) =>
      setResult((previous) => ({
        ...previous,
        data: typeof updater === 'function' ? updater(previous.data) : updater,
      })),
    [],
  );

  return {
    data: result.data,
    error: result.error,
    isLoading: result.data === undefined && result.error === null,
    isUpdating: result.key !== key && result.data !== undefined,
    refreshing,
    refresh,
    reload: load,
    setData,
  };
}
