// Make sure to only import the hooks you intend to use
import React, { useCallback, useEffect, useRef, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  FormLabel,
  Snackbar,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import { useSnackbar } from "notistack";

import InfoDialog from "./views/InfoDialog.js";

import BugReportIcon from "@mui/icons-material/BugReport";

const ButtonWithBottomMargin = styled(Button)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

function AudioGuideView(props) {
  const { app, globalObserver, localObserver, map, model, options } = props;

  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const snackbarId = useRef(null);

  const [availableCategories, setAvailableCategories] = useState([]);
  const [fetchError, setFetchError] = useState(null);

  const [selectedCategories, setSelectedCategories] = useState(false);
  // Subscribe and unsubscribe to events
  useEffect(() => {
    localObserver.subscribe("fetchError", (e) =>
      setFetchError(e?.message || null)
    );
  }, [localObserver]);

  // Let's attempt to initiate the model
  useEffect(() => {
    const initModel = async () => {
      await model.init();

      setAvailableCategories(Array.from(model.getAvailableCategories()));
    };
    initModel();
  }, [model]);

  const handleCategoryChange = (e) => {
    console.log("selectedCategories: ", selectedCategories);
    setSelectedCategories({
      ...selectedCategories,
      [e.target.name]: e.target.checked,
    });
  };

  const renderDrawerContent = useCallback(() => {
    return (
      // The sx-prop gives us some shorthand commands, for example, the paddings below
      // will be set to theme.spacing(2), and not 2px! Make sure to read up on how the sx-prop
      // works before using it, check out the MUI docs.
      <Box sx={{ paddingLeft: 2, paddingRight: 2 }}>
        <Typography variant="h6">Meny</Typography>
        <Typography variant="body1">
          Dummy har anropat globalObserver och bett om att få lägga till en
          knapp uppe i headern. När du trycker på knappen visas det här
          innehållet i sidopanelen.
        </Typography>
      </Box>
    );
  }, []);

  useEffect(() => {
    globalObserver.publish("core.addDrawerToggleButton", {
      value: "dummy",
      ButtonIcon: BugReportIcon,
      caption: "AudioGuide",
      drawerTitle: "AudioGuide",
      order: 100,
      renderDrawerContent: renderDrawerContent,
    });
  }, [globalObserver, renderDrawerContent]);

  return (
    <>
      <InfoDialog localObserver={localObserver} />
      {fetchError !== null && (
        <Alert severity="error">
          {fetchError} <Button onClick={() => model.init()}>Retry</Button>
        </Alert>
      )}
      <FormControl sx={{ m: 3 }} component="fieldset" variant="standard">
        <FormLabel component="legend">Filtrera</FormLabel>
        <FormGroup>
          {availableCategories.map((c, i) => {
            return (
              <FormControlLabel
                key={i}
                control={
                  <Checkbox
                    checked={selectedCategories[i]}
                    onChange={handleCategoryChange}
                    name={i.toString()}
                  />
                }
                label={c}
              />
            );
          })}
        </FormGroup>
        <FormHelperText>Du kan välja flera kategorier</FormHelperText>
      </FormControl>
    </>
  );
}

export default AudioGuideView;
