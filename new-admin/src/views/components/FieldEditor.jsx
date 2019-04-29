import React from "react";
import { Component } from "react";
import ReactModal from "react-modal";

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
            <option value="text">Fritext</option>
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
    super();
  }

  state = {
    showModal: false
  };

  removeField = field => e => {
    const { parent } = this.props;
    parent.setState({
      form: parent.state.form.filter(f => f !== field)
    });
  };

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
      <button className="btn btn-danger" onClick={e => this.hideModal()}>
        Avbryt
      </button>
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

  renderFields(form) {
    if (form && Array.isArray(form)) {
      return form.map((field, i) => {
        return (
          <div key={i} className="collector-field">
            <span
              className="collector-field-remove btn btn-danger"
              onClick={this.removeField(field)}
            >
              Ta bort
            </span>
            <div>
              <strong>Typ: </strong>
              {field.type}
            </div>
            <div>
              <strong>Etikett: </strong>
              {field.name}
            </div>
            {Array.isArray(field.values) && field.values.length > 0 ? (
              <div>
                <strong>Värden: </strong>
                <ul className="collector-values">
                  {field.values.map((value, i) => (
                    <li key={i}>{value}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        );
      });
    }
  }

  render() {
    const { form } = this.props;
    this.fieldAdder = <FieldAdder ref="fieldAdder" />;
    return (
      <div>
        {this.renderModal()}
        <h3>Formulär</h3>
        <span className="btn btn-primary" onClick={this.addField}>
          Lägg till fält
        </span>
        {this.renderFields(form)}
      </div>
    );
  }
}

export default FieldEditor;
