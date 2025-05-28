import React from "react";
import { styled } from "@mui/material/styles";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";

const GridContainer = styled(Grid)(({ theme }) => ({
  marginBottom: theme.spacing(1),
}));

const GridContainerContent = styled(Grid)(({ theme }) => ({
  //Need to manually change color when switching between dark/light-mode
  backgroundColor: theme.palette.grey[200],
  ...theme.applyStyles("dark", {
    backgroundColor: theme.palette.grey[700],
  }),
}));

const GridTypographyContainer = styled(Grid)(({ theme }) => ({
  padding: theme.spacing(1),
}));

const StyledDivider = styled(Divider)(({ theme }) => ({
  //Need to manually change color when switching between dark/light-mode
  backgroundColor: theme.palette.grey[400],
  height: "2px",
  ...theme.applyStyles("dark", {
    backgroundColor: theme.palette.grey[200],
  }),
}));

class TextArea extends React.PureComponent {
  render() {
    const { backgroundColor, dividerColor, textAreaContentArray, textColor } =
      this.props;

    return (
      <GridContainer id="text-area-content" justifyContent="center" container>
        <GridContainerContent
          size={12}
          sx={{
            backgroundColor: backgroundColor,
            color: textColor,
          }}
        >
          <StyledDivider sx={{ backgroundColor: dividerColor }} />
          <Grid justifyContent="center" container>
            <GridTypographyContainer component="blockquote" size={12}>
              {textAreaContentArray}
            </GridTypographyContainer>
          </Grid>
          <StyledDivider sx={{ backgroundColor: dividerColor }} />
        </GridContainerContent>
      </GridContainer>
    );
  }
}

export default TextArea;
