(function(){

function fb_prop(v_in, v_moon, beta, rp, mu)
{
    var v_rel_in = core.subtraction(v_in, v_moon);
    var v_rel_in2 = core.dot(v_rel_in, v_rel_in);
    var v_rel_in_norm = core.magnitude(v_rel_in);
    var ecc = 1 + rp / mu * v_rel_in2;
    var delta = 2 * Math.asin(1.0/ecc);
   
    var i_hat = [v_rel_in[0] / v_rel_in_norm, v_rel_in[1] / v_rel_in_norm, v_rel_in[2] / v_rel_in_norm];
	
    var j_hat = core.cross(i_hat,v_moon);
    j_hat  = core.normalise(j_hat);
	
	var k_hat = core.cross(i_hat,j_hat);
	
	var v_out = [0,0,0];
	
    v_out[0] = v_moon[0] + v_rel_in_norm * Math.cos(delta) * i_hat[0] + v_rel_in_norm * Math.cos(beta) * Math.sin(delta) * j_hat[0] + v_rel_in_norm * Math.sin(beta) * Math.sin(delta) * k_hat[0];
    v_out[1] = v_moon[1] + v_rel_in_norm * Math.cos(delta) * i_hat[1] + v_rel_in_norm * Math.cos(beta) * Math.sin(delta) * j_hat[1] + v_rel_in_norm * Math.sin(beta) * Math.sin(delta) * k_hat[1];
    v_out[2] = v_moon[2] + v_rel_in_norm * Math.cos(delta) * i_hat[2] + v_rel_in_norm * Math.cos(beta) * Math.sin(delta) * j_hat[2] + v_rel_in_norm * Math.sin(beta) * Math.sin(delta) * k_hat[2];
    
	return v_out;
}




core.fb_prop = fb_prop;

})();