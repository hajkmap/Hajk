var InfoButton = require('components/infobutton');


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

        groups.click(function () {
            $(this).next().toggleClass('hidden');
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
        var element = $(event.target),
            parent = $(ReactDOM.findDOMNode(this)),
            group = parent.find('.group');

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
                parent.find(`div[data-index=${item.index}]`).addClass('selected');
            });
        } else if (ctrlIsDown) {
            if (element.hasClass('selected')) {
                this.props.model.detach(item);
            } else {
                this.props.model.append(item);
            }
        } else {
            $('.search-results').find('.selected').each(function (e) {
                $(this).removeClass('selected');
            });
            this.props.model.focus(item, this.props.isBar == 'yes');
        }

        if (!shiftIsDown) {
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
        var map = this.props.model.get("map");

        map.getLayers().forEach(layer => {
            if(layer.get("caption") == this.props.model.get("firLayerCaption") && this.props.result.layer == "Fastighet"){
                layer.setVisible(true);
            }
        });
    },

    minusLayer: function(layername,e){
        var map = this.props.model.get("map");

        map.getLayers().forEach(layer => {
            if(layer.get("caption") == this.props.model.get("firLayerCaption") && this.props.result.layer == "Fastighet"){
                layer.setVisible(true);
            }
        });
    },

    informationForEachResult: function(hit) {
        console.log("hit");
        console.log(hit);

            return (
                hit.infobox
            );
    },


    resultBox: function(id) {
        console.log("resultBox");

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
                information = this.informationForEachResult(hit)
            ;

                return(
                    <div id={hitId} key={hitId} index={i} data-index={i}
                         onClick={this.handleClick.bind(this, hit, i)}>{title}{information}</div>
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
        console.log("groupStyleClass");
        console.log(groupStyleClass);


        return (
            <div>
                <div className='group' id={this.props.id}>{this.props.result.layer}
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
