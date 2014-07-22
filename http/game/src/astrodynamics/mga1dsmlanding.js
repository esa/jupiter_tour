/* Class MGA1DSMLanding
    MGA-1DSM for solving for landing.
    Inherits JDEProblem
*/
astrodynamics.MGA1DSMLanding = function (currentBody, nextBody, epoch, velocityInf, timeOfFlightBounds, radiusBounds, betaBounds, populationSize) {
    this._orbitingBodies = [currentBody, nextBody];
    this._epoch = epoch;
    this._velocityInf = velocityInf.clone();
    this._dimension = 4;
    this._bounds = [];
    this._population = [];
    this._populationSize = populationSize || 30;

    this._bounds[0] = betaBounds.clone();
    this._bounds[1] = radiusBounds.clone();
    this._bounds[2] = [1e-5, 1.0 - 1e-5];
    this._bounds[3] = timeOfFlightBounds.clone();

    this._resetPopulation();
};
astrodynamics.MGA1DSMLanding.prototype = Object.create(datastructure.JDEProblem.prototype);
astrodynamics.MGA1DSMLanding.prototype.constructor = astrodynamics.MGA1DSMLanding;

astrodynamics.MGA1DSMLanding.prototype.setBetaBounds = function (betaBounds) {
    var min = -2 * Math.PI > betaBounds[0] ? -2 * Math.PI : betaBounds[0];
    var max = 2 * Math.PI < betaBounds[1] ? 2 * Math.PI : betaBounds[1];
    this._bounds[0] = [min, max];
    this._resetPopulation();
};

astrodynamics.MGA1DSMLanding.prototype.setRadiusBounds = function (radiusBounds) {
    var min = this._orbitingBodies[0].getSafeRadius() / this._orbitingBodies[0].getRadius();
    var max = this._orbitingBodies[0].getMaxRadius() / this._orbitingBodies[0].getRadius();
    min = min > radiusBounds[0] ? min : radiusBounds[0];
    max = max < radiusBounds[1] ? max : radiusBounds[1];
    this._bounds[1] = [min, max];
    this._resetPopulation();
};

astrodynamics.MGA1DSMLanding.prototype.setTimeOfFlightBounds = function (timeOfFlightBounds) {
    this._bounds[3] = timeOfFlightBounds.clone();
    this._resetPopulation();
};

astrodynamics.MGA1DSMLanding.prototype.objectiveFunction = function (individual) {
    var chromosome = individual.getChromosome();

    var ephCBody = this._orbitingBodies[0].orbitalStateVectorsAtEpoch(this._epoch);
    var ephNBody = this._orbitingBodies[1].orbitalStateVectorsAtEpoch(this._epoch + chromosome[3]);

    var velocityEndLeg = this._velocityInf.clone().add(ephCBody.velocity);

    var currentBody = this._orbitingBodies[0];
    var velocityInfOut = astrodynamics.flybyPropagation(velocityEndLeg, ephCBody.velocity, chromosome[0], chromosome[1] * currentBody.getRadius(), currentBody.getStandardGravitationalParameter());

    var propLagr = astrodynamics.propagateLagrangian(ephCBody.position, velocityInfOut, chromosome[2] * chromosome[3] * utility.DAY_TO_SEC, currentBody.getCentralBody().getStandardGravitationalParameter());

    var dt = (1 - chromosome[2]) * chromosome[3] * utility.DAY_TO_SEC;
    var lambertProb = astrodynamics.lambertProblem(currentBody.getCentralBody().getStandardGravitationalParameter(), propLagr.position, ephNBody.position, dt, false);
    var velocityBeginLeg = lambertProb.velocity1;
    var velocityEndLeg = lambertProb.velocity2;

    return velocityBeginLeg.sub(propLagr.velocity).normEuclid() + velocityEndLeg.sub(ephNBody.velocity).normEuclid();
};