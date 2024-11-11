import Grid from "@mui/material/Grid2";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  List,
  ListItem,
  Paper,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

import Page from "../../layouts/root/components/page";
import {
  useCreateLocalUser,
  useDeleteUser,
  useUsers,
} from "../../api/users/hooks";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { useState } from "react";

interface CreateUserInput {
  email: string;
  fullName: string;
  password: string;
  confirmPassword: string;
}

export default function UsersPage() {
  const { t } = useTranslation();
  const { palette } = useTheme();
  const { data: users, isLoading: usersLoading } = useUsers();

  const [userToDelete, setUserToDelete] = useState<{
    id: string;
    fullName: string;
  } | null>(null);

  const createUserMutation = useCreateLocalUser();
  const deleteUserMutation = useDeleteUser();

  const {
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreateUserInput>();

  const onSubmit: SubmitHandler<CreateUserInput> = (data) => {
    createUserMutation.mutate(
      {
        email: data.email,
        fullName: data.fullName,
        password: data.password,
        user: {},
      },
      {
        onError: () =>
          toast.error(t("user.createUserFailed"), {
            position: "bottom-left",
            theme: palette.mode,
            hideProgressBar: true,
          }),
        onSuccess: () => {
          toast.success(t("user.createUserSuccess"), {
            position: "bottom-left",
            theme: palette.mode,
            hideProgressBar: true,
          });
          reset();
        },
      }
    );
  };

  const password = watch("password");

  return (
    <Page title={t("common.users")}>
      <Grid container direction="column" gap={2}>
        {usersLoading ? null : (
          <Paper sx={{ p: 2 }}>
            <Typography variant="h5">{t("common.users")}</Typography>
            <Grid size={12}>
              <List>
                {users?.map((user) => (
                  <ListItem key={user.id} sx={{ p: 0, pt: 1, pb: 1 }}>
                    <Paper sx={{ width: "100%", p: 2 }} elevation={4}>
                      <Grid container justifyContent="space-between">
                        <Grid>
                          <Typography>{user.fullName}</Typography>
                          <Typography variant="caption">
                            {user.email}
                          </Typography>
                        </Grid>
                        <Button
                          color="error"
                          size="small"
                          onClick={() =>
                            setUserToDelete({
                              id: user.id,
                              fullName: user.fullName,
                            })
                          }
                        >
                          <DeleteIcon />
                        </Button>
                      </Grid>
                    </Paper>
                  </ListItem>
                ))}
              </List>
            </Grid>
          </Paper>
        )}

        <Paper sx={{ p: 2 }}>
          <Box
            component="form"
            onSubmit={(e) => {
              e.preventDefault();
              void handleSubmit(onSubmit)(e);
            }}
            sx={{ display: "flex", flexDirection: "column", gap: 1 }}
          >
            <Typography variant="h5">{t("user.createUser")}</Typography>
            <Controller
              name="email"
              control={control}
              defaultValue=""
              rules={{
                required: t("user.emailRequired"),
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: t("user.pleaseEnterValidEmail"),
                },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={t("common.email")}
                  type="email"
                  error={!!errors.email}
                  helperText={errors.email ? errors.email.message : ""}
                  fullWidth
                />
              )}
            />
            <Controller
              name="fullName"
              control={control}
              defaultValue=""
              rules={{ required: t("user.nameRequired") }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={t("common.name")}
                  error={!!errors.fullName}
                  helperText={errors.fullName ? errors.fullName.message : ""}
                  fullWidth
                />
              )}
            />
            <Controller
              name="password"
              control={control}
              defaultValue=""
              rules={{
                required: t("user.passwordRequired"),
                minLength: {
                  value: 6,
                  message: t("user.passwordAtLeast6Chars"),
                },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={t("common.password")}
                  type="password"
                  error={!!errors.password}
                  helperText={errors.password ? errors.password.message : ""}
                  fullWidth
                />
              )}
            />
            <Controller
              name="confirmPassword"
              control={control}
              defaultValue=""
              rules={{
                required: t("user.pleaseConfirmPassword"),
                validate: (value) =>
                  value === password || t("user.passwordMismatch"),
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={t("user.confirmPassword")}
                  type="password"
                  error={!!errors.confirmPassword}
                  helperText={
                    errors.confirmPassword ? errors.confirmPassword.message : ""
                  }
                  fullWidth
                />
              )}
            />

            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={createUserMutation.isPending}
              startIcon={
                createUserMutation.isPending ? (
                  <CircularProgress color="inherit" size={20} />
                ) : null
              }
              sx={{ mt: 1, mb: 1 }}
            >
              {createUserMutation.isPending ? null : t("user.createUser")}
            </Button>
          </Box>
        </Paper>
      </Grid>
      <Dialog
        open={userToDelete !== null}
        onClose={() => setUserToDelete(null)}
        aria-labelledby="delete-user-dialog-title"
        aria-describedby="delete-user-dialog-description"
      >
        <DialogTitle id="delete-user-dialog-title">
          {`${t("common.delete")} ${userToDelete?.fullName ?? ""}s ${t(
            "common.account"
          ).toLowerCase()}?`}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-user-dialog-description">
            {t("user.deleteConfirmation")}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserToDelete(null)} variant="contained">
            {t("common.cancel")}
          </Button>
          <Button
            onClick={() => {
              deleteUserMutation.mutate(userToDelete?.id ?? "");
              setUserToDelete(null);
            }}
            autoFocus
            variant="contained"
            color="error"
          >
            {t("common.delete")}
          </Button>
        </DialogActions>
      </Dialog>
    </Page>
  );
}
