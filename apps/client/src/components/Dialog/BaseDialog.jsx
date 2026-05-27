import React from "react";
import { Dialog, Slide } from "@mui/material";
import { getIsMobile } from "../../utils/IsMobile";

const SlideUpTransition = React.forwardRef(
  function SlideUpTransition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
  }
);

export default function BaseDialog(props) {
  const { slots, ...rest } = props;
  const isMobile = getIsMobile();
  return (
    <Dialog
      {...rest}
      slots={{
        ...slots,
        // On mobile we always force the slide-up transition; otherwise we
        // respect any transition the caller provided (falling back to the
        // MUI default).
        transition: isMobile ? SlideUpTransition : slots?.transition,
      }}
    />
  );
}
