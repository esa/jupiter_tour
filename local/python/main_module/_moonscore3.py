#
# This module gives the scores of the Jupiter moons during fly-bys
# It uses an exact 3D mapping technique instead of the approximative 2D 
# projection of the original moonscore module.
#
# author: mmarcusx@gmail.com

import numpy as np
import math
import operator
from scipy.constants import golden
from gtoc6 import io, europa, ganymede, callisto
from PyKEP import epoch, fb_prop

### lookup tables ###
# Table 2 of the problem description. Vertexnumber -> cartesian coordinates in body-frame. 
v_dict = {	1: (-4.854101966249685, -1, 0), 2: (-4.854101966249685, 1, 0), 3: (-4.23606797749979, -2, -1.618033988749895), 4: (-4.23606797749979, -2, 1.618033988749895),
			5: (-4.23606797749979, 2, -1.618033988749895), 6: (-4.23606797749979, 2, 1.618033988749895), 7: (-3.618033988749895, -1, -3.23606797749979), 8: (-3.618033988749895, -1, 3.23606797749979),
			9: (-3.618033988749895, 1, -3.23606797749979), 10: (-3.618033988749895, 1, 3.23606797749979), 11: (-3.23606797749979, -3.618033988749895, -1), 12: (-3.23606797749979, -3.618033988749895, 1),
			13: (-3.23606797749979, 3.618033988749895, -1), 14: (-3.23606797749979, 3.618033988749895, 1), 15: (-2, -1.618033988749895, -4.23606797749979), 16: (-2, -1.618033988749895, 4.23606797749979),
			17: (-2, 1.618033988749895, -4.23606797749979), 18: (-2, 1.618033988749895, 4.23606797749979), 19: (-1.618033988749895, -4.23606797749979, -2), 20: (-1.618033988749895, -4.23606797749979, 2),
			21: (-1.618033988749895, 4.23606797749979, -2), 22: (-1.618033988749895, 4.23606797749979, 2), 23: (-1, -3.23606797749979, -3.618033988749895), 24: (-1, -3.23606797749979, 3.618033988749895),
			25: (-1, 0, -4.854101966249685), 26: (-1, 0, 4.854101966249685), 27: (-1, 3.23606797749979, -3.618033988749895), 28: (-1, 3.23606797749979, 3.618033988749895),
			29: (0, -4.854101966249685, -1), 30: (0, -4.854101966249685, 1), 31: (0, 4.854101966249685, -1), 32: (0, 4.854101966249685, 1),
			33: (1, -3.23606797749979, -3.618033988749895), 34: (1, -3.23606797749979, 3.618033988749895), 35: (1, 0, -4.854101966249685), 36: (1, 0, 4.854101966249685),
			37: (1, 3.23606797749979, -3.618033988749895), 38: (1, 3.23606797749979, 3.618033988749895), 39: (1.618033988749895, -4.23606797749979, -2), 40: (1.618033988749895, -4.23606797749979, 2),
			41: (1.618033988749895, 4.23606797749979, -2), 42: (1.618033988749895, 4.23606797749979, 2), 43: (2, -1.618033988749895, -4.23606797749979), 44: (2, -1.618033988749895, 4.23606797749979),
			45: (2, 1.618033988749895, -4.23606797749979), 46: (2, 1.618033988749895, 4.23606797749979), 47: (3.23606797749979, -3.618033988749895, -1), 48: (3.23606797749979, -3.618033988749895, 1),
			49: (3.23606797749979, 3.618033988749895, -1), 50: (3.23606797749979, 3.618033988749895, 1), 51: (3.618033988749895, -1, -3.23606797749979), 52: (3.618033988749895, -1, 3.23606797749979),
			53: (3.618033988749895, 1, -3.23606797749979), 54: (3.618033988749895, 1, 3.23606797749979), 55: (4.23606797749979, -2, -1.618033988749895), 56: (4.23606797749979, -2, 1.618033988749895),
			57: (4.23606797749979, 2, -1.618033988749895), 58: (4.23606797749979, 2, 1.618033988749895), 59: (4.854101966249685, -1, 0), 60: (4.854101966249685, 1, 0)	}

