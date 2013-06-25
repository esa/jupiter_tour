(function (){

/**
	Calculates the current mass of the spacecraft due to propellant use
*/
function calculate_sc_mass(){
	tour.m_sc = m_spacecraft_init * Math.exp(-(tour.total_dv/(3500*g)));
}

core.calculate_sc_mass = calculate_sc_mass;
})();