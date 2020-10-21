var FirSelectionToolbar = require('components/firselectiontoolbar');
var FirSearchResultGroup = require('components/firsearchresultgroup');
var ResidentList = require('components/resident_list');

var KirSearchView = {
    value: undefined,
    timer: undefined,
    loading: 0,

    getInitialState: function () {
      return {
        visible: false,
        instructionPropertyListVisible: false,
        instructionHittaGrannarVisible: false,
        searchPanelVisible: true,
        searchAreaVisible: true,
        minAge: 0,
        maxAge: 120,
        genderK: true,
        genderM: true,
        searchInProgress: false,
        selectedFeatureKey: null,
        searchResults: [],
        expandedResults: [],
        searchResultsVisible: true
      };
    },

    componentDidMount: function () {
      this.value = this.props.model.get('value');
      if (this.props.model.get('kirSearchResults')) {
          this.setState({ searchResults: this.props.model.get('kirSearchResults') });
      }

      this.props.model.on('change:url', () => {
          this.setState({
              downloadUrl: this.props.model.get('url')
          });
      });
      this.props.model.on('change:downloading', () => {
          this.setState({
              downloading: this.props.model.get('downloading')
          });
      });

      this.searchResultsLayer = new ol.layer.Vector({
        source: new ol.source.Vector(),
        style: this.resultsStyle
      });
      this.props.model.get("map").addLayer(this.searchResultsLayer);
      
      this.selectTool = new ol.interaction.Select({
        layers: [this.searchResultsLayer],
        style: this.resultsStyle
      });

      this.selectTool.on("select", function(e) {
        var feature = e.target.getFeatures().getArray()[0];
        
        if (feature) {
          var featureId = feature.get(this.props.model.get("featureIDFieldName"));
          this.setState({ selectedFeatureKey: featureId });
          document.getElementById("feat-" + featureId).scrollIntoView();
        }
      }.bind(this));
      
      this.props.model.get("map").addInteraction(this.selectTool);
    },

    resultsStyle: function(feature, resolution) {
      var selected = feature.get(this.props.model.get("featureIDFieldName")) === this.state.selectedFeatureKey,
        fill = selected ? this.props.model.get("colorHighlight") : this.props.model.get("colorResult"),
        stroke =  selected ? this.props.model.get("colorHighlightStroke") : this.props.model.get("colorResultStroke");

      return new ol.style.Style({
        image: new ol.style.Circle({
          fill: new ol.style.Fill({ color: fill }),
          radius: selected? 10 : 5,
          stroke: new ol.style.Stroke({ color: stroke, width: 2 })
        })
      })
    },

    componentDidUpdate: function(prevProps, prevState, snapshot) {
      this.props.model.get("firSelectionModel").get("drawLayer").setVisible(this.state.searchAreaVisible);
      this.props.model.firBufferFeatureLayer.setVisible(this.state.searchAreaVisible);
      this.props.model.get("firSelectionModel").get("firBufferLayer").setVisible(this.state.searchAreaVisible);
  
      this.searchResultsLayer.getSource().clear();
      this.searchResultsLayer.getSource().addFeatures(this.state.searchResults);
    },

    componentWillUnmount: function () {
        this.props.model.get('layerCollection').each((layer) => {
            layer.off('change:visible', this.search);
        });

        this.props.model.off('change:url');
        this.props.model.off('change:downloading');

        this.selectTool.un("select");
    },

    search: function (event) {
      var wfslayer = this.props.model.get('sources')[0];
      var features = this.props.model.get("firSelectionModel").getFeatures();
      var mapProjection = this.props.model.get("map").getView().getProjection().getCode();

      if (!features || features.length === 0) return;

      var geomFilters = [];
      features.forEach(function(f) {
        geomFilters.push(new ol.format.filter.Intersects(wfslayer.geometryField, f.getGeometry(), mapProjection))
      }.bind(this));
      var geomFilter = geomFilters.length > 1 ? ol.format.filter.or.apply(null, geomFilters) : geomFilters[0];

      var filters = [];
      filters.push(geomFilter, new ol.format.filter.IsBetween(this.props.model.get("residentListDataLayer").alderFieldName, this.state.minAge, this.state.maxAge));

      if (this.state.genderK && !this.state.genderM) {
        filters.push(new ol.format.filter.EqualTo(this.props.model.get("residentListDataLayer").koenFieldName, "K"));
      }

      if (this.state.genderM && !this.state.genderK) {
        filters.push(new ol.format.filter.EqualTo(this.props.model.get("residentListDataLayer").koenFieldName, "M"));
      }


      var filter = ol.format.filter.and(...filters);

      var featureRequest = new ol.format.WFS().writeGetFeature({
        srsName: mapProjection,
        featureTypes: wfslayer.layers,
        outputFormat: wfslayer.outputFormat,
        filter: filter
      });

      this.setState({ searchInProgress: true });
      this.props.model.set("kirExcelReportIsReady", false);
      $.ajax({
        url: wfslayer.url,
        method: 'POST',
        contentType: 'application/xml',
        xhrFields: { withCredentials: true },
        data: new XMLSerializer().serializeToString(featureRequest),
        success: function(response) {
          var features = wfslayer.outputFormat === "GML3" ?
            new ol.format.GML().readFeatures(response) : new ol.format.GeoJSON().readFeatures(response);

          this.props.model.set("kirSearchResults", features)
          this.setState({ searchInProgress: false, searchResults: features });
        }.bind(this),
        error: function(message) {
          this.setState({ searchInProgress: false, errorMessage: "Kunde inte hämta invånarinformation" });

          console.error(message);
        }.bind(this)
      });
    },

    getClassNames: function (type) {
        return this.state.activeTool === type
            ? 'btn btn-primary'
            : 'btn btn-default';
    },

    activateTool: function (name) {
        if (this.props.model.get("firSelectionModel").get('activeTool') === name) {
            this.props.model.get("firSelectionModel").setActiveTool(undefined);
        } else {
            this.props.model.get("firSelectionModel").setActiveTool(name);
        }

        var map = this.props.model.get("firSelectionModel").get("map");
    },

    deleteMarker: function(){
      this.props.model.get("firSelectionModel").setActiveTool(undefined);
    },

    deleteSearchResult(key) {
      var searchResults = this.state.searchResults.filter((o) => {
        return o.get(this.props.model.get("featureIDFieldName")) !== key;
      });

      this.setState({searchResults: searchResults});
    },

    renderImportKml: function () {
      function upload () {
          this.refs.firUploadIframe.addEventListener('load', () => {
              this.props.model.get("firSelectionModel").importDrawLayer(this.refs.firUploadIframe.contentDocument);
              var element = $(kmlImport);
              element.toggle();
              this.setState({ importKMLActive: false });
              this.props.model.get("firSelectionModel")(undefined);
              if(!$('#slackaBufferSokomrade').is(":checked")) {
                  $('#slackaBufferSokomrade').click();
              }
          });
      }

      var url = this.props.model.get('kmlImportUrl');
      var style = {display: 'none'};

      if(this.state.importKMLActive) {
          return (
              <div className='selection-toolbar' id='kmlImport'>
                  <p><b>Importera KML-fil</b></p>
                  <p4>Välj KML-fil att importera</p4>
                  <form id='fir-upload-form' method='post' action={url} target='fir-upload-iframe'
                        encType='multipart/form-data'>
                      <input onChange={upload.bind(this)} type='file' name='files[]' accept='.kml' multiple='false'
                             className='btn btn-default'/><br/>
                      <input type='submit' value='Ladda upp' name='fir-upload-file-form'
                             className='btn btn-default'/><br/>
                      <iframe id='fir-upload-iframe' name='fir-upload-iframe' ref='firUploadIframe' style={style}/>
                  </form>
              </div>
          );
      } else {
          return (
              <p></p>
          );
      }
    },

    clearSearch: function() {
      this.props.model.get("firSelectionModel").get("firBufferLayer").getSource().clear();
      this.props.model.get("firSelectionModel").clearSelection();
      this.setState({ searchResults: []});
      this.props.model.set('kirSearchResults', []);
      this.props.model.set("kirExcelReportIsReady", false);
      this.searchResultsLayer.getSource().clear();
    },

    expandSearchResultItem(key) {
      this.setState({ 
        selectedFeatureKey: this.state.selectedFeatureKey !== key ? key : null
      }); 
      
      this.selectTool.getFeatures().clear()
    },

    render: function () {
        var searchResults = this.state.searchResults.map((item) => {
          var gender = item.get(this.props.model.get("residentListDataLayer").koenFieldName).toLowerCase() === "m" ? "Man" : "Kvinna";
          var key = item.get(this.props.model.get("featureIDFieldName"));
          return <li id={"feat-" + key} key={key}
            onClick={() => this.expandSearchResultItem(key)}>
            {gender}, {item.get(this.props.model.get("residentListDataLayer").alderFieldName)} år
            
            <button className="btn btn-default btn-xs pull-right" onClick={() => this.deleteSearchResult(key)}>
              <i className="fa fa-trash"></i>
            </button>
            
            <i className="fa fa-info-circle pull-right"></i>
            
            <table className={this.state.selectedFeatureKey === key ? "" : "collapse"}>
              <tbody>
                <tr>
                  <td><b>{this.props.model.get("residentListDataLayer").namnDisplayName}:</b></td>
                  <td>{item.get(this.props.model.get("residentListDataLayer").namnFieldName)}</td>
                </tr>
                <tr>
                  <td><b>{this.props.model.get("residentListDataLayer").adressDisplayName}:</b></td>
                  <td>{item.get(this.props.model.get("residentListDataLayer").adressFieldName)}</td>
                </tr>
                <tr>
                  <td><b>{this.props.model.get("residentListDataLayer").fodelsedatumDisplayName}:</b></td>
                  <td>{item.get(this.props.model.get("residentListDataLayer").fodelsedatumFieldName).substring(0, 8)}</td>
                </tr>
              </tbody>
            </table>
          </li>
        });

        return (
          <div className='kir-tools'>
            <div className='panel panel-default'>
              <div className='panel-heading'>Sökning
                <button onClick={() => this.setState({ searchPanelVisible: !this.state.searchPanelVisible })}
                  className={"fa pull-right collapse-panel-button fa-angle-" + (this.state.searchPanelVisible ? "up" : "down")}></button>

                {
                  this.props.model.get("instructionSokning") ?
                  <button onClick={() => this.setState({ instructionVisible: !this.state.instructionVisible })} className='btn-info-fir'>
                    <img src={this.props.model.get("infoKnappLogo")} />
                  </button> : null
                }

                {
                  this.state.instructionVisible ?
                  <div className="panel-body-instruction instructionsText"
                    dangerouslySetInnerHTML={{__html: decodeURIComponent(atob(this.props.model.get("instructionSokning")))}} /> : null
                }
              </div>

              <div className={this.state.searchPanelVisible ? 'panel-body' : 'hidden'}>
                <div className='form-group'>
                  <h4>Sökområde</h4>
                  <div className='btn-group btn-group-lg'>
                      <button onClick={() => this.activateTool('polygonSelection')} type='button' className={this.getClassNames('polygonSelection')} title='Markera efter polygon' >
                          <i className='fa iconmoon-yta icon' />
                      </button>
                      <button onClick={() => this.activateTool('squareSelection')} type='button' className={this.getClassNames('squareSelection')} title='Markera efter square' >
                          <i className='fa fa-square-o icon' />
                      </button>
                      <button onClick={() => this.activateTool('lineSelection')} type='button' className={this.getClassNames('lineSelection')} title='Markera efter Linje' >
                          <i className='fa iconmoon-linje icon' />
                      </button>
                      <button onClick={() => this.activateTool('pointSelection')} type='button' className={this.getClassNames('pointSelection')} title='Markera efter punkt' >
                          <i className='fa fa-circle icon' />
                      </button>
                      <button onClick={() => {this.activateTool('kmlSelection'); this.setState({ importKMLActive: true })}}
                        type='button' className={this.getClassNames('kmlSelection')} title='Importera KML-fil' >
                          <i className='fa fa-file-o fa-0' />
                      </button>
                      <button onClick={() => this.deleteMarker()} type='button' className={this.getClassNames('minusSelection')} title='Ta bort objekt' >
                          <i className='fa fa-trash fa-0' />
                      </button>
                  </div>
                  {this.renderImportKml()}

                  <p>
                    <span>Lägg till buffert  </span>
                    <input id="bufferSearchingInput" type='text' ref='bufferSearchingInput' defaultValue="0" onChange={this.props.model.bufferSearchingInput}/>
                    <span>  meter till sökområde</span>
                  </p>

                  <div className="kir-filters">
                    Kön:
                    <input type="checkbox" id="gender-m" checked={this.state.genderM}
                      onChange={(e) => {if(this.state.genderK){this.setState({ genderM: e.target.checked })}}} />
                    <label htmlFor="gender-m">Man</label>
                    <input type="checkbox" id="gender-k" checked={this.state.genderK}
                      onChange={(e) => {if(this.state.genderM){this.setState({ genderK: e.target.checked })}}} />
                    <label htmlFor="gender-k">Kvinna</label>
                  </div>

                  <div className="kir-filters">
                    Ålder från
                    <input type="text" defaultValue={this.state.minAge} id="minAge-search" onChange={(e) => {this.setState({ minAge: e.target.value }); document.getElementById("min-age").value = e.target.value}} />
                    <span>till</span>
                    <input type="text" defaultValue={this.state.maxAge} onChange={(e) => this.setState({ maxAge: e.target.value })} />
                  </div>

                  <h4>Sökalternativ</h4>
                  <input type="checkbox" id="show-buffer" defaultChecked={this.state.searchAreaVisible}
                    onChange={(e)=> this.setState({ searchAreaVisible: !this.state.searchAreaVisible})} />
                  <label htmlFor="show-buffer">Visa buffer/sökområde</label>
              </div>

              <div className='pull-right'>
                <button onClick={this.search} type='submit' className='btn btn-primary'>
                  { this.state.searchInProgress ? <i className="fa fa-spinner fa-spin loader" /> : null }Sök
                </button>&nbsp;
                <button onClick={this.clearSearch} type='submit' className='btn btn-primary'>Rensa</button>
              </div>
            </div>
          </div>

          {/* Boendeförteckning */
            (this.props.model.get("residentListDataLayer") && this.props.model.get("residentList") != null) &&
            <ResidentList model={this.props.model} residentData={this.state.searchResults}></ResidentList>
          }

          {
            this.state.searchResults.length > 0 &&
            <div className="search-tools">
              <h3>Sökresultat</h3>
              <div className="group" onClick={()=>{this.setState({ searchResultsVisible: !this.state.searchResultsVisible})}}>
                Invånare<span className='label'>{this.state.searchResults.length}</span>
                <button onClick={(e) => { e.stopPropagation(); this.setState({ instructionTextVisible: !this.state.instructionTextVisible })}} className='btn-info-fir'>
                  <img src={this.props.model.get("infoKnappLogo")} />
                </button>

                {
                  this.state.instructionTextVisible &&
                  <div className='panel-body-instruction instructionsText' 
                  dangerouslySetInnerHTML={{__html: decodeURIComponent(atob(this.props.model.get("instructionSearchResult")))}} />
                }
              </div>
              
              <ul className="kir-search-results">
                { this.state.searchResultsVisible && searchResults }
              </ul>
            </div>
          }

        </div>
        );
    }
};

module.exports = React.createClass(KirSearchView);
