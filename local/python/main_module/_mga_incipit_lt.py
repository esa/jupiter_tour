from PyGMO.problem import base as base_problem
from PyKEP import epoch,DAY2SEC, fb_con
from PyKEP.sims_flanagan import leg, spacecraft, sc_state
from math import pi, cos, sin, acos
from scipy.linalg import norm
from gtoc6 import europa, io, ganymede,JR, MU_JUPITER
import numpy as np
from numpy import linalg

class mga_incipit_lt(base_problem):
	"""
	This class can be used to transform a solution to the mga_incipit problem into low-thrust

	The decision vector (chromosome) is:
	[theta,phi] + 
	[T1, mf1, Vxi1_abs, Vyi1_abs, Vzi1_abs, Vxf1, Vyf1, Vzf1] +
	[T2, mf2, Vxi2, Vyi2, Vzi2, Vxf2, Vyf2, Vzf2] + .....
	...
	[Tn, mfn, Vxin, Vyin, Vzin] + .....
	[throttles1] + [throttles2] + ....
	"""
	def __init__(self, 
			seq = [ganymede,europa], 
			tf = epoch(8.174621347386377e+03),
			vf = [-1610.7520437617632, 5106.5676929998444, 122.39394967587651],
			n_seg = [10]*2, 
			m0 = 2000,
			Tmax = 0.1,
			Isp = 2000,
			mu = MU_JUPITER,
			high_fidelity = False,
			obj = 'none'
		):
		"""
		USAGE: mga_incipit_lt(seq = [io,io], t0 = [epoch(7305.0),epoch(11323.0)], tof = [[100,200],[3,200]])

		* seq: list of jupiter moons defining the trajectory incipit
		* t0:  list of two epochs defining the launch window
		* tof: list of n lists containing the lower and upper bounds for the legs flight times (days)
		* n_seg: list containing the number of segments for each leg
		* m0: starting mass (k)
		* Tmax: maximum allowed thrust (N)
		* Isp: specific impulse (s)
		* high_fidelity = compute the trajectory in high fidelity mode
		"""
		
		#1) We compute the problem dimensions .... and call the base problem constructor
		self.__n_legs = len(seq)
		n_fb = self.__n_legs - 1
		# 1a) The decision vector length
		dim = self.__n_legs * 8 + sum(n_seg) * 3 - 1
		# 1b) The total number of constraints (mismatch + fly-by + boundary + throttles
		c_dim = self.__n_legs * 7 + n_fb * 2 + 1 + sum(n_seg)
		# 1c) The number of inequality constraints (fly-by angle + throttles)
		c_ineq_dim = n_fb + sum(n_seg)
		# 1d) the number of objectives
		f_dim = 1
		#First we call the constructor for the base PyGMO problem 
		#As our problem is n dimensional, box-bounded (may be multi-objective), we write
		#(dim, integer dim, number of obj, number of con, number of inequality con, tolerance on con violation)
		super(mga_incipit_lt,self).__init__(dim,0,f_dim,c_dim,c_ineq_dim,1e-4)
		
		#2) We then define some class data members
		#public:
		self.seq = seq
		self.obj = obj
		self.vf = vf
		self.tf = tf.mjd2000
		#private:
		self.__n_seg = n_seg
		self.__sc = spacecraft(m0,Tmax,Isp)
		self.__leg = leg()
		self.__leg.set_mu(mu)
		self.__leg.set_spacecraft(self.__sc)
		self.__leg.high_fidelity = high_fidelity

		#3) We compute the bounds
		lb = (
			[-4*pi,   -pi] + 
			[0, m0 / 1.5, -10000, -10000, -10000, -10000, -10000, -10000] * (self.__n_legs - 1) + 
			[0, m0 / 1.5, -10000, -10000, -10000] +
			[-1,-1,-1] * sum(self.__n_seg)
		)
		ub = (
			[4*pi,pi] +  
			[1, m0, 10000, 10000, 10000, 10000, 10000, 10000] * (self.__n_legs - 1) + 
			[1, m0, 10000, 10000, 10000] +
			[1,1,1] * sum(self.__n_seg)
		)
		#3a ... and account for the bounds on the starting velocity
		lb[4:7] = [-3400.0]*3
		ub[4:7] = [3400.0]*3
		# 3b... and for the time of flight
		lb[2:2+8*self.__n_legs:8] = [1]*len(seq)
		ub[2:2+8*self.__n_legs:8] = [700]*len(seq)
		
		#4) And we set the bounds
		self.set_bounds(lb,ub)

	#Objective function
	def _objfun_impl(self,x):
		if self.obj=='mass':
			return (-x[3 + (self.__n_legs - 1) * 8],)
		if self.obj == 'tof':
				return (sum(x[2:2+8*self.__n_legs:8]),)
		if self.obj=='none':
			return (1.0,)
	#Constraints function
	def _compute_constraints_impl(self,x):
	  
		# 1 - We decode the chromosome extracting the time of flights
		T = list([0]*(self.__n_legs))
		for i in range(self.__n_legs):
			T[i] = x[2+i*8]
			
		#2 - We compute the epochs and ephemerides of the planetary encounters
		t_P = list([None] * (self.__n_legs+1))
		r_P = list([None] * (self.__n_legs+1))
		v_P = list([None] * (self.__n_legs+1))
		
		for i,planet in enumerate(self.seq):
			t_P[i+1] = epoch(self.tf - sum(T[i+1:]))
			r_P[i+1],v_P[i+1] = self.seq[i].eph(t_P[i+1])
			
		#And we insert a fake planet simulating the starting position
		t_P[0] = epoch(self.tf - sum(T))
		theta = x[0]
		phi = x[1]
		r = [cos(phi)*sin(theta), cos(phi)*cos(theta), sin(phi)] #phi close to zero is in the moon orbit plane injection
		r = [JR*1000*d for d in r]
		r_P[0] = r
		v_P[0] = x[4:7]
		
		#3 - We iterate through legs to compute mismatches and throttles constraints
		ceq = list()
		cineq = list()
		m0 = self.__sc.mass
		for i in range(self.__n_legs):

			if i!=0: #First Leg
				v = [a+b for a,b in zip(v_P[i],x[(4 + i * 8):(7 + i * 8)])]
			else:
				v = v_P[i]
			x0 = sc_state(r_P[i],v,m0)
			v = [a+b for a,b in zip(v_P[i+1],x[(7 + i * 8):(10 + i * 8)])]
			if (i==self.__n_legs-1): #Last leg
				v = [a+b for a,b in zip(v_P[i+1],self.vf)]
			xe = sc_state(r_P[i+1], v ,x[3+8*i])
			throttles = x[(8*self.__n_legs-1 + 3*sum(self.__n_seg[:i])):(8*self.__n_legs-1 + 3*sum(self.__n_seg[:i])+3*self.__n_seg[i])]
			self.__leg.set(t_P[i],x0,throttles,t_P[i+1],xe)

			#update mass!
			m0 = x[3+8*i]
			ceq.extend(self.__leg.mismatch_constraints())
			cineq.extend(self.__leg.throttles_constraints())
			#raise Exception    

		#Adding the boundary constraints
		#departure
		v_dep_con = (x[4] ** 2  + x[5] ** 2  + x[6] **2  - 3400.0 ** 2) / (3400.0**2)
		#arrival
		ceq.append(v_dep_con)

		#We add the fly-by constraints
		for i in range(self.__n_legs-1):
			DV_eq, alpha_ineq = fb_con(x[7 + i*8:10 + i*8],x[12+ i * 8:15+ i * 8],self.seq[i])
			ceq.append(DV_eq / (3400.0**2))
			cineq.append(alpha_ineq)

		#Making the mismatches non dimensional
		for i in range(self.__n_legs):
			ceq[0+i*7] /= JR*1000
			ceq[1+i*7] /= JR*1000
			ceq[2+i*7] /= JR*1000
			ceq[3+i*7] /= 3400
			ceq[4+i*7] /= 3400
			ceq[5+i*7] /= 3400
			ceq[6+i*7] /= 1000
			
		#We assemble the constraint vector
		retval = list()
		retval.extend(ceq)
		retval.extend(cineq)

		return retval

	#Constraints function
	def plot(self,x):
		import matplotlib as mpl
		from mpl_toolkits.mplot3d import Axes3D
		import matplotlib.pyplot as plt
		from PyKEP.orbit_plots import plot_planet, plot_sf_leg

		mpl.rcParams['legend.fontsize'] = 10
		fig = plt.figure()
		ax = fig.gca(projection='3d')
		ax.scatter(0,0,0, color='y')

		# 1 - We decode the chromosome extracting the time of flights
		T = list([0]*(self.__n_legs))
		for i in range(self.__n_legs):
			T[i] = x[2+i*8]
			
		#2 - We compute the epochs and ephemerides of the planetary encounters
		t_P = list([None] * (self.__n_legs+1))
		r_P = list([None] * (self.__n_legs+1))
		v_P = list([None] * (self.__n_legs+1))
		
		for i,planet in enumerate(self.seq):
			t_P[i+1] = epoch(self.tf - sum(T[i+1:]))
			r_P[i+1],v_P[i+1] = self.seq[i].eph(t_P[i+1])
			plot_planet(ax, self.seq[i], t_P[i+1], units=JR, legend = True,color='k')
			
		#And we insert a fake planet simulating the starting position
		t_P[0] = epoch(self.tf - sum(T))
		theta = x[0]
		phi = x[1]
		r = [cos(phi)*sin(theta), cos(phi)*cos(theta), sin(phi)] #phi close to zero is in the moon orbit plane injection
		r = [JR*1000*d for d in r]
		r_P[0] = r
		v_P[0] = x[4:7]
		
		#3 - We iterate through legs to compute mismatches and throttles constraints
		ceq = list()
		cineq = list()
		m0 = self.__sc.mass
		for i in range(self.__n_legs):

			if i!=0: #First Leg
				v = [a+b for a,b in zip(v_P[i],x[(4 + i * 8):(7 + i * 8)])]
			else:
				v = v_P[i]
			x0 = sc_state(r_P[i],v,m0)
			v = [a+b for a,b in zip(v_P[i+1],x[(7 + i * 8):(10 + i * 8)])]
			if (i==self.__n_legs-1): #Last leg
				v = [a+b for a,b in zip(v_P[i+1],self.vf)]
			xe = sc_state(r_P[i+1], v ,x[3+8*i])
			throttles = x[(8*self.__n_legs-1 + 3*sum(self.__n_seg[:i])):(8*self.__n_legs-1 + 3*sum(self.__n_seg[:i])+3*self.__n_seg[i])]
			self.__leg.set(t_P[i],x0,throttles,t_P[i+1],xe)
			plot_sf_leg(ax, self.__leg, units=JR,N=50)
			#update mass!
			m0 = x[3+8*i]
			ceq.extend(self.__leg.mismatch_constraints())
			cineq.extend(self.__leg.throttles_constraints())
			#raise Exception    
		plt.show()
		return ax

		
	def get_score_data(self,x):

		"""
		This method returns the data needed to compute the score of a trajectory. This is
		tuples of (epoch, moon, v_inf, rp, beta)
		"""
		from _feasible_faces import vinfs_to_beta, get_fb_axis
		
		# moons
		nlegs = self.__n_legs

		# time of flights
		T = x[2::8][:nlegs]
		
		# epochs and ephemerides of the planetary encounters
		# ep_list = list([None] * nlegs)
		ep_list = list([None] * (nlegs+1))
		t_P = list([None] * (nlegs+1))
		r_P = list([None] * (nlegs+1))
		v_P = list([None] * (nlegs+1))
		
		for i,planet in enumerate(self.seq):
			ep_list[i+1] = self.tf - sum(T[i+1:])
			t_P[i+1] = epoch(ep_list[i+1])
			r_P[i+1],v_P[i+1] = self.seq[i].eph(t_P[i+1])
		
		#And we insert a fake planet simulating the starting position
		ep_list[0] = self.tf - sum(T)
		t_P[0] = epoch(ep_list[0])
		theta = x[0]
		phi = x[1]
		r = [cos(phi)*sin(theta), cos(phi)*cos(theta), sin(phi)] #phi close to zero is in the moon orbit plane injection
		r = [JR*1000*d for d in r]
		r_P[0] = r
		v_P[0] = x[4:7]
		
		#getting vinfs_out
		vinf_in_list = list([None] * (nlegs))
		for i, planet in enumerate(self.seq):
			vinf_in_list[i] = x[7+(i*8):10+(i*8)]
		
		#getting vinfs_in
		vinf_out_list = list([None] * (nlegs+1))
		for i in xrange(len(self.seq) + 1):
			vinf_out_list[i] = x[4+(i*8):7+(i*8)]
	
		#getting rp
		beta_list = []
		rp_list = []
		for moon, vinf_in, vinf_out, v_planet in zip(self.seq[:-1], vinf_in_list[:-1], vinf_out_list[1:-1], v_P[1:]):
			alpha = acos(np.dot(vinf_in, vinf_out)/np.linalg.norm(vinf_in)/np.linalg.norm(vinf_out))
			rp_list.append(moon.mu_self/np.dot(vinf_in,vinf_in)*(1.0/sin(alpha/2.0)-1.0))
			beta_list.append(vinfs_to_beta(vinf_in, vinf_out, v_planet))

		# last flyby is not yet determined
		rp_list.append(None)
		beta_list.append(None)
	
		return zip(ep_list[1:], self.seq, vinf_in_list, rp_list, beta_list)

	def human_readable_extra(self):
             return (
            "\n\t Sequence: " + [pl.name for pl in self.seq].__repr__() +
			"\n\t Objective: " + self.obj +
			"\n\t tf: " + str(self.tf) +
			"\n\t vf: " + str(self.vf)
			)
