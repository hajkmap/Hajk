import React from "react";
import { Component } from "react";
import ReactModal from "react-modal";
import Page from "./Page.jsx";
import { Container, Draggable } from "react-smooth-dnd";
import Button from "@material-ui/core/Button";
import { withStyles } from "@material-ui/core/styles";
import { green, red } from "@material-ui/core/colors";
import AddIcon from "@material-ui/icons/Add";
import CancelIcon from "@material-ui/icons/Cancel";

const ColorButtonGreen = withStyles(theme => ({
  root: {
    color: theme.palette.getContrastText(green[700]),
    backgroundColor: green[500],
    "&:hover": {
      backgroundColor: green[700]
    }
  }
}))(Button);

const ColorButtonRed = withStyles(theme => ({
  root: {
    color: theme.palette.getContrastText(red[700]),
    backgroundColor: red[500],
    "&:hover": {
      backgroundColor: red[700]
    }
  }
}))(Button);
class FieldAdder extends Component {
  state = {
    displayOptions: false,
    name: "",
    type: "text",
    value: "",
    values: []
  };

  fieldTypeChanged = e => {
    this.setState({
      displayOptions: e.target.value === "option",
      type: e.target.value
    });
  };

  addValue = e => {
    this.setState({
      values: [...this.state.values, this.refs["value"].value],
      value: ""
    });
  };

  renderValues() {
    return (
      <ul>
        {this.state.values.map((value, i) => (
          <div key={i}>{value}</div>
        ))}
      </ul>
    );
  }

  renderOptionAdder() {
    return (
      <div>
        <div>
          <strong>Värde </strong>
        </div>
        <div>
          <input
            value={this.state.value}
            onChange={e => {
              this.setState({
                value: e.target.value
              });
            }}
            type="text"
            ref="value"
          />
        </div>
        <div>
          <span
            style={{ marginTop: "10px" }}
            className="btn btn-default"
            onClick={this.addValue}
          >
            Lägg till värde
          </span>
        </div>
      </div>
    );
  }

  render() {
    return (
      <div>
        <div>
          <div>
            <strong>Typ</strong>
          </div>
          <select onChange={this.fieldTypeChanged}>
            <option value="text">Textfält</option>
            <option value="textarea">Texruta</option>
            <option value="option">Lista</option>
          </select>
        </div>
        <div>
          <div>
            <strong>Namn</strong>
          </div>
          <input
            type="text"
            value={this.state.name}
            onChange={e => {
              this.setState({
                name: e.target.value
              });
            }}
          />
          {this.state.displayOptions ? this.renderOptionAdder() : null}
          {this.state.displayOptions ? this.renderValues() : null}
        </div>
      </div>
    );
  }
}

class FieldEditor extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      pages: this.props.form
    };
  }

  addField = e => {
    const { parent } = this.props;
    this.setState({
      showModal: true,
      modalContent: this.fieldAdder,
      showAbortButton: true,
      modalConfirmCallback: () => {
        parent.setState({
          form: [...parent.state.form, this.refs["fieldAdder"].state]
        });
      }
    });
  };

  addPage = e => {
    const { onUpdate } = this.props;
    this.setState(
      {
        pages: [{ id: Math.round(Math.random() * 1e12) }, ...this.state.pages]
      },
      () => {
        onUpdate(this.getForm());
      }
    );
  };

  hideModal() {
    this.setState({
      showModal: false,
      modalStyle: {},
      okButtonText: "OK",
      modalConfirmCallback: () => {}
    });
  }

  renderModal() {
    var abortButton = this.state.showAbortButton ? (
      <ColorButtonRed
        variant="contained"
        className="btn"
        onClick={e => this.hideModal()}
        startIcon={<CancelIcon />}
      >
        Avbryt
      </ColorButtonRed>
    ) : (
      ""
    );

    return (
      <ReactModal
        isOpen={this.state.showModal}
        contentLabel="Bekräfta"
        className="Modal"
        overlayClassName="Overlay"
        style={this.state.modalStyle}
        appElement={document.getElementById("root")}
      >
        <div style={{ height: "100%" }}>
          <div
            style={{
              height: "100%",
              paddingBottom: "45px",
              marginBottom: "-35px"
            }}
          >
            {this.state.modalContent}
          </div>
          <button
            className="btn btn-success"
            onClick={e => {
              if (this.state.modalConfirmCallback) {
                this.state.modalConfirmCallback();
              }
              this.hideModal();
            }}
          >
            {this.state.okButtonText || "OK"}
          </button>
          &nbsp;
          {abortButton}
        </div>
      </ReactModal>
    );
  }

  renderPages() {
    const { onUpdate } = this.props;

    return (
      <Container
        nonDragAreaSelector=".nodrag"
        onDrop={r => {
          var pages = [...this.state.pages];
          const { removedIndex, addedIndex } = r;
          var removed = pages.splice(removedIndex, 1);
          pages.splice(addedIndex, 0, removed[0]);
          this.setState({
            pages: pages
          });
          onUpdate(this.getForm());
        }}
      >
        {this.state.pages.map((page, i) => (
          <Draggable key={page.id}>
            <Page
              page={page}
              ref={page.id}
              onUpdate={() => {
                onUpdate(this.getForm());
              }}
              onRemove={id => {
                this.setState(
                  {
                    pages: this.state.pages.filter(p => p.id !== id)
                  },
                  () => {
                    onUpdate(this.getForm());
                  }
                );
              }}
            />
          </Draggable>
        ))}
      </Container>
    );
  }

  getForm() {
    return this.state.pages.map((page, i) => ({
      id: page.id,
      order: i,
      header: this.refs[page.id].state.header,
      text: this.refs[page.id].state.text
    }));
  }

  render() {
    this.fieldAdder = <FieldAdder ref="fieldAdder" />;
    return (
      <div>
        {this.renderModal()}
        <h3>Formulär</h3>
        <ColorButtonGreen
          variant="contained"
          className="btn"
          color="primary"
          onClick={this.addPage}
          startIcon={<AddIcon />}
        >
          Lägg till ny sida
        </ColorButtonGreen>

        <div className="pages">{this.renderPages()}</div>
      </div>
    );
  }
}

export default FieldEditor;
