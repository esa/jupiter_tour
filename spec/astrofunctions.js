describe("Astrofunctions", function() {
  
  beforeEach(function() {
    this.addMatchers({
        // custom matcher: for fuzzy comparison
        toBeRoughly: function(expected, threshold) {
            var notText = this.isNot ? " not" : "";

            this.message = function () {
                return "Expected " + this.actual + notText + " to be roughly " + expected + " (+/- " + threshold + ")";
            }
            
            return Math.abs(this.actual - expected) < threshold;
        },
        toBeRoughly3d: function(expected, threshold) {
            var notText = this.isNot ? " not" : "";

            this.message = function () {
                return "Expected " + this.actual + notText + " to be roughly " + expected + " (+/- " + threshold + ")";
            }
            
            return    Math.abs(this.actual[0] - expected[0]) < threshold
                   && Math.abs(this.actual[1] - expected[1]) < threshold
                   && Math.abs(this.actual[2] - expected[2]) < threshold;
        }
        
    });
    
  });
  
  it("should give the correct Ephemerides for the starting epoch of moon io", function() {

    var r = [-179933493.46170574, -381174974.8098445, -171919.34194670935];
    var v = [15717.641297897215, -7340.312241016185, 9.901054671310696];

    expect(core.planet_ephemerides(ref_epoch, io).r).toBeRoughly3d(r, 1);
    expect(core.planet_ephemerides(ref_epoch, io).v).toBeRoughly3d(v, 1);

    });
    
  it("should give the correct Ephemerides of moon io also after 100 days", function() {

    var r = [278741806.86788034, 316881317.2503618, 231876.79641820115];
    var v = [-12959.548493309301, 11499.174770045818, -7.4778283823001];

    expect(core.planet_ephemerides(ref_epoch+100, io).r).toBeRoughly3d(r, 1);
    expect(core.planet_ephemerides(ref_epoch+100, io).v).toBeRoughly3d(v, 1);
    
    });

  it("should compute the correct DV for a simple tour from io to europa", function() {
  
    var v_inf = [1500,350,145];
    
    // values from mga_part in PyGMO
    var chr = [1.9105038094331377, 1.6531323639559847, 0.81814161120347129, 92.637111348757628];

    var fitness = 20577.830110061255;

    var prob = new core.mga_part([io, europa], [[1, 100]], ref_epoch, v_inf);
   
    expect(prob.objfun(chr)).toBeRoughly(fitness, 1);
    });


  it("should compute the correct DV for a simple tour from io back to io", function() {
  
    var v_inf = [100.0, 0, -500.0];
    
    // values from mga_part in PyGMO
    var chr1 = [2.4010549877068,2.0816293855167602,0.01459456823868094,6.9219923482929655];
    var chr2 = [5.41200322310228, 1.753256022750357, 0.7877476324893331, 22.44665921907404];

    var fitness1 = 6237.4336110824097;
    var fitness2 = 21105.977080107088;

    var prob = new core.mga_part([io, io], [[1, 100]], ref_epoch, v_inf);
    
    expect(prob.objfun(chr1)).toBeRoughly(fitness1, 1);
    expect(prob.objfun(chr2)).toBeRoughly(fitness2, 1);
    });

  it("should compute the correct DV for a simple tour from callisto to ganymede 500 days after the starting epoch", function() {
  
    var v_inf = [500.0, 500.0, 500.0];
    
    // values from mga_part in PyGMO
    var chr1 = [-2.2409025155881617, 1.7086536261784677, 0.75625561836494759, 30.578539300848242];
    var chr2 = [1.6770649519120828, 1.8305647840531556, 0.90523577317058601, 56.421556013160206];

    var fitness1 = 2.904560048816230e+03;
    var fitness2 = 384.8879838688004;

    var prob = new core.mga_part([callisto, ganymede], [[1, 100]], ref_epoch+500, v_inf);

    expect(prob.objfun(chr1)).toBeRoughly(fitness1, 1);
    expect(prob.objfun(chr2)).toBeRoughly(fitness2, 1);
    });

  it("should compute the correct DV for a 3 leg tour visiting all moons 666 days after the starting epoch", function() {
  
    var v_inf = [1000.0, 200.0, 1800.0];
    
    // values from mga_part in PyGMO
    var chr1 = [-0.89167957048220181, 1.849596788728052, 0.10009706363433669, 2.3283978452990439, -4.3604974153507339, 1.8386554993395943, 0.7601173011631206, 40.088004354452721, 4.6259758882081723, 1.7329376220450541, 0.45215811854817284, 17.79979356541736];
    var chr2 = [-0.8932194190061723, 1.0300880806611978, 0.095324824424401558, 2.3283978452990439, 5.4888597389592242, 1.2173114938443048, 0.7601173011631206, 40.456082716845614, 4.0535995032776029, 1.243711408609709, 0.80713103288398147, 52.807586010713734];

    var fitness1 = 11718.454322803005;
    var fitness2 = 3775.353428651762;

    var prob = new core.mga_part([io, europa, ganymede, callisto], [[1, 100],[1,100],[1,100]], ref_epoch+666, v_inf);

    expect(prob.objfun(chr1)).toBeRoughly(fitness1, 1);
    expect(prob.objfun(chr2)).toBeRoughly(fitness2, 1);
    });
    
  it("should return the correct spacecraft velocity after a planetary encounter with fb_prop", function() {
  
    // values from PyKEP documentation
    var v_in = [1,0,0];
    var v_moon = [0,1,0];
    var rp = 2;
    var beta = 3.1415 / 2;
    var mu = 1;
    
    var vout = [0.5280816415752535, -0.31191835842474636, 2.5676915994850746e-05];
    
    expect(core.fb_prop(v_in, v_moon, beta, rp, mu)).toBeRoughly3d(vout, 1e-8);
    });

  it("should solve a simple lambert problem correctly", function() {
  
    // values from PyKEP documentation
    var r1 = [1,0,0];
    var r2 = [0,1,0];
    var t = 20;
    
    var v1 = [465045496.92343205, 192628240.5691746, 0.0]
    
    expect(core.lambert_problem(r1, r2, t, false).v1).toBeRoughly3d(v1, 1e-4);
    });
    
  it("should propagate correctly with propagate lagrangian", function() {
  
    // values from PyKEP
    var r0 = [10000000,-5000000,0];
    var v0 = [0,1000,0];
    var t = 2000000;
	
	
    var r = [6621639.530812682, -3240714.536148502, 0.0];
    var v = [-96582.89698972245, 48779.09718807388, 0.0];

    expect(core.propagate_lagrangian(r0, v0, t, MU_JUP).r).toBeRoughly3d(r, 1e-4);
    expect(core.propagate_lagrangian(r0, v0, t, MU_JUP).v).toBeRoughly3d(v, 1e-4);
    });


  it("should set the correct bounds for instantiating mga_incipit problems", function() {
    
    // values from mga_part in PyGMO

    var tof_seq = [[111, 222],[333,444],[555,666]]

    var prob = new core.mga_incipit([io, io, europa], tof_seq, [ref_epoch, ref_epoch + 4018]);
   
    expect(prob.bounds[0][0]).toEqual(ref_epoch);
    expect(prob.bounds[0][1]).toEqual(ref_epoch + 4018);
    expect(prob.bounds[1][0]).toEqual(0);
    expect(prob.bounds[1][1]).toEqual(1);
    expect(prob.bounds[2][0]).toEqual(0);
    expect(prob.bounds[2][1]).toEqual(1);
    expect(prob.bounds[3][0]).toEqual(tof_seq[0][0]);
    expect(prob.bounds[3][1]).toEqual(tof_seq[0][1]);    

    expect(prob.bounds[4][0]).toEqual(-2 * Math.PI);
    expect(prob.bounds[4][1]).toEqual(2 * Math.PI);
    expect(prob.bounds[5][0]).toEqual(1.0273747604708459);
    expect(prob.bounds[5][1]).toEqual(2.0949904188338353);
    expect(prob.bounds[6][0]).toEqual(1e-05);
    expect(prob.bounds[6][1]).toEqual(0.99999);
    expect(prob.bounds[7][0]).toEqual(tof_seq[1][0]);
    expect(prob.bounds[7][1]).toEqual(tof_seq[1][1]);    

    expect(prob.bounds[8][0]).toEqual(-2 * Math.PI);
    expect(prob.bounds[8][1]).toEqual(2 * Math.PI);
    expect(prob.bounds[9][0]).toEqual(1.0273747604708459);
    expect(prob.bounds[9][1]).toEqual(2.0949904188338353);
    expect(prob.bounds[10][0]).toEqual(1e-05);
    expect(prob.bounds[10][1]).toEqual(0.99999);
    expect(prob.bounds[11][0]).toEqual(tof_seq[1][0]);
    expect(prob.bounds[11][1]).toEqual(tof_seq[1][1]);    
    
    });    
    
  it("should compute the correct DV for the default capture in the jovian system", function() {

    var chr = [60428.66035001467, 0.68079074476921864, 0.50042217392913912, 197.8893315154337, 1.5583224294092572, 1.027374760470847, 4.7172297538947875e-05, 187.2839907864838, 1.1704153578684833, 1.3768789572061273, 0.18952609594974831, 71.009762894912797];

    var fitness = 96.58384920324356;

    var tof_seq = [[100, 200],[3,200],[4,100]];
    
    var prob = new core.mga_incipit([io, io, europa], tof_seq, [ref_epoch, ref_epoch + 4018]);

    expect(prob.objfun(chr)).toBeRoughly(fitness, 1);
    
    });    
    
    
});