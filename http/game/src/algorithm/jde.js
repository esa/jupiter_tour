/* Class JDE
Self-adaptive Differential Evolution Algorithm.
 */
algorithm.JDE = function (problem, generations, variant) {
    this._generations = generations || algorithm.JDE_GENERATIONS;
    this._generationsLeft = this._generations;
    this._variant = ((variant != null) ? variant : 2);
    this._problem = problem;
    this._finished = false;
    this._bestIndividual = null;
};

algorithm.JDE.prototype = {
    constructor: algorithm.JDE,

    _evolve: function (generations) {
        var problem = this._problem;
        var population = problem.getPopulation();

        if (population.length < 8) {
            throw 'The population needs to be at least 8 to evolve with jDE';
            return;
        }

        var popf = [];
        var popCr = [];
        for (var i = 0; i < population.length; i++) {
            popf.push(Math.random() * 0.9 + 0.1);
            popCr.push(Math.random());
        }

        for (var i = 0; i < generations; i++) {
            this._bestIndividual = population.min(function (individual) {
                return individual.getFitness();
            });

            var newPopulation = [];
            for (var j = 0; j < population.length; j++) {
                var individual = population[j];
                var tmpPopulation = population.clone().remove(j);
                var selection = utility.sampleU(0, tmpPopulation.length - 1, 3);
                var individual1 = tmpPopulation[selection[0]].clone();
                var individual2 = tmpPopulation[selection[1]].clone();
                var individual3 = tmpPopulation[selection[2]].clone();

                var f = (Math.random() >= 0.9 ? Math.random() * 0.9 + 0.1 : popf[j]);
                var cr = (Math.random() >= 0.9 ? Math.random() : popCr[j]);

                var mutant = individual3.multiplyScalar(-1).add(individual2).multiplyScalar(f).add(individual1);
                if (!problem.isFeasible(mutant)) {
                    mutant.resetRandom();
                }

                var newIndividual;
                switch (this._variant) {
                case 1:
                    var crossIndex = utility.randZ(0, problem.getDimension() - 1);
                    var mutantX = mutant.getChromosome();
                    var individualX = individual.getChromosome();
                    var resultX = [];
                    for (k = 0; k < aX.length; k++) {
                        if ((Math.random() <= cr) || (k == crossIndex)) {
                            resultX.push(mutantX[k]);
                        } else {
                            resultX.push(individualX[k]);
                        }
                    }
                    newIndividual = new datastructure.Individual(problem, resultX);
                    break;

                case 2:
                    var dim = this._problem.getDimension();
                    var n = utility.randZ(0, dim - 1);
                    var l = 0;
                    var individualX = individual.getChromosome();
                    var mutantX = mutant.getChromosome();
                    while (true) {
                        individualX[n] = mutantX[n];
                        n = (n + 1) % dim;
                        l++;
                        if ((Math.random() >= cr) || (l >= dim)) {
                            break;
                        }
                    }
                    newIndividual = new datastructure.Individual(problem, individualX);
                    break;

                default:
                    throw "jDE variant unknown, evolution aborted!";
                    return;
                }

                if (newIndividual.getFitness() < individual.getFitness()) {
                    newPopulation.push(newIndividual);
                    popf[j] = f;
                    popCr[j] = cr;
                } else {
                    newPopulation.push(individual);
                }
            }
            population = newPopulation;
        }
        this._problem.setPopulation(population);
    },

    evolve: function () {
        if (!this._finished) {
            if (this._generationsLeft) {
                this._evolve(10);
                this._generationsLeft--;
            } else {
                this._finished = true;
            }
        }
    },

    isFinished: function () {
        return this._finished;
    },

    existsSolution: function () {
        return (this._bestIndividual != null);
    },

    getSolution: function () {
        return this._bestIndividual.clone();
    }
};