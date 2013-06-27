/** elements.js
    Includes all constructor-functions for objects that can be added to a scene
*/
(function(){
    /* a hashmap mapping to the surface of the moons and planets */
    // TODO: the hashmaps are quite redundant - better encapsulate into the moon-object ~Marcus
    var surface_textures = {
        "Jupiter":"resources/images/jupiter_surface.jpg",
        "Io":"resources/images/io_surface.jpg",
        "Europa":"resources/images/europa_surface.jpg",
        "Ganymede":"resources/images/ganymede_surface.jpg",
        "Callisto":"resources/images/callisto_surface.jpg"
    };
    
    var moon_orbits = {
        "Io":rawdata.io_orbit,
        "Europa":rawdata.europa_orbit,
        "Ganymede":rawdata.ganymede_orbit,
        "Callisto":rawdata.callisto_orbit
    };

    var orbit_material = new THREE.LineBasicMaterial({
        color: 0x6666ff
    });

    /* creates an rgb orthogonal axis-system at the THREE.Vector3 origin
       with the given length */
    function create_helper_coordinate_system(origin, length) {

        var geometry = new THREE.Geometry();
        
        geometry.vertices.push(
            origin, new THREE.Vector3(length, 0, 0),
            origin, new THREE.Vector3(0, length, 0),
            origin, new THREE.Vector3(0, 0, length)
        );
        
        geometry.colors.push(
            new THREE.Color( 0xff0000 ), new THREE.Color( 0xff0000 ),
            new THREE.Color( 0x00ff00 ), new THREE.Color( 0x00ff00 ),
            new THREE.Color( 0x0000ff ), new THREE.Color( 0x0000ff )
        );
        
        var material = new THREE.LineBasicMaterial( {vertexColors:THREE.VertexColors } );
        
        return new THREE.Line(geometry, material, THREE.LinePieces );
    }
    
    
    /* creates the visualization of a moon orbit */
    function create_moon_orbit(moon) {
        var spline = new THREE.SplineCurve3(moon_orbits[moon.name]);
        var spline_points = spline.getPoints(100);
        var geo = new THREE.Geometry();
        
        for (var i = 0; i < spline_points.length; i++){
            geo.vertices.push(spline_points[i]);
        }
        
        return new THREE.Line(geo, orbit_material);
    }
    
    /* creates the visualization of Jupiter in the trajectory view 
       TODO: This method is very similar to create_moon_vis_model 
       and should be modified later ~Marcus*/
    function create_jupiter_vis_model() {

        var material = new THREE.MeshLambertMaterial(
        {
          map: THREE.ImageUtils.loadTexture(surface_textures["Jupiter"])
        });

        var geo = new THREE.SphereGeometry((R_JUP/10000000), 24, 24);
        var vis_model = new THREE.Mesh( geo, material);
        
        vis_model.rotation.setX(1.57);
        vis_model.name = "Jupiter";
        return vis_model;

    }
    
    /* creates the visualization of a moon in the trajectory view */
    function create_moon_vis_model(moon, ep) {

        var moon_material = new THREE.MeshLambertMaterial(
        {
          map: THREE.ImageUtils.loadTexture(surface_textures[moon.name])
        });
        var geo = new THREE.SphereGeometry((moon.radius/1000000), 24, 24);
        var vis_model = new THREE.Mesh( geo, moon_material);
		
        // Getting position with respect to reference epoch
        var eph = core.planet_ephemerides(ep, moon);
		var newpos = new THREE.Vector3(eph.r[0], eph.r[1], eph.r[2]);
		vis_model.position = newpos.divideScalar(ARC_SCALE);
        vis_model.rotation.setX(1.57);
        vis_model.name = moon.name;
        return vis_model;
    }

	
    /* create and returns the moon_name_sprite (that is the sprite containing the moon name) */
    function create_moon_name_sprite(moon, ep) {

		// The moon name will appear north from the moon center at this distance
		z_offset = 50000000; // (in meters)
	
		// We create a canvas element ...
		var canvas = document.createElement('canvas');
		var canvas_w = 512; 
		var canvas_h = 256; 
		canvas.width = canvas_w;
		canvas.height = canvas_h;
		
		var context = canvas.getContext('2d');
		context.fillStyle = '#01A9DB'; 
		context.textAlign = 'center';
		context.font = '96px Verdana';
		context.fillText(moon.name, canvas_w / 2, canvas_h/2);

		// ... transform it into a texture ...
		var text_texture = new THREE.Texture(canvas);
		text_texture.needsUpdate = true;

		// ... defining a material ...
		var mat = new THREE.SpriteMaterial({
		    map: text_texture,
		    transparent: true,
		    useScreenCoordinates: false,
		    color: 0xffffff // CHANGED
		});
		
		// ... used to build the 2D sprite
		var moon_name_sprite = new THREE.Sprite( mat );
		
		// Getting moon position with respect to reference epoch
        var eph = core.planet_ephemerides(ep, moon);
		var newpos = new THREE.Vector3(eph.r[0], eph.r[1], eph.r[2] + z_offset);
		moon_name_sprite.position = newpos.divideScalar(ARC_SCALE);
		moon_name_sprite.scale.set( canvas_w/4, canvas_h/4, 1.0 ); // imageWidth, imageHeight
        return moon_name_sprite;
    }

    
    function create_skybox() {
        var imagePrefix = "resources/images/skybox-";
        var directions  = ["xpos", "xneg", "ypos", "yneg", "zpos", "zneg"];
        var imageSuffix = ".png";
        var skyGeometry = new THREE.CubeGeometry( 21000, 21000, 21000 );	

        
        var materialArray = [];
        for (var i = 0; i < 6; i++)
            materialArray.push( new THREE.MeshBasicMaterial({
                map: THREE.ImageUtils.loadTexture( imagePrefix + directions[i] + imageSuffix ),
                side: THREE.BackSide
            }));
        var yMaterial = new THREE.MeshFaceMaterial( materialArray );
        return new THREE.Mesh( skyGeometry, yMaterial );
    }

    /* uses a loader to load the truncated icosahedron */
    function load_big_moon_model(moon) {
        var loader = new THREE.JSONLoader();

        // We cannot return the mesh directly, as the loader might take some time.
        // This callback-function will set the model property of the corresponding moon
        // to the loaded mesh.
        var cb_loading = function(geom) {
            var mesh = new THREE.Mesh(geom, new THREE.MeshLambertMaterial({color: 0xffffdd}));
            mesh.position.set( 0, 0, 0 );
            mesh.scale.set( moon.radius/1e6, moon.radius/1e6, moon.radius/1e6 );
            mesh.material.vertexColors = THREE.VertexColors;
            mesh.geometry.dynamic  = true;
            
            moon.model = mesh;
        };
      
        loader.load("resources/models/trunicos.js", cb_loading);
    }
    
gui.create_moon_vis_model = create_moon_vis_model;
gui.create_moon_name_sprite = create_moon_name_sprite;
gui.create_jupiter_vis_model = create_jupiter_vis_model;
gui.create_moon_orbit = create_moon_orbit;
gui.create_skybox = create_skybox;
gui.create_helper_coordinate_system = create_helper_coordinate_system;
gui.load_big_moon_model = load_big_moon_model


})();