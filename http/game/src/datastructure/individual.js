/* Class Individual
    Used for evolutionary algorithms
*/
datastructure.Individual = function (problem, chromosome) {
    this._problem = problem;
    if (chromosome) {
        this._chromosome = chromosome.clone();
    } else {
        this._chromosome = [];
        var bounds = problem.getBounds();
        for (var i = 0; i < bounds.length; i++) {
            var bound = bounds[i];
            this._chromosome.push(utility.randR(bound[0], bound[1]));
        }
    }
    this._fitness = null;
};
datastructure.Individual.prototype = {
    constructor: datastructure.Individual,

    getFitness: function () {
        if (this._fitness == null) {
            this._fitness = this._problem.objectiveFunction(this);
        }
        return this._fitness;
    },

    getChromosome: function () {
        return this._chromosome.clone();
    },

    add: function (individual) {
        var otherChromosome = individual.getChromosome();
        for (var i = 0; i < this._chromosome.length; i++) {
            this._chromosome[i] += otherChromosome[i];
        }
        this._fitness = null;
        return this;
    },

    multiplyScalar: function (scalar) {
        for (var i = 0; i < this._chromosome.length; i++) {
            this._chromosome[i] *= scalar;
        }
        this._fitness = null;
        return this;
    },

    resetRandom: function () {
        var bounds = this._problem.getBounds();
        for (var i = 0; i < this._chromosome.length; i++) {
            this._chromosome[i] = utility.randR(bounds[i][0], bounds[i][1]);
        }
        this._fitness = null;
        return this;
    },

    clone: function () {
        return new datastructure.Individual(this._problem, this.getChromosome());
    }
};