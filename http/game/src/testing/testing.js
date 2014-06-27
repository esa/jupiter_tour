/* Namespace TESTING
    Run stuff to test here and open /game/testing.html */
var testing = {};

(function () {

    // DON'T EDIT SOMETHING ABOVE HERE

    function testUnit1(tGameID) {
        tGameID = 'mission1';

        function onData(missionData) {

            /*Earth to jupiter test
            Output from PaGMO:
            
            print prob.pretty(pop.champion.x,extended_output=True)
            
            First Leg: earth to venus
            Departure: 2015-Sep-17 13:49:13.018828 (5.738575845125329e+03 mjd2000)
            Duration: 1.507046600570814e+02 days
            r_dep: [149583595557.75269, -15337960616.091324, 548575.35572931892]
            v_dep: [3.5334116211911351, 25232.374564243608, 10.735098755528009]
            VINF_dep: 4.990055266783869e+03 m/sec
            r_arr: [-24057420511.669647, -105935429575.91315, -64140441.994200706]
            v_arr: [31097.041747761625, -18272.317776357406, -9.5870961783174042]
            VINF_arr: 1.094470796223111e+04 m/sec
            DSM after 9.136592768999805e+00 days
            DSM magnitude: 2.742936762540357e+02 m/s

            leg no: 2: venus to earth
            Duration: 3.419969460459592e+02 days
            Fly-by epoch: 2016-Feb-15 06:43:55.647760 (5.889280505182410e+03 mjd2000) 
            Fly-by radius: 1.840531035090356e+00 planetary radii
            r_dep: [-24057420511.669647, -105935429575.91315, -64140441.994200706]
            v_dep: [35372.459518480355, -18562.94215610536, -83.113815145994579]
            VINF_dep: 1.094470796223111e+04 m/sec
            r_arr: [-78452831459.389038, 124591551468.78223, -4835891.8083695658]
            v_arr: [-20109.753861700523, -24601.892914603603, 91.561260236048497]
            VINF_arr: 1.026803366180529e+04 m/sec
            DSM after 9.140539925562753e+01 days
            DSM magnitude: 1.256212502921448e+03m/s

            leg no: 3: earth to earth
            Duration: 1.099851096430831e+03 days
            Fly-by epoch: 2017-Jan-22 06:39:31.786131 (6.231277451228370e+03 mjd2000) 
            Fly-by radius: 5.987001833434425e+00 planetary radii
            r_dep: [-78452831459.389038, 124591551468.78223, -4835891.8083695658]
            v_dep: [-21742.469866704316, -25459.523146788677, 237.95417521138438]
            VINF_dep: 1.026803366180529e+04 m/sec
            r_arr: [-87302996707.747314, 118637493987.40306, -5412028.9030173849]
            v_arr: [-20076.948222886087, -26979.107290030002, 205.26624741208707]
            VINF_arr: 1.021062062188797e+04 m/sec
            DSM after 6.612792893993073e+02 days
            DSM magnitude: 1.912616373723135e+02m/s

            leg no: 4: earth to jupiter
            Duration: 8.606481314913921e+02 days
            Fly-by epoch: 2020-Jan-27 03:05:06.517755 (7.331128547659200e+03 mjd2000) 
            Fly-by radius: 3.780328848710509e+01 planetary radii
            r_dep: [-87302996707.747314, 118637493987.40306, -5412028.9030173849]
            v_dep: [-20339.037643596203, -27101.764890136525, 71.570311220487028]
            VINF_dep: 1.021062062188797e+04 m/sec
            r_arr: [737418501401.09229, -90667650738.883972, -16126736596.559322]
            v_arr: [1001.454778433676, 5059.5289201269507, -74.897730861805243]
            VINF_arr: 8.537998315687802e+03 m/sec
            DSM after 1.377456958553074e+02 days
            DSM magnitude: 1.613507623256787e+04m/s

            Arriving at jupiter
            Arriving epoch: 2022-Jun-05 18:38:25.078611 (8.191776679150593e+03 mjd2000) 
            Arriving Vinf: 8.537998315687802e+03m/s
            Total mission time: 6.716497834429197e+00 years
            
            */

            var centralBodyData = missionData.mission.centralBody;
            var sun = new gui.CentralBody(1, centralBodyData.name, centralBodyData.sgp, centralBodyData.radius, centralBodyData.scale, centralBodyData.isStar, centralBodyData.meshMaterialURL);

            var venusData = missionData.mission.orbitingBodies['4'];
            var venus = new gui.OrbitingBody(2, venusData.name, sun, venusData.orbitalElements, venusData.orbitalElementDerivatives, venusData.refEpoch,
                venusData.sgp, venusData.radius, venusData.minRadiusFactor, venusData.maxRadiusFactor, venusData.maxTimeOfFlyby, venusData.scale, venusData.meshMaterialURL, venusData.surface);

            var earthData = missionData.mission.orbitingBodies['5'];
            var earth = new gui.OrbitingBody(2, earthData.name, sun, earthData.orbitalElements, earthData.orbitalElementDerivatives, earthData.refEpoch,
                earthData.sgp, earthData.radius, earthData.minRadiusFactor, earthData.maxRadiusFactor, earthData.maxTimeOfFlyby, earthData.scale, earthData.meshMaterialURL, earthData.surface);

            var jupiterData = missionData.mission.orbitingBodies['7'];
            var jupiter = new gui.OrbitingBody(2, jupiterData.name, sun, jupiterData.orbitalElements, jupiterData.orbitalElementDerivatives, jupiterData.refEpoch,
                jupiterData.sgp, jupiterData.radius, jupiterData.minRadiusFactor, jupiterData.maxRadiusFactor, jupiterData.maxTimeOfFlyby, jupiterData.scale, jupiterData.meshMaterialURL, jupiterData.surface);

            var referenceChromosome = [5694.703447279246 + 51544,
 0.5592076998636516,
 0.6603929565806119,
 4305.108010971594,
 0.11370665594868822,
 158.317062323004,
 4.070798349768714,
 1.7787431900564028,
 0.5893383424248945,
 314.0791211177477,
 5.1541622014528805,
 1.57861328849236,
 0.10007192012704758,
 844.8559777549118,
 -1.6651989511241556,
 1.4848141962553134,
 0.04440580781718439,
 651.723019311254];

            console.log('Test 1: Chromosome validation');

            var sequence = [earth, venus, earth, earth, jupiter];
            var firstLeg = new gui.FirstLeg(referenceChromosome.slice(0, 6), sequence[0], sequence[1])
            var firstProb = new astrodynamics.MGA1DSM(sequence[0], sequence[1], [0, 0], [0, 0], [0, 0]);
            var firstIndividual = new datastructure.Individual(firstProb, referenceChromosome.slice(0, 6));
            console.log(firstIndividual.getFitness());
            var velocityInf = firstLeg.getArrivingVelocityInf();
            var epoch = referenceChromosome[0]
            console.log(velocityInf.clone().add(sequence[1].orbitalStateVectorsAtEpoch(epoch + referenceChromosome[5]).velocity).toString());
            epoch += referenceChromosome[5];
            for (var i = 0; i < 3; i++) {
                var currentChromosome = referenceChromosome.slice(i * 4 + 6, 6 + i * 4 + 4);
                var leg = new gui.Leg(currentChromosome, sequence[i + 1], sequence[i + 2], velocityInf, epoch);
                var problem = new astrodynamics.MGAPart(sequence[i + 1], sequence[i + 2], epoch, velocityInf, [0, 0], [0, 0], [0, 0]);
                var individual = new datastructure.Individual(problem, currentChromosome);
                var deltaV = individual.getFitness();

                velocityInf = leg.getArrivingVelocityInf();
                console.log(deltaV);
                console.log(velocityInf.clone().add(sequence[i + 2].orbitalStateVectorsAtEpoch(epoch + currentChromosome[3]).velocity).toString());
                epoch += currentChromosome[3];
            }

            console.log("\n\n");
            /* Chromosome Check
            PaGMO output:
            Lower bounds: [5000, 0, 0, 0, 1.0000000000000001e-05, 120, -6.2831853071795862, 1.1000000000000001, 1.0000000000000001e-05, 300, -6.2831853071795862, 1.1000000000000001, 1.0000000000000001e-05, 720, -6.2831853071795862, 1.1000000000000001, 1.0000000000000001e-05, 300]
	        Upper bounds: [7000, 1, 1, 5000, 0.99999000000000005, 180, 6.2831853071795862, 100, 0.99999000000000005, 350, 6.2831853071795862, 100, 0.99999000000000005, 900, 6.2831853071795862, 100, 0.99999000000000005, 1000]
            
            */
            console.log('Test 2: Chromosome approximation');

            bounds = [
                [[5694.6977525757984 + 51544, 5694.7091419826929 + 51544],
 [0.55920714065595178, 0.55920825907135141],
 [0.66039229618765538, 0.66039361697356846],
 [4305.1037058635829, 4305.1123160796051],
 [0.11370654224203226, 0.11370676965534417],
 [158.31690400594167, 158.31722064006632]]
,
               [[4.0707942789703644, 4.0708024205670643],
 [1.7787414113132127, 1.7787449687995929],
 [0.58933775308655201, 0.58933893176323693],
 [314.07880703862662, 314.07943519686881]]
,
                [[5.1541570472906795, 5.1541673556150815],
 [1.5786117098790715, 1.5786148671056486],
 [0.10007182005512745, 0.1000720201989677],
 [844.85513289893402, 844.85682261088959]]

,
 [[-1.6651972859252044, -1.6652006163231068],
 [1.4848127114411172, 1.4848156810695097],
 [0.044405763411376573, 0.044405852222992204],
 [651.72236758823465, 651.72367103427337]]
];

            var testChromosome = [];
            var velocityInf = null;
            var epoch = 0;
            var totalDeltaV = 0;
            for (var i = 0; i < sequence.length - 1; i++) {
                var currentBounds = bounds[i];
                if (i == 0) {
                    var problem = new astrodynamics.MGA1DSM(sequence[i], sequence[i + 1], currentBounds[0], currentBounds[3], currentBounds[5]);
                    var solver = new algorithm.JDE(problem, 50);
                    while (!solver.isFinished()) {
                        solver.evolve();
                    }
                    var individual = solver.getSolution();
                    var currentChromosome = individual.getChromosome();
                    var deltaV = individual.getFitness();
                    console.log('Leg ' + (i + 1));
                    console.log('DeltaV: ' + deltaV);
                    console.log('ToF: ' + currentChromosome[5]);
                    totalDeltaV += deltaV;
                    epoch = currentChromosome[0] + currentChromosome[5];
                    var leg = new gui.FirstLeg(currentChromosome, sequence[i], sequence[i + 1]);
                    velocityInf = leg.getArrivingVelocityInf();
                    testChromosome.push.apply(testChromosome, currentChromosome);
                } else {
                    var problem = new astrodynamics.MGAPart(sequence[i], sequence[i + 1], epoch, velocityInf, currentBounds[3], currentBounds[1], currentBounds[0]);
                    var solver = new algorithm.JDE(problem, 50);
                    while (!solver.isFinished()) {
                        solver.evolve();
                    }
                    var individual = solver.getSolution();
                    var currentChromosome = individual.getChromosome();
                    var deltaV = individual.getFitness();
                    console.log('Leg ' + (i + 1));
                    console.log('DeltaV: ' + deltaV);
                    console.log('ToF: ' + currentChromosome[3]);
                    totalDeltaV += deltaV;
                    var currentChromosome = individual.getChromosome();
                    var leg = new gui.Leg(currentChromosome, sequence[i], sequence[i + 1], velocityInf, epoch);
                    epoch += currentChromosome[3];
                    velocityInf = leg.getArrivingVelocityInf();
                    testChromosome.push.apply(testChromosome, currentChromosome);
                }
            }
            console.log('Approximated chromosome:');
            console.log(testChromosome.prettyPrint());
            console.log('Absolute chromosome differences:');
            for (var i = 0; i < testChromosome.length; i++) {
                console.log(Math.abs(referenceChromosome[i] - testChromosome[i]));
            }
            console.log('DeltaV ' + totalDeltaV);

        }

        $.ajax({
            type: 'GET',
            url: '/missions/mission1.json',
            dataType: 'json',
            success: onData
        });
    }

    function testUnit2() {
        var div = document.createElement('div');
        div.style.width = '50%';
        div.style.height = '50%';
        div.style.position = 'absolute';
        div.style.left = '25%';
        div.style.top = '10%';
        div.style.backgroundColor = 'red';

        var mouseDriver = new utility.MouseDriver(div);
        document.body.appendChild(div);
        mouseDriver.registerLeftClick(function () {
            console.log('Left Click');
        });
        mouseDriver.registerLeftDblClick(function () {
            console.log('Left Double Click');
        });
        mouseDriver.registerRightClick(function () {
            console.log('Right Click');
        });
        mouseDriver.registerRightDblClick(function () {
            console.log('Right Double Click');
        });
        mouseDriver.registerMouseWheel(function () {
            console.log('Mouse Wheel');
        });
        mouseDriver.registerLeftDrag(function () {
            console.log('Left Drag');
        });
        mouseDriver.registerRightDrag(function () {
            console.log('Right Drag');
        });
    }


    //DON'T EDIT SOMETHING BELOW HERE

    // Exposed interface
    testing.testUnit = testUnit2;
})();