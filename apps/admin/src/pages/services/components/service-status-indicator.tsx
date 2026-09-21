import { Grid } from "@mui/material";
import { CircularProgress, IconButton, Tooltip } from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import { SERVICE_STATUS } from "../../../api/services";
import { useTranslation } from "react-i18next";

const tooltipSlotProps = {
  tooltip: {
    sx: {
      "&&": {
        bgcolor: "background.paper",
        color: "text.primary",
        border: "1px solid black",
        borderRadius: 0,
        boxShadow: "none",
        fontSize: "1.1rem",
      },
    },
  },
} as const;

interface Props {
  status: SERVICE_STATUS;
  lastChecked?: string;
  // Optional reason shown in the tooltip above the last-checked time.
  message?: string;
  // When given, the icon becomes a button that runs the check again.
  onClick?: () => void;
}

export default function ServiceStatusIndicator({
  status,
  lastChecked,
  message,
  onClick,
}: Props) {
  const { t } = useTranslation();

  const checkedLabel = lastChecked
    ? `${t("services.status.lastChecked")}: ${new Date(lastChecked).toLocaleTimeString("sv-SE")}`
    : "";
  const clickHint = onClick ? t("services.status.clickToRecheck") : "";
  const tooltip =
    message || checkedLabel || clickHint ? (
      <>
        {message && <div>{message}</div>}
        {checkedLabel && <div>{checkedLabel}</div>}
        {clickHint && <div>{clickHint}</div>}
      </>
    ) : (
      ""
    );

  const icon =
    status === SERVICE_STATUS.UNHEALTHY ? (
      <WarningAmberIcon color="warning" />
    ) : (
      <CheckCircleOutlineIcon color="success" />
    );

  return (
    <Grid
      container
      sx={{
        height: "100%",
        width: "100%",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {status === SERVICE_STATUS.UNKNOWN ? (
        <CircularProgress size={20} />
      ) : (
        <Tooltip
          title={tooltip}
          disableHoverListener={!tooltip}
          slotProps={tooltipSlotProps}
        >
          {onClick ? (
            <IconButton
              size="small"
              onClick={onClick}
              aria-label={t("services.status.recheck")}
            >
              {icon}
            </IconButton>
          ) : (
            icon
          )}
        </Tooltip>
      )}
    </Grid>
  );
}
