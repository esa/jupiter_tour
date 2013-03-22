function flyByDv(v_sc, t_0, m0, m1, chromosome)
{   

	console.log("\n Chromosome:");
	console.log(chromosome);

	var t_0_T = t_0 + chromosome.T;

	console.log(t_0_T);
	
	var m0_eph = planetEphemerides(t_0, m0);
	var m1_eph = planetEphemerides(t_0_T, m1);
	
	console.log("\n MOONS");
	console.log(m0);
	console.log(m1);
	console.log("\n MOON EPHS:");
	console.log(m0_eph);
	console.log(m1_eph);
	
	var v_out = fb_prop(v_sc, m0_eph.v, chromosome.beta, chromosome.rp, m0.mu);
	
	console.log("V_OUT = FB_PROP: " + v_out);
	
	// var anomaly = calculateAnomaly(r_sc, m0_eph.r, v_sc, m0_eph.v);
	
	var pl = propagate_lagrangian(m0_eph.r, v_out, chromosome.eta*chromosome.T*DAY2SEC, MU_JUP);
	
	console.log("\nPROP LAGRANGIAN");
	console.log(pl);
	console.log("PL V_mag: " + magnitude(pl.v));
	
	console.log("\n\nLAMBERT INPUTS:");
	console.log("prop_lagr r: " + pl.r);
	console.log("m1_eph r: " + m1_eph.r);
	console.log("eta*T: " + (1-chromosome.eta)*chromosome.T);

	
	var lp = lambertProblem(pl.r, m1_eph.r, (1-chromosome.eta)*chromosome.T*DAY2SEC, false);
	
	
	console.log("\nLAMBERT PROBLEM");
	console.log(lp);
	console.log("LP V_mag: " + magnitude(lp.v1));
	
	var v_dsm_out = lp.v1;
	
	var dv = magnitude(subtraction(v_dsm_out, pl.v));
	
    return dv;
}


function fb_prop(v_in, v_moon, beta, rp, mu)
{
    var v_rel_in = subtraction(v_in, v_moon);
    var v_rel_in2 = dot(v_rel_in, v_rel_in);
    var v_rel_in_norm = magnitude(v_rel_in);
    var ecc = 1 + rp / mu * v_rel_in2;
    var delta = 2 * Math.asin(1.0/ecc);
   
    var i_hat = [v_rel_in[0] / v_rel_in_norm, v_rel_in[1] / v_rel_in_norm, v_rel_in[2] / v_rel_in_norm];
	
    var j_hat = cross(i_hat,v_moon);
    j_hat  = normalise(j_hat);
	
	var k_hat = cross(i_hat,j_hat);
	
	var v_out = [0,0,0];
	
    v_out[0] = v_moon[0] + v_rel_in_norm * Math.cos(delta) * i_hat[0] + v_rel_in_norm * Math.cos(beta) * Math.sin(delta) * j_hat[0] + v_rel_in_norm * Math.sin(beta) * Math.sin(delta) * k_hat[0];
    v_out[1] = v_moon[1] + v_rel_in_norm * Math.cos(delta) * i_hat[1] + v_rel_in_norm * Math.cos(beta) * Math.sin(delta) * j_hat[1] + v_rel_in_norm * Math.sin(beta) * Math.sin(delta) * k_hat[1];
    v_out[2] = v_moon[2] + v_rel_in_norm * Math.cos(delta) * i_hat[2] + v_rel_in_norm * Math.cos(beta) * Math.sin(delta) * j_hat[2] + v_rel_in_norm * Math.sin(beta) * Math.sin(delta) * k_hat[2];
    
	return v_out;
}


function calculateTotalDv()
{
    var dv = 0;

    legs.orderBy("lid");
    phases.orderBy("t");

    dv += magnitude(subtraction(phases.first().v, legs.get({pid1 : phases.first().pid})[0].sol.v1));
    dv += magnitude(subtraction(phases.last().v, legs.get({pid2 : phases.last().pid})[0].sol.v2));

    for (var i in legs.get()) {
        if (i != (legs.get().length-1)) {
            var p = phases.get({pid : legs.get()[i].pid2})[0];
            var b = bodies.get({bid : p.bid})[0];
            var out = flyByDv(legs.get()[i].sol.v2, legs.get({pid1: legs.get()[i].pid2})[0].sol.v1, p, b);
            dv += out.dv;
            phases.get({pid : legs.get()[i].pid2})[0].fbRad = out.rp;
        }
    }

    return dv;
}