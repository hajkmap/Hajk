//const Select = require('ol/interaction/Select.js');




/**
 * @class
 */
FirSearchResultGroup = {

    componentDidMount: function () {
        var groups = $(ReactDOM.findDOMNode(this)).find('.group');

        document.addEventListener("keyup", this.removeMinusOrPlusIfCtrlLifted.bind(this));

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
            //this.props.model.highlightResultLayer.getSource().clear();
            //console.log("highlightResultLayer", this.props.model.highlightResultLayer);
            //console.log("highlightResultLayer.getSource()", this.props.model.highlightResultLayer.getSource());
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
                console.log("not same clicked");
                this.props.model.focus(item, this.props.isBar == 'yes');
                console.log("after not same clicked");
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
        console.log("+++ plusLayer");
        console.log("+++ this.props.model.get(\"realEstateWMSLayer\").caption",this.props.model.get("realEstateWMSLayerCaption"));
        // e.stopPropagation();
        // e.nativeEvent.stopImmediatePropagation();

        console.log(" this.props.model.get(\"layerCollection\")",  this.props.model.get("layerCollection"));
        var map = this.props.model.get("map");
        this.props.model.get("layerCollection").forEach(layer => {
            console.log("layer.get(\"caption\")",layer.get("caption"));
            console.log("this.props.result.layer",this.props.result.layer);
            if(layer.get("caption") == this.props.model.get("realEstateWMSLayerCaption") && this.props.result.layer == this.props.model.get("realEstateLayerCaption")){
                layer.setVisible(true);
                console.log("layer", layer.layer);
                layer.layer.setVisible(true);
            }
        });

        // select interaction
        /*var multiSelectSingleClick = new Select({
            condition : function(e){ // this will ensure that it is possible to click out drawings even with ctrl pressed
                return true;
            }
        });
*/

        doNotShowInfoClick = true;
        this.props.model.set("plusActive", true);
        this.props.model.set("plusOrMinusAdded", false);
        map.on('singleclick', this.plusLayerActive);


    },

    plusLayerActive: function(event){
        console.log("+++ plusLayerActive")
        var map = this.props.model.get("map");

        //event.stopPropagation();
        try {
            setTimeout(a => {
                if (!map.get('clickLock')) {
                    var ctrlValue = ctrlIsDown;
                    this.clickedOnMap(event, ctrlValue);
                    if(!ctrlValue) {
                        map.un('singleclick', this.plusLayerActive);
                        this.props.model.set("plusActive", false);
                    }
                }
            }, 50);
        } catch (e) {}
    },

    minusLayer: function(layername,e){
        console.log("minusLayer");
        var map = this.props.model.get("map");

        this.props.model.set("plusOrMinusAdded", false);
        doNotShowInfoClick = true;
        this.props.model.set("minusActive", true);
        map.on('singleclick', this.minusLayerActive);

    },

    minusLayerActive: function(event){
        var map = this.props.model.get("map");

        try {
            setTimeout(a => {
                if (!map.get('clickLock')) {
                    var ctrlValue = ctrlIsDown;
                    this.minusObjectFromMap(event, ctrlValue);
                    if(!ctrlValue) {
                        map.un('singleclick', this.minusLayerActive);
                        this.props.model.set("minusActive", false);
                    }
                }
            }, 50);
        } catch (e) {
            console.log("minusLayer:Error", e);
        }

    },

    minusObjectFromMap: function(event, ctrlValue){

        // get the object detail
        var map = this.props.model.get("map");

        // get the object from firFeatureLayer
        var source = this.props.model.firFeatureLayer.getSource();
        var that = this;
        map.forEachFeatureAtPixel(event.pixel, function(feature, layer){
            if (layer.get("caption") === "FIRSökresltat"){
                var nyckelHighLight = feature.get(that.props.model.get("realEstateLayer").fnrField);
                var omrade = feature.get(that.props.model.get("realEstateLayer").omradeField);

                var toDeleteFeatures = source.getFeatures().filter(element => element.get(that.props.model.get("realEstateLayer").fnrField) === feature.get(that.props.model.get("realEstateLayer").fnrField) && element.get(that.props.model.get("realEstateLayer").omradeField) == feature.get(that.props.model.get("realEstateLayer").omradeField));
                if (toDeleteFeatures.length > 0) {
                    toDeleteFeatures.forEach(feature => {
                        source.removeFeature(feature); // clickedOn and the feature in source are not equal?
                    });
                }

                var nrDeleted = toDeleteFeatures.length;

                // var get id
                var hitId = 0;
                for(var i = 0; i < that.props.result.hits.length; i++){
                    if(nyckelHighLight === that.props.result.hits[i].get(that.props.model.get("realEstateLayer").fnrField) && omrade === that.props.result.hits[i].get(that.props.model.get("realEstateLayer").omradeField)){
                        hitId = i;
                        break;
                    }
                }
                console.log("hitId", hitId, "groupId", that.props.id);
                that.reduceOpenIfHigher(hitId, parseInt(that.props.id.substring(6)),nrDeleted);
                that.props.result.hits = that.props.result.hits.filter(element => element.get(that.props.model.get("realEstateLayer").fnrField) !== nyckelHighLight || omrade !== element.get(that.props.model.get("realEstateLayer").omradeField));
                that.props.model.set("plusOrMinusAdded", true);
            } else if (layer.get("caption") === "FIRHighlight"){
                layer.getSource().removeFeature(feature);
            }
        });
        this.forceUpdate(); // it affects searchjs

        // hide the layer
        if(!ctrlValue) {
            this.props.model.get("layerCollection").forEach(layer => {
                if (layer.get("caption") == this.props.model.get("realEstateWMSLayerCaption") && this.props.result.layer === this.props.model.get("realEstateLayerCaption")) {
                    layer.setVisible(false);
                    layer.layer.setVisible(false);
                }
            });
        }
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
        this.props.model.get("items")[group].hits = this.props.model.get("items")[group].hits.filter(element => !(element.get(this.props.model.get("realEstateLayer").fnrField) === clickedOn.get(this.props.model.get("realEstateLayer").fnrField) && element.get(this.props.model.get("realEstateLayer").omradeField) === clickedOn.get(this.props.model.get("realEstateLayer").omradeField)));
        var lenAfter = this.props.model.get("items")[group].hits.length;
        console.log("lenBefore, lenAfter", lenBefore, lenAfter);
        this.props.result.hits = this.props.result.hits.filter(element => !(element.get(this.props.model.get("realEstateLayer").fnrField) === clickedOn.get(this.props.model.get("realEstateLayer").fnrField) && element.get(this.props.model.get("realEstateLayer").omradeField) === clickedOn.get(this.props.model.get("realEstateLayer").omradeField)));

        //rerender the result
        var source = this.props.model.firFeatureLayer.getSource();
        var features = source.getFeatures();
        var toDeleteFeatures = features.filter(element => element.get(this.props.model.get("realEstateLayer").fnrField) === clickedOn.get(this.props.model.get("realEstateLayer").fnrField) && element.get(this.props.model.get("realEstateLayer").omradeField) === clickedOn.get(this.props.model.get("realEstateLayer").omradeField));
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

    removeMinusOrPlusIfCtrlLifted: function(event){
        if (event.keyCode == 17 && this.props.model.get("plusOrMinusAdded")){
            var map = this.props.model.get("map");
            if(this.props.model.get("plusActive")){
                map.un('singleclick', this.plusLayerActive);
                this.props.model.set("plusActive", false);
                this.props.model.get("layerCollection").forEach(layer => {
                    if (layer.get("caption") == this.props.model.get("realEstateWMSLayerCaption") && this.props.result.layer == this.props.model.get("realEstateLayerCaption")) {
                        layer.setVisible(false);
                        layer.layer.setVisible(false);
                    }
                });
                this.props.model.set("plusOrMinusAdded", false);
            } else if(this.props.model.get("minusActive")){
                map.un('singleclick', this.minusLayerActive);
                this.props.model.set("minusActive", false);

                this.props.model.get("layerCollection").forEach(layer => {
                    if (layer.get("caption") == this.props.model.get("realEstateWMSLayerCaption") && this.props.result.layer == this.props.model.get("realEstateLayerCaption")) {
                        layer.setVisible(false);
                        layer.layer.setVisible(false);
                    }
                });
                this.props.model.set("plusOrMinusAdded", false);
            }
        }
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

    clickedOnMap: function(event, ctrlValue) {
        this.props.model.set("plusOrMinusAdded", true);
        // check if tool is active
        // add the clicked element to results
        var map = this.props.model.get("map");
        console.log("+++ clickedonmap in firSearchResultGroup");
        var wmsLayers = this.props.model.get("layerCollection").filter((layer) => {
                return (layer.get('type') === 'wms' || layer.get('type') === 'arcgis') &&
                    layer.get('queryable') &&
                    layer.getVisible() && layer.get('caption') == this.props.model.get("realEstateWMSLayerCaption");
            }),
            projection = this.props.model.get("map").getView().getProjection().getCode(),
            resolution = this.props.model.get("map").getView().getResolution(),
            infos = [],
            promises = [];

        this.props.model.layerOrder = {};
        this.props.model.get("map").getLayers().forEach((layer, i) => {
            this.props.model.layerOrder[layer.get('name')] = i;
        });

        console.log("+++ wmslayers", wmsLayers);
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
                            var names = [];
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
                                        console.log("found 2");
                                        names.push([feature.get(this.props.model.get("realEstateLayer").fnrField), feature.get(this.props.model.get("realEstateLayer").omradeField)]);
                                    }
                                }
                            );
                            var sameNamePromises = this.props.model.findWithSameNames(names, wmsLayer, true);

                            Promise.all(sameNamePromises).then(() => {
                                this.forceUpdate();
                            });
                            resolve();
                        } else {
                            resolve();
                        }
                    }
                });
            }));
        });

        console.log("+++ this.props.model.get(items)", this.props.model.get("items"));
        Promise.all(promises).then(() => {
            this.props.model.set('loadFinished', true);
            //this.forceUpdate();
        });

        // remove event "singleclick" and the layer
        if(!ctrlValue) {
            this.props.model.get("layerCollection").forEach(layer => {
                if (layer.get("caption") == this.props.model.get("realEstateWMSLayerCaption") && this.props.result.layer == this.props.model.get("realEstateLayerCaption")) {
                    layer.setVisible(false);
                    layer.layer.setVisible(false);
                }
            });
        }
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
