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
        @vi_inf = v_inf
        
        # dimension and bounds
        @dim = 4 * (seq.length - 1)
        
        @bounds = ([0,0] for x in [1..@dim])
        for i in [0...@bounds.length]
            console.log(i)
            if i % 4 is 0 
                @bounds[i] = [-2 * Math.PI, 2 * Math.PI] 
            else if i % 4 is 1 
                @bounds[i] = [1.1, 30]
            else if i % 4 is 2
                @bounds[i] = [1e-5, 1.0-1e-5]
            else if i % 4 is 3
                console.log(tof[0])
                @bounds[i] = tof[Math.floor(i / 4)]
        console.log(@bounds)
    
    # fitness function
    objfun : (x) ->
        # 1. extract the tof-sequence of the chromosome
        T = (x[i] for i in [0...@dim] when (i + 1) % 4 is 0)
        
        # Epochs and Ephemerides of the planetary encounters
        t_P = []
        for planet, i in @seq
            t_P[i] = arr_sum(T[...i])
        console.log(T)
        console.log(t_P)
        
        return 0
    
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
        prob = new core.mga_part([europa, io, europa], [[4, 50],[5,60]], 23, 24)
    catch error
        alert(error)
    document.getElementById('popbutton').disabled = false
    return prob