import React from "react";
import { withStyles } from "@material-ui/core/styles";

const styles = theme => ({
  table: {
    borderCollapse: "collapse",
    borderColor: "black",
    margin: "10px",
    "& th": {
      textAlign: "left"
    },
    "& td": {
      border: "1px solid #999"
    },
    "& thead": {
      borderBottom: "2px solid"
    }
  }
});

class TableView extends React.PureComponent {
  state = {
    data: false
  };

  // TODO: Add propTypes

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
      response.json().then(rsp => {
        const data = rsp.features.map(feature => {
          return {
            date: feature.properties.datetime.split("T")[0],
            value: feature.properties.value
          };
        });
        this.setState({
          data: data
        });
      });
    });
  }

  render() {
    const { classes } = this.props;
    if (this.state.data) {
      return (
        <table className={classes.table}>
          <thead>
            <tr>
              <th>Datum</th>
              <th>Mätvärde</th>
            </tr>
          </thead>
          <tbody>
            {this.state.data.map((dataPair, i) => (
              <tr key={i}>
                <td>{dataPair.date}</td>
                <td>{dataPair.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    } else {
      return <div>Laddar</div>;
    }
  }
}

export default withStyles(styles)(TableView);
