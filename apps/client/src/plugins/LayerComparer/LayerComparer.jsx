import React, { useEffect, useRef, useState, forwardRef } from "react";
import {
  Alert,
  Box,
  Button,
  Divider,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  useTheme,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import CompareIcon from "@mui/icons-material/Compare";
import VisibilityIcon from "@mui/icons-material/Visibility";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { useSnackbar } from "notistack";

import ControlButton, { StyledControlButton } from "components/ControlButton";
import HajkToolTip from "components/HajkToolTip";
import DialogWindowPlugin from "../../plugins/DialogWindowPlugin";
import SelectDropdown from "./SelectDropdown";
import SDSControl from "./CustomOLControl";
import SpyGlassControl from "./SpyGlassControl";

const MODE_SIDE_BY_SIDE = "sideBySide";
const MODE_SPY_GLASS = "spyGlass";

// Rendered as a notistack custom content component so it can call useTheme()
// on every render and always reflect the current palette — including live
// theme switches without a page reload.
const ComparerSnackbar = forwardRef(function ComparerSnackbar(
  { onShowWindow, onAbort },
  ref
) {
  const theme = useTheme();
  return (
    <Paper
      ref={ref}
      elevation={6}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 1,
        px: 2,
        py: 1,
        bgcolor: "background.paper",
        color: "text.primary",
        colorScheme: theme.palette.mode,
      }}
    >
      <Button variant="contained" color="primary" onClick={onShowWindow}>
        Ändra val
      </Button>
      <Button variant="contained" color="error" onClick={onAbort}>
        Sluta jämföra
      </Button>
    </Paper>
  );
});

