/* Rawdata for default mission to run game with a simple (e.g., nodejs or python) http-server
 */
rawdata.defaultMission = {
    mission: {
        id: 2,

        maximumMissionDuration: 1461,

        funIsInvalidState: 'return [];',
        funIsWinningState: 'var score = gameState.getScore(); return (score >= 324);',
        funGetWinningProgress: 'var score = gameState.getScore(); return score/324;',


        centralBody: {
            id: 2,
            name: 'Jupiter',
            isStar: false,
            sgp: 126686534.92180e9,
            radius: 71492000,
            scale: 1e-6,
            meshMaterialURL: 'res/img/jupitersurface.jpg'
        },

        orbitingBodies: {
            3: {
                name: 'Io',
                sgp: 5959.916e9,
                refEpoch: 58849.0,
                orbitalElements: {
                    sma: 422029687.14001,
                    ecc: 4.308524661773e-03,
                    incl: 0.00070014732,
                    lan: -1.38998129391,
                    ap: 0.66307270809,
                    ma: 5.00651891805
                },
                radius: 1826.5e3,
                minRadiusFactor: 1.02737476047,
                maxRadiusFactor: 2.09499041883,
                maxTimeOfFlight: 30,
                scale: 0.000005,
                meshMaterialURL: 'res/img/iosurface.jpg',
                surface: {
                    type: 1,
                    values: {
                        1: 1,
                        2: 1,
                        3: 1,
                        4: 1,
                        5: 1,
                        6: 1,
                        7: 1,
                        8: 1,
                        9: 2,
                        10: 2,
                        11: 2,
                        12: 2,
                        13: 2,
                        14: 2,
                        15: 3,
                        16: 3,
                        17: 3,
                        18: 3,
                        19: 3,
                        20: 3,
                        21: 3,
                        22: 3,
                        23: 3,
                        24: 3,
                        25: 3,
                        26: 3,
                        27: 2,
                        28: 2,
                        29: 2,
                        30: 2,
                        31: 2,
                        32: 2
                    }
                }
            },
            4: {
                name: 'Europa',
                sgp: 3202.739e9,
                refEpoch: 58849.0,
                orbitalElements: {
                    sma: 671224237.12681,
                    ecc: 9.384699662601e-03,
                    incl: 0.00812106662,
                    lan: -2.3065952468,
                    ap: -1.38878710982,
                    ma: 5.55028257727
                },
                radius: 1561.0e3,
                minRadiusFactor: 1.03203074952,
                maxRadiusFactor: 2.28122998078,
                maxTimeOfFlight: 30,
                scale: 0.000005,
                meshMaterialURL: 'res/img/europasurface.jpg',
                surface: {
                    type: 1,
                    values: {
                        1: 2,
                        2: 2,
                        3: 2,
                        4: 2,
                        5: 2,
                        6: 2,
                        7: 2,
                        8: 2,
                        9: 4,
                        10: 4,
                        11: 4,
                        12: 4,
                        13: 4,
                        14: 4,
                        15: 6,
                        16: 6,
                        17: 6,
                        18: 6,
                        19: 6,
                        20: 6,
                        21: 6,
                        22: 6,
                        23: 6,
                        24: 6,
                        25: 6,
                        26: 6,
                        27: 4,
                        28: 4,
                        29: 4,
                        30: 4,
                        31: 4,
                        32: 4
                    }
                }
            },
            5: {
                name: 'Ganymede',
                sgp: 9887.834e9,
                refEpoch: 58849.0,
                orbitalElements: {
                    sma: 1070587469.23740,
                    ecc: 1.953365822716e-03,
                    incl: 0.00236386813,
                    lan: -0.88651158686,
                    ap: -0.74833600978,
                    ma: 3.85016858447
                },
                radius: 2634.0e3,
                minRadiusFactor: 1.01898253607,
                maxRadiusFactor: 1.759301442678,
                maxTimeOfFlight: 30,
                scale: 0.000005,
                meshMaterialURL: 'res/img/ganymedesurface.jpg',
                surface: {
                    type: 1,
                    values: {
                        1: 3,
                        2: 3,
                        3: 3,
                        4: 3,
                        5: 3,
                        6: 3,
                        7: 3,
                        8: 3,
                        9: 2,
                        10: 2,
                        11: 2,
                        12: 2,
                        13: 2,
                        14: 2,
                        15: 1,
                        16: 1,
                        17: 1,
                        18: 1,
                        19: 1,
                        20: 1,
                        21: 1,
                        22: 1,
                        23: 1,
                        24: 1,
                        25: 1,
                        26: 1,
                        27: 2,
                        28: 2,
                        29: 2,
                        30: 2,
                        31: 2,
                        32: 2
                    }
                }
            },
            6: {
                name: 'Callisto',
                sgp: 7179.289e9,
                refEpoch: 58849.0,
                orbitalElements: {
                    sma: 1883136616.73050,
                    ecc: 7.337063799028e-03,
                    incl: 0.00442516585,
                    lan: 1.51361788518,
                    ap: -2.80579190487,
                    ma: 5.60384218299
                },
                radius: 2408.0e3,
                minRadiusFactor: 1.0207641196,
                maxRadiusFactor: 1.83056478405,
                maxTimeOfFlight: 30,
                scale: 0.000005,
                meshMaterialURL: 'res/img/callistosurface.jpg',
                surface: {
                    type: 1,
                    values: {
                        1: 3,
                        2: 3,
                        3: 3,
                        4: 3,
                        5: 3,
                        6: 3,
                        7: 3,
                        8: 3,
                        9: 2,
                        10: 2,
                        11: 2,
                        12: 2,
                        13: 2,
                        14: 2,
                        15: 1,
                        16: 1,
                        17: 1,
                        18: 1,
                        19: 1,
                        20: 1,
                        21: 1,
                        22: 1,
                        23: 1,
                        24: 1,
                        25: 1,
                        26: 1,
                        27: 2,
                        28: 2,
                        29: 2,
                        30: 2,
                        31: 2,
                        32: 2
                    }
                }
            }
        }
    },

    saveGame: {
        nodeHistory: [1],

        nodes: {
            1: {
                id: 1,
                parentID: null,
                isVirtual: false,
                gameState: {
                    orbitingBodyID: 5,
                    epoch: 58849,
                    passedDays: 0,
                    transferLeg: {
                        problemType: null,
                        chromosome: [],
                        deltaV: 0,
                        timeOfFlight: 0,
                        mappedFaceID: ''
                    },
                    score: 0,
                    totalDeltaV: 0,
                    mappedFaces: {},
                    vehicle: {
                        isLanded: false,
                        velocityInf: [1000, -400, 1000],
                        stages: [
                            {
                                propulsionType: 0,
                                mass: 2000,
                                emptyMass: 1000,
                                thrust: 0.105,
                                specificImpulse: 3500,
                                imageURL: 'res/img/spacecraft.jpg'
                        }]
                    }
                }
            }
        }
    }
};