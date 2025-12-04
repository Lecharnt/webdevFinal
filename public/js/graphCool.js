const BatteryVoltage = {
    init() {
        console.log("Initializing Battery Voltage chart...");
        this.setupDropdownListeners();
        this.initControls();
        const dateInput = document.getElementById("battery-voltage-date");
        if (dateInput) {
            dateInput.value = this.getLocalDate();
        }
        this.drawBatteryVoltageChart();
    },

    getLocalDate() {
        const d = new Date();
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().split("T")[0];
    },

    setupDropdownListeners() {
        console.log("Setting up dropdown listeners for Battery Voltage...");
        const chartElement = document.getElementById("BatteryVoltage");
        if (!chartElement) {
            console.error("BatteryVoltage chart element not found!");
            return;
        }

        const cardBody = chartElement.closest('.card-body');
        if (!cardBody) {
            console.error("Could not find card body for Battery Voltage");
            return;
        }

        // X-axis dropdown
        cardBody.querySelectorAll("[data-x-axis] ~ .dropdown-menu .dropdown-item")
            .forEach(item => {
                item.addEventListener("click", (e) => {
                    e.preventDefault();
                    const btn = e.target.closest(".dropdown").querySelector("[data-x-axis]");
                    console.log("Battery Voltage X-axis changed to:", e.target.dataset.value);
                    btn.innerText = e.target.innerText;
                    btn.dataset.value = e.target.dataset.value;
                    this.drawBatteryVoltageChart();
                });
            });

        // Y-axis dropdown
        cardBody.querySelectorAll("[data-y-axis] ~ .dropdown-menu .dropdown-item")
            .forEach(item => {
                item.addEventListener("click", (e) => {
                    e.preventDefault();
                    const btn = e.target.closest(".dropdown").querySelector("[data-y-axis]");
                    console.log("Battery Voltage Y-axis changed to:", e.target.dataset.value);
                    btn.innerText = e.target.innerText;
                    btn.dataset.value = e.target.dataset.value;
                    this.drawBatteryVoltageChart();
                });
            });
    },

    initControls() {
        console.log("Initializing controls for Battery Voltage...");
        const dateInput = document.getElementById("battery-voltage-date");
        if (dateInput) {
            dateInput.addEventListener("change", () => {
                console.log("Date changed for Battery Voltage");
                this.drawBatteryVoltageChart();
            });
        } else {
            console.error("battery-voltage-date input not found!");
        }
    },

        getChartParamsForBatteryVoltage() {
            const chartElement = document.getElementById("BatteryVoltage");
            if (!chartElement) return { range: 'day', y: 'BattV', date: this.getLocalDate() };

            const cardBody = chartElement.closest('.card-body');
            if (!cardBody) return { range: 'day', y: 'BattV', date: this.getLocalDate() };

            const rangeBtn = cardBody.querySelector("[data-x-axis]");
            const dateInput = document.getElementById("battery-voltage-date");

            let range = rangeBtn ? rangeBtn.dataset.value : 'day';
            let date = dateInput ? dateInput.value : this.getLocalDate();

            if (range === "year" && date) {
                date = date.split("-")[0];
            }

            return { range, y: "BattV", date };




    },

    drawBatteryVoltageChart() {
        console.log("Drawing Battery Voltage chart...");
        const params = this.getChartParamsForBatteryVoltage();

        if (!params.date) {
            console.warn("Please select a date for Battery Voltage");
            return;
        }

        fetch(`/api/daily-output-cool?range=${params.range}&date=${params.date}`)
            .then(res => res.json())
            .then(raw => {
                if (!raw || raw.length === 0) {
                    console.error("No data returned from API for Battery Voltage");
                    return;
                }

                const rows = raw.map(item => [String(item[0]), Number(item[1])]);
                const data = google.visualization.arrayToDataTable([
                    ["Label", "BattV"],
                    ...rows
                ]);

                const chart = new google.visualization.AreaChart(
                    document.getElementById("BatteryVoltage")
                );

                const options = {
                    height: 400,
                    title: `Battery Voltage (${params.range})`,
                    legend: "none",
                    hAxis: { slantedText: true, showTextEvery: 1 },
                    pointSize: 0,            // 👈 make points clickable
                    focusTarget: "datum"
                };

                chart.draw(data, options);

                // Drill-down click handler
                google.visualization.events.addListener(chart, "select", function() {
                    const selection = chart.getSelection();
                    if (selection.length > 0 && selection[0].row != null) {
                        const rowIndex = selection[0].row;
                        const label = data.getValue(rowIndex, 0);   // e.g. "14:00"
                        const hour = parseInt(label);

                        console.log("Clicked hour:", hour);

                        fetch(`/api/battery-voltage-details?date=${params.date}&hour=${hour}`)
                            .then(res => res.json())
                            .then(items => {
                                console.log("Raw battery voltage records for hour:", items);

                                const detailsDiv = document.getElementById("battery-voltage-details");
                                if (detailsDiv) {
                                    detailsDiv.innerHTML = "";

                                    const table = document.createElement("table");
                                    table.className = "table table-striped table-bordered text-center";
                                    table.style.tableLayout = "fixed";
                                    table.style.width = "100%";

                                    const thead = document.createElement("thead");
                                    const headRow = document.createElement("tr");

                                    const thTime = document.createElement("th");
                                    thTime.textContent = "Time";
                                    thTime.style.width = "50%";
                                    headRow.appendChild(thTime);

                                    const thVoltage = document.createElement("th");
                                    thVoltage.textContent = "Battery Voltage (V)";
                                    thVoltage.style.width = "50%";
                                    headRow.appendChild(thVoltage);

                                    thead.appendChild(headRow);
                                    table.appendChild(thead);

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

                                        const tdVoltage = document.createElement("td");
                                        tdVoltage.textContent = roundedValue;
                                        tdVoltage.style.width = "50%";
                                        row.appendChild(tdVoltage);

                                        tbody.appendChild(row);
                                    });

                                    table.appendChild(tbody);
                                    detailsDiv.appendChild(table);
                                }
                            })
                            .catch(err => console.error("Error fetching battery voltage details:", err));
                    }
                });
            })
            .catch(err => console.error("Battery Voltage Chart Error:", err));
    }
}

// Initialize only after Google Charts is loaded
google.charts.setOnLoadCallback(() => {
    console.log("Google Charts loaded, initializing Battery Voltage...");
    BatteryVoltage.init();
});