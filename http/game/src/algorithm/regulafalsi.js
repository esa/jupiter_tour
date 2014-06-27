(function () {

    function regulaFalsi(a, b, f, iterations, accuracy) {
        var fa = f(a);
        var fb = f(b);
        var fc = fa;
        var n, c;

        for (n = 0; n < iterations; n++) {
            if (Math.abs(fc) < accuracy) {
                break;
            }
            c = ((a * fb) - (b * fa)) / (fb - fa);
            fc = f(c);
            a = b;
            b = c;
            fa = fb;
            fb = fc;
        }

        return {
            retval: n,
            ia: c
        };
    }

    //Exposed Interface
    algorithm.regulaFalsi = regulaFalsi;
})();