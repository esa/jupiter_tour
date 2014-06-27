#
# This module is used to visualize information saved in the trajectories
#
# author: mmarcusx@gmail.com
#
# p.s.: quick'n'dirty work, sorry for sparse documentation

import sys, os, cPickle
import matplotlib.pyplot as plt

from PyGMO import algorithm, population
from PyKEP import epoch,DAY2SEC,planet_ss,MU_SUN,lambert_problem,propagate_lagrangian,fb_prop, AU, closest_distance
from math import pi, cos, sin, acos
from scipy.linalg import norm
from gtoc6 import JR, mga_incipit, europa, io, callisto, ganymede, moon_score, one_lt_leg, get_mass_penalty
sys.path.append( './..' )
from lazy_race_tree_search import load_trajectory, fitness_mismatch, pretty, moon_score2

# encoding the moon with colors
color_dict = {
	'io' : 'y',
	'europa' : 'b',
	'ganymede' : 'r',
	'callisto' : 'k' }


class incipit_stats:
	""" Class for covering statistics for incipit trajectories """
	def __init__(self, ind, filename, idx, seq, common_mu, n_legs, initial, T, t_P, r_P, v_sc, DV, close_d):
		"""
		Constructor of the statistics object. Used to reconstruct the incipit trajectory with all its data.
		
		@param fpath relative filepath to the saved incipit trajectory
		""" 
		self.ind = ind
		self.x = ind.x
		self.filename = filename
		self.idx = idx

		self.seq = seq
		self.common_mu = common_mu
		self.n_legs = n_legs
		
		self.initial = initial
		self.T = T
		self.t_P = t_P
		self.r_P = r_P
		self.v_sc = v_sc
		self.DV = DV
		self.close_d = close_d
	
	def plot_dv_t(self, movement=False):
		""" The incipit plots itself:
		x-axis is Total Delta V
		y-axis is Total Time of Flight
		color indicates the first visited moon from the incipit 
		movement=True will plot the complete trajectory whereas
		movement=False will just print the end-point and the first
		encountered moon."""
		if movement:
			dv, T = 0, 0
			for idx, x in enumerate(self.seq):
				dv += self.DV[idx]
				T += self.T[idx]
				plt.plot( dv, T, color_dict[x.name] + 'o')
				if idx != 0:
					plt.plot( [dv - self.DV[idx],dv], [T - self.T[idx],T], 'k-' )
		else:
			plt.plot( sum(self.DV), sum(self.T), color_dict[self.seq[0].name] + 'o' )

	def get_problem(self):
		""" constructs an incipitproblem out of the statistics-object. """
		return mga_incipit( seq=self.seq, tof=[[0,300]]*self.n_legs )

	def dump(self, filepath):
		""" dumps its chromosome and the related incipit problem  in a file specified by filepath. """
		with open(filepath, 'wb') as f:
			cPickle.dump( (mga_incipit(seq=self.seq, tof=[[0,300]]*self.n_legs), self.x), f)
		print 'Plonk.'


def famous_check(feas_list):
	""" Checks the famous coefficient - prints a blue dot if incipit leg was infeasible 
	
	@param st: list containing tuples of feasibility tuples (which elements are True/False + coefficient)"""
	for inci in feas_list:
		for idx, leg in enumerate(inci):
			if leg[0]:
				plt.plot(idx, leg[1], 'bo')
			else:
				plt.plot(idx, leg[1], 'ro')


def filter_unthrustables(incis, verbose=False):
	""" given a list of incipits, checks low_thrustability for each of them and returns
		just those who are indeed feasible. """
	retval = []
	for inci in incis:
		check = check_low_thrustable(inci)
		if check[0][0] and check[1][0] and check[2][0] and check[3][0]:
			retval.append(inci)
	return retval

