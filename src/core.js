/* core.js - for maintaining core-functions of key components and helper functions for
   object manipulation. 
   NOTE: core does not know about global objects (i.e. ganymede, io, etc.), so don't use them inside here. */
(function(){

// moon constructor function
function Moon(name, a, e, i, LAN, w, M, radius, mu, model) {
    this.name = name;
    this.epoch = 58849.0;	// MJD [day]
    this.a = a;				// [m]
    this.e = e;				// []
    this.i = i;				// [deg]
    this.LAN = LAN;			// [deg]
    this.w = w;				// [deg]
    this.M = M;				// [deg]
    this.radius = radius;	// [m]
    this.safeRadius = radius + (50.0*1000.0);	// [m]
    this.mu = mu;			// [m^3/s^2]
    this.feasibles = {faces: [], beta: [], rp: []};
    this.selected = new Array(32);
    this.locked = new Array(0);
    this.model = model;
    this.vis_model;
    this.scene;
	
	// These function apply and remove green colour from the moons vis_model. 
    // Used to indicate the moon currently being visited in the trajectory scene
	this.highlight = function() {
        this.vis_model.material.emissive = new THREE.Color(0x00ff00);
		this.vis_model.material.ambient = new THREE.Color(0x00ff00);  
    };
								  
	this.unhighlight = function() {
        this.vis_model.material.emissive = new THREE.Color(0x000000);
		this.vis_model.material.ambient = new THREE.Color(0xffffff);  
    };
								  
	this.get_face_value = function(face_index) {  		
		if (this.name === "Io") return core.io_face_values[face_index];
		else if (this.name === "Europa") return core.europa_face_values[face_index];
		else if (this.name === "Ganymede") return core.ganymede_face_values[face_index];
		else if (this.name === "Callisto") return core.callisto_face_values[face_index];
    };
	
	this.set_face_value = function(face_index, value) {  		
		if (this.name === "Io") core.io_face_values[face_index] = value;
		else if (this.name === "Europa") core.europa_face_values[face_index] = value;
		else if (this.name === "Ganymede") core.ganymede_face_values[face_index] = value;
		else if (this.name === "Callisto") core.callisto_face_values[face_index] = value;
    };
    
    // Animation method for the moon, called from the main-loop.
    this.animate = function() {
        
        var ROTATIONY = 0.005;  // Rotation speed
        var SCALESPEED = 0.15;  // Speed of scaling animation
        var MAXSIZE = 12;       // Maximal size of the moon by for hovering
        
        // Funny Rotation
        this.vis_model.rotation.setY((this.vis_model.rotation.y + ROTATIONY) % (2 * Math.PI));
        
        // Scaling if mouse is hovering over moon
        var size = this.vis_model.scale.lengthManhattan();
        
        if (this.name === gui.intersect) {
            if (size < MAXSIZE) {
                this.vis_model.scale.multiplyScalar(1 + SCALESPEED);
            }
        } else {
            if (size > 3) {
                this.vis_model.scale.multiplyScalar(1 - SCALESPEED);
            } else {
                this.vis_model.scale.set(1,1,1);
            }
        }
    };
    
}


function Arc(){

	tour.leg_arcs.push(this);
	this.vis_line = null;
	this.draw = function (){ gui.scene_trajectory.add(this.vis_line); };
	this.material = new THREE.LineBasicMaterial({color: 0xff0000 , wireframe: true, wireframe_linewidth: 3, linewidth: 1, opacity: 0.1});

	this.create = function(){

		var x = tour.x;
		var m_seq = tour.m_seq;
		var mission_epoch = tour.mission_epoch;
		var v_inf = tour.end_leg_v_infs[tour.end_leg_v_infs.length-1];
		
		console.log("X: " + x);
		console.log("M_SEQ: " + m_seq);
		console.log("MISSION_EPOCH: " + mission_epoch);
		console.log("V_INF: " + v_inf);

		var arc_points = new Array(0);
		
		var leg = m_seq.length-2; // the number of the starting moon in the visited moon sequence for this trajectory leg
		
		console.log("LEG: " + leg);
		
		if (m_seq.length <= 1 || typeof(m_seq) == "undefined" || 
			v_inf.length != 3 || typeof(v_inf) == "undefined" || 
			ref_epoch < 58849 || typeof(ref_epoch) == "undefined" || 
			x.length != (m_seq.length-1)*4 || typeof(x) == "undefined") {
				console.log("\n\nINVALID TRAJECTORY ELEMENTS!\n\n");
		}
			
			var leg = m_seq.length-2; // the number of the starting moon in the visited moon sequence for this trajectory leg
			
			if (m_seq.length <= 1 || typeof(m_seq) == "undefined" || 
				v_inf.length != 3 || typeof(v_inf) == "undefined" || 
				ref_epoch < 58849 || typeof(ref_epoch) == "undefined" || 
				x.length != (m_seq.length-1)*4 || typeof(x) == "undefined") {
					console.log("\n\nINVALID TRAJECTORY ELEMENTS!\n\n");
			}
				
			else {
				
				var vis_v_sc = v_inf;
					
					var vis_m0_eph = core.planet_ephemerides(mission_epoch - x[x.length-1], m_seq[leg]);
					var vis_m1_eph = core.planet_ephemerides(mission_epoch, m_seq[leg+1]);
					
					if (leg === 0) {
						vis_v_sc = core.addition(v_inf, vis_m0_eph.v);
					}
					
					var vis_v_out = core.fb_prop(vis_v_sc, vis_m0_eph.v, x[leg*4], x[leg*4+1]*m_seq[leg].radius, m_seq[leg].mu);
					
					var vis_pl = core.propagate_lagrangian(vis_m0_eph.r, vis_v_out, x[leg*4+2]*x[leg*4+3]*DAY2SEC, MU_JUP);
					
					var vis_lp = core.lambert_problem(vis_pl.r, vis_m1_eph.r, (1-x[leg*4+2])*x[leg*4+3]*DAY2SEC, false);
					
					vis_v_sc = vis_lp.v2;
					
					arc_points.push(new THREE.Vector3(vis_m0_eph.r[0]/ARC_SCALE, vis_m0_eph.r[1]/ARC_SCALE, vis_m0_eph.r[2]/ARC_SCALE));
					
					var temp_vis_pl = {r: vis_m0_eph.r, v: vis_v_out};
					
					for (var w = 0; w < 1000; w++){
						
						var temp_vis_pl_2 = core.propagate_lagrangian(temp_vis_pl.r, temp_vis_pl.v, (x[leg*4+2]*x[leg*4+3]*DAY2SEC)/1000, MU_JUP);
						arc_points.push(new THREE.Vector3(temp_vis_pl_2.r[0]/ARC_SCALE, temp_vis_pl_2.r[1]/ARC_SCALE, temp_vis_pl_2.r[2]/ARC_SCALE));
						temp_vis_pl = temp_vis_pl_2;
					}
					
					arc_points.push(new THREE.Vector3(vis_pl.r[0]/ARC_SCALE, vis_pl.r[1]/ARC_SCALE, vis_pl.r[2]/ARC_SCALE));
					
					var temp_vis_pl_after = {r: vis_pl.r, v: vis_lp.v1};
					
					for (var u = 0; u < 1000; u++){
						
						var temp_vis_pl_after_2 = core.propagate_lagrangian(temp_vis_pl_after.r, temp_vis_pl_after.v, ((1-x[leg*4+2])*x[leg*4+3]*DAY2SEC)/1000, MU_JUP);
						arc_points.push(new THREE.Vector3(temp_vis_pl_after_2.r[0]/ARC_SCALE, temp_vis_pl_after_2.r[1]/ARC_SCALE, temp_vis_pl_after_2.r[2]/ARC_SCALE));
						temp_vis_pl_after = temp_vis_pl_after_2;
					}
					
					  arc_points.push(new THREE.Vector3(vis_m1_eph.r[0]/ARC_SCALE, vis_m1_eph.r[1]/ARC_SCALE, vis_m1_eph.r[2]/ARC_SCALE));
					
					  var spline_arc = new THREE.SplineCurve3(arc_points);		  
					  var geometry_arc = new THREE.Geometry();
					  var splinePoints_arc = spline_arc.getPoints(1000);

					  for(var i = 0; i < splinePoints_arc.length; i++){
						geometry_arc.vertices.push(splinePoints_arc[i]);
					  }

						var end_v_inf = core.subtraction(vis_v_sc, core.planet_ephemerides(mission_epoch, m_seq[leg+1]).v);
						tour.leg_v_infs.push(end_v_inf);
						tour.end_leg_v_infs.push(vis_v_sc);
						
						this.vis_line = new THREE.Line(geometry_arc, this.material);
			}
		}  
		
}







function contains(arr, value) {

    var i = arr.length;
    while (i--) {
        if (arr[i] === value) return true;
    }
    return false;
}

function median(array){

	array.sort(function(a, b) { return a - b; });	
	var half = Math.floor(array.length/2);
 
    if(array.length % 2) return array[half];
    else return (array[half-1] + array[half]) / 2.
}

function mean(array){
	var m = 0;
	for (i in array){
		m += array[i];
	}
	m = m/(array.length);
	return m;
}

function min(array){
	if (array.length >1) {
		array.sort(function(a, b) { return a - b; });
		return array[0];
	}
	else if (array.length == 1) return array[0];
		else {
		console.log("MIN: ARRAY EMPTY!")
		return null;
	}
}

function max(array){
	
	if (array.length >1) {
		array.sort(function(a, b) { return a - b; });
		return array[array.length-1];
	}
	else if (array.length == 1) return array[0];
	else {
		console.log("MAX: ARRAY EMPTY!")
		return null;
	}
}

function remove(array, from, to) {
  var rest = array.slice((to || from) + 1 || array.length);
  array.length = from < 0 ? array.length + from : from;
  return array.push.apply(array, rest);
};

var clone = (function(){ 
  return function (obj) { Clone.prototype=obj; return new Clone() };
  function Clone(){}
}());

function create_population(prob) {
    var arr = [];    
    for (var i = 0; i < 30; i++) {
        arr.push(new core.individual(prob));
    }
    return arr;
}

function get_camera(scene){
	
	for(var i = 0; i < scene.children.length; i++){
		if (scene.children[i].name.search("Camera") !== -1) {
			return scene.children[i];
        }
    }
    return undefined;
}

core.contains = contains;
core.median = median;
core.mean = mean;
core.min = min;
core.max = max;
core.remove = remove;
core.clone = clone;
core.create_population = create_population;
core.get_camera = get_camera;

core.Moon = Moon;
core.Arc = Arc;


})();

