/* Class LaunchLeg
    A leg resulting from a launch
*/
astrodynamics.LaunchLeg = function (chromosome, currentBody, nextBody) {
    chromosome = chromosome.clone();
    var sgp = currentBody.getCentralBody().getStandardGravitationalParameter();

    var theta = 2 * Math.PI * chromosome[1];
    var phi = Math.acos(2 * chromosome[2] - 1) - Math.PI / 2;
    var velocityInf = new geometry.Vector3(chromosome[3] * Math.cos(phi) * Math.cos(theta), chromosome[3] * Math.cos(phi) * Math.sin(theta), chromosome[3] * Math.sin(phi));
    this._departureVelocityInf = velocityInf.clone();

    var ephCOBody = currentBody.orbitalStateVectorsAtEpoch(chromosome[0]);
    var ephNOBody = nextBody.orbitalStateVectorsAtEpoch(chromosome[0] + chromosome[5]);
    var velocityInfAbs = velocityInf.clone().add(ephCOBody.velocity);
    var position = ephCOBody.position.clone();
    var velocity = velocityInfAbs.clone();

    var propLagr = astrodynamics.propagateLagrangian(position, velocity, chromosome[4] * chromosome[5] * utility.DAY_TO_SEC, sgp);

    var dt = (1 - chromosome[4]) * chromosome[5] * utility.DAY_TO_SEC;
    var lambertProb = astrodynamics.lambertProblem(sgp, propLagr.position, ephNOBody.position, dt);
    this._arrivalVelocityInf = lambertProb.velocity2.clone().sub(ephNOBody.velocity);
};
astrodynamics.LaunchLeg.prototype = {
    constructor: astrodynamics.LaunchLeg,

    getArrivalVelocityInf: function () {
        return this._arrivalVelocityInf.clone();
    },

    getDepartureVelocityInf: function () {
        return this._departureVelocityInf.clone();
    }
};