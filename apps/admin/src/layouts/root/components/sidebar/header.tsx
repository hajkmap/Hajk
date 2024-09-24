import Grid from "@mui/material/Grid2";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import PermanentButton from "./permanent-button";

interface Props {
  sidebarPermanent: boolean;
  toggleSidebarPermanent: () => void;
}

export default function Header(props: Props) {
  const { t } = useTranslation();

  return (
    <Grid
      container
      size={12}
      alignItems="center"
      sx={{ width: "100%", pl: 1, pr: 3 }}
    >
      <Grid size={9}>
        <Link to="/">
          <img
            style={{ height: "auto", width: "150px" }}
            src="/logo.png"
            alt={t("common.clickableLogo")}
          />
        </Link>
      </Grid>
      <Grid container size={3} justifyContent="flex-end" alignSelf="center">
        <PermanentButton
          drawerPermanent={props.sidebarPermanent}
          toggleDrawerPermanent={props.toggleSidebarPermanent}
        />
      </Grid>
    </Grid>
  );
}
