(function () {

    function newtonRaphson(x, f, df, maxIterations, accuracy) {
        var term;
        do {
            term = f(x) / df(x);
            x = x - term;
        }
        while ((Math.abs(term / Math.max(Math.abs(x), 1.)) > accuracy) && (--maxIterations));
        return x;
    }

    //Exposed Interface
    algorithm.newtonRaphson = newtonRaphson;
})();