# Table 3 from the problem description. facenumber -> vertices belong to the face
f_dict = {	1: [59, 60, 58, 54, 52, 56],
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
			18: [36, 46, 38, 28, 18, 26],
			19: [26, 16, 24, 34, 44, 36],
			20: [20, 24, 34, 40, 30],
			21: [19, 11, 12, 20, 30, 29],
			22: [39, 29, 30, 40, 48, 47],
			23: [23, 19, 29, 39, 33],
			24: [25, 15, 23, 33, 43, 35],
			25: [35, 45, 37, 27, 17, 25],
			26: [37, 41, 31, 21, 27],
			27: [13, 14, 6, 2, 5],
			28: [14, 22, 28, 18, 10, 6],
			29: [48, 40, 34, 44, 52, 56],
			30: [47, 48, 56, 59, 55],
			31: [33, 39, 47, 55, 51, 43],
			32: [27, 21, 13, 5, 9, 17]	}

# each hexagon has 3 pentagons as direct neighbours
hex_pent_neighbours	= {	1: [2, 9, 30], 
					4: [3, 12, 27], 
					5: [6, 12, 27], 
					8: [7, 9, 30], 
					10: [2, 9, 17], 
					11: [3, 12, 20], 
					13: [6, 12, 23], 
					14: [7, 9, 26], 
					15: [9, 17, 26], 
					16: [17, 26, 27], 
					18: [2, 3, 17], 
					19: [2, 3, 20], 
					21: [12, 20, 23], 
					22: [20, 23, 30], 
					24: [6, 7, 23], 
					25: [6, 7, 26], 
					28: [3, 17, 27], 
					29: [2, 20, 30], 
					31: [7, 23, 30], 
					32: [6, 26, 27]	}

# each pentagon has 5 hexagons as direct neighbours
pent_hex_neighbours = { 	2: [1, 10, 18, 19, 29], 
							3: [4, 11, 18, 19, 28], 
							6: [32, 5, 13, 24, 25], 
							7: [8, 14, 24, 25, 31], 
							9: [1, 8, 10, 14, 15], 
							12: [4, 5, 11, 13, 21], 
							17: [10, 15, 16, 18, 28], 
							20: [11, 19, 21, 22, 29], 
							23: [13, 21, 22, 24, 31], 
							26: [32, 14, 15, 16, 25], 
							27: [32, 4, 5, 16, 28], 
							30: [1, 8, 22, 29, 31]	}
						
# vectors through each vertex of the original icosahedron before truncation (a_f)
ico_vertex = {	2: (12.23606797749979, 0.0, 19.798373876248846), 
				3: (-12.23606797749979, 0.0, 19.798373876248846), 
				6: (-12.23606797749979, 0.0, -19.798373876248846), 
				7: (12.23606797749979, 0.0, -19.798373876248846), 
				9: (19.798373876248846, 12.23606797749979, 0.0), 
				12: (-19.798373876248846, -12.23606797749979, 0.0), 
				17: (0.0, 19.798373876248846, 12.23606797749979), 
				20: (0.0, -19.798373876248846, 12.23606797749979), 
				23: (0.0, -19.798373876248842, -12.23606797749979), 
				26: (0.0, 19.798373876248842, -12.23606797749979), 
				27: (-19.798373876248846, 12.23606797749979, 0.0), 
				30: (19.798373876248846, -12.23606797749979, 0.0)	}

