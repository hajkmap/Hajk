import { useState, useEffect, useMemo } from "react";

const SHOW_ALL_VALUE = -1;
const VALID_PAGE_SIZES = [10, 20, 50, 100, SHOW_ALL_VALUE];

/**
 * Shared pagination hook to eliminate code duplication
 * between TableMode and DesktopForm components.
 *
 * @param {Array} items - The full array of items to paginate
 * @param {Object} options - Configuration options
 * @param {string} options.storageKey - localStorage key for persisting rowsPerPage
 * @param {number} options.defaultPerPage - Default rows per page (default: 20)
 * @param {boolean} options.functionalCookiesOk - Whether functional cookies are allowed
 * @returns {Object} Pagination state and helpers
 */
export function usePagination(items, options = {}) {
  const {
    storageKey = "ae_rows_per_page",
    defaultPerPage = 20,
    functionalCookiesOk = true,
  } = options;

  // Initialize rowsPerPage from localStorage if allowed
  const [rowsPerPage, setRowsPerPage] = useState(() => {
    if (!functionalCookiesOk) return defaultPerPage;
    try {
      const saved = Number(localStorage.getItem(storageKey));
      return VALID_PAGE_SIZES.includes(saved) ? saved : defaultPerPage;
    } catch {
      return defaultPerPage;
    }
  });

  const [currentPage, setCurrentPage] = useState(0);

  // Calculate pagination values
  const totalRows = items.length;
  const isShowingAll = rowsPerPage === SHOW_ALL_VALUE;
  const totalPages = isShowingAll ? 1 : Math.ceil(totalRows / rowsPerPage);
  const startIndex = isShowingAll ? 0 : currentPage * rowsPerPage;
  const endIndex = isShowingAll
    ? totalRows
    : Math.min(startIndex + rowsPerPage, totalRows);

  // Memoize paginated items
  const paginatedItems = useMemo(
    () => items.slice(startIndex, endIndex),
    [items, startIndex, endIndex]
  );

  const showPagination = totalRows > 10;

  // Ensure current page is valid when rowsPerPage or totalRows changes
  useEffect(() => {
    if (isShowingAll) return;
    const maxPage = Math.max(0, totalPages - 1);
    if (currentPage > maxPage) {
      setCurrentPage(maxPage);
    }
  }, [rowsPerPage, totalRows, currentPage, totalPages, isShowingAll]);

  // Persist rowsPerPage to localStorage when it changes
  useEffect(() => {
    if (!functionalCookiesOk) return;
    try {
      localStorage.setItem(storageKey, String(rowsPerPage));
    } catch {
      // Ignore localStorage errors
    }
  }, [rowsPerPage, storageKey, functionalCookiesOk]);

  // Navigation helpers
  const goToFirstPage = () => setCurrentPage(0);
  const goToLastPage = () => setCurrentPage(Math.max(0, totalPages - 1));
  const goToNextPage = () =>
    setCurrentPage((p) => Math.min(p + 1, totalPages - 1));
  const goToPrevPage = () => setCurrentPage((p) => Math.max(p - 1, 0));
  const goToPage = (page) =>
    setCurrentPage(Math.max(0, Math.min(page, totalPages - 1)));

  // Check navigation availability
  const canGoNext = currentPage < totalPages - 1;
  const canGoPrev = currentPage > 0;

  return {
    // State
    currentPage,
    setCurrentPage,
    rowsPerPage,
    setRowsPerPage,

    // Computed values
    totalRows,
    totalPages,
    startIndex,
    endIndex,
    paginatedItems,
    isShowingAll,
    showPagination,

    // Navigation helpers
    goToFirstPage,
    goToLastPage,
    goToNextPage,
    goToPrevPage,
    goToPage,
    canGoNext,
    canGoPrev,

    // Constants for external use
    SHOW_ALL_VALUE,
    VALID_PAGE_SIZES,
  };
}

export { SHOW_ALL_VALUE, VALID_PAGE_SIZES };
export default usePagination;
