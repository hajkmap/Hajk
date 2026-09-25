import { useEffect, useState } from "react";

import { Alert } from "@mui/material";
import type OlMap from "ol/Map";

import { UI_STRINGS } from "../constants";
import type FloodSimulatorModel from "../FloodSimulatorModel";

interface ZoomHiddenNoticeProps {
  map: OlMap;
  model: FloodSimulatorModel;
  enabled: boolean;
}

function ZoomHiddenNotice({ map, model, enabled }: ZoomHiddenNoticeProps) {
  const hidden = useHiddenByZoom(map, model, enabled);
  if (!hidden) {
    return null;
  }

  return (
    <Alert severity="info" sx={{ py: 0.5 }}>
      {UI_STRINGS.zoomInToSeeSimulation}
    </Alert>
  );
}

function useHiddenByZoom(
  map: OlMap,
  model: FloodSimulatorModel,
  enabled: boolean
): boolean {
  const [zoomHidden, setZoomHidden] = useState(() => model.isHiddenByZoom());

  useEffect(() => {
    const view = map.getView();
    const update = () => {
      setZoomHidden(model.isHiddenByZoom());
    };
    view.on("change:resolution", update);
    return () => {
      view.un("change:resolution", update);
    };
  }, [map, model]);

  return enabled && zoomHidden;
}

export default ZoomHiddenNotice;
