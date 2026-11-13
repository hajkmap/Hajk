import { Link } from "react-router";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { alpha, type Theme } from "@mui/material/styles";
import MapIcon from "@mui/icons-material/Map";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useTranslation } from "react-i18next";
import type { Map as MapRecord } from "../../../api/maps/types";

interface MapCardProps {
  map: MapRecord;
  isDefault: boolean;
  onDuplicate: (map: MapRecord) => void;
}

const defaultChipSx = {
  bgcolor: (theme: Theme) => alpha(theme.palette.primary.main, 0.12),
  color: (theme: Theme) =>
    theme.palette.mode === "dark"
      ? theme.palette.primary.light
      : theme.palette.primary.dark,
  fontWeight: 600,
};

const noToolsChipSx = {
  bgcolor: (theme: Theme) => alpha(theme.palette.warning.main, 0.16),
  color: (theme: Theme) =>
    theme.palette.mode === "dark"
      ? theme.palette.warning.light
      : theme.palette.warning.dark,
  fontWeight: 600,
};

export default function MapCard({ map, isDefault, onDuplicate }: MapCardProps) {
  const { t } = useTranslation();
  const toolCount = map.toolCount ?? 0;

  const counts = [
    { label: t("common.layers"), value: map.layerCount ?? 0 },
    { label: t("common.tools"), value: toolCount },
    { label: t("common.groups"), value: map.groupCount ?? 0 },
  ];

  const links = [
    { label: t("common.settings"), to: `/maps/${map.id}` },
    { label: t("common.layers"), to: `/maps/${map.id}?tab=menu` },
    { label: t("common.tools"), to: `/maps/${map.id}?tab=tools` },
  ];

  return (
    <Card
      variant="outlined"
      sx={{ height: "100%", display: "flex", flexDirection: "column" }}
    >
      <CardContent sx={{ pb: 1 }}>
        <Stack spacing={2}>
          <Stack
            direction="row"
            spacing={1.5}
            sx={{ alignItems: "flex-start", justifyContent: "space-between" }}
          >
            <Stack
              direction="row"
              spacing={1.5}
              sx={{ alignItems: "center", minWidth: 0 }}
            >
              <Avatar
                variant="rounded"
                sx={{
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
                  color: "primary.main",
                }}
              >
                <MapIcon />
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle1" component="h3" noWrap>
                  {map.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {map.projection?.code ?? "–"}
                </Typography>
              </Box>
            </Stack>
            {isDefault ? (
              <Chip
                size="small"
                label={t("common.defaultMap")}
                sx={defaultChipSx}
              />
            ) : (
              toolCount === 0 && (
                <Chip
                  size="small"
                  label={t("home.noTools")}
                  sx={noToolsChipSx}
                />
              )
            )}
          </Stack>

          <Grid container spacing={1}>
            {counts.map((count) => (
              <Grid key={count.label} size={4}>
                <Typography variant="caption" color="text.secondary">
                  {count.label}
                </Typography>
                <Typography variant="h5" component="p">
                  {count.value}
                </Typography>
              </Grid>
            ))}
          </Grid>

          {map.lastSavedBy && map.lastSavedDate && (
            <Typography variant="body2" color="text.secondary">
              {t("common.lastSavedBy", {
                lastSavedBy: map.lastSavedBy,
                lastSavedDate: new Date(map.lastSavedDate).toLocaleDateString(
                  "sv-SE",
                ),
              })}
            </Typography>
          )}
        </Stack>
      </CardContent>

      <Divider sx={{ mx: 2, mt: "auto" }} />

      <CardActions sx={{ p: 2, flexWrap: "wrap", gap: 1 }} disableSpacing>
        {links.map((link) => (
          <Button
            key={link.to}
            component={Link}
            to={link.to}
            variant="outlined"
            color="inherit"
            size="small"
          >
            {link.label}
          </Button>
        ))}
        <Tooltip title={t("common.duplicate")}>
          <IconButton
            aria-label={t("common.duplicate")}
            size="small"
            onClick={() => onDuplicate(map)}
            sx={{ ml: "auto" }}
          >
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
}
