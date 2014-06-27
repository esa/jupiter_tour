from PyKEP import planet, DEG2RAD, epoch

MU_JUPITER = 126686534921800000 #m^3/s^2
JR = 71492000 # m

from _body_ephem import io, ganymede, callisto, europa
from _moonscore3 import moon_score
from _feasible_faces import feasible_faces, feasible_faces_tight, feasible_faces_tight_bisection , feasible_faces_tight_lines_alpha
from PyGMO.problem import mga_incipit,mga_part
from _mass_penalty import get_mass_penalty
from _one_lt_leg import one_lt_leg
from _mga_incipit_lt import mga_incipit_lt


def plot_moons(epoch = epoch(0)):
	"""
	Plots the Galilean Moons of Jupiter at epoch
	
	USAGE: plot_moons(epoch = epoch(34654, epoch.epoch_type.MJD)):

	* epoch: the epoch one wants the galilean moons to be plotted at
	
	"""
	from PyKEP.orbit_plots import plot_planet
	from mpl_toolkits.mplot3d import Axes3D
	import matplotlib.pyplot as plt
	
	fig = plt.figure()
	ax = fig.gca(projection='3d')

	plot_planet(ax,io,color = 'r', units = JR, t0 = epoch, legend=True)
	plot_planet(ax,europa,color = 'b', units = JR, t0 = epoch, legend=True)
	plot_planet(ax,ganymede,color = 'k', units = JR, t0 = epoch, legend=True)
	plot_planet(ax,callisto,color = 'y', units = JR, t0 = epoch, legend=True)
	plt.show()

def plot_initial_geometry(ni=0.0, mu=0.5):
  	"""
	Visualizes the initial spaceraft conditions for the gtoc6 problem. Given a point on the initial spheres, \
	it assumes a velocity (almost) pointing toward Jupiter.
	
	THIS IS ONLY A VISUALIZATION, the initial velocityshould not be taken as realistic.
	"""
  
	from mpl_toolkits.mplot3d import Axes3D
	import matplotlib.pyplot as plt
	from math import sin,cos,acos,pi
	from PyKEP.orbit_plots import plot_kepler, plot_planet
	from PyKEP import DAY2SEC, propagate_lagrangian, epoch
	from scipy.linalg import norm


	ep=epoch(0.0)
	days=300.0
	
	r = [JR*1000*cos(ni)*cos(mu), JR*1000*cos(ni)*sin(mu),JR*1000*sin(ni)]
	
	VINF = 3400.0
	v = [-d/norm(r)*3400 for d in r]
	v = [d+200 for d in v]
	
	fig = plt.figure()
	ax = fig.gca(projection='3d', aspect='equal')
	
	plot_planet(ax,io,color = 'r', units = JR, t0 = ep, legend=True)
	plot_planet(ax,europa,color = 'b', units = JR, t0 = ep, legend=True)
	plot_planet(ax,ganymede,color = 'k', units = JR, t0 = ep, legend=True)
	plot_planet(ax,callisto,color = 'y', units = JR, t0 = ep, legend=True)
	plot_kepler(ax,r,v,days*DAY2SEC,MU_JUPITER, N=200, units = JR, color = 'b')
	plt.plot([r[0]/JR],[r[1]/JR],[r[2]/JR],'o')
	plt.show()
	
