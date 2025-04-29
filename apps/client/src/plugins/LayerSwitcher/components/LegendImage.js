import { Collapse } from "@mui/material";
import { styled } from "@mui/material/styles";

const ColumnContainer = styled("div")(() => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "start",
  gap: "0.25em",
}));

const Image = styled("img")(() => ({
  maxWidth: "100%",
}));

export default function LegendImage({ open, src }) {
  if (!src) {
    return null;
  }

  const urlArray = Array.isArray(src) ? src : [src];
  return (
    <Collapse
      sx={{ py: open ? 1 : 0, ml: 4 }}
      in={open}
      timeout={50}
      unmountOnExit
    >
      <ColumnContainer>
        {urlArray.map((url) => (
          <Image key={url} loading="lazy" alt="Teckenförklaring" src={url} />
        ))}
      </ColumnContainer>
    </Collapse>
  );
}
