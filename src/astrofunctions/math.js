
(function(){


function cross(vector1, vector2)
{
    return [
        ((vector1[1]*vector2[2]) - (vector1[2]*vector2[1])),
        ((vector1[2]*vector2[0]) - (vector1[0]*vector2[2])),
        ((vector1[0]*vector2[1]) - (vector1[1]*vector2[0]))
    ];
}

function dot(vector1, vector2)
{
    return (
        (vector1[0]*vector2[0]) +
        (vector1[1]*vector2[1]) +
        (vector1[2]*vector2[2])
    );
}

// L2-norm = sqrt(x^2 + y^2 + z^2)
function magnitude(vector1)
{
    return Math.sqrt(
        dot(vector1, vector1)
    );
}

function normalise(vector1)
{
    var mag = magnitude(vector1);
    return [
        (vector1[0]/mag),
        (vector1[1]/mag),
        (vector1[2]/mag) 
    ];
}

function addition(vector1, vector2)
{
    return [
        (vector1[0]+vector2[0]),
        (vector1[1]+vector2[1]),
        (vector1[2]+vector2[2])
    ];
}

function subtraction(vector1, vector2)
{
    return [
		(vector1[0]-vector2[0]),
        (vector1[1]-vector2[1]),
		(vector1[2]-vector2[2])
    ];
}

function multiplication(vector1, scalar)
{
    return [
        (vector1[0]*scalar),
        (vector1[1]*scalar),
        (vector1[2]*scalar)
    ];
}

function division(vector1, scalar)
{
    return [
        (vector1[0]/scalar),
        (vector1[1]/scalar),
        (vector1[2]/scalar)
    ];
}

/*
    Converts the cartesian coordiantes (x, y) into polar for (radius, angle).
*/
function cart2polar(vector)
{
    var radius = magnitude(vector);
    var theta;

    if (vector[0] == 0 && vector[1] == 0) {
        theta = 0;
    } else if (vector[1] >= 0) {
        theta = Math.acos(vector[0]/radius);
    } else if (vector[1] < 0) {
        theta = (2*Math.PI) - Math.acos(vector[0]/radius);
    }

    theta *= RAD2DEG;

    return {rad : radius, angle : theta};
}


core.cross = cross;
core.dot = dot;
core.magnitude = magnitude;
core.normalise = normalise;
core.addition = addition;
core.subtraction = subtraction;
core.multiplication = multiplication;
core.division = division;

core.cart2polar = cart2polar;



})();



///////////////////////////////////////////////////////////////////////////////

// extend the maths class with these functions

Math.cosh = function(arg)
{
    return (Math.exp(arg) + Math.exp(-arg))/2;
}

Math.sinh = function(arg) 
{
    return (Math.exp(arg) - Math.exp(-arg))/2;
}

Math.acosh = function(arg)
{
    return Math.log(arg + Math.sqrt(arg*arg-1));
}

Math.asinh = function(arg)
{
    return Math.log(arg + Math.sqrt(arg*arg+1));
}

///////////////////////////////////////////////////////////////////////////////