def _get_score_data_incipit(self,x):
	from PyKEP import epoch, lambert_problem, DAY2SEC, fb_prop, propagate_lagrangian
	from math import pi, acos,cos,sin,sqrt
	from scipy.linalg import norm
	"""
	This method returns the data needed to compute the score of a trajectory.
	"""
	#1 -  we 'decode' the chromosome recording the various times of flight (days) in the list T for convenience
	T = x[3::4]
	nlegs = len(x)/4
	seq = self.get_sequence()
	common_mu = seq[0].mu_central_body
	
	#2 - We compute the epochs and ephemerides of the planetary encounters
	ep_list = list([None] * nlegs)
	t_P = list([None] * nlegs)
	r_P = list([None] * nlegs)
	v_P = list([None] * nlegs)
	DV  = list([None] * nlegs)
	
	for i,planet in enumerate(seq):
		ep_list[i] = x[0]+sum(T[:i+1])
		t_P[i] = epoch(x[0]+sum(T[:i+1]))
		r_P[i],v_P[i] = seq[i].eph(t_P[i])

	#3 - We start with the first leg: a lambert arc
	theta = 2*pi*x[1]
	phi = acos(2*x[2]-1)-pi/2
	r = [cos(phi)*sin(theta), cos(phi)*cos(theta), sin(phi)] #phi close to zero is in the moon orbit plane injection
	r = [JR*1000*d for d in r]
	
	l = lambert_problem(r,r_P[0],T[0]*DAY2SEC,common_mu, False, False)

	#Lambert arc to reach seq[1]
	v_end_l = l.get_v2()[0]
	v_beg_l = l.get_v1()[0]

	#init lists for fly-by parameters
	vinf_list = []
	rp_list = []
	beta_list = []

	#First DSM occuring at the very beginning (will be cancelled by the optimizer)
	DV[0] = abs(norm(v_beg_l) - 3400)

	#4 - And we proceed with each successive leg
	for i in xrange(1,nlegs):
		#Fly-by 
		v_out = fb_prop(v_end_l,v_P[i-1],x[1+4*i]*seq[i-1].radius,x[4*i],seq[i-1].mu_self)
		
		vinf_list.append( [a-b for a,b in zip(v_end_l,v_P[i-1])] )
		rp_list.append(x[1+4*i]*seq[i-1].radius)
		beta_list.append(x[4*i])

		#s/c propagation before the DSM
		r,v = propagate_lagrangian(r_P[i-1],v_out,x[4*i+2]*T[i]*DAY2SEC,common_mu)
		
		#Lambert arc to reach Earth during (1-nu2)*T2 (second segment)
		dt = (1-x[4*i+2])*T[i]*DAY2SEC
		l = lambert_problem(r,r_P[i],dt,common_mu, False, False)
		v_end_l = l.get_v2()[0]
		v_beg_l = l.get_v1()[0]
		
        vinf_list.append([a-b for a,b in zip(v_end_l,v_P[-1])])
        rp_list.append(None)
        beta_list.append(None)
	return zip(ep_list, seq, vinf_list, rp_list, beta_list)
mga_incipit.get_score_data = _get_score_data_incipit


def _get_penalty_data(self,x):
	""" getTrajectory takes a genome x, and returns a Trajectory variable that is a list of all r, v, and time of flights
		Trajectory = [[r0, v0_out, r1, v1_in, tof, rp, ra, Trev, vinf], [r1, v1_out, r2, v2_in, tof, rp, ra, Trev, vinf], [...]]
		tof in days
	"""
	
	from PyKEP import epoch, lambert_problem, propagate_lagrangian, fb_prop, DAY2SEC;
	from math import pi, acos, cos, sin;
	import numpy as np;
	from _mass_penalty import get_rp_ra_Trev
	
	Trajectory = [];
	
	#1 -  we 'decode' the chromosome recording the various times of flight (days) in the list T for convenience
	T = x[3::4]
	
	# reconstruct properties that are known in _mga_incipit:
	self.seq = self.get_sequence();
	self.__n_legs = len(self.seq);
	self.common_mu = self.seq[0].mu_central_body
	
	#2 - We compute the epochs and ephemerides of the planetary encounters
	t_P = list([None] * (self.__n_legs))
	r_P = list([None] * (self.__n_legs))
	v_P = list([None] * (self.__n_legs))
	DV  = list([None] * (self.__n_legs))
	
	for i,planet in enumerate(self.seq):
		t_P[i] = epoch(x[0]+sum(T[:i+1]))
		r_P[i],v_P[i] = self.seq[i].eph(t_P[i])

	#3 - We start with the first leg: a lambert arc
	theta = 2*pi*x[1]
	phi = acos(2*x[2]-1)-pi/2
	r = [cos(phi)*sin(theta), cos(phi)*cos(theta), sin(phi)] #phi close to zero is in the moon orbit plane injection
	r = [JR*1000*d for d in r]
	
	l = lambert_problem(r,r_P[0],T[0]*DAY2SEC,self.common_mu, False, False)

	#Lambert arc to reach seq[1]
	v_end_l = l.get_v2()[0]
	v_beg_l = l.get_v1()[0]
	Tr = [tuple(r), v_beg_l, r_P[0], v_end_l, T[0]*DAY2SEC];
	rPvec = np.asarray(r_P[0]);
	vPvec = np.asarray(v_end_l);
	Tr = Tr + get_rp_ra_Trev(rPvec, vPvec);
	vinf = vPvec - np.asarray(v_P[0]);
	Tr = Tr + [vinf];
	Trajectory.append(Tr);

	#First DSM occuring at the very beginning (will be cancelled by the optimizer)
	DV[0] = abs(np.linalg.norm(v_beg_l) - 3400)

	#4 - And we proceed with each successive leg
	for i in xrange(1,self.__n_legs):
		#Fly-by 
		v_out = fb_prop(v_end_l,v_P[i-1],x[1+4*i]*self.seq[i-1].radius,x[4*i],self.seq[i-1].mu_self)
		#s/c propagation before the DSM
		r,v = propagate_lagrangian(r_P[i-1],v_out,x[4*i+2]*T[i]*DAY2SEC,self.common_mu)
		# append r, v, etc. to the Trajectory:
		Tr = [r_P[i-1], v_out, r, v, x[4*i+2]*T[i]*DAY2SEC];
		rPvec = np.asarray(r);
		vPvec = np.asarray(v);
		Tr = Tr + get_rp_ra_Trev(rPvec, vPvec);
		vinf = [];
		Tr = Tr + [vinf];
		Trajectory.append(Tr);
		
		#Lambert arc to reach Earth during (1-nu2)*T2 (second segment)
		dt = (1-x[4*i+2])*T[i]*DAY2SEC
		l = lambert_problem(r,r_P[i],dt,self.common_mu, False, False)
		v_end_l = l.get_v2()[0]
		v_beg_l = l.get_v1()[0]
		# append r, v, etc. to the Trajectory:
		Tr = [r, v_beg_l, r_P[i], v_end_l, (1-x[4*i+2])*T[i]*DAY2SEC];
		rPvec = np.asarray(r_P[i]);
		vPvec = np.asarray(v_end_l);
		Tr = Tr + get_rp_ra_Trev(rPvec, vPvec);
		vinf = vPvec - np.asarray(v_P[i]);
		Tr = Tr + [vinf];
		Trajectory.append(Tr);
		
		
		#DSM occuring at time nu2*T2
		DV[i] = np.linalg.norm([a-b for a,b in zip(v_beg_l,v)])
	return Trajectory;  		
