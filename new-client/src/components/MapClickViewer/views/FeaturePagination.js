import React, { useState } from "react";

import { Divider, Pagination, Stack } from "@mui/material";

const FeaturePagination = (props) => {
  const { paginationCollection, selectedFeature, setSelectedFeature } = props;

  const getPageNumerFromId = (id) => paginationCollection.indexOf(id) + 1;
  const getIdFromPageNumber = (page) => paginationCollection[page - 1];

  const [page, setPage] = useState(getPageNumerFromId(selectedFeature));

  const handleChange = (event, value) => {
    setPage(value);
    setSelectedFeature(getIdFromPageNumber(value));
  };

  return (
    <>
      <Divider />

      <Stack spacing={2} alignItems="center">
        <Pagination
          count={paginationCollection.length}
          page={page}
          onChange={handleChange}
          shape="rounded"
          size="small"
        />
      </Stack>
      <Divider />
    </>
  );
};

export default FeaturePagination;
