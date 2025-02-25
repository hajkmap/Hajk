import { LazyMotion, m, domAnimation } from "framer-motion";
import { Box, useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import "./error.css";
import PageTitle from "../../layouts/root/components/page-title";

export default function InternalServerPage() {
  const { palette } = useTheme();
  const { t } = useTranslation();
  const imgVariants = {
    initial: { opacity: 0, scale: 0.8 },
    animate: {
      opacity: 1,
      scale: 1,
      rotate: [0, 0, 0, 0],
      transition: {
        duration: 1,
        ease: "easeIn",
      },
    },
  };

  const textVariants = {
    initial: { opacity: 0, y: 50 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 1, ease: "easeOut" },
    },
  };
  return (
    <LazyMotion features={domAnimation}>
      <Box component="div">
        <PageTitle title={"500 - Internal Server Error | Hajk"} />

        <m.div
          variants={imgVariants}
          initial="initial"
          animate="animate"
          style={{
            width: "300px",
            height: "150px",
            marginBottom: "20px",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          <Box
            component="img"
            src={`${import.meta.env.BASE_URL.replace(
              /\/$/,
              ""
            )}/forbidden-logo.svg`}
            alt="Forbidden Icon"
            style={{
              width: "100%",
              height: "100%",
              filter: `invert(${palette.mode === "dark" ? 0 : 1})`,
            }}
          />
        </m.div>

        <Box>
          <m.h1
            variants={textVariants}
            initial="initial"
            animate="animate"
            style={{ fontSize: "2rem", margin: "0 0 10px" }}
          >
            <Box>
              <span className="clarity--rack-server-outline-alerted"></span>
            </Box>
            {t("error.serverError")}
          </m.h1>

          <m.p
            variants={textVariants}
            initial="initial"
            animate="animate"
            style={{ color: palette.text.secondary, marginBottom: "20px" }}
          >
            {t("error.serverError.description")}
          </m.p>
        </Box>
      </Box>
    </LazyMotion>
  );
}
