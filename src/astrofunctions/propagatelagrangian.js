
(function(){



function propagate_lagrangian(r0, v0, t, mu)
{
	
    var R = core.magnitude(r0);
    var V = core.magnitude(v0);
    var energy = (V*V/2 - mu/R);
    var a = - mu / 2.0 / energy;
    var sqrta;
    var F,G,Ft,Gt;
	
	
    var sigma0 = core.dot(r0, v0) / Math.sqrt(mu);
	
    if (a > 0){	//Solve Kepler's equation, elliptical case
        
		// console.log("ELLIPSE");
		
		sqrta = Math.sqrt(a);
        var DM = Math.sqrt(mu / Math.pow(a,3)) * t;
        var DE = DM;
		
        //Solve Kepler Equation for ellipses in DE (eccentric anomaly difference)
        
		DE = core.newton_raphson(DE, new core.bind_kepDE(DM,sigma0,sqrta,a,R), new core.bind_d_kepDE(sigma0,sqrta,a,R),1000,ASTRO_TOLERANCE);
		
        var r = a + (R - a) * Math.cos(DE) + sigma0 * sqrta * Math.sin(DE);
		
        //Lagrange coefficients
        F  = 1 - a / R * (1 - Math.cos(DE));
        G  = a * sigma0 / Math.sqrt(mu) * (1 - Math.cos(DE)) + R * Math.sqrt(a / mu) * Math.sin(DE);
        Ft = -Math.sqrt(mu * a) / (r * R) * Math.sin(DE);
        Gt = 1 - a / r * (1 - Math.cos(DE));
		
    }
    else{	//Solve Kepler's equation, hyperbolic case
        
		// console.log("HYPERBOLE");
		
		sqrta = Math.sqrt(-a);
        var DN = Math.sqrt(-mu / Math.pow(a,3)) * t;
        var DH;
        t > 0 ? DH = 1 : DH = -1; // TODO: find a better initial guess. I tried with 0 and D (both have numercial problems and result in exceptions)
		
        //Solve Kepler Equation for hyperbolae in DH (hyperbolic anomaly difference)
		
		DH = core.newton_raphson(DH, new core.bind_kepDH(DN,sigma0,sqrta,a,R), new core.bind_d_kepDH(sigma0,sqrta,a,R), 1000, ASTRO_TOLERANCE);
		
        var r = a + ((R - a) * Math.cosh(DH)) + (sigma0 * sqrta * Math.sinh(DH));
		
        //Lagrange coefficients
        F  = 1 - a / R * (1 - Math.cosh(DH));
        G  = a * sigma0 / Math.sqrt(mu) * (1 - Math.cosh(DH)) + R * Math.sqrt(-a / mu) * Math.sinh(DH);
        Ft = -Math.sqrt(-mu * a) / (r * R) * Math.sinh(DH);
        Gt = 1 - a / r * (1 - Math.cosh(DH));
		
    }

    var temp = [r0[0],r0[1],r0[2]];
	
	var ret_r = new Array(3);
	var ret_v = new Array(3);
	
    for (var i=0;i<3;i++){
        ret_r[i] = F * r0[i] + G * v0[i];
        ret_v[i] = Ft * temp[i] + Gt * v0[i];
    }
	
	
    return {
        r : ret_r,
        v : ret_v
    };
}



core.propagate_lagrangian = propagate_lagrangian;


})();