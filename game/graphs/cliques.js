function connected_cliques(cliques_nums, connect_prob) {
    var edges = [];
    var vertices_num = 0;

    var vertices_total = 0;
    cliques_nums.forEach(function(clique_num) {
        vertices_total += clique_num;
    });

    cliques_nums.forEach(function(clique_num) {
        for (var i = 0; i < clique_num; i++) {
            for (var j = 0; j < i; j++) {
                edges.push({'source': j + vertices_num, 'target': i + vertices_num});
            }
            // Add outside connection
            if (Math.random() < connect_prob) {
                var v = Math.floor(Math.random() * (vertices_total - clique_num));
                if (v < vertices_num) {
                    edges.push({'source': v, 'target': i + vertices_num});
                } else {
                    edges.push({'source': v + clique_num, 'target': i + vertices_num});
                }
            }
        }
        vertices_num += clique_num;
    });


    var vertices = [];
    for (var i = 0; i < vertices_total; i++) {
        vertices.push({'name': i})
    }

    return {'nodes': vertices, 'links': edges}
}