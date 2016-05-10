var game = {
    nodes: [
        {"x": 469, "y": 410},
        {"x": 493, "y": 364},
        {"x": 442, "y": 365},
        {"x": 467, "y": 314},
        {"x": 477, "y": 248},
        {"x": 425, "y": 207},
        {"x": 402, "y": 155},
        {"x": 369, "y": 196},
        {"x": 350, "y": 148},
        {"x": 539, "y": 222},
        {"x": 594, "y": 235},
        {"x": 582, "y": 185},
        {"x": 633, "y": 200}
    ],
    links: [
        {"source":  0, "target":  1},
        {"source":  1, "target":  2},
        {"source":  2, "target":  0},
        {"source":  1, "target":  3},
        {"source":  3, "target":  2},
        {"source":  3, "target":  4},
        {"source":  4, "target":  5},
        {"source":  5, "target":  6},
        {"source":  5, "target":  7},
        {"source":  6, "target":  7},
        {"source":  6, "target":  8},
        {"source":  7, "target":  8},
        {"source":  9, "target":  4},
        {"source":  9, "target": 11},
        {"source":  9, "target": 10},
        {"source": 10, "target": 11},
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
            nodes: 10,
            vaccinations: 10
        },
        2: {
            label: 'Medium',
            nodes: 20
        },
        3: {
            label: 'Hard',
            nodes: 30
        }
    },
    d3: {
        link: null,
        node: null,
        force: null,
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
            game.initD3(level);
        });
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
        game.nodes.splice(n.index, 1)

        var links = [];
        game.links.forEach(function(e,i) {
            if (e.source.index == n.index) return;
            if (e.target.index == n.index) return;

            links.push(e);
        });
        game.links = links;

        game.render();
    }
};

$(game.init);