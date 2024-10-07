import Grid from "@mui/material/Grid2";
import { List, ListItem, Paper, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import Page from "../../layouts/root/components/page";

import { useGroups } from "../../api/groups";

export default function GroupsPage() {
  const { t } = useTranslation();
  const { data: groups, isLoading } = useGroups();

  return (
    <Page title={t("common.groups")}>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <Grid size={12}>
          <p>groups.length = {groups && ` (${groups.length})`}</p>

          <List>
            {groups?.map((group) => (
              <ListItem key={group.id}>
                <Paper sx={{ width: "100%", p: 2 }} elevation={4}>
                  <Typography>{group.name}</Typography>
                </Paper>
              </ListItem>
            ))}
          </List>
        </Grid>
      )}
    </Page>
  );
}