mga_incipit.get_penalty_data = _get_penalty_data

def _print_tisserand_lists(self, Trajectory=[]):
	
	"""  print_tisserand_lists(Trajectory)
	     Prints a trajectory obtained with get_trajectory() as lists that can be pasted into MATLAB
	"""
	
	import numpy as np
	
	n = len(Trajectory);
	rpl = [];
	ral = [];
	pl = [];
	vinfl = [];
	for i in range(n):
		ral.append(Trajectory[i][6]);
		rpl.append(Trajectory[i][5]);
		pl.append(Trajectory[i][7]);
		vinfl.append(Trajectory[i][8]);
	
	print 'list_ra_python = [',
	n = len(ral);
	for i in range(n-1):
		print '%f, ' % ral[i],
	print '%f];' % ral[n-1];
	
	print 'list_rp_python = [',
	n = len(rpl);
	for i in range(n-1):
		print '%f, ' % rpl[i],
	print '%f];' % rpl[n-1];
	
	print 'list_period_python = [',
	n = len(pl);
	for i in range(n-1):
		print '%f, ' % pl[i],
	print '%f];' % pl[n-1];
	
	print 'list_vinf_python = [',
	n = len(vinfl);
	for i in range(n-1):
		if(vinfl[i] != []):
			print '%f, ' % np.linalg.norm(vinfl[i]),
		else:
			print '0, ',
	print '%f];' % np.linalg.norm(vinfl[n-1]);
	
	print 'list_vinf_python_x = [',
	n = len(vinfl);
	for i in range(n-1):
		if(vinfl[i] != []):
			print '%f, ' % vinfl[i][0],
		else:
			print '0, ',
	print '%f];' % vinfl[n-1][0];
	
	print 'list_vinf_python_y = [',
	n = len(vinfl);
	for i in range(n-1):
		if(vinfl[i] != []):
			print '%f, ' % vinfl[i][1],
		else:
			print '0, ',
	print '%f];' % vinfl[n-1][1];
	
	print 'list_vinf_python_z = [',
	n = len(vinfl);
	for i in range(n-1):
		if(vinfl[i] != []):
			print '%f, ' % vinfl[i][2],
		else:
			print '0, ',
	print '%f];' % vinfl[n-1][2]; 
	
	
