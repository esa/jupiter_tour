#!/usr/bin/env ipython
# -*- coding: cp1252 -*-
# {written with Tab indenting 4 spaces}


"""
Code for getting the observable faces, given arrival conditions at a moon,
and the rp & beta bounds to observe them.

-- Luís & Dario, 2012-09-18
"""


import PyKEP as pk
import numpy as np
import pdb

from math import pi, sin, acos, asin, sqrt, atan2
from collections import namedtuple



#--------------------------------------# 


_moon_flyby = namedtuple( 'moon_flyby', ['mjd2000', 'moon', 'vinf_in', 'rp', 'beta'] )


#--------------------------------------# Determining feasible faces


def feasible_faces(oMoon,sEpoch,vinf_in):
	"""
	Returns the observable faces and a guess on the bounds to actually observe them
	"""
	from PyKEP import epoch

	#Moon ephemerides
	moon_r, moon_v = oMoon.eph(epoch(sEpoch,epoch.epoch_type.MJD))
	#Moon body axis
	b_hat = get_body_axis( moon_r, moon_v )
	
	#We loop over the faces
	feasibles = []
	for face_nr,face_vertices in f_dict.iteritems():
		#Here we store the reason for a vertex rebuttal
		vertex_checks = {}
		#For each face we loop over its vertexes
		for vtx in face_vertices:
		    #And compute the vertex vector in the absolute frame (p) and
		    #The relative outgoing velocity needed to actually observe the given vertex
			b = vtx_coors[vtx]
			p = b[0] * b_hat[0] + b[1] * b_hat[1] + b[2] * b_hat[2]
			if np.dot( p, vinf_in ) < 0.:
				vertex_checks[ vtx ] = 'dot'	# vertex in the visible hemisphere (unreachable)
				continue
			vinf_out = vinf_out_from_p( vinf_in, p )
			
			# We now know the vertex is in the far hemisphere: there exist a value of rp to reach it. We check that
			#this valuse is within the allowed bounds
			eq, ineq = fb_conNEW( vinf_in, vinf_out, oMoon, (50. * 1000., 2000. * 1000.) )
			vertex_checks[ vtx ] = ( ineq[0]<0, ineq[1]<0 )
				# (True, True): vertex within the band; can be reached directly
				# (False, True): vertex in between the band and the "relative" equator
				# (True, False): vertex it's above the band
			
			# If the vertex is in the band, the face is feasible
			if ineq[0] * ineq[1] > 0:
				feasibles.append( face_nr )
				vertex_checks = {}
				break
		# If no vertex was in the band:
		if len(vertex_checks) > 0:
			vtx_outcomes = set( vertex_checks.values() )
			if len(vtx_outcomes) == 1:
				# face is unfeasible because either all vertixes are above, or all below, or all on the visible side
				continue
			if (True, False) in vtx_outcomes:
				# this handles the case in which at least one of the vertexes is above the band, and the other vertices do not lie
				# within the band, but are either within the visible side or below the bend
				#yield face_nr, ( vtx for vtx,outc in vertex_checks.iteritems() if outc == (False, True) ).next()
				feasibles.append( face_nr )
	
	#Having a list of feasible faces we now try to bracket each face in terms of betas and rps. That is: we look for bounds of betas and rps that
	#would sort-of guarantee us to actually fly over a face.
	print feasibles
	betas = []
	for face in feasibles:
		f_betas = []
		for vtx in f_dict[ face ]:
			b = vtx_coors[vtx]
			p = b[0] * b_hat[0] + b[1] * b_hat[1] + b[2] * b_hat[2]
			if np.dot( p, vinf_in ) < 0.:
				f_betas.append( p_to_beta( p, moon_v, vinf_in, unfeasible=True ) )
			else:
				f_betas.append( p_to_beta( p, moon_v, vinf_in, unfeasible=False ) )
		betas.append( f_betas )

	beta_bounds = []
	for f_betas in betas:
		b_range = ( min(f_betas), max(f_betas) )
		if b_range[1] - b_range[0] > pi:		# wraps around
			f_betas = [ b+2*pi if b < 0 else b for b in f_betas ]
			b_range = ( min(f_betas), max(f_betas) )
		beta_bounds.append( b_range )

	
	i = 0
	rp_bounds = []
	for face in feasibles:
		f_rps = []
		for vtx in f_dict[ face ]:
			b = vtx_coors[vtx]
			p = b[0] * b_hat[0] + b[1] * b_hat[1] + b[2] * b_hat[2]
			if np.dot( p, vinf_in ) < 0.:
				f_rps.append( 10e100 )
			else:
				vinf_out = vinf_out_from_p( vinf_in, p )
				alpha = acos( np.dot(vinf_in, vinf_out) / np.linalg.norm( vinf_in ) / np.linalg.norm( vinf_out ) )
				rp = oMoon.mu_self / np.dot(vinf_in, vinf_in) * ( 1. / sin(alpha/2.) - 1. )
				f_rps.append( rp )
				#raise Exception

		r_range = (
			max(min(f_rps),   50. * 1000. + oMoon.radius ) / oMoon.radius,
			min(max(f_rps), 2000. * 1000. + oMoon.radius ) / oMoon.radius,
			) 
		print str(feasibles[i]) + ' ' + str(r_range)
		i = i + 1
		rp_bounds.append(r_range)
	
	return feasibles, rp_bounds, beta_bounds
	
	

#--------------------------------------# 
# reimplementation of PyKEP.fb_con() for checking both whether flyby is below safe_radius (50km above moon.radius),
# and if it's above the maximum allowed radius (2000km above moon.radius)
# see: http://sourceforge.net/p/keptoolbox/code/ci/ef0454a6a69403a1786a4e7920c3fe036a916ad2/tree/src/core_functions/fb_con.h#l55
def fb_conNEW( v_rel_in, v_rel_out, pl, radius ):
	"""
	- v_rel_in: cartesian coordinates of the relative hyperbolic velocity before the fly-by
	- vout: vout, cartesian coordinates of the relative hyperbolic velocity after the fly-by
	- pl: fly-by planet
	- radius: tuple with the range of heights above pl.radius in which the flyby can take place
	
	Returns a tuple containing (eq, ineq).
	  eq represents the violation of the equality constraint |v_rel_in|-¦ =|vout|-¦.
	  ineq represents the violation of the inequality constraints on the hyperbola asymptote maximum deflection
	"""
	Vin2  = v_rel_in[0]  * v_rel_in[0]  + v_rel_in[1]  * v_rel_in[1]  + v_rel_in[2]  * v_rel_in[2]
	Vout2 = v_rel_out[0] * v_rel_out[0] + v_rel_out[1] * v_rel_out[1] + v_rel_out[2] * v_rel_out[2]
	eq_V2 = Vin2 - Vout2
	
	#try:
	arg_acos = (v_rel_in[0]*v_rel_out[0] + v_rel_in[1]*v_rel_out[1] + v_rel_in[2]*v_rel_out[2]) / sqrt(Vin2) / sqrt (Vout2) 
	# when v_rel_in = v_rel_out, arg_acos can get bigger than 1 because of roundoff:
	if(arg_acos > 1.0):
		arg_acos = 1.0;
	elif(arg_acos < -1.0):
		arg_acos = -1.0;
	alpha = acos( arg_acos )
	#except:
	#	print 'domain error %f' % value
	#	pdb.set_trace();
	#e = 1. + rp / mu * Vin2
	e_range = [
		1. + (pl.radius + h) / pl.mu_self * Vin2
		for h in radius
		]
	alpha_min = 2. * asin(1./e_range[1])
	alpha_max = 2. * asin(1./e_range[0])
	
	ineq_delta = [
		alpha_min - alpha,
		alpha - alpha_max
		]
	
	#print 'e_range',e_range
	#print 'alpha: %s, alpha_min: %f, alpha_max: %f' % ( degrees(alpha), degrees(alpha_min), degrees(alpha_max) )
	#print 'ineq_delta',ineq_delta
	return eq_V2, ineq_delta #, (degrees(alpha), degrees(alpha_min), degrees(alpha_max))


def get_body_axis( r, v ):
	# see section 6.3
	b1_hat = -1.0 * np.array( r )
	b3_hat = np.cross( r, v )
	b2_hat = np.cross( b3_hat, b1_hat )
	b1_hat = b1_hat / np.linalg.norm(b1_hat)
	b2_hat = b2_hat / np.linalg.norm(b2_hat)
	b3_hat = b3_hat / np.linalg.norm(b3_hat)
	return b1_hat, b2_hat, b3_hat
	

