var MAX_ITER = 50;
var ACCURACY = 1e-9;


function lambertProblem(r1, r2, tof, cw)
{

    // 1 - Computing non dimensional units
    // var R = magnitude(r1);
    // var V = Math.sqrt(MU_JUP / R);
    // var T = R / V; 
	
	// console.log("R: " + R);
	// console.log("V: " + V);
	// console.log("T: " + T);
	
    // 2 - Computing geometry of transfer
    // var R2 = magnitude(r2);
    // var costheta = dot(r1, r2) / (R*R2);
	
	// console.log("R2: " + R2);
	// console.log("COS THETA: " + costheta);
	
    // var r2_mod = R2 / R;
	
	// console.log("R2_MOD: " + r2_mod);
	
    // var c = Math.sqrt(1 + r2_mod * (r2_mod - 2.0 * costheta));
    // var s = (1 + r2_mod + c) / 2.0;
	
	// console.log("c: " + c);
	// console.log("s: " + s);
	
    // 2a - long or short way?
    var lw = ((r1[0]*r2[1] - r1[1]*r2[0]) > 0) ? 0 : 1;	// prograde motion assumed
    if (cw) lw = (lw + 1) % 2;				        // changed to retrograde motion
	
	console.log("\nLP lw: " + lw);
	
    // 4 - get solution
	var sol = lambert3d(r1, r2, tof, lw);
	
    return sol;
}


function lambert3d(r1, r2, tof, lw)
{
    // 1 - Computing non dimensional units
    var R = magnitude(r1);
    var V = Math.sqrt(MU_JUP / R);
    var T = R / V;

    // 2 - Computing geometry of transfer
    var R2 = magnitude(r2);
    var costheta = dot(r1, r2) / (R*R2);

    var r2_mod = R2 / R;
    var c = Math.sqrt(1 + r2_mod * (r2_mod - 2.0 * costheta));
    var s = (1 + r2_mod + c) / 2.0;

    // 3 - Solving the problem in 2D
    var out = lambert2d(s, c, tof/T, lw);
	
	console.log("\nLAMBERT 2D: ")
	console.log(out);
	
    // 4 - Reconstructing the velocity vectors in three dimensions
    var ir1 = normalise(r1);
    var ir2 = normalise(r2);
	
    // here is the singularity: as when ir1||ir2 this plane is not defined!!
    var ih = (lw ? cross(ir2, ir1) : cross(ir1, ir2));
    if ((ih.x + ih.y + ih.z) == 0) {
        alert("lambert is singular in 3D as transfer angle is 180*n degrees");
    }
	
    ih = normalise(ih);
	
    var it1 = cross(ir1, ih);
    var it2 = cross(ir2, ih);
	
    var v1 = [0, 0, 0];
    var v2 = [0, 0, 0];
	
    for (var i in v1) v1[i] = (out.vr1*ir1[i]) - (out.vt1*it1[i]);
    for (var i in v2) v2[i] = (out.vr2*ir2[i]) - (out.vt2*it2[i]);
	
    // 5 - Putting back dimensions
    for (var i in v1) v1[i] *= V;
    for (var i in v2) v2[i] *= V;
	
    return {converged : out.converged, v1 : v1, v2 : v2};
}


