from PyGMO.problem import base as base_problem
from PyKEP import epoch,  EARTH_VELOCITY, AU
from PyKEP.sims_flanagan import leg, spacecraft, sc_state
from math import pi, cos, sin, acos
import math
from scipy.linalg import norm
from gtoc6 import europa, io, JR, MU_JUPITER
import numpy as np
from numpy import linalg

class one_lt_leg(base_problem):
	"""
	A single leg optimizer, fixed time, fixed boundary conditions
	
	x = [mf] * throttles

	"""
	def __init__(self, 
			t = [epoch(8.233141758995751e+003), epoch(8.289990617468195e+003)],
			r = [[-660821073.83843112, -85286653.193055451, -3513417.5052384529], [-660832082.91625774, -85197143.615338504, -3513971.6825616611]],
			v = [[7873.9701471924709, -16990.277371090539, -58.967610944493998], [7869.0526122101373, -16988.601525093596, -58.937906751346844]],
			m0 = 2000,
			Tmax = 0.1,
			Isp = 2000,
			mu = MU_JUPITER,
			n_seg = 10,
			high_fidelity = False,
			optimize_mass = False
		):
		"""
		USAGE: one_lt_leg(t = [epoch(8.233141758995751e+003), epoch(8.289990617468195e+003)],
			r = [[-660821073.83843112, -85286653.193055451, -3513417.5052384529], [-660832082.91625774, -85197143.615338504, -3513971.6825616611]],
			v = [[7873.9701471924709, -16990.277371090539, -58.967610944493998], [7869.0526122101373, -16988.601525093596, -58.937906751346844]],
			m0 = 2000,
			Tmax = 0.1,
			Isp = 2000,
			mu = MU_JUPITER,
			n_seg = 10,
			high_fidelity = False)

		* t: starting and final epochs
		* r: starting and final position (m)
		* v: starting and final velocity (m/s)
		* m0: starting mass (k)
		* Tmax: maximum allowed thrust (N)
		* Isp: specific impulse (s)
		* mu = central body gravity parameter (m^3/s^2)
		* n_seg = number of segments,
		* high_fidelity = compute the trajectory in high fidelity mode
		* optimize_mass = when False the problem is built as a constraint satisfaction problem. When True mass gets optimized
		"""
		
		self.__t = t
		self.__r = r
		self.__v = v
		self.__opt_mass = optimize_mass
		self.__sc = spacecraft(m0,Tmax,Isp)
		self.__leg = leg()
		self.__leg.set_mu(mu)
		self.__leg.set_spacecraft(self.__sc)
		self.__leg.high_fidelity = high_fidelity
		dim =  1 + n_seg * 3
		c_dim = n_seg + 7
		#First we call the constructor for the base PyGMO problem 
		#As our problem is n dimensional, box-bounded (may be multi-objective), we write
		#(dim, integer dim, number of obj, number of con, number of inequality con, tolerance on con violation)
		super(one_lt_leg,self).__init__(dim,0,1,c_dim,n_seg,1e-4)
		
		#And we compute the bounds
		lb = [m0/2] + [-1.0] * n_seg * 3
		ub = [m0] + [1.0] * n_seg * 3
		self.set_bounds(lb,ub)

	#Objective function
	def _objfun_impl(self,x):
		if (self.__opt_mass):
			return (-x[0],)
		else:
			return (1.0,)   
		
	def _compute_constraints_impl(self,x):
		x0 = sc_state(self.__r[0],self.__v[0],self.__sc.mass)
		xf = sc_state(self.__r[1],self.__v[1],x[0])
		throttles = x[1:]
		self.__leg.set(self.__t[0],x0,throttles,self.__t[1], xf)
		#leg = self.__leg
		#raise Exception
	
		retval = list(self.__leg.mismatch_constraints() + self.__leg.throttles_constraints())
		
		retval[0] = retval[0] / (JR)
		retval[1] = retval[1] / (JR)
		retval[2] = retval[2] / (JR)
		#using Europa velocity as unit
		retval[3] = retval[3] / 13000
		retval[4] = retval[4] / 13000
		retval[5] = retval[5] / 13000
		retval[6] = retval[6] / 1000
		
		return retval
		
		
	def human_readable_extra(self):
             return ("\n\tInitial and Final epochs: " + str(self.__t) + 
			"\n\tInitial and Final position: " + str(self.__r) + 
			"\n\tInitial and Final velocity: " + str(self.__v) +
			"\n\tOptimize mass?: " + str(self.__opt_mass))