const KeyCap = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 22,
  height: 22,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 4,
  boxShadow: `0 2px 0 ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
}));

const KeyHintRow = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: 3,
});

const LayerComparer = (props) => {
  const [layerId1, setLayerId1] = useState("");
  const [layerId2, setLayerId2] = useState("");
  const [mode, setMode] = useState(
    props.options.startCompareMode === MODE_SPY_GLASS
      ? MODE_SPY_GLASS
      : MODE_SIDE_BY_SIDE
  );

  const [layers, setLayers] = useState([]);
  const [baseLayers, setBaseLayers] = useState([]);
  const [chosenLayers, setChosenLayers] = useState([]);

  // Two refs to hold our map controls (one per mode).
  const sdsRef = useRef();
  const spyRef = useRef();

  // Two more refs that will hold the OL layer objects
  const l1 = useRef();
  const l2 = useRef();

  // Prepare a ref that will hold the original OL background
  // layer object. This makes it possible to restore
  // to the same background when user closes the comparer.
  const oldBackgroundLayer = useRef();

  // When compare mode is active, we want to show a snackbar that
  // allows user to simply disable the comparer.
  const { closeSnackbar, enqueueSnackbar } = useSnackbar();

  // We don't want to prompt the user with more than one snack, so lets track the current one,
  // so that we can close it when another one is about to open.
  const helperSnack = React.useRef(null);

  const isSpy = mode === MODE_SPY_GLASS;
  const showMobileLensControls = isSpy && layerId1 !== "" && layerId2 !== "";

  // Prepare layers that will be available in the comparer.
  // By doing it in this useEffect, we do it once and for all,
  // which is a good idea, as such filter/map can be considered
  // an expensive operation.
  /* useEffect hook to manage layer selection based on component props.
   * 1. Retrieves all layers from the map.
   * 2. Checks if selecting chosen layers is enabled.
   *    a. Filters and maps the chosen layers to match available layers.
   *    b. Updates the state with the final chosen layers.
   * 3. If selecting chosen layers is not enabled:
   *    a. Filters and maps base layers and updates the baseLayers state.
   *    b. If showing non-base layers in the selection is enabled:
   *       i. Filters and maps non-base layers and updates the layers state.
   *    c. Otherwise, clears the layers state.
   *    d. Clears the chosenLayers state.
   * 4. The effect runs whenever the map or relevant options change.
   */

  useEffect(() => {
    const allLayers = props.map.getAllLayers();

    if (props.options.selectChosenLayers) {
      const finalChosenLayers = (props.options.chosenLayers || [])
        .filter((chosen) =>
          allLayers.some((al) => al.get("name") === chosen.id)
        )
        .map((chosen) => {
          const realLayer = allLayers.find(
            (al) => al.get("name") === chosen.id
          );
          return {
            id: realLayer.ol_uid,
            label: realLayer.get("caption"),
            layerType: realLayer.get("layerType"),
          };
        });

      setChosenLayers(finalChosenLayers);
    } else {
      const baseLayers = allLayers
        .filter((l) => l.get("layerType") === "base")
        .map((l) => {
          return {
            id: l.ol_uid,
            label: l.get("caption"),
            layerType: l.get("layerType"),
          };
        });
      setBaseLayers(baseLayers);

      if (props.options.showNonBaseLayersInSelect) {
        const layers = allLayers
          .filter((l) => ["layer", "group"].includes(l.get("layerType")))
          .map((l) => {
            return {
              id: l.ol_uid,
              label: l.get("caption"),
              layerType: l.get("layerType"),
            };
          });
        setLayers(layers);
      } else {
        setLayers([]);
      }

      setChosenLayers([]);
    }
  }, [
    props.map,
    props.options.showNonBaseLayersInSelect,
    props.options.selectChosenLayers,
    props.options.chosenLayers,
  ]);

  // Instantiate both OL controls once and add them to the map. Only the
  // currently active one will have its UI rendered and render listeners
  // attached (via its open() method). The other stays dormant.
  useEffect(() => {
    sdsRef.current = new SDSControl();
    spyRef.current = new SpyGlassControl();
    props.map.addControl(sdsRef.current);
    props.map.addControl(spyRef.current);

    // Previous compare sessions could have left multiple base layers
    // visible (because both compare layers were made visible, and that
    // state gets serialized to the URL hash). Only one base layer should
    // ever be visible at a time, so hide any extras now. First one wins.
    // Lets keep this fix here for now so we dont pollute AppModel etc with this logic.
    const visibleBaseLayers = props.map
      .getAllLayers()
      .filter((l) => l.get("layerType") === "base" && l.getVisible() === true);
    if (visibleBaseLayers.length > 1) {
      visibleBaseLayers.slice(1).forEach((l) => l.setVisible(false));
    }

    return () => {
      try {
        sdsRef.current?.remove();
        spyRef.current?.remove();
        props.map.removeControl(sdsRef.current);
        props.map.removeControl(spyRef.current);
      } catch (e) {
        // Map may have been torn down already
      }
    };
  }, [props.map]);

  // When Hajk Drawer is toggled the map's view (canvas's) size
  // changes too. We must update the clipper's position accordingly.
  useEffect(() => {
    const onDrawerToggled = () => {
      sdsRef.current?.updateClip();
      spyRef.current?.updateClip();
    };
    props.app.globalObserver.on("core.drawerToggled", onDrawerToggled);
  }, [props.app.globalObserver]);

  // The main action happens in this useEffect. When both compare layers
  // are set we initialize the currently active comparer control and make
  // it visible. If any compare layer is empty, we reset both controls
  // and restore the original background layer.
  useEffect(() => {
    // If layer1 or layer2 changed, it means that the Dialog is visible
    // and we never want to show the snackbar simultaneously. Let's close it.
    closeSnackbar(helperSnack.current);

    if (layerId1 === "" || layerId2 === "") {
      // If any of the layer dropdowns is empty, we can't compare.
      resetComparer();
    } else {
      // If both IDs are set, we can attempt to grab the layers from the map
      // and start comparing.
      l1.current = props.map.getAllLayers().find((l) => l.ol_uid === layerId1);
      l2.current = props.map.getAllLayers().find((l) => l.ol_uid === layerId2);

      // Save the original background so we can restore it later. Exclude the
      // two compare layers so we don't accidentally snapshot one of them.
      oldBackgroundLayer.current = props.map
        .getAllLayers()
        .find(
          (l) =>
            l.getVisible() === true &&
            l.get("layerType") === "base" &&
            l.ol_uid !== layerId1 &&
            l.ol_uid !== layerId2
        );
      // Also, let's hide it for now
      oldBackgroundLayer.current?.setVisible(false);

      // Ensure the inactive control is fully torn down so no stale render
      // listeners remain on layers from a previous mode.
      const useSpy = mode === MODE_SPY_GLASS;
      const inactiveControl = useSpy ? sdsRef.current : spyRef.current;
      const activeControl = useSpy ? spyRef.current : sdsRef.current;

      inactiveControl?.remove();

      activeControl.open();
      activeControl.setCompareLayers(l1.current, l2.current);
    }
  }, [layerId1, layerId2, mode, props.map, closeSnackbar]);

  const resetComparer = () => {
    // Remove both OL controls' state so nothing lingers regardless of mode
    sdsRef.current?.remove();
    spyRef.current?.remove();

    // Let's hide compare layers in Map
    l1.current?.setVisible(false);
    l2.current?.setVisible(false);

    // Safety net: also clean up any layers that still carry compare flags
    // from a previous session (for example... after URL-hash stuff....).
    props.map
      .getAllLayers()
      .filter(
        (l) =>
          l.get("isLeftCompareLayer") === true ||
          l.get("isRightCompareLayer") === true ||
          l.get("isTopCompareLayer") === true ||
          l.get("isBottomCompareLayer") === true
      )
      .forEach((l) => {
        l.setVisible(false);
        l.set("isLeftCompareLayer", false);
        l.set("isRightCompareLayer", false);
        l.set("isTopCompareLayer", false);
        l.set("isBottomCompareLayer", false);
      });

    // Show original background layer
    oldBackgroundLayer.current?.setVisible(true);
  };

  const onVisibilityChanged = (visible) => {
    // If the Dialog becomes visible, but there already is a snackbar,
    // we must close it in order to avoid duplicate snackbars.
    if (visible === true && helperSnack.current !== null) {
      // This ugly hack is needed to avoid warnings due to a race condition
      // in React's render.
      setTimeout(() => {
        closeSnackbar(helperSnack.current);
      });
    }
  };

  const onAbort = () => {
    // Unsetting these state variables will cleanup the UI
    // as well as trigger the useEffect above to run and
    // take rest of remaining cleanups (once both variables
    // are empty strings).
    setLayerId1("");
    setLayerId2("");
  };

  const handleModeChange = (_event, nextMode) => {
    if (nextMode === null) return;
    setMode(nextMode);
  };

  // onClose is actually the callback that runs when user
  // clicks the primary action button in the Dialog, i.e. "Compare".
  const onClose = () => {
    // Ensure that there are real layers to compare
    if (l1.current?.getVisible() && l2.current?.getVisible()) {
      helperSnack.current = enqueueSnackbar("", {
        persist: true,
        anchorOrigin: { vertical: "bottom", horizontal: "center" },
        // A React component as `content` re-renders on every theme change,
        // so dark/light mode is always reflected without a page reload.
        content: (key) => (
          <ComparerSnackbar
            key={key}
            onShowWindow={() =>
              props.app.globalObserver.publish("layercomparer.showWindow")
            }
            onAbort={onAbort}
          />
        ),
      });
    }
  };

  const dropdown1Label = isSpy ? "Bakgrundslager" : "Vänster sida";
  const dropdown2Label = isSpy ? "Titthålslager" : "Höger sida";

  const helpContent = isSpy ? (
    <>
      Välj vilket lager som ska vara <i>bakgrund</i> och vilket som ska visas
      inuti <i>titthålet</i>.
    </>
  ) : (
    <>
      Välj två lager att jämföra och tryck på <i>Jämför</i>.
    </>
  );

  return (
    <>
      <DialogWindowPlugin
        options={props.options} // Supply the unique instance's options…
        map={props.map} // …but the shared map…
        app={props.app} // …and app.
        type="LayerComparer" // Unique name - each plugin needs one. Upper-case first letter, must be valid JS variable name.
        defaults={{
          // Some defaults to fall back to in case instanceOptions doesn't provide them.
          icon: <CompareIcon />, // Default icon for this plugin
          title: "Lagerjämförare",
          description: "Jämför lager sida vid sida eller med titthål", // Shown on Widget button as well as Tooltip for Control button
          headerText: "Jämför lager",
          buttonText: "Jämför",
          primaryButtonVariant: "contained",
          abortText: "Nollställ & stäng",
          onAbort: onAbort, // Called when user presses the Reset & Close button
          onClose: onClose, // Called when user presses the main primary button
          onVisibilityChanged: onVisibilityChanged, // Called when the dialog is shown or hidden
        }}
      >
        <Stack spacing={2} sx={{ width: { xs: "100%", md: 350 } }}>
          <ToggleButtonGroup
            value={mode}
            exclusive
            fullWidth
            color="primary"
            onChange={handleModeChange}
            aria-label="Jämförelseläge"
            size="small"
          >
            <ToggleButton value={MODE_SIDE_BY_SIDE} aria-label="Sida vid sida">
              <CompareIcon fontSize="small" sx={{ mr: 1 }} />
              Sida vid sida
            </ToggleButton>
            <ToggleButton value={MODE_SPY_GLASS} aria-label="Titthål">
              <VisibilityIcon fontSize="small" sx={{ mr: 1 }} />
              Titthål
            </ToggleButton>
          </ToggleButtonGroup>

          <Alert
            icon={isSpy ? <VisibilityIcon /> : <CompareIcon />}
            variant="info"
          >
            {helpContent}
            {isSpy && (
              <Box
                sx={{
                  mt: 1,
                  display: { xs: "none", md: "flex" },
                  flexDirection: "column",
                  gap: 0.5,
                }}
              >
                <KeyHintRow>
                  <KeyCap>
                    <KeyboardArrowLeftIcon sx={{ fontSize: 18 }} />
                  </KeyCap>
                  <KeyCap>
                    <KeyboardArrowRightIcon sx={{ fontSize: 18 }} />
                  </KeyCap>
                  <Box
                    component="span"
                    sx={{ typography: "caption", pt: "4px", pl: "6px" }}
                  >
                    Ändra transparens
                  </Box>
                </KeyHintRow>
                <KeyHintRow>
                  <KeyCap>
                    <KeyboardArrowUpIcon sx={{ fontSize: 18 }} />
                  </KeyCap>
                  <KeyCap>
                    <KeyboardArrowDownIcon sx={{ fontSize: 18 }} />
                  </KeyCap>
                  <Box
                    component="span"
                    sx={{ typography: "caption", pt: "4px", pl: "6px" }}
                  >
                    Ändra storlek
                  </Box>
                </KeyHintRow>
              </Box>
            )}
          </Alert>

          <SelectDropdown
            setter={setLayerId1}
            value={layerId1}
            counterValue={layerId2}
            baseLayers={baseLayers}
            chosenLayers={chosenLayers}
            layers={layers}
            label={dropdown1Label}
          />
          <SelectDropdown
            setter={setLayerId2}
            value={layerId2}
            counterValue={layerId1}
            baseLayers={baseLayers}
            chosenLayers={chosenLayers}
            layers={layers}
            label={dropdown2Label}
          />
        </Stack>
      </DialogWindowPlugin>
      {showMobileLensControls && (
        <Box
          sx={(theme) => ({
            position: "absolute",
            top: theme.spacing(8),
            left: theme.spacing(2),
            display: { xs: "flex", md: "none" },
            flexDirection: "column",
            alignItems: "flex-start",
            zIndex: 4,
            pointerEvents: "auto",
          })}
        >
          <Paper>
            <HajkToolTip title="Gör titthålet större" placement="left">
              <StyledControlButton
                aria-label="Gör titthålet större"
                onClick={() => spyRef.current?.increaseLensSize()}
                sx={(theme) => ({
                  borderRadius: `${theme.shape.borderRadius}px ${theme.shape.borderRadius}px 0 0`,
                })}
              >
                <RadioButtonUncheckedIcon />
              </StyledControlButton>
            </HajkToolTip>
            <Divider />
            <HajkToolTip title="Gör titthålet mindre" placement="left">
              <StyledControlButton
                aria-label="Gör titthålet mindre"
                onClick={() => spyRef.current?.decreaseLensSize()}
                sx={(theme) => ({
                  borderRadius: `0 0 ${theme.shape.borderRadius}px ${theme.shape.borderRadius}px`,
                })}
              >
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <RadioButtonUncheckedIcon sx={{ fontSize: 14 }} />
                </Box>
              </StyledControlButton>
            </HajkToolTip>
          </Paper>
        </Box>
      )}
    </>
  );
};

export default LayerComparer;
