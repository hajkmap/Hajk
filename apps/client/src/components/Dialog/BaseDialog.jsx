import React from "react";
import { Dialog, Slide } from "@mui/material";
import { getIsMobile } from "../../utils/IsMobile";

const SlideUpTransition = React.forwardRef(
  function SlideUpTransition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
  }
);

export default function BaseDialog(rest) {
  const isMobile = getIsMobile();
  return (
    <Dialog
      TransitionComponent={isMobile ? SlideUpTransition : undefined}
      {...rest}
    />
  );
}
