/* Class FlybyLeg
    A leg resulting from a flyby
*/
astrodynamics.FlybyLeg = function (chromosome, currentOBody, nextOBody, velocityInf, epoch) {
    chromosome = chromosome.clone();
    var velocityInf = velocityInf.clone();

    var sgp = currentOBody.getCentralBody().getStandardGravitationalParameter();

    var ephCOBody = currentOBody.orbitalStateVectorsAtEpoch(epoch);
    var ephNOBody = nextOBody.orbitalStateVectorsAtEpoch(epoch + chromosome[3]);

    var velocityInfAbs = velocityInf.clone().add(ephCOBody.velocity);
    var position = ephCOBody.position.clone();
    var velocity = velocityInfAbs.clone();

    var velocityInfOut = astrodynamics.flybyPropagation(velocity, ephCOBody.velocity, chromosome[0], chromosome[1] * currentOBody.getRadius(), currentOBody.getStandardGravitationalParameter());

    this._departureVelocityInf = velocityInfOut.clone().sub(ephCOBody.velocity);

    var propLagr = astrodynamics.propagateLagrangian(position, velocityInfOut, chromosome[2] * chromosome[3] * utility.DAY_TO_SEC, sgp);
    var lambertProb = astrodynamics.lambertProblem(sgp, propLagr.position, ephNOBody.position, (1 - chromosome[2]) * chromosome[3] * utility.DAY_TO_SEC, false);

    this._arrivalVelocityInf = lambertProb.velocity2.clone().sub(ephNOBody.velocity);
};
astrodynamics.FlybyLeg.prototype = {
    constructor: astrodynamics.FlybyLeg,

    getArrivalVelocityInf: function () {
        return this._arrivalVelocityInf.clone();
    },

    getDepartureVelocityInf: function () {
        return this._departureVelocityInf.clone();
    }
};