#!/usr/bin/env ipython
# -*- coding: cp1252 -*-

import PyKEP as pk
import numpy as np
from collections import OrderedDict, namedtuple
from math import degrees, radians, pi, sqrt


"""
JUPITER + GALILEAN SATELLITES: KEPLERIAN ORBIT ELEMENTS & PHYSICAL CONSTANTS

This file follows as closely as possible the formats of the data structures
defined in the file "ast_ephem_gtoc5.py", which we used extensively in GTOC5.
That should make it easier to adapt code from there.
Changes (GTOC5 » GTOC6):
	[module] ast_ephem_gtoc5 » body_ephem_gtoc6
	[variables] aster » body; aster_names » body_names
	[field units/labels] 'Epoch (TDB)' » 'Epoch (MJD)'); 'a (AU)' » 'a (km)'

In addition to representing the orbital elements through a numpy array,
representations are also created based on named tuples, and on PyKEP planets.
See: http://docs.python.org/library/collections.html#collections.namedtuple
See: http://keptoolbox.sourceforge.net/documentation.html#PyKEP.planet


USAGE EXAMPLES ('body' matrix):
	
	# accessing a column of 'body' by name
	body[:,col['a (km)']]	
	
	# accessing a body's orbital elements, by name
	body[ row['callisto'] ]
	
	# accessing a body's specific orbital element, by name
	body[ row['callisto'], col['a (km)'] ]

USAGE EXAMPLES ('body_tuple' dictionary of named tuples):
	
	>>> body_tuple.keys()
	['jupiter', 'io', 'europa', 'ganymede', 'callisto']
	
	>>> body_tuple['io']
	orbital_elements(body='io', Epoch=58849.0, a=422029.68714001001, e=0.0043085246617730003, i=0.040115486869660003, Node=-79.640061742992003, w=37.991267683986997, M=286.85240405644998)
	
	>>> body_tuple['io'].Node
	-79.640061742992003

USAGE EXAMPLES ('body_obj' dictionary of PyKEP.planet objects):
	
	>>> degrees( body_obj['io'].orbital_elements[3] )
	-79.640061742992
	
	>>> body_obj['io'].eph( pk.epoch_from_string('2025-01-01 00:00:00.000') )
	((377861107.98154724, 186406866.4808699, 283715.7154025446),
	 (-7615.668664758434, 15593.895465832084, -3.281760584438344))	
	

-- Luís F. Simões, 2012-09-11
"""
# CHECK: the values were obtained by copy-paste from the PDF; this process isn't flawless,
#	sometimes wrong values appear upon pasting. I matched the pasted values copied from 2
#	different PDF readers, but someone should look more closely into the values to make sure
#	we aren't bringing stupid errors into the process just through this.
# CHECK: I'm loading the values into fields of type np.float64. Is there any significant accuracy loss?



# getting Jupiter's orbital parameters
_jupiter = pk.planet_ss('jupiter')
_jupiter_op = [ _jupiter.ref_epoch.mjd ] + list(_jupiter.orbital_elements)
_jupiter_op[1] /= 1000. # convert m -> km
for i in xrange(3,7):   # convert radians -> degrees
	_jupiter_op[i] = degrees( _jupiter_op[i] )
	


# Values from gtoc6_problem_stmt.pdf
# 	Table 4: Keplerian orbit elements of the Galilean Satellites at Epoch = 58849.0 MJD
# 	Table 5: Satellite physical constants
# 	Table 6: Other constants and conversions
body = np.array( [
	# UID   Epoch    a (km)             e                    i (deg)              Node (deg)          w (deg)             M (deg)           R (km)    mu (km^3/s^2)
	[  0. ] + _jupiter_op +                                                                                                               [ 71492.0,  126686534.92180  ],
	[  1.,  58849.,   422029.68714001,  4.308524661773E-03,  40.11548686966E-03,   -79.640061742992,    37.991267683987,  286.85240405645,   1826.5,       5959.916    ],
	[  2.,  58849.,   671224.23712681,  9.384699662601E-03,   0.46530284284480,   -132.15817268686,    -79.571640035051,  318.00776678240,   1561.0,       3202.739    ],
	[  3.,  58849.,  1070587.46923740,  1.953365822716E-03,   0.13543966756582,    -50.793372416917,   -42.876495018307,  220.59841030407,   2634.0,       9887.834    ],
	[  4.,  58849.,  1883136.61673050,  7.337063799028E-03,   0.25354332731555,     86.723916616548,  -160.76003434076,   321.07650614246,   2408.0,       7179.289    ],
	], dtype=np.float64 )
	