def check_low_thrustable(inci, verbose=False):
	""" Given a incipit_stats object, checks each leg on los_thrustabality. 
	
	It will return a list of tuple, one tuple for each leg. Each tuple 
	contains (feasibility, famous coefficient)."""
	if os.name == 'posix':
		alg = algorithm.snopt(500, feas_tol=1e-9, opt_tol=1e-2, screen_output=False)
	else:
		alg = algorithm.scipy_slsqp(screen_output=False)

	prob = one_lt_leg(t = inci.initial[0], r=inci.initial[1], v=inci.initial[2], high_fidelity=True)
	pop = population(prob, 1)
	pop = alg.evolve(pop)
	feasible = prob.feasibility_x(pop.champion.x)

	feas_list = [ feasible]
	fam_coeff_list = [ (inci.DV[0] / (inci.T[0]*DAY2SEC)) / (0.1 / 2000.0) ]
	
	if verbose:
		print '+++ Checking feasibility of: ' + inci.filename + ' +++'
		print 'Initial leg feasible? --> ' + str(prob.feasibility_x(pop.champion.x))
	
	for i in xrange(1, inci.n_legs):
		prob = one_lt_leg(t = [inci.t_P[i-1], inci.t_P[i]], r=[inci.r_P[i-1], inci.r_P[i]], 
						  v=[inci.v_sc[i-1][0], inci.v_sc[i-1][1]], high_fidelity=True)
		pop = population(prob, 1)
		pop = alg.evolve(pop)
		feasible = feasible and prob.feasibility_x(pop.champion.x)
		
		if verbose:
			print 'Leg no. ' + str(i) + ' feasible? --> ' + str(prob.feasibility_x(pop.champion.x))
		
		# compute famous coefficient
		fam_coeff_list.append( (inci.DV[i] / (inci.T[i]*DAY2SEC)) / (0.1 / 2000.0) )
		feas_list.append(prob.feasibility_x(pop.champion.x))

	if verbose:
		if feasible:
			print 'Feasible!'
		else:
			print 'infeasible...'
	
	return zip(feas_list, fam_coeff_list)


def extract_best_incipit():
	""" Instant function for extracting best incipits. """
	st = incipit_bulk_load('tree_searches/out/result1409_fast') + incipit_bulk_load('tree_searches/out/fast_incipits')
	destiny = 'chem_incipits/'
	st.sort(key= lambda inc: sum(inc.DV) )

	# walk list and print only the incis with a higher DV if they give a better time of flight
	with open(destiny + st[0].seq[0].name + '_' + st[0].seq[1].name + '_' + st[0].seq[2].name + '_' + st[0].seq[3].name + '_' + str(1), 'w' ) as f:
		cPickle.dump( [st[0].x], f)
	
	n = 2
	
	t = sum(st[0].T)
	for inci in st[1:]:
		if sum(inci.T) < t:
			t = sum(inci.T)
			with open(destiny + inci.seq[0].name + '_' + inci.seq[1].name + '_' + inci.seq[2].name + '_' + inci.seq[3].name + '_' + str(n), 'w' ) as f:
				cPickle.dump( [inci.x], f)
			n += 1


def get_front(incis):
	""" Given a list of inci_stats object, it will compute the pareto front and give it back as a list."""
	# sort ascending according DV
	incis.sort( key= lambda inc: sum(inc.DV) )
	# walk list and print only the incis with a higher DV if they give a better time of flight
	front = [ incis[0] ]

	t = sum(incis[0].T)
	for inci in incis[1:]:
		if sum(inci.T) < t:
			t = sum(inci.T)
			front.append(inci)
	
	return front

def front_plot(incis, movement=False):
	""" Given a list of inci_stats object, it will plot the front in the diagram. If movement
	is True we plot the whole 4 planet-trajectory."""
	for inci in get_front(incis):
		inci.plot_dv_t(movement)


def monkey_patch():
	""" Infamous monkey-patch for badly pickled trajectory. In case you get an error,
	call this function once and start praying... """
	sys.modules['__main__'].moon_score2 = moon_score2
	print 'Monkey patch applied!'
		

