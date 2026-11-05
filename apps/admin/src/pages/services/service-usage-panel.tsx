import { Box, Chip, Paper, Skeleton, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useMapsByServiceId, useGroupsByServiceId } from "../../api/services";
import useAppStateStore from "../../store/use-app-state-store";

function ServiceUsagePanel({ serviceId }: { serviceId: string }) {
  const { t } = useTranslation();
  const themeMode = useAppStateStore((state) => state.themeMode);
  const isDarkMode = themeMode === "dark";

  const { data: maps = [], isLoading: mapsLoading } =
    useMapsByServiceId(serviceId);
  const { data: groups = [], isLoading: groupsLoading } =
    useGroupsByServiceId(serviceId);

  return (
    <Paper
      sx={{
        width: "100%",
        p: 2,
        mb: 3,
        backgroundColor: isDarkMode ? "#121212" : "#efefef",
      }}
    >
      <Typography variant="h6" sx={{ mt: -0.5, mb: 2 }}>
        {t("services.usageTitle")}
      </Typography>

      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          {t("services.affectedMaps")}
        </Typography>
        {mapsLoading ? (
          <Box sx={{ display: "flex", gap: 1 }}>
            <Skeleton variant="rounded" width={80} height={24} />
            <Skeleton variant="rounded" width={100} height={24} />
          </Box>
        ) : maps.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {t("services.noAffectedMaps")}
          </Typography>
        ) : (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {maps.map((map) => (
              <Chip key={map.id} label={map.name} size="small" />
            ))}
          </Box>
        )}
      </Box>

      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          {t("services.affectedGroups")}
        </Typography>
        {groupsLoading ? (
          <Box sx={{ display: "flex", gap: 1 }}>
            <Skeleton variant="rounded" width={80} height={24} />
            <Skeleton variant="rounded" width={100} height={24} />
          </Box>
        ) : groups.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {t("services.noAffectedGroups")}
          </Typography>
        ) : (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {groups.map((group) => (
              <Chip key={group.id} label={group.name} size="small" />
            ))}
          </Box>
        )}
      </Box>
    </Paper>
  );
}

export default ServiceUsagePanel;
