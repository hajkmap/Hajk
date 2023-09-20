import { Collapse } from "@mui/material";

export default function LegendImage({ layerItemDetails, open, subLayerIndex }) {
  const index = subLayerIndex ? subLayerIndex : 0;
  const layerInfo = layerItemDetails.layer.get("layerInfo");
  const src = layerInfo.legend?.[index]?.url ?? "";

  return src ? (
    <Collapse sx={{ pt: open ? 1 : 0 }} in={open}>
      <div>
        <img max-width="250px" alt="Teckenförklaring" src={src} />
      </div>
    </Collapse>
  ) : null;
}
