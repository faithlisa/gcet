(function () {
    // Set the dimensions and margins of the graph
    const margin = { top: 20, right: 30, bottom: 50, left: 80 },
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    let customData = null;

    // Function to update the line chart with data for the selected country
    function updateChartData(selectedCountry) {
        // Remove any existing SVG first to clear previous charts
        d3.select("#line_chart svg").remove();

        // Append a new SVG object to the #line_chart div
        const svg = d3
            .select("#line_chart")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Determine which data to use: custom data or default data
        const dataPromise = customData
            ? Promise.resolve(
                  customData.filter((d) => d.Code === selectedCountry)
              )
            : d3
                  .csv("source.csv", function (d) {
                      if (d.Code === selectedCountry) {
                          return {
                              year: d3.timeParse("%Y")(d.Year),
                              emissions:
                                  +d.Carbon_dioxide_emissions_from_transport,
                          };
                      }
                  })
                  .then((data) => data.filter((d) => d));

        dataPromise.then(function (data) {
            // Add X axis --> it is a date format
            const x = d3
                .scaleTime()
                .domain(
                    d3.extent(data, function (d) {
                        return d.year;
                    })
                )
                .range([0, width]);
            svg.append("g")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(x));

            // X-axis label
            svg.append("text")
                .attr("text-anchor", "end")
                .attr("x", width / 2 + margin.left)
                .attr("y", height + margin.top + 20)
                .text("Year");

            // Add Y axis
            const y = d3
                .scaleLinear()
                .domain([
                    0,
                    d3.max(data, function (d) {
                        return +d.emissions;
                    }),
                ])
                .range([height, 0]);
            svg.append("g").call(d3.axisLeft(y));

            // Y-axis label
            svg.append("text")
                .attr("text-anchor", "end")
                .attr("transform", "rotate(-90)")
                .attr("y", -margin.left + 15)
                .attr("x", -margin.top - height / 2 + 100)
                .text("CO2 Emissions (in tonnes)");

            // Add the line
            svg.append("path")
                .datum(data)
                .attr("fill", "none")
                .attr("stroke", "steelblue")
                .attr("stroke-width", 1.5)
                .attr(
                    "d",
                    d3
                        .line()
                        .x(function (d) {
                            return x(d.year);
                        })
                        .y(function (d) {
                            return y(d.emissions);
                        })
                );
        });
    }

    // Listen for changes in the country selector dropdown
    document
        .getElementById("countrySelector")
        .addEventListener("change", function () {
            window.updateChartData(this.value);
        });

    // Expose the function to the global scope to be accessible from map.js
    window.updateChartData = updateChartData;

    // Function to handle custom CSV data upload
    function handleCustomCSVUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                customData = d3.csvParse(e.target.result, function (d) {
                    return {
                        Country: d.Country,
                        Code: d.Code,
                        Year: d.Year,
                        Carbon_dioxide_emissions_from_transport:
                            +d.Carbon_dioxide_emissions_from_transport,
                        year: d3.timeParse("%Y")(d.Year),
                        emissions: +d.Carbon_dioxide_emissions_from_transport,
                    };
                });
                window.updateChartData(
                    document.getElementById("countrySelector").value
                );
            };
            reader.readAsText(file);
        }
    }

    // Add event listener for file input change to handle custom data upload
    document
        .getElementById("fileInput")
        .addEventListener("change", handleCustomCSVUpload);

    // Initial chart load with default country
    updateChartData(null); // Or set it to null if no default country should be selected
})();
