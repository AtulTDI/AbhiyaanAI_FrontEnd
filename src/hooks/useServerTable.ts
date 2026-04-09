import { useCallback, useEffect, useRef, useState } from 'react';

import { logger } from '../utils/logger';

type TableResponse<T> = {
  items: T[];
  totalCount: number;
};

type UseServerTableOptions = {
  initialPage?: number;
  initialRowsPerPage?: number;
};

export function useServerTable<T, P = unknown>(
  fetchFn: (page: number, rowsPerPage: number, params?: P) => Promise<TableResponse<T>>,
  options: UseServerTableOptions = {},
  params?: P
) {
  const { initialPage = 0, initialRowsPerPage = 10 } = options;

  const [data, setData] = useState<T[]>([]);
  const [page, setPage] = useState(initialPage);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const isFetching = useRef(false);
  const fetchFnRef = useRef(fetchFn);

  useEffect(() => {
    fetchFnRef.current = fetchFn;
  }, [fetchFn]);

  const fetchData = useCallback(
    async (fetchPage: number, fetchRowsPerPage: number, fetchParams?: P) => {
      if (isFetching.current) {
        return;
      }
      isFetching.current = true;
      setLoading(true);
      try {
        const response = await fetchFnRef.current(
          fetchPage,
          fetchRowsPerPage,
          fetchParams
        );
        setData(response.items ?? []);
        setTotal(response.totalCount ?? 0);
      } catch (error) {
        logger.error('Error fetching table data:', error);
      } finally {
        setLoading(false);
        isFetching.current = false;
      }
    },
    []
  );

  useEffect(() => {
    void fetchData(page, rowsPerPage, params);
  }, [page, rowsPerPage, params, fetchData]);

  return {
    data,
    page,
    setPage,
    setData,
    rowsPerPage,
    setRowsPerPage,
    total,
    loading,
    fetchData
  };
}