// global moon variables + object
var io = new core.Moon('Io', 422029687.14001, 4.308524661773e-03, 40.11548686966e-03, -79.640061742992, 37.991267683987, 286.85240405645, 1826.5e3, 5959.916e9, null, null);
var europa = new core.Moon('Europa', 671224237.12681, 9.384699662601e-03, 0.46530284284480, -132.15817268686, -79.571640035051, 318.00776678240, 1561.0e3, 3202.739e9, null, null);
var ganymede = new core.Moon('Ganymede', 1070587469.23740, 1.953365822716e-03, 0.13543966756582, -50.793372416917, -42.876495018307, 220.59841030407, 2634.0e3, 9887.834e9, null, null);
var callisto = new core.Moon('Callisto', 1883136616.73050, 7.337063799028e-03, 0.25354332731555, 86.723916616548, -160.76003434076, 321.07650614246, 2408.0e3, 7179.289e9, null, null);

var moon_name_map = {
    "Io": io,
    "Europa":europa,
    "Ganymede":ganymede,
    "Callisto":callisto
};

var moons = [io, europa, ganymede, callisto];

// global object for encapsulating all information about the trajectory the player generated
var tour = {
        tofs:[],
        m_seq:[ganymede],
        mission_epoch:58849,
        x:[],
		leg_dvs:[],		// collection of all DV values for each trajectory leg
		flyby_scores:[],	// collection of all face values scored for each trajectory leg
		leg_v_infs: [[-1000,400,-1000]],
		leg_arcs: [],
		end_leg_v_infs:[[-1000,400,-1000]]
};