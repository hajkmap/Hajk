


/**
 * @class
 */
FirSearchResultGroup = {

    componentDidMount: function () {
        var groups = $(ReactDOM.findDOMNode(this)).find('.group');

        groups.click(function (e) {
            if(e.originalEvent.target.className.indexOf("plusMinus") == -1) {
                $(this).next().toggleClass('hidden');
            }
        });

        if (Array.isArray(this.props.model.get('selectedIndices'))) {
            _.each(groups, group => {
                var items = this.props.model.get('selectedIndices').filter(item => group.id === item.group);
                if (items.length > 0) {
                    items.forEach(item => {
                        var nth = item.index + 1,
                            elem = $(group).next().find('div:nth-child(' + nth + ')');

                        elem.addClass('selected');
                    });
                }
            });
        }
    },

    handleClick: function (hit, index, event) {
        console.log("handleClick");

        // Open information box
        var hitId = "hit-" + index + "-" + this.props.id;
        var info = $("#info-" + hitId);
        info.toggle();

        var previousViewed = this.props.model.get("previousViewed");
        var previousInfo = $("#info-" + previousViewed);
        var clickedSame = false;

        // Check if clicked same as before
        if(hitId === this.props.model.get("previousViewed")){
            this.props.model.set("previousViewed", undefined);
            clickedSame = true;
            console.log("hitId", hitId);
            var selected = $("#" + hitId);
            console.log("selected", selected);
            // ta bort blå färg
            console.log("ta bort blå färg");
            this.props.model.highlightResultLayer.getSource().clear();
            console.log("highlightResultLayer", this.props.model.highlightResultLayer);
            console.log("highlightResultLayer.getSource()", this.props.model.highlightResultLayer.getSource());
            console.log("clear the highlight");
        } else {
            if(typeof previousViewed !== "undefined"){
                console.log("hitId and PreviousViewed", hitId,previousViewed);
                previousInfo.toggle();
            }
            this.props.model.set("previousViewed", hitId);
        }

        var element = $(event.target),
            parent = $(ReactDOM.findDOMNode(this)),
            group = parent.find('.group');

        // These should be removed
        ctrlIsDown = false;
        shiftIsDown = false;

        if (!ctrlIsDown) {
            this.props.model.highlightResultLayer.getSource().clear();
        }

        var item = {
            index: index,
            hits: this.props.result.hits,
            hit: hit,
            id: group[0].id
        };

        if (shiftIsDown) {
            let topIndex = 0;
            let items = [];
            let i;

            parent.find('.selected').each(function (e, i) {
                topIndex = $(this).attr('data-index');
            });

            i = topIndex;

            for (; i <= index; i++) {
                items.push({
                    index: i,
                    hits: this.props.result.hits,
                    hit: this.props.result.hits[i],
                    id: group[0].id
                });
            }

            items.forEach(item => {
                this.props.model.append(item);
                console.log("shiftIsDown: go to append function");
                parent.find(`div[data-index=${item.index}]`).addClass('selected');
            });
        } else if (ctrlIsDown) {
            if (element.hasClass('selected')) {
                this.props.model.detach(item);
                element.removeClass('selected');
            } else {
                console.log("ctrlIsDown: go to append function");
                this.props.model.append(item);
                element.addClass('selected');
            }
        } else {
            console.log("else");
            var wasSelected = element.hasClass('selected');
            $('.firSearch-results').find('.selected').each(function (e) {
                $(this).removeClass('selected');
            });

            if(!wasSelected){
                element.addClass('selected');
            }
            if(!clickedSame) {
                this.props.model.focus(item, this.props.isBar == 'yes');
            }
        }

        if (isMobile) {
            if (this.props.parentView) {
                if (this.props.parentView.props.navigationPanel) {
                    this.props.parentView.props.navigationPanel.minimize();
                }
            }
        }
    },


    // plus minus button in firsearchresultgroup
    plusLayer: function (layername,e) {
        console.log("/////plusLayer");
        // e.stopPropagation();
        // e.nativeEvent.stopImmediatePropagation();

        console.log(" this.props.model.get(\"layerCollection\")",  this.props.model.get("layerCollection"));
        var map = this.props.model.get("map");
        this.props.model.get("layerCollection").forEach(layer => {
            console.log("layer.get(\"caption\")",layer.get("caption"));
            console.log("this.props.result.layer",this.props.result.layer);
            if(layer.get("caption") == this.props.model.get("firLayerCaption") && this.props.result.layer == "Fastighet"){
                layer.setVisible(true);
                console.log("layer", layer.layer);
                layer.layer.setVisible(true);
            }
        });

        doNotShowInfoClick = true;
        map.on('singleclick', this.plusLayerActive);

        this.props.model.set("plusActive", true);

    },

    plusLayerActive: function(event){
        var map = this.props.model.get("map");

        //event.stopPropagation();
        try {
            setTimeout(a => {
                if (!map.get('clickLock')) {
                    this.clickedOnMap(event, this);
                    map.un('singleclick', this.plusLayerActive);
                    this.props.model.set("plusActive", false);
                }
            }, 50);
        } catch (e) {}
    },

    minusLayer: function(layername,e){
        console.log("minusLayer");
        var map = this.props.model.get("map");

        map.on('singleclick', this.minusLayerActive);
        doNotShowInfoClick = true;
        this.props.model.set("minusActive", true);

    },

    minusLayerActive: function(event){
        var map = this.props.model.get("map");

        try {
            setTimeout(a => {
                if (!map.get('clickLock')) {
                    this.minusObjectFromMap(event);
                    map.un('singleclick', this.minusLayerActive);
                    this.props.model.set("minusActive", false);
                }
            }, 50);
        } catch (e) {
            console.log("minusLayer:Error", e);
        }

    },

    minusObjectFromMap: function(event){

        // get the object detail
        var map = this.props.model.get("map");

        // get the object from firFeatureLayer
        var source = this.props.model.firFeatureLayer.getSource();
        var that = this;
        map.forEachFeatureAtPixel(event.pixel, function(feature, layer){
            if (layer.get("caption") === "FIRSökresltat"){
                var nyckelHighLight = feature.get("nyckel");

                var toDeleteFeatures = source.getFeatures().filter(element => element.get("nyckel") === feature.get("nyckel"));
                if (toDeleteFeatures.length > 0) {
                    toDeleteFeatures.forEach(feature => {
                        source.removeFeature(feature); // clickedOn and the feature in source are not equal?
                    });
                }

                var nrDeleted = toDeleteFeatures.length;

                // var get id
                var hitId = 0;
                for(var i = 0; i < that.props.result.hits.length; i++){
                    if(nyckelHighLight === that.props.result.hits[i].get("nyckel")){
                        hitId = i;
                        break;
                    }
                }
                console.log("hitId", hitId, "groupId", that.props.id);
                that.reduceOpenIfHigher(hitId, parseInt(that.props.id.substring(6)),nrDeleted);
                that.props.result.hits = that.props.result.hits.filter(element => element.get("nyckel") !== nyckelHighLight);
            } else if (layer.get("caption") === "FIRHighlight"){
                layer.getSource().removeFeature(feature);
            }
        });
        this.forceUpdate(); // it affect searchjs

        // hide the layer
        this.props.model.get("layerCollection").forEach(layer => {
            if(layer.get("caption") == this.props.model.get("firLayerCaption") && this.props.result.layer == "Fastighet" ){
                layer.setVisible(false);
                layer.layer.setVisible(false);
            }
        });

    },

    // need to rewrite the code, nyckel is only applied to fastighets.
    minusObject: function(e, hitId){
        var element = $(e.target),
            parent = $(ReactDOM.findDOMNode(this)),
            group = parent.find('.group');

        //close the infobox
        var previousViewed = this.props.model.get("previousViewed");
        var currentlyViewed = hitId;
        console.log("previousViewed",previousViewed);
        console.log("currentlyViewed",currentlyViewed);
        if(previousViewed === currentlyViewed){
            this.props.model.highlightResultLayer.getSource().clear();
        }

        this.props.model.set("minusObject", true);
        console.log("minusObject", this.props.model.get("minusObject"));


        // delete object from the results group
        var hitStart = 4;
        var hitEnd = hitId.indexOf("-", hitStart);
        var hit = parseInt(hitId.substring(hitStart,hitEnd));//hitId[4]; // hit-10-group-0 // indexOf("-",4)


        var groupStart = hitId.indexOf("-", hitEnd + 1) +1;
        var group = parseInt(hitId.substring(groupStart));//this.props.id; //indexOf


        console.log("items", this.props.model.get("items"));
        console.log("group", this.props.model.get("items")[group].hits);
        var clickedOn = this.props.result.hits[hit];
        console.log("clickedOn",clickedOn);

        var lenBefore = this.props.model.get("items")[group].hits.length;
        this.props.model.get("items")[group].hits = this.props.model.get("items")[group].hits.filter(element => element.get("nyckel") != clickedOn.get("nyckel"));
        var lenAfter = this.props.model.get("items")[group].hits.length;
        console.log("lenBefore, lenAfter", lenBefore, lenAfter);
        this.props.result.hits = this.props.result.hits.filter(element => element.get("nyckel") != clickedOn.get("nyckel"));

        //rerender the result
        var source = this.props.model.firFeatureLayer.getSource();
        var features = source.getFeatures();
        var toDeleteFeatures = features.filter(element => element.get("nyckel") === clickedOn.get("nyckel"));
        console.log("source", source);
        console.log("features", features);
        console.log("toDeleteFeatures",toDeleteFeatures);
        if (toDeleteFeatures.length > 0) {
            toDeleteFeatures.forEach(feature => {
                source.removeFeature(feature); // clickedOn and the feature in source are not equal?!
            });
        }

        this.reduceOpenIfHigher(hit, group, toDeleteFeatures.length);


        this.forceUpdate(); // it affect searchjs


    },

    informationForEachResult: function(hit, hitId) {

        properties = hit.getProperties();
        var information = null;

        if (hit.infobox) {
            information = hit.infobox;
            information = information.replace(/export:/g, '');
        }

        if (information && typeof information === 'string') {
            (information.match(/\{.*?\}\s?/g) || []).forEach(property => {
                function lookup (o, s) {
                    s = s.replace('{', '')
                        .replace('}', '')
                        .trim()
                        .split('.');

                    switch (s.length) {
                        case 1: return o[s[0]] || '';
                        case 2: return o[s[0]][s[1]] || '';
                        case 3: return o[s[0]][s[1]][s[2]] || '';
                    }
                }
                information = information.replace(property, lookup(properties, property));
            });
        }

            return (
                <div id={"info-" + hitId} style={{display: "none"}} dangerouslySetInnerHTML={{__html: information}}></div>
            );
    },

    clickedOnMap: function(event) {
        // check if tool is active
        // add the clicked element to results
        var map = this.props.model.get("map");
        console.log("clickedonmap in firSearchResultGroup");
        var wmsLayers = this.props.model.get("layerCollection").filter((layer) => {
                return (layer.get('type') === 'wms' || layer.get('type') === 'arcgis') &&
                    layer.get('queryable') &&
                    layer.getVisible() && layer.get('caption') == this.props.model.get("firLayerCaption");
            }),
            projection = this.props.model.get("map").getView().getProjection().getCode(),
            resolution = this.props.model.get("map").getView().getResolution(),
            infos = [],
            promises = [];

        this.props.model.layerOrder = {};
        this.props.model.get("map").getLayers().forEach((layer, i) => {
            this.props.model.layerOrder[layer.get('name')] = i;
        });

        console.log("wmslayers", wmsLayers);
        wmsLayers.forEach((wmsLayer, index) => {
            wmsLayer.index = index;
            promises.push(new Promise((resolve, reject) => {
                wmsLayer.getFeatureInformation({
                    coordinate: event.coordinate,
                    resolution: resolution,
                    projection: projection,
                    error: message => {
                        resolve();
                    },
                    success: (features, layer) => {
                        console.log("//success: features", features);
                        // avoid to run same function two times
                        if (Array.isArray(features) && features.length > 0) {
                            var infobox = null;
                            features.forEach(feature => {
                                    var found = false;
                                    var featureId = feature.getProperties().text;
                                    for (var i = 0; i < this.props.result.hits.length; i++) { //group.hits.length
                                        if(this.props.result.hits[i].infobox &&
                                            typeof this.props.result.hits[i].infobox === "string" &&
                                            this.props.result.hits[i].infobox.length > 0){
                                            infobox = this.props.result.hits[i].infobox;
                                        }

                                        var itemId = this.props.result.hits[i].get("text");//group.hits[i].getProperties().text;
                                        if (featureId === itemId) { //if it is first hit then should found=false
                                            console.log("Found");
                                            found = true;
                                            break;
                                        }
                                    }

                                    if (!found) {
                                        console.log("Adding new feature");

                                        // TODO: Send a WFS request, to search for all features with same name. Then add these as done below
                                        var sameNamePromises = this.props.model.findWithSameName(feature.get('text'), wmsLayer);

                                        Promise.all(sameNamePromises).then(() => {
                                           this.forceUpdate();
                                        });


                                        // no other features are added with this name
                                        /*
                                        console.log("feature.get('text')", feature.get("text"));
                                        console.log("layer", layer);
                                        var openLayer = [];

                                        this.props.model.get("map").getLayers().forEach(l => {
                                            if (l.get("caption") === layer.get("caption")){
                                                openLayer.push(l);
                                            }
                                        });
                                        console.log("len", openLayer.length, openLayer);
                                        if(openLayer.length != 1){
                                            console.log("Found more than one layer for the caption", openLayer, layer.get("caption"));
                                        }

                                        // TODO: Get the features from the layer so we can add them to the list and correct result layer
                                        var toAddFeatures = openLayer[0].getSource().getFeatures().filter(f => f.get("text") === feature.get("text"));
                                        console.log("toAdd", toAddFeatures.length, toAddFeatures);
                                        */
                                        // Add to model
                                        /*
                                        this.props.model.get("items").map(group => {
                                            if (group.layer === layer.get("caption")) {
                                                feature.caption = group.layer;
                                                feature.aliasDict = this.props.result.hits[0].aliasDict;
                                                group.hits.push(feature);
                                                console.log("this.props.model.get(items)", this.props.model.get("items"));
                                            }
                                        });

                                        // Add to props
                                        feature.infobox = infobox;
                                        this.props.model.firFeatureLayer.getSource().addFeature(feature);
                                        */
                                    }
                                }
                            );
                            resolve();
                        } else {
                            resolve();
                        }
                    }
                });
            }));
        });

        console.log("/////this.props.model.get(items)", this.props.model.get("items"));
        Promise.all(promises).then(() => {
            this.props.model.set('loadFinished', true);
            //this.forceUpdate();
        });

        // remove event "singleclick" and the layer
        this.props.model.get("layerCollection").forEach(layer => {
            if (layer.get("caption") == this.props.model.get("firLayerCaption") && this.props.result.layer == "Fastighet") {
                layer.setVisible(false);
                layer.layer.setVisible(false);
            }
        });
    },

    doWFSSearch: function(props){
        console.log("---doWFSSearch");
        var filters = '',
            str = '',
            featureFilter = '',
            propertyFilter = '',
            read = (result) => {
                var format,
                    features = [],
                    outputFormat = props.outputFormat;

                if (outputFormat === 'GML2') { format = new ol.format.GML2({}); } else { format = new ol.format.WFS({}); }

                if (!(result instanceof XMLDocument)) {
                    if (result.responseText) {
                        result = result.responseText;
                    }
                }

                try {
                    features = format.readFeatures(result);
                    features = features.reduce((r, f) => {
                        if (this.get('selectionTools')) {
                            let found = this.get('features').find(feature =>
                                f.getId() === feature.getId()
                            );
                            if (!found) {
                                r.push(f);
                            }
                        } else {
                            r.push(f);
                        }
                        return r;
                    }, []);
                } catch (e) {
                    console.error('Parsningsfel. Koordinatsystem kanske saknas i definitionsfilen? Mer information: ', e);
                }
                if (features.length === 0) {
                    features = [];
                }
                props.done(features);
            };

        outputFormat = props.outputFormat;

        if (!outputFormat || outputFormat === '') {
            outputFormat = 'GML3';
        }

        propertyFilter = this.getPropertyFilter(props);
        featureFilter = this.getFeatureFilter(this.get('features'), props);

        if (featureFilter && propertyFilter) {
            filters = `
        <ogc:And>
          ${propertyFilter}
          ${featureFilter}
        </ogc:And>
      `;
        } else if (propertyFilter) {
            filters = propertyFilter;
        } else if (featureFilter) {
            filters = featureFilter;
        } else {
            filters = '';
        }

        var typeName = `'${props.featureType}'`;
        if (!typeName.includes(':')) { // If no namespace, add "feature:"
            typeName = `'feature:${props.featureType}'`;
        }

        str = `
     <wfs:GetFeature
         service = 'WFS'
         version = '1.1.0'
         xmlns:wfs = 'http://www.opengis.net/wfs'
         xmlns:ogc = 'http://www.opengis.net/ogc'
         xmlns:gml = 'http://www.opengis.net/gml'
         xmlns:esri = 'http://www.esri.com'
         xmlns:xsi = 'http://www.w3.org/2001/XMLSchema-instance'
         xsi:schemaLocation='http://www.opengis.net/wfs ../wfs/1.1.0/WFS.xsd'
         outputFormat="${outputFormat}"
         maxFeatures="1000">
         <wfs:Query typeName=` + typeName + ` srsName='${props.srsName}'>
          <ogc:Filter>
            ${filters}
          </ogc:Filter>
         </wfs:Query>
      </wfs:GetFeature>`;

        var contentType = 'text/xml',
            data = str;

        this.requests.push(
            $.ajax({
                url: props.url,
                contentType: contentType,
                crossDomain: true,
                type: 'post',
                data: str,
                success: result => {
                    read(result);
                },
                error: result => {
                    if (result.status === 200) {
                        read(result);
                    } else {
                        props.done([]);
                    }
                }
            })
        );
    },

    getPropertyFilter: function (props) {
        console.log("--getPropertyFilter", props);
        //var multipleAttributes = props.propertyName.split(',').length > 1;
        var conditions = props.propertyName.split(',').reduce((condition, property) => {
            /*  if (props.value == null){
                return condition;
            } */
            props.value.indexOf('\\') >= 0 ? props.value = props.value.replace(/\\/g, '\\\\') : props.value;

            if (props.value) {
                return condition += `
          <ogc:PropertyIsLike matchCase="false" wildCard="*" singleChar="." escapeChar="!">
            <ogc:PropertyName>${property}</ogc:PropertyName>
            <ogc:Literal>${props.value}*</ogc:Literal>
          </ogc:PropertyIsLike>`;
            } else {
                return condition;
            }
        }, '');

        if (multipleAttributes && props.value) {
            return `<ogc:Or>${conditions}</ogc:Or>`;
        } else {
            return conditions;
        }
    },


    getFeatureFilter: function (features, props) {
        console.log("--geFeatureFilter: features", features);
        console.log("--getFeatureFilter: props", props);
        if (Array.isArray(features) && features.length > 0) {
            return features.reduce((str, feature) => {
                var posList = '',
                    operation = 'Intersects',
                    coords = [];

                if (feature.getGeometry() instanceof ol.geom.Circle) {
                    coords = ol.geom.Polygon.fromCircle(feature.getGeometry(), 96).getCoordinates();
                } else {
                    coords = feature.getGeometry().getCoordinates();
                }

                if (this.isCoordinate(coords[0])) {
                    posList = coords.map(c => c[0] + ' ' + c[1]).join(' ');
                }

                if (this.isCoordinate(coords[0][0])) {
                    posList = coords[0].map(c => c[0] + ' ' + c[1]).join(' ');
                }

                if (this.isCoordinate(coords[0][0][0])) {
                    posList = coords[0][0].map(c => c[0] + ' ' + c[1]).join(' ');
                }

                if (feature.operation === 'Within') {
                    operation = feature.operation;
                }

                str += `
            <ogc:${operation}>
              <ogc:PropertyName>${props.geometryField}</ogc:PropertyName>
              <gml:Polygon srsName="${props.srsName}">
              <gml:exterior>
                <gml:LinearRing>
                  <gml:posList>${posList}</gml:posList>
                </gml:LinearRing>
                </gml:exterior>
              </gml:Polygon>
            </ogc:${operation}>
        `;

                if (features.length > 1) {
                    str = `<ogc:Or>${str}</ogc:Or>`;
                }

                return str;
            }, '');
        } else {
            return '';
        }
    },


    expInfo: function(hitId){

        var info = $("#info-" + hitId);
        info.toggle();

    },

    reduceOpenIfHigher: function(hit, group, nr){ // hit = 1, group = 0
        console.log("reduceOpenIfHigher");

        var currentHitId = "#hit-" + hit + "-group-" + group;
        console.log("'" + currentHitId + "'");
        var hitObject = $(currentHitId);

        if(hitObject.hasClass("selected")){
            console.log("clickedonsame");
            hitObject.toggleClass("selected");
            this.props.model.set("previousViewed", undefined);
        } else if (typeof this.props.model.get("previousViewed") !== "undefined"){
            var hitStart = 4;
            var hitEnd = this.props.model.get("previousViewed").indexOf("-", hitStart);
            var prevHit = parseInt(this.props.model.get("previousViewed").substring(hitStart,hitEnd));
            if (prevHit > hit){
                this.props.model.set("previousViewed", "hit-" + (prevHit-nr) + "-group-0");
            }
        }

        var i = hit;
        while(true){
            // first fix open infobox
            var currentHitId = "#info-hit-" + i + "-group-" + group;
            var nextHitId = "#info-hit-" + (i+1) + "-group-" + group;
            var hitObject = $(currentHitId);
            var nextHitObject = $(nextHitId);
            if(typeof nextHitObject[0] === "undefined"){
                console.log("breaking");
                break;
            }

            if(hitObject.is(":visible") != nextHitObject.is(":visible")){
                hitObject.toggle();
            }

            // Fix class selected
            var currentHitId = "#hit-" + i + "-group-" + group;
            var nextHitId = "#hit-" + (i+1) + "-group-" + group;
            var hitObject = $(currentHitId);
            var nextHitObject = $(nextHitId);

            if(hitObject.hasClass("selected") != nextHitObject.hasClass("selected")){
                hitObject.toggleClass("selected");
            }
            i++;
        }
    },

    resultBox: function(id) {

        return (

        this.props.result.hits.map((hit, i) => {


            function getTitle(property) {

                if (Array.isArray(property)) {
                    return property.map(item => hit.getProperties()[item]).join(', ');

                } else {
                    return hit.getProperties()[property] || property;

                }
            }

            var hitId = 'hit-' + i + '-' + id;
                title = getTitle(this.props.result.displayName); // + <div dangerouslySetInnerHTML={this.informationForEachResult(hit)}></div>,
                index = i,
                information = this.informationForEachResult(hit, hitId)
            ;

                return(
                    <div id={hitId} key={hitId} index={i} data-index={i}
                         onClick={this.handleClick.bind(this, hit, i)} style={{paddingBottom:'10px'}}>{title}
                        <button className='btn btn-default pull-right plusMinus faTrash' onClick={e => {e.stopPropagation(); this.minusObject(e, hitId)}}>
                            <i className='fa fa-trash fa-2x'/>
                        </button>
                         <i className="fa fa-info-circle pull-right" onClick={(e) => {e.stopPropagation(); this.expInfo(hitId)}} style={{marginRight:'10px', marginTop:'5px'}}></i>{information}</div>
                );


        })
    );
    },

    render: function () {
        console.log("result render");
        var id = this.props.id,
            groupStyleClass = this.props.numGroups === 1 ? '' : 'hidden',
            resultBox = this.resultBox(id)
        ;


        return (
            <div>
                <div className='group' id={this.props.id} style={{paddingBottom:'15px'}}>{this.props.result.layer}
                    <span className='label'>{this.props.result.hits.length}</span>
                    <button className='btn btn-default pull-right plusMinus' onClick={(e) => this.minusLayer(this.props.result.layer,e)}>
                        <i className='fa fa-minus plusMinusIkon' />
                    </button>
                    <button className='btn btn-default pull-right plusMinus' onClick={(e) => this.plusLayer(this.props.result.layer,e)}>
                        <i className='fa fa-plus plusMinusIkon' />
                    </button>
                </div>
                <div className={groupStyleClass}>
                    {resultBox}
                </div>
            </div>
        );
    }
};

module.exports = React.createClass(FirSearchResultGroup);