def lambertization(prob, x):
	""" Does all the lambert arc construction to get you DV and stuff """
	# get sequence
	try:
		seq = prob.seq
	except AttributeError:
		seq = prob.get_sequence()
	
	# get common mu
	try:
		common_mu = prob.common_mu
	except AttributeError:
		common_mu = seq[0].mu_central_body
	
	# number of legs
	n_legs = len(seq)
	
	# time of flights (days)
	T = x[3::4]
	
	# Epochs and Ephemerides of the planetary encounters
	t_P = list([None] * (n_legs))
	r_P = list([None] * (n_legs))
	v_P = list([None] * (n_legs))
	DV  = list([None] * (n_legs))
	close_d = list([None] * (n_legs))
		
	for i,planet in enumerate(seq):
		t_P[i] = epoch(x[0]+sum(T[:i+1]))
		r_P[i],v_P[i] = seq[i].eph(t_P[i])

	# Lambert arc to 1st leg
	theta = 2*pi*x[1]
	phi = acos(2*x[2]-1)-pi/2
	r = [cos(phi)*sin(theta), cos(phi)*cos(theta), sin(phi)] #phi close to zero is in the moon orbit plane injection
	r = [JR*1000*d for d in r]
		
	l = lambert_problem(r,r_P[0],T[0]*DAY2SEC,common_mu, False, False)

	v_end_l = l.get_v2()[0]
	v_beg_l = l.get_v1()[0]
	close_d[0] = closest_distance(r,v_beg_l, r_P[0], v_end_l, common_mu)[0] / JR
	
	# save the initial conditions on 1000JR
	initial = ( [epoch(x[0]), t_P[0]], [r,r_P[0]], [v_beg_l, v_end_l] )
		
	# First DSM occuring at the very beginning (will be cancelled by the optimizer)
	DV[0] = abs(norm(v_beg_l) - 3400)
	
	# creating new lists
	v_sc = []

	# Proceed with succeeding legs
	for i in xrange(1, n_legs):
		# Fly-by 
		v_out = fb_prop(v_end_l,v_P[i-1],x[1+4*i]*seq[i-1].radius,x[4*i],seq[i-1].mu_self)
		# s/c propagation before the DSM
		r,v = propagate_lagrangian(r_P[i-1],v_out,x[4*i+2]*T[i]*DAY2SEC,common_mu)
		tmp, ra = closest_distance(r_P[i-1],v_out, r,v, common_mu)
		# Lambert arc to reach Earth during (1-nu2)*T2 (second segment)
		dt = (1-x[4*i+2])*T[i]*DAY2SEC
		l = lambert_problem(r,r_P[i],dt,common_mu, False, False)
		v_end_l = l.get_v2()[0]
		v_beg_l = l.get_v1()[0]
		tmp2, ra2 = closest_distance(r,v_beg_l, r_P[i], v_end_l, common_mu)
		if tmp < tmp2:
			close_d[i] = tmp/JR
			ra = ra/JR
		else:
			close_d[i] = tmp2/JR
			ra = ra2/JR
		# DSM occuring at time nu2*T2
		DV[i] = norm([a-b for a,b in zip(v_beg_l,v)])
		v_sc.append( (v_out, v_end_l) ) # v_inf_out, v_inf_in

	
	return seq, common_mu, n_legs, initial, T, t_P, r_P, v_sc, DV, close_d


def reevaluate_score(fpath):
	""" Used to reevaluate trajectories with the exact scoring module moon_score3 
	
		@param: fpath a file path with trajectories in it
		@return: it dumps a file 'newscore.txt' in the folder, containing infos about the rescoring
	"""
	#import _moonscore as mscore_old
	import _moonscore3 as mscore_new
	fpath += '/' if fpath[-1] != '/' else ''
	# extract all trajectories
	
	try:
		fp = open(fpath + 'newscore.txt', 'w')
	except IOError:
		print 'could not create newscore.txt. Abort!'
		return
	
	#write header
	#fp.write('filename\told score\tnew score\tproblematic legs\tmass penalty\n')
	fp.write('filename\tnew score\tproblematic legs\tmass penalty\n')
	
	for file in os.listdir(fpath):
		if file[-5:] == 'stats' or file == 'newscore.txt':
			continue
		
		print 'reevaluate ' + file + ' ...'
		
		try:
			traj = trajectory_file_load(fpath + file)
		except Exception:
			print 'Could not evaluate ' + fpath + file + '!'
			continue
		
		prob = traj.get_problem()
		sd = prob.get_score_data(traj.x)
		#ms_old = mscore_old.moon_score() 
		ms_new = mscore_new.moon_score()
		ms_new.score_flyby_sequence(sd)
		#ms_old.score_flyby_sequence(sd)
		
		#print '--- OLD History ---'
		#ms_old.tell_history()

		print '--- NEW History ---'
		ms_new.tell_history()
		
		ltcheck = check_low_thrustable(traj)
		
		bad_legs = []
		for idx, val in enumerate(ltcheck):
			if not val[0]:
				bad_legs.append(idx)
		
		md = prob.get_penalty_data(traj.x)
		mass_pen = get_mass_penalty(md)

		print 'bad legs: ' + str(bad_legs) + ' / mass penalty: ' + str(mass_pen)

		s = file + '\t' + str(ms_new.jscore) + '\t' + str(bad_legs) + '\t' + str(mass_pen) + '\n'
		print s
		fp.write(s)
		
	print 'Done.'

	fp.close()
			
	
