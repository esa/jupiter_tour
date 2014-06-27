/* Class Satellite. 
    A body in space following a keplerian orbit.
*/
astrodynamics.Satellite = function (centralBody, orbitalElements, orbitalElementDerivatives, refEpoch, sgp) {
    this._centralBody = centralBody;
    this._refEpoch = refEpoch;
    this._sgp = sgp;
    this._centralBodySGP = this._centralBody.getStandardGravitationalParameter();

    this._orbitalElements = {
        semiMajorAxis: orbitalElements.sma,
        eccentricity: orbitalElements.ecc,
        inclination: orbitalElements.incl,
        longitudeOfAscendingNode: orbitalElements.lan,
        argumentOfPeriapsis: orbitalElements.ap,
        meanAnomaly: orbitalElements.ma
    };
    if (orbitalElementDerivatives) {
        this._orbitalElementDerivatives = {
            dSemiMajorAxis: orbitalElementDerivatives.dsma,
            dEccentricity: orbitalElementDerivatives.decc,
            dInclination: orbitalElementDerivatives.dincl,
            dLongitudeOfAscendingNode: orbitalElementDerivatives.dlan,
            dArgumentOfPeriapsis: orbitalElementDerivatives.dap,
            dMeanAnomaly: orbitalElementDerivatives.dma
        };
    } else {
        var meanMotion = Math.sqrt(this._centralBodySGP / Math.pow(this._orbitalElements.semiMajorAxis, 3)) * utility.DAY_TO_SEC * utility.JULIAN_CENTURY_TO_DAY;
        this._orbitalElementDerivatives = {
            dSemiMajorAxis: 0,
            dEccentricity: 0,
            dInclination: 0,
            dLongitudeOfAscendingNode: 0,
            dArgumentOfPeriapsis: 0,
            dMeanAnomaly: meanMotion
        };
    }

    this._cachedEpoch = Number.MAX_VALUE;
    this._cachedOrbitalStateVectors = {};
    this.orbitalStateVectorsAtEpoch(this._refEpoch);
};
astrodynamics.Satellite.prototype = {
    constructor: astrodynamics.Satellite,

    _getOrbitalElementsAtEpoch: function (epoch) {
        var orbitalElements = {};
        var orbitalElementDerivatives = this._orbitalElementDerivatives;
        var dt = (epoch - this._refEpoch) / utility.JULIAN_CENTURY_TO_DAY;
        var pi2 = 2 * Math.PI;

        orbitalElements.semiMajorAxis = this._orbitalElements.semiMajorAxis + orbitalElementDerivatives.dSemiMajorAxis * dt;
        orbitalElements.eccentricity = this._orbitalElements.eccentricity + orbitalElementDerivatives.dEccentricity * dt;
        orbitalElements.inclination = (this._orbitalElements.inclination + orbitalElementDerivatives.dInclination * dt) % pi2;
        orbitalElements.longitudeOfAscendingNode = (this._orbitalElements.longitudeOfAscendingNode + orbitalElementDerivatives.dLongitudeOfAscendingNode * dt) % pi2;
        orbitalElements.argumentOfPeriapsis = (this._orbitalElements.argumentOfPeriapsis + orbitalElementDerivatives.dArgumentOfPeriapsis * dt) % pi2;
        orbitalElements.meanAnomaly = this._orbitalElements.meanAnomaly + orbitalElementDerivatives.dMeanAnomaly * dt;
        return orbitalElements;
    },

    _meanToEccentricAnomaly: function (meanAnomaly, eccentricity) {
        meanAnomaly %= 2 * Math.PI;
        var tolerance = 1e-13;
        var eccentricAnomaly = 0;
        var eccentricAnomalyNew = 0;

        eccentricAnomaly = meanAnomaly + eccentricity * Math.cos(meanAnomaly);
        eccentricAnomalyNew = algorithm.newtonRaphson(eccentricAnomaly, function (x) {
            return astrodynamics.kepE(x, meanAnomaly, eccentricity);
        }, function (x) {
            return astrodynamics.dKepE(x, eccentricity);
        }, 100, tolerance);

        return eccentricAnomalyNew;
    },

    _sampleOrbitPositions: function (num, epoch) {
        var orbitalElements = null;
        if (epoch != null) {
            orbitalElements = this._getOrbitalElementsAtEpoch(epoch);
        }
        var step = 2 * Math.PI / (num - 1);
        var positions = [];
        for (var i = 0; i < num - 1; i++) {
            var eccentricAnomaly = step * i;
            positions.push(this.orbitalStateVectorsAtEccentricAnomaly(eccentricAnomaly, orbitalElements).position);
        }
        positions.push(this.orbitalStateVectorsAtEccentricAnomaly(0, orbitalElements).position);
        return positions;
    },

    getCentralBody: function () {
        return this._centralBody;
    },

    getMass: function () {
        return this._sMass;
    },

    getStandardGravitationalParameter: function () {
        return this._sgp;
    },

    getReferenceEpoch: function () {
        return this._refEpoch;
    },

    orbitalStateVectorsAtEccentricAnomaly: function (eccentricAnomaly, orbElements) {
        var orbitalElements = this._orbitalElements;
        if (orbElements != null) {
            orbitalElements = orbElements;
        }
        var sma = orbitalElements.semiMajorAxis;
        var eccentricity = orbitalElements.eccentricity;
        var valB, valN, xPer, yPer, xDotPer, yDotPer, dndZeta;
        if (eccentricity < 1.0) {
            valB = sma * Math.sqrt(1 - eccentricity * eccentricity);
            valN = Math.sqrt(this._centralBodySGP / (sma * sma * sma));

            xPer = sma * (Math.cos(eccentricAnomaly) - eccentricity);
            yPer = valB * Math.sin(eccentricAnomaly);
            xDotPer = -(sma * valN * Math.sin(eccentricAnomaly)) / (1 - eccentricity * Math.cos(eccentricAnomaly));
            yDotPer = (valB * valN * Math.cos(eccentricAnomaly)) / (1 - eccentricity * Math.cos(eccentricAnomaly));
        } else {
            valB = -sma * Math.sqrt(eccentricity * eccentricity - 1);
            valN = Math.sqrt(-this._centralBodySGP / (sma * sma * sma));

            dndZeta = eccentricity * (1 + Math.tan(eccentricAnomaly) * Math.tan(eccentricAnomaly)) - (0.5 + 0.5 * Math.pow(Math.tan(0.5 * eccentricAnomaly + Math.PI / 4), 2)) / Math.tan(0.5 * eccentricAnomaly + Math.PI / 4);

            xPer = sma / Math.cos(eccentricAnomaly) - sma * eccentricAnomaly;
            yPer = valB * Math.tan(eccentricAnomaly);

            xDotPer = sma * Math.tan(eccentricAnomaly) / Math.cos(eccentricAnomaly) * valN / dndZeta;
            yDotPer = valB / Math.pow(Math.cos(eccentricAnomaly), 2) * valN / dndZeta;
        }

        var cosLAN = Math.cos(orbitalElements.longitudeOfAscendingNode);
        var cosAP = Math.cos(orbitalElements.argumentOfPeriapsis);
        var sinLAN = Math.sin(orbitalElements.longitudeOfAscendingNode);
        var sinAP = Math.sin(orbitalElements.argumentOfPeriapsis);
        var cosIncl = Math.cos(orbitalElements.inclination);
        var sinIncl = Math.sin(orbitalElements.inclination);

        var matrix = new geometry.Matrix3();

        matrix.set(cosLAN * cosAP - sinLAN * sinAP * cosIncl, -cosLAN * sinAP - sinLAN * cosAP * cosIncl, sinLAN * sinIncl, sinLAN * cosAP + cosLAN * sinAP * cosIncl, -sinLAN * sinAP + cosLAN * cosAP * cosIncl, -cosLAN * sinIncl, sinAP * sinIncl, cosAP * sinIncl, cosIncl);

        var position = new geometry.Vector3(xPer, yPer, 0);
        var velocity = new geometry.Vector3(xDotPer, yDotPer, 0);

        position.applyMatrix3(matrix).add(this._centralBody.getPosition());
        velocity.applyMatrix3(matrix);

        return {
            position: position,
            velocity: velocity
        };
    },

    orbitalStateVectorsAtEpoch: function (epoch) {
        if ((Math.abs(epoch - this._cachedEpoch) < 1e-10) && (this._cachedOrbitalStateVectors != null)) {
            var orbStateVecs = {};
            orbStateVecs.velocity = this._cachedOrbitalStateVectors.velocity.clone();
            orbStateVecs.position = this._cachedOrbitalStateVectors.position.clone();
            return orbStateVecs;
        }
        var orbitalElements = this._getOrbitalElementsAtEpoch(epoch);
        var eccentricAnomaly = this._meanToEccentricAnomaly(orbitalElements.meanAnomaly, orbitalElements.eccentricity);
        var orbStateVecs = this.orbitalStateVectorsAtEccentricAnomaly(eccentricAnomaly, orbitalElements);
        this._cachedEpoch = epoch;
        this._cachedOrbitalStateVectors = {
            position: orbStateVecs.position.clone(),
            velocity: orbStateVecs.velocity.clone()
        };
        return orbStateVecs;
    },

    getOrbitalPeriod: function (epoch) {
        var orbitalElements = this._orbitalElements;
        if (epoch != null) {
            orbitalElements = this._getOrbitalElementsAtEpoch(epoch);
        }
        return 2 * Math.PI * Math.sqrt(Math.pow(orbitalElements.semiMajorAxis, 3) / this._centralBodySGP);
    },

    getSemiMajorAxis: function (epoch) {
        var orbitalElements = this._orbitalElements;
        if (epoch != null) {
            orbitalElements = this._getOrbitalElementsAtEpoch(epoch);
        }
        return orbitalElements.semiMajorAxis;
    }
};