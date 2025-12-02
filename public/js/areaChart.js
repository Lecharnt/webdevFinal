google.charts.load("current", { packages: ["corechart"] });
google.charts.setOnLoadCallback(initControls);

function initControls() {
    let dropdown = document.querySelector("[data-x-axis]");
    let dateInput = document.getElementById("datePicker");

    // Handle dropdown selections
    document.querySelectorAll(".dropdown-menu .dropdown-item").forEach(item => {
        item.addEventListener("click", () => {
            const range = item.dataset.value;

            // Update button text and internal dataset
            dropdown.textContent = item.textContent;
            dropdown.dataset.range = range;

            // ALWAYS reload chart after selecting dropdown item
            tryLoadChart();
        });
    });

    // Also reload when date changes
    dateInput.addEventListener("change", tryLoadChart);

    function tryLoadChart() {
        const range = dropdown.dataset.range;
        const date = dateInput.value;

        if (!range || !date) return;

        loadChart(range, date);
    }
}


function loadChart(range, date) {
    fetch(`/api/power-sources?range=${range}&date=${date}`)
        .then(res => res.json())
        .then(raw => {
            if (raw.error) return alert(raw.error);
            drawChart(raw, range);
        })
        .catch(err => console.error("Chart load error:", err));
}

function drawChart(raw, range) {
    const rows = raw.labels.map((label, i) => [
        String(label),
        raw.grid[i],
        raw.solar[i],
        raw.battery[i]
    ]);

    const data = google.visualization.arrayToDataTable([
        ["Time", "Grid", "Solar", "Battery"],
        ...raw.labels.map((label, i) => [
            String(label),           // <— string labels prevent numeric scaling
            raw.grid[i],
            raw.solar[i],
            raw.battery[i]
        ])
    ]);


    const options = {
        title: chartTitle(range),
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

function chartTitle(range) {
    switch (range) {
        case "day": return "Hourly Power Output";
        case "month": return "Daily Power Output (Month)";
        case "year": return "Monthly Power Output (Year)";
    }
}