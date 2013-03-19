###
 Coffee script implementation of jde based on
    Brest, J., V. Zumer, and M. Sepesy Maucec. 
    "Self-adaptive differential evolution algorithm in constrained real-parameter optimization." 
    Evolutionary Computation, 2006. CEC 2006. IEEE Congress on. IEEE, 2006. 
 
 @author: mmarcusx@gmail.com
###

###
    classes
###
# the rastrigin-function is used as a toy problem for testing jde
class rastrigin
    constructor: (dim) ->
        # construct bounds
        @bounds = ([-5.12, 5.12] for x in [1..dim])
        @dim = dim
    
    # fitness function according to definition of Rastrigin
    objfun : (x) ->
        # error-check for correct dimension omitted
        omega = 2.0 * Math.PI
        s = ( xi*xi - 10.0 * Math.cos(omega * xi) for xi in x )
        
        # sum up s while using reduce technique
        return csutils.arr_sum(s) + @dim * 10
            
    feasible : (x) ->
        # error-checks for correct dimension omitted
        for elem, i in x
            if not (@bounds[i][0] <= elem <= @bounds[i][1])
                return false
        return true

# Used to instantiate individuals (initialized within the problem bounds by random)
class individual
    constructor: (prob) ->
        @x = (Math.random() * (b[1] - b[0]) + b[0] for b in prob.bounds)
        @f = prob.objfun(@x)

# class implementing the algorithm
class jde
    constructor: (variant=2) ->
        # variant=1 DE/rand/1, variant=2 DE/rand/1/exp
        # variant 2 is the default of PyGMO
        @variant = variant
        
    # Evolves an array of individuals (pop) for gen generations with respect to the problem prob.
    # During evolution, population will be changed.
    evolve : (pop, prob, gen) ->

        # if there are no generations to evolve, we have nothing to do.
        if gen is 0
            return pop
        
        # initialize mutation and crossover paramters
        pop_f = ( Math.random() * 0.9 + 0.1 for i in [1..pop.length] )
        pop_cr = ( Math.random() for i in [1..pop.length] )
        
        # evolutionary main-loop
        for i in [1..gen]
            # get best individual as it is a constant for all mutations
            best_idx = csutils.championidx(pop)
            new_pop = []
            
            # mutate each individual according to (DE/rand/1)-strategy
            for ind, j in pop
                tmp_pop = csutils.takeout(pop, j)
                r = csutils.choice(tmp_pop, 3)
                ind1_chr = tmp_pop[r[0]].x
                ind2_chr = tmp_pop[r[1]].x
                ind3_chr = tmp_pop[r[2]].x
                
                # adapt mutation and crossover factor
                f = if Math.random() >= 0.9 then Math.random() * 0.9 + 0.1 else pop_f[j]
                cr = if Math.random() >= 0.9 then Math.random() else pop_cr[j]
                
                # mutate
                mutant = csutils.arr_add(ind1_chr, csutils.arr_scalar(csutils.arr_add(ind2_chr,csutils.arr_scalar(ind3_chr, -1.0)),f))
                
                # checking feasibility and reshuffle if infeasible
                for v, k in mutant
                    if not (prob.bounds[k][0] <= v <= prob.bounds[k][1])
                        mutant[k] = csutils.random_real(prob.bounds[k][0], prob.bounds[k][1])

                # Crossover-switch for different strategies
                if @variant == 1	# DE/rand/1
                    new_chr = []
                    # pick one coefficient which will be crossovered for sure
                    sure_cross_idx = csutils.random_int(0, prob.dim - 1)

                    # apply binomial crossover
                    for v, k in ind.x
                        if (Math.random() <= cr) or (k == sure_cross_idx)
                            new_chr.push(mutant[k])
                        else 
                            new_chr.push(ind.x[k])

                else if @variant == 2 # DE/rand/1/exp
                    # pick a random start index
                    n = csutils.random_int(0, prob.dim-1)
                    new_chr = ind.x[..]
                    L = 0
                    while true
                        new_chr[n] = mutant[n]
                        n = (n + 1) % prob.dim
                        ++L
                        if (Math.random() >= cr) or (L >= prob.dim) then break
                else
                    alert("variant unknown, evolution aborted!")
                    return pop
                        
                # construct trial individual and evaluate fitness
                new_ind = 
                    x: new_chr
                    f: prob.objfun(new_chr)

                # select for new population if fitness is better
                if new_ind.f < ind.f 
                    new_pop.push(new_ind)
                    # use the successful parameters by now
                    pop_f[j] = f
                    pop_cr[j] = cr
                else 
                    new_pop.push(ind)
            
            # after all individuals are processed, swap population and go on with the next generation
            if pop[best_idx].f > new_pop[csutils.championidx(new_pop)].f
                console.log('generation ' + i + ' improved ' + pop[best_idx].f + ' --> ' + new_pop[csutils.championidx(new_pop)].f)
            pop = new_pop
        
        # after all generations are evolved, put out the evolved population
        return pop

### 
    functions
###
@jdebox =
    gen_rastrigin: ->
        v = document.getElementById('dimfield').value
        if 1 <= v <= 99
            dim = v 
        else 
            dim = 10
            document.getElementById('dimfield').value = 10
        
        @prob = new rastrigin(dim)
        document.getElementById('popbutton').disabled = false
    
    gen_pop: ->
        v = document.getElementById('popfield').value
        if 8 <= v <= 999
            p = v 
        else 
            p = 100
            document.getElementById('popfield').value = 100

        @alg = new jde()
        @pop = (new individual(@prob) for i in [1..p])
        document.getElementById('evolvebutton').disabled = false
        
    evolve: ->
        v = parseInt(document.getElementById('genfield').value)
        if 1 <= v <= 5000
            document.getElementById('evolvebutton').disabled = true
            @pop = @alg.evolve(@pop, @prob, v)
            document.getElementById('evolvebutton').disabled = false
            s = '<p>current fitness: ' + @pop[csutils.championidx(@pop)].f + '<p/>'
            s += 'decision vector: <ul>'
            for k in @pop[csutils.championidx(@pop)].x
                s += '<li>' + k + '</li>'
            s += '</ul>'
            document.getElementById('output').innerHTML= s
        else
            alert('Enter a number of generations between 1 and 5000')
