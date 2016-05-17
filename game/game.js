var game = {
    elem: null,
    config: {
        width: 960,
        height: 800,
        difficulty: 1,
        graph: undefined
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
        infectedNodes: [],
        rounds: 0
    },
    init() {
        $('#level_desc').hide();
        $('#quiz').hide();

        game.elem = $('#game');
        $('#intro .level').click(function() {
            var graph_name = $(this).data('graph');
            game.config.graph = game.graphs[graph_name];
            game.description.display();
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
    initD3() {
        var graph = game.config.graph.gen();
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
        if (game.stats.infectedNodes.indexOf(n.index) > -1) return;

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

        if (game.stats.infectedNodes.length == 0) {
            do {
                // Choose random node
                var n = game.nodes[
                    Math.floor(Math.random() * game.nodes.length)
                ].index;

                var node = game.d3.node[0][n];
            } while (node.className.baseVal.indexOf('hidden') > 0);

            node.setAttribute('class', 'node infected');
            
            game.stats.infectedNodes.push(n);
        } else {
            game.stats.infectedNodes.forEach(function(element) {
                var neighbour = game.getNeighbourNode(element);

                if (neighbour === null) return;

                game.d3.node[0][neighbour].setAttribute('class', 'node infected');

                game.stats.infectedNodes.push(neighbour);
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

            if (game.stats.infectedNodes.indexOf(neighbour) > -1) {
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

            if (game.stats.infectedNodes.indexOf(e.source.index) < 0 && game.stats.infectedNodes.indexOf(e.target.index) < 0) continue;

            if (game.stats.infectedNodes.indexOf(e.source.index) < 0) return true;
            if (game.stats.infectedNodes.indexOf(e.target.index) < 0) return true;
        }

        return false;
    },
    end() {
        alert('No more infections!');
    }
};

// LEVEL DESCRIPTION =======
game.description = {}

game.description.display = function() {
    $('#intro').hide();
    var desc_el = $('#level_desc');
    desc_el.show();
    var graph = game.config.graph;
    $('h3', desc_el).text(graph.title);
    $('div', desc_el).html(graph.description);
    $('.start', desc_el).click(function() {
        desc_el.hide();
        game.elem.show();
        game.initLevel();
    });
};

// LEVELS ==================

game.initLevel = function() {
    game.reset();
    game.initD3();
};

// AFTER GAME SCREEN ======

// QUIZ ====================
game.quiz = {}
game.quiz.display = function() {
    game.elem.hide();
}

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
    title: 'Toy',
    description: 'This a toy graph',
    gen: function() {return graph_toy},
    quiz: {
        title: '',
        description: '',
        question: '',
        a1: '',
        a2: '',
        a3: ''
    }
};

game.graphs.karate = {
    title: 'Zachary karate club',
    description: 'Zachary karate club description',
    gen: function() {return graph_zachary;},
    quiz: {
        title: 'Closeness',
        description: 'Description of Closeness',
        question: 'Which node has the highest closeness:',
        a1: '<img>',
        a2: '<img>',
        a3: '<img>'
    }
};

game.graphs.friends = {
    title: 'Friends',
    description: 'Friends description',
    gen: function() {return connected_cliques([4,5,4, 5], 0.3);},
    quiz: {
        title: 'Closeness',
        description: 'Description of Closeness',
        question: 'Which node has the highest closeness:',
        a1: '<img>',
        a2: '<img>',
        a3: '<img>'
    }
};

game.graphs.book = {
    title: 'Book heroes',
    description: 'Miserables description',
    gen: function() {return graph_miserables;},
    quiz: {
        title: 'Closeness',
        description: 'Description of Closeness',
        question: 'Which node has the highest closeness:',
        a1: '<img>',
        a2: '<img>',
        a3: '<img>'
    }
};

game.graphs.tree = {
    title: 'Spies',
    description: 'A secret organisation where spies know only their direct boss',
    gen: function() {
        var graph = randomgraph.BarabasiAlbert(30, 1, 1);
        return {'nodes': graph.nodes, 'links': graph.edges};
    },
    quiz: {
        title: 'Cycles',
        description: 'No cycles here. Cycles blah blah blah',
        question: 'How many cycles does this graph have: <img>',
        a1: '0',
        a2: '1',
        a3: '2'
    }
};

game.graphs.random = {
    title: 'Preferential attachment',
    description: 'Random graph that...',
    gen: function() {
        var graph = randomgraph.BarabasiAlbert(30, 2, 2);
        return {'nodes': graph.nodes, 'links': graph.edges};
    },
    quiz: {
        title: 'Closeness',
        description: 'Description of Closeness',
        question: 'Which node has the highest closeness:',
        a1: '<img>',
        a2: '<img>',
        a3: '<img>'
    }
};

// =========================

$(game.init);