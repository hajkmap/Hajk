
var shiftIsDown = false;
var ctrlIsDown = false;

window.onkeydown = (e) => {
    shiftIsDown = e.shiftKey;
    ctrlIsDown = e.ctrlKey;
};

window.onkeyup = (e) => {
    shiftIsDown = e.shiftKey;
    ctrlIsDown = e.ctrlKey;
};

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
        if(previousViewed !== undefined){
            console.log("hitId and PreviousViewed", hitId,previousViewed);
            previousInfo.toggle();
        }

        this.props.model.set("previousViewed", hitId);


        var element = $(event.target),
            parent = $(ReactDOM.findDOMNode(this)),
            group = parent.find('.group');

        //console.log("element", element);
        //console.log("parent", parent);
        //console.log("group", group);

        if (!ctrlIsDown) {
            this.props.model.highlightResultLayer.getSource().clear();
            console.log("highlight", this.props.model.highlightResultLayer);
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
                console.log("ctrlIsDown: detach item");
                this.props.model.detach(item);
            } else {
                console.log("ctrlIsDown: go to append function");
                this.props.model.append(item);
            }
        } else {
            $('.firSearch-results').find('.selected').each(function (e) {
                $(this).removeClass('selected');
            });
            this.props.model.focus(item, this.props.isBar == 'yes');
        }

        if (!shiftIsDown) {
            // Toggle
            if (element.hasClass('selected')) { element.removeClass('selected'); } else { element.addClass('selected'); }
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

        var map = this.props.model.get("map");
        console.log("this.props.model.get.layerCollection", this.props.model.get("layerCollection"));
        this.props.model.get("layerCollection").forEach(layer => {
            if(layer.get("caption") == this.props.model.get("firLayerCaption") && this.props.result.layer == "Fastighet"){
                layer.setVisible(true);
                console.log("layer", layer.layer);
                layer.layer.setVisible(true);
            }
        });

        doNotShowInfoClick = true;
        map.on('singleclick', this.plusLayerActive);

        this.props.model.set("plusActive", true); // TODO same for minus

       /* map.on('singleclick',(event) => {
            event.stopPropagation();
            try {
                setTimeout(a => {
                    if (!map.get('clickLock') && !event.filty) {
                        this.clickedOnMap(event);
                        //map.un('singleclick', (event));
                    }
                }, 0);
            } catch (e) {}
        });
        */


    },

    plusLayerActive: function(event){
        var map = this.props.model.get("map");

        //event.stopPropagation();
        try {
            setTimeout(a => {
                if (!map.get('clickLock')) {
                    this.clickedOnMap(event);
                    map.un('singleclick', this.plusLayerActive);
                }
            }, 0);
        } catch (e) {}
    },

    minusLayer: function(layername,e){
        console.log("minusLayer");
        var map = this.props.model.get("map");

        map.on('singleclick', this.minusLayerActive);
        doNotShowInfoClick = true;

    },

    minusLayerActive: function(event){
        var map = this.props.model.get("map");

        try {
            setTimeout(a => {
                if (!map.get('clickLock')) {
                    this.minusObjectFromMap(event);
                    map.un('singleclick', this.minusLayerActive);
                }
            }, 0);
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
                source.removeFeature(feature);
                that.props.result.hits = that.props.result.hits.filter(element => element.get("nyckel") !== nyckelHighLight);
            }
        });
        this.forceUpdate(); // it affect searchjs

        // remove event "singleclick" and the layer
        this.props.model.get("layerCollection").forEach(layer => {
            if(layer.get("caption") == this.props.model.get("firLayerCaption") && this.props.result.layer == "Fastighet" ){
                console.log("this.props.result", this.props.result);
                console.log("layer in minusObjectFromMap", layer);
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
            console.log("same object has clicked");
            this.props.model.highlightResultLayer.getSource().clear();
        }
        /*if(previousViewed !== undefined){
            console.log("///////Move popup");
            var previousInfo = $("#info-" + previousViewed);
            previousInfo.toggle();
            this.props.model.highlightResultLayer.getSource().clear();
            this.props.model.set("previousViewed", undefined);
        }*/

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
            source.removeFeature(toDeleteFeatures[0]); // clickedOn and the feature in source are not equal?!
        }
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

    clickedOnMap: function(event){
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
            promises = []
        ;


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
                                    var itemId = this.props.result.hits[i].get("text");//group.hits[i].getProperties().text;
                                    if(featureId === itemId){ //if it is first hit then should found=false
                                        console.log("Found");
                                        found = true;
                                        break;
                                    }
                                }

                                if(!found) {
                                    console.log("Adding new feature");
                                    // Add to model
                                    this.props.model.get("items").map(group => {
                                        if (group.layer === "Fastighet") {
                                            group.hits.push(feature);
                                        }
                                    });


                                    // Add to props
                                    feature.infobox = infobox;
                                    this.props.model.firFeatureLayer.getSource().addFeature(feature);
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


        Promise.all(promises).then(() => {
            this.props.model.set('loadFinished', true);
            this.forceUpdate();
        });

        // remove event "singleclick" and the layer
        this.props.model.get("layerCollection").forEach(layer => {
            if(layer.get("caption") == this.props.model.get("firLayerCaption") && this.props.result.layer == "Fastighet"){
                layer.setVisible(false);
                layer.layer.setVisible(false);
            }
        });



    },

    expInfo: function(hitId){

        var info = $("#info-" + hitId);
        info.toggle();

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
                        <button className='btn btn-default pull-right plusMinus' onClick={e => {e.stopPropagation(); this.minusObject(e, hitId)}}>
                            <i className='fa fa-minus'/>
                        </button>
                         <i className="fa fa-info-circle pull-right" onClick={(e) => {e.stopPropagation(); this.expInfo(hitId)}} style={{marginRight:'10px', marginTop:'5px'}}></i>{information}</div>
                );


        })
    );
    },

    render: function () {
        console.log("render");
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
