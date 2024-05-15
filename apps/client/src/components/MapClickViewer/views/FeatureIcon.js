import React from "react";

import { SvgIcon, Icon } from "@mui/material";

import DefaultIcon from "@mui/icons-material/MapTwoTone";
import { hfetch } from "utils/FetchWrapper";

const FeatureIcon = (props) => {
  let { iconNameOrUrl } = props;

  iconNameOrUrl = "" + iconNameOrUrl.trim();

  const swapImgWithSvg = (img) => {
    hfetch(img.src)
      .then((response) => {
        try {
          return response.text();
        } catch (error) {
          console.warn("FeatureIcon swapImgWithSvg", error);
        }
      })
      .then((svg) => {
        try {
          const placeholderSvg = img.parentElement.querySelector("svg");
          placeholderSvg.innerHTML = svg;
        } catch (error) {
          console.warn("FeatureIcon swapImgWithSvg", error);
        } finally {
          img.onLoad = () => {};
        }
      });
  };

  return (
    <>
      {(() => {
        if (iconNameOrUrl.length === 0) {
          // No valid input, return default icon
          return <DefaultIcon />;
        } else if (iconNameOrUrl.indexOf("/") > -1) {
          // We got an incoming url
          // There is no way to handle svg currentColor etc when loading using <img>.
          // And SvgIcon does not support loading svg from url, only inline svg.
          // So here we load svg using img+fetch and force the xml into SvgIcon and decorate it with
          // correct generated classes.
          // This way it will be handled correctly by MUI, get correct size, handle currentColor etc etc.
          return (
            <>
              <img
                src={iconNameOrUrl}
                alt=""
                className=""
                style={{ display: "none" }}
                onLoad={(e) => {
                  swapImgWithSvg(e.target);
                }}
              />
              <SvgIcon></SvgIcon>
            </>
          );
        } else {
          // Ok, just an ordinary material icon name.
          return <Icon>{iconNameOrUrl}</Icon>;
        }
      })()}
    </>
  );
};

export default FeatureIcon;
