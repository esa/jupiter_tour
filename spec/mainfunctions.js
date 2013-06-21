describe("Mainfunctions", function() {
    
  it("should change the beta-bounds of mga_part", function() {

    var prob = new core.mga_part([europa, europa, europa], [[1, 50], [1, 50]], 62544.0, [1500.0, 350, 145.0]);
    var newbeta = [ {lower:-0.2, upper:0.2}, {lower:0.5, upper:1} ];
    
    prob.set_beta(newbeta);
    
    expect(prob.bounds[0][0]).toBe(newbeta[0].lower);
    expect(prob.bounds[0][1]).toBe(newbeta[0].upper);
    expect(prob.bounds[4][0]).toBe(newbeta[1].lower);
    expect(prob.bounds[4][1]).toBe(newbeta[1].upper);

    });

  it("should change the rp-bounds of mga_part", function() {

    var prob = new core.mga_part([europa, europa, europa], [[1, 50], [1, 50]], 62544.0, [1500.0, 350, 145.0]);
    var newrp = [ {lower:1.2, upper:1.6}, {lower:1.3, upper:1.7} ];
    
    prob.set_rp(newrp);
    
    expect(prob.bounds[1][0]).toBe(newrp[0].lower);
    expect(prob.bounds[1][1]).toBe(newrp[0].upper);
    expect(prob.bounds[5][0]).toBe(newrp[1].lower);
    expect(prob.bounds[5][1]).toBe(newrp[1].upper);

    });

  it("should change the tof-bounds of mga_part", function() {

    var prob = new core.mga_part([europa, europa, europa], [[1, 50], [1, 50]], 62544.0, [1500.0, 350, 145.0]);
    var newtof = [[5,100],[20,200]];
    
    prob.set_tof(newtof);
    
    expect(prob.bounds[3][0]).toBe(newtof[0][0]);
    expect(prob.bounds[3][1]).toBe(newtof[0][1]);
    expect(prob.bounds[7][0]).toBe(newtof[1][0]);
    expect(prob.bounds[7][1]).toBe(newtof[1][1]);

    });    
    
});
