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
    let dateVal = dateInput ? dateInput.value : getLocalDate();

    if (rangeBtn) {
        if (rangeBtn.dataset.value === "year") {
            // Only keep YYYY
            dateVal = dateVal.split("-")[0];
        } else if (rangeBtn.dataset.value === "month") {
            // Keep YYYY-MM
            dateVal = dateVal.slice(0, 7);
        }
    }

    return {
        range: rangeBtn ? rangeBtn.dataset.value : 'day',
        y: yBtn ? yBtn.dataset.value : 'solar',
        date: dateVal
    };
}


function drawDailyOutputChart() {
    console.log("Drawing Daily Energy Output chart...");
    const params = getChartParamsForDailyOutput();

    if (!params.date) {
        console.warn("Please select a date for Daily Energy Output");
        return;
    }

    fetch(`/api/daily-output?range=${params.range}&date=${params.date}&y=${params.y}`)
        .then(res => res.json())
        .then(raw => {
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

            const options = {
                height: 400,
                title: `${params.y.toUpperCase()} Output (${params.range})`,
                legend: "none",
                hAxis: {slantedText: true, showTextEvery: 1},
                pointSize: 0,            // 👈 makes points visible/clickable
                focusTarget: "datum"     // 👈 ensures clicks register on data points
            };

            chart.draw(data, options);

            google.visualization.events.addListener(chart, "select", function() {
                const selection = chart.getSelection();
                if (selection.length > 0 && selection[0].row != null) {
                    const rowIndex = selection[0].row;
                    const label = data.getValue(rowIndex, 0);   // e.g. "14:00"
                    const hour = parseInt(label);

                    console.log("Clicked hour:", hour);

                    fetch(`/api/daily-output-details?date=${params.date}&hour=${hour}&y=${params.y}`)
                        .then(res => res.json())
                        .then(items => {
                            console.log("Raw records for hour:", items);

                            const detailsDiv = document.getElementById("daily-output-details");
                            if (detailsDiv) {
                                // Clear previous content
                                detailsDiv.innerHTML = "";

                                // Table
                                const table = document.createElement("table");
                                table.className = "table table-striped table-bordered text-center";
                                table.style.tableLayout = "fixed";   // 👈 force equal widths
                                table.style.width = "100%";

                                // Table head
                                const thead = document.createElement("thead");
                                const headRow = document.createElement("tr");

                                const thTime = document.createElement("th");
                                thTime.textContent = "Time";
                                thTime.style.width = "50%";          // 👈 half width
                                headRow.appendChild(thTime);

                                const thPower = document.createElement("th");
                                thPower.textContent = "Power Per Minute (Watts)";
                                thPower.style.width = "50%";         // 👈 half width
                                headRow.appendChild(thPower);

                                thead.appendChild(headRow);
                                table.appendChild(thead);

                                // Table body
                                const tbody = document.createElement("tbody");

                                items.forEach(doc => {
                                    const ts = new Date(doc.timestamp);

                                    // Format time as HH:MM:SS AM/PM
                                    let hours = ts.getHours();
                                    const minutes = ts.getMinutes().toString().padStart(2, "0");
                                    const seconds = ts.getSeconds().toString().padStart(2, "0");
                                    const ampm = hours >= 12 ? "PM" : "AM";
                                    hours = hours % 12;
                                    if (hours === 0) hours = 12;
                                    const formattedTime = `${hours}:${minutes}:${seconds} ${ampm}`;

                                    const roundedValue = Math.round(doc.value * 10) / 10;

                                    const row = document.createElement("tr");

                                    const tdTime = document.createElement("td");
                                    tdTime.textContent = formattedTime;
                                    tdTime.style.width = "50%";
                                    row.appendChild(tdTime);

                                    const tdPower = document.createElement("td");
                                    tdPower.textContent = roundedValue;
                                    tdPower.style.width = "50%";
                                    row.appendChild(tdPower);

                                    tbody.appendChild(row);
                                });

                                table.appendChild(tbody);
                                detailsDiv.appendChild(table);
                            }
                        })
                        .catch(err => console.error("Error fetching details:", err));
                }
            });



        });
}
