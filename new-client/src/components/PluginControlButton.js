import React from "react";
import { Button, Paper, Tooltip } from "@material-ui/core";
import { makeStyles } from "@material-ui/styles";
import { useTranslation } from "react-i18next";

const useStyles = makeStyles((theme) => ({
  paper: {
    marginBottom: theme.spacing(1),
  },
  button: {
    minWidth: "unset",
  },
}));

export default function PluginControlButton({
  icon,
  onClick,
  title,
  abstract,
}) {
  const classes = useStyles();
  const { t } = useTranslation();

  return (
    <Tooltip title={`${t(title)}: ${t(abstract)}`}>
      <Paper className={classes.paper}>
        <Button
          aria-label={t(title)}
          className={classes.button}
          onClick={onClick}
        >
          {icon}
        </Button>
      </Paper>
    </Tooltip>
  );
}
