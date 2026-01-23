import { useRef, useState, useEffect, useCallback } from "react";

/**
 * Shared hook for scrolling to selected rows with pagination support.
 * Used by both TableMode and DesktopForm components.
 *
 * @param {Object} options - Configuration options
 * @param {Set} options.selectedIds - Set of selected row IDs
 * @param {number|null} options.focusedId - Currently focused row ID (optional fallback)
 * @param {Array} options.items - Full list of items (for finding row index)
 * @param {number} options.rowsPerPage - Rows per page for pagination
 * @param {number} options.currentPage - Current page number
 * @param {Function} options.setCurrentPage - Function to change page
 * @param {Function} options.handleRowHover - Callback for row hover (shows tooltip)
 * @param {Function} options.handleRowLeave - Callback for row leave (hides tooltip)
 * @returns {Object} Hook state and functions
 */
export function useScrollToSelectedRow({
  selectedIds,
  focusedId = null,
  items,
  rowsPerPage,
  currentPage,
  setCurrentPage,
  handleRowHover,
  handleRowLeave,
}) {
  const scrollTimeoutRef = useRef(null);
  const selectedRowRefs = useRef(new Map());
  const [currentScrollIndex, setCurrentScrollIndex] = useState(0);
  const [viewedRowId, setViewedRowId] = useState(null);

  // Reset scroll index and viewed row when selection changes
  useEffect(() => {
    setCurrentScrollIndex(0);
    setViewedRowId(null);
  }, [selectedIds, focusedId]);

  // Cleanup scroll timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const scrollToSelectedRow = useCallback(() => {
    // Determine target ID
    let targetId;
    let shouldIncrementIndex = false;

    // Filter selected IDs to only include those visible in current items list
    const visibleSelectedIds = selectedIds
      ? Array.from(selectedIds).filter((id) => items.some((r) => r.id === id))
      : [];
    const visibleSize = visibleSelectedIds.length;

    if (visibleSize > 1) {
      // Multiple selections - cycle through them in list order (not click order)
      const selectedArray = visibleSelectedIds.sort((a, b) => {
        const idxA = items.findIndex((r) => r.id === a);
        const idxB = items.findIndex((r) => r.id === b);
        return idxA - idxB;
      });
      targetId = selectedArray[currentScrollIndex % selectedArray.length];
      shouldIncrementIndex = true;
    } else if (visibleSize === 1) {
      // Single selection
      targetId = visibleSelectedIds[0];
    } else if (focusedId != null && items.some((r) => r.id === focusedId)) {
      // Fallback to focused ID (only if visible in items)
      targetId = focusedId;
    } else {
      return; // Nothing to scroll to
    }

    // Clear any existing hover
    if (handleRowLeave) {
      handleRowLeave();
    }

    // Find the row in the full list
    const rowIndex = items.findIndex((r) => r.id === targetId);
    if (rowIndex === -1) return;

    // Navigate to the correct page
    const targetPage = Math.floor(rowIndex / rowsPerPage);
    const pageChanged = targetPage !== currentPage;
    if (pageChanged) {
      setCurrentPage(targetPage);
    }

    // Mark this row as the currently viewed row (for visual highlighting)
    setViewedRowId(targetId);

    // Show tooltip on map for this feature
    if (handleRowHover) {
      handleRowHover(targetId, true);
    }

    // Clear any pending scroll timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Scroll to the row (with delay if page changed)
    scrollTimeoutRef.current = setTimeout(
      () => {
        scrollTimeoutRef.current = null;
        const rowElement = selectedRowRefs.current.get(targetId);
        if (rowElement) {
          const scrollParent = rowElement.closest('[style*="overflow"]');
          if (scrollParent) {
            const rowRect = rowElement.getBoundingClientRect();
            const parentRect = scrollParent.getBoundingClientRect();
            const scrollTop = scrollParent.scrollTop;

            const targetScrollTop =
              scrollTop +
              (rowRect.top - parentRect.top) -
              parentRect.height / 2 +
              rowRect.height / 2;

            scrollParent.scrollTo({
              top: targetScrollTop,
              behavior: "smooth",
            });
          }
        }
      },
      pageChanged ? 100 : 0
    );

    // Increment scroll index for cycling (use visible count, not total selected)
    if (shouldIncrementIndex && visibleSize > 0) {
      setCurrentScrollIndex((prev) => (prev + 1) % visibleSize);
    }
  }, [
    selectedIds,
    focusedId,
    items,
    rowsPerPage,
    currentPage,
    currentScrollIndex,
    handleRowHover,
    handleRowLeave,
    setCurrentPage,
  ]);

  return {
    scrollToSelectedRow,
    selectedRowRefs,
    currentScrollIndex,
    viewedRowId,
    setViewedRowId,
  };
}

export default useScrollToSelectedRow;
