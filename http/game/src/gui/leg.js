/* Leg Model
    Inherits THREE.Line
*/
gui.Leg = function (chromosome, currentOBody, nextOBody, velocityInf, epoch) {
    chromosome = chromosome.clone();
    var velocityInf = velocityInf.clone();

    var sgp = currentOBody.getCentralBody().getStandardGravitationalParameter();

    var ephCOBody = currentOBody.orbitalStateVectorsAtEpoch(epoch);
    var ephNOBody = nextOBody.orbitalStateVectorsAtEpoch(epoch + chromosome[3]);

    var legPoints = [];

    var velocityInfAbs = velocityInf.clone().add(ephCOBody.velocity);
    var position = ephCOBody.position.clone();
    var velocity = velocityInfAbs.clone();

    var velocityInfOut = astrodynamics.flybyPropagation(velocity, ephCOBody.velocity, chromosome[0], chromosome[1] * currentOBody.getRadius(), currentOBody.getStandardGravitationalParameter());

    this._departingVelocityInf = velocityInfOut.clone().sub(ephCOBody.velocity);

    var propLagr = astrodynamics.propagateLagrangian(position, velocityInfOut, chromosome[2] * chromosome[3] * utility.DAY_TO_SEC, sgp);
    var lambertProb = astrodynamics.lambertProblem(sgp, propLagr.position, ephNOBody.position, (1 - chromosome[2]) * chromosome[3] * utility.DAY_TO_SEC, false);

    this._arrivingVelocityInf = lambertProb.velocity2.clone().sub(ephNOBody.velocity);

    legPoints.push(ephCOBody.position.asTHREE().multiplyScalar(gui.POSITION_SCALE));

    var tmpPropLagr = {
        position: ephCOBody.position,
        velocity: velocityInfOut
    };

    for (var i = 0; i < 1000; i++) {
        var tmpPropLagr2 = astrodynamics.propagateLagrangian(tmpPropLagr.position, tmpPropLagr.velocity, (chromosome[2] * chromosome[3] * utility.DAY_TO_SEC) / 1000, sgp);
        legPoints.push(tmpPropLagr2.position.asTHREE().multiplyScalar(gui.POSITION_SCALE));
        tmpPropLagr = tmpPropLagr2;
    }

    legPoints.push(propLagr.position.asTHREE().multiplyScalar(gui.POSITION_SCALE));

    var tmpPropLagr = {
        position: propLagr.position,
        velocity: lambertProb.velocity1
    };

    for (var i = 0; i < 1000; i++) {
        var tmpPropLagr2 = astrodynamics.propagateLagrangian(tmpPropLagr.position, tmpPropLagr.velocity, ((1 - chromosome[2]) * chromosome[3] * utility.DAY_TO_SEC) / 1000, sgp);
        legPoints.push(tmpPropLagr2.position.asTHREE().multiplyScalar(gui.POSITION_SCALE));
        tmpPropLagr = tmpPropLagr2;
    }

    legPoints.push(ephNOBody.position.asTHREE().multiplyScalar(gui.POSITION_SCALE));

    var spline = new THREE.SplineCurve3(legPoints);
    var meshGeometry = new THREE.Geometry();
    var splinePoints = spline.getPoints(1000);

    for (var i = 0; i < splinePoints.length; i++) {
        meshGeometry.vertices.push(splinePoints[i]);
    }

    var material = new THREE.LineBasicMaterial({
        color: 0xff0000,
        wireframe: true,
        wireframe_linewidth: 3,
        linewidth: 1,
        opacity: 0.1
    });

    THREE.Line.call(this, meshGeometry, material);
};
gui.Leg.prototype = Object.create(THREE.Line.prototype);
gui.Leg.prototype.constructor = gui.Leg;

gui.Leg.prototype.getArrivingVelocityInf = function () {
    return this._arrivingVelocityInf.clone();
};

gui.Leg.prototype.getDepartingVelocityInf = function () {
    return this._departingVelocityInf.clone();
};

gui.Leg.prototype.setGradient = function (value) {
    value = Math.max(0, Math.min(1, value));
    this.material.opacity = 1;
    this.material.transparent = true;
    var red = 1 - value;
    var green = value;
    this.material.color.setRGB(red, green, 0);
};