var game = {
    elem: null,
    config: {
        width: 960,
        height: 500,
        difficulty: 1
    },
    levels: {
        1: {
            label: 'Easy',
            nodes: 20,
            vaccinations: 3
        },
        2: {
            label: 'Medium',
            nodes: 30,
            vaccinations: 4
        },
        3: {
            label: 'Hard',
            nodes: 40,
            vaccinations: 4
        }
    },
    d3: {
        link: null,
        node: null,
        force: null,
    },
    stats: {
        vaccsLeft: 0,
        invectedNodes: [],
        rounds: 0
    },
    init() {
        game.elem = $('#game');
        $('#intro .level').click(function() {
            var graph_name = $(this).data('graph');
            $('#intro').hide();
            game.initLevel(graph_name);
        });
        $('#leaderboard').click(function() {
            $('#intro').hide();
            game.leaderBoard.display();
        });
        game.initDifficulty();
    },
    resetGameState(className) {
        game.elem.attr('class', className);
        game.elem.html('');
    },
    initDifficulty() {
        game.resetGameState('difficulty');
        $('#intro').show();
        game.elem.html('');

        var list = $('#intro #difficultyList');
        list.html('');

        $.each(game.levels, function(i, level) {
            list.append(
                '<button data-level="' + i + '">' +
                    level.label +
                '</button>'
            );
        });

        $('#difficultyList button').click(function(event) {
            var level = $(event.target).data('level');
            game.config.difficulty = level;
        });
    },
    setVaccsLeft(n) {
        game.stats.vaccsLeft = n;

        $('#vaccsLeft').html('<span>Vaccinations left:</span> <strong>' + n + '</strong>');
    },
    reset() {
        var level = game.levels[game.config.difficulty];
        game.setVaccsLeft(level.vaccinations);
    },
    initD3(graph_name) {
        var graph = game.graphs[graph_name].gen();
        game.links = graph.links;
        game.nodes = graph.nodes;

        game.resetGameState('game');

        var level = game.levels[game.config.difficulty];

        game.d3.force = d3.layout.force()
            .size([game.config.width, game.config.height])
            .charge(-400)
            .linkDistance(40)
            .on("tick", tick);

        var svg = d3.select("body").append("svg")
            .attr("width", game.config.width)
            .attr("height", game.config.height);

        game.d3.link = svg.selectAll(".link"),
        game.d3.node = svg.selectAll(".node");

        game.d3.force.nodes(graph.nodes)
                     .links(graph.links)
                     .start();

        game.render();

        function tick() {
          game.d3.link.attr("x1", function(d) { return d.source.x; })
               .attr("y1", function(d) { return d.source.y; })
               .attr("x2", function(d) { return d.target.x; })
               .attr("y2", function(d) { return d.target.y; });

          game.d3.node.attr("cx", function(d) { return d.x; })
                      .attr("cy", function(d) { return d.y; })
                      .attr("i", function(d) { return d.index; });
        }
    },
    render() {
        game.d3.link = game.d3.link.data(game.links);
        game.d3.link.enter().append("line").attr("class", "link");
        game.d3.link.exit().remove();

        game.d3.node = game.d3.node.data(game.nodes);
        game.d3.node.enter().append("circle")
                    .attr("class", "node").attr("r", 12)
                    .on("click", game.handleNodeClick);
        game.d3.node.exit().remove();

        game.d3.force.start();
    },
    handleNodeClick(n) {
        if (game.stats.vaccsLeft > 0)
            game.setVaccsLeft(game.stats.vaccsLeft - 1);

        // Remove node if not infected
        if (game.stats.invectedNodes.indexOf(n.index) > -1) return;

        game.d3.node[0][n.index].setAttribute('class', 'node hidden');

        var links = [];
        game.links.forEach(function(e) {
            if (e.source.index == n.index) return;
            if (e.target.index == n.index) return;

            links.push(e);
        });
        game.links = links;

        game.render();

        // Spread disease when no vaccs are left
        if (game.stats.vaccsLeft == 0)
            game.spreadDisease();
    },
    spreadDisease() {
        game.stats.rounds++;

        if (game.stats.invectedNodes.length == 0) {
            do {
                // Choose random node
                var n = game.nodes[
                    Math.floor(Math.random() * game.nodes.length)
                ].index;

                var node = game.d3.node[0][n];
            } while (node.className.baseVal.indexOf('hidden') > 0);

            node.setAttribute('class', 'node infected');
            
            game.stats.invectedNodes.push(n);
        } else {
            game.stats.invectedNodes.forEach(function(element) {
                var neighbour = game.getNeighbourNode(element);

                if (neighbour === null) return;

                game.d3.node[0][neighbour].setAttribute('class', 'node infected');

                game.stats.invectedNodes.push(neighbour);
            });

            if (! game.hasPossibleInfections())
                game.end();
        }
    },
    getNeighbourNode(node) {
        var neighbour = null;

        for (var i = 0; i < game.links.length; i++) {
            var e = game.links[i];

            if (e.source.index != node && e.target.index != node) continue;

            neighbour = e.source.index != node ? e.source.index : e.target.index;

            if (game.stats.invectedNodes.indexOf(neighbour) > -1) {
                neighbour = null;
                continue;
            }

            break;
        }

        return neighbour;
    },
    hasPossibleInfections() {
        for (var i = 0; i < game.links.length; i++) {
            var e = game.links[i];

            if (game.stats.invectedNodes.indexOf(e.source.index) < 0 && game.stats.invectedNodes.indexOf(e.target.index)) continue;

            if (game.stats.invectedNodes.indexOf(e.source.index) < 0) return true;
            if (game.stats.invectedNodes.indexOf(e.target.index) < 0) return true;
        }

        return false;
    },
    end() {
        alert('No more infections!');
    }
};

