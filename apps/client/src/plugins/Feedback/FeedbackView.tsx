import { useCallback, useState } from "react";
import type { CSSProperties, FormEvent } from "react";

import {
  Alert,
  Box,
  Button,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

// Registers the <altcha-widget> web component, and its Swedish translation
import "altcha";
import "altcha/i18n/sv";

import { UI_STRINGS } from "./constants";
import type { FeedbackViewProps } from "./types";

type AltchaStateChangeEvent = CustomEvent<{ state: string; payload?: string }>;

function FeedbackView({
  model,
  instructionText,
  thankYouText,
  maxLength,
}: FeedbackViewProps) {
  const theme = useTheme();
  const [message, setMessage] = useState("");
  const [altcha, setAltcha] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Changing the key remounts the widget, which gives us a fresh challenge
  const [widgetKey, setWidgetKey] = useState(0);

  const widgetRef = useCallback((el: HTMLElement | null) => {
    if (!el) return;
    const onStateChange = (e: Event) => {
      const { state, payload } = (e as AltchaStateChangeEvent).detail;
      setAltcha(state === "verified" && payload ? payload : null);
    };
    el.addEventListener("statechange", onStateChange);
    return () => el.removeEventListener("statechange", onStateChange);
  }, []);

  const resetWidget = () => {
    setAltcha(null);
    setWidgetKey((k) => k + 1);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!altcha || message.trim().length === 0) return;

    setSending(true);
    setError(null);
    const result = await model.submit(message, altcha);
    setSending(false);

    // A challenge can only be used once, whatever the outcome
    resetWidget();
    if (result.ok) {
      setMessage("");
      setSent(true);
    } else {
      setError(result.message);
    }
  };

  if (sent) {
    return (
      <Stack spacing={2}>
        <Alert severity="success" sx={{ whiteSpace: "pre-wrap" }}>
          {thankYouText}
        </Alert>
        <Button variant="outlined" onClick={() => setSent(false)}>
          {UI_STRINGS.sendAgain}
        </Button>
      </Stack>
    );
  }

  // Make the widget follow the MUI theme, e.g. in dark mode
  const widgetStyle = {
    "--altcha-color-base": theme.palette.background.paper,
    "--altcha-color-base-content": theme.palette.text.primary,
    "--altcha-color-neutral": theme.palette.divider,
    "--altcha-color-primary": theme.palette.primary.main,
    "--altcha-color-primary-content": theme.palette.primary.contrastText,
  } as CSSProperties;

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Stack spacing={2}>
        {instructionText && (
          <Typography sx={{ whiteSpace: "pre-wrap" }}>
            {instructionText}
          </Typography>
        )}
        <TextField
          label={UI_STRINGS.messageLabel}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          multiline
          minRows={4}
          maxRows={12}
          required
          fullWidth
          disabled={sending}
          helperText={`${message.length}/${maxLength}`}
          slotProps={{
            htmlInput: { maxLength },
            formHelperText: { sx: { textAlign: "right" } },
          }}
        />
        <Typography variant="caption" color="text.secondary">
          {UI_STRINGS.privacyNotice}
        </Typography>
        <altcha-widget
          key={widgetKey}
          ref={widgetRef}
          challenge={model.getChallengeUrl()}
          language="sv"
          style={widgetStyle}
        />
        {error && <Alert severity="error">{error}</Alert>}
        <Button
          type="submit"
          variant="contained"
          disabled={!altcha || message.trim().length === 0 || sending}
        >
          {sending ? UI_STRINGS.sending : UI_STRINGS.send}
        </Button>
      </Stack>
    </Box>
  );
}

export default FeedbackView;