def incipit_bulk_load(fpath):
	""" used to load a incipits file from fast_incipits 
	
		@return a list of all feasible incipits found in the files of that directory
	"""
	fpath += '/' if fpath[-1] != '/' else ''
	retval = [inc for name in os.listdir(fpath) for inc in incipit_file_load(fpath + name)]
	print 'loaded ' + str(len(retval)) + ' incipits!'
	return retval


def incipit_problem(fpath, verbose=False):
	""" Loads a file with the incipit and returns a list of 2-tuples, containing
	the incipit-problem.obj and the chromosome """
	### REFACTOR this to avoid redundancy with incipit_file_load!
	file_name = fpath.split('/')[-1]
	
	# rebuild problem from file name
	probdata = file_name.lower().split('_')

	seq = [ eval(d) for d in probdata[:4] ]
	prob = mga_incipit( seq=seq, tof=[[0,300]]*len(seq) )

	# open up the pickle jar
	with open( fpath, 'rb' ) as f:
		l = cPickle.load( f )

	l.sort( key = lambda x : x.f[0] )

	#We look for good solutions in l
	sol = [] 
	for ind in l:
		# check for fitness mismatch
		if fitness_mismatch( prob, (ind.x,ind.f[0]), print_mismatch=False ) > 1.:
			if verbose:
				print "Fitness Mismatch: the loaded trajectory seems to be wrongly interpreted"
			continue

		# check for too early start dates induced by an old bug 
		if ind.x[0] < 7305.0:
			if verbose:
				print "Start epoch out of bounds!!"
			continue

		# check for excessive DV
		try:
			DV,DT = prob.compute_DV_DT(ind.x)
		except ValueError:
			print 'something went wrong with incipit ' + file_name
			continue

		for v,t in zip(DV,DT):
			if v > 0.1/2000 * 0.5 * DAY2SEC * t:
				if verbose:
					print "Excessive DV detected: low-thrustability endangered"			
				break
		else:	# this is executed if no break occured in the preceeding for-loop
			sol.append(ind)	# append only if we do not have to deal with super high DV

	#No solution has been found!!
	if len(sol) == 0:
		if verbose:
			print "No Feasible Solution In Input File!"
		return []
	
	return [(prob, ind.x) for ind in sol]

def trajectory_file_load(fpath, verbose=False):
	""" used to load a trajectory file dump from tree search module """
	# get trajectory
	try:
		best, x = load_trajectory( fpath )
	except:
		raise Exception('ERROR: could not load trajectory')

	# reconstruct a problem instance
	try:
		prob = mga_incipit( seq=[fb.moon for fb in best.traj]+[best.next_moon.moon], tof = [ [0,300] ]*(len(x)/4) )
	except:
		raise Exception('ERROR: could not instantiate problem')
	
	pop = population(prob)
	pop.push_back(x)
	
	return incipit_stats(pop.champion, fpath.split('/')[-1], 0, *lambertization(prob, x))

def trajectory_file_load_cut(fpath, n, verbose=False):
	""" used to load a trajectory file dump from tree search module, cutting it after leg number n """
	# get trajectory
	try:
		best, x = load_trajectory( fpath )
	except:
		raise Exception('ERROR: could not load trajectory')

	# reconstruct a problem instance
	try:
		nseq = [fb.moon for fb in best.traj]+[best.next_moon.moon]
		prob = mga_incipit( seq=nseq[:n], tof = [ [0,300] ]*(len(x[:(n*4)])/4) )
	except:
		raise Exception('ERROR: could not instantiate problem')
	
	pop = population(prob)
	pop.push_back(x[:(n*4)])
	
	return incipit_stats(pop.champion, fpath.split('/')[-1], 0, *lambertization(prob, x))
	
	