mga_incipit.print_tisserand_lists = _print_tisserand_lists	


def _get_score_data_part(self,x):
	from PyKEP import epoch, lambert_problem, DAY2SEC, fb_prop, propagate_lagrangian
	from math import pi, acos,cos,sin,sqrt
	from scipy.linalg import norm
	from copy import deepcopy
	"""
	This method returns the data needed to compute the score of a trajectory.
	"""
	#1 -  we 'decode' the chromosome recording the various times of flight (days) in the list T for convenience
	T = x[3::4]
	nlegs = len(x)/4
	seq = self.get_sequence()
	common_mu = seq[0].mu_central_body
	t0 = self.t0.mjd2000
	vinf_in = deepcopy(self.vinf_in)
	
	#2 - We compute the epochs and ephemerides of the planetary encounters
	ep_list = list([None] * (nlegs+1))
	t_P = list([None] * (nlegs+1))
	r_P = list([None] * (nlegs+1))
	v_P = list([None] * (nlegs+1))
	DV  = list([None] * nlegs)
	
	for i,planet in enumerate(seq):
		ep_list[i] = t0+sum(T[:i])
		t_P[i] = epoch(t0+sum(T[:i]))
		r_P[i],v_P[i] = seq[i].eph(t_P[i])

	#init lists for fly-by parameters
	vinf_list = []
	rp_list = []
	beta_list = []

	v_end_l = [a+b for a,b in zip(vinf_in, v_P[0])]
	
	#3 - And we proceed with each successive leg
	for i in xrange(nlegs):
		#Fly-by 
		v_out = fb_prop(v_end_l,v_P[i],x[1+4*i]*seq[i].radius,x[4*i],seq[i].mu_self)
		vinf_list.append( [a-b for a,b in zip(v_end_l,v_P[i])] )
		rp_list.append(x[1+4*i]*seq[i].radius)
		beta_list.append(x[4*i])

		#s/c propagation before the DSM
		r,v = propagate_lagrangian(r_P[i],v_out,x[4*i+2]*T[i]*DAY2SEC,common_mu)
		
		#Lambert arc to reach Earth during (1-nu2)*T2 (second segment)
		dt = (1-x[4*i+2])*T[i]*DAY2SEC
		l = lambert_problem(r,r_P[i+1],dt,common_mu, False, False)
		v_end_l = l.get_v2()[0]
		v_beg_l = l.get_v1()[0]

        vinf_list.append([a-b for a,b in zip(v_end_l,v_P[-1])])
        rp_list.append(None)
        beta_list.append(None)
	return zip(ep_list, seq, vinf_list, rp_list, beta_list)
mga_part.get_score_data = _get_score_data_part

