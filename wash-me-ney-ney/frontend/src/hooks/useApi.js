import { useEffect, useState } from 'react';

// Runs `load()` whenever `deps` change. Keeps the previous data while reloading,
// so background refreshes don't flash a loading state.
export function useApi(load, deps) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    load()
      .then((d) => {
        if (alive) {
          setData(d);
          setError('');
        }
      })
      .catch((err) => alive && setError(err.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, error, loading };
}

// Returns `value` only after it stopped changing for `ms` (used for search boxes)
export function useDebounced(value, ms = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}
