import React from "react";
import { withStyles } from "@material-ui/core/styles";

const styles = theme => ({});

class FeatureInfo extends React.PureComponent {
  state = {
    data: "laddar..."
  };

  componentDidMount() {
    const { source, feature } = this.props;
    var url = this.parse(source, feature.getProperties());
    this.load(url);
  }

  parse(str, properties) {
    if (str && typeof str === "string") {
      (str.match(/{(.*?)}/g) || []).forEach(property => {
        function lookup(o, s) {
          s = s
            .replace("{", "")
            .replace("}", "")
            .split(".");
          switch (s.length) {
            case 1:
              return o[s[0]] || "";
            case 2:
              return o[s[0]][s[1]] || "";
            case 3:
              return o[s[0]][s[1]][s[2]] || "";
            default:
              return "";
          }
        }

        str = str.replace(property, lookup(properties, property));
      });
    }
    return str;
  }

  load(url) {
    fetch(url).then(response => {
      response.json().then(data => {
        this.setState({
          data: JSON.stringify(data)
        });
      });
    });
  }

  render() {
    return <div>{this.state.data}</div>;
  }
}

export default withStyles(styles)(FeatureInfo);
