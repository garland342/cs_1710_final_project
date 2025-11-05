document.addEventListener("DOMContentLoaded", () => {
  if (typeof d3 !== 'undefined') {
    console.log("Page ready. D3 version:", d3.version);

    // ----------------------------------------------------
    // BAR CHARTS FOR FOOD DESERT AND DEPRESSION DATA
    // ----------------------------------------------------

    // Real data for food desert tracts
    const foodDesertTractsData = [
      { state: "Texas", tracts: 1022 },
      { state: "Florida", tracts: 550 },
      { state: "California", tracts: 536 },
      { state: "Georgia", tracts: 441 },
      { state: "Ohio", tracts: 421 },
      { state: "North Carolina", tracts: 353 },
      { state: "Michigan", tracts: 339 },
      { state: "Illinois", tracts: 319 },
      { state: "Indiana", tracts: 291 },
      { state: "Virginia", tracts: 269 }
    ];

    // Sample data for depression bar charts
    const depressionStatesData = [
      { state: "Vermont", value: 25.8 },
      { state: "Washington", value: 26.1 },
      { state: "Oregon", value: 26.2 },
      { state: "Utah", value: 26.7 },
      { state: "Arkansas", value: 27.0 },
      { state: "Louisiana", value: 27.1 },
      { state: "Kentucky", value: 27.2 },
      { state: "Oklahoma", value: 27.7 },
      { state: "West Virginia", value: 28.3 },
      { state: "Tennessee", value: 29.6 }
    ];

    const depressionRegionData = [
      { region: "South", value: 23.5 },
      { region: "Midwest", value: 21.8 },
      { region: "West", value: 19.6 },
      { region: "Northeast", value: 18.4 }
    ];

    // Regional food desert data
    const foodDesertRegionData = [
      { region: "South", tracts: 2850 },
      { region: "Midwest", tracts: 1920 },
      { region: "West", tracts: 1650 },
      { region: "Northeast", tracts: 980 }
    ];

    // Create food desert tracts bar chart in the top left section
    createFoodDesertBarChart(
      ".split-layout-top-section .left-section",
      foodDesertTractsData
    );

    // Create food desert regional chart in the top right section
    createFoodDesertRegionalChart(
      ".split-layout-top-section .right-section",
      foodDesertRegionData
    );

    // Create depression bar chart (States)
    createDepressionBarChart(
      "#depression-bar-chart-container",
      depressionStatesData,
      "state",
      "value",
      "Percentage (%)"
    );

    // Create depression bar chart (Regions)
    createDepressionBarChart(
      "#depression-map-container",
      depressionRegionData,
      "region",
      "value",
      "Percentage (%)"
    );

    function createFoodDesertBarChart(containerSelector, data) {
      const container = d3.select(containerSelector);
      
      // Add title text above the chart
      container.append("p")
        .attr("class", "chart-title")
        .style("font-size", "1.1rem")
        .style("font-weight", "bold")
        .style("margin-bottom", "15px")
        .style("text-align", "center")
        .text("Top 10 States with the Highest Number of Low-Income Low Access Tracts");
      
      // Set dimensions
      const margin = { top: 20, right: 20, bottom: 80, left: 80 };
      const width = 500 - margin.left - margin.right;
      const height = 400 - margin.top - margin.bottom;

      // Create SVG
      const svg = container.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      // Create scales
      const x = d3.scaleBand()
        .domain(data.map(d => d.state))
        .range([0, width])
        .padding(0.2);

      const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.tracts) * 1.1])
        .range([height, 0]);

      // Add bars
      svg.selectAll(".bar")
        .data(data)
        .join("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.state))
        .attr("y", d => y(d.tracts))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.tracts))
        .attr("fill", "#2d5016");

      // Add x-axis
      svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end")
        .style("font-size", "10px");

      // Add x-axis label
      svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 70)
        .attr("fill", "black")
        .style("text-anchor", "middle")
        .style("font-size", "12px")
        .text("State");

      // Add y-axis
      svg.append("g")
        .call(d3.axisLeft(y));

      // Add y-axis label
      svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -65)
        .attr("x", -height / 2)
        .attr("fill", "black")
        .style("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Number of Low Income Low Access Tracts");
    }

    function createFoodDesertRegionalChart(containerSelector, data) {
      const container = d3.select(containerSelector);
      
      // Add title text above the chart
      container.append("p")
        .attr("class", "chart-title")
        .style("font-size", "1.1rem")
        .style("font-weight", "bold")
        .style("margin-bottom", "15px")
        .style("text-align", "center")
        .text("Regional Distribution of Food Desert Tracts");
      
      // Set dimensions
      const margin = { top: 20, right: 20, bottom: 80, left: 80 };
      const width = 500 - margin.left - margin.right;
      const height = 400 - margin.top - margin.bottom;

      // Create SVG
      const svg = container.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      // Create scales
      const x = d3.scaleBand()
        .domain(data.map(d => d.region))
        .range([0, width])
        .padding(0.2);

      const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.tracts) * 1.1])
        .range([height, 0]);

      // Add bars with dark green color
      svg.selectAll(".bar")
        .data(data)
        .join("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.region))
        .attr("y", d => y(d.tracts))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.tracts))
        .attr("fill", "#2d5016");

      // Add x-axis
      svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("text-anchor", "middle")
        .style("font-size", "11px");

      // Add x-axis label
      svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 50)
        .attr("fill", "black")
        .style("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Region");

      // Add y-axis
      svg.append("g")
        .call(d3.axisLeft(y));

      // Add y-axis label
      svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -65)
        .attr("x", -height / 2)
        .attr("fill", "black")
        .style("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Number of Food Desert Tracts");
    }

    function createDepressionBarChart(containerSelector, data, xKey, yKey, yLabel) {
      const container = d3.select(containerSelector);
      
      // Only add title for the states chart (left side)
      if (containerSelector === "#depression-bar-chart-container") {
        container.append("p")
          .attr("class", "chart-title")
          .style("font-size", "1.1rem")
          .style("font-weight", "bold")
          .style("margin-bottom", "15px")
          .style("text-align", "center")
          .text("Top 10 States with Highest Proportion of Depressed Individuals");
      }
      
      // Set dimensions with extra right margin for the label
      const margin = { top: 20, right: 120, bottom: 80, left: 80 };
      const width = 500 - margin.left - margin.right;
      const height = 350 - margin.top - margin.bottom;

      // Create SVG
      const svg = container.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      // Create scales
      const x = d3.scaleBand()
        .domain(data.map(d => d[xKey]))
        .range([0, width])
        .padding(0.2);

      const y = d3.scaleLinear()
        .domain([0, 35])
        .range([height, 0]);

      // Add bars with dark purple color
      svg.selectAll(".bar")
        .data(data)
        .join("rect")
        .attr("class", "bar")
        .attr("x", d => x(d[xKey]))
        .attr("y", d => y(d[yKey]))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d[yKey]))
        .attr("fill", "#4a235a");

      // Add nationwide average line (only for states chart)
      if (containerSelector === "#depression-bar-chart-container") {
        const nationalAvg = 22.5;
        
        // Draw red dotted line
        svg.append("line")
          .attr("x1", 0)
          .attr("x2", width)
          .attr("y1", y(nationalAvg))
          .attr("y2", y(nationalAvg))
          .attr("stroke", "red")
          .attr("stroke-width", 2)
          .attr("stroke-dasharray", "5,5");
        
        // Add label outside the graph
        svg.append("text")
          .attr("x", width + 10)
          .attr("y", y(nationalAvg) + 5)
          .attr("fill", "red")
          .style("font-size", "11px")
          .style("font-weight", "bold")
          .text("Nationwide Average");
      }

      // Add x-axis
      svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end")
        .style("font-size", "10px");

      // Add x-axis label
      svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 70)
        .attr("fill", "black")
        .style("text-anchor", "middle")
        .style("font-size", "12px")
        .text(containerSelector === "#depression-bar-chart-container" ? "States" : xKey);

      // Add y-axis
      svg.append("g")
        .call(d3.axisLeft(y));

      // Add y-axis label
      svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -70)
        .attr("x", -height / 2)
        .attr("fill", "black")
        .style("text-anchor", "middle")
        .style("font-size", "11px")
        .text(containerSelector === "#depression-bar-chart-container" 
          ? "% of Residents Who Have Reported Depression in Last 10 Years" 
          : yLabel);
    }

    // ----------------------------------------------------
    // D3 VORONOI DIAGRAM FOR COMMUNITY ORGANIZATIONS
    // ----------------------------------------------------

    const communityOrgs = [
      { name: "The Food For Thought Foundation", url: "https://www.thefoodforthoughtfoundation.org" },
      { name: "Feeding America", url: "https://www.feedingamerica.org" },
      { name: "Food Research & Action Center (FRAC)", url: "https://frac.org" },
      { name: "National Alliance on Mental Illness (NAMI)", url: "https://www.nami.org" },
      { name: "Mental Health America (MHA)", url: "https://mhanational.org" },
      { name: "Active Minds", url: "https://activeminds.org" },
      { name: "Rural Minds", url: "https://www.ruralminds.org" }
    ];

    const container = d3.select("#voronoi-container");
    const containerRect = container.node().getBoundingClientRect();
    const width = containerRect.width > 0 ? containerRect.width : 800; 
    const height = 500; 

    const svg = container.append("svg")
      .attr("width", width)
      .attr("height", height);

    // Create semi-random grid positions with some variation
    const cols = 3;
    const rows = 3;
    const cellWidth = width / cols;
    const cellHeight = height / rows;
    
    const points = communityOrgs.map((org, i) => ({
      ...org,
      x: (i % cols) * cellWidth + cellWidth / 2 + (Math.random() - 0.5) * cellWidth * 0.3,
      y: Math.floor(i / cols) * cellHeight + cellHeight / 2 + (Math.random() - 0.5) * cellHeight * 0.3
    }));

    // Extract coordinates for d3.Delaunay
    const coordinates = points.map(d => [d.x, d.y]);

    const delaunay = d3.Delaunay.from(coordinates);
    const voronoi = delaunay.voronoi([0, 0, width, height]);

    // Map sites to their polygons and include the original data
    const polygons = Array.from({ length: points.length }, (_, i) => ({
      data: points[i],
      polygon: voronoi.cellPolygon(i)
    })).filter(d => d.polygon !== null);


    // Create a group for each cell
    const cellGroups = svg.selectAll(".voronoi-cell")
      .data(polygons)
      .join("g")
        .attr("class", "voronoi-cell")
        .style("cursor", "pointer")
        .on("click", (event, d) => {
          if (d && d.data && d.data.url) {
            window.open(d.data.url, "_blank");
          }
        });

    // Append the Voronoi cell paths
    cellGroups.append("path")
      .attr("d", d => "M" + d.polygon.join("L") + "Z")
      .attr("fill", (d, i) => d3.schemeCategory10[i % 10]) 
      .attr("stroke", "#333")
      .attr("stroke-width", 1)
      .attr("opacity", 0.7)
      .attr("class", "voronoi-path")
      .each(function(d, i) {
        // Store original color
        const color = d3.schemeCategory10[i % 10];
        d3.select(this).attr("data-original-color", color);
      })
      .on("mouseenter", function() {
        const originalColor = d3.select(this).attr("data-original-color");
        d3.select(this)
          .transition()
          .duration(200)
          .attr("opacity", 0.9)
          .attr("fill", d3.color(originalColor).brighter(1.2));
      })
      .on("mouseleave", function() {
        const originalColor = d3.select(this).attr("data-original-color");
        d3.select(this)
          .transition()
          .duration(200)
          .attr("opacity", 0.7)
          .attr("fill", originalColor);
      });

    // Append text labels to the center of each cell
    const textElements = cellGroups.append("text")
      .attr("x", d => d3.polygonCentroid(d.polygon)[0]) 
      .attr("y", d => d3.polygonCentroid(d.polygon)[1])
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "middle")
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .attr("fill", "white")
      .style("pointer-events", "none"); 
      
    // Apply the custom wrapText function
    textElements.call(wrapText, 120);

    // Function to wrap text inside SVG
    function wrapText(text, width) {
      text.each(function(d) { 
        const textElement = d3.select(this);
        const orgName = d.data.name; 
        if (!orgName) return;
        
        const words = orgName.split(/\s+/).reverse();
        let word;
        let line = [];
        let lineNumber = 0;
        const lineHeight = 1.1; // ems
        const y = textElement.attr("y");
        const x = textElement.attr("x");
        let tspan = textElement.text(null)
          .append("tspan")
            .attr("x", x)
            .attr("y", y);
        
        while (word = words.pop()) {
          line.push(word);
          tspan.text(line.join(" "));
          if (tspan.node().getComputedTextLength() > width && line.length > 1) {
            line.pop();
            tspan.text(line.join(" "));
            line = [word];
            tspan = textElement.append("tspan")
              .attr("x", x)
              .attr("y", y)
              .attr("dy", ++lineNumber * lineHeight + "em")
              .text(word);
          }
        }
        // Adjust vertical position for multi-line text to truly center
        const totalLines = textElement.selectAll("tspan").size();
        if (totalLines > 1) {
          textElement.selectAll("tspan")
            .attr("dy", (d, i) => (i - (totalLines - 1) / 2) * lineHeight + "em");
        }
      });
    }

  } else {
    console.log("Page ready. D3 not loaded yet.");
  }
});