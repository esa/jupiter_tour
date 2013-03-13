var TOLERANCE = 1e-13;


function planetEphemerides(t, moon)
{
    var keplerElements = new Array(6);

	var mean_motion = Math.sqrt(MU_JUP/Math.pow(moon.a, 3));
	var dt = (t - ref_epoch) * DAY2SEC;
	
    keplerElements[0] = moon.a;
    keplerElements[1] = moon.e;
    keplerElements[2] = moon.i;
    keplerElements[3] = moon.LAN;
    keplerElements[4] = moon.w;
    keplerElements[5] = (moon.M + mean_motion * dt)%360;

    // conversion of DEG into RAD
    keplerElements[2] *= DEG2RAD;
    keplerElements[3] *= DEG2RAD;
    keplerElements[4] *= DEG2RAD;
    keplerElements[5] *= DEG2RAD;
    keplerElements[5] =  keplerElements[5] % (2 * Math.PI);
	
    // Conversion from Mean Anomaly to Eccentric Anomaly via Kepler's equation
    keplerElements[5] = Mean2Eccentric(keplerElements[5], keplerElements[1], moon, t);

    // Position and Velocity evaluation according to j2000 system
    return Conversion(keplerElements);
}

function Mean2Eccentric(M, e, moon, t)
{
    var n_of_it = 0; // Number of iterations
    var eccentric, Ecc_New;
    var err = 1;

    if (e < 1.0) {
        eccentric = M + e * Math.cos(M); // Initial guess
        while ((err > TOLERANCE) && (n_of_it < 100)) {
            Ecc_New = eccentric - (eccentric - e * Math.sin(eccentric) - M) / (1 - e * Math.cos(eccentric));
            err = Math.abs(eccentric - Ecc_New);
            eccentric = Ecc_New;
            n_of_it++;
        }
    } else {
        alert("planet ephermerides error !!");
        //CZF FF(e,M);  // function to find its zero point
        //ZeroFinder::FZero fz(-M_PI_2 + 1e-8, M_PI_2 - 1e-8);
        //Ecc_New = fz.FindZero(FF);
        //Eccentric = Ecc_New;
    }

    return eccentric;
}

// coverts keplerian elements to r & v
function Conversion(E)
{
    var a, e, i, omg, omp, theta;
    var b, n;
    var X_per = new Array(3);
    var X_dotper = new Array(3);

    // create matrix!
    var R = new Array(3)
    for (var i = 0; i < 3; i++) { R[i] = new Array(3); }

    // the six kepler elements
    a = E[0];
    e = E[1];
    i = E[2];
    omg = E[3]; // omega (LAN)
    omp = E[4]; // w
    theta = E[5]; // true anomaly
	
    b = a * Math.sqrt(1 - e*e);
    n = Math.sqrt(MU_JUP / Math.pow(a,3));        // change SUN_MU back to parameter?

    var sin_theta = Math.sin(theta);
    var cos_theta = Math.cos(theta);

    X_per[0] = a * (cos_theta - e);
    X_per[1] = b * sin_theta;

    X_dotper[0] = -(a * n * sin_theta)/(1 - e * cos_theta);
    X_dotper[1] = (b * n * cos_theta)/(1 - e * cos_theta);

    var cosomg = Math.cos(omg);
    var cosomp = Math.cos(omp);
    var sinomg = Math.sin(omg);
    var sinomp = Math.sin(omp);
    var cosi = Math.cos(i);
    var sini = Math.sin(i);

    R[0][0] = cosomg * cosomp - sinomg * sinomp * cosi;
    R[0][1] = -cosomg * sinomp - sinomg * cosomp * cosi;

    R[1][0] = sinomg * cosomp + cosomg * sinomp * cosi;
    R[1][1] = -sinomg * sinomp + cosomg * cosomp * cosi;

    R[2][0] = sinomp * sini;
    R[2][1] = cosomp * sini;


    var pos = new Array(3);
    var vel = new Array(3);

    // evaluate position and velocity
    for (var i = 0; i < 3; i++) {
        pos[i] = 0;
        vel[i] = 0;
        for (var j = 0; j < 2; j++) {
                pos[i] += R[i][j] * X_per[j];
                vel[i] += R[i][j] * X_dotper[j];
        }
    }

	console.log("Moon position r: x=" + pos[0] + ", y=" + pos[1] + ", z=" + pos[2]);
	console.log("Moon velocity v: x=" + vel[0] + ", y=" + vel[1] + ", z=" + vel[2]);
	
    // return the position and velocity to the body
    return {
        r : [pos[0], pos[1], pos[2]],
        v : [vel[0], vel[1], vel[2]]
    };
}