(function () {
    function propagateLagrangian(position, velocity, t, mu) {
        var tolerance = 1e-16;

        position = position.clone();
        velocity = velocity.clone();

        var R = position.normEuclid();
        var V = velocity.normEuclid();

        var energy = (V * V / 2 - mu / R);
        var a = -mu / 2.0 / energy;
        var sqrta;
        var F, G, Ft, Gt;

        var sigma0 = position.dot(velocity) / Math.sqrt(mu);

        if (a > 0) { //Solve Kepler's equation, elliptical case

            // console.log("ELLIPSE");

            sqrta = Math.sqrt(a);
            var DM = Math.sqrt(mu / Math.pow(a, 3)) * t;
            var DE = DM;

            //Solve Kepler Equation for ellipses in DE (eccentric anomaly difference)

            DE = algorithm.newtonRaphson(DE, function (x) {
                return astrodynamics.kepDE(x, DM, sigma0, sqrta, a, R);
            }, function (x) {
                return astrodynamics.dKepDE(x, sigma0, sqrta, a, R);
            }, 1000, tolerance);

            var r = a + (R - a) * Math.cos(DE) + sigma0 * sqrta * Math.sin(DE);

            //Lagrange coefficients
            F = 1 - a / R * (1 - Math.cos(DE));
            G = a * sigma0 / Math.sqrt(mu) * (1 - Math.cos(DE)) + R * Math.sqrt(a / mu) * Math.sin(DE);
            Ft = -Math.sqrt(mu * a) / (r * R) * Math.sin(DE);
            Gt = 1 - a / r * (1 - Math.cos(DE));

        } else { //Solve Kepler's equation, hyperbolic case

            // console.log("HYPERBOLE");

            sqrta = Math.sqrt(-a);
            var DN = Math.sqrt(-mu / Math.pow(a, 3)) * t;
            var DH;
            t > 0 ? DH = 1 : DH = -1; // TODO: find a better initial guess. I tried with 0 and D (both have numercial problems and result in exceptions)

            //Solve Kepler Equation for hyperbolae in DH (hyperbolic anomaly difference)

            DH = algorithm.newtonRaphson(DH, function (x) {
                return astrodynamics.kepDH(x, DN, sigma0, sqrta, a, R);
            }, function (x) {
                return astrodynamics.dKepDH(x, sigma0, sqrta, a, R);
            }, 1000, tolerance);

            var r = a + ((R - a) * Math.cosh(DH)) + (sigma0 * sqrta * Math.sinh(DH));

            //Lagrange coefficients
            F = 1 - a / R * (1 - Math.cosh(DH));
            G = a * sigma0 / Math.sqrt(mu) * (1 - Math.cosh(DH)) + R * Math.sqrt(-a / mu) * Math.sinh(DH);
            Ft = -Math.sqrt(-mu * a) / (r * R) * Math.sinh(DH);
            Gt = 1 - a / r * (1 - Math.cosh(DH));
        }

        var temp = position.clone();

        var ret_r = new geometry.Vector3();

        var ret_v = new geometry.Vector3();

        ret_r.add(velocity.clone().multiplyScalar(G).add(position.clone().multiplyScalar(F)));
        ret_v.add(velocity.clone().multiplyScalar(Gt).add(temp.clone().multiplyScalar(Ft)));

        return {
            position: ret_r,
            velocity: ret_v
        };
    }

    //Exposed Interface
    astrodynamics.propagateLagrangian = propagateLagrangian;
})();