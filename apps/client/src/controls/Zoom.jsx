import React from "react";
import { easeOut } from "ol/easing";
import { Paper } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { styled } from "@mui/material/styles";
import { StyledControlButton } from "components/ControlButton";

const StyledPaper = styled(Paper)(({ theme }) => ({
  marginBottom: theme.spacing(1),
  display: "flex",
  flexDirection: "column",
}));

const ZoomControl = React.memo((props) => {
  function zoomByDelta(delta) {
    if (!props.map) return;
    const view = props.map.getView();

    if (!view) return;
    const currentZoom = view.getZoom();

    if (currentZoom !== undefined) {
      const newZoom = currentZoom + delta;

      const duration = props.mapConfig.zoomDuration ?? 200; // ?? because 0 is an allowed value
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
        <StyledControlButton
          aria-label="Zooma in"
          onClick={() => {
            zoomByDelta(1);
          }}
        >
          <AddIcon />
        </StyledControlButton>
        <StyledControlButton
          aria-label="Zooma ut"
          onClick={() => {
            zoomByDelta(-1);
          }}
        >
          <RemoveIcon />
        </StyledControlButton>
      </StyledPaper>
    )
  );
});

export default ZoomControl;
