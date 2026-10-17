import Grid from "@mui/material/Grid";
import { Link, useLocation, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Box, Paper, useTheme } from "@mui/material";
import { HEADER_HEIGHT, HEADER_Z_INDEX } from "../constants";
import {
  useServices,
  useServiceById,
  useServicesHealthCheck,
} from "../../../api/services/hooks";
import { useLayerById } from "../../../api/layers/hooks";
import { useGroupById } from "../../../api/groups/hooks";
import { useMaps } from "../../../api/maps/hooks";
import { useTools } from "../../../api/tools/hooks";

export default function Header() {
  const { t } = useTranslation();
  const { palette } = useTheme();
  const { serviceId, layerId, groupId, mapId, toolId } = useParams();
  const { data: service } = useServiceById(serviceId ?? "");
  const { data: layer } = useLayerById(layerId ?? "");
  const { data: group } = useGroupById(groupId ?? "");
  const { data: services } = useServices();
  const { data: maps } = useMaps();
  const { data: tools } = useTools();
  const location = useLocation();
  const pathParts = location.pathname.split("/").filter(Boolean);

  const mapName = maps?.find((m) => m.id == mapId)?.name;
  const tool = tools?.find((item) => String(item.id) === toolId);
  const toolLabel =
    typeof tool?.title === "string" && tool.title.trim()
      ? tool.title.trim()
      : tool?.type;

  useServicesHealthCheck(services ?? []);

  const breadcrumbLinks =
    pathParts.length > 0
      ? [
          <Box
            sx={{ color: palette.text.secondary, mx: 1 }}
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
              part === mapId ||
              part === toolId
            ) {
              displayName =
                service?.name ??
                layer?.name ??
                group?.name ??
                mapName ??
                toolLabel;
            } else {
              const translationKey = `common.${part.toLowerCase()}`;
              displayName = t(
                translationKey,
                part.charAt(0).toUpperCase() + part.slice(1),
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
      : [
          <Box
            sx={{ color: palette.text.secondary, mx: 1 }}
            component="span"
            key="home"
          >
            <Link
              to="/"
              style={{ color: palette.text.primary, fontWeight: 600 }}
            >
              Start
            </Link>
          </Box>,
        ];

  return (
    <Paper
      component="header"
      elevation={1}
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: HEADER_Z_INDEX,
        backgroundColor: palette.background.paper,
      }}
      square
    >
      <Grid
        container
        size={12}
        direction={"row"}
        sx={{
          width: "100%",
          height: `${HEADER_HEIGHT}px`,
          px: 3,
          alignItems: "center",
        }}
      >
        <Grid
          size={{ xs: 12 }}
          container
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
                "",
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
      </Grid>
    </Paper>
  );
}
