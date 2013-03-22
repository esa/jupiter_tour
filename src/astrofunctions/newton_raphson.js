function newton_raphson(x, F, dF, max_loop, accuracy)
	{
		var term;
		//double start = x; //DS: unused
		//main iteration
		do
		{
			// console.log("F(x): " + F.f(x));
			// console.log("dF(x): " + dF.f(x));
		
			term = F.f(x) / dF.f(x);
			x = x - term;
		}
		// check if term is within required accuracy or loop limit is exceeded
		while ((Math.abs(term / Math.max(Math.abs(x), 1.)) > accuracy) && (--max_loop));
		
		return x;
	}