# Mapping from name of a body to number of row in which it is represented in the body matrix
row = OrderedDict( [
	( 'jupiter'  , 0 ),
	( 'io'       , 1 ),
	( 'europa'   , 2 ),
	( 'ganymede' , 3 ),
	( 'callisto' , 4 ),
	] )

# Mapping from name of a value to number of column in which it is represented in the body matrix
col = OrderedDict( [
	( 'Object UID'    , 0 ),
	( 'Epoch (MJD)'   , 1 ),	# epoch
	( 'a (km)'        , 2 ),	# semi major axis
	( 'e'             , 3 ),	# eccentricity
	( 'i (deg)'       , 4 ),	# inclination
	( 'Node (deg)'    , 5 ),	# longitude of the ascending node
	( 'w (deg)'       , 6 ),	# argument of periapsis
	( 'M (deg)'       , 7 ),	# mean anomaly at epoch
	( 'R (km)'        , 8 ),	# radius
	( 'mu (km^3/s^2)' , 9 ),	# gravitational parameter
	] )

body_names = OrderedDict( [
	( 0. , 'jupiter'  ),
	( 1. , 'io'       ),
	( 2. , 'europa'   ),
	( 3. , 'ganymede' ),
	( 4. , 'callisto' ),
	] )
	


# Defining NAMED TUPLES for accessing orbital elements by name
# >>> ['body'] + [ oe.split(' ')[0] for oe in col.keys()[1:] ]
# ['body', 'Epoch', 'a', 'e', 'i', 'Node', 'w', 'M', 'R', 'mu']
orbital_elements = namedtuple('orbital_elements', ['body'] + [ oe.split(' ')[0] for oe in col.keys()[1:] ] )

body_tuple = OrderedDict( [
	( _body_name, orbital_elements( _body_name, *body[_brow][1:] ) )
	for (_body_name,_brow) in row.iteritems()
	] )
	


def _period( self ):
	"""
	Return's the body's orbital period, in days.
	"""
	return 2 * pi * sqrt( self.orbital_elements[0]**3 / self.mu_central_body )
	# http://en.wikipedia.org/wiki/Orbital_period#Calculation

_planet = pk.planet
_planet.period = _period

# Instantiating PyKEP planet objects for each of the bodies (and making them indexable by body name)
# http://keptoolbox.sourceforge.net/documentation.html#PyKEP.planet
body_obj = OrderedDict( [
	( _b.body, _planet(
		# when
		# 	a PyKEP.epoch indicating the orbital elements epoch
		pk.epoch( _b.Epoch, pk.epoch.epoch_type.MJD ),
		
		# orbital_elements
		# 	a sequence of six containing a,e,i,W,w,M (SI units, i.e. meters and radiants)
		(	_b.a * 1000.,
			_b.e,
			radians( _b.i    ),
			radians( _b.Node ),
			radians( _b.w    ),
			radians( _b.M    ),
			),
		
		# mu_central_body
		# 	gravity parameter of the central body (SI units, i.e. m^2/s^3)
		pk.MU_SUN if _b.body == 'jupiter' else ( body_tuple['jupiter'].mu * 1000.**3 ),
		# pk.MU_SUN == 1.32712428e+20 m^2/s^3
		
		# mu_self
		# 	gravity parameter of the planet (SI units, i.e. m^2/s^3)
		_b.mu * 1000.**3,	 # converting units: km^3/s^2 --> m^3/s^2
		
		# radius
		# 	body radius (SI units, i.e. meters)
		_b.R * 1000.,
		
		# safe_radius
		# 	body distance safe for a spacecraft fly-by
		( (2. * _b.R) if _b.body == 'jupiter' else (_b.R + 50.) ) * 1000.,
		# "The spacecraft range to Jupiter cannot go below 2*R_J at any time"
		# "The flyby altitudes at the satellites (i.e. the range to the satellite centre at closest approach on the flyby minus the satellite radius) cannot be below 50 km"
		
		# name
		# 	body name
		_b.body,
		) )
	for _b in body_tuple.itervalues()
	] )
	

