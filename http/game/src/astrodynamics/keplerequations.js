(function () {

    function kepE(E, M, eccentricity) {
        return (E - eccentricity * Math.sin(E) - M);
    }

    function dKepE(E, eccentricity) {
        return (1 - eccentricity * Math.cos(E));
    }

    function kepDE(DE, DM, sigma0, sqrta, a, R) {
        return ((-DM + DE + sigma0 / sqrta * (1 - Math.cos(DE)) - (1 - R / a) * Math.sin(DE)));
    }

    function dKepDE(DE, sigma0, sqrta, a, R) {
        return ((1 + sigma0 / sqrta * Math.sin(DE) - (1 - R / a) * Math.cos(DE)));
    }

    function kepDH(DH, DN, sigma0, sqrta, a, R) {
        return (-DN - DH + sigma0 / sqrta * (Math.cosh(DH) - 1) + (1 - R / a) * Math.sinh(DH));
    }

    function dKepDH(DH, sigma0, sqrta, a, R) {
        return (-1 + sigma0 / sqrta * Math.sinh(DH) + (1 - R / a) * Math.cosh(DH));
    }

    //Exposed Interface
    astrodynamics.kepE = kepE;
    astrodynamics.dKepE = dKepE;
    astrodynamics.kepDE = kepDE;
    astrodynamics.dKepDE = dKepDE;
    astrodynamics.kepDH = kepDH;
    astrodynamics.dKepDH = dKepDH;
})();