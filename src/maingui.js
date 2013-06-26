(function(){

var scene_trajectory = new THREE.Scene();
    // create and add the trajectory view camera
	camera_trajectory = new THREE.PerspectiveCamera(
      15,     // Field of view
      window.innerWidth / window.innerHeight,  // Aspect ratio
      0.1,    // Near
      20000   // Far
	);
	camera_trajectory.name = "Camera trajectory";
	camera_trajectory.position.set( -70, -900, 200 );
	camera_trajectory.lookAt(scene_trajectory.position);
	scene_trajectory.add(camera_trajectory);

function update() {
    // get camera temporary
    var camera = core.get_camera(gui.scene);
	
    if (camera !== undefined) {
        // cast a Ray through the origin of  he mouse position towards the camera direction
        var vector = new THREE.Vector3( gui.mouse.x, gui.mouse.y, 1 );
        gui.projector.unprojectVector( vector, camera );
        var ray = new THREE.Raycaster( camera.position, vector.subVectors(vector, camera.position).normalize() );

        // create an array containing all objects in the scene with which the ray intersects
        var intersects = ray.intersectObjects(gui.clickable_objects);

        // get the closest object that is intersected (if there is one) and save its name in the gui
        gui.intersect = intersects.length > 0 ? intersects[0].object.name : undefined;
    }
}

/**
	@param in moon - the moon on which the last selected face should be confirmed as the face to fly over.
	Adds the last selected face of moon to an array of faces which have already been visited and paints them blue.
*/
function lockFace(moon){
	
	if (gui.last_selected != null){
	
		moon.locked.push(gui.last_selected);
	
		moon.model.geometry.faces[core.faces_3d[gui.last_selected][0]].color = new THREE.Color(0x0000ff);
		moon.model.geometry.faces[core.faces_3d[gui.last_selected][1]].color = new THREE.Color(0x0000ff);
		
		gui.last_selected = null;
		//gui.control.set_face_defaults();
		
		moon.model.geometry.colorsNeedUpdate = true;
	}
}

/**
	@param in moon - moon on which the face should be painted
	@param in face_nr - the visitable face which should be painted
	Paints a visitable face green to show the user which parts of the moon can be flown over.
*/
function paintFeasibleFace(moon, face_nr){
		
	if (!core.contains(moon.locked, face_nr)){
		moon.model.geometry.faces[core.faces_3d[face_nr][0]].color = new THREE.Color(0x00ff00);
		moon.model.geometry.faces[core.faces_3d[face_nr][1]].color = new THREE.Color(0x00ff00);
    }
	else {
		moon.model.geometry.faces[core.faces_3d[face_nr][0]].color = new THREE.Color(0x0000ff);
		moon.model.geometry.faces[core.faces_3d[face_nr][1]].color = new THREE.Color(0x0000ff);
	}
		moon.model.geometry.colorsNeedUpdate = true;
        render();
}

function clearPaint(moon){
	for (face in core.faces_3d){
		if (!core.contains(moon.locked, face)){
			moon.model.geometry.faces[core.faces_3d[face][0]].color = new THREE.Color(0xfffffe);
			moon.model.geometry.faces[core.faces_3d[face][1]].color = new THREE.Color(0xfffffe);
		}
	}
	
	moon.model.geometry.colorsNeedUpdate = true;
	render();
}

/**
@param in t - epoch of the spacecraft's flyby by the moon [MJD]
@param in moon - which moon the flyby was at
@param in vinf_in - 3D vector of velocity at flyby

Function responsible for painting the selected moon's visitable faces
*/
function show_feas_faces(t, moon, vinf_in){

    // shortcuts
    var current_moon = gui.current_moon;
    
    current_moon.feasibles = [];
    
    var ff = core.feas_faces(t, moon, vinf_in);
    current_moon.feasibles.faces = ff.f.slice(0);
    current_moon.feasibles.beta = ff.beta.slice(0);
    current_moon.feasibles.rp = ff.rp.slice(0);
    
    if (gui.last_selected != null){
        gui.last_selected = null;
		gui.control.set_face_defaults();
    }
    
    clearPaint(current_moon);

    for (face in ff.f){
        paintFeasibleFace(current_moon, ff.f[face]);
    }
    
    //console.log("\n \n FEASIBLE FACES: ");
    //console.log(ff);
}

/**
	Adding constraints and listeners to the GUI controls.
*/
function setup(){
	// TODO: Using arrays or objects instead of all these single variables. I.e.: beta = { lower: -5.0, upper: 5.0 } ~Marcus
    gc = {	moon: tour.m_seq[tour.m_seq.length-1].name,
            face: "None",
			face_value: "0",
            score: 0,
            dv: tour.total_dv,
            time: max_mission_tof,
            mass: 2000,
			leg_tof: 50,
            beta_lower: -6.3,
            beta_upper: 6.3,
            rp_lower: 0.1,
            rp_upper: 5.0,

            back: function() { 
                if (!traj_view) { // when in moon view going back to trajectory view
					gui.scene = scene_trajectory;
					switch_scene(null);
                    gui.control.set_face_defaults();
                }
				else if (tour.m_seq.length > 1  && face_select_phase){ // when in trajectory view selecting the next face to visit going back to moon selection phase
				
					tour.mission_epoch -= tour.x[tour.x.length-1];
					gui.control.time += tour.x[tour.x.length-1];
					move_moons(tour.mission_epoch);
					
					
					// var n = tour.flyby_scores[tour.flyby_scores.length-1];
					// gui.control.score -= n[1];
					// tour.m_seq[tour.m_seq.length-2].set_face_value(n[0],n[1]);
					// tour.m_seq[tour.m_seq.length-2].locked = tour.m_seq[tour.m_seq.length-2].locked.slice(0, tour.m_seq[tour.m_seq.length-2].locked.length-1);
					// tour.flyby_scores = tour.flyby_scores.slice(0, tour.flyby_scores.length-1);
					
					tour.m_seq[tour.m_seq.length-1].unhighlight();
					tour.x  = tour.x.slice(0, tour.x.length-4);
					tour.m_seq = tour.m_seq.slice(0, tour.m_seq.length-1);
					//gui.control.dv -= tour.leg_dvs[tour.leg_dvs.length-1];
					
					tour.total_dv -= tour.leg_dvs[tour.leg_dvs.length-1];
					gui.control.dv = tour.total_dv;
					
					tour.leg_dvs = tour.leg_dvs.slice(0, tour.leg_dvs.length-1);
					tour.leg_v_infs = tour.leg_v_infs.slice(0, tour.leg_v_infs.length-1);
					tour.end_leg_v_infs = tour.end_leg_v_infs.slice(0, tour.end_leg_v_infs.length-1);
					
					gui.scene.remove(tour.leg_arcs[tour.leg_arcs.length-1].vis_line);
					tour.leg_arcs = tour.leg_arcs.slice(0, tour.leg_arcs.length-1);	
					
					gui.control.moon = tour.m_seq[tour.m_seq.length-1].name;				
					tour.m_seq[tour.m_seq.length-1].highlight();
					
					core.calculate_sc_mass();
					gui.control.mass = tour.m_sc;
					
					face_select_phase = false;
					
					gui.instructions.innerHTML = "Select the next moon to visit!";
					
					if (tour.leg_arcs.length > 0)colour_arcs();
				}
				else if (tour.m_seq.length > 0  && !face_select_phase){ // when in traj view selecting the next moon to visit going back to face selection phase
					
					var n = tour.flyby_scores[tour.flyby_scores.length-1];
					gui.control.score -= n[1];
					tour.m_seq[tour.m_seq.length-1].set_face_value(n[0],n[1]);
					tour.m_seq[tour.m_seq.length-1].locked = tour.m_seq[tour.m_seq.length-1].locked.slice(0, tour.m_seq[tour.m_seq.length-1].locked.length-1);
					tour.flyby_scores = tour.flyby_scores.slice(0, tour.flyby_scores.length-1);
					
					face_select_phase = true;
					
					gui.control.set_face_defaults();
					
					gui.instructions.innerHTML = "Select the next face to visit!";
					
				}
            },
			
			set_face_attributes: function(face, face_value, beta_lower, beta_upper, rp_lower, rp_upper){								
								gui.control.face = face;
								gui.control.face_value = face_value;
								gui.control.beta_lower = beta_lower;
								gui.control.beta_upper = beta_upper;
								gui.control.rp_lower = rp_lower;
								gui.control.rp_upper = rp_upper;
			},
			
			set_face_defaults: function(){
								gui.control.moon = tour.m_seq[tour.m_seq.length-1].name;
								gui.control.face = "None";
								gui.control.face_value = 0;
								
								if(gui.control.time < gui.control.leg_tof) gui.control.leg_tof = gui.control.time;
								
								gui.control.beta_lower = -6.2;
								gui.control.beta_upper = 6.2;
								gui.control.rp_lower = 0.1;
								gui.control.rp_upper = 5.0;
			}
        }
	
    // load the truncated icosahedrons into the moon objects.
    for (i in moons) {
        gui.load_big_moon_model(moons[i]);
    }

	var gui_setup = new dat.GUI({ height : 13 * 32 - 1, width: 280 });
	
    gui_setup.add(gc, 'moon').name('Moon').listen();
	gui_setup.add(gc, 'face').name('Face No.').onChange(function(newValue){if (gui.last_selected == null || newValue==null || newValue == undefined) gc.face = "None";}).listen();
	gui_setup.add(gc, 'face_value').name('Face Value').listen();
	
	gui_setup.add(gc, 'score').name('Score').onChange(function(newValue){if (newValue < 0) gc.score = 0; if (newValue > 324) gc.score = 324;}).listen();
	gui_setup.add(gc, 'dv').name('DV').listen();
	gui_setup.add(gc, 'time').name('Remaining Time').listen();
	gui_setup.add(gc, 'mass').name('S/C Mass').listen();
	
	var bounds_folder = gui_setup.addFolder('Flyby Bounds');
	bounds_folder.add(gc, 'leg_tof', 1, 50).listen().name('Max Leg TOF');
	bounds_folder.add(gc, 'beta_lower', -6.3, 6.3).listen().step(0.1).name('Beta Lower Bound').onChange(function(newValue){if (gc.beta_lower >= gc.beta_upper) gc.beta_lower = gc.beta_upper-0.01;
																															else if (newValue < gui.beta_bounds.lower) gc.beta_lower = gui.beta_bounds.lower;});
	bounds_folder.add(gc, 'beta_upper', -6.3, 6.3).listen().step(0.1).name('Beta Upper Bound').onChange(function(newValue){if (gc.beta_upper <= gc.beta_lower) gc.beta_upper = gc.beta_lower+0.01;
																															else if (newValue > gui.beta_bounds.upper) gc.beta_upper = gui.beta_bounds.upper;});
	bounds_folder.add(gc, 'rp_lower', 0.0, 5.0).listen().step(0.01).name('RP Lower Bound').onChange(function(newValue){if (gc.rp_lower >= gc.rp_upper) gc.rp_lower = gc.rp_upper-0.01;
																														else if (newValue < gui.rp_bounds.lower) gc.rp_lower = gui.rp_bounds.lower;});
	bounds_folder.add(gc, 'rp_upper', 0.0, 5.0).listen().step(0.01).name('RP Upper Bound').onChange(function(newValue){if (gc.rp_upper <= gc.rp_lower) gc.rp_upper = gc.rp_lower+0.01;
																														else if (newValue > gui.rp_bounds.upper) gc.rp_upper = gui.rp_bounds.upper;});
	
	gui_setup.add(gc, 'back').name('Go Back').listen();
    
	gui.gui_setup = gui_setup;
	
    gui.control = gc;
}


/* creates the visualization for the view of the Jovian system. */
function setup_traj_vis() {
	
    // TODO: I do not like these clickable_objects array ~Marcus
	gui.clickable_objects = [];

    // create and add the moon visualizations together with their orbits
    for (i in moons) {
        moons[i].vis_model = gui.create_moon_vis_model(moons[i], ref_epoch);
        gui.scene_trajectory.add(moons[i].vis_model);
        gui.clickable_objects.push(moons[i].vis_model);
        gui.scene_trajectory.add(gui.create_moon_orbit(moons[i]));
    }
	
    // create and add Jupiter
    gui.scene_trajectory.add(gui.create_jupiter_vis_model());
    
    // create and add the jupiter frame coordinate system
    var jupiter_helper_coords = gui.create_helper_coordinate_system(new THREE.Vector3(0,0,0), 30);
    gui.scene_trajectory.add(jupiter_helper_coords);


	
    // create and add light to the scene
    var ambient = new THREE.AmbientLight( 0x999999 );
    var light = new THREE.PointLight( 0xFFFFDD );
    light.position.set( -1500, 10, -50 );
    scene_trajectory.add( light );
	scene_trajectory.add( ambient );

    // set the controls to the trajectory view camera
	controls.object = core.get_camera(gui.scene);
}

/* creates the four scenes for the moon visualization. */
// TODO: parameterize setup_moon_vis (move the inner loop outwards) ~Marcus
function setup_moon_vis(){
	
    for (i in moons) {
        // create new scene for the moon
        moons[i].scene = new THREE.Scene();

        // add the truncated icosahedron
        moons[i].scene.add(moons[i].model);
    
        // create and add camera
    	var camera = new THREE.PerspectiveCamera(
            15,     // Field of view
            window.innerWidth / window.innerHeight,  // Aspect ratio
            0.1,    // Near
            10000   // Far
        );
        camera.name = "Camera " + moons[i].name;
        camera.position.set( 0, 0, -30 );
        camera.lookAt(moons[i].scene.position);
        moons[i].scene.add(camera);

        // create and add helper coordinate system.
        var helper_coords = gui.create_helper_coordinate_system(new THREE.Vector3(0,0,0), 5);
        moons[i].scene.add(helper_coords);
        
        // create and add light to the scene
        var ambient = new THREE.AmbientLight( 0x777777 );
        var light = new THREE.PointLight( 0xFFFFFF );
        light.position.set( -1500, 10, -50 );
        moons[i].scene.add( light );
        moons[i].scene.add( ambient );    
        
    }
}

/**
	@param in moon: Moon object whose scene should be visualised. If null switch to trajectory scene.
	Switches between the scenes (moon and trajectory). 
*/
function switch_scene(moon){
	if (moon===null){
		
		traj_view = true;	
		gui.scene = scene_trajectory;
		gui.clickable_objects = [io.vis_model, europa.vis_model, ganymede.vis_model, callisto.vis_model];
		
		controls.object = core.get_camera(gui.scene);
		
		controls.rotateSpeed = 1.2;
		controls.zoomSpeed = 7.2;
		controls.panSpeed = 0.5;
		
		onWindowResize();
		
		if (tour.m_seq.length > 1) {
			tour.m_seq[tour.m_seq.length-2].unhighlight();
		}
		if (tour.m_seq.length > 0){
			tour.m_seq[tour.m_seq.length-1].highlight();
		}
	}
	else {
		traj_view = false;
		gui.scene = moon.scene;
		
		controls.object = core.get_camera(gui.scene);
		controls.target = new THREE.Vector3(0,0,0);
		
		onWindowResize();
		
		gui.current_moon = moon;
		gui.control.moon = gui.current_moon.name;
		gui.clickable_objects = [moon.model];
	}
}


/**
    This procedure extracts the best chromosome of the current population and updates,
    designs the trajectory and updates the view with it. Its called after the optimizer has finished.
*/
function apply_solution(){
    var ind = core.pop[championidx(core.pop)];
	
	
	// console.log("\n\nCHAMPION X");
	// console.log(ind);
    
    tour.mission_epoch += ind.x[3];
    
    for (var tx = 0; tx < ind.x.length; tx++) {
        tour.x.push(ind.x[tx]);
    }
    
    gui.control.time -= ind.x[3];
	tour.total_dv += ind.f;
	gui.control.dv = tour.total_dv;
	tour.leg_dvs.push(ind.f);
	gui.control.set_face_defaults();
	 core.calculate_sc_mass();
	 gui.control.mass = tour.m_sc;
    gui.show_trajectory();
    
    controls.update();

	if (tour.m_seq.length > 1) {
		tour.m_seq[tour.m_seq.length-2].unhighlight();
	}
	if (tour.m_seq.length > 0){
		tour.m_seq[tour.m_seq.length-1].highlight();
	}
	
	gui.instructions.innerHTML = "Select the next face to visit!";
    
    face_select_phase = true;
    
}

/**
	Colours the visual models of leg arcs based on their dv and order.
	Older arcs are made transparent and invisible not to clutter the scene.
*/
function colour_arcs(){
	
	tour.leg_arcs[tour.leg_arcs.length-1].material.opacity = 1;
	tour.leg_arcs[tour.leg_arcs.length-1].material.transparent = true;
	
	if (tour.leg_dvs[tour.leg_dvs.length-1] <= 5) tour.leg_arcs[tour.leg_arcs.length-1].material.color = new THREE.Color(0x00ff00);
	else if (tour.leg_dvs[tour.leg_dvs.length-1] <= 200) tour.leg_arcs[tour.leg_arcs.length-1].material.color = new THREE.Color(0xffff00);
	else tour.leg_arcs[tour.leg_arcs.length-1].material.color = new THREE.Color(0xff0000);
	
	if(tour.leg_arcs.length > 1){
	
		tour.leg_arcs[tour.leg_arcs.length-2].material.color = new THREE.Color(0x999999);
	
		for (var i = tour.leg_arcs.length-2; i >= 0; i--){
			tour.leg_arcs[i].material.opacity = (tour.leg_arcs[i+1].material.opacity)/2;
			if (tour.leg_arcs[i].material.opacity < 0.05) tour.leg_arcs[i].material.transparent = true;
		}
	}
}

/**
	Creates an Arc object for the last leg and adds the visual representation to the trajectory scene.
	Afterwards it colour the arcs in an appropriate colour. Moons are placed in coprrect positions.
*/
function show_trajectory(){
	var arc = new core.Arc();
	arc.create();
	arc.draw();
	colour_arcs();
	
	move_moons(tour.mission_epoch);
}

/**
	@param in epoch - the epoch [MJD] for which the correct moon ephemerides should be calculated for 
	Positions the vis_models of the moons (in trajectory scene) based on the epoch. 
*/
function move_moons(epoch){
	for (var i in moons) {
		var eph = core.planet_ephemerides(epoch, moons[i]);
		var newpos = new THREE.Vector3(eph.r[0], eph.r[1], eph.r[2]);
		moons[i].vis_model.position = newpos.divideScalar(ARC_SCALE);
    }
}

/**
	@param in busy - [boolean] display the loading wheel if busy is true, hide it otherwise
	Displays a loading wheel on the right hand corner of the canvas when the trajectory parameters are being optimised
*/
function toggle_busy(busy){
	if (busy) {
		gui.busy.style.display = "block";
	} else {
		gui.busy.style.display = "none";
	}
}


/**
	Function which handles when a user clicks on a particular clickable object.
	There are 3 cases:
		1. In up-close moon view, a face is selected/deselected upon clicking.
		2. In Jovian system view, if a face is not selected, upon clicking on the appropriate moon the view changes to up-close (face selection) view of that moon
		3. In Jovian system view, if a face is already selected, upon clicking on the appropriate moon a trajectory is optimised and displayed to that moon.
*/
function single_mouse_click(event) {
	
    // shortcuts
    var current_moon = gui.current_moon;
	
    event.preventDefault();
	
    // TODO: This array is used just once in this function. It should be removed entirely ~Marcus
   
    var mousex = (event.clientX / window.innerWidth) * 2 - 1;
    var mousey = -(event.clientY / window.innerHeight) * 2 + 1;
    var vector = new THREE.Vector3(mousex, mousey+0.025, 0.5);

    gui.projector.unprojectVector(vector, core.get_camera(gui.scene));
    var ray = new THREE.Raycaster(core.get_camera(gui.scene).position, vector.subVectors(vector, core.get_camera(gui.scene).position).normalize());

    var intersects = ray.intersectObjects(gui.clickable_objects);

	
    if (intersects.length > 0 && !core.solver.running) {
		
		//CASE 1.
		if (!traj_view){
		
			var n = 0;

			for (var i in core.faces_3d){

				if ((core.faces_3d[i][0] == intersects[0].faceIndex || core.faces_3d[i][1] == intersects[0].faceIndex) && 
						core.contains(current_moon.feasibles.faces, i)) {
						
						var colour_selected = new THREE.Color(0x8a2be2);
						
						var ix = current_moon.feasibles.faces.indexOf(i);
						
						if (gui.last_selected==null);
						else if (i == gui.last_selected) break;
						else gui.paintFeasibleFace(current_moon, gui.last_selected);
						
						n = current_moon.get_face_value(i);
						
						gui.control.face_value = n;
						gui.last_selected = i;
						
						var sgn = ((intersects[0].faceIndex %2 == 0) ? 1 : (-1));
						
						gui.beta_bounds.lower = current_moon.feasibles.beta[ix][0];
						gui.beta_bounds.upper = current_moon.feasibles.beta[ix][1];
						gui.rp_bounds.lower = current_moon.feasibles.rp[ix][0];
						gui.rp_bounds.upper = current_moon.feasibles.rp[ix][1];
						
						
						gui.control.set_face_attributes(i, n, gui.beta_bounds.lower, gui.beta_bounds.upper, 
																gui.rp_bounds.lower, gui.rp_bounds.upper);
					
					current_moon.model.geometry.faces[intersects[0].faceIndex].color = colour_selected;
					current_moon.model.geometry.faces[intersects[0].faceIndex +sgn].color = colour_selected;
					current_moon.model.geometry.colorsNeedUpdate = true;
					
					break;
				}
			}
		}
		
		else {
			
			//CASE 2.
			if (face_select_phase){
				for (var m = 0; m < moons.length; m++){
					if (intersects[0].object.name === moons[m].name){
						gui.switch_scene(moons[m]);
						
						if (intersects[0].object.name === tour.m_seq[tour.m_seq.length-1].name){
							gui.show_feas_faces(tour.mission_epoch, current_moon, tour.leg_v_infs[tour.leg_v_infs.length-1]);
						}
						
						break;
					}
				}
			}
			
			//CASE 3.
			else {
                // This line gives you the moon the user clicked on
                tour.m_seq.push(moon_name_map[intersects[0].object.name]);
                
                // TODO: This time of flight should actually be a control value set by the player rather than a constant ~Marcus
                var betas = [{upper: gui.control.beta_upper, lower: gui.control.beta_lower}];
				var rps = [{upper: gui.control.rp_upper, lower: gui.control.rp_lower}];
				
                core.prob = new core.mga_part(tour.m_seq.slice(-2),[[1, 50]], tour.mission_epoch, tour.leg_v_infs[tour.leg_v_infs.length-1]);
				

				if ((gui.control.time > 50) || (gui.control.time < 50 && gui.control.leg_tof <= gui.control.time)) {
					core.prob.set_tof([[1, gui.control.leg_tof]]);
				}
				else core.prob.set_tof([[1, gui.control.time]]);
				
				core.prob.set_beta(betas);
				core.prob.set_rp(rps);
                core.pop = core.create_population(core.prob);
                core.solver.steps = GENERATIONS;
				
				gui.instructions.innerHTML = "Optimising trajectory...";
				
				// gui.control.set_face_defaults();
				//gui.show_trajectory(tour.m_seq, tour.v_inf, ref_epoch, tour.x); 
			}
		}
	}
}



/**
	Function which handles when a user double-clicks on a particular clickable object.
	There are 3 cases:
		1. In up-close moon view, a face is selected and confirmed upon double-clicking.
		2. TODO
		3. TODO
*/
function double_mouse_click(event) {
	
    // shortcuts
    var current_moon = gui.current_moon;
	
    event.preventDefault();
	
    // TODO: This array is used just once in this function. It should be removed entirely ~Marcus
   
    var mousex = (event.clientX / window.innerWidth) * 2 - 1;
    var mousey = -(event.clientY / window.innerHeight) * 2 + 1;
    var vector = new THREE.Vector3(mousex, mousey+0.025, 0.5);

    gui.projector.unprojectVector(vector, core.get_camera(gui.scene));
    var ray = new THREE.Raycaster(core.get_camera(gui.scene).position, vector.subVectors(vector, core.get_camera(gui.scene).position).normalize());

    var intersects = ray.intersectObjects(gui.clickable_objects);
	
	
    if (intersects.length > 0 && !core.solver.running) {
		
		//CASE 1.
		if (!traj_view){
		
			var n = 0;

			for (var i in core.faces_3d){

				if ((core.faces_3d[i][0] == intersects[0].faceIndex || core.faces_3d[i][1] == intersects[0].faceIndex) && 
						core.contains(current_moon.feasibles.faces, i)) {
						
						n = current_moon.get_face_value(i);
						
						if (!core.contains(current_moon.locked, i) || (i!=gui.last_selected)) {
								if (gui.control.score >= 324)  gui.control.score = 324;
								else gui.control.score += n;
								gui.last_selected = i;
							}
							else {
								gui.control.face_value = 0;
								gui.last_selected = i;
							}
					
					tour.flyby_scores.push([i, n]);
					
					gui.lockFace(gui.current_moon); 
					current_moon.set_face_value(i,0);
					gui.scene = gui.scene_trajectory;
					
					clearPaint(current_moon);
					current_moon.feasibles = {faces: [], beta: [], rp: []};
					
					gui.switch_scene(null);
					
					//gui.show_trajectory(tour.m_seq, tour.v_inf, ref_epoch, tour.x); 
					face_select_phase = false;
					
					gui.instructions.innerHTML = "Select the next moon to visit!";
					
					if (gui.control.time < 1) {
						var end_game_popup = confirm("GAME OVER! \n\n	Your score was:\n\t" + gui.control.score + " Points" +
														"\n	Delta V: " + gui.control.dv + " m/s" +
														"\n	Time: " + (max_mission_tof - gui.control.time) + " days" +
														"\n	Propellant: " + gui.control.mass + 
														"\n	Flybys: " + (tour.m_seq.length-1));
						if (end_game_popup == true){alert("You pressed ok!");}
						else {alert("You pressed Cancel!");}
					}
					
					break;
				}
			}
		}
		
		else {
			
			//CASE 2.
			if (face_select_phase){

			}
			
			//CASE 3.
			else {

			}
		}
	}
}

/**
	Checks whether the browser supports and can initialise webGL properly.
	If not, it redirects the user to a webGL troubleshooting page
*/
function webGL_check(){
	
	if (!window.WebGLRenderingContext) {
		// the browser doesn't even know what WebGL is
		window.location = "http://get.webgl.org";
		return false;
	} else {
		var canvas = gui.container.getElementsByTagName('canvas')[0];
		var context = canvas.getContext("webgl");
		if (!context) {
			// browser supports WebGL but initialization failed.
			window.location = "http://get.webgl.org/troubleshooting";
			return false;
		}
		
		else {
			console.log("Passed webGL check!");
			return true;
		}
  }
	
}


    // Indicator for calculation
    gui.busy = document.createElement( 'div' );
    gui.busy.style.display = "none";
    gui.busy.style.position = "fixed";
    gui.busy.style.right = "8px";
    gui.busy.style.bottom = "8px";
    img = document.createElement( 'img' );
    img.src = "resources/images/busy.gif"
    img.alt = "busy ..."
    gui.busy.appendChild( img );
    document.body.appendChild( gui.busy );
	
	//instructions for the player
	gui.instructions = document.createElement( 'div' );
    gui.instructions.style.display = "block";
    gui.instructions.style.position = "fixed";
    gui.instructions.style.left = "20px";
    gui.instructions.style.top = "20px";
	gui.instructions.style.color = "#00ff00"
	gui.instructions.style.fontSize = "large";
	gui.instructions.style.fontWeight = "bold";
	gui.instructions.innerHTML = "Select the next face to visit!";
	
    document.body.appendChild( gui.instructions );



// TODO: decide which functions shall be private and which not - exposing all seems unnecessary ~Marcus

gui.webGL_check = webGL_check;


gui.scene_trajectory = scene_trajectory;

gui.update = update;
gui.lockFace = lockFace;
gui.paintFeasibleFace = paintFeasibleFace;
gui.show_feas_faces = show_feas_faces;
gui.setup = setup;
gui.setup_traj_vis = setup_traj_vis;
gui.setup_moon_vis = setup_moon_vis;
gui.switch_scene = switch_scene;
gui.colour_arcs = colour_arcs;
gui.show_trajectory = show_trajectory;
gui.apply_solution = apply_solution;
gui.single_mouse_click = single_mouse_click;
gui.double_mouse_click = double_mouse_click;
gui.toggle_busy = toggle_busy;

})();