# normal vector through each of the triangular faces of the original icosahedron (c_h)
tri_faces = {	1: (51.83281572999748, 0.0, 19.798373876248846), 4: (-51.83281572999748, 0.0, 19.798373876248846), 5: (-51.83281572999748, 0.0, -19.798373876248846), 
				8: (51.83281572999748, 0.0, -19.798373876248846), 10: (32.03444185374863, 32.03444185374863, 32.03444185374863), 11: (-32.03444185374863, -32.03444185374863, 32.03444185374863), 
				13: (-32.03444185374863, -32.03444185374863, -32.03444185374863), 14: (32.03444185374863, 32.03444185374863, -32.03444185374863), 15: (19.798373876248846, 51.83281572999748, 0.0), 
				16: (-19.798373876248846, 51.83281572999748, 0.0), 18: (0.0, 19.798373876248846, 51.83281572999748), 19: (0.0, -19.798373876248846, 51.83281572999748), 
				21: (-19.798373876248846, -51.83281572999748, 0.0), 22: (19.798373876248846, -51.83281572999748, 0.0), 24: (0.0, -19.798373876248842, -51.83281572999748), 
				25: (0.0, 19.798373876248842, -51.83281572999748), 28: (-32.03444185374863, 32.03444185374863, 32.03444185374863), 
				29: (32.03444185374863, -32.03444185374863, 32.03444185374863), 31: (32.03444185374863, -32.03444185374863, -32.03444185374863), 
				32: (-32.03444185374863, 32.03444185374863, -32.03444185374863) }

