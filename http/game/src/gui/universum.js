/* Class Universum.
    Inherits THREE.Object3D
*/
gui.Universum = function (radius, centralBodyIsStar) {
    THREE.Object3D.call(this);
    this._id = gui.createID();

    var imageURLPrefix = 'res/img/skybox';
    var directions = ['xpos', 'xneg', 'ypos', 'yneg', 'zpos', 'zneg'];
    var imageSuffix = '.png';

    var meshGeometry = new THREE.BoxGeometry(radius, radius, radius);

    var materials = [];
    for (var i = 0; i < 6; i++)
        materials.push(new THREE.MeshBasicMaterial({
            map: THREE.ImageUtils.loadTexture(imageURLPrefix + directions[i] + imageSuffix),
            side: THREE.BackSide
        }));
    var material = new THREE.MeshFaceMaterial(materials);
    this.add(new THREE.Mesh(meshGeometry, material));

    radius /= 3;
    var amounts = [500, 2000, 2500, 5000];
    var sizes = [500, 300, 100, 200];

    for (var i = 0; i < 4; i++) {
        meshGeometry = new THREE.Geometry();
        for (var j = 0; j < amounts[i]; j++) {
            var u = Math.random();
            var v = Math.random();
            var theta = 2 * Math.PI * u;
            var phi = Math.acos(2 * v - 1);
            meshGeometry.vertices.push(new THREE.Vector3(
                radius * Math.sin(theta) * Math.cos(phi),
                radius * Math.sin(theta) * Math.sin(phi),
                radius * Math.cos(theta)
            ));
        }
        material = new THREE.ParticleBasicMaterial({
            color: 0x666666,
            map: THREE.ImageUtils.loadTexture(
                'res/img/particle.png'
            ),
            blending: THREE.AdditiveBlending,
            transparent: true
        });
        material.size = sizes[i];
        this.add(new THREE.ParticleSystem(meshGeometry, material));
    }

    var ambientLight = new THREE.AmbientLight(0x999999);
    this.add(ambientLight);
    if (!centralBodyIsStar) {
        var pointLight = new THREE.PointLight(0xFFFFDD);
        pointLight.position.set(-radius / 2, radius / 300, -radius / 6);
        this.add(pointLight);
    }
};
gui.Universum.prototype = Object.create(THREE.Object3D.prototype);
gui.Universum.prototype.constructor = gui.Universum;