def _get_penalty_data_part(self,x):
	from PyKEP import epoch, lambert_problem, DAY2SEC, fb_prop, propagate_lagrangian
	from math import pi, acos,cos,sin,sqrt
	from scipy.linalg import norm
	from copy import deepcopy
	from _mass_penalty import get_rp_ra_Trev
	import numpy as np
	
	"""
	This method returns the data needed to compute the score of a trajectory.
	"""
	
	Trajectory = [];
	
	#1 -  we 'decode' the chromosome recording the various times of flight (days) in the list T for convenience
	T = x[3::4]
	nlegs = len(x)/4
	seq = self.get_sequence()
	common_mu = seq[0].mu_central_body
	t0 = self.t0.mjd2000
	vinf_in = deepcopy(self.vinf_in)
	
	#2 - We compute the epochs and ephemerides of the planetary encounters
	ep_list = list([None] * (nlegs+1))
	t_P = list([None] * (nlegs+1))
	r_P = list([None] * (nlegs+1))
	v_P = list([None] * (nlegs+1))
	DV  = list([None] * nlegs)
	
	for i,planet in enumerate(seq):
		ep_list[i] = t0+sum(T[:i])
		t_P[i] = epoch(t0+sum(T[:i]))
		r_P[i],v_P[i] = seq[i].eph(t_P[i])

	v_end_l = [a+b for a,b in zip(vinf_in, v_P[0])]
	
	#3 - And we proceed with each successive leg
	for i in xrange(nlegs):
		#Fly-by 
		v_out = fb_prop(v_end_l,v_P[i],x[1+4*i]*seq[i].radius,x[4*i],seq[i].mu_self)
		#s/c propagation before the DSM
		r,v = propagate_lagrangian(r_P[i],v_out,x[4*i+2]*T[i]*DAY2SEC,common_mu)
		
		# append r, v, etc. to the Trajectory:
		Tr = [r_P[i-1], v_out, r, v, x[4*i+2]*T[i]*DAY2SEC];
		rPvec = np.asarray(r);
		vPvec = np.asarray(v);
		Tr = Tr + get_rp_ra_Trev(rPvec, vPvec);
		vinf = [];
		Tr = Tr + [vinf];
		Trajectory.append(Tr);
		
		#Lambert arc to reach Earth during (1-nu2)*T2 (second segment)
		dt = (1-x[4*i+2])*T[i]*DAY2SEC
		l = lambert_problem(r,r_P[i+1],dt,common_mu, False, False)
		v_end_l = l.get_v2()[0]
		v_beg_l = l.get_v1()[0]
		
		# append r, v, etc. to the Trajectory:
		Tr = [r, v_beg_l, r_P[i], v_end_l, (1-x[4*i+2])*T[i]*DAY2SEC];
		rPvec = np.asarray(r_P[i]);
		vPvec = np.asarray(v_end_l);
		Tr = Tr + get_rp_ra_Trev(rPvec, vPvec);
		vinf = vPvec - np.asarray(v_P[i]);
		Tr = Tr + [vinf];
		Trajectory.append(Tr);

        return Trajectory;
mga_part.get_penalty_data = _get_penalty_data_part

def _compute_DV_DT_incipit(self,x):
	"""
	This method computes, for each leg, all the velocity increments coming from
	deep space manoeuvres and all the transfer times.
	
	Use: 
		DV,DT = prob.compute_DV_DT(x)
		
	* x: trajectory encoding
	"""
	from PyKEP import epoch, lambert_problem, DAY2SEC, fb_prop, propagate_lagrangian
	from math import pi, acos,cos,sin,sqrt
	from scipy.linalg import norm
	
	#1 -  we 'decode' the chromosome recording the various times of flight (days) in the list T for convenience
	T = x[3::4]
	n_legs = len(x)/4
	seq = self.get_sequence()
	common_mu = seq[0].mu_central_body
	#2 - We compute the epochs and ephemerides of the planetary encounters
	t_P = list([None] * (n_legs))
	r_P = list([None] * (n_legs))
	v_P = list([None] * (n_legs))
	DV  = list([None] * (n_legs))
	
	for i,planet in enumerate(seq):
		t_P[i] = epoch(x[0]+sum(T[:i+1]))
		r_P[i],v_P[i] = seq[i].eph(t_P[i])

	#3 - We start with the first leg: a lambert arc
	theta = 2*pi*x[1]
	phi = acos(2*x[2]-1)-pi/2
	r = [cos(phi)*sin(theta), cos(phi)*cos(theta), sin(phi)] #phi close to zero is in the moon orbit plane injection
	r = [JR*1000*d for d in r]
	
	l = lambert_problem(r,r_P[0],T[0]*DAY2SEC,common_mu, False, False)

	#Lambert arc to reach seq[1]
	v_end_l = l.get_v2()[0]
	v_beg_l = l.get_v1()[0]

	#First DSM occuring at the very beginning (will be cancelled by the optimizer)
	DV[0] = abs(norm(v_beg_l) - 3400)

	#4 - And we proceed with each successive leg
	for i in xrange(1,n_legs):
		#Fly-by 
		v_out = fb_prop(v_end_l,v_P[i-1],x[1+4*i]*seq[i-1].radius,x[4*i],seq[i-1].mu_self)
		#s/c propagation before the DSM
		r,v = propagate_lagrangian(r_P[i-1],v_out,x[4*i+2]*T[i]*DAY2SEC,common_mu)
		#Lambert arc to reach Earth during (1-nu2)*T2 (second segment)
		dt = (1-x[4*i+2])*T[i]*DAY2SEC
		l = lambert_problem(r,r_P[i],dt,common_mu, False, False)
		v_end_l = l.get_v2()[0]
		v_beg_l = l.get_v1()[0]
		#DSM occuring at time nu2*T2
		DV[i] = norm([a-b for a,b in zip(v_beg_l,v)])
	return (DV,T)   
