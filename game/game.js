var game = {
    nodes: [
        {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {},
    ],
    links: [
        {"source":  0, "target":  1},
        {"source":  1, "target":  7},
        {"source":  2, "target":  6},
        {"source":  1, "target":  3},
        {"source":  3, "target":  2},
        {"source":  8, "target":  4},
        {"source":  18, "target":  1},
        {"source":  7, "target":  15},
        {"source":  13, "target":  19},
        {"source":  4, "target":  20},
        {"source":  20, "target":  8},
        {"source":  0, "target":  16},
        {"source":  5, "target":  0},
        {"source":  5, "target":  10},
        {"source":  6, "target":  12},
        {"source":  5, "target":  17},
        {"source":  6, "target":  19},
        {"source":  1, "target":  12},
        {"source":  6, "target":  19},
        {"source":  15, "target":  14},
        {"source":  6, "target":  8},
        {"source":  7, "target":  12},
        {"source":  9, "target":  17},
        {"source":  4, "target": 11},
        {"source":  9, "target": 8},
        {"source": 10, "target": 9},
        {"source": 11, "target": 12},
        {"source": 12, "target": 10}
    ],
    elem: null,
    config: {
        width: 960,
        height: 500
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
        invectedNodes: []
    },
    init() {
        game.elem = $('#game');

        game.initDifficulty();
    },
    resetGameState(className) {
        game.elem.attr('class', className);
        game.elem.html('');
    },
    initDifficulty() {
        game.resetGameState('difficulty');
        game.elem.html('<h1>To start, choose difficulty.</h1>');

        var list = $('<ul>');

        $.each(game.levels, function(i, level) {
            list.append(
                '<li data-level="' + i + '">' + 
                    level.label +
                '</li>'
            );
        });
        game.elem.append(list);

        $('ul li', game.elem).click(function(event) {
            var level = $(event.target).data('level');

            game.reset(level);
            game.initD3(level);
        });
    },
    setVaccsLeft(n) {
        game.stats.vaccsLeft = n;

        $('#vaccsLeft').html('<span>Vaccinations left:</span> <strong>' + n + '</strong>');
    },
    reset(level) {
        var level = game.levels[level];

        game.setVaccsLeft(level.vaccinations);
    },
    initD3(level) {
        game.resetGameState('game');

        var level = game.levels[level];

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

        game.d3.force.nodes(game.nodes)
                     .links(game.links)
                     .start();

        game.render();

        function tick() {
          game.d3.link.attr("x1", function(d) { return d.source.x; })
               .attr("y1", function(d) { return d.source.y; })
               .attr("x2", function(d) { return d.target.x; })
               .attr("y2", function(d) { return d.target.y; });

          game.d3.node.attr("cx", function(d) { return d.x; })
                      .attr("cy", function(d) { return d.y; });
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
        if (game.stats.invectedNodes[n] === undefined) {
            game.d3.node[0][n.index].setAttribute('class', 'node hidden');

            var links = [];
            game.links.forEach(function(e) {
                if (e.source.index == n.index) return;
                if (e.target.index == n.index) return;

                links.push(e);
            });
            game.links = links;

            game.render();
        }

        // Spread disease when no vaccs are left
        if (game.stats.vaccsLeft == 0)
            game.spreadDisease();
    },
    spreadDisease() {
        if (game.stats.invectedNodes.length == 0) {
            // Choose random node
            var n = game.nodes[
                Math.floor(Math.random() * game.nodes.length)
            ].index;
            
            game.d3.node[0][n].setAttribute('class', 'node infected');
            
            game.stats.invectedNodes.push(n);
        } else {
            game.stats.invectedNodes.forEach(function(element) {
                game.links.some(function(e) {
                    if (e.source.index != element && e.target.index != element) return;

                    var newInfection = e.source.index != element ? e.source.index : e.target.index;

                    if (game.stats.invectedNodes[newInfection] !== undefined) return;

                    game.d3.node[0][newInfection].setAttribute('class', 'node infected');

                    console.log(newInfection);

                    game.stats.invectedNodes.push(newInfection);

                    return true;
                });
            });
        }
    }
};

$(game.init);