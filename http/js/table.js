function createTable(response, funComparingValue, sortDescending, prettyPrints) {
    // Private functions

    function createHeader() {
        var row = document.createElement('tr');
        for (var id in prettyPrints) {
            col = document.createElement('th');
            col.innerHTML = prettyPrints[id];
            row.appendChild(col);
        }
        return row;
    }

    var rank = 0;

    function getNextRank() {
        return ++rank;
    }

    function createRow(rowData) {
        var row = document.createElement('tr');
        for (var id in prettyPrints) {
            var col = document.createElement('td');
            if (id == 'rank') {
                col.innerHTML = getNextRank().toString() + '.';
            } else {
                var val = rowData[id];
                val = parseFloat(val);
                if (isNaN(val) || val.toString() != rowData[id]) {
                    val =  rowData[id];
                } else {
                    val = Math.round(val * 1000) / 1000;
                }
                col.innerHTML = val;
            }
            row.appendChild(col);
        }
        return row;
    }

    var data = d3.csv.parse(response);

    var table = document.createElement('table');

    if (data.length == 0) {
        table.innerHTML = '<tr><td>empty</td></tr>';
    } else {

        var sortedData = null;

        if (sortDescending) {
            sortedData = data.sort(function (a, b) {
                return d3.descending(funComparingValue(a), funComparingValue(b));
            });
        } else {
            sortedData = data.sort(function (a, b) {
                return d3.ascending(funComparingValue(a), funComparingValue(b));
            });
        }

        table.appendChild(createHeader(data[0]));

        for (var i = 0; i < data.length; i++) {
            var row = createRow(data[i]);
            table.appendChild(row);
        }
    }

    return table;
}