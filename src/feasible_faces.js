

function feas_faces (t, moon, vinf_in){


	/**
	Returns the observable faces and a guess on the bounds to actually observe them
	*/
	
	// Moon ephemerides
	var moon_eph = planetEphemerides(t, moon);
	
	// Moon body axis
	var b_hat = get_body_axis( moon_eph.r, moon_eph.v );
	
	// We loop over the faces
	var feasibles = [];
	for (var face_nr in f_dict){
	
		// Here we store the reason for a vertex rebuttal
		var vertex_checks = new Array();
		// For each face we loop over its vertexes
		for (var vtx in f_dict[face_nr]) {
		    // And compute the vertex vector in the absolute frame (p) and
		    // The relative outgoing velocity needed to actually observe the given vertex

			var b = vtx_coors[f_dict[face_nr][vtx]];
			
			var p = addition(addition(multiplication(b_hat[0], b[0]), multiplication(b_hat[1], b[1])), multiplication(b_hat[2], b[2]));
			
			if (dot( p, vinf_in ) < 0.0){
			
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
				if (contains(feasibles, face_nr) == false){
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
								if (contains(feasibles, face_nr) == false){
									feasibles.push( face_nr );
									break;
								}
							}
						}
					}
				}
			
		console.log("VTX CHECKS");
		console.log("FACE: " + face_nr);
		for (var v in vertex_checks){
			console.log(v + ": " + vertex_checks[v]);
		}
		console.log("\n");
	}
	
	// Having a list of feasible faces we now try to bracket each face in terms of betas and rps. That is: we look for bounds of betas and rps that
	// would sort-of guarantee us to actually fly over a face.
	var betas = [];
	for (var face in feasibles){
		
		var f_betas = [];
		
		for (var vtx in f_dict[feasibles[face]]){
			
			var b = vtx_coors[f_dict[feasibles[face]][vtx]];
			var p = addition(addition(multiplication(b_hat[0], b[0]), multiplication(b_hat[1], b[1])), multiplication(b_hat[2], b[2]));
			
			if (dot( p, vinf_in ) < 0.0){
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

		for (var vtx in f_dict[ feasibles[face] ]){

			var b = vtx_coors[f_dict[feasibles[face]][vtx]];
			var p = addition(multiplication(b_hat[0], b[0]), addition(multiplication(b_hat[1], b[1]), multiplication(b_hat[2], b[2])));

			if (dot( p, vinf_in ) < 0.0){
				f_rps.push( 10e100 );
			}
			else {
				var vinf_out = vinf_out_from_p( vinf_in, p );
				var alpha = Math.acos( dot(vinf_in, vinf_out) / magnitude( vinf_in ) / magnitude( vinf_out ) );
				var rp = moon.mu / dot(vinf_in, vinf_in) * ( 1. / Math.sin(alpha/2.) - 1. );

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
		var vinf_in_hat = division(vinf_in, magnitude(vinf_in));
		p = subtraction( p, multiplication( multiplication(vinf_in_hat, dot(p, vinf_in_hat)), 1.01));
	}
	// normalize
	var p_hat = division(p, magnitude(p));
	
	// spacecraft relative velocity out needed in order to see the vertex
	var vinf_out = subtraction(vinf_in, multiplication(multiplication(p_hat, dot( vinf_in, p_hat )), 2));
	
	return vinf_out;
}

function get_body_axis( r, v ){

	var b1_hat = multiplication(r, -1.0);
	var b3_hat = cross( r, v );
	var b2_hat = cross( b3_hat, b1_hat );
	
	b1_hat = division(b1_hat, magnitude(b1_hat));
	b2_hat = division(b2_hat, magnitude(b2_hat));
	b3_hat = division(b3_hat, magnitude(b3_hat));
	
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
	var j_hat = cross( i_hat, v_planet );
	var k_hat = cross( i_hat, j_hat );
	
	i_hat = division(i_hat, magnitude(i_hat));
	j_hat = division(j_hat, magnitude(j_hat));
	k_hat = division(k_hat, magnitude(k_hat));

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
	var beta = Math.atan2( dot(vinf_out, i[2]), dot(vinf_out, i[1]) );

	return beta;
}

function classify_point(p, vinf_in, moon){
	
	var vinf_out = vinf_out_from_p( vinf_in, p );
	
	if (dot( p, vinf_in ) < 0.0){
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




function feas_faces_tight(t, moon, vinf_in, n_steps){
	
	// from matplotlib import pyplot as pl
	// from mpl_toolkits.mplot3d import axes3d, Axes3D

	/**
	Returns the observable faces and a guess on the bounds to actually observe them.
	The word tight means that the bounds on rp, beta are as tight or tighter than with feasible_faces.
	The cost is more computation time.
	*/
	
	
	// Moon ephemerides
	var moon_eph = planetEphemerides(t, moon);
	
	// Moon body axis
	var b_hat = get_body_axis( moon_eph.r, moon_eph.v );
	
	// We loop over the faces
	// We loop over the faces	
	var feasibles = [];
	for (var face_nr in f_dict){
	
		// Here we store the reason for a vertex rebuttal
		var vertex_checks = new Array();
		// For each face we loop over its vertexes
		for (var vtx in f_dict[face_nr]) {
		    // And compute the vertex vector in the absolute frame (p) and
		    // The relative outgoing velocity needed to actually observe the given vertex

			var b = vtx_coors[f_dict[face_nr][vtx]];
			
			var p = addition(addition(multiplication(b_hat[0], b[0]), multiplication(b_hat[1], b[1])), multiplication(b_hat[2], b[2]));
			
			
			if (dot( p, vinf_in ) < 0.0){
			
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
				if (contains(feasibles, face_nr) == false){
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
								if (contains(feasibles, face_nr) == false){
									feasibles.push( face_nr );
									break;
								}
							}
						}
					}
				}
			
		console.log("VTX CHECKS");
		console.log("FACE: " + face_nr);
		for (var v in vertex_checks){
			console.log(v + ": " + vertex_checks[v]);
		}
		console.log("\n");
		
	}
	
	// Having a list of feasible faces we now try to bracket each face in terms of betas and rps. That is: we look for bounds of betas and rps that
	// would sort-of guarantee us to actually fly over a face.
	
	// Tight algorithm goal: put a box around vectors as close as possible to the band.
	// Outline:
	// 1) make a larger list of vectors on the basis of the face vertex lists (below, in, above), and determine their beta, rp, and whether they are above, in, or below the band
	// 2) Take as box the largest (smallest?) rp, beta with the vector below the band, and the smallest (largest?) rp, beta with the vector above the band
	// If this is impossible, put the bounds around the ones in the band.
	  
	var beta_bounds = [];
	var betas = [];
	var rp_bounds = [];
	var difficult_faces = new Array(feasibles.length);
	
	for (df in difficult_faces){
		difficult_faces[df] = false;
	}
	// check_difficult = False;
	
	for (var f in feasibles){
		
		console.log("\nFACE: " + feasibles[f]);
		
		var face = feasibles[f];
		
		var f_betas = [];
		// f_betas_dot = [];
		var f_betas_above = [];
		var f_betas_below = [];
		var f_betas_in = [];
		
		var f_rps = [];
		// f_rps_dot = []
		var f_rps_above = [];
		var f_rps_below = [];
		var f_rps_in = [];
		
		var remaining_vertices = [];
		
		// generate points in between all vertices:
		var vertices = f_dict[ face ];
		var vtx_len = vertices.length;
		var remaining_vertices = vertices.slice(0);
		
		for (var v1=0; v1<vtx_len; v1++){
			var b = vtx_coors[vertices[v1]];
			
			// p1 = b[0] * b_hat[0] + b[1] * b_hat[1] + b[2] * b_hat[2];
			var p1 = addition(addition(multiplication(b_hat[0], b[0]), multiplication(b_hat[1], b[1])), multiplication(b_hat[2], b[2]));
			
			console.log("\nREM VERTICES CHECK 1: " + remaining_vertices);
			
			// remaining_vertices = vertices.slice(0);
			remove(remaining_vertices, 0);
			
			console.log("VERTICES");
			console.log(vertices);
			console.log("V1");
			console.log(v1);
			console.log("REMAINING VERTICES");
			console.log(remaining_vertices);
			
			for (var v2 in remaining_vertices){
				b = vtx_coors[vertices[v2]];
				// p2 = b[0] * b_hat[0] + b[1] * b_hat[1] + b[2] * b_hat[2];
				var p2 = addition(addition(multiplication(b_hat[0], b[0]), multiplication(b_hat[1], b[1])), multiplication(b_hat[2], b[2]));
				
				var cp1 = classify_point(p1, vinf_in, moon);
				var cp2 = classify_point(p2, vinf_in, moon);
				var sp = sample_points(cp1[0], cp2[0]);
				
				// console.log("CP1: " + cp1);
				// console.log("CP2: " + cp2);
				
				if(sp){
					
					console.log("SP == TRUE");
					
					var delta_p = subtraction(p2, p1);  // 3D VECTOR
					for (var s=0; s < n_steps; s++) {
						// the factor multiplied with delta_p should not be 0, 1.
						var pp = addition(p1, multiplication(delta_p,((s + 1.0) / (n_steps + 2.0))));
						pp = division(pp, magnitude(pp));
						
						// checks for each point:
						if (dot(pp, vinf_in) < 0.0){
							var beta = p_to_beta(pp, moon_eph.v, vinf_in, true );
							f_betas.push( beta );
							// f_betas_dot.append( beta );
							f_rps.push( 10e100 );
							// f_rps_dot.append( 10e100 )
						}
						else {
							var beta = p_to_beta( pp, moon_eph.v, vinf_in, false );
							f_betas.push( beta );
							var vinf_out = vinf_out_from_p( vinf_in, pp );
							
							// try:
							var nvi = magnitude( vinf_in );
							var nvo = magnitude( vinf_out );
							if ((nvo > 1E-9) && (nvi > 1E-9)){
								var ndio = dot(vinf_in, vinf_out);
								var acos_arg = ndio / nvi / nvo;
								if (acos_arg > 1.0){
									acos_arg = 1.0;
								}
								else if (acos_arg < -1.0){
									acos_arg = -1.0;
								}
								var alpha = Math.acos( acos_arg );
							}
							else{
								f_betas.pop();
								continue;
							}
							
							var dot_vi_vi = dot(vinf_in, vinf_in);
							var sa = Math.sin(alpha/2.0);
							if (dot_vi_vi > 1E-9 && Math.abs(sa) > 1E-9){
								var rp = moon.mu / dot_vi_vi * ( 1.0 / sa - 1.0 );
							}
							else{
								f_betas.pop();
								continue;
							}
							f_rps.push( rp );
							
							// We now know the vertex is in the far hemisphere: there exist a value of rp to reach it. We check that
							// this valuse is within the allowed bounds
							fcn2 = fb_conNEW( vinf_in, vinf_out, moon, [50. * 1000., 2000. * 1000.] );
								// (True, True): vertex within the band; can be reached directly
								// (False, True): vertex in between the band and the "relative" equator
								// (True, False): vertex it's above the band
							if (fcn2.ineq[0]<0 && fcn2.ineq[1]<0){
								f_betas_in.push(beta);
								f_rps_in.push(rp);
							}
							else if (fcn2.ineq[0]>=0 && fcn2.ineq[1]<0){
								f_betas_below.push(beta);
								f_rps_below.push(rp);
							}
							else {
								f_betas_above.push(beta);
								f_rps_above.push(rp);
							}
						}
					}
				}
				
				
				console.log("V2");
				console.log(v2);
				console.log("REMAINING VERTICES END 2ND LOOP");
				console.log(remaining_vertices);
				
			}
		}
		
		if(f_betas != [] && f_rps != []){
			
			var rps_max;
			var rps_min;
			
			if(f_rps_below != []){
			
				rps_max = min(f_rps_below);
				console.log("RPS MAX: " + rps_max);
				var mr = Math.min(rps_max, (2000. * 1000. + moon.radius) );
				console.log("MR MAX: " + mr);
				
				if (mr != (2000. * 1000. + moon.radius)){
					console.log("FRPS BELOW useful");
				}
			}
			else{
				rps_max = max(f_rps);
			}
			
			
			
			if(f_rps_above != []){
			
				rps_min = max(f_rps_above);
				console.log("RPS MIN: " + rps_min);
				var mr = Math.max(rps_min, 50. * 1000. + moon.radius );
				console.log("MR MIN: " + mr);
				
				if(mr != (50. * 1000. + moon.radius)){
					console.log("FRPS ABOVE useful");
				}
			}
			else{
				rps_min = min(f_rps);
			}
			
			console.log("RPS MIN: " + rps_min);
			
			if(f_rps_in != []){
				
				console.log("FRPS IN NOT EMPTY");

				if(f_rps_in.length >= 3){
					// enough points to estimate the box
					
					console.log("FRPS >= 3");
					
					if(Math.abs(mean(f_betas_in) - median(f_betas_in)) > 0.75){
						// wrap around, make a box around only positive / negative points
						pos_in = [];
						neg_in = [];
						
						for (var b in f_betas_in){
							if(b >= 0){
								pos_in.push(b);
							}
							else{
								neg_in.push(b);
							}
						}
						
						if(pos_in.length > neg_in.length){
							f_betas = pos_in;
						}
						else{
							f_betas = neg_in;
						}
					}
					else{
						f_betas = f_betas_in;
					}
				}
				else{
					// not enough points in the band:
					difficult_faces[f] = true;
					// check_difficult = True;
				}
			}
			else{
				// no points in band:
				// not enough points in the band:
				difficult_faces[f] = True;
			}
			
			if(rps_min > rps_max){
				// pdb.set_trace();
				console.log("TRACE SET: ACTIVE");
			}
			
			console.log("RP BOUNDS PUSH");
			
			rp_bounds.push( [
				Math.max(rps_min,   50. * 1000. + moon.radius ) / moon.radius,
				Math.min(rps_max, 2000. * 1000. + moon.radius ) / moon.radius,
				] );
			
			console.log("RP BOUNDS");
			console.log(rp_bounds[f]);
			console.log("F_RPS");
			console.log(f_rps);
			
			betas.push(f_betas);
		}
		else{
			// no points were sampled, append dummy data for deletion:
			betas.push([0.0]);
			
			console.log("DUMMY");
			
			rp_bounds.push( [
				( 50. * 1000. + moon.radius ) / moon.radius,
				( 2000. * 1000. + moon.radius ) / moon.radius,
				] );
			difficult_faces[f] = true;
		}
	}		
	
	beta_bounds = [];
	for (f_betas in betas){
		b_range = [ min(betas[f_betas]), max(betas[f_betas]) ];
		if (b_range[1] - b_range[0] > Math.PI){		// wraps around
			// f_betas = [ b+2*pi if b < 0 else b for b in f_betas ];
			
			for (b in betas[f_betas]){
				if (b < 0) b += 2*Math.PI;
			}
			b_range = [ min(f_betas), max(f_betas) ];
		}
		beta_bounds.push( b_range );
	}
	
	for (var f = feasibles.length-1; f >= 0; f--){
		if(difficult_faces[f]){		
			remove(feasibles,f);
			remove(rp_bounds, f);
			remove(beta_bounds,f);
		}
	}
	
	if(feasibles == []){
		// print 'No faces feasible according to tight test, reverting to feasible faces'
		return feasible_faces( t, moon, vinf_in );
	}
	
	return { f: feasibles, rp: rp_bounds, beta: beta_bounds };
}	



function get_rp_beta(pp, vinf_in, vinf_out, moon_v, moon){  // vinf_in =/= flyby_data.vinf_in???
	// checks for each point:
	if (dot( pp, vinf_in ) < 0.){
		var beta = p_to_beta( pp, moon_v, vinf_in, true );
		var rp = 10e100;
	}
	else {
		var beta = p_to_beta( pp, moon_v, vinf_in, false );
		vinf_out = vinf_out_from_p( vinf_in, pp );
		var nvi = magnitude( vinf_in );
		var nvo = magnitude( vinf_out );
		
		if(nvo > 1E-9 && nvi > 1E-9){
			var ndio = dot(vinf_in, vinf_out);
			var acos_arg = ndio / nvi / nvo;
			if(acos_arg > 1.0){
				acos_arg = 1.0;
			}
			else if(acos_arg < -1.0){
				acos_arg = -1.0;
			}
			var alpha = Math.acos( acos_arg );
			var dot_vi_vi = dot(vinf_in, vinf_in);
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



function feas_faces_tight_bisection( t, moon , vinf_in, intended_face) {

	/**
	Returns the observable faces and a guess on the bounds to actually observe them.
	The word tight means that the bounds on rp, beta are as tight or tighter than with feasible_faces.
	The cost is more computation time.
	*/

	// Moon ephemerides
	var moon_eph = planetEphemerides(t, moon);
	
	// Moon body axis
	var b_hat = get_body_axis( moon_eph.r, moon_eph.v );
	
	// We loop over the faces
	var feasibles = [];
	for (var face_nr in f_dict){
		// Here we store the reason for a vertex rebuttal
		var vertex_checks = new Array();
		// For each face we loop over its vertexes
		for (var vtx in f_dict[face_nr]) {
		    // And compute the vertex vector in the absolute frame (p) and
		    // The relative outgoing velocity needed to actually observe the given vertex
			var b = vtx_coors[f_dict[face_nr][vtx]];
			var p = addition(addition(multiplication(b_hat[0], b[0]), multiplication(b_hat[1], b[1])), multiplication(b_hat[2], b[2]));
			
			if (dot( p, vinf_in ) < 0.0){
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
				if (contains(feasibles, face_nr) == false){
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
								if (contains(feasibles, face_nr) == false){
									feasibles.push( face_nr );
									break;
								}
							}
						}
					}
		}
		
		// console.log("VTX CHECKS");
		// console.log("FACE: " + face_nr);
		// for (var v in vertex_checks){
			// console.log(v + ": " + vertex_checks[v]);
		// }
		// console.log("\n");
	}
	
	// Having a list of feasible faces we now try to bracket each face in terms of betas and rps. That is: we look for bounds of betas and rps that
	// would sort-of guarantee us to actually fly over a face.
	
	// Tight algorithm goal: put a box around vectors as close as possible to the band.
	// this version does that by calculating the intersection with rp_low, rp_high
	
	var beta_bounds = [];
	var betas = [];
	var rp_bounds = [];
	var difficult_faces = new Array(feasibles.length);
	
	for (df in difficult_faces){
		difficult_faces[df] = false;
	}
	// check_difficult = False;
	
	for (f in feasibles){
		
		var face = feasibles[f];
		
		var f_betas = [];
		var f_betas_low = [];
		var f_betas_high = [];
		var f_rps = [];
		var classifications = [];
		// vinf_outs = [];
				
		var min_height = 50. * 1000.;
		var max_height = 2000. * 1000.;
		var min_rp = 50. * 1000. + moon.radius;
		var max_rp = 2000. * 1000. + moon.radius;
			
			
		var vertices = f_dict[ face ];
		

		
		for (v in vertices){
		
			// console.log("\nVTXS AND COORS");
			// console.log(vertices);
			// console.log(vtx_coors[vertices[v]]);
		
			var b = vtx_coors[vertices[v]];
			var p = addition(addition(multiplication(b_hat[0], b[0]), multiplication(b_hat[1], b[1])), multiplication(b_hat[2], b[2]));
			
			// POINT P: 1.9295003514890907,1.7068868785570417,-4.233895543841668 
			
			
			console.log("\n\nPOINT P: " + p)
			console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
			var cp = classify_point(p, vinf_in, moon);
			var grb = get_rp_beta(p, vinf_in, cp.vinf_out, moon_eph.v, moon);

			// console.log("\nIN VERTICES LOOP");
			// console.log("VTX: "+ v);
			// console.log("B: "+ b);
			// console.log("P: "+ p);
			// console.log("Cp1: ");
			// console.log(cp.i);
			// console.log("GRB: ");
			// console.log(grb);

			
			f_rps.push(grb.rp);
			f_betas.push(grb.beta);
			classifications.push(cp.i);
			// print 'Class = %d, rp = %f' % (c, rp);
			// vinf_outs.append(vinf_out);
		}
			console.log("\nCLASSIFICATIONS: " + classifications);
			console.log("FRPS: " + f_rps);
			console.log("FBETAS: " + f_betas);
		
		// rp_bounds:
		rp_bounds.push( [
			Math.max(min(f_rps), min_rp ) / moon.radius,
			Math.min(max(f_rps), max_rp ) / moon.radius,
			] );
			
		// beta bounds:
		var f_betas_final = [];
		vertices = f_dict[ face ];
		
		var remaining_vertices = vertices.slice(0);
		
		for (var v1 = 0; v1 < vertices.length-1; v1++){
			
			// var remaining_vertices = vertices.slice(v1); // vertices[v1+1:];
			remaining_vertices.shift();
			
			
			var c1 = classifications[v1];
			var rp1 = f_rps[v1];
			var beta1 = f_betas[v1];
			var b = vtx_coors[vertices[v1]];
			
			var p1 = addition(multiplication(b_hat[0], b[0]), addition(multiplication(b_hat[1], b[1]), multiplication(b_hat[2], b[2])));
					
			// console.log("\nSECOND VTX LOOP");
			// console.log("VTX IX: "+ v1);
			// console.log("VTX: " + vertices[v1]);
			// console.log("CLASS: "+ classifications);
			// console.log("C1: " + c1);
			// console.log("RP1: "+ rp1);
			// console.log("BETA1: "+ beta1);
			// console.log("B: "+ b);
			// console.log("P1: "+ p1);
			
			
			for (jv2 in remaining_vertices){
				var v2 = parseInt(v1) + 1 + parseInt(jv2);
				var c2 = classifications[v2];
				var rp2 = f_rps[v2];
				var beta2 = f_betas[v2];
				
				// console.log("C2 "+ c2);
				// console.log("RP2: "+ rp2);
				// console.log("BETA2: "+ beta2);
				// console.log("P1: "+ p1);
				
				
				var b = vtx_coors[vertices[v2]];
				
				// vtx_coors[f_dict[face_nr][vtx]];
				
				// console.log("\nVERTICES: " + vertices);
				// console.log("REMAINING VERTICES: " + remaining_vertices);
				// console.log("V1: " + v1);
				// console.log("JV2: " + jv2);
				// console.log("V2: " + v2);
				// console.log("VTX V2: " + vertices[v2]);
				// console.log("VTX COORS[VTXS[V2]]: " + vtx_coors[vertices[v2]]);
				
				
				// console.log("B: " + b);
				// console.log("B hat: " + b_hat);
				
				var p2 = addition(multiplication(b_hat[0], b[0]), addition(multiplication(b_hat[1], b[1]), multiplication(b_hat[2], b[2])));
				
				// console.log("POINT P2");
				// console.log(p2);
				
				
				var sp = sample_points(c1, c2);
				
				if(sp){
					n_samples = 0;
					
					// console.log("\nSP IS TRUE");
					// console.log("p1: "+ p1);
					// console.log("p2: " + p2);
					// console.log("beta1: " + beta1);
					// console.log("beta2: " + beta2);
					// console.log("c1: " + c1);
					// console.log("c2: " + c2);
					// console.log("vinf in: " + vinf_in);
					// console.log("Moon: " + moon.name);
					// console.log("moon v: " + moon_eph.v);
					
					
					
					// if(graphics and (intended_face == [] || face == intended_face)){
						// [beta1, beta2] = _perform_binary_search(p1, p2, beta1, beta2, c1, c2, vinf_in, flyby_data, moon_v, n_samples, graphics, C); // search ends when both are in the band
					// }
					// else{
						bs = perform_binary_search(p1, p2, beta1, beta2, c1, c2, vinf_in, moon, moon_eph.v, n_samples); // search ends when both are in the band
					// }
					
					// console.log("BINARY SEARCH");
					// console.log(bs);
					// console.log(bs.b1);
					// console.log(bs.b2);
					
					
					if(bs.b1.length > 0){
						console.log("PUSHING CRAP INTO BETAS");
						f_betas_final.push(bs.b1);
						f_betas_final.push(bs.b2);
					}
				}
			}
		}
		
		console.log("F BETAS FINAL");
		console.log(f_betas_final);
		
		// make bounds:
		b_range = [ min(f_betas_final), max(f_betas_final) ];
		
		console.log("B RANGE");
		console.log(b_range);
		
		if (b_range[1] - b_range[0] > Math.PI){		// wraps around
			// f_betas_final = [ b+2*pi if b < 0 else b for b in f_betas_final ];
			for (b in f_betas_final){
				if (b < 0) b += 2*Math.PI;
			}
			b_range = [ min(f_betas_final), max(f_betas_final) ];
		}
		beta_bounds.push( b_range );
	}
	
	return { f: feasibles, rp: rp_bounds, beta: beta_bounds };
}


/** Binary search not working correctly, Beta list == [[null, null]] (NEEDS A FIX!) */

function perform_binary_search(p1, p2, beta1, beta2, c1, c2, vinf_in, moon, moon_v, n_samples){
	
	/** 
		Performs a binary search in order to return two points in the reachable band
	*/
	
	var min_rp = 50. * 1000. + moon.radius;
	var max_rp = 2000. * 1000. + moon.radius;
	
	if(c1 == 1 && c2 == 1){
		console.log("\nFINALLY!!!");
		return {b1: beta1, b2: beta2};
	}
	
	if(n_samples > 50){
		console.log("Maximum number of recursions reached");
		return {b1: [], b2: []};
	}
	

	var p_i = division(addition(p1, p2), 2.0);
	var cp = classify_point(p_i, vinf_in, moon);
	var grb_i = get_rp_beta(p_i, vinf_in, cp.vinf_out, moon_v, moon);
	// print 'sample %d, min_rp = %f, rp = %f, max_rp = %f, c = %d' % (n_samples, min_rp, rp_i, max_rp, cp.i)
	
	// if (n_samples=0){
	// console.log("\nBIN_SEARCH: SAMPLE " + n_samples);
	// console.log("P1: ");
	// console.log(p1);
	// console.log("P2: ");
	// console.log(p2);
	// console.log("C1: " + c1 + ", C2: " + c2);
	// console.log("CPi: " + cp.i);
	// console.log("Pi: " + p_i);
	// console.log("CP: ");
	// console.log(cp);
	// console.log("GET RP B");
	// console.log(grb_i);
	// }
	
	n_samples += 1;
	
	if((grb_i.rp < min_rp || grb_i.rp > max_rp) && cp.i == 1) console.log("Wrong classification!!!");

	if(cp.i == 1 && c1 == 1){
		console.log("FINALLY 2!!!");
		return {b1: grb_i.beta, b2: beta1};
	}
	else if(cp.i == 1 && c2 == 1){
		console.log("FINALLY 3!!!");
		return {b1: grb_i.beta, b2: beta2};
	}
	else{
		if(c1 == 1){
			// console.log("search on with c1=1");
			bs = perform_binary_search(p1, p_i, beta1, grb_i.beta, c1, cp.i, vinf_in, moon, moon_v, n_samples);
			return {b1: bs.b1, b2: bs.b2};
		}
		else if(c2 == 1){
			// console.log("search on with c2=1");
			bs = perform_binary_search(p2, p_i, beta2, grb_i.beta, c2, cp.i, vinf_in, moon, moon_v, n_samples);
			return {b1: bs.b1, b2: bs.b2};
		}
		else if(c1 <= 0 && cp.i <= 0){
			// console.log("search on with c1<=0, cp.i<=0");
			bs = perform_binary_search(p2, p_i, beta2, grb_i.beta, c2, cp.i, vinf_in, moon, moon_v, n_samples);
			return {b1: bs.b1, b2: bs.b2};
		}
		else if(c1 == 2 && cp.i == 2){
			// console.log("search on with c2=2, cp.i=2");
			bs = perform_binary_search(p2, p_i, beta2, grb_i.beta, c2, cp.i, vinf_in, moon, moon_v, n_samples);
			return {b1: bs.b1, b2: bs.b2};
		}
		else if(c2 <= 0 && cp.i <= 0){
			// console.log("search on with c2<=0, cp.i<=0");
			bs = perform_binary_search(p1, p_i, beta1, grb_i.beta, c1, cp.i, vinf_in, moon, moon_v, n_samples);
			return {b1: bs.b1, b2: bs.b2};
		}
		else if(c2 == 2 && cp.i == 2){
			// console.log("search on with c2=2, cp.i=2");
			bs = perform_binary_search(p1, p_i, beta1, grb_i.beta, c1, cp.i, vinf_in, moon, moon_v, n_samples);
			return {b1: bs.b1, b2: bs.b2};
		}
		else if(cp.i == 1 && c1 > -1){
			// console.log("search on with cp.i=1, c1>-1");
			bs = perform_binary_search(p1, p_i, beta1, grb_i.beta, c1, cp.i, vinf_in, moon, moon_v, n_samples);
			return {b1: bs.b1, b2: bs.b2};
		}
		else if(cp.i == 1 && c2 > -1){
			// console.log("search on with cp.i=1, c2>-1");
			bs = perform_binary_search(p1, p_i, beta1, grb_i.beta, c1, cp.i, vinf_in, moon, moon_v, n_samples);
			return {b1: bs.b1, b2: bs.b2};
		}
	}
}



