/* Game starts here. */
var gameEngine = null;
$(document).ready(function () {
    var gameID = net.getCookie('gameID');
    if (gameID) {
        gameEngine = new core.GameEngine();
        var plugins = [];
        for (var pluginClass in plugin) {
            plugins.push(new plugin[pluginClass](gameEngine));
        }
        gameEngine.registerPlugins(plugins);
        gameEngine.init(gameID);
    } else {
        gameEngine = new core.GameEngine();
        gameEngine.init();
    }
});