(function () {
    // Select the SVG element and set its width and height
    const svg = d3.select("svg"),
        width = +svg.attr("width"),
        height = +svg.attr("height");

    // Set up the map projection and path
    const path = d3.geoPath();
    const projection = d3
        .geoMercator()
        .scale(130)
        .center([0, 20])
        .translate([width / 2, height / 2]);

    // Initialize variables
    let data = new Map();
    let selectedCountryCode = null;
    let customData = null;

    // Define the color scale for the map
    const colorScale = d3
        .scaleThreshold()
        .domain([
            0, 1000000, 3000000, 10000000, 30000000, 100000000, 300000000,
            1000000000,
        ])
        .range([
            "#FFFFE4",
            "#FFF7BB",
            "#FEE391",
            "#FEC44E",
            "#FE9928",
            "#EB7013",
            "#CC4C01",
            "#8C2D04",
        ]);

    // Add a legend to the map
    const legend = svg
    .append("g")
    .attr("id", "legend")
    .attr("transform", "translate(10, " + (height - 170) + ")");

    legend
    .selectAll("rect")
    .data(colorScale.range())
    .enter()
    .append("rect")
    .attr("x", 0)
    .attr("y", (d, i) => i * 20)
    .attr("width", 20)
    .attr("height", 20)
    .style("fill", (d) => d);

  legend
    .selectAll("text")
    .data(colorScale.domain())
    .enter()
    .append("text")
    .attr("x", 30)
    .attr("y", (d, i) => i * 20 + 15)
    .text((d, i) => {
      const nextValue = colorScale.domain()[i + 1];
      if (nextValue) {
        return `${d / 1000000}M - ${nextValue / 1000000}M`;
      } else {
        return `> ${d / 1000000}M`;
      }
    });
    
    // Update the year dropdown with the provided years
    function updateYearDropdown(years) {
        const yearDropdown = document.getElementById("year");
        yearDropdown.innerHTML = ""; // Clear existing options
        years.forEach((year) => {
            const option = document.createElement("option");
            option.value = year;
            option.text = year;
            yearDropdown.appendChild(option);
        });
        yearDropdown.value = Math.max(...years); // Select the most recent year
    }

    // Extract unique years from the data and sort them
    function extractYears(data) {
        return Array.from(new Set(data.map((d) => +d.Year))).sort(
            (a, b) => a - b
        );
    }

    // Load data for the selected year and update the map
    function loadDataForYear(selectedYear) {
        data.clear();
        const dataToUse = customData || defaultCSVData;
        dataToUse.forEach((d) => {
            if (d.Year == selectedYear) {
                data.set(d.Code, {
                    year: d.Year,
                    emissions: +d.Carbon_dioxide_emissions_from_transport,
                });
            }
        });
        updateMap();
    }

    // Load custom data from a CSV file and update the year dropdown and map
    function loadDataFromCSV(csvData) {
        data.clear();
        customData = csvData;
        const years = extractYears(csvData);
        updateYearDropdown(years);
        loadDataForYear(Math.max(...years));
    }

    // Update the map with the current data
    function updateMap() {
        svg.selectAll("path").remove();

        d3.json("world.geojson").then((topo) => {
            topo.features = topo.features.filter(
                (d) =>
                    d.properties.ISO_A2 !== "AQ" &&
                    d.properties.name !== "Antarctica"
            );
            svg.append("g")
                .selectAll("path")
                .data(topo.features)
                .enter()
                .append("path")
                .attr("d", path.projection(projection))
                .attr("fill", (d) => colorScale(data.get(d.id)?.emissions || 0))
                .style("stroke", "gray")
                .style("stroke-width", 0.5)
                .attr("class", "Country")
                .style("opacity", 0.8)
                .on("mouseover", mouseOver)
                .on("mouseleave", mouseLeave);
        });
    }

    // Tooltip for displaying additional information
    const tooltip = d3.select("#tooltip");

    // Handle mouseover event on the map
    function mouseOver(event, d) {
        const countryCode = d.id;
        selectedCountryCode = countryCode;
        window.updateChartData(countryCode);
        tooltip
            .html(
                `<h3>${d.properties.name}</h3>${
                    data.get(d.id)?.year || "N/A"
                }<br><strong>${
                    data.get(d.id)?.emissions.toLocaleString() || 0
                } tonnes</strong>`
            )
            .style("opacity", 1)
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY + 10}px`);
        d3.selectAll(".Country")
            .transition()
            .duration(200)
            .style("opacity", 0.5);
        d3.select(this)
            .transition()
            .duration(200)
            .style("opacity", 1)
            .style("stroke", "black");
    }

    // Handle mouseleave event on the map
    function mouseLeave() {
        tooltip.style("opacity", 0);
        d3.selectAll(".Country")
            .transition()
            .duration(200)
            .style("opacity", 0.8);
        d3.select(this).transition().duration(200).style("stroke", "gray");
        updateChartData(null);
    }

    // Add event listener for year selection change
    document.getElementById("year").addEventListener("change", function () {
        loadDataForYear(this.value);
    });

    // Add event listener for custom data button click
    document
        .getElementById("customData")
        .addEventListener("click", function () {
            document.getElementById("fileInput").click();
        });

    // Add event listener for file input change
    document
        .getElementById("fileInput")
        .addEventListener("change", function (event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    const csvData = d3.csvParse(e.target.result);
                    loadDataFromCSV(csvData);
                };
                reader.readAsText(file);
            }
        });

    // Load default data and initialize the map
    let defaultCSVData;
    d3.csv("source.csv", function (d) {
        return {
            Country: d.Country,
            Code: d.Code,
            Year: d.Year,
            Carbon_dioxide_emissions_from_transport:
                +d.Carbon_dioxide_emissions_from_transport,
        };
    }).then((data) => {
        defaultCSVData = data;
        const years = extractYears(data);
        updateYearDropdown(years);
        loadDataForYear(Math.max(...years));
    });
})();
