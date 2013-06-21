// Initializes the namespaces for the project
// IMPORTANT: This file is the first to import into the project!

// namespace for computation and algorithms
var core = core || {
    pop: []
};

// namespace for the user interface
var gui = gui || {
        scene_elems:[],
        last_selected:null,
        mouse: { x: 0, y: 0, click_timer: 0, click_counter: 0 },
		beta_bounds: {upper: 6.283185307179586, lower: -6.283185307179586},
		rp_bounds: {upper: 5.0, lower: 0.0}
    };
    
// namespace for raw data (i.e. coordinates of curves, objects, etc.)
var rawdata = rawdata || {};

// namespace for testing functions - not included in the main project
var test = test || {};


// global constants
var MU_JUP = 126686534.92180e9; 	// gravitational parameter of Jupiter [m3/s2]
var R_JUP = 71492000.0;				// Jupiter radius [m]
var R_SAFE_JUP = 2 * R_JUP;			// the closest distance of the spacecraft to Jupiter at any point in time
var g = 9.80665;					// standard acceleration due to gravity [m/s2]
var DAY2SEC = 86400.0;				// day [s]
var YEAR2DAY = 365.25;				// Year [days]
var RAD2DEG = 180.0 / Math.PI;		// 
var DEG2RAD   = Math.PI / 180.0;	// 

var r_spacecraft_init = 1000 * R_JUP;		// initial radius of spacecraft from jupiter - 1000 Jupiter Radii [km]
var v_spacecraft_init = 3400.0;				// initial velocity of spacecraft [m/s]
var m_spacecraft_init = 2000;				// initial mass of spacecraft [kg]

var m_min = 1000;					// the minimum weight of the spacecraft [kg]

var max_mission_tof = 4 * YEAR2DAY;			// maximum mission duration (4 Years) [days]

var ref_epoch = 58849.0;				// beginning of launch window - 2020 [MJD]
var end_epoch = 62867.0;				// end of launch window - 1 January 2031 [MJD]
var final_epoch = end_epoch + max_mission_tof;	// end of the mission - 1 January 2035 [MJD]

var AU = 149597870660.0;			// 1 Astronomical Unit [km]

var ASTRO_MAX_ITER = 50;			// Maximum iterations for Propagate Lagrangian
var ASTRO_TOLERANCE = 1e-16;		// Maximum tolerance of error in calculations

var GENERATIONS = 60                // Number of generations we want to evolve every time the solver is started


var ARC_SCALE = 10000000;			// The scale for visualisation of trajectories and orbits
// global variables
var traj_view = true;
var face_select_phase = true;

// NOTE: other global variables and objects exists and are initialized at the bottom of core.js