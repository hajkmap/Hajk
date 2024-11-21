import Grid from "@mui/material/Grid2";
import { List, ListItem, Paper, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import Page from "../../layouts/root/components/page";
import { useRoles } from "../../api/users";

export default function UserRolesPage() {
  const { t } = useTranslation();
  const { data: roles, isLoading: rolesLoading } = useRoles();

  return (
    <Page title={t("common.userRoles")}>
      {rolesLoading ? (
        <div>Roles loading...</div>
      ) : (
        <Grid size={12}>
          <List>
            {roles?.map((role) => (
              <ListItem key={role.id}>
                <Paper sx={{ width: "100%", p: 2 }} elevation={4}>
                  <Typography>{`${role.title}`}</Typography>
                </Paper>
              </ListItem>
            ))}
          </List>
        </Grid>
      )}
    </Page>
  );
}
