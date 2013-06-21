(function(){


function flyby_dv(v_sc, t_0, m0, m1, chromosome)
{   

	//console.log("\n Chromosome:");
	//console.log(chromosome);

	var t_0_T = t_0 + chromosome.T;

	// console.log("\nt0+T: " + t_0_T);
	
	var m0_eph = core.planet_ephemerides(t_0, m0);
	var m1_eph = core.planet_ephemerides(t_0_T, m1);
    
	//console.log("\nDV " + m0.name + " Ephemerides at epoch(MJD): " + t_0);
	//console.log(m0_eph);
	//console.log("DV " + m1.name + " Ephemerides at epoch(MJD): " + t_0_T);
	//console.log(m1_eph);
	
	//console.log("DV m0 mu: " +m0.mu);
	
	var temp_v_sc = core.addition(v_sc, m0_eph.v);
	
	// console.log("\n\nDV v_sc + v_m0: " + temp_v_sc);
	
	v_sc = temp_v_sc;
	
	var v_out = core.fb_prop(v_sc, m0_eph.v, chromosome.beta, chromosome.rp*m0.radius, m0.mu);
	
	console.log("\nV_OUT = FB_PROP: " + v_out);
	
	// var anomaly = calculateAnomaly(r_sc, m0_eph.r, v_sc, m0_eph.v);
	
	var pl = core.propagate_lagrangian(m0_eph.r, v_out, chromosome.eta*chromosome.T*DAY2SEC, MU_JUP);
	
	//console.log("\nPROP LAGRANGIAN");
	//console.log(pl);
	//console.log("\n\n\n");
	var lp = core.lambert_problem(pl.r, m1_eph.r, (1-chromosome.eta)*chromosome.T*DAY2SEC, false);
	
	//console.log("\nLAMBERT PROBLEM");
	//console.log(lp);
	
	var v_dsm_out = lp.v1;
	
	var dv = core.magnitude(core.subtraction(v_dsm_out, pl.v));
	
    return dv;
}



function total_dv()
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

core.flyby_dv = flyby_dv;
core.total_dv = total_dv;



})();