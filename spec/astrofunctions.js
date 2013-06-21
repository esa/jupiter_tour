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

    prob = new core.mga_part([io, europa], [[1, 100]], ref_epoch, v_inf);
   
    expect(prob.objfun(chr)).toBeRoughly(fitness, 1);
    });


  it("should compute the correct DV for a simple tour from io back to io", function() {
  
    var v_inf = [100.0, 0, -500.0];
    
    // values from mga_part in PyGMO
    var chr1 = [2.4010549877068,2.0816293855167602,0.01459456823868094,6.9219923482929655];
    var chr2 = [5.41200322310228, 1.753256022750357, 0.7877476324893331, 22.44665921907404];

    var fitness1 = 6237.4336110824097;
    var fitness2 = 21105.977080107088;

    prob = new core.mga_part([io, io], [[1, 100]], ref_epoch, v_inf);
    
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

    prob = new core.mga_part([callisto, ganymede], [[1, 100]], ref_epoch+500, v_inf);

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

    prob = new core.mga_part([io, europa, ganymede, callisto], [[1, 100],[1,100],[1,100]], ref_epoch+666, v_inf);

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
    
});