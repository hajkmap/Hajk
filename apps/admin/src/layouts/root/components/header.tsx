import Grid from "@mui/material/Grid2";
import { Link, useLocation, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import {
  Avatar,
  AvatarGroup,
  Box,
  Button,
  Divider,
  Paper,
  Popover,
  Typography,
  useTheme,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import SettingsIcon from "@mui/icons-material/Settings";
import { useEffect, useState } from "react";
import { HEADER_HEIGHT, HEADER_Z_INDEX } from "../constants";
import HajkTooltip from "../../../components/hajk-tooltip";
import useUserStore, { User } from "../../../store/use-user-store";
import useAuth from "../../../hooks/use-auth";
import {
  useServices,
  useServiceById,
  useServicesHealthCheck,
} from "../../../api/services/hooks";
import { useLayerById } from "../../../api/layers/hooks";
import { useGroupById } from "../../../api/groups/hooks";
import { useMaps } from "../../../api/maps/hooks";

const getUserInitials = (user: User): string => {
  const words: string[] = user.fullName.split(" ");
  return (words[0].charAt(0) + words[1]?.charAt(0)).toUpperCase() || "";
};

export default function Header() {
  const { t } = useTranslation();
  const { palette } = useTheme();
  const [userList, setUserList] = useState<User[]>([]);
  const [activeUser, setActiveUser] = useState<User | null>();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { serviceId, layerId, groupId, mapId } = useParams();
  const { data: service } = useServiceById(serviceId ?? "");
  const { data: layer } = useLayerById(layerId ?? "");
  const { data: group } = useGroupById(groupId ?? "");
  const { data: services } = useServices();
  const { data: maps } = useMaps();
  const location = useLocation();
  const pathParts = location.pathname.split("/").filter(Boolean);

  const mapName = maps?.find((m) => m.id == mapId)?.name;

  useServicesHealthCheck(services ?? []);

  const { user } = useUserStore.getState();
  const { logout } = useAuth();

  useEffect(() => {
    setActiveUser(user);

    const dummyUserList = [
      { id: "u11111", fullName: "Henrik Hallberg", email: "hh___@gmail.com" },
      { id: "u22222", fullName: "Jacob Wodzynski", email: "jw___@gmail.com" },
      { id: "u33333", fullName: "Olof Svahn", email: "os___@gmail.com" },
      { id: "u44444", fullName: "Albin Ahmetaj", email: "aa___@gmail.com" },
      { id: "u55555", fullName: "Jesper Adeborn", email: "ja___@gmail.com" },
    ].filter((u) => u.fullName !== user?.fullName);

    setUserList(dummyUserList);
  }, [setActiveUser, setUserList, user]);

  const breadcrumbLinks =
    pathParts.length > 0
      ? [
          <Box
            sx={{ color: palette.text.secondary }}
            mx={1}
            component="span"
            key="home"
          >
            <Link to="/">Start</Link>
            {pathParts.length > 0 && (
              <Box
                component="span"
                sx={{
                  ml: 1,
                  color: palette.text.disabled,
                  fontSize: "1rem",
                }}
              >
                ›
              </Box>
            )}
          </Box>,
          ...pathParts.map((part, index) => {
            const path = `/${pathParts.slice(0, index + 1).join("/")}`;
            const isCurrentPath = path === location.pathname;

            let displayName;

            if (
              part === serviceId ||
              part === layerId ||
              part === groupId ||
              part === mapId
            ) {
              displayName =
                service?.name ?? layer?.name ?? group?.name ?? mapName;
            } else {
              const translationKey = `common.${part.toLowerCase()}`;
              displayName = t(
                translationKey,
                part.charAt(0).toUpperCase() + part.slice(1)
              );
            }
            return (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  mr: 1,
                }}
                component="span"
                key={path}
              >
                <Link
                  style={{
                    color: isCurrentPath
                      ? palette.text.primary
                      : palette.text.secondary,
                    fontWeight: isCurrentPath ? 600 : 400,
                  }}
                  to={path}
                >
                  {displayName}
                </Link>

                {index < pathParts.length - 1 && (
                  <Box
                    component="span"
                    sx={{
                      ml: 1,
                      color: palette.text.disabled,
                      fontSize: "1rem",
                    }}
                  >
                    ›
                  </Box>
                )}
              </Box>
            );
          }),
        ]
      : [];

  return !user ? null : (
    <Paper
      component="header"
      elevation={0}
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: HEADER_Z_INDEX,
        backgroundColor: palette.background.paper,
        backdropFilter: "blur(12px)",
      }}
      square
    >
      <Grid
        container
        size={12}
        alignItems="center"
        direction={"row"}
        sx={{
          width: "100%",
          height: `${HEADER_HEIGHT}px`,
          px: 3,
        }}
      >
        <Grid
          size={{ xs: 8, sm: 8 }}
          container
          alignItems="center"
          sx={{
            display: "flex",
            alignItems: "center",
          }}
        >
          <Link
            to="/"
            style={{
              position: "relative",
              display: "inline-flex",
              marginLeft: "16px",
            }}
          >
            <img
              src={`${import.meta.env.BASE_URL.replace(
                /\/$/,
                ""
              )}/hajk-admin-logo.svg`}
              alt={t("common.clickableLogo")}
              style={{
                height: "32px",
                width: "auto",
                filter: `invert(${palette.mode === "light" ? 0 : 1})`,
                userSelect: "none",
              }}
            />
          </Link>

          <Box
            sx={{
              display: "inline-flex",
              fontSize: "0.875rem",
              fontWeight: 500,
              ml: 4,
              alignItems: "center",
              color: palette.text.secondary,
              "& a": {
                textDecoration: "none",
                color: "inherit",
                transition: "color 0.2s ease",
                padding: "4px 8px",
                borderRadius: 1,
                "&:hover": {
                  color: palette.primary.main,
                  backgroundColor: palette.action.hover,
                },
              },
            }}
          >
            {breadcrumbLinks}
          </Box>
        </Grid>

        <Grid
          container
          size={{ xs: 4, sm: 4 }}
          justifyContent="flex-end"
          alignSelf="center"
          alignItems="center"
          sx={{ gap: 1 }}
        >
          <AvatarGroup
            max={6}
            sx={{
              display: { xs: "none", sm: "flex" },
              "& .MuiAvatarGroup-avatar": {
                border: `2px solid ${palette.background.paper}`,
                fontSize: "0.75rem",
                width: "28px",
                height: "28px",
              },
            }}
          >
            {userList.map((user) => {
              return (
                <HajkTooltip
                  key={user.id}
                  title={user.fullName}
                  placement="bottom-end"
                >
                  <Avatar
                    key={user.id + "avatar"}
                    alt={user.fullName}
                    sx={{
                      width: "28px",
                      height: "28px",
                      fontSize: "0.75rem",
                      backgroundColor: palette.grey[300],
                      color: palette.text.secondary,
                      transition: "all 200ms ease",
                      "&:hover": {
                        backgroundColor: palette.primary.light,
                        color: palette.primary.contrastText,
                        transform: "scale(1.1)",
                        zIndex: 1,
                      },
                    }}
                  >
                    {getUserInitials(user)}
                  </Avatar>
                </HajkTooltip>
              );
            })}
          </AvatarGroup>
          {activeUser && (
            <HajkTooltip
              key={activeUser.id}
              title={activeUser.fullName + ` (${t("common.you")})`}
              placement="bottom-end"
            >
              <Avatar
                onClick={(e) => {
                  setAnchorEl(anchorEl ? null : e.currentTarget);
                }}
                key={activeUser.id}
                sx={{
                  backgroundColor: palette.primary.main,
                  width: "32px",
                  height: "32px",
                  border: `2px solid ${palette.background.paper}`,
                  cursor: "pointer",
                  transition: "all 200ms ease",
                  "&:hover": {
                    transform: "scale(1.05)",
                    boxShadow: `0 4px 12px ${palette.primary.main}40`,
                  },
                }}
              >
                {getUserInitials(activeUser)}
              </Avatar>
            </HajkTooltip>
          )}

          <Popover
            sx={{ marginTop: "10px", minWidth: "0" }}
            anchorEl={anchorEl}
            open={anchorEl != null}
            onClose={() => setAnchorEl(null)}
            disableScrollLock={true}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
          >
            <Grid container sx={{ p: 1 }}>
              <Grid size={12}>
                <Box>
                  <Typography sx={{ fontWeight: "bold" }}>
                    {activeUser?.fullName}
                  </Typography>
                </Box>
                <Box>{activeUser?.email}</Box>
                <Divider sx={{ mb: 1, mt: 1 }} />
              </Grid>
              <Grid container size={12} justifyContent="space-between">
                <Button
                  startIcon={<LogoutIcon />}
                  color="error"
                  onClick={() => void logout()}
                >
                  {t("common.logout")}
                </Button>
                <Button startIcon={<SettingsIcon />}>
                  {t("common.settings")}
                </Button>
              </Grid>
            </Grid>
          </Popover>
        </Grid>
      </Grid>
    </Paper>
  );
}
