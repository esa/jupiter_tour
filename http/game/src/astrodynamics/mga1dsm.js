/* Class MGA1DSM
    MGA-1DSM for two celestial bodies.
    Inherits JDEProblem
*/
astrodynamics.MGA1DSM = function (currentbody, nextBody, launchEpochBounds, velocityBounds, timeOfFlightBounds, populationSize) {
    datastructure.JDEProblem.call(this);
    this._orbitingBodies = [currentbody, nextBody];
    this._dimension = 6;
    this._bounds = [];
    this._population = [];
    this._populationSize = populationSize || 30;

    this._bounds[0] = launchEpochBounds.clone();
    this._bounds[1] = [0, 1];
    this._bounds[2] = [0, 1];
    this._bounds[3] = velocityBounds.clone();
    this._bounds[4] = [1e-5, 1 - 1e-5];
    this._bounds[5] = timeOfFlightBounds.clone();

    this._resetPopulation();
};
astrodynamics.MGA1DSM.prototype = Object.create(datastructure.JDEProblem.prototype);
astrodynamics.MGA1DSM.prototype.constructor = astrodynamics.MGA1DSM;

astrodynamics.MGA1DSM.prototype.setLaunchEpochBounds = function (launchEpochBounds) {
    this._bounds[0] = launchEpochBounds.clone();
};

astrodynamics.MGA1DSM.prototype.setVelocityBounds = function (velocityBounds) {
    this._bounds[3] = velocityBounds.clone();
};

astrodynamics.MGA1DSM.prototype.setTimeOfFlightBounds = function (timeOfFlightBounds) {
    this._bounds[5] = timeOfFlightBounds.clone();
};

astrodynamics.MGA1DSM.prototype.objectiveFunction = function (individual) {
    var sgp = this._orbitingBodies[0].getCentralBody().getStandardGravitationalParameter();
    var chromosome = individual.getChromosome();

    var ephCBody = this._orbitingBodies[0].orbitalStateVectorsAtEpoch(chromosome[0]);
    var ephNBody = this._orbitingBodies[1].orbitalStateVectorsAtEpoch(chromosome[0] + chromosome[5]);

    var theta = 2 * Math.PI * chromosome[1];
    var phi = Math.acos(2 * chromosome[2] - 1) - Math.PI / 2;

    var velocityInf = new geometry.Vector3(chromosome[3] * Math.cos(phi) * Math.cos(theta), chromosome[3] * Math.cos(phi) * Math.sin(theta), chromosome[3] * Math.sin(phi));
    var velocityV0 = velocityInf.clone().add(ephCBody.velocity);
    var position = ephCBody.position.clone();
    var velocity = velocityV0.clone();

    var propLagr = astrodynamics.propagateLagrangian(position, velocity, chromosome[4] * chromosome[5] * utility.DAY_TO_SEC, sgp);

    var dt = (1 - chromosome[4]) * chromosome[5] * utility.DAY_TO_SEC;
    var lambertProb = astrodynamics.lambertProblem(sgp, propLagr.position, ephNBody.position, dt);
    var velocityEndLeg = lambertProb.velocity2;
    var velocityBeginLeg = lambertProb.velocity1;

    return velocityBeginLeg.sub(propLagr.velocity).normEuclid();
};