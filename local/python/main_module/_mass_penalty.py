import gtoc6 as gt6
import numpy as np
from numpy import linalg
import math
import pdb
from PyKEP import closest_distance


def get_mass_penalty(Traj, verbose=True):
	""" Get mass penalty given a trajectory Traj
		Traj = [[r0, v0_out, r1, v1_in, tof, rp, ra, Trev, vinf], [r1, v1_out, r2, v2_in, tof, rp, ra, Trev, vinf], [...]]
	"""
	n_parts = len(Traj);
	penalty = 0;
	for p in range(n_parts):
		
		# get a part of the trajectory:
		# print 'Part %d' % p
		if verbose:
			print 'Fly-by %d' % (int((p+1)/2))

		# get info necessary for calculating the penalty:
		r0 = Traj[p][0];
		if(p > 0):
			v0_in = Traj[p-1][3];
		else:
			v0_in = [];
		v0_out = Traj[p][1];
		r1 = Traj[p][2];
		v1_in = Traj[p][3];
		tof = Traj[p][4];
		rp = Traj[p][5];
		ra = Traj[p][6];
		Trev = Traj[p][7];
		vinf = Traj[p][8];
		
		# calculate the penalty for this leg:
		pen = _get_penalty_leg(r0,v0_in,v0_out, r1,v1_in,tof, rp, ra, Trev, vinf, verbose);
		
		# add to the total penalty:
		penalty += pen;
	
	return penalty;
	
def get_rp_ra_Trev(rv, vv):
	
	""" _get_rp_ra_Trev
	
	    Internal method to calculate rp, ra, Trev from r and v vectors
	"""

	import numpy as np
	import math

	# get vector norms:
	v = np.linalg.norm(vv);
	r = np.linalg.norm(rv);
	# calculate eccentricity, semi-major axis	
	energy = 0.5*(v*v) - gt6.MU_JUPITER / r;
	a = -gt6.MU_JUPITER / (2*energy);
	c = np.cross(rv,vv);
	h = np.linalg.norm(c);
	e = np.sqrt(1 + (2*energy*h*h) / (gt6.MU_JUPITER*gt6.MU_JUPITER));
	# calculate ra, rp
	rp = a*(1-e);
	ra = a*(1+e);
	if(a >= 0):
		T_rev = 2*math.pi * np.sqrt((a*a*a) / gt6.MU_JUPITER);
	else:
		T_rev = -1;
	return [rp, ra, T_rev];

def _get_penalty_leg(r0, v0_in, v0_out, r1, v1_in, tof, rp, ra, Trev, vinf, verbose=True):
	"""	Get penalty for a single leg
	
		Add a penalty:
		(a) at the first fly-by, if v_in and v_out make it a local minimum (undifferentiable or when r0 is exactly at periapsis)
		(b) at each local minimum in the case of multiple revolutions
		(c) when in the remaining trajectory the closest distance is smaller than r0 and r1
	"""
	
	penalty = 0;
	eps = 1E-5;
	
	v = np.linalg.norm(v0_out);
	ri = np.linalg.norm(r0);
	
	# (a) at the first fly-by, if v_in and v_out make it a local minimum
	if(v0_in != []):
		[local_minimum, dp_in, dp_out] = _flyby_is_local_minimum(v0_in, v0_out, r0);
		if(local_minimum):
			# undifferentiable local minimum:
			penalty += _calculate_single_penalty(ri, ra);
			if verbose:
				print 'Undifferentiable minimum'
		elif(np.abs(dp_in) < eps and np.abs(dp_out) < eps and np.abs(r0 - rp) < eps):
			# we assume to be at the periapsis:
			penalty += _calculate_single_penalty(rp, ra);
			if verbose:
				print 'At periapsis'
		
	
	
	# (b) at each local minimum in the case of multiple revolutions
	# get vector norms:
	energy = 0.5*(v*v) - gt6.MU_JUPITER / ri;
	a = -gt6.MU_JUPITER / (2*energy);
	# look at the trajectory after r0:
	if(a > 0):
		# number of full revolutions:
		# print 'TOF = %f, Trev = %f' % (tof, Trev)
		n_full_revs = math.floor(tof / Trev);
		penalty += n_full_revs * _calculate_single_penalty(rp, ra);
		#if(n_full_revs > 0):
		#	print '%d revs * %f penalty' % (n_full_revs,  _calculate_single_penalty(rp, ra))
	# very hypothetical case that we do exactly n_full_revs:
	rf = np.linalg.norm(r1);
	if(rf == rp):
		penalty -= _calculate_single_penalty(rp, ra);
		
	# (c) when in the remaining trajectory the closest distance is smaller than r0 and r1
	[cd, ra] = closest_distance(list(r0),list(v0_out),list(r1),list(v1_in), gt6.MU_JUPITER);
	if(cd < ri and cd < rf):
		penalty += _calculate_single_penalty(cd, ra);
	
	if(penalty < 0):
		print 'Negative penalty?'
		pdb.set_trace();
	
	return penalty;

def _calculate_single_penalty(rp, ra):
	""" _calculate_single_penalty(rp, ra)
		Implements the formula in the GTOC6 problem description
	""" 
	
	# calculate the penalty on the basis of rp, ra
	penalty = 5.0 * (1.0 -  math.pow((rp / gt6.JR - 2.0) / 15.0, 2) ) * (1.0 + 1.0 / (1.0 + ra / gt6.JR - rp / gt6.JR)) * ( (1.0 + np.sign(ra)) * (1+np.sign(17.0-rp/gt6.JR)) / 4.0 );

	return penalty;

def _flyby_is_local_minimum(v_in, v_out, r):
	""" flyby_is_local_minimum(v_in, v_out, r)
		Makes dot products of v_in and r, and v_out and r to see whether there is an undifferentiable local minimum 
	""" 
	
	# get the dot products of v_in and r, and v_out and r:
	v_in = np.asarray(v_in);
	v_out = np.asarray(v_out);
	rv = np.asarray(r);
	dp_in = np.dot(rv, v_in);
	dp_out = np.dot(rv, v_out);
	# local minimum if dp_in negative and dp_out positive:
	local_minimum = False;
	if(dp_in < 0 and dp_out > 0):
		local_minimum = True;
	
	return [local_minimum, dp_in, dp_out];
		
		
