function propagate_lagrangian(r0, v0, t, mu)
{
    var R = magnitude(r0);
    var V = magnitude(v0);
    var energy = (V*V/2 - mu/R);
    var a = - mu / 2.0 / energy;
    var sqrta;
    var F,G,Ft,Gt;

    var sigma0 = dot(r0, v0) / Math.sqrt(mu);
	
    if (a > 0){	//Solve Kepler's equation, elliptical case
        sqrta = Math.sqrt(a);
        var DM = Math.sqrt(mu / Math.pow(a,3)) * t;
        var DE = DM;
		
        //Solve Kepler Equation for ellipses in DE (eccentric anomaly difference)
        
		DE = newton_raphson(DE, new bind_kepDE(DM,sigma0,sqrta,a,R), new bind_d_kepDE(sigma0,sqrta,a,R),100,ASTRO_TOLERANCE);
		
        var r = a + (R - a) * Math.cos(DE) + sigma0 * sqrta * Math.sin(DE);
		
        //Lagrange coefficients
        F  = 1 - a / R * (1 - Math.cos(DE));
        G  = a * sigma0 / Math.sqrt(mu) * (1 - Math.cos(DE)) + R * Math.sqrt(a / mu) * Math.sin(DE);
        Ft = -Math.sqrt(mu * a) / (r * R) * Math.sin(DE);
        Gt = 1 - a / r * (1 - Math.cos(DE));
    }
    else{	//Solve Kepler's equation, hyperbolic case
        sqrta = Math.sqrt(-a);
        var DN = Math.sqrt(-mu / Math.pow(a,3)) * t;
        var DH;
        t > 0 ? DH = 1 : DH = -1; // TODO: find a better initial guess. I tried with 0 and D (both have numercial problems and result in exceptions)

        //Solve Kepler Equation for hyperbolae in DH (hyperbolic anomaly difference)
		
		DH = newton_raphson(DH, new bind_kepDH(DN,sigma0,sqrta,a,R), new bind_d_kepDH(sigma0,sqrta,a,R), 100, ASTRO_TOLERANCE);
		
        var r = a + (R - a) * Math.cosh(DH) + sigma0 * sqrta * Math.sinh(DH);

        //Lagrange coefficients
        F  = 1 - a / R * (1 - Math.cosh(DH));
        G  = a * sigma0 / Math.sqrt(mu) * (1 - Math.cosh(DH)) + R * Math.sqrt(-a / mu) * Math.sinh(DH);
        Ft = -Math.sqrt(-mu * a) / (r * R) * Math.sinh(DH);
        Gt = 1 - a / r * (1 - Math.cosh(DH));
    }

    var temp = [r0[0],r0[1],r0[2]];
	
    for (var i=0;i<3;i++){
        r0[i] = F * r0[i] + G * v0[i];
        v0[i] = Ft * temp[i] + Gt * v0[i];
    }
	
    return {
        r : r0,
        v : v0
    };
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
    var tmp1 = (((h*h)/(MU_JUP*r0_mag)) - 1) * Math.cos(theta);
    var tmp2 = (((h*vr0)/MU_JUP) * Math.sin(theta));
    var r = ((h*h)/MU_JUP) * (1/(1 + tmp1 - tmp2));

    // lagrangian coefficients
    var f = 1 - ((MU_JUP*r)/(h*h)) * (1 - Math.cos(theta));
    var g = ((r*r0_mag)/h) * Math.sin(theta);


    // r = f*r0 + g*v0
    return {
        x : ((f*r0.x)+(g*v0.x)),
        y : ((f*r0.y)+(g*v0.y)),
        z : ((f*r0.z)+(g*v0.z))
    };
}
