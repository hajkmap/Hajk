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

const StyledButton = styled(Button)<{
  isActive: boolean;
  isSubItem: boolean;
  component?: React.ElementType;
  to?: string;
}>(({ theme, isActive, isSubItem }) => ({
  textTransform: "none",
  width: "100%",
  borderRadius: 14,
  justifyContent: "flex-start",
  color: theme.palette.text.primary,
  paddingTop: theme.spacing(1.8),
  paddingBottom: theme.spacing(1.8),
  paddingLeft: theme.spacing(isSubItem ? 2 : 2),
  paddingRight: theme.spacing(2),
  marginLeft: theme.spacing(4),
  marginTop: theme.spacing(0.5),
  marginBottom: theme.spacing(0.5),
  minHeight: 48,
  backgroundColor: isActive ? theme.palette.action.focus : "transparent",
  transition: "all 200ms ease",
  "&:hover": {
    backgroundColor: isActive
      ? theme.palette.action.selected
      : theme.palette.action.hover,
  },
  "& .MuiButton-startIcon": {
    fontSize: "1.25rem",
    marginRight: theme.spacing(2),
  },
}));

const NavItem = (props: Props) => {
  const { t } = useTranslation();
  const path = useLocation().pathname;
  const active: boolean = path === props.to;

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
        <Typography>{t(props.titleKey)}</Typography>
      </StyledButton>
    </ListItem>
  );
};

export default NavItem;
