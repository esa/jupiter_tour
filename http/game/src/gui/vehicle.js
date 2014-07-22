/* Class Vehicle
    GUI extension of model class Vehicle
    Inherits model.Vehicle
*/
gui.Vehicle = function (velocityInf, stages, isLanded) {
    model.Vehicle.call(this, velocityInf, stages, isLanded);
};
gui.Vehicle.prototype = Object.create(model.Vehicle.prototype);
gui.Vehicle.prototype.constructor = gui.Vehicle;

gui.Vehicle.prototype.getStageImageURL = function (numStage) {
    numStage = numStage != null ? Math.min(this._stages.length - 1, numStage) : this._stages.length - 1;
    return this._stages[numStage].getImageURL();
};

gui.Vehicle.prototype.clone = function () {
    return new gui.Vehicle(this._velocityInf, this._stages, this._isLanded);
};