import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react';

const FOCUS_REFETCH_THROTTLE_MS = 2000;

/**
 * Small data-fetching hook: loading/error state, request cancellation, manual reload and
 * optional refetch when the tab regains focus (so changes made on mobile show up on return).
 *
 * @param fetcher  ({ signal }) => Promise<data>
 * @param deps     serialisable values the request depends on (filters, ids)
 * @param options  keepPreviousData: show the last result while new filters load
 */
export function useApiQuery(fetcher, deps, { keepPreviousData = false, refetchOnFocus = false } = {}) {
  const dataKey = JSON.stringify(deps);
  const [reloadCount, setReloadCount] = useState(0);
  const requestKey = `${dataKey}#${reloadCount}`;
  const [result, setResult] = useState({ requestKey: null, dataKey: null, data: undefined, error: null });
  const lastReloadAt = useRef(0);

  const runFetcher = useEffectEvent((signal) => fetcher({ signal }));

  useEffect(() => {
    const controller = new AbortController();
    runFetcher(controller.signal).then(
      (data) => setResult({ requestKey, dataKey, data, error: null }),
      (error) => {
        if (error?.canceled) return;
        setResult((previous) => ({ requestKey, dataKey, data: previous.data, error }));
      },
    );
    return () => controller.abort();
  }, [requestKey, dataKey]);

  const reload = useCallback(() => {
    lastReloadAt.current = Date.now();
    setReloadCount((count) => count + 1);
  }, []);

  const setData = useCallback((updater) => {
    setResult((previous) => ({
      ...previous,
      data: typeof updater === 'function' ? updater(previous.data) : updater,
    }));
  }, []);

  useEffect(() => {
    if (!refetchOnFocus) return undefined;

    function handleFocus() {
      if (document.visibilityState !== 'visible') return;
      if (Date.now() - lastReloadAt.current < FOCUS_REFETCH_THROTTLE_MS) return;
      reload();
    }

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [refetchOnFocus, reload]);

  const isCurrent = result.dataKey === dataKey;
  const data = isCurrent || keepPreviousData ? result.data : undefined;
  const isPending = result.requestKey !== requestKey;

  return {
    data,
    error: isPending ? null : result.error,
    isLoading: isPending && data === undefined,
    isRefreshing: isPending && data !== undefined,
    reload,
    setData,
  };
}