def vinf_out_from_p( vinf_in, p, unfeasible=False ):
	"""
	implements the formula which propagates a flyby fixing the face point covered
	
	(b1,b2,b3): body coordinates of a chosen point on the planetary surface
	"""
	#compute the point position vector
	if unfeasible:
		#maps the point to the far hemisphere
		vinf_in_hat = np.array(vinf_in) / np.linalg.norm(vinf_in)
		p = np.subtract( p, 1.01 * np.dot(p, vinf_in_hat) * vinf_in_hat )
	#normalize
	p_hat = p / np.linalg.norm(p)
	
	# spacecraft relative velocity out needed in order to see the vertex
	vinf_out = np.array(vinf_in) - 2 * np.dot( vinf_in, p_hat ) * p_hat
	return vinf_out
	


#--------------------------------------# Getting the rp and beta required to observe a face


def get_fb_axis( vinf_in, v_planet ):
	"""
	computes the reference frames where beta is defined, as defined in the keplerian toolbox
	"""
	# http://sourceforge.net/p/keptoolbox/code/ci/ef0454a6a69403a1786a4e7920c3fe036a916ad2/tree/src/core_functions/fb_prop.h
	i_hat = np.array( vinf_in )
	j_hat = np.cross( i_hat, v_planet )
	k_hat = np.cross( i_hat, j_hat )
	
	i_hat = i_hat / np.linalg.norm(i_hat)
	j_hat = j_hat / np.linalg.norm(j_hat)
	k_hat = k_hat / np.linalg.norm(k_hat)
	return i_hat, j_hat, k_hat
	

def p_to_beta( p, v_M, vinf_in, unfeasible=False ):
	"""
	beta angle required to fly a face vertex, even if unfeasible
	"""
	#was:
	#beta angle required to fly the mid point of the face, even if unfeasible
	#b = face_mid_pt[ face_nr ]
	vinf_out = vinf_out_from_p( vinf_in, p, unfeasible )
	return vinfs_to_beta( vinf_in, vinf_out, v_M )

def vinfs_to_beta( vinf_in, vinf_out, v_planet ):
	"""
	beta angle from the hyperbolic velocities
	
	# VALIDATION:
	>>> beta = .23456
	>>> abs_v_in, v_planet = [1,0,0], [0,1,0]
	>>> abs_v_out = pk.fb_prop(abs_v_in, v_planet, 2, beta, 1)
	>>> b = vinfs_to_beta( np.subtract( abs_v_in, v_planet ), np.subtract( abs_v_out, v_planet ), v_planet )
	>>> beta == b
	"""
	i = get_fb_axis( vinf_in, v_planet )
	beta = atan2( np.dot(vinf_out, i[2]), np.dot(vinf_out, i[1]) )
	return beta


#--------------------------------------# 

def _classify_point(p, vinf_in, flyby_data):
	
	vinf_out = vinf_out_from_p( vinf_in, p )

	if np.dot( p, vinf_in ) < 0.:
		classification = -1;	# vertex in the visible hemisphere (unreachable)
		return [classification, vinf_out];

	
	# We now know the vertex is in the far hemisphere: there exist a value of rp to reach it. We check that
	#this valuse is within the allowed bounds
	eq, ineq = fb_conNEW( vinf_in, vinf_out, flyby_data.moon, (50. * 1000., 2000. * 1000.) )
	check = ( ineq[0]<0, ineq[1]<0 )
		# (True, True): vertex within the band; can be reached directly
		# (False, True): vertex in between the band and the "relative" equator
		# (True, False): vertex it's above the band
	if(check == (False, True)):
		# below
		return [0, vinf_out];
	elif(check == (True, True)):
		# in
		return [1, vinf_out];
	else:
		# above
		return [2, vinf_out];
		
def _sample_points(classification_1, classification_2):
	# only sample in between points that are not on the same side of the band:
	if(classification_1 == 1 or classification_2 == 1):
		return True;
	elif((classification_1 == -1 or classification_1 == 0) and (classification_2 == 2)):
		return True;
	elif((classification_1 == 2) and (classification_2 == -1 or classification_2 == 0)):
		return True;
	else:
		return False;
		

