function flyByDv(vIn, vOut, phase, moon)
{    
    var vInfIn = subtraction(vIn, phase.v);
    var vInfOut = subtraction(vOut, phase.v);

    if (magnitude(vInfOut) < magnitude(vInfIn)) {
        var V1 = vInfOut;
        var V2 = vInfIn;
    } else {
        var V1 = vInfIn;
        var V2 = vInfOut;
    }

    var v1 = magnitude(V1);
    var v2 = magnitude(V2);

    var turnAngle = Math.acos(dot(vInfIn, vInfOut)/(magnitude(vInfIn)*magnitude(vInfOut)));

    var rmin = (moon.radius * moon.safeRadius);

    var alpha = Math.asin(1 / (1+ (v1*v1) * rmin     / moon.mu));                     // half flyby turn angle at minimum flyby radius (from v1, smaller magnitude)

    var q = Math.max(turnAngle-2*alpha, 0);                             // excess turn angle -- check syntax

    var dv = Math.abs(Math.sqrt((v1*v1) + (v2*v2) -2 *v1*v2*Math.cos(q)));             // law of cosine

    var rp = body.mu * (1/Math.sin(turnAngle/2)-1)/(v1*v1);
    rp = (rp < rmin) ? rmin : rp;                              // If rp < rmin, then assign rp = rmin

// check for NaN !!!!

    //var dv = Math.abs(magnitude(vInfIn) - magnitude(vInfOut));

    // rp = flyby radius
    //var rp = (body.gm/(magnitude(vInfIn)*magnitude(vInfIn))) * ((1/Math.sin(turnAngle/2)) - 1);

    return {dv : dv, rp : rp};
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