(function () {

    function flybyPropagation(velocityInfIn, velocityBody, beta, radius, sgp) {
        velocityInfIn = velocityInfIn.clone();
        velocityBody = velocityBody.clone();

        var velocityRelativeIn = velocityInfIn.sub(velocityBody);
        var velocityRelativeIn2 = velocityRelativeIn.dotMe();
        var velocityRelativeInNorm = velocityRelativeIn.normEuclid();

        var eccentricity = 1 + radius / sgp * velocityRelativeIn2;
        var delta = 2 * Math.asin(1.0 / eccentricity);

        var iHat = velocityRelativeIn.divideScalar(velocityRelativeInNorm);

        var jHat = new geometry.Vector3();
        jHat.crossVectors(iHat, velocityBody).normalize();

        var kHat = new geometry.Vector3().crossVectors(iHat, jHat);

        var velocityInfOut = velocityBody.clone();

        velocityInfOut.add(iHat.multiplyScalar(velocityRelativeInNorm * Math.cos(delta))).add(jHat.multiplyScalar(velocityRelativeInNorm * Math.cos(beta) * Math.sin(delta))).add(kHat.multiplyScalar(velocityRelativeInNorm * Math.sin(beta) * Math.sin(delta)));

        return velocityInfOut;
    }

    //Exposed Interface
    astrodynamics.flybyPropagation = flybyPropagation;
})();