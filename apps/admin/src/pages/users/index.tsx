import Grid from "@mui/material/Grid2";
import { List, ListItem, Paper, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import Page from "../../layouts/root/components/page";
import { useUsers } from "../../api/users/hooks";
import useUserStore from "../../store/use-user-store";

export default function UsersPage() {
  const { t } = useTranslation();
  const { data: users, isLoading } = useUsers();

  const activeUser = useUserStore((state) => state.user);

  return (
    <Page title={t("common.users")}>
      {isLoading ? (
        <div>Loading...</div>
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
    </Page>
  );
}
