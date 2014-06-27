/* Collection of useful astrodynamic functions */
(function () {

    function velocityInfOutFromPosition(velocityInfIn, position, unfeasible) {
        velocityInfIn = velocityInfIn.clone();
        position = position.clone();

        // compute the point position vector
        if (unfeasible) {
            // maps the point to the far hemisphere
            var velocityInfInHat = velocityInfIn.clone().normalize();
            position = position.clone().sub(velocityInfInHat.clone().multiplyScalar(position.dot(velocityInfInHat) * 1.01));
        }
        // normalize
        var positionHat = position.clone().normalize();

        // spacecraft relative velocity out needed in order to see the vertex
        var velocityInfOut = velocityInfIn.clone().sub(positionHat.clone().multiplyScalar(velocityInfIn.dot(positionHat) * 2));
        return velocityInfOut;
    }

    function flybyConstraints(velocityRelativeIn, velocityRelativeOut, body) {
        velocityRelativeIn = velocityRelativeIn.clone();
        velocityRelativeOut = velocityRelativeOut.clone();

        var bounds = [body.getMinRadius() - body.getRadius(), body.getMaxRadius() - body.getRadius()];

        /**
	- v_rel_in: cartesian coordinates of the relative hyperbolic velocity before the fly-by
	- vout: vout, cartesian coordinates of the relative hyperbolic velocity after the fly-by
	- pl: fly-by Satellite
	- radius: tuple with the range of heights above pl.radius in which the flyby can take place
	
	Returns a tuple containing (eq, ineq).
	  eq represents the violation of the equality constraint |v_rel_in|-� =|vout|-�.
	  ineq represents the violation of the inequality constraints on the hyperbola asymptote maximum deflection
	*/
        var velocityInfIn2 = velocityRelativeIn.dotMe();
        var velocityInfOut2 = velocityRelativeOut.dotMe();
        var equality = velocityInfIn2 - velocityInfOut2;

        var argAcos = velocityRelativeIn.dot(velocityRelativeOut) / (Math.sqrt(velocityInfIn2) * Math.sqrt(velocityInfOut2));
        // when v_rel_in = v_rel_out, arg_acos can get bigger than 1 because of roundoff:
        if (argAcos > 1.0) {
            argAcos = 1.0;
        } else if (argAcos < -1.0) {
            argAcos = -1.0;
        }

        var alpha = Math.acos(argAcos);

        var range = [];

        for (var i = 0; i < bounds.length; i++) {
            range.push(1 + (body.getRadius() + bounds[i]) / body.getStandardGravitationalParameter() * velocityInfIn2);
        }

        var alphaMin = 2 * Math.asin(1 / range[1]);
        var alphaMax = 2 * Math.asin(1 / range[0]);

        var inequalityDelta = [alphaMin - alpha, alpha - alphaMax];

        return {
            equality: equality,
            inequality: inequalityDelta
        };
    }

    function velocitiesAtInfinityToBeta(velocityInfIn, velocityInfOut, velocityBody) {
        velocityInfIn = velocityInfIn.clone();
        velocityInfOut = velocityInfOut.clone();
        velocityBody = velocityBody.clone();

        /**
	beta angle from the hyperbolic velocities
	
	# VALIDATION:
	>>> beta = .23456
	>>> abs_v_in, v_planet = [1,0,0], [0,1,0]
	>>> abs_v_out = pk.fb_prop(abs_v_in, v_planet, 2, beta, 1)
	>>> b = vinfs_to_beta( np.subtract( abs_v_in, v_planet ), np.subtract( abs_v_out, v_planet ), v_planet )
	>>> beta == b
	*/

        var iHat = velocityInfIn.clone();
        var jHat = new geometry.Vector3().crossVectors(iHat, velocityBody);
        var kHat = new geometry.Vector3().crossVectors(iHat, jHat);

        iHat.normalize();
        jHat.normalize();
        kHat.normalize();

        var beta = Math.atan2(velocityInfOut.dot(kHat), velocityInfOut.dot(jHat));
        return beta;
    }

    function positionToBeta(position, velocityBody, velocityInfIn, unfeasible) {
        // beta angle required to fly a face vertex, even if unfeasible
        var velocityInfOut = velocityInfOutFromPosition(velocityInfIn, position, unfeasible);
        return velocitiesAtInfinityToBeta(velocityInfIn, velocityInfOut, velocityBody);
    }

    //Exposed Interface
    astrodynamics.velocityInfOutFromPosition = velocityInfOutFromPosition;
    astrodynamics.flybyConstraints = flybyConstraints;
    astrodynamics.positionToBeta = positionToBeta;
})();