mga_incipit.compute_DV_DT = _compute_DV_DT_incipit

def _get_lt_problem(self,x,n_seg=[10,10], high_fidelity=True):
	"""
	This method returns the equivalent low-thrust problem of an incipit
	"""
	from PyKEP import epoch, lambert_problem, DAY2SEC, fb_prop, propagate_lagrangian
	from PyGMO import population
	from math import pi, acos,cos,sin,sqrt, exp
	from scipy.linalg import norm
	
	retval = []
	#1 -  we 'decode' the chromosome recording the various times of flight (days) in the list T for convenience
	T = x[3::4]
	n_legs = len(x)/4
	seq = self.get_sequence()
	common_mu = seq[0].mu_central_body
	#2 - We compute the epochs and ephemerides of the planetary encounters
	t_P = list([None] * (n_legs))
	r_P = list([None] * (n_legs))
	v_P = list([None] * (n_legs))
	DV  = list([None] * (n_legs))
	
	for i,planet in enumerate(seq):
		t_P[i] = epoch(x[0]+sum(T[:i+1]))
		r_P[i],v_P[i] = seq[i].eph(t_P[i])

	#3 - We start with the first leg: a lambert arc
	theta = 2*pi*x[1]
	phi = acos(2*x[2]-1)-pi/2
	r = [cos(phi)*sin(theta), cos(phi)*cos(theta), sin(phi)] #phi close to zero is in the moon orbit plane injection
	r = [JR*1000*d for d in r]
	
	l = lambert_problem(r,r_P[0],T[0]*DAY2SEC,common_mu, False, False)

	#Lambert arc to reach seq[1]
	v_end_l = l.get_v2()[0]
	v_beg_l = l.get_v1()[0]
	
	#We start appending in the lt chromosome (see mga_incipit_lt)
	retval.append(theta)
	retval.append(phi)
	
	#First DSM occuring at the very beginning (will be cancelled by the optimizer)
	DV[0] = abs(norm(v_beg_l) - 3400)
	
	#Start of the first lt leg encoding 
	retval.append(T[0])
	retval.append(exp(-DV[0]/9.80665/2000)*2000) #Tsiolkowsky
	retval.extend(v_beg_l)
	retval.extend([a-b for a,b in zip(v_end_l,v_P[0])])

	#4 - And we proceed with each successive leg
	for i in xrange(1,n_legs):
		#Fly-by 
		v_out = fb_prop(v_end_l,v_P[i-1],x[1+4*i]*seq[i-1].radius,x[4*i],seq[i-1].mu_self)
		#s/c propagation before the DSM
		r,v = propagate_lagrangian(r_P[i-1],v_out,x[4*i+2]*T[i]*DAY2SEC,common_mu)
		#Lambert arc to reach Earth during (1-nu2)*T2 (second segment)
		dt = (1-x[4*i+2])*T[i]*DAY2SEC
		l = lambert_problem(r,r_P[i],dt,common_mu, False, False)
		v_end_l = l.get_v2()[0]
		v_beg_l = l.get_v1()[0]
		#DSM occuring at time nu2*T2
		DV[i] = norm([a-b for a,b in zip(v_beg_l,v)])
		
		#lt encoding of all legs
		retval.append(T[i])
		retval.append(exp(-sum(DV[:i+1])/9.80665/2000)*2000) #Tsiolkowsky
		retval.extend([a-b for a,b in zip(v_out,v_P[i-1])])
		if i != n_legs-1:
			retval.extend([a-b for a,b in zip(v_end_l,v_P[i])])
	
	retval = retval + [0]*sum(n_seg)*3
	prob = mga_incipit_lt(high_fidelity=high_fidelity,seq=seq, n_seg = n_seg,tf = epoch(x[0]+sum(T)), vf = [a-b for a,b in zip(v_end_l,v_P[i])])
	# solves the problem of chemical trajectories wanting higher launch dv
	ub = list(prob.ub)
	lb = list(prob.lb)
	ub[4:7] = [5000,5000,5000]
	lb[4:7] = [-5000,-5000,-5000]
	prob.set_bounds(lb, ub)
	pop = population(prob)
	pop.push_back(retval)
	return (prob,pop)  
mga_incipit.get_lt_prob = _get_lt_problem


#clean the namespace 
del planet, DEG2RAD, epoch
