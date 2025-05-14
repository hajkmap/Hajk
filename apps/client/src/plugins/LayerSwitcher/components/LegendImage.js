import { Collapse, useTheme } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useState } from "react";
import {
  getDpiFromLegendGraphicUrl,
  getThemedLegendGraphicUrl,
  getLegendBackgroundColor,
} from "../LayerSwitcherUtils";

const ColumnContainer = styled("div")(({ theme }) => ({
  display: "inline-flex",
  flexDirection: "column",
  alignItems: "start",
  gap: "0.25em",
  backgroundColor: getLegendBackgroundColor(theme),
  borderRadius: "2px",
  padding: "2px",
  maxWidth: "100%",
}));

const Image = styled("img")(() => ({
  maxWidth: "100%",
  display: "none",
}));

const ImageWithLoading = ({ src }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageWidth, setImageWidth] = useState(null);
  const theme = useTheme();

  const handleLoad = (e) => {
    const img = e.currentTarget;
    const dpi = getDpiFromLegendGraphicUrl(src);
    if (dpi > 90 && img.naturalWidth) {
      const width = (img.naturalWidth / dpi) * 96;
      setImageWidth(width);
    }

    setLoading(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  return (
    <div>
      <div
        style={{
          fontSize: theme.typography.caption.fontSize,
        }}
      >
        {/* Maybe add a spinner here instead of Loading text.. */}
        {loading && !error && <span>Laddar...</span>}
        {error && (
          <span title={src} style={{ color: theme.palette.warning.main }}>
            Kunde inte ladda teckenförklaring
          </span>
        )}
      </div>
      <Image
        src={src}
        onLoad={handleLoad}
        onError={handleError}
        sx={{
          display: loading || error ? "none" : "block",
          borderRadius: "2px",
          width: imageWidth ? `${imageWidth}px` : "auto",
        }}
        alt="Teckenförklaring"
      />
    </div>
  );
};

export default function LegendImage({ open, src }) {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  if (!src) {
    return null;
  }

  const urlArray = Array.isArray(src) ? src : [src];

  return (
    <Collapse
      sx={{ py: open ? 1 : 0, ml: "1px" }}
      in={open}
      timeout={50}
      unmountOnExit
    >
      <ColumnContainer>
        {urlArray
          .filter((url) => url)
          .map((url, index) => {
            const themedUrl = getThemedLegendGraphicUrl(url, isDarkMode);
            return (
              <ImageWithLoading key={index + "-" + themedUrl} src={themedUrl} />
            );
          })}
      </ColumnContainer>
    </Collapse>
  );
}
