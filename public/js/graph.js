google.charts.load("current", { packages: ["corechart"] });
google.charts.setOnLoadCallback(initDailyEnergyOutput);

function initDailyEnergyOutput() {
    console.log("Initializing Daily Energy Output chart...");
    setupDropdownListeners();
    initControls();
    document.getElementById("daily-output-date").value = getLocalDate();
    drawDailyOutputChart();
}

function getLocalDate() {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split("T")[0];
}

function setupDropdownListeners() {
    console.log("Setting up dropdown listeners for Daily Energy Output...");

    // Get the card body that contains our chart
    const chartElement = document.getElementById("DailyEnergyOutput");
    if (!chartElement) {
        console.error("DailyEnergyOutput chart element not found!");
        return;
    }

    const cardBody = chartElement.closest('.card-body');
    if (!cardBody) {
        console.error("Could not find card body for Daily Energy Output");
        return;
    }

    // X-axis dropdown
    cardBody.querySelectorAll("[data-x-axis] ~ .dropdown-menu .dropdown-item")
        .forEach(item => {
            item.addEventListener("click", (e) => {
                e.preventDefault();
                const range = e.target.dataset.value;
                const btn = e.target.closest(".dropdown").querySelector("[data-x-axis]");
                console.log("X-axis changed to:", range);
                btn.innerText = e.target.innerText;
                btn.dataset.value = range;
                drawDailyOutputChart();
            });
        });

    // Y-axis dropdown
    cardBody.querySelectorAll("[data-y-axis] ~ .dropdown-menu .dropdown-item")
        .forEach(item => {
            item.addEventListener("click", (e) => {
                e.preventDefault();
                const btn = e.target.closest(".dropdown").querySelector("[data-y-axis]");
                console.log("Y-axis changed to:", e.target.dataset.value);
                btn.innerText = e.target.innerText;
                btn.dataset.value = e.target.dataset.value;
                drawDailyOutputChart();
            });
        });
}

function initControls() {
    console.log("Initializing controls for Daily Energy Output...");
    const dateInput = document.getElementById("daily-output-date");
    if (dateInput) {
        dateInput.addEventListener("change", () => {
            console.log("Date changed for Daily Energy Output");
            drawDailyOutputChart();
        });
    } else {
        console.error("daily-output-date input not found!");
    }
}

function getChartParamsForDailyOutput() {
    const cardBody = document.getElementById("DailyEnergyOutput").closest('.card-body');

    const rangeBtn = cardBody.querySelector("[data-x-axis]");
    const yBtn = cardBody.querySelector("[data-y-axis]");
    const dateInput = document.getElementById("daily-output-date");

    return {
        range: rangeBtn ? rangeBtn.dataset.value : 'day',
        y: yBtn ? yBtn.dataset.value : 'solar',
        date: dateInput ? dateInput.value : getLocalDate()
    };
}

function drawDailyOutputChart() {
    console.log("Drawing Daily Energy Output chart...");
    const params = getChartParamsForDailyOutput();

    console.log("Chart params:", params);

    if (!params.date) {
        console.log("Please select a date for Daily Energy Output");
        return;
    }

    fetch(`/api/daily-output?range=${params.range}&date=${params.date}&y=${params.y}`)
        .then(res => res.json())
        .then(raw => {
            console.log("Received data for Daily Energy Output:", raw);

            if (!raw || raw.length === 0) {
                console.error("No data returned from API");
                return;
            }

            const rows = raw.map(item => [String(item[0]), Number(item[1])]);
            const data = google.visualization.arrayToDataTable([
                ["Label", params.y.toUpperCase()],
                ...rows
            ]);
            const chart = new google.visualization.AreaChart(
                document.getElementById("DailyEnergyOutput")
            );
            chart.draw(data, {
                height: 400,
                title: `${params.y.toUpperCase()} Output (${params.range})`,
                legend: "none",
                hAxis: { slantedText: true, showTextEvery: 1 }
            });
        })
        .catch(err => console.error("Daily Energy Output Chart Error:", err));
}