### classes ###
class moon_score:
	""" This class encapsulates the scoring mechanism for our flybys. The database of the current face value
	(which can change due to scans during flybys) can be accessed via the moon_dict[planet.name][facenumber]. The
	total score of all flybys so far is accumulated in jscore. For each flyby, there is an entry added to the
	history (hist), which contains epoch, flyby-parameter, planet and score. To just get the score of a
	face call the method get_score_of_flyby. If you want to perform a scan (and thus setting the value of the face to
	zero) call the method score_flyby. For each trajectory, you have to instantiate a new object to keep track
	of your score. If you want to see screen output of the scorer, you can instantiate the object with
	the parameter verbose=True. If you do not need to store a history, you can use track_history=False (this
	will make unscoring faces impossible)."""
	def __init__(self, verbose=False, track_history=True):
	
		# list of facevalues according to the problem description
		io_list =       [0, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 2, 2, 2, 2, 2, 2]
		europa_list =   [0, 2, 2, 2, 2, 2, 2, 2, 2, 4, 4, 4, 4, 4, 4, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 4, 4, 4, 4, 4, 4]
		ganymede_list = [0, 3, 3, 3, 3, 3, 3, 3, 3, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2]
		callisto_list = [0, 3, 3, 3, 3, 3, 3, 3, 3, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2]

		# this contains all the moons with their remaining scores
		self.moon_dict = {
			io.name       : io_list,
			europa.name   : europa_list,
			ganymede.name : ganymede_list,
			callisto.name : callisto_list
		}
			
		# history
		self.hist = []

		# current score
		self.jscore = 0.0

		# Used for printing out information
		self.verbose = verbose

		# Used for tracking fly-bys and scores
		self.track_history = track_history


	def unscore(self):
		""" Uses the history of the scoring object to undo the last scoring. Last entry in history will be deleted as well.
		
			@return gives back the value which was unscored or -1 if unscoring was not possible."""
		# Sanity checks
		if not self.track_history:
			print 'Unscoring not possible: mscore-object was instantiated with track_history=False!'
			return -1

		if len(self.hist)==0:
			print 'Unscoring not possible: we just have to score before we can unscore!'
			return -1
	
		# extract info from history
		planet = self.hist[-1][1]
		facenumber = self.hist[-1][6]
		score = self.hist[-1][5]

		if self.verbose:
			print 'undo last scoring on ' + planet.name + ': ' + str(self.jscore) + ' - ' + str(score) + ' = ' + str(self.jscore - score)
		
		# restore score in database
		self.moon_dict[planet.name][facenumber] = score

		# reduce jscore
		self.jscore -= score

		# remove from history
		self.hist.pop()

		return score


	def get_face_of_flyby(self, ep, planet, vinf_in, rp, beta):
		""" returns only the face-id of a fly-by and DOES NOT change the object.
		
		USAGE: get_face_of_flyby(63000, gtoc6.io, (0,0,10000), gtoc6.io.radius + 400000, 0)

		@param ep epoch of fly-by
		@param planet the jupiter moon, i.e. gtoc6.io
		@param vinf_in relative entry velocity
		@param rp fly-by radius
		@param beta fly-by-plane orientation
		@return a list of face ids which are hit by the fly-by """
		
		coord = get_coordinates(ep, planet, vinf_in, rp, beta)
		print coord
		print cart2flat(coord)
		faces = get_facenumber(coord)
		score = [ self.moon_dict[planet.name][face] for face in faces ]
		
		# logging information
		if self.verbose:
			output = 'Fly-by at ' + planet.name + ' at epoch ' + str(ep) + ' scans face(s) ' + str(faces) 
			output += ' and scores: ' + str(max(score))
			print output

		return faces


	def get_score_of_flyby(self, ep, planet, vinf_in, rp, beta):
		""" returns only the score of a fly-by and DOES NOT change the object.
		
		USAGE: get_score_of_flyby(63000, gtoc6.io, (0,0,10000), gtoc6.io.radius + 400000, 0)

		@param ep epoch of fly-by
		@param planet the jupiter moon, i.e. gtoc6.io
		@param vinf_in relative entry velocity
		@param rp fly-by radius
		@param beta fly-by-plane orientation
		@return score of the fly-by """
		
		coord = get_coordinates(ep, planet, vinf_in, rp, beta)
		faces = get_facenumber(coord)
		score = [ self.moon_dict[planet.name][face] for face in faces ]
		
		# logging information
		if self.verbose:
			output = 'Fly-by at ' + planet.name + ' at epoch ' + str(ep) + ' scans face(s) ' + str(faces) 
			output += ' and scores: ' + str(max(score))
			print output

		return max(score)   # tie-breaking: we take the highest score


	def facevalues(self, planet, l):
		""" returns a list containing the facevalues of the faces given by a planet and a list. This is useful
		in combination with gt6.feasible_faces(), for example to get the maximum or average possible score
		for the next flyby on a moon.

		USAGE: facevalues('callisto', [1,4,9,16,25])

		@param planet string containing the name of the jupiter moon, i.e. 'europa'
		@param l a list containing the facenumbers
		@return a list containing the facevalues
		"""
		return [self.moon_dict[planet][x] for x in l]

	def get_mapped_faces(self, planet):
		""" returns a list of the facenumbers of the already mapped faces of a given moon.

		USAGE: ganyfaces = get_mapped_faces('ganymede')

		@param planet string containing the name of the jupiter moon, i.e. 'europa'
		@return a list containing the facenumbers of the already mapped faces
		"""
		retval = []
		for idx, val in enumerate(self.moon_dict[planet]):
			if val == 0 and idx != 0:
				retval.append(idx)
		return retval


	def score_moon(self, planet, facenumber):
		""" returns the score of a fly-by, sets the facevalue to zero and raises the global J-Score.
		The history of the scoringobject will NOT be updated with a fly-by, however the database scoring the
		values of the faces. Thus, succeeding evaluations on this face will return zero to indicate that it 
		was already visited.

		If you just want to know the value of the face without scoring it, call the dictionary
		of the scoringobject directly (i.e.: ms.moon_dict['io'][12])

		USAGE: score_moon(gtoc6.io, 12)

		@param planet the jupiter moon, i.e. gtoc6.io
		@param facenumber the number of the face you want to score
		@return score of the face
		"""

		# sanity check
		if not 1 <= facenumber <= 32:
			print 'Your facenumber must be between 1 and 32!'
			raise ValueError

		score = self.moon_dict[planet.name][facenumber]

		# raise overall scoring
		self.jscore += score

		# mark scanned face as tabu
		self.moon_dict[planet.name][facenumber] = 0

		# logging information
		if self.verbose:
			output = 'Fly-by at ' + planet.name + ' with face ' + str(facenumber) 
			output += ' scores: ' + str(score) + '\n' + 'Overall score: ' + str(self.jscore)
			print output

		return score
		

	def score_flyby(self, ep, planet, vinf_in, rp, beta):
		""" returns the score of a fly-by, sets the facevalue to zero, raises the global J-Score and 
		updates the history. Succeeding evaluations on this face will return zero to indicate that it 
		was already visited.

		USAGE: score_flyby(63000, gtoc6.io, (0,0,10000), gtoc6.io.radius + 400000, 0)

		@param ep epoch of fly-by
		@param planet the jupiter moon, i.e. gtoc6.io
		@param vinf_in relative entry velocity
		@param rp fly-by radius
		@param beta fly-by-plane orientation
		@return score of the fly-by """

		coord = get_coordinates(ep, planet, vinf_in, rp, beta)
		faces = get_facenumber(coord)
		score = [ self.moon_dict[planet.name][face] for face in faces ]
		
		finalscore = max(score)     # tie-breaking: we take the highest score

		# raise overall scoring
		idx = score.index(finalscore)
		self.jscore += finalscore

		# mark scanned face as tabu
		self.moon_dict[planet.name][faces[idx]] = 0

		# add flyby to history, if we track history
		if self.track_history:
			self.hist += [(ep, planet, vinf_in, rp, beta, finalscore, faces[idx])]

		# logging information
		if self.verbose:
			output = 'Fly-by at ' + planet.name + ' at epoch ' + str(ep) + ' scans face(s) ' + str(faces) 
			output += ' and scores: ' + str(max(score)) + '\n' + 'Overall score: ' + str(self.jscore)
			print output

		return finalscore
		
		
	def score_flyby_sequence(self, s):
		""" return the score of a fly-by-sequence, taking into account already scaned faces. 

		@param s list of tuples where each tuple contains (epoch, planet, vinf_in, rp, beta)
		"""
		
		for flyby in s[:-1]:	#ignoring the incomplete flyby in the end
			self.score_flyby(*flyby)
		return self.jscore
		
	
	def show_flyby(self, n):
		""" Shows you what happens at the n'th flyby of the history. Plots the facemap of 
		the planet with the remaining values, the flyby-point and the band of possible
		flybys. 
		
		@param n the number of the leg (start counting with 1!)
		"""
		import matplotlib.pyplot as plt
		
		if n == 0:
			print 'leg enumeration starts with 1 - there is no leg 0!'
			return

		
		if not self.track_history:
			print 'Showing flyby not possible: mscore-object was instantiated with track_history=False!'
			return -1
		#	self.hist += [(ep, planet, vinf_in, rp, beta, finalscore, faces[idx])]
		event = self.hist[n-1]
		
		# reconstruct score
		if event[1].name == 'io':
			tempscore = [0, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 2, 2, 2, 2, 2, 2]
		elif event[1].name == 'europa':
			tempscore = [0, 2, 2, 2, 2, 2, 2, 2, 2, 4, 4, 4, 4, 4, 4, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 4, 4, 4, 4, 4, 4]  
		else:
			tempscore = [0, 3, 3, 3, 3, 3, 3, 3, 3, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2]
  
		# set already scored faces on that particular moon back to zero
		for sc_event in self.hist[:n-1]:
			if sc_event[1].name == event[1].name:
				tempscore[sc_event[6]] = 0

		# print some infos for the flyby
		print 'vinf_in: ' + str(event[2])
		print 'rp: ' + str(event[3])
		print 'beta: ' + str(event[4])

		# plot facemap, band and target
		plot_facemap(tempscore)
		plot_band(*event[:3])
		x, y =  cart2flat(get_coordinates(*event[:5]))
		plt.plot(x,y,'rx')
		plt.title('flyby no ' + str(n) + ' on ' + event[1].name)


	def tell_history(self):
		""" Gives you a nice representation of the history of your scoring.
		
		USAGE: ms.tell_history() """
		if not self.track_history:
			print 'Telling history not possible: mscore-object was instantiated with track_history=False!'
			return -1
		
		hist = self.hist
		# extract information
		moons = ''
		scores = ''
		empty = 0
		set_dict = {'io': set(),'europa': set(),'ganymede': set(),'callisto': set() }
		for event in hist:
				moons += event[1].name[0].upper()
				scores += str(event[5]).replace('0',' ')
				if event[5] == 0:
					empty += 1
				set_dict[event[1].name].add(event[6])
					
		print 'moons: <' + moons + '>'
		print 'score: <' + scores + '>'
		print 'no. of flybys: ' + str(len(hist))
		print 'empty flybys: ' + str(empty)
		print 'different faces seen: ' + str(sum([len(y) for y in set_dict.values()]))
		print 'mapped faces on Io      : ' + str(sorted(list(set_dict['io'])))
		print 'mapped faces on Europa  : ' + str(sorted(list(set_dict['europa'])))
		print 'mapped faces on Ganymede: ' + str(sorted(list(set_dict['ganymede'])))
		print 'mapped faces on Callisto: ' + str(sorted(list(set_dict['callisto'])))
		print 'overall score: ' + str(self.jscore)


	def plot_face_targeting(self, moonname, leglabel=True):
		""" Plots the longitude/latitude plot of the moonsurface with its corresponding polygon faces
		and the their current values. Coordinates of the previous flybys are also displayed together
		with the number of the leg in which they occured.
	
		@param moonname name of the moon, i.e. 'europa'
		@param leglabel set to False if you do not want the number of the leg printed
	
		USAGE: ms.plot_face_targeting('europa')
		"""
		import matplotlib.pyplot as plt
		
		if not self.track_history:
			print 'Plotting not possible: mscore-object was instantiated with track_history=False!'
			return -1
		
		# plot map of the moon + current values
		plot_facemap(self.moon_dict[moonname])

		# reconstruct flyby coordinates from history
		for idx, event in enumerate(self.hist):
			if event[1].name == moonname:
				x, y =  cart2flat(get_coordinates(*event[:5]))
				plt.plot(x,y,'rx')
				if leglabel:
					plt.text(x-0.5,y+0.5,str(idx+1))	# +1 offset as we do not count the 0.th leg
				plt.title('flybys on ' + moonname)


