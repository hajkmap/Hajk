import { Button, useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";

interface Props {
  to: string;
  titleKey: string;
  icon: ReactNode;
  onClick: () => void;
}

const NavItem = (props: Props) => {
  const { t } = useTranslation();
  const { palette } = useTheme();
  const path = useLocation().pathname;
  const active: boolean = path === props.to;

  return (
    <Button
      onClick={props.onClick}
      component={NavLink}
      to={props.to}
      size="large"
      startIcon={props.icon}
      sx={{
        width: "100%",
        borderRadius: 0,
        justifyContent: "flex-start",
        color: palette.text.primary,
        paddingTop: 2,
        paddingBottom: 2,
        paddingLeft: 2,
        borderBottom: `1px solid ${palette.divider}`,
        "&:first-of-type": {
          borderTop: `1px solid ${palette.divider}`,
        },
        borderLeft: (active ? "8" : "0") + `px solid ${palette.primary.main}`,
        transition: "border 200ms ease",
      }}
    >
      {t(props.titleKey)}
    </Button>
  );
};

export default NavItem;
