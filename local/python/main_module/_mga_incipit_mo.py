from PyGMO.problem import base as base_problem
from PyKEP import epoch,DAY2SEC,planet_ss,MU_SUN,lambert_problem,propagate_lagrangian,fb_prop, AU, closest_distance
from math import pi, cos, sin, acos
import math
from scipy.linalg import norm
from gtoc6 import europa, io, JR, MU_JUPITER
import numpy as np
from numpy import linalg

class mga_incipit(base_problem):
	"""
	A PyGMO global optimization problem (box-bounded, continuous) representing the gtoc6 preliminary trajectory capture (single and multi-objective)
	
	Decision vector:
	[t0,u,v,T,a0] + [beta1, rp1/rP1, eta1,a1] + ....
	Each leg time-of-flight can be obtained as T(n) = a(n)/(sum(a(i)))*T, T(n-1)= a(n-1)/(sum(a(i)))*T

	---Aurelie 27-09-12

	"""
	def __init__(self, 
			seq = [io,io,europa], 
			t0 = [epoch(7305.0),epoch(11322.0)],
			tof = [200,500],
			multi_objective = False
		):
		"""

		* seq: list of jupiter moons defining the trajectory incipit
		* t0:  list of two epochs defining the launch window
		* tof: list of n lists containing the lower and upper bounds for the legs flight times (days)
		"""
		
		self.__n_legs = len(seq)
		self.tof = tof
		#dim = 5+4 * self.__n_legs-1
		dim = 5+4*(len(seq)-1)
		obj_dim = multi_objective + 1
		#First we call the constructor for the base PyGMO problem 
		#As our problem is n dimensional, box-bounded (may be multi-objective), we write
		#(dim, integer dim, number of obj, number of con, number of inequality con, tolerance on con violation)
		super(mga_incipit,self).__init__(dim,0,obj_dim,0,0,0)

		#We then define all planets in the sequence  and the common central body gravity as data members
		self.seq = seq
		self.common_mu = seq[0].mu_central_body
		
		#And we compute the bounds
		lb = [t0[0].mjd2000,0.0,0.0,tof[0],1e-5]
		ub = [t0[1].mjd2000,1.0,1.0,tof[1],1-1e-5]
		for i in range(1, self.__n_legs):
			lb = lb + [-2*pi   ,1.1 , 1e-5    , 1e-5] 
			ub = ub + [2*pi    ,30.0, 1-1e-5, 1-1e-5]
		
		#Accounting for the fly-bys altitudes
		for i,pl in enumerate(seq[0:-1]):
			lb[6+4*i] = pl.safe_radius / pl.radius
			ub[6+4*i] = (pl.radius + 2000000) / pl.radius
			
		#And we set them
		self.set_bounds(lb,ub)

	#Objective function
	def _objfun_impl(self,x):
		#1 -  we 'decode' the chromosome recording the various times of flight (days) in the list T for convenience
		T = list([0]*(self.__n_legs))

		#sum_alpha = 0
		#for i in range(self.__n_legs-1):
		#	sum_alpha = sum_alpha+x[4+4*i]

		#for i in xrange(self.__n_legs-1):
		#	T[i] = (x[4+4*i]/sum_alpha)*x[3]


		for i in xrange(0,self.__n_legs):
			T[i] = (x[4+4*i]/sum(x[4::4]))*x[3]

		

		#print "\tDuration: " + str(T) + "days"
		#return(T,)

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

		#First DSM occuring at the very beginning (will be cancelled by the optimizer)
		DV[0] = abs(norm(v_beg_l) - 3400)

		#4 - And we proceed with each successive leg
		for i in xrange(1,self.__n_legs):
			#Fly-by 

			v_out = fb_prop(v_end_l,v_P[i-1],x[6+(i-1)*4]*self.seq[i-1].radius,x[5+(i-1)*4],self.seq[i-1].mu_self)
			#s/c propagation before the DSM
			r,v = propagate_lagrangian(r_P[i-1],v_out,x[7+(i-1)*4]*T[i]*DAY2SEC,self.common_mu)
			#Lambert arc to reach Earth during (1-nu2)*T2 (second segment)
			dt = (1-x[7+(i-1)*4])*T[i]*DAY2SEC
			l = lambert_problem(r,r_P[i],dt,self.common_mu, False, False)
			v_end_l = l.get_v2()[0]
			v_beg_l = l.get_v1()[0]
			tmp2, ra2 = closest_distance(r,v_beg_l, r_P[i], v_end_l, self.common_mu)
			if tmp < tmp2:
				close_d[i] = tmp/JR
				ra = ra/JR
			else:
				close_d[i] = tmp2/JR
				ra = ra2/JR
			#DSM occuring at time nu2*T2
			DV[i] = norm([a-b for a,b in zip(v_beg_l,v)])


		coeff = 0.3
		for i in xrange(0,self.__n_legs):
			ratio[i] = (DV[i]/(T[i]*DAY2SEC))
			DV_2rj[i] = DV[i] + max((2.0-close_d[i]),0.0)*1000 + max((ratio[i]-coeff*(0.1/2000)),0.0)*100
			T_2rj[i] = T[i] + max((2.0-close_d[i]),0.0)*1000 + max((ratio[i]-coeff*(0.1/2000)),0.0)*100

		#if self.f_dimension == 1:
		#	return (sum(DV)
		#else:
		#	return (sum(DV), sum(T)) 

		if self.f_dimension == 1:
			return (sum(DV_2rj))
		else:
			return (sum(DV_2rj), sum(T_2rj)) 
				
	def pretty(self,x):
		"""
		Prints human readable information on the trajectory represented by the decision vector x
		
		Example::
		
		  prob.pretty(x)
		"""

		#1 -  we 'decode' the chromosome recording the various times of flight (days) in the list T for convenience
		T = list([0]*(self.__n_legs))

		for i in xrange(self.__n_legs):
			T[i] = (x[4+4*i]/sum(x[4::4]))*x[3]

		#2 - We compute the epochs and ephemerides of the planetary encounters
		t_P = list([None] * (self.__n_legs))
		r_P = list([None] * (self.__n_legs))
		v_P = list([None] * (self.__n_legs))
		DV  = list([None] * (self.__n_legs))
		close_d = list([None] * (self.__n_legs))
		
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
		close_d[0] = closest_distance(r,v_beg_l, r_P[0], v_end_l, self.common_mu)[0] / JR

		#First DSM occuring at the very beginning (will be cancelled by the optimizer)
		DV[0] = abs(norm(v_beg_l) - 3400)

		print "\nFirst Leg: 1000JR to " + self.seq[0].name 
		print "\tDeparture: " + str(t_P[0]) + " (" + str(t_P[0].mjd2000) + " mjd2000) " 
		print "\tDuration: " + str(T[0]) + "days"
		print "\tInitial Velocity Increment (m/s): " + str(DV[0])
		print "\tArrival relative velocity at " + self.seq[0].name +" (m/s): " + str(norm([a-b for a,b in zip(v_end_l,v_P[0])]))
		print "\tClosest approach distance: " + str(close_d[0])

		#4 - And we proceed with each successive leg
		for i in xrange(1,self.__n_legs):
			#Fly-by 

			v_out = fb_prop(v_end_l,v_P[i-1],x[6+(i-1)*4]*self.seq[i-1].radius,x[5+(i-1)*4],self.seq[i-1].mu_self)
			#s/c propagation before the DSM
			r,v = propagate_lagrangian(r_P[i-1],v_out,x[7+(i-1)*4]*T[i]*DAY2SEC,self.common_mu)
			tmp, ra = closest_distance(r_P[i-1],v_out, r,v, self.common_mu)
			#Lambert arc to reach Earth during (1-nu2)*T2 (second segment)
			dt = (1-x[7+(i-1)*4])*T[i]*DAY2SEC
			l = lambert_problem(r,r_P[i],dt,self.common_mu, False, False)
			v_end_l = l.get_v2()[0]
			v_beg_l = l.get_v1()[0]
			tmp2, ra2 = closest_distance(r,v_beg_l, r_P[i], v_end_l, self.common_mu)
			if tmp < tmp2:
				close_d[i] = tmp/JR
				ra = ra/JR
			else:
				close_d[i] = tmp2/JR
				ra = ra2/JR
			#DSM occuring at time nu2*T2
			DV[i] = norm([a-b for a,b in zip(v_beg_l,v)])

			print "\nleg no. " + str(i+1) + ": " + self.seq[i-1].name + " to " + self.seq[i].name 
			print "\tDuration (days): " + str(T[i])
			print "\tFly-by epoch: " + str(t_P[i]) + " (" + str(t_P[i].mjd2000) + " mjd2000) " 
			print "\tFly-by altitude (km): " + str((x[6+(i-1)*4]*self.seq[i-1].radius-self.seq[i-1].radius)/1000)
			print "\tDSM after (days): " + str(x[7+(i-1)*4]*T[i])
			print "\tDSM magnitude (m/s): " + str(DV[i]) 
			print "\tClosest approach distance: " + str(close_d[i])
			print "\tApoapsis at closest distance: " + str(ra)
			print "\tV in (m/s): " + str(v_end_l)
			print "\tV out (m/s): " + str(v_out)
		
		
		print "\nArrival at " + self.seq[-1].name
		vel_inf = [a-b for a,b in zip(v_end_l,v_P[-1])]
		print "Arrival epoch: " + str(t_P[-1]) + " (" + str(t_P[-1].mjd2000) + " mjd2000) " 
		print "Arrival Vinf (m/s): " + vel_inf.__repr__() + " - " + str(norm(vel_inf))
		print "Total mission time (days): " + str(sum(T))
		print "Total DV (m/s): " + str(sum(DV))


	#Plot of the trajectory
	def plot(self,x):
		"""
		Plots the trajectory represented by the decision vector x
		
		Example::
		
		  prob.plot(x)
		"""
		import matplotlib as mpl
		from mpl_toolkits.mplot3d import Axes3D
		import matplotlib.pyplot as plt
		from PyKEP.orbit_plots import plot_planet, plot_lambert, plot_kepler

		mpl.rcParams['legend.fontsize'] = 10
		fig = plt.figure()
		ax = fig.gca(projection='3d')
		ax.scatter(0,0,0, color='y')
		
		#1 -  we 'decode' the chromosome recording the various times of flight (days) in the list T for convenience
		T = list([0]*(self.__n_legs))

		for i in xrange(self.__n_legs):
			T[i] = (x[4+4*i]/sum(x[4::4]))*x[3]

		
		#2 - We compute the epochs and ephemerides of the planetary encounters
		t_P = list([None] * (self.__n_legs))
		r_P = list([None] * (self.__n_legs))
		v_P = list([None] * (self.__n_legs))
		DV  = list([None] * (self.__n_legs))
		
		for i,planet in enumerate(self.seq):
			t_P[i] = epoch(x[0]+sum(T[:i+1]))
			r_P[i],v_P[i] = self.seq[i].eph(t_P[i])
			plot_planet(ax, planet, t0=t_P[i], color=(0.8,0.6,0.8), legend=True, units = JR)

		#3 - We start with the first leg: a lambert arc
		theta = 2*pi*x[1]
		phi = acos(2*x[2]-1)-pi/2
		r = [cos(phi)*sin(theta), cos(phi)*cos(theta), sin(phi)] #phi close to zero is in the moon orbit plane injection
		r = [JR*1000*d for d in r]
		
		l = lambert_problem(r,r_P[0],T[0]*DAY2SEC,self.common_mu, False, False)
		plot_lambert(ax,l, sol = 0, color='k', legend=False, units = JR, N=500)

		#Lambert arc to reach seq[1]
		v_end_l = l.get_v2()[0]
		v_beg_l = l.get_v1()[0]

		#First DSM occuring at the very beginning (will be cancelled by the optimizer)
		DV[0] = abs(norm(v_beg_l) - 3400)

		#4 - And we proceed with each successive leg
		for i in xrange(1,self.__n_legs):
			#Fly-by 

			v_out = fb_prop(v_end_l,v_P[i-1],x[6+(i-1)*4]*self.seq[i-1].radius,x[5+(i-1)*4],self.seq[i-1].mu_self)
			#s/c propagation before the DSM
			r,v = propagate_lagrangian(r_P[i-1],v_out,x[4*i+3]*T[i]*DAY2SEC,self.common_mu)
			plot_kepler(ax,r_P[i-1],v_out,x[7+(i-1)*4]*T[i]*DAY2SEC,self.common_mu,N = 500, color='b', legend=False, units = JR)
			#Lambert arc to reach Earth during (1-nu2)*T2 (second segment)
			dt = (1-x[7+(i-1)*4])*T[i]*DAY2SEC
			l = lambert_problem(r,r_P[i],dt,self.common_mu, False, False)
			plot_lambert(ax,l, sol = 0, color='r', legend=False, units = JR, N=500)
			v_end_l = l.get_v2()[0]
			v_beg_l = l.get_v1()[0]
			#DSM occuring at time nu2*T2
			DV[i] = norm([a-b for a,b in zip(v_beg_l,v)])
 
		plt.show()


	def stats_leg(self,x):
		import matplotlib as mpl
		import matplotlib.pyplot as plt

		#1 -  we 'decode' the chromosome recording the various times of flight (days) in the list T for convenience
		T = list([0]*(self.__n_legs))

		for i in xrange(self.__n_legs):
			T[i] = (x[4+4*i]/sum(x[4::4]))*x[3]

		#2 - We compute the epochs and ephemerides of the planetary encounters
		t_P = list([None] * (self.__n_legs))
		r_P = list([None] * (self.__n_legs))
		v_P = list([None] * (self.__n_legs))
		DV  = list([None] * (self.__n_legs))
		close_d = list([None] * (self.__n_legs))
		
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
		close_d[0] = closest_distance(r,v_beg_l, r_P[0], v_end_l, self.common_mu)[0] / JR

		#First DSM occuring at the very beginning (will be cancelled by the optimizer)
		DV[0] = abs(norm(v_beg_l) - 3400)

		#4 - And we proceed with each successive leg
		for i in xrange(1,self.__n_legs):
			#Fly-by 

			v_out = fb_prop(v_end_l,v_P[i-1],x[6+(i-1)*4]*self.seq[i-1].radius,x[5+(i-1)*4],self.seq[i-1].mu_self)
			#s/c propagation before the DSM
			r,v = propagate_lagrangian(r_P[i-1],v_out,x[7+(i-1)*4]*T[i]*DAY2SEC,self.common_mu)
			tmp, ra = closest_distance(r_P[i-1],v_out, r,v, self.common_mu)
			#Lambert arc to reach Earth during (1-nu2)*T2 (second segment)
			dt = (1-x[7+(i-1)*4])*T[i]*DAY2SEC
			l = lambert_problem(r,r_P[i],dt,self.common_mu, False, False)
			v_end_l = l.get_v2()[0]
			v_beg_l = l.get_v1()[0]
			tmp2, ra2 = closest_distance(r,v_beg_l, r_P[i], v_end_l, self.common_mu)
			if tmp < tmp2:
				close_d[i] = tmp/JR
				ra = ra/JR
			else:
				close_d[i] = tmp2/JR
				ra = ra2/JR
			#DSM occuring at time nu2*T2
			DV[i] = norm([a-b for a,b in zip(v_beg_l,v)])


		symbol_dict = {
			'io' : 'yo',
			'europa' : 'bo',
			'ganymede' : 'ro',
			'callisto' : 'ko' }


		for i in xrange(0,self.__n_legs):
			if close_d[i] > 2:
				#plt.plot(sum(DV), sum(T), symbol_dict[self.seq[0].name])
				plt.plot(DV[i], T[i], symbol_dict[self.seq[i].name])
				plt.plot(DV,T)
				
			else:
				print "\n the closest distance is less than 2*Rj " 
		plt.show()
	
	def stats(self,x):
		import matplotlib as mpl
		import matplotlib.pyplot as plt

		#1 -  we 'decode' the chromosome recording the various times of flight (days) in the list T for convenience
		T = list([0]*(self.__n_legs))

		for i in xrange(self.__n_legs):
			T[i] = (x[4+4*i]/sum(x[4::4]))*x[3]

		#2 - We compute the epochs and ephemerides of the planetary encounters
		t_P = list([None] * (self.__n_legs))
		r_P = list([None] * (self.__n_legs))
		v_P = list([None] * (self.__n_legs))
		DV  = list([None] * (self.__n_legs))
		close_d = list([None] * (self.__n_legs))
		
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
		close_d[0] = closest_distance(r,v_beg_l, r_P[0], v_end_l, self.common_mu)[0] / JR

		#First DSM occuring at the very beginning (will be cancelled by the optimizer)
		DV[0] = abs(norm(v_beg_l) - 3400)

		#4 - And we proceed with each successive leg
		for i in xrange(1,self.__n_legs):
			#Fly-by 

			v_out = fb_prop(v_end_l,v_P[i-1],x[6+(i-1)*4]*self.seq[i-1].radius,x[5+(i-1)*4],self.seq[i-1].mu_self)
			#s/c propagation before the DSM
			r,v = propagate_lagrangian(r_P[i-1],v_out,x[7+(i-1)*4]*T[i]*DAY2SEC,self.common_mu)
			tmp, ra = closest_distance(r_P[i-1],v_out, r,v, self.common_mu)
			#Lambert arc to reach Earth during (1-nu2)*T2 (second segment)
			dt = (1-x[7+(i-1)*4])*T[i]*DAY2SEC
			l = lambert_problem(r,r_P[i],dt,self.common_mu, False, False)
			v_end_l = l.get_v2()[0]
			v_beg_l = l.get_v1()[0]
			tmp2, ra2 = closest_distance(r,v_beg_l, r_P[i], v_end_l, self.common_mu)
			if tmp < tmp2:
				close_d[i] = tmp/JR
				ra = ra/JR
			else:
				close_d[i] = tmp2/JR
				ra = ra2/JR
			#DSM occuring at time nu2*T2
			DV[i] = norm([a-b for a,b in zip(v_beg_l,v)])


		#print "Total mission time (days): " + str(sum(T))
		#print "Total DV (m/s): " + str(sum(DV))

		symbol_dict = {
			'io' : 'yo',
			'europa' : 'bo',
			'ganymede' : 'ro',
			'callisto' : 'ko' }

		#for i in xrange(0,self.__n_legs):
		#	plt.plot(sum(DV), sum(T), symbol_dict[self.seq[0].name])

		#n = 0
		ratio = list([0]*(self.__n_legs))
		coeff = 0.3
		for i in xrange(0,self.__n_legs):
			ratio[i] = (DV[i]/(T[i]*DAY2SEC))

		if close_d[0] >= 2:
			if close_d[1] >= 2:
				if close_d[2] >= 2:
					if close_d[3] >= 2:
						if ratio[1] <= coeff*(0.1/2000):
							if ratio[2] <= coeff*(0.1/2000):
								if ratio[3] <= coeff*(0.1/2000):
									if ratio[0] <= coeff*(0.1/2000):
										plt.plot(sum(DV), sum(T), symbol_dict[self.seq[0].name])

		#for i in xrange(0,self.__n_legs):
		#	if close_d[i] > 2:
		#		plt.plot(sum(DV), sum(T), symbol_dict[self.seq[0].name])
		#	else:
		#		print "\n the closest distance is less than 2*Rj " 
		#print "\n number of sequences that do not crash " + str(n) 
		plt.show()


	

	def human_readable_extra(self):
             return ("\n\t Sequence: " + [pl.name for pl in self.seq].__repr__() +
		"\n\t Time of flights: " + self.tof.__repr__())
