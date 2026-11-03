import {
  Box,
  Button,
  Collapse,
  List,
  ListItem,
  Typography,
  styled,
} from "@mui/material";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useTranslation } from "react-i18next";
import { ReactNode } from "react";
import { useLocation } from "react-router";
import NavItem from "./nav-item";

interface Props {
  titleKey: string;
  icon: ReactNode;
  subItems: { to: string; titleKey: string; icon: ReactNode }[];
  closeSidebarIfNeeded: () => void;
  collapsed: boolean;
  onToggle: () => void;
}

const StyledButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== "hasActiveSubItem",
})<{
  hasActiveSubItem: boolean;
}>(({ theme, hasActiveSubItem }) => ({
  textTransform: "none",
  display: "flex",
  width: "100%",
  borderRadius: 8,
  justifyContent: "space-between",
  color: theme.palette.text.primary,
  minHeight: 44,
  paddingTop: 0,
  paddingBottom: 0,
  paddingLeft: theme.spacing(1.5),
  paddingRight: theme.spacing(1),
  marginTop: theme.spacing(0.25),
  marginBottom: theme.spacing(0.25),
  transition: "all 200ms ease",
  backgroundColor: hasActiveSubItem
    ? theme.palette.action.focus
    : "transparent",
  "&:hover": {
    backgroundColor: hasActiveSubItem
      ? theme.palette.action.selected
      : theme.palette.action.hover,
  },
  "& .expand-arrow": {
    opacity: 0,
    transition: "opacity 300ms ease",
  },
  "&:hover .expand-arrow": {
    opacity: 0.7,
  },
  "& .MuiButton-startIcon": {
    marginLeft: 0,
    marginRight: theme.spacing(1.5),
  },
  "& .MuiButton-startIcon > svg": {
    fontSize: 20,
  },
}));

const CollapsibleNavItem = (props: Props) => {
  const { t } = useTranslation();
  const location = useLocation();

  // Check if any sub-item is currently active
  const hasActiveSubItem =
    props.subItems.some((subItem) => location.pathname === subItem.to) ||
    props.subItems.some((subItem) =>
      location.pathname.startsWith(subItem.to + "/")
    );

  return (
    <>
      <ListItem disablePadding disableGutters>
        <StyledButton
          hasActiveSubItem={hasActiveSubItem}
          onClick={props.onToggle}
          startIcon={props.icon}
        >
          <Box
            sx={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0 }}
          >
            <Typography noWrap sx={{ fontSize: "0.9375rem", fontWeight: 500 }}>
              {t(props.titleKey)}
            </Typography>
          </Box>
          {props.collapsed ? (
            <ExpandMoreIcon className="expand-arrow" sx={{ fontSize: 20 }} />
          ) : (
            <ExpandLessIcon className="expand-arrow" sx={{ fontSize: 20 }} />
          )}
        </StyledButton>
      </ListItem>
      <Collapse in={!props.collapsed} timeout="auto" unmountOnExit>
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
