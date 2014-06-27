function createScoreBoard(response) {
    var data = d3.csv.parse(response);
    d3.select('#scorechart').html('');
    if (data.length == 0) {
        d3.select('#scorechart').html('empty');
        return;
    }
    var valueLabelWidth = 40; // space reserved for value labels (right)
    var barHeight = 20; // height of one bar
    var barLabelWidth = 100; // space reserved for bar labels
    var barLabelPadding = 5; // padding between bar and bar labels (left)
    var gridLabelHeight = 18; // space reserved for gridline labels
    var gridChartOffset = 3; // space between start of grid and first bar
    var maxBarWidth = 420; // width of the bar with the max value

    var div = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);

    // accessor functions 
    var barLabel = function (d) {
        return d['username'];
    };
    var barValue = function (d) {
        return parseFloat(d['score']);
    };

    // sorting
    var sortedData = data.sort(function (a, b) {
        return d3.descending(barValue(a), barValue(b));
    });

    // scales
    var yScale = d3.scale.ordinal().domain(d3.range(0, sortedData.length)).rangeBands([0, sortedData.length * barHeight]);
    var y = function (d, i) {
        return yScale(i);
    };
    var yText = function (d, i) {
        return y(d, i) + yScale.rangeBand() / 2;
    };
    var x = d3.scale.linear().domain([0, d3.max(sortedData, barValue)]).range([0, maxBarWidth]);
    // svg container element
    var chart = d3.select('#scorechart').append('svg')
        .attr('width', maxBarWidth + barLabelWidth + valueLabelWidth)
        .attr('height', gridLabelHeight + gridChartOffset + sortedData.length * barHeight);
    // grid line labels
    var gridContainer = chart.append('g')
        .attr('transform', 'translate(' + barLabelWidth + ',' + gridLabelHeight + ')');
    gridContainer.selectAll('text').data(x.ticks(10)).enter().append('text')
        .attr('x', x)
        .attr('dy', -3)
        .attr('text-anchor', 'middle')
        .text(String);
    // vertical grid lines
    gridContainer.selectAll('line').data(x.ticks(10)).enter().append('line')
        .attr('x1', x)
        .attr('x2', x)
        .attr('y1', 0)
        .attr('y2', yScale.rangeExtent()[1] + gridChartOffset)
        .style('stroke', '#ccc');
    // bar labels
    var labelsContainer = chart.append('g')
        .attr('transform', 'translate(' + (barLabelWidth - barLabelPadding) + ',' + (gridLabelHeight + gridChartOffset) + ')');
    labelsContainer.selectAll('text').data(sortedData).enter().append('text')
        .attr('y', yText)
        .attr('stroke', 'none')
        .attr('fill', 'black')
        .attr('dy', '.35em') // vertical-align: middle
    .attr('text-anchor', 'end')
        .text(barLabel);
    // bars
    var barsContainer = chart.append('g')
        .attr('transform', 'translate(' + barLabelWidth + ',' + (gridLabelHeight + gridChartOffset) + ')');
    barsContainer.selectAll('rect').data(sortedData).enter().append('rect')
        .attr('y', y)
        .attr('height', yScale.rangeBand())
        .attr('width', function (d) {
            return x(barValue(d));
        })
        .attr('stroke', 'white')
        .attr('fill', '#19A3FF');
    // bar value labels
    barsContainer.selectAll('text').data(sortedData).enter().append('text')
        .attr('x', function (d) {
            return x(barValue(d));
        })
        .attr('y', yText)
        .attr('dx', 3) // padding-left
    .attr('dy', '.35em') // vertical-align: middle
    .attr('text-anchor', 'start') // text-align: right
    .attr('fill', 'black')
        .attr('stroke', 'none')
        .text(function (d) {
            return d3.round(barValue(d), 2);
        });
    // start line
    barsContainer.append('line')
        .attr('y1', -gridChartOffset)
        .attr('y2', yScale.rangeExtent()[1] + gridChartOffset)
        .style('stroke', '#000');

    function format(sVal) {
        return Math.round(sVal * 100) / 100;
    }

    chart.selectAll('rect')
        .on('mouseover', function (d) {
            div.transition()
                .duration(200)
                .style('opacity', .9);
            div.html('deltav: ' + format(d.totalDeltaV) + "\n" + 'days: ' + format(d.passedDays))
                .style('left', (d3.event.pageX) + 'px')
                .style('top', (d3.event.pageY - 28) + 'px');
        })
        .on('mouseout', function (d) {
            div.transition()
                .duration(500)
                .style('opacity', 0);
        });
}

function displayError(error) {
    $('#scorechart').html('<p style="color:red;">' + error.statusText + '</p>');
}