function lambert2d(s, c, tof, lw)
{
    var out;
	
    // 0 - Some geometry
    var am = s/2.0;					                        // semi-major axis of the minimum energy ellipse
    var r2 = 2 * s - c - 1;				                    // r2 in r1 units

    // transfer angle
    var theta = Math.acos((1 - c * c) / r2/2 + r2/2);
    theta = (lw ? (2*Math.PI)-theta : theta);
	
    // Lagrange used this to simplify the maths ?
    var lambda = Math.sqrt(r2) * Math.cos(theta/2.0) / s;

	
    // 1 - We solve the tof equation
    var x, ia, ib;
    // no multiple revolutions
    ia = Math.log(1 - 0.5);
    ib = Math.log(1 + 0.5);
    out = regulaFalsi(ia, ib, new tofCurve(s, c, tof, lw),
    MAX_ITER, ACCURACY);
    x = Math.exp(out.ia) - 1;


    // 3 - Using the Battin variable we recover all our outputs
    var a = am/(1 - x*x);
	
    var beta, alfa, eta2, eta, psi;
    if (x < 1) {	// ellipse
        beta = 2 * Math.asin(Math.sqrt((s - c) / (2 * a)));
        if (lw) beta = -beta;
        alfa = 2 * Math.acos(x);
        psi = (alfa-beta)/2;
        eta2 = 2 * a * Math.pow(Math.sin(psi), 2)/s;
        eta = Math.sqrt(eta2);
    } else {		// hyperbola
        beta = 2 * Math.asinh(Math.sqrt((c - s) / (2 * a)));
        if (lw) beta = -beta;
        alfa = 2 * Math.acosh(x);
        psi = (alfa - beta) / 2;
        eta2 = -2 * a * Math.pow(Math.sinh(psi), 2)/s;
        eta = Math.sqrt(eta2);
    }
	
    var p = (r2 / (am*eta2)) * Math.pow(Math.sin(theta/2), 2);
    var sigma1 = (1 / (eta*Math.sqrt(am))) * (2*lambda*am - (lambda + x*eta));

    var vr1 = sigma1;
    var vt1 = Math.sqrt(p);
    var vt2 = vt1 / r2;
    var vr2 = -vr1 + (vt1 - vt2) / Math.tan(theta/2);

    if (out.retval == MAX_ITER) {
        converged = false;
    } else {
        converged = true;
    }

    return {converged: converged, vr1: vr1, vr2: vr2, vt1: vt1, vt2: vt2};
}



/*
    Convert the Battin's variable x to time of flight in a non dimensional 
    Lambert's problem.
*/
function x2tof(x, s, c, lw, n)
{
    var retval;

	var am = s/2;
	var a = am/(1-x*x);

	var alfa, beta;
	if (x < 1) {	// ellipse
		beta = 2 * Math.asin(Math.sqrt((s - c) / (2*a)));
		alfa = 2 * Math.acos(x);
		if (lw) beta = -beta;
	} else {        // hyperbola
		alfa = 2 * Math.acosh(x);
		beta = 2 * Math.asinh(Math.sqrt ((s - c) / (-2*a)));
		if (lw) beta = -beta;
	}

	if (a > 0) {
		retval = (a * Math.sqrt(a) * ((alfa - Math.sin(alfa)) - 
            (beta - Math.sin(beta)) + (2 * Math.PI * n)));
	} else {
		retval = (-a * Math.sqrt(-a) *((Math.sinh(alfa) - alfa) 
            - (Math.sinh(beta) - beta)));
	}

    return retval;
}


function x2tofPartial(s, c, lw, n)
{
    this.s = s;
    this.c = c;
    this.lw = lw;
    this.n = n;

    this.f = function (x) {
        return x2tof(x, s, c, lw, n);
    }
}

function tofCurve(s, c, tof, lw)
{
    this.s = s;
    this.c = c;
    this.tof = tof;
    this.lw = lw;

    this.f = function(ix) {
        return Math.log(x2tof(Math.exp(ix)-1, this.s, this.c, this.lw, 0))
            - Math.log(this.tof);
    }
}

function tofCurveMultiRev(s, c, tof, lw, n)
{
    this.s = s;
    this.c = c;
    this.tof = tof;
    this.lw = lw;
    this.n = n;

    this.f = function(ix) {
        return x2tof(Math.atan(ix)*(2/Math.PI), this.s, this.c, this.lw, this.n)
            - this.tof;
    }
}

function regulaFalsi(a, b, F, iterations, accuracy)
{
	var Fa = F.f(a);
	var Fb = F.f(b);
	var Fc = Fa;
    var n, c;

	for (n = 0; n < iterations; n++) {
        // Equation solved within accuracy
		if (Math.abs(Fc) < accuracy) {
            break;
        }

		c = ((a*Fb) - (b*Fa)) / (Fb-Fa);
		Fc = F.f(c);
		a = b;
		b = c;
		Fa = Fb;
		Fb = Fc;
	}

	return {retval : n, ia : c};
}