def feasible_faces_tight( flyby_data, graphics=False, n_steps = 50):
	
	#from matplotlib import pyplot as pl
	#from mpl_toolkits.mplot3d import axes3d, Axes3D

	"""
	Returns the observable faces and a guess on the bounds to actually observe them.
	The word tight means that the bounds on rp, beta are as tight or tighter than with feasible_faces.
	The cost is more computation time.
	"""
	flyby_data = _moon_flyby( *flyby_data )
	vinf_in = np.array( flyby_data.vinf_in )
	
	#Moon ephemerides
	moon_r, moon_v = flyby_data.moon.eph( pk.epoch( flyby_data.mjd2000 ) )
	#Moon body axis
	b_hat = get_body_axis( moon_r, moon_v )
	
	#We loop over the faces
	#We loop over the faces
	feasibles = []
	for face_nr,face_vertices in f_dict.iteritems():
		#Here we store the reason for a vertex rebuttal
		vertex_checks = {}
		#For each face we loop over its vertexes
		for vtx in face_vertices:
		    #And compute the vertex vector in the absolute frame (p) and
		    #The relative outgoing velocity needed to actually observe the given vertex
			b = vtx_coors[vtx]
			p = b[0] * b_hat[0] + b[1] * b_hat[1] + b[2] * b_hat[2]
			if np.dot( p, vinf_in ) < 0.:
				vertex_checks[ vtx ] = 'dot'	# vertex in the visible hemisphere (unreachable)
				continue
			vinf_out = vinf_out_from_p( vinf_in, p )
			
			# We now know the vertex is in the far hemisphere: there exist a value of rp to reach it. We check that
			#this valuse is within the allowed bounds
			eq, ineq = fb_conNEW( vinf_in, vinf_out, flyby_data.moon, (50. * 1000., 2000. * 1000.) )
			vertex_checks[ vtx ] = ( ineq[0]<0, ineq[1]<0 )
				# (True, True): vertex within the band; can be reached directly
				# (False, True): vertex in between the band and the "relative" equator
				# (True, False): vertex it's above the band
			
			# If the vertex is in the band, the face is feasible
			if ineq[0] * ineq[1] > 0:
				feasibles.append( face_nr )
				vertex_checks = {}
				break
		# If no vertex was in the band:
		if len(vertex_checks) > 0:
			vtx_outcomes = set( vertex_checks.values() )
			if len(vtx_outcomes) == 1:
				# face is unfeasible because either all vertixes are above, or all below, or all on the visible side
				continue
			if (True, False) in vtx_outcomes:
				# this handles the case in which at least one of the vertexes is above the band, and the other vertices do not lie
				# within the band, but are either within the visible side or below the bend
				#yield face_nr, ( vtx for vtx,outc in vertex_checks.iteritems() if outc == (False, True) ).next()
				feasibles.append( face_nr )
	
	#Having a list of feasible faces we now try to bracket each face in terms of betas and rps. That is: we look for bounds of betas and rps that
	#would sort-of guarantee us to actually fly over a face.
	
	# Tight algorithm goal: put a box around vectors as close as possible to the band.
	# Outline:
	# 1) make a larger list of vectors on the basis of the face vertex lists (below, in, above), and determine their beta, rp, and whether they are above, in, or below the band
	# 2) Take as box the largest (smallest?) rp, beta with the vector below the band, and the smallest (largest?) rp, beta with the vector above the band
	#    If this is impossible, put the bounds around the ones in the band.
	
	beta_bounds = [];
	betas = [];
	rp_bounds = [];
	difficult_faces = [False] * len(feasibles);
	#check_difficult = False;
	
	for f in range(len(feasibles)):
		
		face = feasibles[f];
		
		f_betas = [];
		#f_betas_dot = [];
		f_betas_above = [];
		f_betas_below = [];
		f_betas_in = [];
		
		f_rps = []
		#f_rps_dot = []
		f_rps_above = []
		f_rps_below = []
		f_rps_in = []
		
		
		if(graphics):
			fig = pl.figure();
			pl.hold(True);
			ax = Axes3D(fig)
				
		# generate points in between all vertices:
		vertices = f_dict[ face ];
		for v1 in range(len(vertices)):
			b = vtx_coors[vertices[v1]]
			p1 = b[0] * b_hat[0] + b[1] * b_hat[1] + b[2] * b_hat[2]
			remaining_vertices = vertices[v1+1:];
			
			for v2 in remaining_vertices:
				b = vtx_coors[v2]
				p2 = b[0] * b_hat[0] + b[1] * b_hat[1] + b[2] * b_hat[2]
				
				if(graphics):
					ax.plot3D([p1[0]], [p1[1]], [p1[2]], 'x', color=(0,0,0));
					ax.plot3D([p2[0]], [p2[1]], [p2[2]], 'x', color=(0,0,0));
				
				[c1, vinf_in1] = _classify_point(p1, vinf_in, flyby_data);
				[c2, vinf_in2] = _classify_point(p2, vinf_in, flyby_data);
				sp = _sample_points(c1, c2);
				
				if(sp):
					
					delta_p = p2 - p1;
					for s in range(n_steps):
						# the factor multiplied with delta_p should not be 0, 1.
						pp = p1 + ((float(s) + 1.0) / (n_steps + 2.0)) * delta_p;
						pp = pp / np.linalg.norm( pp );
						
						if(graphics):
							ax.plot3D([pp[0]], [pp[1]], [pp[2]], 'o', color=(0,0,0));
						
						# checks for each point:
						if np.dot( pp, vinf_in ) < 0.:
							beta = p_to_beta( pp, moon_v, flyby_data.vinf_in, unfeasible=True );
							f_betas.append( beta );
							#f_betas_dot.append( beta );
							f_rps.append( 10e100 )
							#f_rps_dot.append( 10e100 )
						else:
							beta = p_to_beta( pp, moon_v, flyby_data.vinf_in, unfeasible=False );
							f_betas.append( beta )
							vinf_out = vinf_out_from_p( vinf_in, pp )
							
							#try:
							nvi = np.linalg.norm( vinf_in );
							nvo = np.linalg.norm( vinf_out );
							if(nvo > 1E-9 and nvi > 1E-9):
								ndio = np.dot(vinf_in, vinf_out);
								acos_arg = ndio / nvi / nvo;
								if(acos_arg > 1.0):
									acos_arg = 1.0;
								elif(acos_arg < -1.0):
									acos_arg = -1.0;
								alpha = acos( acos_arg )
							else:
								f_betas.pop();
								continue;
							#except:
								#print 'Unexpected Error'
								#pdb.set_trace();
							dot_vi_vi = np.dot(vinf_in, vinf_in);
							sa = sin(alpha/2.);
							if(dot_vi_vi > 1E-9 and np.abs(sa) > 1E-9):
								rp = flyby_data.moon.mu_self / dot_vi_vi * ( 1. / sa - 1. )
							else:
								f_betas.pop();
								continue;
							f_rps.append( rp );
							
							# We now know the vertex is in the far hemisphere: there exist a value of rp to reach it. We check that
							#this valuse is within the allowed bounds
							eq, ineq = fb_conNEW( vinf_in, vinf_out, flyby_data.moon, (50. * 1000., 2000. * 1000.) )
								# (True, True): vertex within the band; can be reached directly
								# (False, True): vertex in between the band and the "relative" equator
								# (True, False): vertex it's above the band
							if(ineq[0]<0 and ineq[1]<0):
								f_betas_in.append(beta)
								f_rps_in.append(rp);
							elif(ineq[0]>=0 and ineq[1]<0):
								f_betas_below.append(beta);
								f_rps_below.append(rp);
							else:
								f_betas_above.append(beta);
								f_rps_above.append(rp);
		if(f_betas != [] and f_rps != []):
			if(graphics):
				print 'mean = %f, median = %f' % (np.mean(f_betas), np.median(f_betas))
				pl.figure();
				pl.hold(True);
				pl.plot([2000. * 1000. + flyby_data.moon.radius]*len(f_betas), f_betas, color=(1.0,0.0,0.0));
				pl.plot([50. * 1000. + flyby_data.moon.radius]*len(f_betas), f_betas, color=(0.0,0.0,1.0));
			
			if(f_rps_below != []):
				rps_max = min(f_rps_below);
				mr = min(rps_max, 2000. * 1000. + flyby_data.moon.radius );
				if(mr != 2000. * 1000. + flyby_data.moon.radius):
					print 'useful'
				if(graphics):
					pl.plot(f_rps_below, f_betas_below, 'x', color=(1.0,0.0,0.0));
			else:
				rps_max = max(f_rps);
			
			if(f_rps_above != []):
				rps_min = max(f_rps_above);
				mr = max(rps_min, 50. * 1000. + flyby_data.moon.radius );
				if(mr != 50. * 1000. + flyby_data.moon.radius):
					print 'useful'
				if(graphics):
					pl.plot(f_rps_above, f_betas_above, 'x', color=(0.0,0.0,1.0));
			else:
				rps_min = min(f_rps);
			
			if(f_rps_in != []):
				
				if(graphics):
					pl.plot(f_rps_in, f_betas_in, 'x', color=(0.0,1.0,0.0));
					print 'mean = %f, median = %f' % (np.mean(f_betas_in), np.median(f_betas_in))
				
				if(len(f_rps_in) >= 3):
					# enough points to estimate the box
					if(np.abs(np.mean(f_betas_in) - np.median(f_betas_in)) > 0.75):
						if(graphics):
							print 'face %d: wrap around' % (face)
						
						# wrap around, make a box around only positive / negative points
						pos_in = [];
						neg_in = [];
						for b in f_betas_in:
							if(b >= 0):
								pos_in.append(b);
							else:
								neg_in.append(b);
						if(len(pos_in) > len(neg_in)):
							f_betas = pos_in;
						else:
							f_betas = neg_in;
					else:
						if(graphics):
							print 'face %d: points nicely distributed' % (face)
						f_betas = f_betas_in;
				else:
					if(graphics):
						print 'face %d: too few points' % (face)
					# not enough points in the band:
					difficult_faces[f] = True;
					#check_difficult = True;
			else:
				# no points in band:
				if(graphics):
					print 'face %d: no points in band' % (face)
				# not enough points in the band:
				difficult_faces[f] = True;
					
			if(rps_min > rps_max):
				pdb.set_trace();
			
			
			if(graphics):
				pl.show();
			
			rp_bounds.append( (
				max(rps_min,   50. * 1000. + flyby_data.moon.radius ) / flyby_data.moon.radius,
				min(rps_max, 2000. * 1000. + flyby_data.moon.radius ) / flyby_data.moon.radius,
				) )
			
			betas.append(f_betas);
		else:
			# no points were sampled, append dummy data for deletion:
			betas.append([0.0]);
			rp_bounds.append( (
				( 50. * 1000. + flyby_data.moon.radius ) / flyby_data.moon.radius,
				( 2000. * 1000. + flyby_data.moon.radius ) / flyby_data.moon.radius,
				) )
			difficult_faces[f] = True;
			
	
	beta_bounds = []
	for f_betas in betas:
		b_range = ( min(f_betas), max(f_betas) )
		if b_range[1] - b_range[0] > pi:		# wraps around
			f_betas = [ b+2*pi if b < 0 else b for b in f_betas ]
			b_range = ( min(f_betas), max(f_betas) )
		beta_bounds.append( b_range )
	
	
	# remove "difficult" faces
	#if(check_difficult):
		#pdb.set_trace();
	
	for f in range(len(feasibles)-1, -1, -1):
		if(difficult_faces[f]):
			del feasibles[f];
			del rp_bounds[f];
			del beta_bounds[f];
	
	if(feasibles == []):
		#print 'No faces feasible according to tight test, reverting to feasible faces'
		return feasible_faces( flyby_data );
		
	
	return feasibles, rp_bounds, beta_bounds
	


#--------------------------------------#

