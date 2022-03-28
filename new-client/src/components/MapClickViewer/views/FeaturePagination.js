import React, { useCallback, useEffect, useState } from "react";

import { Divider, Pagination, Stack } from "@mui/material";

const FeaturePagination = (props) => {
  const {
    paginationCollection, // An Array of feature IDs
    selectedFeatureId, // ID of currently selected feature
    setSelectedFeatureId, // State setter
  } = props;

  // Two helpers to compensate for the fact that the paginationCollection array
  // starts at index 0, while the pagination expects page 1 as the first page.
  const getPageNumerFromId = (id) => paginationCollection.indexOf(id) + 1;
  const getIdFromPageNumber = useCallback(
    (page) => paginationCollection[page - 1],
    [paginationCollection]
  );

  // Set the initial pagination page to the currently selected ID's index+1
  const [page, setPage] = useState(getPageNumerFromId(selectedFeatureId));

  // Shorthand for later
  const sumPages = paginationCollection.length;

  /**
   * @summary Create a callback that takes care of selecting the correct
   * feature and updating the page state variable.
   *
   * @param {Event} e Since this function is also used as the handler for Pagination component, the first parameter is an Event.
   * @param {number} v Currently selected page
   */
  const handlePaginationChange = useCallback(
    (e, v) => {
      setSelectedFeatureId(getIdFromPageNumber(page));
      setPage(v);
    },
    [getIdFromPageNumber, page, setSelectedFeatureId]
  );

  // Handler for keydown events
  const bindArrowKeys = useCallback(
    (e) => {
      switch (e.code) {
        case "ArrowLeft":
          if (page > 1) {
            handlePaginationChange(null, page - 1);
          }
          break;
        case "ArrowRight":
          if (page < sumPages) {
            handlePaginationChange(null, page + 1);
          }
          break;
        default:
          break;
      }
    },
    [page, sumPages, handlePaginationChange]
  );

  // Bind the onkeydown event
  // FIXME: I hate it that we're binding/un-bindning constantly. It's because
  // this entire FC is re-rendered every time we change page in the pagination
  // (Pagination component is part of the FeatureDetailView, which is re-rendered
  // when new feature gets selected…)
  useEffect(() => {
    document.addEventListener("keydown", bindArrowKeys);

    // Unbind on unmount
    return () => {
      document.removeEventListener("keydown", bindArrowKeys);
    };
  }, [bindArrowKeys, setSelectedFeatureId, paginationCollection]);

  return (
    <>
      <Divider />
      <Stack spacing={2} alignItems="center">
        <Pagination
          count={sumPages}
          page={page}
          onChange={handlePaginationChange}
          shape="rounded"
          size="small"
        />
      </Stack>
      <Divider sx={{ marginBottom: 2 }} />
    </>
  );
};

export default FeaturePagination;
