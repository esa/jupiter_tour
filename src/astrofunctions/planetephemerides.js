var TOLERANCE = 1e-13;


function planetEphemerides(t, moon)
{
    var keplerElements = new Array(6);
	
	console.log("\n\n" + moon.name);	
	console.log(t);
	
	var mean_motion = Math.sqrt(MU_JUP/Math.pow(moon.a, 3));
	
	// console.log(mean_motion);
	var dt = (t - ref_epoch) * DAY2SEC;
	
	// console.log(dt);
	
    keplerElements[0] = moon.a;
    keplerElements[1] = moon.e;
    keplerElements[2] = moon.i;
    keplerElements[3] = moon.LAN;
    keplerElements[4] = moon.w;
	keplerElements[5] = moon.M;
	// console.log(moon.M);
    // keplerElements[5] = moon.M + mean_motion * dt;
	 // console.log(mean_motion);
	// console.log(dt);
	// console.log(keplerElements[5]);
	
    // conversion of DEG into RAD
    keplerElements[2] *= DEG2RAD;
    keplerElements[3] *= DEG2RAD;
    keplerElements[4] *= DEG2RAD;
	keplerElements[5] *= DEG2RAD;
	
	console.log(keplerElements[5]);
	
    keplerElements[5] += mean_motion*dt;
	keplerElements[5] =  keplerElements[5] % (2 * Math.PI);
	
	console.log(mean_motion);
	console.log(dt);
	console.log(keplerElements[5]);
	
	
	// console.log("\n KE RADS");
	// console.log(keplerElements);
	
	
    // Conversion from Mean Anomaly to Eccentric Anomaly via Kepler's equation
    keplerElements[5] = Mean2Eccentric(keplerElements[5], keplerElements[1]);
	
	
	console.log("Kep[5] M2E = " + keplerElements[5]);
	console.log("\n");
	
    // Position and Velocity evaluation according to j2000 system
    return par2ic(keplerElements, MU_JUP);
}

function Mean2Eccentric(M, eccentricity)
{
    var n_of_it = 0; // Number of iterations
    var E, Ecc_New;
    var err = 1;

	E = M + eccentricity * Math.cos(M);
        Ecc_New = newton_raphson(E,new bind_kepE(M, eccentricity),new bind_d_kepE(eccentricity),100,TOLERANCE);
        return Ecc_New;
	
	
    // if (eccentricity < 1.0) {
        // E = M + eccentricity * Math.cos(M); // Initial guess
        // while ((err > TOLERANCE) && (n_of_it < 100)) {
            // Ecc_New = E - (E - eccentricity * Math.sin(E) - M) / (1 - eccentricity * Math.cos(E));
            // err = Math.abs(E - Ecc_New);
            // E = Ecc_New;
            // n_of_it++;
        // }
    // } else {
        // alert("planet ephermerides error !!");
 //       // CZF FF(e,M);  // function to find its zero point
 //       // ZeroFinder::FZero fz(-M_PI_2 + 1e-8, M_PI_2 - 1e-8);
 //       // Ecc_New = fz.FindZero(FF);
 //       // Eccentric = Ecc_New;
    // }

    return E;
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


function par2ic( E, mu )
{
    var a = E[0];
    var e = E[1];
	var i = E[2];
    var omg = E[3];
    var omp = E[4];
    var EA = E[5];
    var b, n, xper, yper, xdotper, ydotper;
    var R = [[0,0,0],[0,0,0],[0,0,0]];
    var cosomg, cosomp, sinomg, sinomp, cosi, sini;
    var dNdZeta;


    //1 - We start by evaluating position and velocity in the perifocal reference system
    if (e<1.0) //EA is the eccentric anomaly
    {
        b = a*Math.sqrt(1-e*e);
        n = Math.sqrt(mu/(a*a*a));

        xper=a*(Math.cos(EA)-e);
        yper=b*Math.sin(EA);
        xdotper = -(a*n*Math.sin(EA))/(1-e*Math.cos(EA));
        ydotper=(b*n*Math.cos(EA))/(1-e*Math.cos(EA));
    }
    else	//EA is the Gudermannian
    {
        b = -a*Math.sqrt(e*e-1);
        n = Math.sqrt(-mu/(a*a*a));

        dNdZeta = e * (1+Math.tan(EA)*Math.tan(EA))-(0.5+0.5*Math.pow(Math.tan(0.5*EA + Math.pi/4),2))/Math.tan(0.5*EA+ Math.pi/4);

        xper = a/Math.cos(EA) - a*e;
        yper = b*Math.tan(EA);

        xdotper = a*Math.tan(EA)/Math.cos(EA)*n/dNdZeta;
        ydotper = b/Math.pow(Math.cos(EA), 2)*n/dNdZeta;
    }

    //2 - We then built the rotation matrix from perifocal reference frame to inertial

    cosomg = Math.cos(omg);
    cosomp = Math.cos(omp);
    sinomg = Math.sin(omg);
    sinomp = Math.sin(omp);
    cosi = Math.cos(i);
    sini = Math.sin(i);


    R[0][0]=cosomg*cosomp-sinomg*sinomp*cosi;
    R[0][1]=-cosomg*sinomp-sinomg*cosomp*cosi;
    R[0][2]=sinomg*sini;
    R[1][0]=sinomg*cosomp+cosomg*sinomp*cosi;
    R[1][1]=-sinomg*sinomp+cosomg*cosomp*cosi;
    R[1][2]=-cosomg*sini;
    R[2][0]=sinomp*sini;
    R[2][1]=cosomp*sini;
    R[2][2]=cosi;

    // 3 - We end by transforming according to this rotation matrix


    var temp = [xper, yper, 0.0];
    var temp2 = [xdotper, ydotper, 0];
	
	var pos = new Array(3);
    var vel = new Array(3);
	
    for (var j = 0; j<3; j++)
    {
        pos[j] = 0.0; vel[j] = 0.0;
        for (var k = 0; k<3; k++)
        {
            pos[j]+=R[j][k]*temp[k];
            vel[j]+=R[j][k]*temp2[k];
        }
    }
	
	console.log("Moon position r: x=" + pos[0] + ", y=" + pos[1] + ", z=" + pos[2]);
	console.log("Moon velocity v: x=" + vel[0] + ", y=" + vel[1] + ", z=" + vel[2]);
	
    return {
        r : [pos[0], pos[1], pos[2]],
        v : [vel[0], vel[1], vel[2]]
    };
}

