// Make sure to only import the hooks you intend to use
import React, { useEffect, useRef, useState } from "react";

import { Button } from "@mui/material";
import { styled } from "@mui/material/styles";

import { useSnackbar } from "notistack";

import InfoDialog from "./views/InfoDialog.js";

const ButtonWithBottomMargin = styled(Button)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

function AudioGuideView(props) {
  const { app, globalObserver, localObserver, map, model, options } = props;

  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const snackbarId = useRef(null);

  return (
    <>
      <InfoDialog localObserver={localObserver} />
      <ButtonWithBottomMargin onClick={() => model.fetchFromService("line")}>
        Get lines
      </ButtonWithBottomMargin>
      <ButtonWithBottomMargin onClick={() => model.fetchFromService("point")}>
        Get points
      </ButtonWithBottomMargin>
    </>
  );
}

export default AudioGuideView;