### functions ###

def plot_band(ep, moon, vinf_in):
	""" Plots the band of feasible faces given a moon and vinf_in.

	@param ep current epoch
	@param moon gt6.io, gt6.europa, gt6.callisto or gt6.ganymede
	@param vinf_in list of entering velocity x,y,z

	USAGE: sd = prob.get_score_data(x)
	       ms.plot_band(*sd[3][:2])
	"""
	import matplotlib.pyplot as plt
		
	coors1 = [ cart2flat(get_coordinates(ep, moon, vinf_in, 50000, beta)) for beta in np.linspace(0, 2*np.pi, num = 200) ]
	coors2 = [ cart2flat(get_coordinates(ep, moon, vinf_in, 20000000, beta)) for beta in np.linspace(0, 2*np.pi, num = 800) ]

	for coors, symb in [ (coors1, 'r-'), (coors2, 'k-') ]:
		for idx, p in enumerate(coors[:-1]):
			if np.sign(coors[idx][0]) == np.sign(coors[idx+1][0]):
				#no wrap over happens					
				plt.plot((p[0], coors[idx+1][0]), (p[1], coors[idx+1][1]), symb)
			else:
				if max(coors[idx][0], coors[idx+1][0]) < 5:
					#line crosses 0-meridian and does not wrap over. Thus, it can be ploted
					plt.plot((p[0], coors[idx+1][0]), (p[1], coors[idx+1][1]), symb)
				else:
					pass


