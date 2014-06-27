/* Class CentralBody. Model & View */
gui.CentralBody = function (id, name, sgp, radius, scale, isStar, meshMaterialURL) {
    this._id = id;
    this._name = name;
    this._radius = radius;
    this._sgp = sgp;
    this._position = new geometry.Vector3();
    this._rotationY = 0.001;

    var mesh;
    if (isStar) {
        mesh = new THREE.Object3D();
        var light = new THREE.PointLight(0xffffff, 1, 0);
        mesh.add(light);
        var material = new THREE.MeshBasicMaterial();
        material.map = THREE.ImageUtils.loadTexture(meshMaterialURL);
        var meshGeometry = new THREE.SphereGeometry(radius * scale, 24, 24);
        mesh.add(new THREE.Mesh(meshGeometry, material));
    } else {
        var material = new THREE.MeshPhongMaterial();
        material.map = THREE.ImageUtils.loadTexture(meshMaterialURL)
        var meshGeometry = new THREE.SphereGeometry(radius * scale, 24, 24);
        mesh = new THREE.Mesh(meshGeometry, material);
        mesh.position = this._position.asTHREE();
    }
    mesh.rotation.x = 1.57;
    mesh.gID = this._id;
    this._bodyMesh = mesh;
};
gui.CentralBody.prototype = {
    constructor: gui.Star,

    getBodyMesh: function () {
        return this._bodyMesh;
    },

    getName: function () {
        return this._name;
    },

    getPosition: function () {
        return this._position.clone();
    },

    getRadius: function () {
        return this._radius;
    },

    getStandardGravitationalParameter: function () {
        return this._sgp;
    },

    update: function () {
        this._bodyMesh.rotation.y += this._rotationY % (2 * Math.PI);
    }
};