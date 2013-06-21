###
 MGA-1DSM part: jumping from one moon to another
 
 @author: mmarcusx@gmail.com
###

###
    classes
###

# chromosome: [beta1, rp1/rP1, eta1, T1] + [beta2, rp2/rP2, eta2, T2] + ...
class core.mga_part
    constructor: (seq, tof, t0, v_inf) ->
        # check the body-sequence
        if seq.length < 2
            throw 'ValueError: sequence needs at least two bodies'
        
        # check for consistency of the time of flight
        if tof.length isnt (seq.length - 1) 
            throw 'ValueError: tof sequence has the wrong length'
        
        invalid_tof = (t for t in tof when t.length isnt 2)
        
        if invalid_tof.length isnt 0
            throw 'ValueError: tof sequence must consist of 2-tuples'
            
        @seq = seq
        @tof = tof
        @t0 = t0
        @v_inf = v_inf
        
        # dimension and bounds
        @dim = 4 * (seq.length - 1)
        
        @bounds = ([0,0] for x in [1..@dim])
        for i in [0...@bounds.length]
            j = Math.floor(i / 4)
            if i % 4 is 0 
                @bounds[i] = [-2 * Math.PI, 2 * Math.PI] 
            else if i % 4 is 1 
                @bounds[i] = [seq[j].safeRadius / seq[j].radius, (seq[j].radius + 2000000) / seq[j].radius]
            else if i % 4 is 2
                @bounds[i] = [1e-5, 1.0-1e-5]
            else if i % 4 is 3
                @bounds[i] = tof[j]
    
    # changing the bounds
    set_beta : (x) ->
        if x.length isnt @seq.length - 1
            throw 'ValueError: New bounds did not match problem dimension. Give one 2-tuple per leg!'
        
        for i in [0...@bounds.length]
            if i % 4 is 0 
                j = Math.floor(i / 4)
                low = if -2 * Math.PI > x[j].lower then -2 * Math.PI else x[j].lower
                up = if 2 * Math.PI < x[j].upper then 2 * Math.PI else x[j].upper
                @bounds[i] = [low, up] 
        
        return @bounds
 
    set_rp : (x) ->
        if x.length isnt @seq.length - 1
            throw 'ValueError: New bounds did not match problem dimension. Give one 2-tuple per leg!'

        for i in [0...@bounds.length]
            if i % 4 is 1 
                j = Math.floor(i / 4)
                minlow = @seq[j].safeRadius / @seq[j].radius
                maxhigh = (@seq[j].radius + 2000000) / @seq[j].radius
                low = if minlow > x[j].lower then minlow else x[j].lower
                up = if maxhigh < x[j].upper then maxhigh else x[j].upper
                @bounds[i] = [low, up] 
        
        return @bounds
        
    set_tof : (x) ->
        if x.length isnt @seq.length - 1
            throw 'ValueError: New bounds did not match problem dimension. Give one 2-tuple per leg!'
        
        for i in [0...@bounds.length]
            if i % 4 is 3 
                @bounds[i] = x[Math.floor(i / 4)] 
        
        return @bounds

    # fitness function
    objfun : (x) ->
        # 1. extract the tof-sequence of the chromosome
        T = (x[i] for i in [0...@dim] when (i + 1) % 4 is 0)
        
        # 2. epochs and ephemerides of the planetary encounters
        t_P = (@t0 + arr_sum(T[...i]) for planet, i in @seq)
        eph_m = (core.planet_ephemerides(t_P[i], planet) for planet, i in @seq)
        
        # 3. loop over legs and compute and propagate
        v_end_l = arr_add(@v_inf, eph_m[0].v)
        dv = []

        for planet, i in @seq[...@seq.length-1]
            v_out = core.fb_prop(v_end_l, eph_m[i].v, x[i*4], x[i*4+1]*planet.radius, planet.mu)
            pl = core.propagate_lagrangian(eph_m[i].r, v_out, x[i*4+2]*x[i*4+3]*DAY2SEC, MU_JUP)
            dt = (1-x[i*4+2])*x[i*4+3]*DAY2SEC
            lp = core.lambert_problem(pl.r, eph_m[i+1].r, dt, false)
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
        
###
    main namespace
###
test.gen_mga_part = ->
    console.log('generate mga_part')
    try
        prob = new core.mga_part([europa, europa, europa], [[1, 50], [1,50]], 62544.0, [1500.0, 350, 145.0])
    catch error
        alert(error)
    document.getElementById('popbutton').disabled = false
    return prob