def _get_rp_beta(pp, vinf_in, vinf_out, moon_v, flyby_data, get_all_info = False):
	
	if(get_all_info):
		alpha = [];
		dot_vi_vi = np.dot(vinf_in, vinf_in);
	
	# checks for each point:
	if np.dot( pp, vinf_in ) < 0.:
		beta = p_to_beta( pp, moon_v, flyby_data.vinf_in, unfeasible=True );
		rp = 10e100;
		alpha = 0;
		
	else:
		beta = p_to_beta( pp, moon_v, flyby_data.vinf_in, unfeasible=False );
		vinf_out = vinf_out_from_p( vinf_in, pp )
		nvi = np.linalg.norm( vinf_in );
		nvo = np.linalg.norm( vinf_out );
		if(nvo > 1E-9 and nvi > 1E-9):
			ndio = np.dot(vinf_in, vinf_out);
			acos_arg = ndio / nvi / nvo;
			if(acos_arg > 1.0):
				acos_arg = 1.0;
			elif(acos_arg < -1.0):
				acos_arg = -1.0;
			alpha = acos( acos_arg )
			dot_vi_vi = np.dot(vinf_in, vinf_in);
			sa = sin(alpha/2.);
			if(dot_vi_vi > 1E-9 and np.abs(sa) > 1E-9):
				rp = flyby_data.moon.mu_self / dot_vi_vi * ( 1. / sa - 1. )
			else:
				#print 'vivi, sa too small, vinf_out = %f, %f, %f' % (vinf_out[0], vinf_out[1], vinf_out[2])
				rp = 10e100
				#pdb.set_trace();

		else:
			#print 'nvo, nvi too small'
			rp = 10e100;
			alpha = 0;
			#pdb.set_trace();

	if(get_all_info):
		return [rp, beta, alpha, dot_vi_vi];
	else:
		return [rp, beta];


def feasible_faces_tight_lines( flyby_data, graphics=False, intended_face=[]):
	
	#from matplotlib import pyplot as pl
	#from mpl_toolkits.mplot3d import axes3d, Axes3D

	"""
	Returns the observable faces and a guess on the bounds to actually observe them.
	The word tight means that the bounds on rp, beta are as tight or tighter than with feasible_faces.
	The cost is more computation time.
	"""
	
	flyby_data = _moon_flyby( *flyby_data )
	vinf_in = np.array( flyby_data.vinf_in )
	
	#Moon ephemerides
	moon_r, moon_v = flyby_data.moon.eph( pk.epoch( flyby_data.mjd2000 ) )
	#Moon body axis
	b_hat = get_body_axis( moon_r, moon_v )
	
	#We loop over the faces
	feasibles = []
	for face_nr,face_vertices in f_dict.iteritems():
		#Here we store the reason for a vertex rebuttal
		vertex_checks = {}
		#For each face we loop over its vertexes
		for vtx in face_vertices:
		    #And compute the vertex vector in the absolute frame (p) and
		    #The relative outgoing velocity needed to actually observe the given vertex
			b = vtx_coors[vtx]
			p = b[0] * b_hat[0] + b[1] * b_hat[1] + b[2] * b_hat[2]
			if np.dot( p, vinf_in ) < 0.:
				vertex_checks[ vtx ] = 'dot'	# vertex in the visible hemisphere (unreachable)
				continue
			vinf_out = vinf_out_from_p( vinf_in, p )
			
			# We now know the vertex is in the far hemisphere: there exist a value of rp to reach it. We check that
			#this valuse is within the allowed bounds
			eq, ineq = fb_conNEW( vinf_in, vinf_out, flyby_data.moon, (50. * 1000., 2000. * 1000.) )
			vertex_checks[ vtx ] = ( ineq[0]<0, ineq[1]<0 )
				# (True, True): vertex within the band; can be reached directly
				# (False, True): vertex in between the band and the "relative" equator
				# (True, False): vertex it's above the band
			
			# If the vertex is in the band, the face is feasible
			if ineq[0] * ineq[1] > 0:
				feasibles.append( face_nr )
				vertex_checks = {}
				break
		# If no vertex was in the band:
		if len(vertex_checks) > 0:
			vtx_outcomes = set( vertex_checks.values() )
			if len(vtx_outcomes) == 1:
				# face is unfeasible because either all vertixes are above, or all below, or all on the visible side
				continue
			if (True, False) in vtx_outcomes:
				# this handles the case in which at least one of the vertexes is above the band, and the other vertices do not lie
				# within the band, but are either within the visible side or below the bend
				#yield face_nr, ( vtx for vtx,outc in vertex_checks.iteritems() if outc == (False, True) ).next()
				feasibles.append( face_nr )
	
	#Having a list of feasible faces we now try to bracket each face in terms of betas and rps. That is: we look for bounds of betas and rps that
	#would sort-of guarantee us to actually fly over a face.
	
	# Tight algorithm goal: put a box around vectors as close as possible to the band.
	# this version does that by calculating the intersection with rp_low, rp_high
	
	beta_bounds = [];
	betas = [];
	rp_bounds = [];
	#difficult_faces = [False] * len(feasibles);
	#check_difficult = False;
	
	for f in range(len(feasibles)):
		
		face = feasibles[f];
		
		f_betas = [];
		f_betas_low = [];
		f_betas_high = [];
		f_rps = []
		f_l_rps = [];
		classifications = [];
		#vinf_outs = [];
				
		min_height = 50. * 1000.
		max_height = 2000. * 1000.
		min_rp = 50. * 1000. + flyby_data.moon.radius 
		max_rp = 2000. * 1000. + flyby_data.moon.radius 
		l_min_rp = np.log10(min_rp);
		l_max_rp = np.log10(max_rp);
				
		#if(graphics):
		#	if(intended_face == [] or intended_face == face):
		#		pl.figure();		

		vertices = f_dict[ face ];
		for v in range(len(vertices)):
			b = vtx_coors[vertices[v]]
			pp = b[0] * b_hat[0] + b[1] * b_hat[1] + b[2] * b_hat[2]
			[c, vinf_out] = _classify_point(pp, vinf_in, flyby_data);
			[rp, beta] = _get_rp_beta(pp, vinf_in, vinf_out, moon_v, flyby_data);
			f_rps.append(rp);
			f_l_rps.append(np.log10( rp  ))
			f_betas.append(beta);
			classifications.append(c);
			#vinf_outs.append(vinf_out);		

		# rp_bounds:
		rp_bounds.append( (
			max(min(f_rps), min_rp ) / flyby_data.moon.radius,
			min(max(f_rps), max_rp ) / flyby_data.moon.radius,
			) )
			
		# beta bounds:
		vertices = f_dict[ face ];
		for v1 in range(len(vertices)):
			remaining_vertices = vertices[v1+1:];
			c1 = classifications[v1];
			rp1 = f_rps[v1];
			beta1 = f_betas[v1];
			lrp1 = f_l_rps[v1];
			
			for v2 in range(len(remaining_vertices)):
				#pdb.set_trace();
				or_ind = v1+1+v2;
				c2 = classifications[or_ind];
				rp2 = f_rps[or_ind];
				lrp2 = f_l_rps[or_ind];
				beta2 = f_betas[or_ind];
				
				sp = _sample_points(c1, c2);
				
				if(sp):
					# map too large lrps to 7
					if(lrp1 > 7):
						lrp1_ = 7;
					else:
						lrp1_ = lrp1;
						
					if(lrp2 > 7):
						lrp2_ = 7;
					else:
						lrp2_ = lrp2;
					
					delta_beta = beta2 - beta1;
					delta_lrp = lrp2_ - lrp1_;
					
					# do not calculate intersection if vertical line or if delta_beta wraps around the face:
					if(np.abs(delta_lrp) > 1e-5 and np.abs(delta_beta) < pi):
						# beta = a * log10(rp) + b
						a = delta_beta / delta_lrp;
						b = beta1 -a * lrp1_;
						beta_low = a * l_min_rp + b;
						beta_high = a * l_max_rp + b;
						
						f_betas_low.append(beta_low);
						f_betas_high.append(beta_high);
						
						#if(graphics):
						#	if(intended_face == [] or intended_face == face):
						#		pl.hold(True);
						#		pl.plot(lrp1_, beta1, 'x', color=(0.0,0.0,0.0));
						#		pl.plot(lrp2_, beta2, 'x', color=(0.0,0.0,0.0));
								
						#		#if(c1 != -1 and c2 != -1):
						#		b = vtx_coors[vertices[v1]]
						#		p1 = b[0] * b_hat[0] + b[1] * b_hat[1] + b[2] * b_hat[2]
						#		b = vtx_coors[vertices[or_ind]]
						#		p2 = b[0] * b_hat[0] + b[1] * b_hat[1] + b[2] * b_hat[2]
						#		delta_p = p2 - p1;
						#		n_steps = 50;
						#		for s in range(n_steps):
						#			pp = p1 + ((s+1.0)/ (n_steps+1.0)) * delta_p;
						#			[c, vinf_out] = _classify_point(pp, vinf_in, flyby_data);
						#			[rp, beta] = _get_rp_beta(pp, vinf_in, vinf_out, moon_v, flyby_data);
						#			if(rp > 1e7):
						#				rp = 1e7;
						#			pl.plot(np.log10(rp ), beta, 'o', color=(0.0,0.0,0.0));
						#		
						#		pl.plot([lrp1_, lrp2_], [beta1, beta2], color = (0.0,0.0,0.0));
						#		pl.plot(l_min_rp, beta_low, 'x', color=(1.0,0.0,0.0));
						#		pl.plot(l_max_rp, beta_high, 'x', color=(0.0,0.0,1.0));

		min_f_betas = max([min(f_betas_low), min(f_betas_high)]);
		max_f_betas = min([max(f_betas_low), max(f_betas_high)]);
		f_betas = [min_f_betas, max_f_betas];
		
		if(f_betas == []):
			# no points were intersected:
			difficult_faces[f] = True;
			betas.append([0.0]);
		else:
			betas.append(f_betas);	
		
			#if(graphics):
			#	if(intended_face == [] or intended_face == face):
			#		b_range = ( min(f_betas), max(f_betas) )
			#		if b_range[1] - b_range[0] > pi:		# wraps around
			#			f_betas = [ b+2*pi if b < 0 else b for b in f_betas ]
			#			b_range = ( min(f_betas), max(f_betas) )
			#		pl.plot([l_min_rp, l_max_rp], [b_range[0]] * 2, color=(1.0,0.0,1.0));
			#		pl.plot([l_min_rp, l_max_rp], [b_range[1]] * 2, color=(1.0,0.0,1.0));
			#		pl.show();
			
	
	beta_bounds = []
	for f_betas in betas:
		b_range = ( min(f_betas), max(f_betas) )
		if b_range[1] - b_range[0] > pi:		# wraps around
			f_betas = [ b+2*pi if b < 0 else b for b in f_betas ]
			b_range = ( min(f_betas), max(f_betas) )
		beta_bounds.append( b_range )
	
	
	# remove "difficult" faces
	#if(check_difficult):
		#pdb.set_trace();

		

	for f in range(len(feasibles)-1, -1, -1):
		if(difficult_faces[f]):
			del feasibles[f];
			del rp_bounds[f];
			del beta_bounds[f];
	
	if(feasibles == []):
		print 'No faces feasible according to tight test, reverting to feasible faces'
		return feasible_faces( flyby_data );
		
	
	return feasibles, rp_bounds, beta_bounds


