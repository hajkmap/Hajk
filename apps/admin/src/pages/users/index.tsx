import Grid from "@mui/material/Grid2";
import { List, ListItem, Paper, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import Page from "../../layouts/root/components/page";
import { useRoles, useUsers } from "../../api/users/hooks";
import useUserStore from "../../store/use-user-store";

export default function UsersPage() {
  const { t } = useTranslation();
  const { data: users, isLoading: usersLoading } = useUsers();

  const { data: roles, isLoading: rolesLoading } = useRoles();

  const activeUser = useUserStore((state) => state.user);

  return (
    <Page title={t("common.users")}>
      {usersLoading ? (
        <div>Users loading...</div>
      ) : (
        <Grid size={12}>
          <List>
            {users?.map((user) => (
              <ListItem key={user.id}>
                <Paper sx={{ width: "100%", p: 2 }} elevation={4}>
                  <Typography>{`${user.fullName}, ${user.email}${
                    user.email === activeUser?.email ? " (du)" : ""
                  }`}</Typography>
                </Paper>
              </ListItem>
            ))}
          </List>
        </Grid>
      )}

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
