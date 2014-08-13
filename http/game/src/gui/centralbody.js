/* Class CentralBody.
    Visual representation of astrodynamics.CentralBody
    Inherits astrodynamics.CentralBody
*/
gui.CentralBody = function (id, name, sgp, radius, scale, isStar, meshMaterialURL) {
    astrodynamics.CentralBody.call(this, id, name, sgp, radius);
    this._rotationY = 0.001;

    var mesh;
    if (isStar) {
        mesh = new THREE.Object3D();
        var light = new THREE.PointLight(0xffffff, 1, 0);
        mesh.add(light);
        var material = new THREE.MeshBasicMaterial();
        material.map = THREE.ImageUtils.loadTexture(meshMaterialURL);
        var meshGeometry = new THREE.SphereGeometry(radius * scale, 100, 100);
        mesh.add(new THREE.Mesh(meshGeometry, material));
    } else {
        var material = new THREE.MeshPhongMaterial();
        material.map = THREE.ImageUtils.loadTexture(meshMaterialURL)
        var meshGeometry = new THREE.SphereGeometry(radius * scale, 100, 100);
        mesh = new THREE.Mesh(meshGeometry, material);
        mesh.position = new THREE.Vector3(this._position.getX(), this._position.getY(), this._position.getZ());
    }
    mesh.rotation.x = 1.57;
    mesh.gID = this._id;
    this._bodyMesh = mesh;
};
gui.CentralBody.prototype = Object.create(astrodynamics.CentralBody.prototype);
gui.CentralBody.prototype.constructor = gui.CentralBody;

gui.CentralBody.prototype.getBodyMesh = function () {
    return this._bodyMesh;
};

gui.CentralBody.prototype.update = function () {
    this._bodyMesh.rotation.y += this._rotationY % (2 * Math.PI);
};