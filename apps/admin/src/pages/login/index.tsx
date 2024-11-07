import { useState } from "react";
import axios from "axios";
import Grid from "@mui/material/Grid2";
import { Box, Button, TextField, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import useAppStateStore from "../../store/use-app-state-store";

export default function LoginPage() {
  const { t } = useTranslation();
  const { apiBaseUrl } = useAppStateStore.getState();
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [loginFailed, setLoginFailed] = useState(false);
  const [loading, setLoading] = useState(false);

  const submitButtonDisabled =
    credentials.email.length < 5 || credentials.password.length < 5 || loading;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" && !submitButtonDisabled) {
      void handleSubmit();
    }
  };

  const handleChange = (key: string, value: string) => {
    setLoginFailed(false);
    setCredentials({
      ...credentials,
      [key]: value,
    });
  };

  const handleSubmit = async (): Promise<void> => {
    setLoading(true);
    try {
      const { email, password } = credentials;
      await axios.post(
        `${apiBaseUrl}/auth/login/local`,
        {
          email,
          password,
        },
        { withCredentials: true }
      );
      window.location.href = "/";
    } catch (error) {
      console.error(error);
      setLoginFailed(true);
    }
    setLoading(false);
  };

  return (
    <Grid
      sx={{
        height: "70vh",
        width: "100%",
        justifyContent: "center",
        alignContent: "center",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          maxWidth: 400,
          margin: "0 auto",
          padding: 3,
          borderRadius: 2,
          boxShadow: 3,
          backgroundColor: "background.paper",
        }}
      >
        <Typography variant="h4" align="center">
          {t("common.welcome")}
        </Typography>
        <Typography align="center" gutterBottom>
          {t("common.loginToContinue")}
        </Typography>
        <TextField
          required
          label={t("common.email")}
          name="email"
          id="input-email-for-credentials-provider"
          type="email"
          variant="outlined"
          value={credentials.email}
          onChange={(e) => handleChange("email", e.target.value)}
          error={loginFailed}
          fullWidth
        />
        <TextField
          required
          label={t("common.password")}
          name="password"
          id="input-password-for-credentials-provider"
          type="password"
          variant="outlined"
          value={credentials.password}
          onChange={(e) => handleChange("password", e.target.value)}
          onKeyDown={handleKeyDown}
          error={loginFailed}
          fullWidth
        />
        {loginFailed && (
          <Typography align="center" color="error">
            {t("common.loginFailed")}
          </Typography>
        )}
        <Button
          id="submitButton"
          variant="contained"
          color="primary"
          size="large"
          onClick={() => void handleSubmit()}
          disabled={submitButtonDisabled}
          fullWidth
          sx={{ mt: 2 }}
        >
          {t("common.login")}
        </Button>
      </Box>
    </Grid>
  );
}
