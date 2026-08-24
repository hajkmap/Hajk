import PropTypes from "prop-types";
import { styled } from "@mui/material/styles";
import propFilters from "../../components/FeatureInfo/FeaturePropsFilters";

const Container = styled("div")(({ theme }) => ({
  "& table": {
    userSelect: "text",
    cursor: "auto",
    borderSpacing: 0,
    width: "100%",
    marginBottom: theme.spacing(2),
    "& tr:nth-of-type(even) td": {
      backgroundColor: "#ececec",
      ...theme.applyStyles("dark", {
        backgroundColor: "#373737",
      }),
    },
    "& tr td:first-of-type": {
      fontWeight: 500,
    },
    "& td": {
      verticalAlign: "top",
      padding: "2px 6px",
      fontSize: "0.875rem",
    },
  },
  "& ul": {
    display: "block",
    listStyle: "none",
    paddingLeft: 0,
    paddingTop: theme.spacing(1),
    "& a": {
      display: "inline-block",
      padding: "2px 0",
    },
  },
}));

function FirSearchResultItemView({ model, rootModel }) {
  const getTemplate = () => {
    return rootModel.config.resultsList.template;
  };

  const getHtml = () => {
    const props = model.getProperties(); // model is a feature in this case...
    const nbsp = "\u00A0";
    let s = getTemplate();
    const regex = /\{[a-zA-Z_0-9|\-()]+\}/gm;
    let m;

    while ((m = regex.exec(s)) !== null) {
      if (m.index === regex.lastIndex) {
        regex.lastIndex++;
      }

      for (let index = 0; index < m.length; index++) {
        const match = m[index];
        let v = propFilters.applyFilters(
          props,
          match.replace("{", "").replace("}", "")
        );
        if (v === "") {
          v = nbsp;
        }
        s = s.replace(match, v);
      }
    }

    return s;
  };

  return (
    <>
      <Container dangerouslySetInnerHTML={{ __html: getHtml() }}></Container>
    </>
  );
}

FirSearchResultItemView.propTypes = {
  model: PropTypes.object.isRequired,
  app: PropTypes.object.isRequired,
  localObserver: PropTypes.object.isRequired,
  classes: PropTypes.object,
};

export default FirSearchResultItemView;