#------------------------------------#

def feasible_faces_tight_bisection( flyby_data, graphics=False, intended_face=[]):
	
	#from matplotlib import pyplot as pl
	#from mpl_toolkits.mplot3d import axes3d, Axes3D

	"""
	Returns the observable faces and a guess on the bounds to actually observe them.
	The word tight means that the bounds on rp, beta are as tight or tighter than with feasible_faces.
	The cost is more computation time.
	"""
	flyby_data = _moon_flyby( *flyby_data )
	vinf_in = np.array( flyby_data.vinf_in )
	
	#Moon ephemerides
	moon_r, moon_v = flyby_data.moon.eph( pk.epoch( flyby_data.mjd2000 ) )
	#Moon body axis
	b_hat = get_body_axis( moon_r, moon_v )
	
	#We loop over the faces
	feasibles = []
	for face_nr,face_vertices in f_dict.iteritems():
		#Here we store the reason for a vertex rebuttal
		vertex_checks = {}
		#For each face we loop over its vertexes
		for vtx in face_vertices:
		    #And compute the vertex vector in the absolute frame (p) and
		    #The relative outgoing velocity needed to actually observe the given vertex
			b = vtx_coors[vtx]
			p = b[0] * b_hat[0] + b[1] * b_hat[1] + b[2] * b_hat[2]
			if np.dot( p, vinf_in ) < 0.:
				vertex_checks[ vtx ] = 'dot'	# vertex in the visible hemisphere (unreachable)
				continue
			vinf_out = vinf_out_from_p( vinf_in, p )
			
			# We now know the vertex is in the far hemisphere: there exist a value of rp to reach it. We check that
			#this valuse is within the allowed bounds
			eq, ineq = fb_conNEW( vinf_in, vinf_out, flyby_data.moon, (50. * 1000., 2000. * 1000.) )
			vertex_checks[ vtx ] = ( ineq[0]<0, ineq[1]<0 )
				# (True, True): vertex within the band; can be reached directly
				# (False, True): vertex in between the band and the "relative" equator
				# (True, False): vertex it's above the band
			
			# If the vertex is in the band, the face is feasible
			if ineq[0] * ineq[1] > 0:
				feasibles.append( face_nr )
				vertex_checks = {}
				break
		# If no vertex was in the band:
		if len(vertex_checks) > 0:
			vtx_outcomes = set( vertex_checks.values() )
			if len(vtx_outcomes) == 1:
				# face is unfeasible because either all vertixes are above, or all below, or all on the visible side
				continue
			if (True, False) in vtx_outcomes:
				# this handles the case in which at least one of the vertexes is above the band, and the other vertices do not lie
				# within the band, but are either within the visible side or below the bend
				#yield face_nr, ( vtx for vtx,outc in vertex_checks.iteritems() if outc == (False, True) ).next()
				feasibles.append( face_nr )
	
	#Having a list of feasible faces we now try to bracket each face in terms of betas and rps. That is: we look for bounds of betas and rps that
	#would sort-of guarantee us to actually fly over a face.
	
	# Tight algorithm goal: put a box around vectors as close as possible to the band.
	# this version does that by calculating the intersection with rp_low, rp_high
	
	beta_bounds = [];
	betas = [];
	rp_bounds = [];
	difficult_faces = [False] * len(feasibles);
	#check_difficult = False;
	
	for f in range(len(feasibles)):
		
		face = feasibles[f];
		
		f_betas = [];
		f_betas_low = [];
		f_betas_high = [];
		f_rps = []
		classifications = [];
		#vinf_outs = [];
				
		min_height = 50. * 1000.
		max_height = 2000. * 1000.
		min_rp = 50. * 1000. + flyby_data.moon.radius 
		max_rp = 2000. * 1000. + flyby_data.moon.radius 
			
			
		C = {-1:(0.0,0.0,0.0), 0:(0.0,0.0,1.0), 1:(0.0,1.0,0.0), 2:(1.0,0.0,0.0)}
		
		if(graphics):
			if(intended_face == [] or face == intended_face):
				pl.figure();		
				pl.hold(True);	
				pl.plot([np.log10(min_rp)]*2, [-pi, pi], color = C[2]);
				pl.plot([np.log10(max_rp)]*2, [-pi, pi], color = C[0]);
		
		vertices = f_dict[ face ];
		for v in range(len(vertices)):
			b = vtx_coors[vertices[v]]
			p = b[0] * b_hat[0] + b[1] * b_hat[1] + b[2] * b_hat[2]
			[c, vinf_out] = _classify_point(p, vinf_in, flyby_data);
			[rp, beta] = _get_rp_beta(p, vinf_in, vinf_out, moon_v, flyby_data);

			f_rps.append(rp);
			f_betas.append(beta);
			if(graphics):
				if(intended_face == [] or face == intended_face):
					pl.plot(np.log10(rp), beta, 'x', color=C[c]);
			classifications.append(c);
			#print 'Class = %d, rp = %f' % (c, rp);
			#vinf_outs.append(vinf_out);
		
		# rp_bounds:
		rp_bounds.append( (
			max(min(f_rps), min_rp ) / flyby_data.moon.radius,
			min(max(f_rps), max_rp ) / flyby_data.moon.radius,
			) )
			
		# beta bounds:
		f_betas_final = [];
		vertices = f_dict[ face ];
		for v1 in range(len(vertices)-1):
			remaining_vertices = vertices[v1+1:];
			c1 = classifications[v1];
			rp1 = f_rps[v1];
			beta1 = f_betas[v1];
			b = vtx_coors[vertices[v1]];
			p1 = b[0] * b_hat[0] + b[1] * b_hat[1] + b[2] * b_hat[2]
			
			for jv2 in range(len(remaining_vertices)):
				v2 = v1 + 1 + jv2;
				c2 = classifications[v2];
				rp2 = f_rps[v2];
				beta2 = f_betas[v2];
				b = vtx_coors[vertices[v2]];
				p2 = b[0] * b_hat[0] + b[1] * b_hat[1] + b[2] * b_hat[2]
				
				sp = _sample_points(c1, c2);
				
				if(sp):
					n_samples = 0;
					if(graphics and (intended_face == [] or face == intended_face)):
						[beta1, beta2] = _perform_binary_search(p1, p2, beta1, beta2, c1, c2, vinf_in, flyby_data, moon_v, n_samples, graphics, C); # search ends when both are in the band
					else:
						[beta1, beta2] = _perform_binary_search(p1, p2, beta1, beta2, c1, c2, vinf_in, flyby_data, moon_v, n_samples, False, C); # search ends when both are in the band
					if(beta1 != []):
						f_betas_final.append(beta1);
						f_betas_final.append(beta2);
		
		if(graphics):
			if(intended_face == [] or face == intended_face):
				pl.show();
			
		
		# make bounds:
		b_range = ( min(f_betas_final), max(f_betas_final) )
		if b_range[1] - b_range[0] > pi:		# wraps around
			f_betas_final = [ b+2*pi if b < 0 else b for b in f_betas_final ]
			b_range = ( min(f_betas_final), max(f_betas_final) )
		beta_bounds.append( b_range )
		
	return feasibles, rp_bounds, beta_bounds
	
	
