(function () {

    function lambertProblem(sgp, r1, r2, tof, cw) {
        r1 = r1.clone();
        r2 = r2.clone();

        var lw = ((r1.getX() * r2.getY() - r1.getY() * r2.getX()) > 0) ? 0 : 1; // prograde motion assumed
        if (cw) lw = (lw + 1) % 2; // changed to retrograde motion

        // 4 - get solution
        var sol = lambert3D(sgp, r1, r2, tof, lw);
        return sol;
    }


    function lambert3D(sgp, r1, r2, tof, lw) {

        // 1 - Computing non dimensional units
        var R = r1.normEuclid();
        var V = Math.sqrt(sgp / R);
        var T = R / V;

        var R2 = r2.normEuclid();
        var costheta = r1.dot(r2) / (R * R2);

        var r2_mod = R2 / R;
        var c = Math.sqrt(1 + r2_mod * (r2_mod - 2.0 * costheta));
        var s = (1 + r2_mod + c) / 2.0;

        // 3 - Solving the problem in 2D
        var out = lambert2D(s, c, tof / T, lw);

        // 4 - Reconstructing the velocity vectors in three dimensions
        var ir1 = r1.clone().normalize();
        var ir2 = r2.clone().normalize();

        // here is the singularity: as when ir1||ir2 this plane is not defined!!
        var ih = new geometry.Vector3();
        lw ? ih.crossVectors(ir2, ir1) : ih.crossVectors(ir1, ir2);

        if ((ih.getX() + ih.getY() + ih.getZ()) == 0) {
            console.log("lambert is singular in 3D as transfer angle is 180*n degrees\n");
        }

        ih.normalize();

        var it1 = new geometry.Vector3();
        it1.crossVectors(ir1, ih);

        var it2 = new geometry.Vector3();
        it2.crossVectors(ir2, ih);

        v1 = ir1.multiplyScalar(out.vr1).sub(it1.multiplyScalar(out.vt1));
        v2 = ir2.multiplyScalar(out.vr2).sub(it2.multiplyScalar(out.vt2));

        // 5 - Putting back dimensions
        v1.multiplyScalar(V);
        v2.multiplyScalar(V);

        return {
            converged: out.converged,
            velocity1: v1,
            velocity2: v2
        };
    }


    function lambert2D(s, c, tof, lw) {
        var accuracy = 1e-9;
        var max_iter = 50;

        var out;

        // 0 - Some geometry
        var am = s / 2.0; // semi-major axis of the minimum energy ellipse
        var r2 = 2 * s - c - 1; // r2 in r1 units

        // transfer angle
        var theta = Math.acos((1 - c * c) / r2 / 2 + r2 / 2);

        theta = (lw ? (2 * Math.PI) - theta : theta);

        // Lagrange used this to simplify the maths ?
        var lambda = Math.sqrt(r2) * Math.cos(theta / 2.0) / s;

        // 1 - We solve the tof equation
        var x, ia, ib;
        // no multiple revolutions
        ia = Math.log(1 - 0.5);
        ib = Math.log(1 + 0.5);
        out = algorithm.regulaFalsi(ia, ib, function (ix) {
            return Math.log(xToTimeOfFlight(Math.exp(ix) - 1, s, c, lw, 0)) - Math.log(tof);
        }, max_iter, accuracy);

        x = Math.exp(out.ia) - 1;

        // 3 - Using the Battin variable we recover all our outputs
        var a = am / (1 - x * x);

        var beta, alfa, eta2, eta, psi;
        if (x < 1) { // ellipse
            beta = 2 * Math.asin(Math.sqrt((s - c) / (2 * a)));
            if (lw) beta = -beta;
            alfa = 2 * Math.acos(x);
            psi = (alfa - beta) / 2;
            eta2 = 2 * a * Math.pow(Math.sin(psi), 2) / s;
            eta = Math.sqrt(eta2);

        } else { // hyperbola
            beta = 2 * Math.asinh(Math.sqrt((c - s) / (2 * a)));
            if (lw) beta = -beta;
            alfa = 2 * Math.acosh(x);
            psi = (alfa - beta) / 2;
            eta2 = -2 * a * Math.pow(Math.sinh(psi), 2) / s;
            eta = Math.sqrt(eta2);

        }

        var p = (r2 / (am * eta2)) * Math.pow(Math.sin(theta / 2), 2);
        var sigma1 = (1 / (eta * Math.sqrt(am))) * (2 * lambda * am - (lambda + x * eta));

        var vr1 = sigma1;
        var vt1 = Math.sqrt(p);
        var vt2 = vt1 / r2;
        var vr2 = -vr1 + (vt1 - vt2) / Math.tan(theta / 2);

        if (out.retval == max_iter) {
            converged = false;
        } else {
            converged = true;
        }

        return {
            converged: converged,
            vr1: vr1,
            vr2: vr2,
            vt1: vt1,
            vt2: vt2
        };
    }



    /*
        Convert the Battin's variable x to time of flight in a non dimensional 
        Lambert's problem.
    */
    function xToTimeOfFlight(x, s, c, lw, n) {
        var retval;

        var am = s / 2;
        var a = am / (1 - x * x);

        var alfa, beta;
        if (x < 1) { // ellipse
            beta = 2 * Math.asin(Math.sqrt((s - c) / (2 * a)));
            alfa = 2 * Math.acos(x);
            if (lw) beta = -beta;
        } else { // hyperbola
            alfa = 2 * Math.acosh(x);
            beta = 2 * Math.asinh(Math.sqrt((s - c) / (-2 * a)));
            if (lw) beta = -beta;
        }

        if (a > 0) {
            retval = (a * Math.sqrt(a) * ((alfa - Math.sin(alfa)) -
                (beta - Math.sin(beta)) + (2 * Math.PI * n)));
        } else {
            retval = (-a * Math.sqrt(-a) * ((Math.sinh(alfa) - alfa) - (Math.sinh(beta) - beta)));
        }

        return retval;
    }

    //Exposed Interface
    astrodynamics.lambertProblem = lambertProblem;
})();