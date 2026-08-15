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

  // Reset the cycle position and the viewed-row marker when the selection
  // or focus changes. Uses the documented "adjust state while rendering"
  // pattern (react.dev/learn/you-might-not-need-an-effect) rather than an
  // effect: the reset lands in the same render pass instead of causing an
  // extra post-commit render.
  const [prevResetInputs, setPrevResetInputs] = useState({
    selectedIds,
    focusedId,
  });
  if (
    prevResetInputs.selectedIds !== selectedIds ||
    prevResetInputs.focusedId !== focusedId
  ) {
    setPrevResetInputs({ selectedIds, focusedId });
    setCurrentScrollIndex(0);
    setViewedRowId(null);
  }

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const scrollToSelectedRow = useCallback(() => {
    let targetId;
    let shouldIncrementIndex = false;

    const visibleSelectedIds = selectedIds
      ? Array.from(selectedIds).filter((id) =>
          // String() like every other comparison in this hook — mixed id
          // types (GML strings vs numeric drafts) must match here too
          items.some((r) => String(r.id) === String(id))
        )
      : [];
    const visibleSize = visibleSelectedIds.length;

    if (visibleSize > 1) {
      // Multiple selections - cycle through them in list order (not click order)
      const selectedArray = visibleSelectedIds.sort((a, b) => {
        const idxA = items.findIndex((r) => String(r.id) === String(a));
        const idxB = items.findIndex((r) => String(r.id) === String(b));
        return idxA - idxB;
      });
      targetId = selectedArray[currentScrollIndex % selectedArray.length];
      shouldIncrementIndex = true;
    } else if (visibleSize === 1) {
      // Single selection
      targetId = visibleSelectedIds[0];
    } else if (
      focusedId != null &&
      items.some((r) => String(r.id) === String(focusedId))
    ) {
      // Fallback to focused ID (only if visible in items)
      targetId = focusedId;
    } else {
      return; // Nothing to scroll to
    }

    if (handleRowLeave) {
      handleRowLeave();
    }

    const rowIndex = items.findIndex((r) => String(r.id) === String(targetId));
    if (rowIndex === -1) return;

    const targetPage = rowsPerPage > 0 ? Math.floor(rowIndex / rowsPerPage) : 0;
    const pageChanged = targetPage !== currentPage;
    if (pageChanged) {
      setCurrentPage(targetPage);
    }

    setViewedRowId(targetId);

    if (handleRowHover) {
      handleRowHover(targetId, true);
    }

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

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
