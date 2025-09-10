import { Button, ListItem, Typography, useTheme } from "@mui/material";
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

const NavItem = (props: Props) => {
  const { t } = useTranslation();
  const { palette } = useTheme();
  const path = useLocation().pathname;
  const active: boolean = path === props.to;

  return (
    <ListItem disablePadding disableGutters>
      <Button
        onClick={props.onClick}
        component={NavLink}
        to={props.to}
        size={props.isSubItem ? undefined : "large"}
        startIcon={props.icon}
        sx={{
          textTransform: "none",
          width: "100%",
          borderRadius: 2,
          justifyContent: "flex-start",
          color: palette.text.primary,
          paddingTop: 2,
          paddingBottom: 2,
          paddingLeft: props.isSubItem ? 3 : 2,
          backgroundColor: active ? palette.action.hover : "transparent",
          transition: "all 200ms ease",
          "&:hover": active
            ? {
                backgroundColor: palette.action.selected,
              }
            : {
                backgroundColor: palette.action.hover,
              },
        }}
      >
        <Typography>{t(props.titleKey)}</Typography>
      </Button>
    </ListItem>
  );
};

export default NavItem;
