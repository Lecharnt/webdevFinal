google.charts.setOnLoadCallback(initPowerSources);

function initPowerSources() {
    console.log("Initializing Power Sources chart...");
    setupPowerSourcesControls();
    const dateInput = document.getElementById("power-sources-date");
    if (dateInput) {
        dateInput.value = getLocalDateForPowerSources();
    }
    loadPowerSourcesChart();
}

function getLocalDateForPowerSources() {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split("T")[0];
}

function setupPowerSourcesControls() {
    console.log("Setting up controls for Power Sources...");
    const chartElement = document.getElementById("PowerSourcesChart");
    if (!chartElement) {
        console.error("PowerSourcesChart chart element not found!");
        return;
    }

    const cardBody = chartElement.closest('.card-body');
    if (!cardBody) {
        console.error("Could not find card body for Power Sources");
        return;
    }

    // Get dropdown elements specific to Power Sources section
    const dropdown = cardBody.querySelector("[data-x-axis]");
    const dateInput = document.getElementById("power-sources-date");

    if (!dropdown) {
        console.error("Power Sources dropdown not found!");
        return;
    }

    if (!dateInput) {
        console.error("power-sources-date input not found!");
        return;
    }

    // Handle dropdown selections for Power Sources
    cardBody.querySelectorAll(".dropdown-menu .dropdown-item").forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            const range = e.target.dataset.value;

            console.log("Power Sources range changed to:", range);

            // Update button text and internal dataset
            dropdown.textContent = e.target.textContent;
            dropdown.dataset.range = range;

            loadPowerSourcesChart();
        });
    });

    // Reload when date changes
    dateInput.addEventListener("change", loadPowerSourcesChart);
}

function getChartParamsForPowerSources() {
    const chartElement = document.getElementById("PowerSourcesChart");
    if (!chartElement) return { range: 'day', date: getLocalDateForPowerSources() };

    const cardBody = chartElement.closest('.card-body');
    if (!cardBody) return { range: 'day', date: getLocalDateForPowerSources() };

    const dropdown = cardBody.querySelector("[data-x-axis]");
    const dateInput = document.getElementById("power-sources-date");

    return {
        range: dropdown ? dropdown.dataset.range : 'day',
        date: dateInput ? dateInput.value : getLocalDateForPowerSources()
    };
}

function loadPowerSourcesChart() {
    console.log("Loading Power Sources chart...");
    const params = getChartParamsForPowerSources();

    console.log("Power Sources params:", params);

    if (!params.range || !params.date) {
        console.log("Please select both range and date for Power Sources");
        return;
    }

    fetch(`/api/power-sources?range=${params.range}&date=${params.date}`)
        .then(res => res.json())
        .then(raw => {
            console.log("Received data for Power Sources:", raw);

            if (raw.error) {
                //console.error("API error for Power Sources:", raw.error);
                return alert(raw.error);
            }

            if (!raw || !raw.labels || !raw.grid || !raw.solar || !raw.battery) {
                console.error("Invalid data structure for Power Sources");
                return;
            }

            drawPowerSourcesChart(raw, params.range);
        })
        .catch(err => console.error("Power Sources Chart load error:", err));
}

function drawPowerSourcesChart(raw, range) {
    console.log("Drawing Power Sources chart...");

    const data = google.visualization.arrayToDataTable([
        ["Time", "Grid", "Solar", "Battery"],
        ...raw.labels.map((label, i) => [
            String(label),
            raw.grid[i] || 0,
            raw.solar[i] || 0,
            raw.battery[i] || 0
        ])
    ]);

    const options = {
        title: chartTitleForPowerSources(range),
        height: 450,
        vAxis: { minValue: 0, maxValue: 2000 },
        legend: { position: "bottom" },
        colors: ["#0066ff", "#ffcc00", "#ff0000"],
        areaOpacity: 0.35
    };

    new google.visualization.AreaChart(
        document.getElementById("PowerSourcesChart")
    ).draw(data, options);
}

function chartTitleForPowerSources(range) {
    switch (range) {
        case "day": return "Hourly Power Output";
        case "month": return "Daily Power Output (Month)";
        case "year": return "Monthly Power Output (Year)";
        default: return "Power Sources";
    }
}