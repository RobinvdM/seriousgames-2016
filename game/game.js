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

        var svg = d3.select("#game").append("svg")
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
        alert('Your score is: 999');
        game.elem.html('');
        $('#vaccsLeft').hide();
        game.quiz.display();
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

// QUIZ ====================
game.quiz = {}
game.quiz.handleAnswer = function(is_correct) {
    return function() {
        var elem = $(this);
        console.log(elem);
        if (is_correct) {
            elem.css('background-color', 'green');
            alert('Well done!');
        } else {
            elem.css('background-color', 'red');
            alert('Nah...');
        }
    }
}

game.quiz.display = function() {
    game.elem.hide();
    var quiz_elem = $('#quiz');
    quiz_elem.show();
    var quiz = game.config.graph.quiz;
    $('h3', quiz_elem).text(quiz.title);
    $('.tutorial', quiz_elem).html(quiz.description);
    $('.question', quiz_elem).html(quiz.question);

    var handleAnswer = 

    $('#a1', quiz_elem).html(quiz.a1).click(game.quiz.handleAnswer(quiz.correct == 1));
    $('#a2', quiz_elem).html(quiz.a2).click(game.quiz.handleAnswer(quiz.correct == 2));
    $('#a3', quiz_elem).html(quiz.a3).click(game.quiz.handleAnswer(quiz.correct == 3));
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
        correct: 1,
        a1: '',
        a2: '',
        a3: ''
    }
};

game.graphs.karate = {
    title: 'Zachary karate club',
    description: 'You got into a fight with a friend last karate lesson. He now wants to leave the karate school. You obviously don’t want to join him at the other karate school and you don’t want your other friends to join him. He can only let people join by means of mouth to mouth communication. This means he can only persuade friends from friends that he already persuaded. You on the other hand can persuade anyone who hasn’t joined him to stay at your karate school. Can you prevent your friends from leaving your karate school to join the other guy’s karate school by persuading those who have a lot of friends and prevent the persuasion from someone with little friends to someone with a lot of friends?',
    gen: function() {return graph_zachary;},
    quiz: {
        title: 'Degree Centrality',
        description: 'A form of centrality is degree centrality. This means that the centrality of a node, or in this case a classmate, is determined by the number of connections this classmate has with other classmates. It is important to escort these classmates out of the classroom first, as they have a very high chance of hearing of your mistake and tell a lot of other classmates about it. In the following quiz, choose the nodes with the highest degree centrality.',
        question: 'Which node has the highest degree centrality:',
        correct: 1,
        a1: '<img src="degreecentrality1.png" width="300" height="255">',
        a2: '<img src="degreecentrality2.png" width="300" height="255">',
        a3: '<img src="degreecentrality3.png" width="300" height="255">'
    }
};

game.graphs.friends = {
    title: 'Friends',
    description: 'Oh no, you spilled water from your water bottle all over your table and some of your books became wet. Luckily no one saw you spill the water, so there is still time to cover up your accident. As running with towels trough the classroom would attract to much attention, you decide to escort people out of the classroom. However this takes time and it is only a matter of time before someone discovers your mistake. When someone sees your mistake he will start telling his friends about it, who in turn will tell it to their friends. Can you prevent your classmates from learning about your mistake by escorting those who have a lot of friends and prevent the news from spreading to someone with little friends to someone with a lot of friends?',
    gen: function() {return connected_cliques([4,5,4, 5], 0.3);},
    quiz: {
        title: 'Degree Centrality',
        description: 'A form of centrality is degree centrality. This means that the centrality of a node, or in this case a classmate, is determined by the number of connections this classmate has with other classmates. It is important to escort these classmates out of the classroom first, as they have a very high chance of hearing of your mistake and tell a lot of other classmates about it. In the following quiz, choose the nodes with the highest degree centrality.',
        question: 'Which node has the highest degree centrality?',
        correct: 1,
        a1: '<img src="degreecentrality1.png" width="300" height="255">',
        a2: '<img src="degreecentrality2.png" width="300" height="255">',
        a3: '<img src="degreecentrality3.png" width="300" height="255">'
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
        correct: 1,
        a1: '<img>',
        a2: '<img>',
        a3: '<img>'
    }
};

game.graphs.tree = {
    title: 'Secret society',
    description: 'You work as an undercover cop in a secret society. But someone in the society has learned of your secret identity. He is telling the members he knows of your true identity who will in turn tell it to the members they know. Can you prevent the spreading of your true identity by arresting members who have a lot of connections to other members and prevent the spreading of this information from members with little connections to member’s whit a lot of connections?',
    gen: function() {
        var graph = randomgraph.BarabasiAlbert(30, 1, 1);
        return {'nodes': graph.nodes, 'links': graph.edges};
    },
    quiz: {
        title: 'Tree Graph',
        description: 'A tree graph is a special type of graph in which there is only a single route between two different nodes, or in this case members of the secret society. This means that members can be easily isolated by removing the well connected nodes at first and the neighbours of the members who know your secret later.',
        question: 'Which node should be removed to prevent further spreading of your true identity if member A knew your secret? <img src="treegraph.png">',
        correct: 1,
        a1: 'B',
        a2: 'C',
        a3: 'D'
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
        correct: 1,
        a1: '<img>',
        a2: '<img>',
        a3: '<img>'
    }
};

// =========================

$(game.init);
