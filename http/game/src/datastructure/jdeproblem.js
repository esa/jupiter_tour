/* Class JDE-Problem
    Every Class inheriting from this class can be used with the JDE Class.
*/
datastructure.JDEProblem = function () {
    this._dimension = 0;
    this._bounds = [];
    this._population = [];
    this._populationSize = 0;
};
datastructure.JDEProblem.prototype = {
    constructor: datastructure.JDEProblem,

    _resetPopulation: function () {
        this._population = [];
        for (var i = 0; i < this._populationSize; i++) {
            this._population.push(new datastructure.Individual(this));
        }
    },

    getPopulation: function () {
        return this._population.clone();
    },

    setPopulation: function (population) {
        this._population = population.clone();
    },

    getBounds: function () {
        return this._bounds.clone();
    },

    getDimension: function () {
        return this._dimension;
    },

    objectiveFunction: function () {
        return 0;
    },

    isFeasible: function (individual) {
        var chromosome = individual.getChromosome();
        for (var i = 0; i < chromosome.length; i++) {
            var value = chromosome[i];
            if (!((this._bounds[i][0] <= value && value <= this._bounds[i][1]))) {
                return false;
            }
        }
        return true;
    }
};