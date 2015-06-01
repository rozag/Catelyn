var DEBUG = false;

// Считываем JSON
function loadJSON(callback) {
    var request = new XMLHttpRequest();
    request.overrideMimeType("application/json");
    request.open('GET', 'json/sample.json', true);
    request.onreadystatechange = function () {
        if (request.readyState == 4 && request.status == "200") {
            callback(request.responseText);
        }
    };
    request.send(null);
}

var response = null;
loadJSON(function (json) {
    if (json) {
        response = JSON.parse(json);
        if (DEBUG) console.log("response", response);
        handleJSON();
    } else {
        throw new Error("Problem with JSON file.");
    }
});

// Обрабатываем JSON
function handleJSON() {
    // Задаём вершины графа
    response.nodes.forEach(function (node) {
        node.targets = [];
    });

    // Добавляем каждой вершине исходящие ребра (id у node совпадает с индексом в graph)
    response.edges.forEach(function (edge) {
        if (edge.effect == "+")
            edge.type = "positive";
        else
            edge.type = "negative";
        response.nodes[edge.source].targets.push({target: edge.target, effect: edge.effect}); // effect может быть "+" или "-"
    });
    if (DEBUG) console.log("graph", response.nodes);
    if (DEBUG) console.log("graph[0]", response.nodes[0]);
    fillLeftMenu();
}

// Выводим данные в левую панель
function fillLeftMenu() {
    var genesList = document.querySelector("#genes_list");
    response.nodes.forEach(function (node) {
        var geneNode = createGeneNode(node["name"], node["proteins"], node["proteins_income"], node["power"]);
        node.domElt = geneNode;
        genesList.appendChild(geneNode);
    });
    drawGraph();
}

// Возвращает Node для списка генов
function createGeneNode(name, proteins, income, power) {
    var geneItem = document.createElement("li");
    var aTag = document.createElement("a");
    var geneName = document.createElement("h4");
    var geneProteins = document.createElement("h5");
    var geneIncome = document.createElement("h5");
    var genePower = document.createElement("h5");

    geneName.textContent = name;
    geneProteins.textContent = "proteins: " + proteins;
    geneIncome.textContent = "income: " + income;
    genePower.textContent = "power: " + power;

    geneProteins.id = "proteins";
    geneIncome.id = "income";
    genePower.id = "power";

    geneName.style.color = "#2196f3";
    geneProteins.style.marginLeft = "1em";
    geneIncome.style.marginLeft = "1em";
    genePower.style.marginLeft = "1em";

    aTag.appendChild(geneName);
    aTag.appendChild(geneProteins);
    aTag.appendChild(geneIncome);
    aTag.appendChild(genePower);
    geneItem.appendChild(aTag);
    return geneItem;
}

var MIN_RADIUS = 8;

