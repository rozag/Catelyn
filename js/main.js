var DEBUG = true;

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
        response.nodes[edge.source].targets.push({target: edge.target, effect: edge.effect}); // effect может быть "+" или "-"
    });
    if (DEBUG) console.log("graph", response.nodes);
    if (DEBUG) console.log("graph[0]", response.nodes[0]);
    fillLeftMenu();
}

// Выводим данные в левую панель
function fillLeftMenu() {
    var genesList = document.querySelector("#genes_list");
    response.nodes.forEach(function (gene) {
        genesList.appendChild(createGeneNode(gene["name"], gene["proteins"], gene["proteins_income"], gene["power"]));
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

// Рисуем граф по данным
function drawGraph() {
    var graphSpace = document.querySelector("#graph_space");
    var width = graphSpace.clientWidth, height = window.innerHeight;

    var svg = d3.select("#graph_space")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr('preserveAspectRatio', 'xMinYMin slice')
        .append('g');

    var force = self.force = d3.layout.force()
        .nodes(response.nodes)
        .links(response.edges)
        .distance(300)
        .charge(2)
        .size([width, height])
        .start();

    var link = svg.selectAll(".link")
        .data(response.edges)
        .enter().append("line")
        .attr("class", "link");

    var nodeDrag = d3.behavior.drag();

    var node = svg.selectAll("circle")
        .data(response.nodes)
        .enter().append("circle")
        .attr("class", "node")
        .attr("r", 4)
        .call(nodeDrag);

    node.append("text")
        .attr("x", 12)
        .attr("dy", ".35em")
        .text(function (d) {
            return d.name;
        });

    var tick = function () {
        link
            .attr("x1", function (d) {
                return d.source.x;
            })
            .attr("y1", function (d) {
                return d.source.y;
            })
            .attr("x2", function (d) {
                return d.target.x;
            })
            .attr("y2", function (d) {
                return d.target.y;
            });

        node
            .attr("cx", function (d) {
                return d.x;
            })
            .attr("cy", function (d) {
                return d.y;
            });
    };

    force.on("tick", tick);
}

// Запускаем сам процесс