def _perform_binary_search(p1, p2, beta1, beta2, c1, c2, vinf_in, flyby_data, moon_v, n_samples, graphics, C):
	
	""" Performs a binary search in order to return two points in the reachable band
	"""
	
	#from matplotlib import pyplot as pl
	
	min_rp = 50. * 1000. + flyby_data.moon.radius 
	max_rp = 2000. * 1000. + flyby_data.moon.radius 
	
	if(c1 == 1 and c2 == 1):
		return [beta1, beta2];
	
	if(n_samples > 50):
		print 'Maximum number of recursions reached'
		return [[], []];
	
	n_samples += 1;
	p_i = (p1 + p2) / 2.0;
	[c_i, vinf_out] = _classify_point(p_i, vinf_in, flyby_data);
	[rp_i, beta_i] = _get_rp_beta(p_i, vinf_in, vinf_out, moon_v, flyby_data);
	#print 'sample %d, min_rp = %f, rp = %f, max_rp = %f, c = %d' % (n_samples, min_rp, rp_i, max_rp, c_i)
	
	#if((rp_i < min_rp or rp_i > max_rp) and c_i == 1):
		#print 'Wrong classification!!!'
		#pdb.set_trace();
	
	if(graphics):
		pl.plot(np.log10(rp_i), beta_i, 'x', color=C[c_i]);
	
	if(c_i == 1 and c1 == 1):
		return [beta_i, beta1];
	elif(c_i == 1 and c2 == 1):
		return [beta_i, beta2];
	else:
		if(c1 == 1):
			# search on with c1, c_i:
			[b1, b2] = _perform_binary_search(p1, p_i, beta1, beta_i, c1, c_i, vinf_in, flyby_data, moon_v, n_samples, graphics, C);
			return [b1,b2];
		elif(c2 == 1):
			# search on with c2, c_i:
			[b1, b2] = _perform_binary_search(p2, p_i, beta2, beta_i, c2, c_i, vinf_in, flyby_data, moon_v, n_samples, graphics, C);
			return [b1,b2];
		elif(c1 <= 0 and c_i <= 0):
			# search on with c2, c_i:
			[b1, b2] = _perform_binary_search(p2, p_i, beta2, beta_i, c2, c_i, vinf_in, flyby_data, moon_v, n_samples, graphics, C);
			return [b1,b2];
		elif(c1 == 2 and c_i == 2):
			# search on with c2, c_i:
			[b1, b2] = _perform_binary_search(p2, p_i, beta2, beta_i, c2, c_i, vinf_in, flyby_data, moon_v, n_samples, graphics, C);
			return [b1,b2];
		elif(c2 <= 0 and c_i <= 0):
			# search on with c1, c_i:
			[b1, b2] = _perform_binary_search(p1, p_i, beta1, beta_i, c1, c_i, vinf_in, flyby_data, moon_v, n_samples, graphics, C);
			return [b1,b2];
		elif(c2 == 2 and c_i == 2):
			# search on with c2, c_i:
			[b1, b2] = _perform_binary_search(p1, p_i, beta1, beta_i, c1, c_i, vinf_in, flyby_data, moon_v, n_samples, graphics, C);
			return [b1,b2];
		elif(c_i == 1 and c1 > -1):
			# search on with c1, c_i:
			[b1, b2] = _perform_binary_search(p1, p_i, beta1, beta_i, c1, c_i, vinf_in, flyby_data, moon_v, n_samples, graphics, C);
			return [b1,b2];
		elif(c_i == 1 and c2 > -1):
			# search on with c2, c_i:
			[b1, b2] = _perform_binary_search(p1, p_i, beta1, beta_i, c1, c_i, vinf_in, flyby_data, moon_v, n_samples, graphics, C);
			return [b1,b2];