// LEVELS ==================

game.initLevel = function(graph_name) {
    game.reset();
    game.initD3(graph_name);
};


// LEADERBOARD =============
game.leaderBoard = {
   KEY: 'leaderboard'
};
game.leaderBoard.get = function() {
    var leaderBoard = localStorage.getItem(game.leaderBoard.KEY);
    return JSON.parse(leaderBoard) || {};
};

game.leaderBoard.saveScore = function(username, score) {
    var leaderBoard = game.leaderBoard.get();
    leaderBoard[username] = _.max([leaderBoard[username], score]);
    localStorage.setItem(game.leaderBoard.KEY, JSON.stringify(leaderBoard));
};

game.leaderBoard.display = function() {
    game.elem.html('<h1>Leader board</h1>');
    var scores = game.leaderBoard.get();
    scores = _.map(scores, function(num, key) { return [num, key] });
    scores = _.sortBy(scores, function(a) {return -a[0]});

    var list = $('<ol>');
    _.each(scores, function(score) {
        list.append('<li><span class="username">'+
                    score[1]+'</span> <span class="score">'
                    +score[0]+'</span></li>');
    });
    game.elem.append(list);
    game.elem.append($('<button>To main menu</button>').click(game.initDifficulty));
};

// GRAPHS ==================
game.graphs = {}
game.graphs.toy = {
    description: 'This a toy graph',
    gen: function() {return graph_toy}
};

game.graphs.karate = {
    description: 'Zachary karate club',
    gen: function() {return graph_zachary;}
};

game.graphs.friends = {
    description: 'Friends',
    gen: function() {return connected_cliques([4,5,4, 5], 0.3);}
};

game.graphs.book = {
    description: 'Miserables',
    gen: function() {return graph_miserables;}
};

game.graphs.tree = {
    description: 'Tree',
    gen: function() {
        var graph = randomgraph.BarabasiAlbert(30, 1, 1);
        return {'nodes': graph.nodes, 'links': graph.edges};
    }
};

game.graphs.random = {
    description: 'Random',
    gen: function() {
        var graph = randomgraph.BarabasiAlbert(30, 2, 2);
        return {'nodes': graph.nodes, 'links': graph.edges};
    }
};

// =========================

$(game.init);