( jupiter, io, europa, ganymede, callisto ) = body_obj.values()



# http://en.wikipedia.org/wiki/Orbital_elements
body_label = {
#	'Object UID'    : ,
	
	# a specified point in time
#	'Epoch (MJD)'   : ,
	
	# measure of the radius of an orbit taken from the points of that same orbit's two most distant points
	# http://en.wikipedia.org/wiki/Semimajor_axis
	'a (km)'        : r'$a$: semi major axis (km)',
	
	# The orbital eccentricity of an astronomical body is the amount by which its orbit deviates from a perfect circle, where 0 is perfectly circular, and 1.0 is a parabola, and no longer a closed orbit.
	# http://en.wikipedia.org/wiki/Orbital_eccentricity
	'e'             : r'$e$: eccentricity',
	
	# vertical tilt of the ellipse with respect to the reference plane, measured at the ascending node (where the orbit passes upward through the reference plane)
	# http://en.wikipedia.org/wiki/Inclination
	'i (deg)'       : r'$i$: inclination (deg)',
	
	# angle from a reference direction, called the origin of longitude, to the direction of the ascending node, measured in a reference plane
	# http://en.wikipedia.org/wiki/Longitude_of_the_ascending_node
	'Node (deg)'    : r'$\Omega$: longitude of the ascending node (deg)',
	
	# angle between the orbit's periapsis (the point of closest approach to the central point) and the orbit's ascending node (the point where the body crosses the plane of reference from South to North)
	# http://en.wikipedia.org/wiki/Argument_of_periapsis
	'w (deg)'       : r'$\omega$: argument of periapsis (deg)',
	
	# position of the orbiting body along the ellipse at a specific time (the "epoch")
	# http://en.wikipedia.org/wiki/Mean_anomaly
	'M (deg)'       : r'$M_o$: mean anomaly at epoch (deg)',
	
	# the body's radius	
	'R (km)'        : r'$R$: radius (km)',
	
	# product of the gravitational constant G and the mass M of the body
	# http://en.wikipedia.org/wiki/Standard_gravitational_parameter
	'mu (km^3/s^2)' : r'$\mu$: gravitational parameter (km^3/s^2)',
	}
	


#--------------------------------------# Problem constants

# 	Table 6: Other constants and conversions
SECSINDAY  = 86400
DAYSINYEAR = 365.25


# "The maximum time of flight, defined as the time elapsed between the initial time and the time of the final satellite flyby, is 4 years." -- gtoc6_problem_stmt.pdf, Section 4
MAXTOF = 4. * DAYSINYEAR

# "The initial time on the trajectory must be between MJD 58849.0 and 62867.0 (which corresponds to the years 2020 to 2030, inclusive)." -- gtoc6_problem_stmt.pdf, Section 4
TRAJ_START_MIN, TRAJ_START_MAX = [ pk.epoch( d, pk.epoch.epoch_type.MJD ) for d in [58849.0,62867.0] ]
# >>> TRAJ_START_MIN, TRAJ_START_MAX
# (2020-Jan-01 00:00:00, 2031-Jan-01 00:00:00)

TRAJ_END_MAX = pk.epoch( TRAJ_START_MAX.mjd + MAXTOF, pk.epoch.epoch_type.MJD )
# >>> TRAJ_END_MAX
# 2035-Jan-01 00:00:00



#--------------------------------------#

if __name__ == "__main__":
	
	# checking loading of Jupiter's orbital parameters
	# >>> [ a-b for (a,b) in zip(body_obj['jupiter'].orbital_elements, _jupiter.orbital_elements) ]
	# [0.0, 0.0, 3.469446951953614e-18, 0.0, 0.0, 0.0]
	
	pass
	
