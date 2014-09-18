/* Class MGA1DSMFlyby
    MGA-1DSM for solving for flyby.
    Inherits JDEProblem
*/
astrodynamics.MGA1DSMFlyby = function (currentBody, nextBody, epoch, velocityInf, timeOfFlightBounds, radiusBounds, betaBounds, addArrivalVelocity, populationSize) {
    this._orbitingBodies = [currentBody, nextBody];
    this._epoch = epoch;
    this._velocityInf = velocityInf.clone();
    this._dimension = 4;
    this._bounds = [];
    this._population = [];
    this._populationSize = populationSize || 30;
    this._addArrivalVelocity = addArrivalVelocity;

    this._bounds[0] = betaBounds.clone();
    this._bounds[1] = radiusBounds.clone();
    this._bounds[2] = [1e-5, 1.0 - 1e-5];
    this._bounds[3] = timeOfFlightBounds.clone();

    this._resetPopulation();
};
astrodynamics.MGA1DSMFlyby.prototype = Object.create(datastructure.JDEProblem.prototype);
astrodynamics.MGA1DSMFlyby.prototype.constructor = astrodynamics.MGA1DSMFlyby;

astrodynamics.MGA1DSMFlyby.prototype.setBetaBounds = function (betaBounds) {
    var min = -2 * Math.PI > betaBounds[0] ? -2 * Math.PI : betaBounds[0];
    var max = 2 * Math.PI < betaBounds[1] ? 2 * Math.PI : betaBounds[1];
    this._bounds[0] = [min, max];
    this._resetPopulation();
};

astrodynamics.MGA1DSMFlyby.prototype.setRadiusBounds = function (radiusBounds) {
    var min = this._orbitingBodies[0].getSafeRadius() / this._orbitingBodies[0].getRadius();
    var max = this._orbitingBodies[0].getMaxRadius() / this._orbitingBodies[0].getRadius();
    min = min > radiusBounds[0] ? min : radiusBounds[0];
    max = max < radiusBounds[1] ? max : radiusBounds[1];
    this._bounds[1] = [min, max];
    this._resetPopulation();
};

astrodynamics.MGA1DSMFlyby.prototype.setTimeOfFlightBounds = function (timeOfFlightBounds) {
    this._bounds[3] = timeOfFlightBounds.clone();
    this._resetPopulation();
};

astrodynamics.MGA1DSMFlyby.prototype.objectiveFunction = function (individual) {
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

    var result = velocityBeginLeg.sub(propLagr.velocity).normEuclid();
    if (this._addArrivalVelocity) {
        result += velocityEndLeg.sub(ephNBody.velocity).normEuclid();
    }
    return result;
};