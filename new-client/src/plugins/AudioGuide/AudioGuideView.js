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
import FeatureView from "./views/FeatureView.js";

import HeadsetIcon from "@mui/icons-material/Headset";

const ButtonWithBottomMargin = styled(Button)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

function AudioGuideView(props) {
  const {
    app,
    globalObserver,
    localObserver,
    map: olMap,
    model,
    options,
  } = props;

  const { initialURLParams } = app.config;

  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const snackbarId = useRef(null);

  const [availableCategories, setAvailableCategories] = useState([]);
  const [fetchError, setFetchError] = useState(null);

  const [selectedCategories, setSelectedCategories] = useState([]);

  const [selectedFeature, setSelectedFeature] = useState([]);
  // Subscribe and unsubscribe to events
  useEffect(() => {
    localObserver.subscribe("fetchError", (e) =>
      setFetchError(e?.message || null)
    );

    localObserver.subscribe("featureSelected", (f) => {
      setSelectedFeature(f);

      // This should not happen, we're only prepared for one feature a time.
      if (f.length > 1)
        console.warn(
          "More than 1 feature was returned, displaying only the topmost feature. Complete array is:",
          f
        );
    });
  }, [localObserver]);

  // Let's attempt to initiate the model
  useEffect(() => {
    // The async method must live inside the useEffect hook
    const initModel = async () => {
      await model.init();

      const availableCategories = model.getAvailableCategories();

      // Let's check if the "ag_c" param has a value. If so, use it
      // to determine which categories should be pre-selected.
      const initiallyEnabledCategories = initialURLParams.get("ag_c");

      if (typeof initiallyEnabledCategories === "string") {
        setSelectedCategories(initiallyEnabledCategories.split(","));
      } else {
        // Let's make all categories selected by default
        setSelectedCategories(availableCategories);
      }

      // Finally, set categories in state so that we can render properly
      setAvailableCategories(availableCategories);
    };

    // Invoke the method defined above
    initModel();
  }, [initialURLParams, model]);

  const handleCategoryChange = (e) => {
    setSelectedCategories((prev) => {
      if (e.target.checked === true && !prev.includes(e.target.name)) {
        return [...prev, e.target.name];
      } else if (e.target.checked === false && prev.includes(e.target.name)) {
        return prev.filter((el) => el !== e.target.name);
      }
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
      value: "audioguide",
      ButtonIcon: HeadsetIcon,
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
      {selectedFeature && <FeatureView selectedFeature={selectedFeature} />}
      <FormControl sx={{ m: 3 }} component="fieldset" variant="standard">
        <FormLabel component="legend">Filtrera</FormLabel>
        <FormGroup>
          {availableCategories.map((c, i) => {
            return (
              <FormControlLabel
                key={i}
                control={
                  <Checkbox
                    checked={selectedCategories.includes(c)}
                    onChange={handleCategoryChange}
                    name={c}
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
