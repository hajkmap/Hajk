import React from "react";
import { useSnackbar } from "notistack";

const withSnackbar = (Component) => (props) => {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  return (
    <Component
      {...props}
      enqueueSnackbar={enqueueSnackbar}
      closeSnackbar={closeSnackbar}
    />
  );
};

export default withSnackbar;
