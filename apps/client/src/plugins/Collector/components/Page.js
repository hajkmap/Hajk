import React, { useState, useEffect, useRef } from "react";
import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Parser from "html2json";
import Button from "@mui/material/Button";
import Input from "@mui/material/Input";
import TextField from "@mui/material/TextField";
import Checkbox from "@mui/material/Checkbox";
import NativeSelect from "@mui/material/NativeSelect";
import FormLabel from "@mui/material/FormLabel";
import FormControl from "@mui/material/FormControl";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Slide from "@mui/material/Slide";
import Toolbar from "./Toolbar";
import { withSnackbar } from "notistack";

const PageContent = styled("div")(() => ({
  height: "calc(100% - 60px)",
  overflowX: "hidden",
  borderBottom: "1px solid #ccc",
}));

const PageContentInner = styled("div")(() => ({
  paddingBottom: "10px",
}));

const Page = (props) => {
  const [json, setJson] = useState(
    props.page.text ? Parser.html2json(props.page.text) : null
  );
  const [displayThankYou, setDisplayThankYou] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const toolbarRef = useRef(null);

  const getError = (field) =>
    formErrors.hasOwnProperty(field.name) ? (
      <div>{formErrors[field.name]}</div>
    ) : null;

  const checkInteger = (name, value) => {
    const formValues = { ...props.model.formValues };
    if (/^\d+$/.test(value) || value === "") {
      formValues[name] = value;
    } else {
      if (!props.model.formValues[name]) {
        formValues[name] = "";
      }
    }
    props.model.formValues = formValues;
  };

  const checkNumber = (name, value) => {
    const formValues = { ...props.model.formValues };
    if (/^\d+([.,](\d+)?)?$/.test(value) || value === "") {
      value = value.replace(",", ".");
      formValues[name] = value;
    } else {
      if (!props.model.formValues[name]) {
        formValues[name] = "";
      }
    }
    props.model.formValues = formValues;
  };

  const checkUrl = (name, value) => {
    const regex =
      /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!$&'()*+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!$&'()*+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!$&'()*+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!$&'()*+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!$&'()*+,;=]|:|@)|\/|\?)*)?$/i;
    const valid = regex.test(value);
    const formValues = { ...props.model.formValues };
    if (valid || value === "") {
      formValues[name] = value;
      setFormErrors((prev) => {
        const { [name]: omit, ...rest } = prev;
        return rest;
      });
    } else {
      formValues[name] = "";
      setFormErrors((prev) => ({
        ...prev,
        [name]: "Ange en giltig url. t.ex. https://www.example.com",
      }));
    }
    props.model.formValues = formValues;
  };

  const checkText = (name, value) => {
    const formValues = { ...props.model.formValues };
    formValues[name] = value;
    props.model.formValues = formValues;
  };

  const checkSelect = (name, value) => {
    const formValues = { ...props.model.formValues };
    formValues[name] = value;
    props.model.formValues = formValues;
  };

  const checkMultiple = (name, checked, value, index) => {
    const formValues = { ...props.model.formValues };
    formValues[name][index].checked = checked;
    props.model.formValues = formValues;
  };

  const checkDate = (name, date) => {
    const formValues = { ...props.model.formValues };
    formValues[name] = date;
    props.model.formValues = formValues;
  };

  const getValueMarkup = (field, label) => {
    if (!field) return null;

    if (field.dataType === "int") {
      field.textType = "heltal";
    }

    if (field.dataType === "number") {
      field.textType = "nummer";
    }

    if (field.dataType === "date") {
      field.textType = "datum";
    }

    let value = props.model.formValues[field.name];

    if (value === undefined || value === null) {
      value = "";
    }

    if (value === "" && field.initialRender) {
      if (field.defaultValue !== null) {
        value = field.defaultValue;
      }
    }

    if (Array.isArray(label)) {
      label = label.join(" ");
    }

    switch (field.textType) {
      case "heltal":
        return (
          <TextField
            id={field.id}
            label={label || field.name}
            sx={{ minWidth: "60%" }}
            margin="normal"
            value={value}
            onChange={(e) => {
              checkInteger(field.name, e.target.value);
              field.initialRender = false;
            }}
          />
        );
      case "nummer":
        return (
          <TextField
            id={field.id}
            label={label || field.name}
            sx={{ minWidth: "60%" }}
            margin="normal"
            value={value}
            onChange={(e) => {
              checkNumber(field.name, e.target.value);
              field.initialRender = false;
            }}
          />
        );
      case "datum":
        return (
          <TextField
            id={field.id}
            label={label || field.name}
            sx={{ minWidth: "60%" }}
            margin="normal"
            value={value}
            onChange={(e) => {
              checkDate(field.name, e.target.value);
              field.initialRender = false;
            }}
          />
        );
      case "flerval":
        return (
          <FormGroup>
            {field.items.map((item, index) => (
              <FormControlLabel
                control={
                  <Checkbox
                    key={index}
                    checked={props.model.formValues[field.name][index].checked}
                    onChange={(e) => {
                      checkMultiple(
                        field.name,
                        e.target.checked,
                        item.value,
                        index
                      );
                    }}
                  />
                }
                label={item.text}
              />
            ))}
          </FormGroup>
        );
      case "url":
        return (
          <TextField
            id={field.id}
            label={label || field.name}
            sx={{ minWidth: "60%" }}
            margin="normal"
            value={value}
            onChange={(e) => {
              checkUrl(field.name, e.target.value);
              field.initialRender = false;
            }}
            helperText={getError(field)}
          />
        );
      default:
        return (
          <TextField
            id={field.id}
            label={label || field.name}
            sx={{ minWidth: "60%" }}
            margin="normal"
            value={value}
            onChange={(e) => {
              checkText(field.name, e.target.value);
              field.initialRender = false;
            }}
          />
        );
    }
  };

  const submitPage = () => {
    const fieldErrors = {};
    props.page.elements.forEach((element) => {
      if (element.type === "field") {
        const field = element.field;
        const value = props.model.formValues[field.name];
        if (field.required && !value) {
          fieldErrors[field.name] = field.label
            ? `Fältet ${field.label} måste fyllas i.`
            : "Detta fält måste fyllas i.";
        }
      }
    });
    setFormErrors(fieldErrors);
    if (Object.keys(fieldErrors).length === 0) {
      setDisplayThankYou(true);
    }
  };

  useEffect(() => {
    if (toolbarRef.current) {
      toolbarRef.current.getValueMarkup = getValueMarkup;
    }
  }, []);

  useEffect(() => {
    const eventListener = (e) => {
      if (e.keyCode === 13) {
        submitPage();
      }
    };
    document.addEventListener("keydown", eventListener);
    return () => {
      document.removeEventListener("keydown", eventListener);
    };
  }, []);

  useEffect(() => {
    const json = props.page.text ? Parser.html2json(props.page.text) : null;
    setJson(json);
  }, [props.page.text]);

  const renderElement = (element) => {
    switch (element.type) {
      case "element":
        return (
          <Typography key={element.index} component="div" sx={{ p: 1 }}>
            {element.text}
          </Typography>
        );
      case "field":
        return (
          <Box key={element.index} sx={{ p: 1 }}>
            {getValueMarkup(element.field, element.label)}
          </Box>
        );
      default:
        return null;
    }
  };

  const renderThankYou = () => {
    const message =
      props.page.thankYouMessage || "Tack för att du fyllde i formuläret!";
    return <Typography>{message}</Typography>;
  };

  const nextButton = (props.nextPage || props.page.nextPage) && (
    <Button
      variant="contained"
      sx={{ float: "right" }}
      onClick={() => {
        if (displayThankYou) {
          if (props.nextPage) {
            props.nextPage();
          } else if (props.page.nextPage) {
            props.page.nextPage();
          }
        } else {
          submitPage();
        }
      }}
    >
      Nästa
      <ArrowForwardIcon sx={{ ml: 1 }} />
    </Button>
  );

  const previousButton = props.previousPage && (
    <Button
      variant="contained"
      sx={{ float: "left" }}
      onClick={props.previousPage}
    >
      <ArrowBackIcon sx={{ mr: 1 }} />
      Föregående
    </Button>
  );

  return (
    <div>
      <Toolbar ref={toolbarRef} />
      <PageContent>
        <PageContentInner>
          {json && json.child.map((element, index) => renderElement(element))}
          {displayThankYou && (
            <Slide direction="up" in={displayThankYou}>
              <Box sx={{ p: 1 }}>{renderThankYou()}</Box>
            </Slide>
          )}
        </PageContentInner>
      </PageContent>
      <Box sx={{ p: 1 }}>
        {previousButton}
        {nextButton}
      </Box>
    </div>
  );
};

export default withSnackbar(Page);
