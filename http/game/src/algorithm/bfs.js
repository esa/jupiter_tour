/*
    BFS For Graph-like Structures 
    rootNode: Starting Node for search
    funID: Function returning the node id/key
    funChildren: Function returning the children of the node as an array
    funNodeAction: Function which specifies what should be done with each node
*/
algorithm.bfs = function (rootNode, funID, funChildren, funNodeAction) {
    var queue = new datastructure.Queue();
    queue.push(rootNode);
    var visited = {};
    visited[funID(rootNode)] = true;
    while (!queue.isEmpty()) {
        node = queue.front();
        queue.pop();
        funNodeAction(node);
        var children = funChildren(node);
        if (children) {
            for (var i = 0; i < children.length; i++) {
                var cnode = children[i];
                if (!visited[funID(cnode)]) {
                    visited[funID(cnode)] = true;
                    queue.push(cnode);
                }
            }
        }
    }
};