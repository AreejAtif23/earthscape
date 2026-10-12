import { useCallback, useState } from 'react'

export interface UseTableControlsOptions<TKey extends string> {
  initialSortKey: TKey
  initialSortDirection?: 'asc' | 'desc'
  initialPageSize?: number
}

export interface TableControls<TKey extends string> {
  page: number
  pageSize: number
  sortKey: TKey
  sortDirection: 'asc' | 'desc'
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
  toggleSort: (key: TKey) => void
  handleSort: (key: TKey) => void
  reset: () => void
  params: { page: number; pageSize: number; sortKey: TKey; sortDirection: 'asc' | 'desc' }
}

/** Shared sorting + pagination state so every table page behaves identically. */
export function useTableControls<TKey extends string>(
  options: UseTableControlsOptions<TKey>,
): TableControls<TKey> {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSizeState] = useState(options.initialPageSize ?? 10)
  const [sortKey, setSortKey] = useState<TKey>(options.initialSortKey)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(options.initialSortDirection ?? 'desc')

  const toggleSort = useCallback(
    (key: TKey) => {
      setSortKey((currentKey) => {
        setSortDirection((currentDirection) =>
          currentKey === key ? (currentDirection === 'asc' ? 'desc' : 'asc') : 'asc',
        )
        return key
      })
      setPage(1)
    },
    [],
  )

  const handleSort = useCallback((key: TKey) => toggleSort(key), [toggleSort])

  const setPageSize = useCallback((nextSize: number) => {
    setPageSizeState(nextSize)
    setPage(1)
  }, [])

  const reset = useCallback(() => {
    setPage(1)
    setSortKey(options.initialSortKey)
    setSortDirection(options.initialSortDirection ?? 'desc')
  }, [options.initialSortKey, options.initialSortDirection])

  return {
    page,
    pageSize,
    sortKey,
    sortDirection,
    setPage,
    setPageSize,
    toggleSort,
    handleSort,
    reset,
    params: { page, pageSize, sortKey, sortDirection },
  }
}
