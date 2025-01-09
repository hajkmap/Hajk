import { LazyMotion, m, domAnimation } from "framer-motion";
import { useNavigate } from "react-router";
import { Box, useTheme } from "@mui/material";
import { useTranslation, Trans } from "react-i18next";
import PageTitle from "../../layouts/root/components/page-title";

export default function NotFound() {
  const navigate = useNavigate();
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
        <PageTitle title={"404 - Not Found | Hajk"} />

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
            src="/not-found-logo.svg"
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
            {t("error.notFound")}
          </m.h1>

          <m.p
            variants={textVariants}
            initial="initial"
            animate="animate"
            style={{ color: palette.text.secondary, marginBottom: "20px" }}
          >
            <Trans i18nKey="error.notFound.description" />
          </m.p>

          <m.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => void navigate("/")}
            style={{
              padding: "10px 20px",
              fontSize: "1rem",
              fontWeight: "bold",
              fontFamily: "monospace",
              marginTop: "20px",
              backgroundColor: palette.text.secondary,
              color: palette.background.default,
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            {t("error.notFound.homeBtn")}
          </m.button>
        </Box>
      </Box>
    </LazyMotion>
  );
}
