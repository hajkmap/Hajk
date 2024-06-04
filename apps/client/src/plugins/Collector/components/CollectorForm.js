import React, { useState, useEffect } from "react";
import { styled } from "@mui/material/styles";
import Page from "./Page.js";
import Typography from "@mui/material/Typography";

const SaveErrorTextWrapper = styled("div")(({ theme }) => ({
  color: theme.palette.error.contrastText,
  background: theme.palette.error.main,
  marginTop: "15px",
  borderRadius: theme.shape.borderRadius,
  padding: "5px",
}));

const ErrorTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.primary,
}));

const saveErrorText = "Fel - din kommentar gick inte att spara.";

const CollectorForm = (props) => {
  const [comment, setComment] = useState("");
  const [saveError, setSaveError] = useState("");
  const [validationError, setValidationError] = useState("");
  const [form, setForm] = useState(props.form);
  const [displayPlace, setDisplayPlace] = useState(false);
  const [activePage, setActivePage] = useState(0);
  const [direction, setDirection] = useState("right");
  const [configurationError, setConfigurationError] = useState(false);

  useEffect(() => {
    props.model.observer.subscribe("abort", abort);
    props.model.observer.subscribe("reset", resetForm);

    return () => {
      props.model.observer.unsubscribe("abort", abort);
      props.model.observer.unsubscribe("reset", resetForm);
    };
  }, []);

  useEffect(() => {
    if (!props.model.serviceConfig) {
      setConfigurationError(true);
    }
  }, [props.model.serviceConfig]);

  const abort = () => {
    props.onClose();
  };

  const resetForm = () => {
    setActivePage(-1);
    setTimeout(() => {
      setActivePage(0);
    }, 0);
  };

  const renderSaveError = () => {
    return saveError ? (
      <SaveErrorTextWrapper>{saveError}</SaveErrorTextWrapper>
    ) : null;
  };

  if (configurationError) {
    return (
      <ErrorTypography>
        Nödvändig konfiguration saknas. Verktyget kan inte användas för
        tillfället.
      </ErrorTypography>
    );
  }

  return form
    .sort((p1, p2) =>
      p1.order === p2.order ? 0 : p1.order > p2.order ? 1 : -1
    )
    .map(
      (page, i) =>
        activePage === page.order && (
          <Page
            key={i}
            serviceConfig={props.serviceConfig}
            model={props.model}
            active={activePage === page.order}
            numPages={form.length}
            page={page}
            direction={direction}
            options={props.options}
            onNextPage={() => {
              setActivePage(activePage + 1);
              setDirection("left");
            }}
            onPrevPage={() => {
              setActivePage(activePage - 1);
              setDirection("right");
            }}
          />
        )
    );
};

export default CollectorForm;