def plot_facemap(facelabels):
	""" Plots the longitude/latitude plot of the moon-surface with its corresponding polygon faces
	
	@param facelabels is a list containing the labels for the 32 faces. 
	NOTE: this list has an offest of +1, thus in facelabels[1] we have the label for face number 1.
	
	USAGE: mscore.facelabels(range(33))
	"""
	import matplotlib.pyplot as plt
		
	plt.figure()
	
	# plot border
	plt.plot([-180,180,180,-180,-180], [-90,-90,90,90,-90], 'b-')

	# plot small line-ends on the 0-meridian
	plt.plot([0,0], [cart2flat(v_dict[36])[1],90], 'b-')
	plt.plot([0,0], [cart2flat(v_dict[35])[1],-90], 'b-')

	# plot the soccer-grid
	for idx, vertices in f_dict.iteritems():
		xcoords = [v_dict[y][0] for y in vertices ] 
		ycoords = [v_dict[y][1] for y in vertices ]
		zcoords = [v_dict[y][2] for y in vertices ]
		
		if idx not in [19,18,24,25]:	# close polygon
			xcoords += [v_dict[vertices[0]][0]]
			ycoords += [v_dict[vertices[0]][1]] 
			zcoords += [v_dict[vertices[0]][2]]
	
		# labeling of the faces, manually for facenumber 3,4,5,6:
		if idx == 3:
			plt.text(168, 59, ' ' if str(facelabels[idx]) == '0' else str(facelabels[idx]), color='darkgreen')
			plt.text(-173, 59, ' ' if str(facelabels[idx]) == '0' else str(facelabels[idx]), color='darkgreen')
		elif idx == 4:
			plt.text(168, 22, ' ' if str(facelabels[idx]) == '0' else str(facelabels[idx]), color='darkgreen')
			plt.text(-173, 22, ' ' if str(facelabels[idx]) == '0' else str(facelabels[idx]), color='darkgreen')
		elif idx == 5:
			plt.text(168, -22, ' ' if str(facelabels[idx]) == '0' else str(facelabels[idx]), color='darkgreen')
			plt.text(-173, -22, ' ' if str(facelabels[idx]) == '0' else str(facelabels[idx]), color='darkgreen')
		elif idx == 6:
			plt.text(168, -59, ' ' if str(facelabels[idx]) == '0' else str(facelabels[idx]), color='darkgreen')
			plt.text(-173, -59, ' ' if str(facelabels[idx]) == '0' else str(facelabels[idx]), color='darkgreen')
		else:
			cog = cart2flat(map(np.average, (xcoords, ycoords, zcoords)))
			plt.text(cog[0], cog[1], ' ' if str(facelabels[idx]) == '0' else str(facelabels[idx]), color='darkgreen')
	
		# divide each edge into line segments
		for k in xrange(len(xcoords) - 1):
			xsp = np.linspace(xcoords[k], xcoords[k+1], 20)
			ysp = np.linspace(ycoords[k], ycoords[k+1], 20)
			zsp = np.linspace(zcoords[k], zcoords[k+1], 20)

			# project line segments to draw the bended edge correctly
			flatpoints = [cart2flat( (x,y,z) ) for x,y,z in zip(xsp, ysp, zsp)]

			# compensate for wrap-over at 180 longitude			
			for j, p in enumerate(flatpoints[:-1]):
				if np.sign(flatpoints[j][0]) == np.sign(flatpoints[j+1][0]):
					#no wrap over happens					
					plt.plot((p[0], flatpoints[j+1][0]), (p[1], flatpoints[j+1][1]), 'b-')
				else:
					if max(flatpoints[j][0], flatpoints[j+1][0]) < 10:
						#line crosses 0-meridian and does not wrap over. Thus, it can be ploted
						plt.plot((p[0], flatpoints[j+1][0]), (p[1], flatpoints[j+1][1]), 'b-')
					else:
						#line wraps over from -180 to 180 and thus has to be changed
						plt.plot((p[0], -1 * flatpoints[j+1][0]), (p[1], flatpoints[j+1][1]), 'b-')
						plt.plot((-1 * p[0], flatpoints[j+1][0]), (p[1], flatpoints[j+1][1]), 'b-')

	plt.xlabel('longitude')
	plt.ylabel('latitude')


