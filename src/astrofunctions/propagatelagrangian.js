
function propagateLagrangian(r0, v0, a, dE)
{
    var r0_mag = magnitude(r0);
    var v0_mag = magnitude(v0);

    var sigma = dot(r0, v0) / Math.sqrt(MU_JUP);
	
    if (a > 0) {     // ellipse
        var sqrta = Math.sqrt(a);
        var cosdE = Math.cos(dE);
        var sindE = Math.sin(dE);
		
        // distance
        var r = a + ((r0_mag - a) * cosdE) + (sigma * sqrta * sindE);

        // lagrangian coefficients
        var f = 1 - ((a * (1 - cosdE)) / r0_mag);
        var g = ((a * sigma * (1 - cosdE)) +  (r0_mag * sqrta * sindE)) / Math.sqrt(MU_JUP);
        var ft = -(Math.sqrt(a * MU_JUP) * sindE) / (r * r0_mag);
        var gt = 1 - ((a * (1 - cosdE)) / r);
		
    } else {        // hyperbolic
        var sqrta = Math.sqrt(-a);
        var coshdE = Math.cosh(dE);
        var sinhdE = Math.sinh(dE);

        // distance
        var r = a + ((r0_mag - a) * coshdE) + (sigma * sqrta * sinhdE);

        // lagrangian coefficients
        var f = 1 - ((a * (1 - coshdE)) / r0_mag);
        var g = ((a * sigma * (1 - coshdE)) + (r0_mag * sqrta * sinhdE)) / Math.sqrt(MU_JUP);
        var ft = -(Math.sqrt(-a * MU_JUP) * sinhdE) / (r * r0_mag);
        var gt = 1 - ((a * (1 - coshdE)) / r);
    }

    // r = f*r0 + g*v0
    // v = df*r0 + dg*v0
    return {
        r : [
            ((f*r0[0])+(g*v0[0])),
            ((f*r0[1])+(g*v0[1])),
            ((f*r0[2])+(g*v0[2]))
        ],
        v : [
            ((ft*r0[0])+(gt*v0[0])),
            ((ft*r0[1])+(gt*v0[1])),
            ((ft*r0[2])+(gt*v0[2]))
        ]
    };
}


/*

*/
function calculateAnomaly(r_sp, r_moon, v_sp, v_moon)
{
    var r1 = r_sp;
    var r2 = r_moon;
	
    var v1 = v_sp;
    var v2 = v_moon;

    var r1_mag = magnitude(r1);
    var r2_mag = magnitude(r2);
    var v1_mag = magnitude(v1);
	
    // semi-major axis
    var a = 1 / ((2/r1_mag) - ((v1_mag*v1_mag)/MU_JUP));
	

    // if multiple revolution, just draw full ellipse
    //if (Math.ceil(leg.soln / 2) != 0) {                                                             // check for errors
    //    var theta = 2 * Math.PI;
    //} else {
        // eccentricity
        var tmp = cross(v1, cross(r1, v1));
        var e = subtraction(division(tmp, MU_JUP), division(r1, r1_mag));
		e = magnitude(e);

        if (a > 0) {
            var E1 = Math.acos((1 - (r1_mag/a)) / e);
            var E2 = Math.acos((1 - (r2_mag/a)) / e);
			
            if (dot(r1, v1) < 0) {
                E1 = - E1;
            }

            if (dot(r2, v2) < 0) {
                E2 = (2*Math.PI) - E2;
            }
			
			

            var theta = E2 - E1;
			
            if (theta < 0) {
                theta += 2 * Math.PI;
            }

            // tempoary fix for theata > 2 * PI
            // example: Earth (Feb 2001) -> Venus (May 2001)
            if (theta > (2 * Math.PI)) {
                theta -= (2 * Math.PI);
            }

        } else {
            var H1 = Math.acosh((1 - (r1_mag/a)) / e);
            var H2 = Math.acosh((1 - (r2_mag/a)) / e);

            if (dot(r1, v1) < 0) {
                H1 = - H1;
            }

            if (dot(r2, v2) < 0) {
                H2 = -H2;
            }

            var theta = H2 - H1;
			
        }
    //}

    return {a : a, theta: theta};
}


/*
    Simple version of the progagate lagrangian. Uses theta and instead
    of the eccentric anomaly and only return the position. Use when
    needing to draw something simple like the orbital path of a planet.
*/
function propagateLagrangianSimp(r0, v0, theta)
{
    // angular momentum
    var h = magnitude(cross(r0, v0));

    // magnitude of position vector r0
    var r0_mag = magnitude(r0);

    // initial radial velocity
    var vr0 = dot(r0, v0) / r0_mag;

    // distance
    var tmp1 = (((h*h)/(MU_SUN*r0_mag)) - 1) * Math.cos(theta);
    var tmp2 = (((h*vr0)/MU_SUN) * Math.sin(theta));
    var r = ((h*h)/MU_SUN) * (1/(1 + tmp1 - tmp2));

    // lagrangian coefficients
    var f = 1 - ((MU_SUN*r)/(h*h)) * (1 - Math.cos(theta));
    var g = ((r*r0_mag)/h) * Math.sin(theta);


    // r = f*r0 + g*v0
    return {
        x : ((f*r0.x)+(g*v0.x)),
        y : ((f*r0.y)+(g*v0.y)),
        z : ((f*r0.z)+(g*v0.z))
    };
}