// Рисуем граф по данным
function drawGraph() {
    var graphSpace = document.querySelector("#graph_space");
    var width = graphSpace.clientWidth, height = window.innerHeight - 200;

    var nodes = response.nodes;
    var links = response.edges;

    var linkArc = function (d) {
        if (d.source.x == d.target.x && d.source.y == d.target.y) {
            var x1 = d.source.x;
            var y1 = d.source.y;
            var x2 = d.target.x;
            var y2 = d.target.y;
            var drx = 20;
            var dry = 20;
            var xRotation = -45;
            var largeArc = 1;
            var sweep = 1;
            x2 += 1;
            y2 += 1;
            return "M" + x1 + "," + y1 + "A" + drx + "," + dry + " " + xRotation + "," + largeArc + "," + sweep + " " + x2 + "," + y2;
        } else {
            return "M" + d.source.x + "," + d.source.y + "A0,0 0 0,1 " + d.target.x + "," + d.target.y;
        }
    };

    var transform = function (d) {
        return "translate(" + d.x + "," + d.y + ")";
    };

    var tick = function () {
        path.attr("d", linkArc);
        circle.attr("transform", transform);
        text.attr("transform", transform);
    };

    var force = d3.layout.force()
        .nodes(d3.values(nodes))
        .links(links)
        .size([width, height])
        .linkDistance(60)
        .charge(-300)
        .on("tick", tick)
        .start();

    var svg = d3.select("#graph_space").append("svg")
        .attr("width", width)
        .attr("height", height);

    var circle = svg.append("g").selectAll("circle")
        .data(force.nodes())
        .enter().append("circle")
        .attr("r", MIN_RADIUS)
        .call(force.drag)
        .attr("id", function (d) {
            return "circle_" + nodes.indexOf(d);
        });

    var getRightColor = function (edge) {
        if (edge == "positive")
            return "#609b53";
        else
            return "#9b4f4f";
    };

    //Per-type markers, as they don't inherit styles.
    svg.append("defs").selectAll("marker")
        .data(["positive", "negative"])
        .enter().append("marker")
        .attr("id", function (d) {
            return d;
        })
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 10)
        .attr("refY", 0)
        .attr("markerWidth", 5)
        .attr("markerHeight", 5)
        .attr("orient", "auto")
        .attr("stroke", getRightColor)
        .append("path")
        .attr("fill", getRightColor)
        .attr("d", "M0,-5L10,0L0,5");

    var path = svg.append("g").selectAll("path")
        .data(force.links())
        .enter().append("path")
        .attr("class", function (d) {
            return "link " + d.type;
        })
        .attr("marker-end", function (d) {
            return "url(#" + d.type + ")";
        });

    var text = svg.append("g").selectAll("text")
        .data(force.nodes())
        .enter().append("text")
        .attr("x", 8)
        .attr("y", ".31em")
        .text(function (d) {
            return d.name;
        });

    if (DEBUG) console.log("nodes", nodes);
    if (DEBUG) console.log("nodes[0]", nodes[0]);
    if (DEBUG) console.log("edges", links);
    if (DEBUG) console.log("edges[0]", links[0]);

    saveBasicParams();
}

// Сохраняем исходный показатель power
function saveBasicParams() {
    response.nodes.forEach(function (node) {
        node["basicPower"] = node["power"];
        node["basicIncome"] = node["proteins_income"];
    });

    prepareButtons();
}

var PAUSED = true;
var INTERVAL = 300;
var STEP = 0;
var RIPPLE_INTERVAL = 10;

// Подготавливаем Play, Pause, Forward кнопки
function prepareButtons() {
    var playButton = document.querySelector("#play_button");
    var pauseButton = document.querySelector("#pause_button");
    var forwardButton = document.querySelector("#forward_button");

    $(pauseButton).addClass("active");

    playButton.onclick = function () {
        $(playButton).addClass("active");
        $(pauseButton).removeClass("active");
        $(forwardButton).removeClass("active");

        var wasActing = !PAUSED;

        PAUSED = false;
        INTERVAL = 500;

        if (!wasActing)
            act();
    };

    pauseButton.onclick = function () {
        $(playButton).removeClass("active");
        $(pauseButton).addClass("active");
        $(forwardButton).removeClass("active");

        PAUSED = true;
    };

    forwardButton.onclick = function () {
        $(playButton).removeClass("active");
        $(pauseButton).removeClass("active");
        $(forwardButton).addClass("active");

        var wasActing = !PAUSED;

        PAUSED = false;
        INTERVAL = 100;

        if (!wasActing)
            act();
    };
}

// Сам процесс
function act() {
    STEP++;
    if (DEBUG) console.log("Acting. STEP = " + STEP);

    document.querySelector("#step_label").textContent = "Step: " + STEP;

    response.nodes.forEach(addIncomeProteins);
    response.nodes.forEach(updatePower);
    response.nodes.forEach(actWithNode);
    response.nodes.forEach(updateUIWithNode);
    if (STEP % RIPPLE_INTERVAL == 0)
        response.nodes.forEach(drawRipple);

    if (!PAUSED)
        setTimeout(act, INTERVAL);
}

