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

    render: function () {
        var id = this.props.id,
            groupStyleClass = this.props.numGroups === 1 ? '' : 'hidden'
        ;

        return (
            <div>
                <div className='group' id={this.props.id}>{this.props.result.layer}
                    <span className='label'>{this.props.result.hits.length}</span>

                </div>
                <div className={groupStyleClass}>
                    {
                        this.props.result.hits.map((hit, i) => {
                            function getTitle (property) {
                                if (Array.isArray(property)) {
                                    return property.map(item => hit.getProperties()[item]).join(', ');
                                } else {
                                    return hit.getProperties()[property] || property;
                                }
                            }
                            var hitId = 'hit-' + i + '-' + id,
                                title = getTitle(this.props.result.displayName),
                                index = i
                            ;
                            return (<div id={hitId} key={hitId} index={i} data-index={i} onClick={this.handleClick.bind(this, hit, i)}>{title}</div>);
                        })
                    }
                </div>
            </div>
        );
    }
};

module.exports = React.createClass(FirSearchResultGroup);
