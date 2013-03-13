var moon = function(name, a, e, i, LAN, w, M, radius, mu, model){

	this.uid = jupMoons.length;
	this.name = name;
	this.epoch = 58849.0;	// MJD [day]
	this.a = a;				// [m]
	this.e = e;				// []
	this.i = i;				// [deg]
	this.LAN = LAN;			// [deg]
	this.w = w;				// [deg]
	this.M = M;				// [deg]
	this.radius = radius;	// [m]
	this.safeRadius = radius + (50.0*1000.0);	// [m]
	this.mu = mu;			// [m^3/s^2]
	this.feasibles = {faces: [], beta: [], rp: []};
	this.selected = new Array(32);
	this.locked = new Array(32);
	this.model = model;
}