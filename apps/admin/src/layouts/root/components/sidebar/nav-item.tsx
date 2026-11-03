import { Button, ListItem, styled, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { ReactNode } from "react";
import { NavLink, useLocation } from "react-router";

interface Props {
  to: string;
  titleKey: string;
  icon: ReactNode;
  onClick: () => void;
  isSubItem: boolean;
}

const StyledButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== "isActive" && prop !== "isSubItem",
})<{
  isActive: boolean;
  isSubItem: boolean;
  component?: React.ElementType;
  to?: string;
}>(({ theme, isActive, isSubItem }) => ({
  textTransform: "none",
  // Nested items are indented with a margin (and a matching width reduction)
  // so the selected background is inset, which keeps the hierarchy clear
  // without overflowing the sidebar.
  width: isSubItem ? `calc(100% - ${theme.spacing(2)})` : "100%",
  marginLeft: isSubItem ? theme.spacing(2) : 0,
  marginTop: theme.spacing(0.25),
  marginBottom: theme.spacing(0.25),
  borderRadius: 8,
  justifyContent: "flex-start",
  color: theme.palette.text.primary,
  minHeight: 44,
  paddingTop: 0,
  paddingBottom: 0,
  paddingLeft: theme.spacing(1.5),
  paddingRight: theme.spacing(1.5),
  backgroundColor: isActive ? theme.palette.action.focus : "transparent",
  transition: "all 200ms ease",
  "&:hover": {
    backgroundColor: isActive
      ? theme.palette.action.selected
      : theme.palette.action.hover,
  },
  "& .MuiButton-startIcon": {
    marginLeft: 0,
    marginRight: theme.spacing(1.5),
  },
  "& .MuiButton-startIcon > svg": {
    fontSize: 20,
  },
}));

const NavItem = (props: Props) => {
  const { t } = useTranslation();
  const path = useLocation().pathname;
  const active: boolean = path === props.to || path.startsWith(props.to + "/");

  return (
    <ListItem disablePadding disableGutters>
      <StyledButton
        onClick={props.onClick}
        component={NavLink}
        to={props.to}
        startIcon={props.icon}
        isActive={active}
        isSubItem={props.isSubItem}
      >
        <Typography noWrap sx={{ fontSize: "0.875rem" }}>
          {t(props.titleKey)}
        </Typography>
      </StyledButton>
    </ListItem>
  );
};

export default NavItem;
