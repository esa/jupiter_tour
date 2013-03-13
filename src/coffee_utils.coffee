@csutils = 
    # gives the the index of the individual with lowest fitness	
    championidx: (pop) ->
        min_idx = 0
        for idx in [1...pop.length]
            if pop[idx].f < pop[min_idx].f
                min_idx = idx
        
        return min_idx

    # gives you a random real number between lower and upper 
    random_real: (lower, upper=0) ->
        start = Math.random()
        if not lower?
            [lower, upper] = [0, lower]
        if lower > upper
            [lower, upper] = [upper, lower]
        return start * (upper - lower) + lower

    
    # gives you a random integer between lower and upper
    random_int: (lower, upper=0) ->
        start = Math.random()
        if not lower?
            [lower, upper] = [0, lower]
        if lower > upper
            [lower, upper] = [upper, lower]
        return Math.floor(start * (upper - lower + 1) + lower)

    
    # picks c individuals out of an array (returns an array of indices)
    choice: (arr, c) ->
        n = [0...arr.length]	# ... is exclusive range: [0...4] = [0,1,2,3]
        for i in [0...c]		
            idx = @random_int(i, arr.length-1)
            # swap elements
            [n[i], n[idx]] = [n[idx], n[i]]
        return n[0...c]

        
    # takes out an element of an array on position idx and returns 
    takeout: (arr, idx) ->
        return arr[0...idx].concat(arr[idx+1..])

        
    # adds up two arrays and returns a third one (provided both arrays have the same size)
    arr_add: (arr1, arr2) ->
        arr3 = []
        for i in [0...arr1.length]
            arr3.push(arr1[i] + arr2[i])
        return arr3

        
    # multiplies all entries of an array with a scalar (in place)
    arr_scalar: (arr, scalar) ->
        for x, i in arr
            arr[i] = x * scalar
        return arr
        
    # sums up an array
    arr_sum: (arr) ->
        s = 0.0
        for x in arr
            s += x
        return s
