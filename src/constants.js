// constant values

var MU_JUP = 126686534.92180e9; 		// gravitational parameter of Jupiter [m3/s2]
var R_JUP = 71492000.0;				// Jupiter radius [m]
var R_SAFE_JUP = 2 * R_JUP;			// the closest distance of the spacecraft to Jupiter at any point in time
var g = 9.80665;					// standard acceleration due to gravity [m/s2]
var DAY2SEC = 86400;				// day [s]
var YEAR2DAY = 365.25;				// Year [days]
var RAD2DEG = 180 / Math.PI;		// 
var DEG2RAD   = Math.PI / 180.0;	// 

var r_spacecraft_init = 1000 * R_JUP;		// initial radius of spacecraft from jupiter
var v_spacecraft_init = 3400.0;				// initial velocity of spacecraft [m/s]
var m_spacecraft_init = 2000;				// initial mass of spacecraft [kg]

var m_min = 1000;					// the minimum weight of the spacecraft [kg]

var max_tof = 4 * YEAR2DAY;			// maximum mission duration (4 Years)

var ref_epoch = 58849.0;				// beginning of launch window - 2020 [MJD]
var end_epoch = 62867.0;				// end of launch window - 1 January 2031 [MJD]
var final_epoch = end_epoch + max_tof;	// end of the mission - 1 January 2035 [MJD]

var AU = 149597870660.0;			// 1 Astronomical Unit [km]

var ASTRO_MAX_ITER = 50;			// Maximum iterations for Propagate Lagrangian
var ASTRO_TOLERANCE = 1e-16;		// Maximum tolerance of error in calculations