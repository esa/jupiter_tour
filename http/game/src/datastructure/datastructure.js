/* Namespace DATASTRUCTURE 
    Contains more complex Objects.
*/
var datastructure = {};

(function () {

    var idSeed = 0;

    function updateIDSeed(seed) {
        idSeed = Math.max(idSeed, seed);
    }

    function createID() {
        return idSeed++;
    }

    //Exposed Interface
    datastructure.updateIDSeed = updateIDSeed;
    datastructure.createID = createID;
})();