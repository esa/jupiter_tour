/* Class Stage
    GUI extension of model class Stage
    Inherits model.Stage
*/
gui.Stage = function (propulsionType, totalMass, emptyMass, remainingMass, thrust, specificImpulse, imageURL) {
    model.Stage.call(this, propulsionType, totalMass, emptyMass, remainingMass, thrust, specificImpulse);
    this._imageURL = imageURL;
};
gui.Stage.prototype = Object.create(model.Stage.prototype);
gui.Stage.prototype.constructor = gui.Stage;

gui.Stage.prototype.getImageURL = function () {
    return this._imageURL;
};

gui.Stage.prototype.clone = function () {
    return new gui.Stage(this._propulsionType, this._totalMass, this._emptyMass, this._remainingMass, this._thrust, this._specificImpulse, this._imageURL);
};