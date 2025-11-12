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

const StyledButton = styled(Button)<{
  hasActiveSubItem: boolean;
}>(({ theme, hasActiveSubItem }) => ({
  textTransform: "none",
  display: "flex",
  width: "100%",
  borderRadius: 14,
  justifyContent: "space-between",
  color: theme.palette.text.primary,
  paddingTop: theme.spacing(2),
  paddingBottom: theme.spacing(2),
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(1),
  marginTop: theme.spacing(0.6),
  marginBottom: theme.spacing(0.6),
  minHeight: 48,
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
    fontSize: "1.25rem",
    marginRight: theme.spacing(2),
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
          size="large"
          startIcon={props.icon}
        >
          <Box sx={{ display: "flex", alignItems: "center", flex: 1 }}>
            <Typography sx={{ fontSize: "1.10rem" }}>
              {t(props.titleKey)}
            </Typography>
          </Box>
          {props.collapsed ? (
            <ExpandMoreIcon
              className="expand-arrow"
              sx={{ fontSize: "1.8rem" }}
            />
          ) : (
            <ExpandLessIcon
              className="expand-arrow"
              sx={{ fontSize: "1.8rem" }}
            />
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
