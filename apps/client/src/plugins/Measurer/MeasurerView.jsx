import { styled } from "@mui/material/styles";
import BaseDialog from "components/Dialog/BaseDialog";
import {
  ToggleButtonGroup,
  ToggleButton,
  Button,
  Grid,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Zoom,
} from "@mui/material";

import {
  IconPolygon,
  IconPoint,
  IconLine,
  IconCircle,
  IconSegment,
} from "./MeasurerIcons";
import DeleteIcon from "@mui/icons-material/Delete";
import TouchAppIcon from "@mui/icons-material/TouchApp";
import ConfirmationDialog from "../../components/ConfirmationDialog";
import { useEffect, useState } from "react";
import HajkToolTip from "components/HajkToolTip";
import SelectFeaturesDialog from "utils/SelectFeaturesDialog";
import SettingsIcon from "@mui/icons-material/Settings";
import SettingsDialog from "./views/SettingsDialog";
import { Trans, useTranslation } from "react-i18next";

const SvgImg = styled("img")(({ _theme }) => ({
  height: "24px",
  width: "24px",
}));

const StyledToggleButton = styled(ToggleButton)(({ theme }) => ({
  img: {
    filter: "",
    ...theme.applyStyles("dark", {
      filter: "invert(1)",
    }),
  },
  "&.Mui-selected, &.Mui-selected:hover": {
    "img, svg": {
      marginBottom: "-3px",
    },
    borderBottom: `3px solid ${theme.palette.primary.main}`,
  },
}));

const StyledToggleButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
  border: "2px solid white",
  borderColor: theme.palette.divider,
  overflow: "hidden",
  whiteSpace: "nowrap",
  button: {
    borderTopWidth: 0,
    borderTop: "none",
    borderBottom: "none",
    borderBottomWidth: 0,
  },
  "button:first-of-type": {
    borderLeft: "none",
  },
  "button:last-of-type": {
    borderRight: "none",
  },
}));

function HelpDialog(props) {
  const { t } = useTranslation();
  return (
    <BaseDialog
      open={props.open}
      onClose={() => {
        props.setShowHelp(false);
      }}
    >
      <DialogTitle>{t("common.help")}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          <Trans
            i18nKey="measurer.help.text"
            components={{ strong: <strong />, br: <br /> }}
          />
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          variant="contained"
          onClick={() => {
            props.setShowHelp(false);
          }}
        >
          {t("common.ok")}
        </Button>
      </DialogActions>
    </BaseDialog>
  );
}

function MeasurerView(props) {
  const {
    handleDrawTypeChange,
    drawType,
    drawModel,
    segmentsEnabled,
    toggleSegmentsEnabled,
    measurementSettings,
    onUpdateMeasurementSettings,
  } = props;
  const { t } = useTranslation();
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showSegmentButton, setShowSegmentButton] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  const deleteAll = () => {
    setShowDeleteConfirmation(false);
    drawModel.removeDrawnFeatures();
  };

  useEffect(() => {
    if (drawType === "LineString" || drawType === "Polygon") {
      setShowSegmentButton(true);
    } else {
      setShowSegmentButton(false);
    }
  }, [drawType]);

  useEffect(() => {
    props.localObserver.subscribe("show-help", () => {
      setShowHelp(true);
    });
    return () => {
      props.localObserver.unsubscribe("show-help");
    };
  }, [props.localObserver]);

  const handleSegmentsToggle = () => {
    toggleSegmentsEnabled(!segmentsEnabled);
  };

  return (
    <>
      <Grid
        container
        spacing={1}
        sx={{
          alignItems: "flex-start",
        }}
      >
        <Grid
          size={12}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <StyledToggleButtonGroup
            exclusive
            value={drawType}
            onChange={handleDrawTypeChange}
            orientation="horizontal"
            variant="contained"
            aria-label={t("measurer.measureType")}
          >
            <HajkToolTip title={t("measurer.point")}>
              <StyledToggleButton value="Point">
                <SvgImg src={IconPoint()} />
              </StyledToggleButton>
            </HajkToolTip>
            <HajkToolTip title={t("measurer.line")}>
              <StyledToggleButton value="LineString">
                <SvgImg src={IconLine()} />
              </StyledToggleButton>
            </HajkToolTip>
            <HajkToolTip title={t("measurer.area")}>
              <StyledToggleButton value="Polygon">
                <SvgImg src={IconPolygon()} />
              </StyledToggleButton>
            </HajkToolTip>
            <HajkToolTip title={t("measurer.circle")}>
              <StyledToggleButton value="Circle">
                <SvgImg src={IconCircle()} />
              </StyledToggleButton>
            </HajkToolTip>
            <HajkToolTip title={t("measurer.select")}>
              <StyledToggleButton value="Select">
                <TouchAppIcon />
              </StyledToggleButton>
            </HajkToolTip>
            <HajkToolTip title={t("measurer.deleteOne")}>
              <StyledToggleButton value="Delete">
                <DeleteIcon />
              </StyledToggleButton>
            </HajkToolTip>
          </StyledToggleButtonGroup>
          <HajkToolTip title={t("measurer.segments")}>
            <Zoom in={showSegmentButton}>
              <StyledToggleButton
                value="Segments"
                selected={segmentsEnabled}
                sx={{
                  border: "2px solid",
                  borderColor: "divider",
                }}
                onClick={() => handleSegmentsToggle()}
              >
                <SvgImg src={IconSegment()} />
              </StyledToggleButton>
            </Zoom>
          </HajkToolTip>
        </Grid>
        <Grid
          size={12}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <HajkToolTip title={t("measurer.clearAll")}>
            <Button
              size="small"
              variant="contained"
              startIcon={<DeleteIcon />}
              onClick={() => {
                setShowDeleteConfirmation(true);
              }}
            >
              {t("search.results.clear")}
            </Button>
          </HajkToolTip>
          <HajkToolTip title={t("measurer.settingsTooltip")}>
            <IconButton
              aria-expanded={showSettings}
              aria-haspopup="dialog"
              aria-label={t("measurer.settingsTooltip")}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => {
                setShowSettings(true);
              }}
              size="small"
              sx={{
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <SettingsIcon fontSize="small" />
            </IconButton>
          </HajkToolTip>
        </Grid>
      </Grid>
      <ConfirmationDialog
        open={showDeleteConfirmation === true}
        titleName={t("search.results.clear")}
        contentDescription={t("measurer.clearAllConfirm")}
        cancel={t("common.cancel")}
        confirm={t("measurer.clearAllConfirmButton")}
        handleConfirm={deleteAll}
        handleAbort={() => {
          setShowDeleteConfirmation(false);
        }}
      />
      <HelpDialog open={showHelp} setShowHelp={setShowHelp} />
      <SettingsDialog
        open={showSettings}
        onClose={() => setShowSettings(false)}
        measurementSettings={measurementSettings}
        onChange={onUpdateMeasurementSettings}
      />
      <SelectFeaturesDialog
        localObserver={props.localObserver}
        drawModel={drawModel}
        dialogTitle={t("measurer.selectFeaturesTitle")}
      />
    </>
  );
}

export default MeasurerView;
