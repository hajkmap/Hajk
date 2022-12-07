import { styled } from "@mui/material/styles";
import { ToggleButtonGroup, ToggleButton } from "@mui/material";

import { IconPolygon, IconPoint, IconLine, IconCircle } from "./MeasureIcons";
import DeleteIcon from "@mui/icons-material/Delete";

// import useCookieStatus from "hooks/useCookieStatus";

const SvgImg = styled("img")(({ theme }) => ({
  height: "24px",
  width: "24px",
}));

const StyledToggleButton = styled(ToggleButton)(({ theme }) => ({
  img: {
    filter: theme.palette.mode === "dark" ? "invert(1)" : "",
  },
  "&.Mui-selected, &.Mui-selected:hover": {
    "img, svg": {
      marginBottom: "-3px",
    },
    borderBottom: `3px solid ${theme.palette.primary.main}`,
  },
}));

const StyledToggleButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
  border: "2px solid white",
  borderColor: theme.palette.divider,
  overflow: "hidden",
  whiteSpace: "nowrap",
  button: {
    borderTopWidth: 0,
    borderTop: "none",
    borderBottom: "none",
    borderBottomWidth: 0,
  },
  "button:first-of-type": {
    borderLeft: "none",
  },
  "button:last-of-type": {
    borderRight: "none",
  },
}));

function Measure2View(props) {
  const { handleDrawTypeChange, drawType } = props;

  return (
    <>
      <StyledToggleButtonGroup
        exclusive
        value={drawType}
        onChange={handleDrawTypeChange}
        orientation="horizontal"
        variant="contained"
        aria-label="outlined button group"
      >
        <StyledToggleButton value="Point" title="Punkt">
          <SvgImg src={IconPoint()} />
        </StyledToggleButton>
        <StyledToggleButton value="LineString" title="Sträcka">
          <SvgImg src={IconLine()} />
        </StyledToggleButton>
        <StyledToggleButton value="Polygon" title="Areal">
          <SvgImg src={IconPolygon()} />
        </StyledToggleButton>
        <StyledToggleButton value="Circle" title="Cirkel">
          <SvgImg src={IconCircle()} />
        </StyledToggleButton>
        <StyledToggleButton value="Delete" title="Ta bort">
          <DeleteIcon />
        </StyledToggleButton>
      </StyledToggleButtonGroup>
    </>
  );
}

export default Measure2View;
