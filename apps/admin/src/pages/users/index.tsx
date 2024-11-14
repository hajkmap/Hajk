import Grid from "@mui/material/Grid2";
import { useTranslation } from "react-i18next";

import Page from "../../layouts/root/components/page";
import UserTable from "./components/user-table";
import CreateUserForm from "./components/create-user-form";

export default function UsersPage() {
  const { t } = useTranslation();

  return (
    <Page title={t("common.users")}>
      <Grid container direction="column" gap={2}>
        <UserTable />
        <CreateUserForm />
      </Grid>
    </Page>
  );
}
