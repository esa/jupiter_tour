/* Class SphericalSurface
    Represents the SmallBody surface as a simple sphere.
    Inherits Surface
 */
model.SphericalSurface = function (orbitingBody, surfaceValues) {
    model.Surface.call(this, orbitingBody);
    this._value = surfaceValues['0'];
};
model.SphericalSurface.prototype = Object.create(model.Surface.prototype);
model.SphericalSurface.prototype.constructor = model.SphericalSurface;

model.SphericalSurface.prototype.getFaceValue = function () {
    return this._value;
};