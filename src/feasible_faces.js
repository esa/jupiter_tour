
(function(){


function feas_faces (t, moon, vinf_in){


	/**
	Returns the observable faces and a guess on the bounds to actually observe them
	*/
	
	// Moon ephemerides
	var moon_eph = core.planet_ephemerides(t, moon);
	
	// Moon body axis
	var b_hat = get_body_axis( moon_eph.r, moon_eph.v );
	
	// We loop over the faces
	var feasibles = [];
	for (var face_nr in core.f_dict){
	
		// Here we store the reason for a vertex rebuttal
		var vertex_checks = new Array();
		// For each face we loop over its vertexes
		for (var vtx in core.f_dict[face_nr]) {
		    // And compute the vertex vector in the absolute frame (p) and
		    // The relative outgoing velocity needed to actually observe the given vertex

			var b = core.vtx_coors[core.f_dict[face_nr][vtx]];
			
			var p = core.addition(core.addition(core.multiplication(b_hat[0], b[0]), core.multiplication(b_hat[1], b[1])), core.multiplication(b_hat[2], b[2]));
			
			if (core.dot( p, vinf_in ) < 0.0){
			
				/** !! WAS: vertex_checks[ vtx ] = 'dot'; */
				vertex_checks[ vtx ] = [false, false];	// vertex in the visible hemisphere (unreachable)
				continue; 
			}
			var vinf_out = vinf_out_from_p( vinf_in, p );
			
			// We now know the vertex is in the far hemisphere: there exist a value of rp to reach it. We check that
			// this valuse is within the allowed bounds
			var fcn = fb_conNEW( vinf_in, vinf_out, moon, [50. * 1000., 2000. * 1000.] );
			
			vertex_checks[ vtx ] = [ fcn.ineq[0]<0, fcn.ineq[1]<0 ];
			// (True, True): vertex within the band; can be reached directly
			// (False, True): vertex in between the band and the "relative" equator
			// (True, False): vertex is above the band
			
			// If the vertex is in the band, the face is feasible
			if (fcn.ineq[0] * fcn.ineq[1] > 0){
				if (core.contains(feasibles, face_nr) == false){
					feasibles.push( face_nr );
				}
				
				vertex_checks = {};
				break;
			}
			
			// If no vertex was in the band:
			if (Object.keys(vertex_checks).length > 0){
				// var vtx_outcomes = vertex_checks.slice(0);	
				if (vertex_checks.length == 1){
					// face is unfeasible because either all vertixes are above, or all below, or all on the visible side
					continue;
				}
			}
		}
		
		for (key in vertex_checks){
					if (vertex_checks[key][0] == true && vertex_checks[key][1] == false){
		
					// if (contains(vtx_outcomes, [true, false])){
						// this handles the case in which at least one of the vertexes is above the band, and the other vertices do not lie
						// within the band, but are either within the visible side or below the bend
						// yield face_nr, ( vtx for vtx,outc in vertex_checks.iteritems() if outc == (False, True) ).next()
						
						for (key2 in vertex_checks){
							if (vertex_checks[key2][0] != true || vertex_checks[key2][1] != false){
								if (core.contains(feasibles, face_nr) == false){
									feasibles.push( face_nr );
									break;
								}
							}
						}
					}
				}
			
		//console.log("VTX CHECKS");
		//console.log("FACE: " + face_nr);
		//for (var v in vertex_checks){
			//console.log(v + ": " + vertex_checks[v]);
		//}
		//console.log("\n");
	}
	
	// Having a list of feasible faces we now try to bracket each face in terms of betas and rps. That is: we look for bounds of betas and rps that
	// would sort-of guarantee us to actually fly over a face.
	var betas = [];
	for (var face in feasibles){
		
		var f_betas = [];
		
		for (var vtx in core.f_dict[feasibles[face]]){
			
			var b = core.vtx_coors[core.f_dict[feasibles[face]][vtx]];
			var p = core.addition(core.addition(core.multiplication(b_hat[0], b[0]), core.multiplication(b_hat[1], b[1])), core.multiplication(b_hat[2], b[2]));
			
			if (core.dot( p, vinf_in ) < 0.0){
				f_betas.push( p_to_beta( p, moon_eph.v, vinf_in, true ) );
			}
			else{
				f_betas.push( p_to_beta( p, moon_eph.v, vinf_in, false ) );
			}
		}
		betas.push( f_betas );
	}

	var beta_bounds = [];
	for (var f_betas in betas) {

		betas[f_betas].sort(function(a, b) { return a - b; });

		var b_range = [ betas[f_betas][0], betas[f_betas][betas[f_betas].length-1] ];

		if (b_range[1] - b_range[0] > Math.PI){		// wraps around
			
			for (b in betas[f_betas]){
			if (b < 0) b += 2*Math.PI;
			}
			
			b_range = [ betas[f_betas][0], betas[f_betas][betas[f_betas].length-1] ];
		}
		beta_bounds.push( b_range );
	}
	
	var rp_bounds = [];
	for (var face in feasibles){
		var f_rps = [];

		for (var vtx in core.f_dict[ feasibles[face] ]){

			var b = core.vtx_coors[core.f_dict[feasibles[face]][vtx]];
			var p = core.addition(core.multiplication(b_hat[0], b[0]), core.addition(core.multiplication(b_hat[1], b[1]), core.multiplication(b_hat[2], b[2])));

			if (core.dot( p, vinf_in ) < 0.0){
				f_rps.push( 10e100 );
			}
			else {
				var vinf_out = vinf_out_from_p( vinf_in, p );
				var alpha = Math.acos( core.dot(vinf_in, vinf_out) / core.magnitude( vinf_in ) / core.magnitude( vinf_out ) );
				var rp = moon.mu / core.dot(vinf_in, vinf_in) * ( 1. / Math.sin(alpha/2.) - 1. );

				f_rps.push( rp );
				// raise Exception
			}
		}

		f_rps.sort(function(a, b) { return a - b; });
		
		rp_bounds.push( [
			Math.max(f_rps[0],   50. * 1000. + moon.radius ) / moon.radius,
			Math.min(f_rps[f_rps.length-1], 2000. * 1000. + moon.radius ) / moon.radius
			] );
	}
	
	return {f: feasibles, rp: rp_bounds, beta: beta_bounds};

}

function vinf_out_from_p( vinf_in, p, unfeasible ){
	/**
	implements the formula which propagates a flyby fixing the face point covered
	
	(b1,b2,b3): body coordinates of a chosen point on the planetary surface
	*/
	
	// compute the point position vector
	if (unfeasible){
		// maps the point to the far hemisphere
		var vinf_in_hat = core.division(vinf_in, core.magnitude(vinf_in));
		p = core.subtraction( p, core.multiplication( core.multiplication(vinf_in_hat, core.dot(p, vinf_in_hat)), 1.01));
	}
	// normalize
	var p_hat = core.division(p, core.magnitude(p));
	
	// spacecraft relative velocity out needed in order to see the vertex
	var vinf_out = core.subtraction(vinf_in, core.multiplication(core.multiplication(p_hat, core.dot( vinf_in, p_hat )), 2));
	
	return vinf_out;
}

function get_body_axis( r, v ){

	var b1_hat = core.multiplication(r, -1.0);
	var b3_hat = core.cross( r, v );
	var b2_hat = core.cross( b3_hat, b1_hat );
	
	b1_hat = core.division(b1_hat, core.magnitude(b1_hat));
	b2_hat = core.division(b2_hat, core.magnitude(b2_hat));
	b3_hat = core.division(b3_hat, core.magnitude(b3_hat));
	
	return [b1_hat, b2_hat, b3_hat];
}

function p_to_beta( p, v_M, vinf_in, unfeasible ){
	// beta angle required to fly a face vertex, even if unfeasible
	
	var vinf_out = vinf_out_from_p( vinf_in, p, unfeasible );
	
	return vinfs_to_beta( vinf_in, vinf_out, v_M );
}

function fb_conNEW( v_rel_in, v_rel_out, moon, radius ){
	
	/**
	- v_rel_in: cartesian coordinates of the relative hyperbolic velocity before the fly-by
	- vout: vout, cartesian coordinates of the relative hyperbolic velocity after the fly-by
	- pl: fly-by moon
	- radius: tuple with the range of heights above pl.radius in which the flyby can take place
	
	Returns a tuple containing (eq, ineq).
	  eq represents the violation of the equality constraint |v_rel_in|-¦ =|vout|-¦.
	  ineq represents the violation of the inequality constraints on the hyperbola asymptote maximum deflection
	*/
	
	var Vin2  = v_rel_in[0]  * v_rel_in[0]  + v_rel_in[1]  * v_rel_in[1]  + v_rel_in[2]  * v_rel_in[2];
	var Vout2 = v_rel_out[0] * v_rel_out[0] + v_rel_out[1] * v_rel_out[1] + v_rel_out[2] * v_rel_out[2];
	var eq_V2 = Vin2 - Vout2;
	
	// try:
	var arg_acos = (v_rel_in[0]*v_rel_out[0] + v_rel_in[1]*v_rel_out[1] + v_rel_in[2]*v_rel_out[2]) / Math.sqrt(Vin2) / Math.sqrt (Vout2); 
	// when v_rel_in = v_rel_out, arg_acos can get bigger than 1 because of roundoff:
	if(arg_acos > 1.0){
		arg_acos = 1.0;
	}
	else if(arg_acos < -1.0){
		arg_acos = -1.0;
	}
	
	var alpha = Math.acos( arg_acos );
	
	var e_range = [];
	
	for (var h in radius){
		e_range[e_range.length] = 1. + (((moon.radius) + radius[h]) / (moon.mu) * Vin2);
	}
	
	var alpha_min = 2. * Math.asin(1./e_range[1]);
	var alpha_max = 2. * Math.asin(1./e_range[0]);
	
	var ineq_delta = [
		alpha_min - alpha,
		alpha - alpha_max
		];

	return {eq: eq_V2, ineq: ineq_delta}; //, (degrees(alpha), degrees(alpha_min), degrees(alpha_max));
}

function get_fb_axis( vinf_in, v_planet ){
	/**
	computes the reference frames where beta is defined, as defined in the keplerian toolbox
	*/
	
	// http://sourceforge.net/p/keptoolbox/code/ci/ef0454a6a69403a1786a4e7920c3fe036a916ad2/tree/src/core_functions/fb_prop.h
	var i_hat =  vinf_in;
	var j_hat = core.cross( i_hat, v_planet );
	var k_hat = core.cross( i_hat, j_hat );
	
	i_hat = core.division(i_hat, core.magnitude(i_hat));
	j_hat = core.division(j_hat, core.magnitude(j_hat));
	k_hat = core.division(k_hat, core.magnitude(k_hat));

	return [i_hat, j_hat, k_hat];
}

function vinfs_to_beta( vinf_in, vinf_out, v_planet ){
	/**
	beta angle from the hyperbolic velocities
	
	# VALIDATION:
	>>> beta = .23456
	>>> abs_v_in, v_planet = [1,0,0], [0,1,0]
	>>> abs_v_out = pk.fb_prop(abs_v_in, v_planet, 2, beta, 1)
	>>> b = vinfs_to_beta( np.subtract( abs_v_in, v_planet ), np.subtract( abs_v_out, v_planet ), v_planet )
	>>> beta == b
	*/

	var i = get_fb_axis( vinf_in, v_planet );
	var beta = Math.atan2( core.dot(vinf_out, i[2]), core.dot(vinf_out, i[1]) );

	return beta;
}

function classify_point(p, vinf_in, moon){
	
	var vinf_out = vinf_out_from_p( vinf_in, p );
	
	if (core.dot( p, vinf_in ) < 0.0){
		// classification = -1;	// vertex in the visible hemisphere (unreachable)
		return {i: -1, vinf_out: vinf_out};
	}
	
	// We now know the vertex is in the far hemisphere: there exist a value of rp to reach it. We check that
	// this valuse is within the allowed bounds
	var fcn = fb_conNEW( vinf_in, vinf_out, moon, [50. * 1000., 2000. * 1000.] );
	var check = [ fcn.ineq[0]<0, fcn.ineq[1]<0 ];
		// (True, True): vertex within the band; can be reached directly
		// (False, True): vertex in between the band and the "relative" equator
		// (True, False): vertex it's above the band
		
	if(check == [false, true]){
		// below
		return {i: 0, vinf_out: vinf_out};
	}
	else if(check == [true, true]){
		// in
		return {i: 1, vinf_out: vinf_out};
	}
	else{
		// above
		return {i: 2, vinf_out: vinf_out};
	}
}


function sample_points(classification_1, classification_2){
	// only sample in between points that are not on the same side of the band:
	if (classification_1 == 1 || classification_2 == 1) return true;
	else if ((classification_1 == -1 || classification_1 == 0) && (classification_2 == 2)) return true;
	else if ((classification_1 == 2) && (classification_2 == -1 || classification_2 == 0))	return true;
	else return false;
}

function get_rp_beta(pp, vinf_in, vinf_out, moon_v, moon){  // vinf_in =/= flyby_data.vinf_in???
	// checks for each point:
	if (core.dot( pp, vinf_in ) < 0.){
		var beta = p_to_beta( pp, moon_v, vinf_in, true );
		var rp = 10e100;
	}
	else {
		var beta = p_to_beta( pp, moon_v, vinf_in, false );
		vinf_out = vinf_out_from_p( vinf_in, pp );
		var nvi = core.magnitude( vinf_in );
		var nvo = core.magnitude( vinf_out );
		
		if(nvo > 1E-9 && nvi > 1E-9){
			var ndio = core.dot(vinf_in, vinf_out);
			var acos_arg = ndio / nvi / nvo;
			if(acos_arg > 1.0){
				acos_arg = 1.0;
			}
			else if(acos_arg < -1.0){
				acos_arg = -1.0;
			}
			var alpha = Math.acos( acos_arg );
			var dot_vi_vi = core.dot(vinf_in, vinf_in);
			var sa = Math.sin(alpha/2.);
			if(dot_vi_vi > 1E-9 && Math.abs(sa) > 1E-9){
				var rp = moon.mu / dot_vi_vi * ( 1. / sa - 1. );
			}
			else{
				// print 'vivi, sa too small, vinf_out = %f, %f, %f' % (vinf_out[0], vinf_out[1], vinf_out[2])
				var rp = 10e100;
				// pdb.set_trace();
			}
		}
		else {
			// print 'nvo, nvi too small'
			var rp = 10e100;
			// pdb.set_trace();
		}
	}
	return {rp: rp, beta: beta};
}



core.feas_faces = feas_faces;

})();


