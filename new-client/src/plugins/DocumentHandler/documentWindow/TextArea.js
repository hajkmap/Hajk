import React from "react";
import { styled } from "@mui/material/styles";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";

const GridContainer = styled(Grid)(({ theme }) => ({
  marginBottom: theme.spacing(1),
}));

const GridContainerContent = styled(Grid)(({ theme }) => ({
  //Need to manually change color when switching between dark/light-mode
  backgroundColor:
    theme.palette.mode === "dark"
      ? theme.palette.grey[700]
      : theme.palette.grey[200],
}));

const GridTypographyContainer = styled(Grid)(({ theme }) => ({
  padding: theme.spacing(1),
}));

const StyledDivider = styled(Divider)(({ theme }) => ({
  //Need to manually change color when switching between dark/light-mode
  backgroundColor:
    theme.palette.mode === "dark"
      ? theme.palette.grey[200]
      : theme.palette.grey[400],
  height: "2px",
}));

class TextArea extends React.PureComponent {
  render() {
    const { backgroundColor, dividerColor, textAreaContentArray } = this.props;

    return (
      <GridContainer id="text-area-content" justifyContent="center" container>
        <GridContainerContent
          xs={12}
          style={{ backgroundColor: backgroundColor }}
          item
        >
          <StyledDivider sx={{ backgroundColor: dividerColor }} />
          <Grid justifyContent="center" container>
            <GridTypographyContainer component="blockquote" xs={12} item>
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
