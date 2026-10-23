import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import HelpIcon from "@mui/icons-material/Help";
import LockOpenOutlinedIcon from "@mui/icons-material/LockOpenOutlined";
import { useTranslation } from "react-i18next";
import type { ToolZone } from "../../../api/maps";

const MAP_WIDTH = 168;
const MAP_HEIGHT = 104;

function Slot({
  active,
  accent,
  number,
  sx,
}: {
  active: boolean;
  accent: string;
  number?: number;
  sx: Record<string, unknown>;
}) {
  return (
    <Box
      sx={{
        position: "absolute",
        borderRadius: 0.5,
        bgcolor: active ? accent : "action.disabledBackground",
        color: "common.white",
        fontSize: 9,
        fontWeight: 700,
        lineHeight: 1,
        display: "grid",
        placeItems: "center",
        ...sx,
      }}
    >
      {active && number != null ? number : null}
    </Box>
  );
}

/** A small map with the column's place highlighted and numbered in order. */
function ZonePreview({ zone, accent }: { zone: ToolZone; accent: string }) {
  const { t } = useTranslation();
  const drawer = zone === "drawer";
  const left = zone === "widgetLeft";
  const right = zone === "widgetRight";
  const control = zone === "controlButton";

  return (
    <Box
      aria-hidden
      sx={{
        position: "relative",
        width: MAP_WIDTH,
        height: MAP_HEIGHT,
        borderRadius: 1,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.default",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      {drawer ? (
        <Box
          sx={{
            position: "absolute",
            inset: "0 auto 0 0",
            width: 72,
            bgcolor: "background.paper",
            borderRight: "1px solid",
            borderColor: "divider",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Typography
            sx={{
              px: 0.75,
              py: 0.5,
              fontSize: 8,
              fontWeight: 800,
              letterSpacing: 1,
              lineHeight: 1,
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            HAJK
          </Typography>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 0.75,
              py: 0.4,
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography
              sx={{
                fontSize: 6,
                fontWeight: 700,
                letterSpacing: 0.4,
                lineHeight: 1,
                textTransform: "uppercase",
                color: "text.secondary",
              }}
            >
              {t("maps.toolsZoneHelp.drawerHeading")}
            </Typography>
            <LockOpenOutlinedIcon sx={{ fontSize: 8, color: "text.secondary" }} />
          </Box>
          <Box sx={{ position: "relative", flex: 1 }}>
            {[1, 2, 3, 4].map((n) => (
              <Slot
                key={n}
                active
                accent={accent}
                number={n}
                sx={{ left: 6, right: 6, top: 4 + (n - 1) * 13, height: 9 }}
              />
            ))}
          </Box>
        </Box>
      ) : (
        [1, 2, 3].map((n) => (
          <Slot
            key={n}
            active={left}
            accent={accent}
            number={n}
            sx={{ left: 6, top: 6 + (n - 1) * 16, width: 40, height: 12 }}
          />
        ))
      )}
      {[1, 2].map((n) => (
        <Slot
          key={n}
          active={right}
          accent={accent}
          number={n}
          sx={{ right: 22, top: 6 + (n - 1) * 16, width: 40, height: 12 }}
        />
      ))}
      {[1, 2, 3, 4, 5, 6].map((n) => (
        <Slot
          key={n}
          active={control}
          accent={accent}
          number={n}
          sx={{ right: 6, top: 6 + (n - 1) * 13, width: 10, height: 10 }}
        />
      ))}
    </Box>
  );
}

export default function MapToolZoneHelp({
  zone,
  accent,
  title,
  disabled = false,
}: {
  zone: ToolZone;
  accent: string;
  title: string;
  disabled?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <Tooltip
      placement="bottom-start"
      enterDelay={150}
      disableInteractive
      disableHoverListener={disabled}
      disableFocusListener={disabled}
      slotProps={{
        tooltip: {
          sx: {
            maxWidth: 360,
            p: 1.5,
            bgcolor: "background.paper",
            color: "text.primary",
            border: "1px solid",
            borderColor: "divider",
            boxShadow: 4,
          },
        },
      }}
      title={
        <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
          <ZonePreview zone={zone} accent={accent} />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
              {title}
            </Typography>
            <Typography variant="body2" sx={{ mb: 0.75 }}>
              {t(`maps.toolsZoneHelp.${zone}`)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t(
                zone === "controlButton"
                  ? "maps.toolsZoneHelp.orderControl"
                  : "maps.toolsZoneHelp.order",
              )}
            </Typography>
          </Box>
        </Box>
      }
    >
      <IconButton
        size="small"
        type="button"
        aria-label={t("maps.toolsZoneHelp.label", { placement: title })}
        sx={{ p: 0.25, color: "text.secondary", flexShrink: 0 }}
      >
        <HelpIcon sx={{ fontSize: 18 }} />
      </IconButton>
    </Tooltip>
  );
}
