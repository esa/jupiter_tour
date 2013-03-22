function kepE( E, M, eccentricity ){
        return ( E - eccentricity*Math.sin(E) - M );
}


function bind_kepE(M, eccentricity){

    this.M = M;
	this.eccentricity = eccentricity;

    this.f = function (x) {
        return kepE(x, M, eccentricity);
    }
}

function d_kepE( E, eccentricity){
        return ( 1 - eccentricity*Math.cos(E) );
}

function bind_d_kepE(eccentricity){

	this.eccentricity = eccentricity;

    this.f = function (x) {
        return d_kepE(x, eccentricity);
    }
}

function kepDE(DE, DM, sigma0, sqrta, a, R){
        return ( (-DM + DE + sigma0 / sqrta * (1 - Math.cos(DE)) - (1 - R / a) * Math.sin(DE)) );
}

function bind_kepDE(DM, sigma0, sqrta, a, R){

    this.DM = DM;
    this.sigma0 = sigma0;
    this.sqrta = sqrta;
    this.a = a;
	this.R = R;

    this.f = function (x) {
        return kepDE(x, DM, sigma0, sqrta, a, R);
    }
}

function d_kepDE(DE, sigma0, sqrta, a, R){
        return ( (1 + sigma0 / sqrta * Math.sin(DE) - (1 - R / a) * Math.cos(DE)) );
    }

function bind_d_kepDE(sigma0, sqrta, a, R){

    this.sigma0 = sigma0;
    this.sqrta = sqrta;
    this.a = a;
	this.R = R;

    this.f = function (x) {
        return d_kepDE(x, sigma0, sqrta, a, R);
    }
}
	
function kepDH(DH, DN, sigma0, sqrta, a, R){
        return ( -DN -DH + sigma0/sqrta * (Math.cosh(DH) - 1) + (1 - R / a) * Math.sinh(DH) );
    }
	
function bind_kepDH(DN, sigma0, sqrta, a, R){

    this.DN = DN;
    this.sigma0 = sigma0;
    this.sqrta = sqrta;
    this.a = a;
	this.R = R;

    this.f = function (x) {
        return kepDH(x, DN, sigma0, sqrta, a, R);
    }
}

function d_kepDH(DH, sigma0, sqrta, a, R){
        return ( -1 + sigma0 / sqrta * Math.sinh(DH) + (1 - R / a) * Math.cosh(DH) );
    }
	
	
function bind_d_kepDH(sigma0, sqrta, a, R){

    this.sigma0 = sigma0;
    this.sqrta = sqrta;
    this.a = a;
	this.R = R;

    this.f = function (x) {
        return d_kepDH(x, sigma0, sqrta, a, R);
    }
}
	