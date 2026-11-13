import { Box, Tooltip } from "@mui/material";
import DescriptionIcon from "@mui/icons-material/Description";
import MapIcon from "@mui/icons-material/Map";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useTranslation } from "react-i18next";
import { parseDocumentLink } from "./document-link";

const linkSx = {
  display: "inline-flex",
  alignItems: "center",
  gap: 0.5,
  color: "info.main",
  fontWeight: 500,
  verticalAlign: "middle",
  "& svg": { fontSize: "1.1rem" },
};

/** Shows a `{attribute@@documenthandler}` value the way the map's document handler does. */
export default function DocumentLinkPreview({ value }: { value: string }) {
  const { t } = useTranslation();
  const link = parseDocumentLink(value);

  switch (link.kind) {
    case "invalid":
      return (
        <Tooltip title={t("layers.featureInfo.documentLink.invalid")}>
          <Box component="b" sx={{ color: "warning.main" }}>
            Could not render DocumentHandler link
          </Box>
        </Tooltip>
      );
    case "empty":
      return (
        <Tooltip title={t("layers.featureInfo.documentLink.empty")}>
          <Box component="span" sx={{ color: "warning.main" }}>
            ∅
          </Box>
        </Tooltip>
      );
    case "hover":
      return (
        <Tooltip title={link.target}>
          <Box component="abbr" sx={{ textDecoration: "underline dotted" }}>
            {link.text}
          </Box>
        </Tooltip>
      );
    case "document":
      return (
        <Tooltip
          title={
            link.header
              ? t("layers.featureInfo.documentLink.opensChapter", {
                  document: link.document,
                  header: link.header,
                })
              : t("layers.featureInfo.documentLink.opensDocument", {
                  document: link.document,
                })
          }
        >
          <Box component="span" sx={linkSx}>
            <DescriptionIcon />
            {link.text}
          </Box>
        </Tooltip>
      );
    case "map":
      return (
        <Tooltip title={t("layers.featureInfo.documentLink.opensMap", { target: link.target })}>
          <Box component="span" sx={linkSx}>
            <MapIcon />
            {link.text}
          </Box>
        </Tooltip>
      );
    case "external":
      return (
        <Tooltip title={t("layers.featureInfo.documentLink.opensWeb", { target: link.target })}>
          <Box component="span" sx={linkSx}>
            <OpenInNewIcon />
            {link.text}
          </Box>
        </Tooltip>
      );
  }
}
