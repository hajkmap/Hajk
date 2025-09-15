import { Box, List, useTheme } from "@mui/material";
import {
  SIDEBAR_MENU,
  SIDEBAR_MINI_WIDTH,
  HEADER_HEIGHT,
  SIDEBAR_WIDTH,
} from "../../constants";
import LockButton from "./lock-button";
import NavItem from "./nav-item";
import CollapsibleNavItem from "./collapsible-nav-item";
import SquareIconButton from "./square-icon-button";
import SettingsIcon from "@mui/icons-material/Settings";
import { useNavigate } from "react-router";
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
        height: `calc(100vh - ${HEADER_HEIGHT}px)`,
        backgroundColor:
          theme.palette.mode === "light"
            ? theme.palette.background.default
            : "",
      }}
    >
      <List
        sx={{
          p: 2,
          maxHeight: `calc(100vh - ${HEADER_HEIGHT}px - ${SIDEBAR_MINI_WIDTH}px)`,
          overflowY: "auto",
          "& .MuiListItem-root": {
            mb: 1,
            borderRadius: 2,
          },
        }}
      >
        {SIDEBAR_MENU.map((menuItem, index) => {
          return menuItem.collapsible ? (
            <CollapsibleNavItem
              key={index}
              titleKey={menuItem.titleKey}
              icon={menuItem.icon}
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
          bottom: "0px",
          width: `${SIDEBAR_WIDTH}px`,
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
              void navigate("/settings");
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
