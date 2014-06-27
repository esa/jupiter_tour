Math.cosh = function (arg) {
    return (Math.exp(arg) + Math.exp(-arg)) / 2;
};

Math.sinh = function (arg) {
    return (Math.exp(arg) - Math.exp(-arg)) / 2;
};

Math.acosh = function (arg) {
    return Math.log(arg + Math.sqrt(arg * arg - 1));
};

Math.asinh = function (arg) {
    return Math.log(arg + Math.sqrt(arg * arg + 1));
};