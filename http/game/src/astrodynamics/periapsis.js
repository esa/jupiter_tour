/* Computes the periapsis vector for a spacecraft which flies by a celestial body */
(function () {


    function computePeriapsis(body, epoch, velocityInfIn, beta, radius) {
        velocityInfIn = velocityInfIn.clone();

        radius *= body.getRadius();

        //getting coordinates and speed of the celestial body
        var eph = body.orbitalStateVectorsAtEpoch(epoch);
        var position = eph.position;
        var velocity = eph.velocity;


        // Compute outgoing velocity
        var velocityInfInAbs = velocityInfIn.clone().add(velocity);
        var velocityInfOutAbs = astrodynamics.flybyPropagation(velocityInfInAbs, velocity, beta, radius, body.getStandardGravitationalParameter());
        var velocityDiff = velocityInfInAbs.clone().sub(velocityInfOutAbs);

        // constraint check
        var velocityInfOut = velocityInfOutAbs.clone().sub(velocity);

        if (velocityInfIn.normEuclid() - velocityInfOut.normEuclid() > 1.0) {
            console.log('WARNING: Constraint violation! Difference between vinf_in and vinf_out is larger than 1!');
        }

        // compute periapsis vector
        var periapsis = velocityDiff.clone().multiplyScalar(radius * 1 / velocityDiff.normEuclid());

        //body - fixed coordinate frame
        var bHat1 = position.clone().multiplyScalar(-1.0 / position.normEuclid());
        var bHat3 = new geometry.Vector3().crossVectors(position, velocity);
        bHat3.normalize();
        var bHat2 = new geometry.Vector3().crossVectors(bHat3, bHat1);

        // use dot product to get coordinates of periapsis vector in the body - fixed reference frame
        var periapsisHat = new geometry.Vector3(periapsis.dot(bHat1), periapsis.dot(bHat2), periapsis.dot(bHat3));

        // vector is now normalized to the sphere which has the soccer ball inside.
        // radius of this sphere is given by problem description as sqrt(9 * golden + 10)
        return periapsisHat.normalize().multiplyScalar(Math.sqrt(9 * constants.GOLDEN_RATIO + 10));
    }

    // Exposed Interface
    astrodynamics.computePeriapsis = computePeriapsis;
})();