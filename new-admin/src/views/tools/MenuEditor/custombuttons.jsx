import Button from "@material-ui/core/Button";
import { blue, green, red } from "@material-ui/core/colors";
import { withStyles } from "@material-ui/core/styles";

const ColorButtonGreen = withStyles(theme => ({
  root: {
    color: theme.palette.getContrastText(green[500]),
    backgroundColor: green[500],
    "&:hover": {
      backgroundColor: green[700]
    },
    marginRight: theme.spacing(2)
  }
}))(Button);

const ColorButtonRed = withStyles(theme => ({
  root: {
    color: theme.palette.getContrastText(red[500]),
    backgroundColor: red[500],
    "&:hover": {
      backgroundColor: red[700]
    }
  }
}))(Button);

const ColorButtonBlue = withStyles(theme => ({
  root: {
    color: theme.palette.getContrastText(blue[500]),
    backgroundColor: blue[500],
    "&:hover": {
      backgroundColor: blue[700]
    }
  }
}))(Button);

export { ColorButtonBlue, ColorButtonGreen, ColorButtonRed };
