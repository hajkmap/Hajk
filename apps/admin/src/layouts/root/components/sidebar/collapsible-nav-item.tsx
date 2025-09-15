import {
  Box,
  Button,
  Collapse,
  List,
  ListItem,
  Typography,
  useTheme,
} from "@mui/material";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useTranslation } from "react-i18next";
import { ReactNode, useState } from "react";
import { useLocation } from "react-router";
import NavItem from "./nav-item";

interface Props {
  titleKey: string;
  icon: ReactNode;
  subItems: { to: string; titleKey: string; icon: ReactNode }[];
  closeSidebarIfNeeded: () => void;
}

const CollapsibleNavItem = (props: Props) => {
  const { t } = useTranslation();
  const { palette } = useTheme();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(false);

  // Check if any sub-item is currently active
  const hasActiveSubItem = props.subItems.some(
    (subItem) => location.pathname === subItem.to
  );

  return (
    <>
      <ListItem disablePadding disableGutters>
        <Button
          onClick={() => setCollapsed(!collapsed)}
          size="large"
          startIcon={props.icon}
          sx={{
            textTransform: "none",
            display: "flex",
            width: "100%",
            borderRadius: 2,
            justifyContent: "space-between",
            color: palette.text.primary,
            paddingTop: 2,
            paddingBottom: 2,
            paddingLeft: 2,
            paddingRight: 1,
            transition: "all 200ms ease",
            backgroundColor: hasActiveSubItem
              ? palette.action.focus
              : "transparent",
            "&:hover": {
              backgroundColor: hasActiveSubItem
                ? palette.action.selected
                : palette.action.hover,
            },
            "& .MuiButton-startIcon": {
              fontSize: "1.25rem",
              marginRight: 2.5,
            },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", flex: 1 }}>
            <Typography>{t(props.titleKey)}</Typography>
          </Box>
          {collapsed ? (
            <ExpandMoreIcon sx={{ fontSize: "1.8rem", opacity: 0.5 }} />
          ) : (
            <ExpandLessIcon sx={{ fontSize: "1.8rem", opacity: 0.5 }} />
          )}
        </Button>
      </ListItem>
      <Collapse in={!collapsed} timeout="auto" unmountOnExit>
        <List component="ul" disablePadding>
          {props.subItems.map((item, index) => {
            return (
              <NavItem
                key={index + item.to}
                to={item.to}
                titleKey={item.titleKey}
                icon={item.icon}
                onClick={() => {
                  props.closeSidebarIfNeeded();
                }}
                isSubItem={true}
              />
            );
          })}
        </List>
      </Collapse>
    </>
  );
};

export default CollapsibleNavItem;
