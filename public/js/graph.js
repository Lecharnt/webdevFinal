google.charts.load("current", { packages: ["corechart"] });
google.charts.setOnLoadCallback(initCharts);

function initCharts() {
    setupDropdownListeners();
    initControls()
    document.getElementById("daily-outputs").addEventListener("change", drawDailyOutput);
    drawDailyOutput();
}

function setupDropdownListeners() {

    // X-axis: day / month / year
    document.querySelectorAll("[data-x-axis] ~ .dropdown-menu .dropdown-item")
        .forEach(item => {
            item.addEventListener("click", (e) => {
                let range = e.target.dataset.value;
                let btn = e.target.closest(".dropdown").querySelector("[data-x-axis]");

                btn.innerText = e.target.innerText;
                btn.dataset.value = range;
                reloadChart(btn.dataset.chart);
            });
        });

    // Y-axis solar / wind
    document.querySelectorAll("[data-y-axis] ~ .dropdown-menu .dropdown-item")
        .forEach(item => {
            item.addEventListener("click", (e) => {
                let btn = e.target.closest(".dropdown").querySelector("[data-y-axis]");
                btn.innerText = e.target.innerText;
                btn.dataset.value = e.target.dataset.value;

                reloadChart(btn.dataset.chart);
            });
        });
}
function initControls() {
    // Listen to Day / Month / Year buttons
    document.querySelectorAll("[data-range]").forEach(btn => {
        btn.addEventListener("click", () => {
            let range = btn.dataset.range;
            let date = document.getElementById("daily-outputs").value;

            if (!date) {
                alert("Please select a date.");
                return;
            }
            loadChart(range, date);
        });
    });
}

function reloadChart(chartName) {
    if (chartName === "daily-output") drawDailyOutput();
}

function drawDailyOutput() {
    const range = document.querySelector("[data-x-axis][data-chart='daily-output']").dataset.value;
    const y = document.querySelector("[data-y-axis][data-chart='daily-output']").dataset.value;

    let rawInput = document.getElementById("daily-outputs").value;
    if (!rawInput) return;

    let date;
    if (range === "day") {
        date = rawInput; // YYYY-MM-DD
    } else if (range === "month") {
        // Convert YYYY-MM-DD -> YYYY-MM
        const [yStr, mStr] = rawInput.split("-");
        date = `${yStr}-${mStr}`;
    } else if (range === "year") {
        // Convert YYYY-MM-DD -> YYYY
        date = rawInput.split("-")[0];
    }

    fetch(`/api/daily-output?range=${range}&date=${date}&y=${y}`)
        .then(res => res.json())
        .then(raw => {
            const rows = raw.map(item => [String(item[0]), Number(item[1])]);
            const data = google.visualization.arrayToDataTable([
                ["Label", y.toUpperCase()],
                ...rows
            ]);
            const chart = new google.visualization.AreaChart(
                document.getElementById("DailyEnergyOutput")
            );
            chart.draw(data, {
                height: 400,
                title: `${y.toUpperCase()} Output (${range})`,
                legend: "none",
                hAxis: { slantedText: true, showTextEvery: 1 }
            });
        })
        .catch(err => console.error("Chart Error:", err));
}