def incipit_file_load(fpath, verbose=False):
	""" used to load a incipit file from fast_incipits 
	
		@return a list of all feasible incipits found in that file
	"""
	filename = fpath.split('/')[-1]
	
	# rebuild problem from file name
	probdata = filename.lower().split('_')

	seq = [ eval(d) for d in probdata[:4] ]
	prob = mga_incipit( seq=seq, tof=[[0,300]]*len(seq) )

	# open up the pickle jar
	with open( fpath, 'rb' ) as f:
		l = cPickle.load( f )

	l.sort( key = lambda x : x.f[0] )

	#We look for good solutions in l
	sol = [] 
	for idx, ind in enumerate(l):
		# check for fitness mismatch
		if fitness_mismatch( prob, (ind.x,ind.f[0]), print_mismatch=False ) > 1.:
			if verbose:
				print "Fitness Mismatch: the loaded trajectory seems to be wrongly interpreted"
			continue

		# check for too early start dates induced by an old bug 
		if ind.x[0] < 7305.0:
			if verbose:
				print "Start epoch out of bounds!!"
			continue

		# check for excessive DV
		try:
			DV,DT = prob.compute_DV_DT(ind.x)
		except ValueError:
			print 'something went wrong with incipit ' + filename
			continue

		for v,t in zip(DV,DT):
			if v > 0.1/2000 * 0.5 * DAY2SEC * t:
				if verbose:
					print "Excessive DV detected: low-thrustability endangered"			
				#break
		else:	# this is executed if no break occured in the preceeding for-loop
			sol.append( (idx, ind) )	# append only if we do not have to deal with super high DV

	#No solution has been found!!
	if len(sol) == 0:
		if verbose:
			print "No Feasible Solution In Input File!"
		return []
	
	return [incipit_stats(ind, filename, t[0], *lambertization(prob, t[1].x)) for t in sol]


class stats:
	""" Statistics class to visualize some metrics about our trajectories.

	USAGE: st = stats('out/tree_results/15.0_4_GEEEC') 
	       st.plot_dv()
		   st.plot_t()
		   
	"""
	def __init__(self, fpath, palantir=True):
		"""
		Constructor of the statistics object. Used to reconstruct trajectory with all its data.
		
		@param fpath relative filepath to the saved trajectory
		"""
		
		if palantir:	# trajectory format from palantir-search
			with open( fpath, 'rb') as f:
				prob, x, ms = cPickle.load(f)
		else:
			# get trajectory
			try:
				best, x = load_trajectory( fpath )
			except:
				raise Exception('ERROR: could not load trajectory')

			# reconstruct a problem instance
			try:
				prob = mga_incipit( seq=[fb.moon for fb in best.traj]+[best.next_moon.moon], tof = [ [0,300] ]*(len(x)/4) )
			except:
				raise Exception('ERROR: could not instantiate problem')
		
		params = lambertization(prob, x)
		self.seq, self.common_mu, self.n_legs, self.initial, self.T, self.t_P, self.r_P, self.v_P, self.DV, self.close_d = lambertization(prob, x)
		if palantir:
			self.best = None
		else:
			self.best = best
		self.x = x
		self.prob = prob

		
	def plot_dv(self, cumulative=True):
		"""
		plots the consumption of DV against number of legs.
		"""
		fig = plt.figure()
		plt.xlabel('no. of legs')
		if cumulative:
			plt.plot(xrange(self.n_legs), [sum(self.DV[:i]) for i in range(self.n_legs)], 'r')
			plt.ylabel('DV used (cumulatative)')
		else:
			plt.plot(xrange(self.n_legs), self.DV, 'ro')
			plt.ylabel('DV used')

	def plot_close_d(self):
		"""
		plots the closest distance to Jupiter against number of legs.
		"""
		fig = plt.figure()
		plt.xlabel('no. of legs')
		plt.plot(xrange(self.n_legs), self.close_d, 'ro')
		plt.ylabel('Closest distance to Jupiter (in Jupiter radii)')
	

	def plot_t(self, cumulative=True):
		"""
		plots time of flights against number of legs.
		"""
		plt.figure()
		plt.xlabel('no. of legs')
		if cumulative:
			plt.plot(xrange(self.n_legs), [sum(self.T[:i]) for i in range(self.n_legs)], 'r')
			plt.ylabel('time used for transfer (cumulatative) in days')
		else:
			plt.plot(xrange(self.n_legs), self.T, 'ro')
			plt.ylabel('time used for transfer in days')
	
	def plot_nof_t(self, overlay=False):
		"""
		plots number of faces against tof
		"""
		if not overlay:
			plt.figure()
		plt.xlabel('tof')
		ms = moon_score(False)
		score_data = self.prob.get_score_data(self.x)
		seen_faces = [ 0 ]		# saves the number of seen faces
		ctr = 0
		for flyby in score_data[:-1]:
			if (ms.score_flyby(*flyby) != 0):
				ctr += 1
			seen_faces.append(ctr)
		
		if overlay:
			plt.plot([sum(self.T[:i]) for i in range(self.n_legs)], seen_faces,'ro')
		else:
			plt.plot([sum(self.T[:i]) for i in range(self.n_legs)], seen_faces,'bo')
		plt.ylabel('number of faces seen')

		
	
	def summary(self):
		""" Wrapper for the pretty print of trajectories. """
		pretty(self.best)
