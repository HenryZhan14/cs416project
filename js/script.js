let margin = { top: 20, right: 30, bottom: 40, left: 50 };
let width = 760 - margin.left - margin.right;
let height = 300 - margin.top - margin.bottom;

const svg_cases = d3.select("#cases-chart").append("svg");
const svg_deaths = d3.select("#deaths-chart").append("svg");
const svg_map = d3.select("#map-chart").append("svg");

const g_cases = svg_cases.append("g");
const g_deaths = svg_deaths.append("g");
const g_map = svg_map.append("g");

const projection = d3.geoAlbersUsa();
const path = d3.geoPath().projection(projection);

let year = 2020;
let all_data = [];
let us = null;
let current_scene_id = 1;
const file_path = 'data/us-states.csv';

let show_annotations = true;

const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

const annotations = [
    { date: new Date(2020, 2, 20), text: "First Wave:\nThe first wave in COVID-19 cases began in late March, with cases rising rapidly in the following weeks." },
    { date: new Date(2020, 5, 15), text: "Flattening Curve:\nBy mid-June, the curve of new cases started to flatten, due to the early containment measures." },
    { date: new Date(2020, 9, 25), text: "Second Wave:\nA second wave of cases began in late October, leading to a new peak in December." },
];

const render_scene_1 = (data) => {
    set_size_and_margin(svg_cases, g_cases, { top: 30, right: 30, bottom: 5, left: 60 }, 760, 300);
    set_size_and_margin(svg_deaths, g_deaths, { top: 20, right: 30, bottom: 20, left: 60 }, 760, 300);
    d3.select("#map-chart").style("display", "none");
    d3.select("#cases-chart").style("display", "block");
    d3.select("#deaths-chart").style("display", "block");

    d3.select("#cases-description").style("display", "block");
    d3.select("#deaths-description").style("display", "block");
    d3.select("#map-description").style("display", "none");

    const x = d3.scaleTime().range([0, width]);
    const y_cases = d3.scaleLinear().range([height, 0]);
    const y_deaths = d3.scaleLinear().range([height, 0]);

    x.domain(d3.extent(data, d => d.date));
    y_cases.domain([0, d3.max(data, d => d.cases)]);
    y_deaths.domain([0, d3.max(data, d => d.deaths)]);

    g_cases.selectAll("*").remove();
    g_cases.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

    g_cases.append("g")
        .call(d3.axisLeft(y_cases).tickFormat(d3.format(".2s")));

    g_cases.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", d3.line()
            .x(d => x(d.date))
            .y(d => y_cases(d.cases))
        );

    g_cases.append("text")
        .attr("x", width / 2)
        .attr("y", -5)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text("COVID-19 Cases Over Time");

    show_annotations = (year == 2020);

    if (show_annotations) {
        annotations.forEach(annotation => {
            g_cases.append("line")
                .attr("x1", x(annotation.date))
                .attr("x2", x(annotation.date))
                .attr("y1", 0)
                .attr("y2", height)
                .attr("stroke", "black")
                .attr("stroke-dasharray", "4");

            g_cases.append("text")
                .attr("x", x(annotation.date) + 5)
                .attr("y", 10)
                .attr("text-anchor", "start")
                .style("font-size", "12px")
                .style("fill", "black")
                .text(annotation.text)
                .call(wrap, 150);
        });
    }

    g_deaths.selectAll("*").remove();
    g_deaths.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

    g_deaths.append("g")
        .call(d3.axisLeft(y_deaths).tickFormat(d3.format(".2s")));

    g_deaths.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "darkred")
        .attr("stroke-width", 1.5)
        .attr("d", d3.line()
            .x(d => x(d.date))
            .y(d => y_deaths(d.deaths))
        );

    g_deaths.append("text")
        .attr("x", width / 2)
        .attr("y", -5)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text("COVID-19 Deaths Over Time");

    d3.select("#cases-description").text("This chart shows the number of COVID-19 cases over time for the selected year.");
    d3.select("#deaths-description").text("This chart shows the number of COVID-19 deaths over time for the selected year.");
};

const wrap = (text, width) => {
    text.each(function () {
        var text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            line_number = 0,
            line_height = 1.1,
            y = text.attr("y"),
            dy = parseFloat(text.attr("dy")) || 0,
            tspan = text.text(null).append("tspan").attr("x", text.attr("x")).attr("y", y).attr("dy", dy + "em");

        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan").attr("x", text.attr("x")).attr("y", y).attr("dy", ++line_number * line_height + dy + "em").text(word);
            }
        }
    });
};

