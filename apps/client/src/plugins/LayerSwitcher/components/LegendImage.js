import { Collapse, useTheme } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useState } from "react";

const ColumnContainer = styled("div")(({ theme }) => ({
  display: "inline-flex",
  flexDirection: "column",
  alignItems: "start",
  gap: "0.25em",
  backgroundColor:
    theme.palette.mode === "dark"
      ? theme.palette.grey[800]
      : theme.palette.grey[200],
  borderRadius: "2px",
  padding: "4px",
  maxWidth: "100%",
}));

const Image = styled("img")(() => ({
  maxWidth: "100%",
  display: "none",
}));

const ImageWithLoading = ({ src }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const theme = useTheme();
  return (
    <div>
      <div
        style={{
          fontSize: theme.typography.caption.fontSize,
        }}
      >
        {loading && !error && <span>Laddar...</span>}
        {error && (
          <span title={src} style={{ color: theme.palette.warning.main }}>
            Kunde inte ladda legenden
          </span>
        )}
      </div>
      <Image
        src={src}
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
        sx={{
          display: loading || error ? "none" : "block",
          borderRadius: "2px",
        }}
        alt="Teckenförklaring"
      />
    </div>
  );
};

const getThemedUrl = (url, isDarkMode) => {
  const fontColor = isDarkMode ? "0xFFFFFF" : "0x000000";
  const parsedUrl = new URL(url);
  const params = parsedUrl.searchParams;

  if (params.get("REQUEST")?.toLowerCase() === "getlegendgraphic") {
    params.set("TRANSPARENT", "true");

    const legendOptions = params.get("LEGEND_OPTIONS") || "";
    const optionsArray = legendOptions.split(";").filter(Boolean);
    const optionsObj = Object.fromEntries(
      optionsArray.map((option) => option.split(":").map((str) => str.trim()))
    );

    optionsObj.fontColor = fontColor;

    const newLegendOptions = Object.entries(optionsObj)
      .map(([key, value]) => `${key}:${value}`)
      .join(";");

    params.set("LEGEND_OPTIONS", newLegendOptions + ";");
  }

  return parsedUrl.toString();
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
        {urlArray.map((url) => {
          const themedUrl = getThemedUrl(url, isDarkMode);
          return <ImageWithLoading key={themedUrl} src={themedUrl} />;
        })}
      </ColumnContainer>
    </Collapse>
  );
}