def feasible_faces_tight_lines_alpha( flyby_data, graphics=False, intended_face=[]):
	
	#from matplotlib import pyplot as pl
	#from mpl_toolkits.mplot3d import axes3d, Axes3D

	"""
	Returns the observable faces and a guess on the bounds to actually observe them.
	The word tight means that the bounds on rp, beta are as tight or tighter than with feasible_faces.
	The cost is more computation time.
	This function determines the intersection points with the boundaries in the alpha domain
	"""
	
	flyby_data = _moon_flyby( *flyby_data )
	vinf_in = np.array( flyby_data.vinf_in )
	
	#Moon ephemerides
	moon_r, moon_v = flyby_data.moon.eph( pk.epoch( flyby_data.mjd2000 ) )
	#Moon body axis
	b_hat = get_body_axis( moon_r, moon_v )
	
	#We loop over the faces
	feasibles = []
	for face_nr,face_vertices in f_dict.iteritems():
		#Here we store the reason for a vertex rebuttal
		vertex_checks = {}
		#For each face we loop over its vertexes
		for vtx in face_vertices:
		    #And compute the vertex vector in the absolute frame (p) and
		    #The relative outgoing velocity needed to actually observe the given vertex
			b = vtx_coors[vtx]
			p = b[0] * b_hat[0] + b[1] * b_hat[1] + b[2] * b_hat[2]
			if np.dot( p, vinf_in ) < 0.:
				vertex_checks[ vtx ] = 'dot'	# vertex in the visible hemisphere (unreachable)
				continue
			vinf_out = vinf_out_from_p( vinf_in, p )
			
			# We now know the vertex is in the far hemisphere: there exist a value of rp to reach it. We check that
			#this valuse is within the allowed bounds
			eq, ineq = fb_conNEW( vinf_in, vinf_out, flyby_data.moon, (50. * 1000., 2000. * 1000.) )
			vertex_checks[ vtx ] = ( ineq[0]<0, ineq[1]<0 )
				# (True, True): vertex within the band; can be reached directly
				# (False, True): vertex in between the band and the "relative" equator
				# (True, False): vertex it's above the band
			
			# If the vertex is in the band, the face is feasible
			if ineq[0] * ineq[1] > 0:
				feasibles.append( face_nr )
				vertex_checks = {}
				break
		# If no vertex was in the band:
		if len(vertex_checks) > 0:
			vtx_outcomes = set( vertex_checks.values() )
			if len(vtx_outcomes) == 1:
				# face is unfeasible because either all vertixes are above, or all below, or all on the visible side
				continue
			if (True, False) in vtx_outcomes:
				# this handles the case in which at least one of the vertexes is above the band, and the other vertices do not lie
				# within the band, but are either within the visible side or below the bend
				#yield face_nr, ( vtx for vtx,outc in vertex_checks.iteritems() if outc == (False, True) ).next()
				feasibles.append( face_nr )
	
	#Having a list of feasible faces we now try to bracket each face in terms of betas and rps. That is: we look for bounds of betas and rps that
	#would sort-of guarantee us to actually fly over a face.
	
	# Tight algorithm goal: put a box around vectors as close as possible to the band.
	# this version does that by calculating the intersection with rp_low, rp_high
	
	beta_bounds = [];
	betas = [];
	rp_bounds = [];
	difficult_faces = [False] * len(feasibles);
	#check_difficult = False;
	
	min_height = 50. * 1000.
	max_height = 2000. * 1000.
	min_rp = 50. * 1000. + flyby_data.moon.radius 
	max_rp = 2000. * 1000. + flyby_data.moon.radius 
	
	for f in range(len(feasibles)):
		
		face = feasibles[f];
		
		f_betas = [];
		f_betas_low = [];
		f_betas_high = [];
		f_rps = []
		f_l_rps = [];
		f_alphas = [];
		classifications = [];
		#vinf_outs = [];
				
		if(graphics):
			if(intended_face == [] or intended_face == face):
				pl.figure();		

		vertices = f_dict[ face ];
		for v in range(len(vertices)):
			b = vtx_coors[vertices[v]]
			pp = b[0] * b_hat[0] + b[1] * b_hat[1] + b[2] * b_hat[2]
			[c, vinf_out] = _classify_point(pp, vinf_in, flyby_data);
			[rp, beta, alpha, dot_vi_vi] = _get_rp_beta(pp, vinf_in, vinf_out, moon_v, flyby_data, get_all_info = True);
			f_rps.append(rp);
			f_l_rps.append(np.log10( rp  ))
			f_betas.append(beta);
			f_alphas.append(alpha);
			classifications.append(c);
			#vinf_outs.append(vinf_out);		

		A = 1 / (1 + (dot_vi_vi * min_rp) / flyby_data.moon.mu_self);
		max_alpha = 2 * asin(A);
		
		A = 1 / (1 + (dot_vi_vi * max_rp) / flyby_data.moon.mu_self);
		min_alpha = 2 * asin(A);

		# rp_bounds:
		rp_bounds.append( (
			max(min(f_rps), min_rp ) / flyby_data.moon.radius,
			min(max(f_rps), max_rp ) / flyby_data.moon.radius,
			) )
			
		# beta bounds:
		#pdb.set_trace();
		vertices = f_dict[ face ];
		for v1 in range(len(vertices)):
			remaining_vertices = vertices[v1+1:];
			c1 = classifications[v1];
			rp1 = f_rps[v1];
			beta1 = f_betas[v1];
			lrp1 = f_l_rps[v1];
			alpha1 = f_alphas[v1];
			
			for v2 in range(len(remaining_vertices)):
				#pdb.set_trace();
				or_ind = v1+1+v2;
				c2 = classifications[or_ind];
				rp2 = f_rps[or_ind];
				lrp2 = f_l_rps[or_ind];
				beta2 = f_betas[or_ind];
				alpha2 = f_alphas[or_ind];
				
				sp = _sample_points(c1, c2);
				
				if(sp):
					if(c1 == 1 and c2 == 1):
						beta_low = min([beta1, beta2]);
						beta_high = max([beta1, beta2]);
						f_betas_low.append(beta_low);
						f_betas_high.append(beta_high);
						
					else:
						# temps are used for drawing:
						temp_beta2 = beta2;
						temp_beta1 = beta1;
						temp_alpha1 = alpha1;
						temp_alpha2 = alpha2;
						temp_c1 = c1;
						temp_c2 = c2;
						
						# unreachable points (class == -1) get mapped to alpha = 0, leading to inaccuracies
						# therefore we use an intermediary point on the line close to the other end point
						if(c1 == -1):
							b = vtx_coors[vertices[v1]]
							p1 = b[0] * b_hat[0] + b[1] * b_hat[1] + b[2] * b_hat[2]
							b = vtx_coors[vertices[or_ind]]
							p2 = b[0] * b_hat[0] + b[1] * b_hat[1] + b[2] * b_hat[2]
							delta_p = p2 - p1;
							found_feasible_point = False;
							step = 0.5;
							while not(found_feasible_point):
								pp = p2 - step * delta_p;
								[temp_c1, temp_vinf_out] = _classify_point(pp, vinf_in, flyby_data);
								if(temp_c1 != -1):
									[temp_rp1, temp_beta1, temp_alpha1, temp_dot_vi_vi] = _get_rp_beta(pp, vinf_in, temp_vinf_out, moon_v, flyby_data, get_all_info = True);
									found_feasible_point = True;
								elif(step > 1E-10):
									step /= 2.0;
								else:
									# use "wrong" value:
									print 'No point found that is feasible'
									print 'step = %f' % step;
									print 'c1 = %d, c2 = %d' % (c1,c2);
									print 'min_alpha = %f, max_alpha = %f, alpha1 = %f, alpha2 = %f' % (min_alpha, max_alpha, alpha1, alpha2)
									#pdb.set_trace();
									found_feasible_point = True;
									
							delta_beta = beta2 - temp_beta1;
							delta_alpha = alpha2 - temp_alpha1;
							
						elif(c2 == -1):
							b = vtx_coors[vertices[v1]]
							p1 = b[0] * b_hat[0] + b[1] * b_hat[1] + b[2] * b_hat[2]
							b = vtx_coors[vertices[or_ind]]
							p2 = b[0] * b_hat[0] + b[1] * b_hat[1] + b[2] * b_hat[2]
							delta_p = p2 - p1;
							found_feasible_point = False;
							step = 0.5;
							while not(found_feasible_point):
								pp = p1 + step * delta_p;
								[temp_c2, temp_vinf_out] = _classify_point(pp, vinf_in, flyby_data);
								if(temp_c2 != -1):
									[temp_rp2, temp_beta2, temp_alpha2, temp_dot_vi_vi] = _get_rp_beta(pp, vinf_in, temp_vinf_out, moon_v, flyby_data, get_all_info = True);
									found_feasible_point = True;
								elif(step > 1E-10):
									step /= 2.0;
								else:
									# use "wrong" value:
									print 'No point found that is feasible'
									print 'step = %f' % step;
									print 'c1 = %d, c2 = %d' % (c1,c2);
									print 'min_alpha = %f, max_alpha = %f, alpha1 = %f, alpha2 = %f' % (min_alpha, max_alpha, alpha1, alpha2)
									#pdb.set_trace();
									found_feasible_point = True;
									
							delta_beta = temp_beta2 - beta1;
							delta_alpha = temp_alpha2 - alpha1;
						else:
							delta_beta = beta2 - beta1;
							delta_alpha = alpha2 - alpha1;
						
						# do not calculate intersection if vertical line or if delta_beta wraps around the face:
						if(np.abs(delta_alpha) > 1e-5 and np.abs(delta_beta) < pi):

							a = delta_beta / delta_alpha;
							b = temp_beta1 -a * temp_alpha1;
							beta_low = a * min_alpha + b;
							beta_high = a * max_alpha + b;
							
							# if one of the points is in the band, we only need one intersection point:
							if(c1 == 1):
								# pdb.set_trace();
								if(c2 == 2):
									beta_low = temp_beta1;
								elif(c2 == 0 or c2 == -1):
									beta_high = temp_beta1;
							elif(c2 == 1):
								# pdb.set_trace();
								if(c1 == 2):
									beta_low = temp_beta2;
								elif(c1 == 0 or c1 == -1):
									beta_high = temp_beta2;
							
							f_betas_low.append(beta_low);
							f_betas_high.append(beta_high);
							
							if(graphics):
								if(intended_face == [] or intended_face == face):
									pl.hold(True);
									pl.plot(temp_alpha1, temp_beta1, 'x', color=(0.0,1.0,0.0));
									pl.plot(temp_alpha2, temp_beta2, 'x', color=(0.0,1.0,0.0));
									
									#if(c1 != -1 and c2 != -1):
									b = vtx_coors[vertices[v1]]
									p1 = b[0] * b_hat[0] + b[1] * b_hat[1] + b[2] * b_hat[2]
									b = vtx_coors[vertices[or_ind]]
									p2 = b[0] * b_hat[0] + b[1] * b_hat[1] + b[2] * b_hat[2]
									delta_p = p2 - p1;
									n_steps = 50;
									for s in range(n_steps):
										pp = p1 + ((s+1.0)/ (n_steps+1.0)) * delta_p;
										[c, vinf_out] = _classify_point(pp, vinf_in, flyby_data);
										[rp, beta, alpha, dot_vi_vi] = _get_rp_beta(pp, vinf_in, vinf_out, moon_v, flyby_data, get_all_info = True);
										#if(rp > 1e7):
											#rp = 1e7;
										#pl.plot(np.log10(rp ), beta, 'o', color=(0.0,0.0,0.0));
										pl.plot(alpha, beta, 'o', color=(0.0,0.0,0.0));
										
									a = delta_beta / delta_alpha;
									b = temp_beta1 -a * temp_alpha1;
									beta_left = b;
									alpha_right = max([temp_alpha1, temp_alpha2, max_alpha]);
									beta_right = a * alpha_right + b;
									pl.plot([0, alpha_right], [beta_left, beta_right], color = (0.0,0.0,1.0))
									pl.plot([temp_alpha1, temp_alpha2], [temp_beta1, temp_beta2], color = (0.0,1.0,0.0));
									pl.plot(min_alpha, beta_low, 'x', color=(1.0,0.0,0.0));
									pl.plot(max_alpha, beta_high, 'x', color=(0.0,0.0,1.0));

		fbs = f_betas_low + f_betas_high;
		min_f_betas = min(fbs);
		max_f_betas = max(fbs);
		# handle wrap around:
		if(max_f_betas - min_f_betas > pi):
			fbs = [ bb+2*pi if bb < 0 else bb for bb in fbs ]
			min_f_betas = min(fbs);
			max_f_betas = max(fbs);
			
		f_betas = [min_f_betas, max_f_betas];
		
		if(f_betas == []):
			# no points were intersected:
			print 'Difficult Face!!!!';
			difficult_faces[f] = True;
			betas.append([0.0]);
		else:
			betas.append(f_betas);	
		
			if(graphics):
				if(intended_face == [] or intended_face == face):
					b_range = ( min(f_betas), max(f_betas) )
					if b_range[1] - b_range[0] > pi:		# wraps around
						f_betas = [ b+2*pi if b < 0 else b for b in f_betas ]
						b_range = ( min(f_betas), max(f_betas) )
					pl.plot([min_alpha, max_alpha], [b_range[0]] * 2, color=(1.0,0.0,1.0));
					pl.plot([min_alpha, max_alpha], [b_range[1]] * 2, color=(1.0,0.0,1.0));
					pl.plot([min_alpha, min_alpha], b_range, color=(1.0,0.0,0.0))
					pl.plot([max_alpha, max_alpha], b_range, color=(0.0,0.0,1.0))
					pl.show();
			
	
	#if(graphics):
		#pl.figure();
		#pl.hold = True;
	
	beta_bounds = []
	for f_betas in betas:
		#b_range = ( min(f_betas), max(f_betas) )
		#if b_range[1] - b_range[0] > pi:		# wraps around
			#f_betas = [ b+2*pi if b < 0 else b for b in f_betas ]
			#b_range = ( min(f_betas), max(f_betas) )
		#beta_bounds.append( b_range )
		beta_bounds.append( f_betas )
		#pl.plot(b_range,[0, 0], color=(0,0,0));
		
	
	
	# remove "difficult" faces
	#if(check_difficult):
		#pdb.set_trace();
		

	for f in range(len(feasibles)-1, -1, -1):
		if(difficult_faces[f]):
			del feasibles[f];
			del rp_bounds[f];
			del beta_bounds[f];
	
	if(feasibles == []):
		print 'No faces feasible according to tight test, reverting to feasible faces'
		return feasible_faces( flyby_data );
		
	
	return feasibles, rp_bounds, beta_bounds