def cart2flat(b):
	""" converts cartesian coordinates b1,b2,b3 into Longitude, Latitude coordinates

		USAGE: cart2flat( (-5,-1,0) )
        
		@param b 3-tuple consisting of cartesian coordinates
		@return 2-tuple consisting of Longitude, Latitude in degrees"""
	longitude, latitude = math.atan2(b[1],b[0]), math.atan(b[2] / math.sqrt(b[0]**2 + b[1]**2))
	return (math.degrees(longitude), math.degrees(latitude))

	
def get_facenumber(p):
	""" Returns the faces given a point p in the bodyframe. If p belongs to a 
		line or a vertex, each face which has this vertex or line is returned.
		This method uses a projection of the p vector onto one of the 12
		triangular faces of the non-truncated icosahedron. Afterwards, it
		decides on which face p lies after the truncation.

		USAGE: get_facenumber( (-1, 0, 4.854101966249685) )

		@param p 3-tuple of a point p in bodyframe coordinates
		@return list the number of the faces p belongs to """
		
	# find the nearest vertex of the original icosahedron which is closest to p:
	f = max([(np.dot(p, val), k) for k, val in ico_vertex.iteritems()])[1]
	

	# find the triangular face of the original icosahedron on which p is
	h = [(np.dot(p, tri_faces[idx]), idx) for idx in pent_hex_neighbours[f]]
	h.sort(reverse=True)

	# get the vertices of the triangular face
	n = hex_pent_neighbours[h[0][1]]
	
	try:
		r = np.dot(ico_vertex[n[0]], ico_vertex[n[1]]) / np.dot(ico_vertex[n[0]], ico_vertex[n[0]])
	except ZeroDivisionError:	
		print "ERROR: Divison by zero in computing target face!"
		return []
	
	lh = (2 + r) * sum([np.dot(ico_vertex[n[i]], p) for i in xrange(3)])
	rh = (3 + 6*r) * (np.dot(ico_vertex[f], p))
	
	if lh < rh:	# p lies on face pentagon f
		return [f]
	elif lh == rh:
		if h[0][0] == h[1][0]:	# p lies on a vertex
			return [h[0][1], h[1][1], f]
		else:
			return [h[0][1], f] # p lies on an edge between pentagon and hexagon
	else:
		if h[0][0] == h[1][0]:
			return [h[0][1], h[1][1]] # p lies on edge between 2 hexagons
		else:
			return [h[0][1]] # p lies on a hexagon
		

