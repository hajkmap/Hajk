import { useMemo } from "react";
import { Chip, Tooltip, Avatar, AvatarGroup, Box } from "@mui/material";
import { People as PeopleIcon, Wifi, WifiOff } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import useAdminPresenceStore, {
  AdminPresence,
} from "../store/use-admin-presence-store";
import useWebSocketStore from "../store/use-websocket-store";

interface ActiveAdminsBadgeProps {
  resourceType: AdminPresence["resourceType"];
  resourceId: string;
  compact?: boolean;
  showDebug?: boolean; // Debugging mode to show connection status
}
export function ActiveAdminsBadge({
  resourceType,
  resourceId,
  compact = false,
  showDebug = false,
}: ActiveAdminsBadgeProps) {
  const { t } = useTranslation();

  // WebSocket connection status
  const isConnected = useWebSocketStore((state) => state.isConnected);

  // Select raw data from store, then filter in useMemo to avoid selector causing re-renders
  const activeAdmins = useAdminPresenceStore((state) => state.activeAdmins);
  const myPresence = useAdminPresenceStore((state) => state.myPresence);
  const myPresenceId = myPresence?.id;

  const admins = useMemo(() => {
    return activeAdmins.filter(
      (a) =>
        a.resourceType === resourceType &&
        a.resourceId === resourceId &&
        a.id !== myPresenceId
    );
  }, [activeAdmins, myPresenceId, resourceType, resourceId]);

  // Debug mode: show connection status
  if (showDebug) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Tooltip
          title={isConnected ? "WebSocket connected" : "WebSocket disconnected"}
        >
          <Chip
            icon={isConnected ? <Wifi /> : <WifiOff />}
            label={isConnected ? "Connected" : "Disconnected"}
            size="small"
            color={isConnected ? "success" : "error"}
          />
        </Tooltip>
        {myPresence && (
          <Tooltip
            title={`Your presence: ${myPresence.resourceType}:${myPresence.resourceId}`}
          >
            <Chip
              label={`You: ${myPresence.resourceType}:${myPresence.resourceId}`}
              size="small"
              color="info"
            />
          </Tooltip>
        )}
        <Chip
          label={`Others on this resource: ${admins.length}`}
          size="small"
          color={admins.length > 0 ? "warning" : "default"}
        />
        <Chip label={`Total active: ${activeAdmins.length}`} size="small" />
      </Box>
    );
  }

  if (admins.length === 0) {
    return null;
  }

  const adminNames = admins.map((a) => a.userName).join(", ");

  if (compact) {
    return (
      <Tooltip
        title={t("admin.othersEditing", {
          defaultValue: "Also editing: {{names}}",
          names: adminNames,
        })}
      >
        <Chip
          icon={<PeopleIcon fontSize="small" />}
          label={admins.length}
          size="small"
          color="warning"
          sx={{ ml: 1 }}
        />
      </Tooltip>
    );
  }

  return (
    <Tooltip
      title={t("admin.othersEditingWarning", {
        defaultValue:
          "Warning: {{names}} {{isAre}} also editing this. Changes may conflict.",
        names: adminNames,
        isAre: admins.length === 1 ? "is" : "are",
      })}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <AvatarGroup
          max={3}
          sx={{ "& .MuiAvatar-root": { width: 28, height: 28, fontSize: 12 } }}
        >
          {admins.map((admin) => (
            <Avatar key={admin.id} sx={{ bgcolor: "warning.main" }}>
              {admin.userName.charAt(0).toUpperCase()}
            </Avatar>
          ))}
        </AvatarGroup>
        <Chip
          label={t("admin.currentlyEditing", {
            defaultValue: "{{count}} other(s) editing",
            count: admins.length,
          })}
          size="small"
          color="warning"
          variant="outlined"
        />
      </Box>
    </Tooltip>
  );
}

export default ActiveAdminsBadge;
