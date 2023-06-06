import React from "react";
import { easeOut } from "ol/easing";
import { IconButton, Paper } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { styled } from "@mui/material/styles";
import { useTranslation } from "react-i18next";

const StyledPaper = styled(Paper)(({ theme }) => ({
  marginBottom: theme.spacing(1),
  display: "flex",
  flexDirection: "column",
}));

const StyledIconButton = styled(IconButton)(() => ({
  minWidth: "unset",
}));

const ZoomControl = React.memo((props) => {
  const { t } = useTranslation();

  function zoomByDelta(delta) {
    if (!props.map) return;
    const view = props.map.getView();

    if (!view) return;
    const currentZoom = view.getZoom();

    if (currentZoom !== undefined) {
      const newZoom = currentZoom + delta;

      // TODO: Duration could be an option from map config, allowing admin to disable zoom animation
      const duration = 200;
      if (duration > 0) {
        if (view.getAnimating()) {
          view.cancelAnimations();
        }
        view.animate({
          zoom: newZoom,
          duration: duration,
          easing: easeOut,
        });
      } else {
        view.setZoom(newZoom);
      }
    }
  }

  return (
    props.map !== undefined && (
      <StyledPaper>
        <StyledIconButton
          aria-label={t("controls.zoom.zoomIn")}
          onClick={() => {
            zoomByDelta(1);
          }}
        >
          <AddIcon />
        </StyledIconButton>
        <StyledIconButton
          aria-label={t("controls.zoom.zoomOut")}
          onClick={() => {
            zoomByDelta(-1);
          }}
        >
          <RemoveIcon />
        </StyledIconButton>
      </StyledPaper>
    )
  );
});

export default ZoomControl;
