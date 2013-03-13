var GOLDEN = 0.3819660;  // golden ratio

function brentFindMinima(F, min, max, iterations, accuracy)
{
    var x = max;        // minima so far
    var w = max;        // second best point
    var v = max;        // previous value of w
    var u;              // most recent evaluation point
    var delta = 0;      // The distance moved in the last step
    var delta2 = 0;     // The distance moved in the step before last
    var fu, fv, fw, fx; // function evaluations at u, v, w, x
    var mid;            // midpoint of min and max
    var fract1, fract2; // minimal relative movement in x

    fw = fv = fx = F.f(x);

    do {
        // get midpoint
        mid = (min + max) / 2;
        // work out if we're done already:
        fract1 = accuracy * Math.abs(x) + accuracy / 4;
        fract2 = 2 * fract1;
        if (Math.abs(x - mid) <= (fract2 - (max - min) / 2)) {
            break;
        }

        if (Math.abs(delta2) > fract1) {
            // try and construct a parabolic fit:
            var r = (x - w) * (fx - fv);
            var q = (x - v) * (fx - fw);
            var p = (x - v) * q - (x - w) * r;
            q = 2 * (q - r);
            if (q > 0) p = -p;
            q = Math.abs(q);
            var td = delta2;
            delta2 = delta;

            // determine whether a parabolic step is acceptible or not:
            if ((Math.abs(p) >= Math.abs(q * td / 2)) || (p <= q * (min - x)) || (p >= q * (max - x))) {
                // nope, try golden section instead
                delta2 = (x >= mid) ? min - x : max - x;
                delta = GOLDEN * delta2;
            }  else {
                // whew, parabolic fit:
                delta = p / q;
                u = x + delta;
                if (((u - min) < fract2) || ((max- u) < fract2)) {
                    delta = (mid - x) < 0 ? -Math.abs(fract1) : Math.abs(fract1);
                }
            }
        } else {
            // golden section:
            delta2 = (x >= mid) ? min - x : max - x;
            delta = GOLDEN * delta2;
        }

        // update current position:
        u = (Math.abs(delta) >= fract1) ? x + delta : (delta > 0 ? x + Math.abs(fract1) : x - Math.abs(fract1));
        fu = F.f(u);
        if (fu <= fx) {
            // good new point is an improvement!
            // update brackets:
            if (u >= x) {
                min = x;
            } else {
                max = x;
            }

            // update control points:
            v = w;
            w = x;
            x = u;
            fv = fw;
            fw = fx;
            fx = fu;
        } else {
            // Oh dear, point u is worse than what we have already,
            // even so it *must* be better than one of our endpoints:
            if (u < x) {
                min = u;
            } else {
                max = u;
            }

            if ((fu <= fw) || (w == x)) {
                // however it is at least second best:
                v = w;
                w = u;
                fv = fw;
                fw = fu;
            } else if ((fu <= fv) || (v == x) || (v == w)) {
                // third best:
                v = u;
                fv = fu;
            }
        }
    } while (--interations);

    return [x, fx];
}