import { Box, useTheme } from "@mui/material";
import { SIDEBAR_MENU, SIDEBAR_MINI_WIDTH } from "../../constants";
import LockButton from "./lock-button";
import NavItem from "./nav-item";
import SquareIconButton from "./square-icon-button";
import SettingsIcon from "@mui/icons-material/Settings";
import { useNavigate } from "react-router-dom";
import HajkTooltip from "../../../../components/hajk-tooltip";
import { useTranslation } from "react-i18next";

interface Props {
  setSidebarOpen: (open: boolean) => void;
  locked: boolean;
  toggleLocked: () => void;
}
const NavList = (props: Props) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const closeSidebarIfNeeded = () => {
    if (!props.locked) {
      props.setSidebarOpen(false);
    }
  };

  return (
    <Box
      component="nav"
      sx={{
        position: "relative",
        height: "100vh",
        backgroundColor:
          theme.palette.mode === "light"
            ? theme.palette.background.default
            : "",
      }}
    >
      {SIDEBAR_MENU.map((link, index) => {
        return (
          <NavItem
            key={index + link.to}
            to={link.to}
            titleKey={link.titleKey}
            icon={link.icon}
            onClick={() => {
              closeSidebarIfNeeded();
            }}
          />
        );
      })}

      <Box
        sx={{
          position: "absolute",
          left: "0px",
          bottom: `${SIDEBAR_MINI_WIDTH}px`,
          width: "100%",
          display: "flex",
        }}
      >
        <HajkTooltip title={t("common.settings")}>
          <SquareIconButton
            sx={{
              borderTopRightRadius: "50%",
              alignSelf: "flex-start",
            }}
            onClick={() => {
              navigate("/settings");
              closeSidebarIfNeeded();
            }}
          >
            <SettingsIcon fontSize="medium" />
          </SquareIconButton>
        </HajkTooltip>
        <LockButton
          toggleLocked={props.toggleLocked}
          locked={props.locked}
          sx={{
            marginLeft: "auto",
            borderTopLeftRadius: "50%",
          }}
        />
      </Box>
    </Box>
  );
};

export default NavList;
