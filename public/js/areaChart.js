google.charts.load("current", { packages: ["corechart"] });
google.charts.setOnLoadCallback(initPowerSources);

function initPowerSources() {
    console.log("Initializing Power Sources chart...");
    setupPowerSourcesControls();
    document.getElementById("power-sources-date").value = getLocalDateForPowerSources();
    loadPowerSourcesChart();
}

function getLocalDateForPowerSources() {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split("T")[0];
}

function setupPowerSourcesControls() {
    const chartElement = document.getElementById("PowerSourcesChart");
    const dateInput = document.getElementById("power-sources-date");

    if (!chartElement) return;

    const noDropdown = chartElement.dataset.noDropdown === "true";

    if (!noDropdown) {
        // Only setup dropdown listeners if dropdown exists
        const cardBody = chartElement.closest('.card-body');
        const dropdown = cardBody.querySelector("[data-x-axis]");
        if (dropdown) {
            cardBody.querySelectorAll(".dropdown-menu .dropdown-item").forEach(item => {
                item.addEventListener("click", (e) => {
                    e.preventDefault();
                    dropdown.textContent = e.target.textContent;
                    dropdown.dataset.range = e.target.dataset.value;
                    loadPowerSourcesChart();
                });
            });
        }
    }

    // Always setup date input listener
    if (dateInput) {
        dateInput.addEventListener("change", loadPowerSourcesChart);
    }
}


function getChartParamsForPowerSources() {
    const chartElement = document.getElementById("PowerSourcesChart");
    const dateInput = document.getElementById("power-sources-date");

    const noDropdown = chartElement.dataset.noDropdown === "true";

    return {
        range: noDropdown ? "day" : (chartElement.closest('.card-body').querySelector("[data-x-axis]")?.dataset.range || "day"),
        date: dateInput ? dateInput.value : getLocalDateForPowerSources()
    };
}


function loadPowerSourcesChart() {
    const params = getChartParamsForPowerSources();

    fetch(`/api/power-sources?range=${params.range}&date=${params.date}`)
        .then(res => res.json())
        .then(raw => {
            if (!raw || !raw.labels) {
                console.error("Invalid data structure for Power Sources");
                return;
            }
            drawPowerSourcesChart(raw, params.range, params.date);
        })
        .catch(err => console.error("Power Sources Chart load error:", err));
}

function drawPowerSourcesChart(raw, range, date) {
    const data = google.visualization.arrayToDataTable([
        ["Time", "Wind", "Solar", "Battery"],
        ...raw.labels.map((label, i) => [
            String(label),
            raw.acPower[i] || 0,
            raw.solar[i] || 0,
            raw.battery[i] || 0
        ])
    ]);

    const options = {
        title: chartTitleForPowerSources(range),
        height: 450,
        legend: { position: "bottom" },
        vAxis: { minValue: 0 },
        pointSize: 0,
        focusTarget: "datum",
        areaOpacity: 0.35,
        colors: ["#0066ff", "#ffcc00", "#ff0000"]
    };

    const chart = new google.visualization.AreaChart(
        document.getElementById("PowerSourcesChart")
    );

    chart.draw(data, options);

    google.visualization.events.addListener(chart, "select", function() {
        const selection = chart.getSelection();
        if (selection.length === 0 || selection[0].row == null) return;

        const rowIndex = selection[0].row;
        const colIndex = selection[0].column;


        const sources = ["wind", "solar", "battery"];
        const source = sources[colIndex - 1];

        const label = data.getValue(rowIndex, 0);
        let hour = parseInt(label);

        console.log("Clicked:", { label, hour, source });

        fetch(`/api/power-sources-details?date=${date}&hour=${hour}&source=${source}`)
            .then(res => res.json())
            .then(items => showPowerSourcesDetails(items, source))
            .catch(err => console.error("Details fetch error:", err));
    });
}

function showPowerSourcesDetails(items, source) {
    const detailsDiv = document.getElementById("power-sources-details");
    detailsDiv.innerHTML = "";

    const table = document.createElement("table");
    table.className = "table table-striped table-bordered text-center";
    table.style.width = "100%";

    const thead = document.createElement("thead");
    thead.innerHTML = `
        <tr>
            <th style="width:50%">Time</th>
            <th style="width:50%">${source.charAt(0).toUpperCase() + source.slice(1)} Per Minute (Watts)</th>
        </tr>`;
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    items.forEach(doc => {
        const ts = new Date(doc.timestamp);
        let hours = ts.getHours();
        const minutes = ts.getMinutes().toString().padStart(2, "0");
        const seconds = ts.getSeconds().toString().padStart(2, "0");
        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12 || 12;

        const formattedTime = `${hours}:${minutes}:${seconds} ${ampm}`;
        const roundedValue = Math.round(doc.value * 10) / 10;

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${formattedTime}</td>
            <td>${roundedValue}</td>`;
        tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    detailsDiv.appendChild(table);
}

function chartTitleForPowerSources(range) {
    switch (range) {
        case "day": return "Hourly Power Output";
        case "month": return "Daily Power Output (Month)";
        case "year": return "Monthly Power Output (Year)";
        default: return "Power Sources";
    }
}
