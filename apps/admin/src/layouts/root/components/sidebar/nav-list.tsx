import { Box, List, useTheme } from "@mui/material";
import { SIDEBAR_MENU, SIDEBAR_MINI_WIDTH } from "../../constants";
import LockButton from "./lock-button";
import NavItem from "./nav-item";
import CollapsibleNavItem from "./collapsible-nav-item";
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
      <List sx={{ p: 0 }}>
        {SIDEBAR_MENU.map((menuItem, index) => {
          return menuItem.collapsible ? (
            <CollapsibleNavItem
              key={index}
              titleKey={menuItem.titleKey}
              subItems={menuItem.subItems}
              closeSidebarIfNeeded={closeSidebarIfNeeded}
            />
          ) : (
            <NavItem
              key={index + menuItem.to}
              to={menuItem.to}
              titleKey={menuItem.titleKey}
              icon={menuItem.icon}
              onClick={() => {
                closeSidebarIfNeeded();
              }}
              isSubItem={false}
            />
          );
        })}
      </List>

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