const render_scene_2 = (data) => {
    set_size_and_margin(svg_map, g_map, { top: 40, right: 140, bottom: 40, left: 60 }, 760, 600);
    d3.select("#map-chart").style("display", "block");
    d3.select("#cases-chart").style("display", "none");
    d3.select("#deaths-chart").style("display", "none");

    d3.select("#cases-description").style("display", "none");
    d3.select("#deaths-description").style("display", "none");
    d3.select("#map-description").style("display", "block");

    const color_scale = d3.scaleQuantize([0, d3.max(data, d => d.cases)], d3.schemeBlues[9]);

    const cases_by_state = new Map(data.map(d => [d.state, d.cases]));

    g_map.selectAll("*").remove();
    g_map.append("g")
        .selectAll("path")
        .data(topojson.feature(us, us.objects.states).features)
        .enter().append("path")
        .attr("d", path)
        .attr("fill", d => {
            const cases = cases_by_state.get(d.properties.name);
            return cases ? color_scale(cases) : "#ccc";
        })
        .attr("stroke", "#333")
        .attr("stroke-width", "0.5")
        .on("mouseover", function (event, d) {
            const state = d.properties.name;
            const cases = cases_by_state.get(state) || 0;
            tooltip.transition().duration(200).style("opacity", 0.9);
            tooltip.html(`${state}<br/>Cases: ${cases}`)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function () {
            tooltip.transition().duration(500).style("opacity", 0);
        });

    g_map.append("path")
        .datum(topojson.mesh(us, us.objects.states, (a, b) => a !== b))
        .attr("fill", "none")
        .attr("stroke", "#333")
        .attr("stroke-linejoin", "round")
        .attr("d", path);

    g_map.append("text")
        .attr("x", width / 2)
        .attr("y", -5)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text("COVID-19 Cases by State");

    d3.select("#map-description").text("This map shows the number of COVID-19 cases by state for the selected year.");
};

const render_scene_3 = (data) => {
    set_size_and_margin(svg_map, g_map, { top: 40, right: 140, bottom: 40, left: 60 }, 760, 600);
    d3.select("#map-chart").style("display", "block");
    d3.select("#cases-chart").style("display", "none");
    d3.select("#deaths-chart").style("display", "none");

    d3.select("#cases-description").style("display", "none");
    d3.select("#deaths-description").style("display", "none");
    d3.select("#map-description").style("display", "block");

    const color_scale = d3.scaleQuantize([0, d3.max(data, d => d.deaths)], d3.schemeReds[9]);

    const deaths_by_state = new Map(data.map(d => [d.state, d.deaths]));

    g_map.selectAll("*").remove();
    g_map.append("g")
        .selectAll("path")
        .data(topojson.feature(us, us.objects.states).features)
        .enter().append("path")
        .attr("d", path)
        .attr("fill", d => {
            const deaths = deaths_by_state.get(d.properties.name);
            return deaths ? color_scale(deaths) : "#ccc";
        })
        .attr("stroke", "#333")
        .attr("stroke-width", "0.5")
        .on("mouseover", function (event, d) {
            const state = d.properties.name;
            const deaths = deaths_by_state.get(state) || 0;
            tooltip.transition().duration(200).style("opacity", 0.9);
            tooltip.html(`${state}<br/>Deaths: ${deaths}`)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function () {
            tooltip.transition().duration(500).style("opacity", 0);
        });

    g_map.append("path")
        .datum(topojson.mesh(us, us.objects.states, (a, b) => a !== b))
        .attr("fill", "none")
        .attr("stroke", "#333")
        .attr("stroke-linejoin", "round")
        .attr("d", path);

    g_map.append("text")
        .attr("x", width / 2)
        .attr("y", -5)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text("COVID-19 Deaths by State");

    d3.select("#map-description").text("This map shows the number of COVID-19 deaths by state for the selected year.");
};

const set_size_and_margin = (svg, g, margin, width, height) => {
    svg.attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    g.attr("transform", `translate(${margin.left},${margin.top})`);

    width = width - margin.left - margin.right;
    height = height - margin.top - margin.bottom;
};

const fetch_data = async () => {
    console.log(`Fetching data from ${file_path}`);
    all_data = await d3.csv(file_path, d => {
        d.date = d3.timeParse("%Y-%m-%d")(d.date);
        d.cases = +d.cases;
        d.deaths = +d.deaths;
        return d;
    });

    console.log(`Data fetched:`, all_data);

    us = await d3.json('data/states-10m.json');
    console.log(`TopoJSON data loaded:`, us);

    update_visualizations(year);
};

const update_visualizations = (year) => {
    const filtered_data = all_data.filter(d => d.date.getFullYear() === parseInt(year));

    const aggregated_data = Array.from(d3.rollup(
        filtered_data,
        v => ({
            cases: d3.max(v, d => d.cases),
            deaths: d3.max(v, d => d.deaths)
        }),
        d => d.state
    ), ([key, value]) => ({ state: key, ...value }));

    switch (current_scene_id) {
        case 1:
            render_scene_1(filtered_data);
            break;
        case 2:
            render_scene_2(aggregated_data);
            break;
        case 3:
            render_scene_3(aggregated_data);
            break;
    }
};

d3.select("#year").on("input", function() {
    year = this.value;
    d3.select("#year_label").text(year);
    console.log(`Year changed to: ${year}`);
    update_visualizations(year);
});

d3.select("#scene1").on("click", () => {
    current_scene_id = 1;
    update_visualizations(year);
});
d3.select("#scene2").on("click", () => {
    current_scene_id = 2;
    update_visualizations(year);
});
d3.select("#scene3").on("click", () => {
    current_scene_id = 3;
    update_visualizations(year);
});

fetch_data();
