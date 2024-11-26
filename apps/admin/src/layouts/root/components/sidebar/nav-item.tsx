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
    <ListItem
      disablePadding
      disableGutters
      sx={{
        borderBottom: `1px solid ${palette.divider}`,
        "&:first-of-type": {
          borderTop: `1px solid ${palette.divider}`,
        },
      }}
    >
      <Button
        onClick={props.onClick}
        component={NavLink}
        to={props.to}
        size={props.isSubItem ? undefined : "large"}
        startIcon={props.icon}
        sx={{
          textTransform: "none",
          width: "100%",
          borderRadius: 0,
          justifyContent: "flex-start",
          color: palette.text.primary,
          paddingTop: 2,
          paddingBottom: 2,
          paddingLeft: props.isSubItem ? 3 : 2,
          borderLeft: (active ? "8" : "0") + `px solid ${palette.primary.main}`,
          transition: "border 200ms ease",
        }}
      >
        <Typography>{t(props.titleKey)}</Typography>
      </Button>
    </ListItem>
  );
};

export default NavItem;
