import Grid from "@mui/material/Grid2";
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  Paper,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { Controller, SubmitHandler, useForm } from "react-hook-form";

import { useCreateLocalUser } from "../../../api/users/hooks";

interface CreateUserInput {
  email: string;
  fullName: string;
  password: string;
  confirmPassword: string;
}

export default function CreateUserForm() {
  const { t } = useTranslation();
  const { palette } = useTheme();

  const createUserMutation = useCreateLocalUser();

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
    <Paper sx={{ p: 2, maxWidth: 500 }} elevation={4}>
      <Box
        component="form"
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmit(onSubmit)(e);
        }}
        sx={{ display: "flex", flexDirection: "column", gap: 1 }}
      >
        <Typography variant="h5">{t("user.createLocalUser")}</Typography>
        <Typography>{t("user.createUserDescription")}</Typography>
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
              size="small"
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
              size="small"
            />
          )}
        />
        <Grid container justifyContent="center" sx={{ mt: 1, mb: 1 }}>
          <Divider sx={{ width: "30%" }} />
        </Grid>
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
              size="small"
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
              size="small"
            />
          )}
        />
        <Grid container justifyContent="center">
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
            sx={{ m: 1, maxWidth: 200 }}
          >
            {createUserMutation.isPending ? null : t("user.createLocalUser")}
          </Button>
        </Grid>
      </Box>
    </Paper>
  );
}
