import Grid from "@mui/material/Grid2";
import { Box, List, Typography } from "@mui/material";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

const LINKS = [
  {
    to: "/",
    title: "common.home",
  },
  {
    to: "/maps",
    title: "common.maps",
  },
  {
    to: "/layers",
    title: "common.layers",
  },
  {
    to: "/tools",
    title: "common.tools",
  },
];

const CustomLink = ({ active, label }: { active: boolean; label: string }) => {
  const { t } = useTranslation();

  return (
    <Box sx={{ width: "100%" }}>
      <Grid
        container
        size={12}
        sx={{
          p: 1,
          pt: 2,
          pb: 2,
          cursor: "pointer",
          "&:hover": !active
            ? {
                backgroundColor: "divider",
              }
            : undefined,
          borderLeft: (theme) =>
            active
              ? `${theme.spacing(0.8)} solid ${theme.palette.primary.main}`
              : undefined,
        }}
      >
        <Grid container size={11} alignContent="center">
          <Typography sx={{ pl: 1, textDecoration: "none", color: "inherit" }}>
            {t(label)}
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );
};

export default function LinkSection() {
  return (
    <List
      sx={{ width: "100%", bgcolor: "background.paper", p: 0 }}
      aria-labelledby="drawer-link-list"
    >
      {LINKS.map((link, index) => {
        return (
          <NavLink
            to={link.to}
            key={index}
            tabIndex={0}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            {({ isActive }) => (
              <CustomLink active={isActive} label={link.title} />
            )}
          </NavLink>
        );
      })}
    </List>
  );
}