# gtoc6_problem_stmt.pdf / Table 3: List of vertices that make up each face of the “Football grid”
# { Face Number : Vertex numbers list }
f_dict = {1: [59, 60, 58, 54, 52, 56],
          2: [52, 54, 46, 36, 44],
          3: [18, 10, 8, 16, 26],
          4: [2, 6, 10, 8, 4, 1],
          5: [9, 5, 2, 1, 3, 7],
          6: [17, 9, 7, 15, 25],
          7: [43, 51, 53, 45, 35],
          8: [51, 55, 59, 60, 57, 53],
          9: [60, 58, 50, 49, 57],
         10: [58, 54, 46, 38, 42, 50],
         11: [4, 8, 16, 24, 20, 12],
         12: [1, 4, 12, 11, 3],
         13: [7, 3, 11, 19, 23, 15],
         14: [53, 57, 49, 41, 37, 45],
         15: [41, 49, 50, 42, 32, 31],
         16: [21, 31, 32, 22, 14, 13],
         17: [32, 42, 38, 28, 22],
         18: [38, 28, 18, 26, 36, 46],
         19: [24, 34, 44, 36, 26, 16],
         20: [20, 24, 34, 40, 30],
         21: [19, 11, 12, 20, 30, 29],
         22: [39, 29, 30, 40, 48, 47],
         23: [23, 19, 29, 39, 33],
         24: [23, 33, 43, 35, 25, 15],
         25: [37, 27, 17, 25, 35, 45],
         26: [37, 41, 31, 21, 27],
         27: [13, 14, 6, 2, 5],
         28: [14, 22, 28, 18, 10, 6],
         29: [48, 40, 34, 44, 52, 56],
         30: [47, 48, 56, 59, 55],
         31: [33, 39, 47, 55, 51, 43],
         32: [27, 21, 13, 5, 9, 17]}


# get_vertex_coordinates('../data/vertexcoordinates.txt')
vtx_coors = {
 1: (-4.854101966249685, -1, 0),
 2: (-4.854101966249685, 1, 0),
 3: (-4.23606797749979, -2, -1.618033988749895),
 4: (-4.23606797749979, -2, 1.618033988749895),
 5: (-4.23606797749979, 2, -1.618033988749895),
 6: (-4.23606797749979, 2, 1.618033988749895),
 7: (-3.618033988749895, -1, -3.23606797749979),
 8: (-3.618033988749895, -1, 3.23606797749979),
 9: (-3.618033988749895, 1, -3.23606797749979),
 10: (-3.618033988749895, 1, 3.23606797749979),
 11: (-3.23606797749979, -3.618033988749895, -1),
 12: (-3.23606797749979, -3.618033988749895, 1),
 13: (-3.23606797749979, 3.618033988749895, -1),
 14: (-3.23606797749979, 3.618033988749895, 1),
 15: (-2, -1.618033988749895, -4.23606797749979),
 16: (-2, -1.618033988749895, 4.23606797749979),
 17: (-2, 1.618033988749895, -4.23606797749979),
 18: (-2, 1.618033988749895, 4.23606797749979),
 19: (-1.618033988749895, -4.23606797749979, -2),
 20: (-1.618033988749895, -4.23606797749979, 2),
 21: (-1.618033988749895, 4.23606797749979, -2),
 22: (-1.618033988749895, 4.23606797749979, 2),
 23: (-1, -3.23606797749979, -3.618033988749895),
 24: (-1, -3.23606797749979, 3.618033988749895),
 25: (-1, 0, -4.854101966249685),
 26: (-1, 0, 4.854101966249685),
 27: (-1, 3.23606797749979, -3.618033988749895),
 28: (-1, 3.23606797749979, 3.618033988749895),
 29: (0, -4.854101966249685, -1),
 30: (0, -4.854101966249685, 1),
 31: (0, 4.854101966249685, -1),
 32: (0, 4.854101966249685, 1),
 33: (1, -3.23606797749979, -3.618033988749895),
 34: (1, -3.23606797749979, 3.618033988749895),
 35: (1, 0, -4.854101966249685),
 36: (1, 0, 4.854101966249685),
 37: (1, 3.23606797749979, -3.618033988749895),
 38: (1, 3.23606797749979, 3.618033988749895),
 39: (1.618033988749895, -4.23606797749979, -2),
 40: (1.618033988749895, -4.23606797749979, 2),
 41: (1.618033988749895, 4.23606797749979, -2),
 42: (1.618033988749895, 4.23606797749979, 2),
 43: (2, -1.618033988749895, -4.23606797749979),
 44: (2, -1.618033988749895, 4.23606797749979),
 45: (2, 1.618033988749895, -4.23606797749979),
 46: (2, 1.618033988749895, 4.23606797749979),
 47: (3.23606797749979, -3.618033988749895, -1),
 48: (3.23606797749979, -3.618033988749895, 1),
 49: (3.23606797749979, 3.618033988749895, -1),
 50: (3.23606797749979, 3.618033988749895, 1),
 51: (3.618033988749895, -1, -3.23606797749979),
 52: (3.618033988749895, -1, 3.23606797749979),
 53: (3.618033988749895, 1, -3.23606797749979),
 54: (3.618033988749895, 1, 3.23606797749979),
 55: (4.23606797749979, -2, -1.618033988749895),
 56: (4.23606797749979, -2, 1.618033988749895),
 57: (4.23606797749979, 2, -1.618033988749895),
 58: (4.23606797749979, 2, 1.618033988749895),
 59: (4.854101966249685, -1, 0),
 60: (4.854101966249685, 1, 0)}
