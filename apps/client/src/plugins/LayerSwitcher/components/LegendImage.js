import { Collapse } from "@mui/material";

// TODO Handle collapse state inside this component
export default function LegendImage({ open, src }) {
  return src ? (
    <Collapse
      sx={{ pt: open ? 1 : 0, ml: 4 }}
      in={open}
      timeout={50}
      unmountOnExit
    >
      <div>
        <img
          loading="lazy"
          style={{ maxWidth: "250px" }}
          alt="Teckenförklaring"
          src={src}
        />
      </div>
    </Collapse>
  ) : null;
}