def get_coordinates(ep, planet, vinf_in, rp, beta):
	""" Computes the intersection between the vector of the spacecraft to the surface of the moon.

		USAGE: ms.get_coordinates(62500, gtoc6.europa, (0,0,10000), gtoc6.europa.radius + 10000, 0.3)

		@param ep epoch of fly-by
		@param planet the jupiter moon, i.e. gtoc6.io
		@param vinf_in relative entry velocity
		@param rp fly-by radius
		@param beta fly-by-plane orientation
		@return 3-tuple of cartesian coordinates of the periapsis vector in the body fixed reference frame"""
        
	# getting coordinates and speed of the moon
	eph = planet.eph(epoch(ep,epoch.epoch_type.MJD))
	print eph

	# compute outgoing velocity
	v_in_abs = tuple(map(operator.add, vinf_in, eph[1]))
	print v_in_abs
	v_out_abs = fb_prop(v_in_abs, eph[1], rp, beta, planet.mu_self)
	print v_out_abs
	v_diff = np.array(tuple(map(operator.sub, v_in_abs, v_out_abs)))

	# constraint check
	vinf_out = tuple(map(operator.sub, v_out_abs, eph[1]))
	
	if np.linalg.norm(vinf_in) - np.linalg.norm(vinf_out) > 1.0:
		print 'WARNING: Constraint violation! Difference between vinf_in and vinf_out is larger than 1!'

	# compute periapsis vector
	peri = rp * v_diff / np.linalg.norm(v_diff)

	# body-fixed coordinate frame
	x, v = np.array(eph[0]), np.array(eph[1])
	bhat1 = x * -1.0 / np.linalg.norm(x)
	bhat3 = np.cross(x, v) / np.linalg.norm(np.cross(x,v))
	bhat2 = np.cross(bhat3, bhat1)
    
	# use dot product to get coordinates of periapsis vector in the body-fixed reference frame
	peri_hat = np.array( (np.dot(peri, bhat1), np.dot(peri, bhat2), np.dot(peri, bhat3)) )

	# vector is now normalized to the sphere which has the soccer ball inside.
	# radius of this sphere is given by problem description as sqrt(9 * golden + 10)
	return tuple((peri_hat / np.linalg.norm(peri_hat)) * np.sqrt(9 * golden + 10))
