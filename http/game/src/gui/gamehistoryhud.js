/* Class GameHistoryHUD
    Graphical representation of all current explored gamestates as a tree.
*/
gui.GameHistoryHUD = function (gameHistoryManager) {
    var self = this;
    this._gameHistoryManager = gameHistoryManager;
    this._isLocked = false;
    this._AutoCenterEnabled = false;
    this._transitionTime = 750;
    this._nodeSize = [100, 100];
    this._treeWidth = 0;
    this._isVisible = false;
    this._nodeTable = {};
    this._currentNodeID = 0;
    this._currentTranslate = [0, 0];
    this._scale = 1;
    this._nodeScaleY = 0;

    var centerDiv = document.createElement('div');
    centerDiv.className = 'center-bottom';

    var gameHistoryDiv = document.createElement('div');
    gameHistoryDiv.className = 'gamehistory-hud';

    var headerDiv = document.createElement('div');
    headerDiv.className = 'row1';

    var img = document.createElement('img');
    img.src = 'res/svg/gamehistoryheader.svg';
    img.className = 'gamehistory-header';
    var mouseDriver = new utility.MouseDriver(img);
    mouseDriver.registerLeftDrag(function (event) {
        if (self._isVisible) {
            if (event.deltaY > 0) {
                self._isVisible = false;
                $(self._domElement).slideToggle(500);
            }
        } else {
            if (event.deltaY < 0) {
                self._isVisible = true;
                $(self._domElement).slideToggle(500, function () {
                    utility.fitText();
                });
            }
        }
    });
    headerDiv.appendChild(img);

    var buttonContainerDiv = document.createElement('div');
    buttonContainerDiv.className = 'header-container center-horizontally center-vertically';

    var iconDiv = document.createElement('div');
    iconDiv.className = 'icon-container';
    iconDiv.style.width =  '25%';
    img = document.createElement('img');
    img.className = 'button back-button center-vertically';
    img.src = 'res/svg/arrowretry.svg';
    img.oncontextmenu = function () {
        return false;
    };
    img.ondragstart = function () {
        return false;
    };
    img.onclick = function () {
        self._gameHistoryManager.goToPrevious();
    };
    iconDiv.appendChild(img);
    buttonContainerDiv.appendChild(iconDiv);

    iconDiv = document.createElement('div');
    iconDiv.className = 'icon-container';
    iconDiv.style.width = '15%';

    buttonContainerDiv.appendChild(iconDiv);

    iconDiv = document.createElement('div');
    iconDiv.className = 'icon-container';
    img = document.createElement('img');
    img.className = 'button center-vertically center-horizontally';
    img.style.height = '80%';
    img.src = 'res/svg/arrowbackward.svg';
    img.oncontextmenu = function () {
        return false;
    };
    img.ondragstart = function () {
        return false;
    };
    img.onclick = function () {
        self._gameHistoryManager.rewindStep();
    };
    iconDiv.appendChild(img);
    buttonContainerDiv.appendChild(iconDiv);

    iconDiv = document.createElement('div');
    iconDiv.className = 'icon-container';
    img = document.createElement('img');
    img.className = 'icon center-vertically center-horizontally';
    img.src = 'res/svg/gamehistoryicon.svg';
    iconDiv.appendChild(img);
    buttonContainerDiv.appendChild(iconDiv);

    iconDiv = document.createElement('div');
    iconDiv.className = 'icon-container';
    img = document.createElement('img');
    img.className = 'button center-vertically center-horizontally';
    img.style.height = '80%';
    img.src = 'res/svg/arrowforward.svg';
    img.oncontextmenu = function () {
        return false;
    };
    img.ondragstart = function () {
        return false;
    };
    img.onclick = function () {
        self._gameHistoryManager.forwardStep();
    };
    iconDiv.appendChild(img);
    buttonContainerDiv.appendChild(iconDiv);

    headerDiv.appendChild(buttonContainerDiv);

    var row2 = document.createElement('div');
    row2.className = 'row2';

    this._domElement = document.createElement('div');
    this._domElement.id = 'gamehistory';
    this._domElement.className = 'tree-container unselectable';
    this._domElement.style.display = 'none';
    row2.appendChild(this._domElement);

    gameHistoryDiv.appendChild(headerDiv);
    gameHistoryDiv.appendChild(row2);
    centerDiv.appendChild(gameHistoryDiv);
    document.body.appendChild(centerDiv);

    this._domElement.oncontextmenu = function () {
        return false;
    };

    var height = $(this._domElement).height();
    var width = $(this._domElement).width();

    this._d3Tree = d3.layout.tree()
        .nodeSize(this._nodeSize);

    this._d3Diagonal = d3.svg.diagonal().projection(function (d) {
        return [d.y, d.x];
    });

    this._d3SVG = d3.select(this._domElement).append('svg')
        .style('pointer-Events', 'all')
        .style('width', '100%')
        .style('height', '100%')
        .attr('width', width)
        .attr('height', height)
        .append('g');

    this._svgTransformer = d3.behavior.zoom().scaleExtent([0.00001, 2]).on('zoom', function () {
        if (d3.event.sourceEvent == null) {
            self._d3SVG.attr('transform', 'translate(' + d3.event.translate + ') scale(' + d3.event.scale + ')');
        } else {
            if (d3.event.sourceEvent instanceof WheelEvent) {
                var width = $(self._domElement).width();
                if (self._treeWidth <= width && d3.event.scale < 1) {
                    self._moveTree(self._currentTranslate);
                    return;
                }
                if (self._scale > d3.event.scale) {
                    if (self._treeWidth * self._scale > 0.9 * width || (self._treeWidth <= width)) {
                        self._AutoCenterEnabled = false;
                        self._d3SVG.attr('transform', 'translate(' + d3.event.translate + ') scale(' + d3.event.scale + ')');
                        self._currentTranslate = d3.event.translate.clone();
                        self._scale = d3.event.scale;
                        self._updateTree(self._d3Root);
                    } else {
                        self._moveTree([$(self._domElement).width() * 0.01, self._currentTranslate[1]]);
                        self._updateTree(self._d3Root);
                    }
                } else {
                    self._AutoCenterEnabled = false;
                    self._d3SVG.attr('transform', 'translate(' + d3.event.translate + ') scale(' + d3.event.scale + ')');
                    self._currentTranslate = d3.event.translate.clone();
                    self._scale = d3.event.scale;
                    self._updateTree(self._d3Root);
                }
            } else {
                var button = d3.event.sourceEvent.buttons ? d3.event.sourceEvent.buttons : d3.event.sourceEvent.button;
                var width = $(self._domElement).width();
                if (button == 2) {
                    self._AutoCenterEnabled = false;
                    self._d3SVG.attr('transform', 'translate(' + d3.event.translate + ') scale(' + d3.event.scale + ')');
                    self._currentTranslate = d3.event.translate.clone();
                    self._scale = d3.event.scale;
                } else {
                    self._moveTree(self._currentTranslate);
                }
            }
        }
    });

    d3.select(this._domElement).call(this._svgTransformer);

    this._moveTree([width * 0.01, height / 2]);

    var treeData = this._gameHistoryManager.d3jsify();

    this._d3Root = treeData;
    this._d3Root.x0 = height / 2;
    this._d3Root.y0 = 0;

    this._currentNodeID = this._d3Root.id;

    this._updateTree(this._d3Root);

    algorithm.bfs(treeData, function (node) {
        return node.id;
    }, function (node) {
        return node.children;
    }, function (node) {
        self._nodeTable[node.id] = node;
        self._treeWidth = Math.max(self._treeWidth, node.properties.passedDays * self._nodeScaleY);
    });

    //TODO: Add a grid to the tree maybe?
    /*this._d3SVG.selectAll('.vline').data(d3.range([0,]).enter()
        .append('line')
        .attr('x1', function (d) {
            return d * 100;
        })
        .attr('x2', function (d) {
            return d * 100;
        })
        .attr('y1', function (d) {
            return -height / 2;
        })
        .attr('y2', function (d) {
            return height / 2;
        })
        .style('stroke', '#cccccc');
        */

    window.addEventListener('resize', function (event) {
        self._updateTree(self._d3Root);
    });
};
gui.GameHistoryHUD.prototype = {
    constructor: gui.GameHistoryHUD,

    _onRightClick: function (node) {
        var parentNode = node.parent;
        if (parentNode) {
            if (parentNode._children) {
                parentNode.children = parentNode._children;
                parentNode._children = null;
                node.hasHiddenSiblings = false;
                this._updateTree(parentNode);
            } else {
                if (parentNode.children.length > 1) {
                    parentNode._children = parentNode.children;
                    parentNode.children = [node];
                    node.hasHiddenSiblings = true;
                    this._updateTree(parentNode);
                }
            }
        }
    },

    _onLeftClick: function (node) {
        if (!this._isLocked && !node.isVirtual) {
            this._gameHistoryManager.goTo(node.id);
        }
    },

    _moveTree: function (translation, duration) {
        this._currentTranslate = translation.clone();
        this._svgTransformer.translate(this._currentTranslate).scale(this._scale);
        if (duration != null) {
            this._svgTransformer.event(d3.select(this._domElement).transition().duration(duration));
        } else {
            this._svgTransformer.event(d3.select(this._domElement).transition());
        }
    },

    _getNodeColor: function (node) {
        var rating = node.properties.gravityLoss;
        var green = Math.round(255 * rating);
        var red = Math.round(255 - rating * 255);
        var textRed = red.toString(16);
        var textGreen = green.toString(16);
        textRed = (textRed.length == 2 ? textRed : '0' + textRed);
        textGreen = (textGreen.length == 2 ? textGreen : '0' + textGreen);
        var textHex = '#' + textRed + textGreen + '00';
        return textHex;
    },

    _updateTree: function (sourceNode) {
        var self = this;
        var width = $(this._domElement).innerWidth();

        var nodes = this._d3Tree.nodes(this._d3Root).reverse();
        var links = this._d3Tree.links(nodes);

        nodes.forEach(function (node) {
            var value = node.properties.passedDays > 0 ? (300 * node.depth) / node.properties.passedDays : 0;
            self._nodeScaleY = Math.max(self._nodeScaleY, value);
        });

        nodes.forEach(function (node) {
            node.y = node.properties.passedDays * self._nodeScaleY;
        });

        var nodeTmp = this._d3SVG.selectAll('g.node')
            .data(nodes, function (node) {
                return node.id;
            });

        var nodeEnter = nodeTmp.enter().append('g')
            .attr('class', 'node')
            .attr('transform', function (node) {
                return 'translate(' + sourceNode.y0 + ',' + sourceNode.x0 + ')';
            })
            .on('click', function (node) {
                d3.event.preventDefault();
                self._onLeftClick(node);
            })
            .on('contextmenu', function (node) {
                d3.event.preventDefault();
                self._onRightClick(node);
            });

        nodeEnter.append('circle')
            .attr('r', '0.5em')
            .style('fill', function (node) {
                return self._getNodeColor(node);
            });

        var text = nodeEnter.append('text')
            .attr('y', '0.5em')
            .attr('dy', '.4em')
            .attr('text-anchor', 'start');

        text.append('tspan')
            .attr('x', '0')
            .attr('dy', '1.2em')
            .text(function (node) {
                return node.properties.name;
            });
        text.append('tspan')
            .attr('x', '0')
            .attr('dy', '1.2em')
            .text(function (node) {
                return ' ' + (Math.round(node.properties.totalDeltaV * 100) / 100).toString() + ' m/s';
            });
        text.append('tspan')
            .attr('x', '0')
            .attr('dy', '1.2em')
            .text(function (node) {
                return ' ' + node.properties.score + ' points';
            });

        var nodeUpdate = nodeTmp.transition()
            .duration(this._transitionTime)
            .attr('transform', function (node) {
                return 'translate(' + node.y + ',' + node.x + ')';
            });

        nodeUpdate.select('circle')
            .attr('r', function (node) {
                if (node.properties.isCurrentState) {
                    var scale = 1 / self._scale / 2;
                    scale = Math.round(scale * 10) / 10;
                    scale = Math.max(0.5, scale);
                    return scale + 'em';
                } else {
                    var scale = 1 / self._scale / 4;
                    scale = Math.round(scale * 10) / 10;
                    scale = Math.max(0.5, scale);
                    return scale + 'em';
                }
            })
            .style('fill', function (node) {
                if (node.hasHiddenSiblings) {
                    return '#cccccc';
                } else {
                    return self._getNodeColor(node);
                }
            })
            .style('stroke', function (node) {
                if (node.properties.isCurrentState) {
                    return '#19a3ff';
                } else {
                    return '#cccccc';
                }
            })
            .style('stroke-width', function (node) {
                if (node.properties.isCurrentState) {
                    var scale = 1 / self._scale / 4;
                    scale = Math.round(scale * 10) / 10;
                    return scale + '%';
                } else {
                    var scale = 1 / self._scale / 8;
                    scale = Math.round(scale * 10) / 10;
                    return scale + '%';
                }
            });

        nodeUpdate.select('text')
            .style('stroke', function (node) {
                if (node.properties.isCurrentState) {
                    return 'rgba(25, 163, 255,1)';
                } else {
                    var alpha = (self._scale <= 0.4) ? self._scale * self._scale : 1;
                    if (node.properties.isCurrentState) {
                        return 'rgba(25, 163, 255,' + alpha + ')';
                    } else {
                        return 'rgba(204, 204, 204,' + alpha + ')';
                    }
                }
            })
            .style('fill', function (node) {
                if (node.properties.isCurrentState) {
                    return 'rgba(25, 163, 255,1)';
                } else {
                    var alpha = Math.min(1, self._scale * self._scale);
                    if (node.properties.isCurrentState) {
                        return 'rgba(25, 163, 255,' + alpha + ')';
                    } else {
                        return 'rgba(204, 204, 204,' + alpha + ')';
                    }
                }
            })
            .attr('y', function (node) {
                if (node.properties.isCurrentState) {
                    var scale = 1 / self._scale;
                    scale = Math.round(scale * 10) / 10;
                    return scale + '%';
                } else {
                    return '1%';
                }
            })
            .attr('dy', '.4em');

        var textSizeUpdate = nodeTmp;
        textSizeUpdate.select('text')
            .style('font-size', function (node) {
                if (node.properties.isCurrentState) {
                    var scale = 1 / self._scale;
                    scale = Math.max(1, Math.round(scale));
                    return scale + 'em';
                } else {
                    return '1em';
                }
            });

        var nodeExit = nodeTmp.exit().transition()
            .duration(this._transitionTime)
            .attr('transform', function (node) {
                return 'translate(' + sourceNode.y + ',' + sourceNode.x + ')';
            })
            .remove();

        nodeExit.select('circle')
            .attr('r', '0.5em');

        nodeExit.select('text')
            .style('fill-opacity', 1e-6);

        var link = this._d3SVG.selectAll('path.link')
            .data(links, function (node) {
                return node.target.id;
            });

        link.enter().insert('path', 'g')
            .attr('class', 'link')
            .attr('d', function (dLink) {
                var point = {
                    x: sourceNode.x0,
                    y: sourceNode.y0
                };
                return self._d3Diagonal({
                    source: point,
                    target: point
                });
            })
            .attr('opacity', function (dLink) {
                return (dLink.source.properties.isVehicleLanded && dLink.target.properties.isVehicleLanded) ? 0.2 : 1;
            });

        link.transition()
            .duration(this._transitionTime)
            .attr('d', this._d3Diagonal)
            .style('stroke-width', (Math.round(1 / (self._scale * 5) * 10) / 10) + '%')

        link.exit().transition()
            .duration(this._transitionTime)
            .attr('d', function (dLink) {
                var point = {
                    x: sourceNode.x,
                    y: sourceNode.y
                };
                return self._d3Diagonal({
                    source: point,
                    target: point
                });
            })
            .remove();

        nodes.forEach(function (node) {
            node.x0 = node.x;
            node.y0 = node.y;
        });
    },

    _moveNodeIntoView: function (node) {
        var valY = node.x;
        var valX = node.y;

        var height = $(this._domElement).innerHeight();
        var width = $(this._domElement).innerWidth();

        var transformText = this._d3SVG.attr('transform');
        var translation = utility.parseTransform(transformText).translation;

        var tmpX = valX * this._scale + translation[0];
        var tmpY = valY * this._scale + translation[1];

        if (tmpX < 0 || tmpX > width || tmpY < 0 || tmpY > height || this._AutoCenterEnabled) {
            this._AutoCenterEnabled = true;
            this._moveTree([width / 2 - valX * this._scale, height / 2 - valY * this._scale], this._transitionTime);
        }
    },

    getBackButtonSelector: function () {
        return '.back-button';
    },

    add: function (parentID, nodeID, data) {
        if (!this._isLocked) {
            var node = {};
            node.id = nodeID;
            node.parentID = parentID;
            node.isVirtual = data.isVirtual;
            node.hasHiddenSiblings = false;
            node.properties = {};
            node.properties.name = data.name;
            node.properties.gravityLoss = data.gravityLoss;
            node.properties.passedDays = data.passedDays;
            node.properties.totalDeltaV = data.totalDeltaV;
            node.properties.score = data.score;
            node.properties.isVehicleLanded = data.isVehicleLanded;
            node.properties.isCurrentState = true;
            var parentNode = this._nodeTable[parentID];
            parentNode.properties.isCurrentState = false;
            if (parentNode.children) {
                parentNode.children.push(node);
            } else {
                parentNode.children = [node];
            }
            this._currentNodeID = node.id;
            this._nodeTable[node.id] = node;

            this._treeWidth = Math.max(this._treeWidth, node.properties.passedDays * this._nodeScaleY);

            this._updateTree(parentNode);
            this._moveNodeIntoView(node);
        }
    },

    onActiveChanged: function (nodeID) {
        var currentNode = this._nodeTable[this._currentNodeID];
        currentNode.properties.isCurrentState = false;
        currentNode = this._nodeTable[nodeID];
        currentNode.properties.isCurrentState = true;
        this._currentNodeID = nodeID;
        this._updateTree(currentNode);
        this._moveNodeIntoView(currentNode);
    },

    lock: function () {
        this._isLocked = true;
    },

    unlock: function () {
        this._isLocked = false;
    }
};