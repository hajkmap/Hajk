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
import NavItem from "./nav-item";

interface Props {
  titleKey: string;
  subItems: { to: string; titleKey: string; icon: ReactNode }[];
  closeSidebarIfNeeded: () => void;
}

const CollapsibleNavItem = (props: Props) => {
  const { t } = useTranslation();
  const { palette } = useTheme();

  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      <ListItem
        disablePadding
        disableGutters
        sx={{
          borderBottom: collapsed ? `1px solid ${palette.divider}` : undefined,
          "&:first-of-type": {
            borderTop: `1px solid ${palette.divider}`,
          },
        }}
      >
        <Button
          onClick={() => setCollapsed(!collapsed)}
          size="large"
          sx={{
            textTransform: "none",
            display: "flex",
            width: "100%",
            borderRadius: 0,
            justifyContent: "space-between",
            color: palette.text.primary,
            paddingTop: 2,
            paddingBottom: 2,
            paddingLeft: 2,
            transition: "border 200ms ease",
            background: palette.action.hover,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography>{t(props.titleKey)}</Typography>
          </Box>
          {collapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
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
