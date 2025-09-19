import { useState, useCallback, useEffect, useRef } from "react";

type TableResponse<T> = {
  items: T[];
  totalCount: number;
};

type UseServerTableOptions = {
  initialPage?: number;
  initialRowsPerPage?: number;
};

export function useServerTable<T, P = any>(
  fetchFn: (
    page: number,
    rowsPerPage: number,
    params?: P
  ) => Promise<TableResponse<T>>,
  options: UseServerTableOptions = {},
  params?: P
) {
  const { initialPage = 0, initialRowsPerPage = 10 } = options;

  const [data, setData] = useState<any[]>([]);
  const [page, setPage] = useState(initialPage);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const isFetching = useRef(false);

  const fetchData = useCallback(
    async (fetchPage: number, fetchRowsPerPage: number, fetchParams?: P) => {
      if (isFetching.current) {
        return;
      }
      isFetching.current = true;
      setLoading(true);
      try {
        const response = await fetchFn(fetchPage, fetchRowsPerPage, fetchParams);
        setData(response.items ?? []);
        setTotal(response.totalCount ?? 0);
      } catch (error) {
        console.error("Error fetching table data:", error);
      } finally {
        setLoading(false);
        isFetching.current = false;
      }
    },
    [fetchFn]
  );

  useEffect(() => {
    fetchData(page, rowsPerPage, params);
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
    fetchData,
  };
}