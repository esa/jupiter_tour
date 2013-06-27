###
 MGA-1DSM incipit: getting captured in the jupiter system.
 
 @author: mmarcusx@gmail.com
###

###
    classes
###

# chromosome: [t0,u,v,T0] + [beta1, rp1/rP1, eta1,T1] + ...
class core.mga_incipit
    constructor: (seq, tof, t0) ->
        # check the body-sequence
        if seq.length < 1
            throw 'ValueError: sequence needs at least one body'
        
        # check for consistency of the time of flight
        if tof.length isnt (seq.length) 
            throw 'ValueError: tof sequence has the wrong length'
        
        invalid_tof = (t for t in tof when t.length isnt 2)
        
        if invalid_tof.length isnt 0
            throw 'ValueError: tof sequence must consist of 2-tuples'
            
        # check for starting epoch etc. 
        if t0.length isnt 2
            throw 'ValueError: starting epoch needs to be a 2 tuple'
            
        @seq = seq
        @tof = tof
        @t0 = t0
        
        # dimension and bounds
        @dim = 4 * (seq.length)
        
        @bounds = ([0,0] for x in [1..@dim])
        @bounds[0] = t0
        @bounds[1] = [0,1]
        @bounds[2] = [0,1]
        @bounds[3] = tof[0]
        for i in [4...@bounds.length]
            j = Math.floor(i / 4)
            if i % 4 is 0 
                @bounds[i] = [-2 * Math.PI, 2 * Math.PI] 
            else if i % 4 is 1 
                @bounds[i] = [seq[j].safeRadius / seq[j].radius, (seq[j].radius + 2000000) / seq[j].radius]
            else if i % 4 is 2
                @bounds[i] = [1e-5, 1.0-1e-5]
            else if i % 4 is 3
                @bounds[i] = tof[j+1]
    
    # changing the bounds
    set_beta : (x) ->
        if x.length isnt @seq.length - 1
            throw 'ValueError: New bounds did not match problem dimension.'
        
        for i in [4...@bounds.length]
            if i % 4 is 0 
                j = Math.floor(i / 4)
                low = if -2 * Math.PI > x[j].lower then -2 * Math.PI else x[j].lower
                up = if 2 * Math.PI < x[j].upper then 2 * Math.PI else x[j].upper
                @bounds[i] = [low, up] 
        
        return @bounds
 
    set_rp : (x) ->
        if x.length isnt @seq.length - 1
            throw 'ValueError: New bounds did not match problem dimension.'

        for i in [4...@bounds.length]
            if i % 4 is 1 
                j = Math.floor(i / 4)
                minlow = @seq[j].safeRadius / @seq[j].radius
                maxhigh = (@seq[j].radius + 2000000) / @seq[j].radius
                low = if minlow > x[j].lower then minlow else x[j].lower
                up = if maxhigh < x[j].upper then maxhigh else x[j].upper
                @bounds[i] = [low, up] 
        
        return @bounds
        
    set_tof : (x) ->
        if x.length isnt @seq.length
            throw 'ValueError: New bounds did not match problem dimension.'
        
        for i in [0...@bounds.length]
            if i % 4 is 3 
                @bounds[i] = x[Math.floor(i / 4)] 
        
        return @bounds

    # fitness function
    objfun : (x) ->
        # 1. extract the tof-sequence of the chromosome
        T = (x[i] for i in [0...@dim] when (i + 1) % 4 is 0)

        # 2. epochs and ephemerides of the planetary encounters
        t_P = (x[0] + arr_sum(T[...i+1]) for planet, i in @seq)
        eph_m = (core.planet_ephemerides(t_P[i], planet) for planet, i in @seq)
        
        # 3. We start with the first leg: a lambert arc
        theta = 2 * Math.PI * x[1]
        phi = Math.acos(2 * x[2] - 1) - (Math.PI / 2)
        r = [Math.cos(phi) * Math.sin(theta), Math.cos(phi)*Math.cos(theta), Math.sin(phi)]
        r = (R_JUP*1000*d for d in r)
        
        lp = core.lambert_problem(r, eph_m[0].r, T[0]*DAY2SEC, false)
        
        # 4. Lambert arc to reach seq[1]
        v_end_l = lp.v2
        v_beg_l = lp.v1
        
        # The first DSM occurs at the very beginning (will be cancelled by the optimizer)
        dv = [Math.abs(core.magnitude(v_beg_l) - 3400)]
            
        # 5. We proceed with looping over each successive leg
        for i in [1...@seq.length]
            v_out = core.fb_prop(v_end_l, eph_m[i-1].v, x[4*i], x[1+4*i]*@seq[i-1].radius, @seq[i-1].mu)
            pl = core.propagate_lagrangian(eph_m[i-1].r, v_out, x[4*i+2]*T[i]*DAY2SEC, MU_JUP)
            dt = (1-x[4*i+2])*T[i]*DAY2SEC
            lp = core.lambert_problem(pl.r, eph_m[i].r, dt, false)
            v_end_l = lp.v2
            v_beg_l = lp.v1
            dv.push(core.magnitude(core.subtraction(v_beg_l, pl.v)))
            
        # sum up Delta-Vs
        return arr_sum(dv)

    # simple feasibility check
    feasible : (x) ->
        # error-checks for correct dimension omitted
        for elem, i in x
            if not (@bounds[i][0] <= elem <= @bounds[i][1])
                return false
        return true
