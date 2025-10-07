import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Storage as StorageIcon,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { useDatabaseStatus } from "../../../api/database/hooks";

export default function DatabaseStatusCard() {
  const { t } = useTranslation();

  const { data, isLoading, error } = useDatabaseStatus();

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2}>
            <CircularProgress size={24} />
            <Typography>{t("database.status.loading")}</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">
            <Typography variant="h6" gutterBottom>
              {t("database.status.error")}
            </Typography>
            <Typography variant="body2">
              {error instanceof Error ? error.message : "Unknown error"}
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const tools = data?.tools;
  const exports = data?.exports ?? [];

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <StorageIcon color="primary" />
          <Typography variant="h6">{t("database.status.title")}</Typography>
        </Box>

        <Box mb={3}>
          <Typography variant="subtitle2" gutterBottom>
            {t("database.status.postgresqlTools")}
          </Typography>
          <Box display="flex" gap={1} flexWrap="wrap">
            {tools && (
              <>
                <Chip
                  icon={
                    tools.pg_dump.available ? (
                      <CheckCircleIcon />
                    ) : (
                      <ErrorIcon />
                    )
                  }
                  label={`pg_dump ${tools.pg_dump.available ? "✓" : "✗"}`}
                  color={tools.pg_dump.available ? "success" : "error"}
                  size="small"
                />
                <Chip
                  icon={
                    tools.pg_restore.available ? (
                      <CheckCircleIcon />
                    ) : (
                      <ErrorIcon />
                    )
                  }
                  label={`pg_restore ${tools.pg_restore.available ? "✓" : "✗"}`}
                  color={tools.pg_restore.available ? "success" : "error"}
                  size="small"
                />
                <Chip
                  icon={
                    tools.psql.available ? <CheckCircleIcon /> : <ErrorIcon />
                  }
                  label={`psql ${tools.psql.available ? "✓" : "✗"}`}
                  color={tools.psql.available ? "success" : "error"}
                  size="small"
                />
              </>
            )}
          </Box>
        </Box>

        <Box mb={2}>
          <Typography variant="subtitle2" gutterBottom>
            {t("database.status.availableExports")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {exports.length} {t("database.status.exportFiles")}
          </Typography>
        </Box>

        {tools && !tools.pg_dump.available && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              {t("database.status.postgresqlToolsMissing")}
            </Typography>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
