import { Collapse } from "@mui/material";

export default function LegendImage({ layerItemDetails, open, subLayerIndex }) {
  const layerInfo = layerItemDetails.layer.get("layerInfo") || {};
  const index = subLayerIndex ? subLayerIndex : 0;

  // Check if layerInfo.legend is an array and has the required index
  const src =
    Array.isArray(layerInfo.legend) && layerInfo.legend.length > index
      ? layerInfo.legend[index].url || ""
      : "";

  return src ? (
    <Collapse sx={{ pt: open ? 1 : 0, ml: 4 }} in={open} timeout={50}>
      <div>
        <img
          loading="lazy"
          style={{ maxWidth: "250px" }}
          alt="Teckenförklaring"
          src={src}
        />
      </div>
    </Collapse>
  ) : null;
}