var MAX_PROTEINS = 5000;
var DEGRADE_COEFFICIENT = -4;

// Каждый ход добавляем сколько-то белка
function addIncomeProteins(node) {
    if (node["proteins"] >= MAX_PROTEINS) {
        node["proteins_income"] = DEGRADE_COEFFICIENT;
    } else if (node["proteins"] < 10 && node["proteins_income"] == DEGRADE_COEFFICIENT) {
        node["proteins_income"] = node["basicIncome"];
    }

    var result = node["proteins"] + node["proteins_income"];
    if (result >= 0 && result <= MAX_PROTEINS) {
        node["proteins"] += node["proteins_income"];
        node["stepIncome"] = node["proteins_income"];
    }
}

var PROTEINS_DIVIDER = 200;

// Увеличиваем power в зависимости от proteins
function updatePower(node) {
    node["power"] = node["basicPower"];
    if (node["proteins"] > 0 && Math.log(node["proteins"] / PROTEINS_DIVIDER) > 0) {
        node["power"] += Math.floor(Math.log(node["proteins"] / PROTEINS_DIVIDER));
    }
}

// Ген воздействует на свои targets
function actWithNode(node) {
    node.targets.forEach(function (link) {
        var ACT = true;
        if (link.effect == "+" && node["proteins"] <= 0
            || link.effect == "-" && node["proteins"] >= MAX_PROTEINS
            || link.effect == "-" && response.nodes[link.target]["proteins"] <= 0
            || link.effect == "+" && response.nodes[link.target]["proteins"] >= MAX_PROTEINS
            || node["transmit"] == false)
            ACT = false;

        if (ACT) {
            var multiplier = (link.effect == "+") ? 1 : -1;
            response.nodes[link.target]["proteins"] += multiplier * node["power"]; // +/- сколько-то белков к target'у
            response.nodes[link.target]["stepIncome"] += multiplier * node["power"]; // учитываем дельту белков за шаг
            node["proteins"] -= multiplier * node["power"]; // -/+ сколько-то белка себе
        }
    });
}

var RADIUS_DIVIDER = 100;

// Обновляем интерфейс
function updateUIWithNode(node, i) {
    node.domElt.querySelector("#proteins").textContent = "proteins: " + node["proteins"];
    node.domElt.querySelector("#income").textContent = "last income: " + node["stepIncome"];
    node.domElt.querySelector("#power").textContent = "power: " + node["power"];
    d3.select("svg").select("#circle_" + i).attr("r", MIN_RADIUS + node["proteins"] / RADIUS_DIVIDER);
}

var RADIUS_DELTA = 20;

// Рисуем расходящиеся круги
function drawRipple(node, i) {
    if (node["stepIncome"] > 0) {
        helperDrawCircle(i, node.x, node.y, "#609b53", MIN_RADIUS + RADIUS_DELTA + node["proteins"] / RADIUS_DIVIDER, false)
    } else if (node["stepIncome"] < 0) {
        helperDrawCircle(i, node.x, node.y, "#9b4f4f", MIN_RADIUS + RADIUS_DELTA + node["proteins"] / RADIUS_DIVIDER, true)
    }
}

function helperDrawCircle(i, x, y, color, radius, isNegative) {
    var startRadius, endRadius;
    if (isNegative) {
        startRadius = radius;
        endRadius = radius - RADIUS_DELTA;
    } else {
        startRadius = radius - RADIUS_DELTA;
        endRadius = radius;
    }

    var circle = d3.select("svg").append("circle")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", startRadius)
        .style("stroke-width", 3)
        .style("stroke", color)
        .style("fill-opacity", 0)
        .transition()
        //.delay(i * 100)
        .duration(1500)
        .ease('quad-in')
        .attr("r", endRadius)
        .style("stroke-opacity", 0)
        .each("end", function () {
            d3.select(this).remove();
        });
}
