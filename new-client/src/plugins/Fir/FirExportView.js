import React from "react";
import PropTypes from "prop-types";
import { styled } from "@mui/material/styles";
import FirExportEdpView from "./FirExportEdpView";
import FirExportPropertyListView from "./FirExportPropertyListView";
import FirExportResidentListView from "./FirExportResidentListView";

const ContainerInfo = styled("div")(({ theme }) => ({
  padding: theme.spacing(2),
}));

const SpanNum = styled("span")(({ theme }) => ({
  fontWeight: 500,
  fontSize: "1rem",
}));
class FirExportView extends React.PureComponent {
  state = {
    results: [],
  };

  static propTypes = {
    model: PropTypes.object.isRequired,
    app: PropTypes.object.isRequired,
    localObserver: PropTypes.object.isRequired,
  };

  static defaultProps = {};

  constructor(props) {
    super(props);
    this.model = this.props.model;
    this.localObserver = this.props.localObserver;
    this.globalObserver = this.props.app.globalObserver;

    this.localObserver.subscribe("fir.results.filtered", (list) => {
      this.setState({ results: [...list] });
      this.forceUpdate();
    });
  }

  render() {
    return (
      <>
        <div>
          <ContainerInfo>
            <SpanNum>{this.state.results.length}</SpanNum> objekt finns
            tillgängliga för export.
          </ContainerInfo>
          {this.model.config.propertyList ? (
            <FirExportPropertyListView
              results={this.state.results}
              model={this.model}
              app={this.props.app}
              localObserver={this.localObserver}
            />
          ) : (
            ""
          )}

          {this.model.config.residentList ? (
            <FirExportResidentListView
              results={this.state.results}
              model={this.model}
              app={this.app}
              localObserver={this.localObserver}
            />
          ) : (
            ""
          )}

          {this.model.config.edp ? (
            <FirExportEdpView
              results={this.state.results}
              model={this.model}
              app={this.app}
              localObserver={this.localObserver}
            />
          ) : (
            ""
          )}
        </div>
      </>
    );
  }
}

export default FirExportView;
