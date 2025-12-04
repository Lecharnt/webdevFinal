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

        console.log("Battery Voltage params:", params);

        if (!params.date) {
            console.log("Please select a date for Battery Voltage");
            return;
        }

        fetch(`/api/daily-output-cool?range=${params.range}&date=${params.date}`)
            .then(res => res.json())
            .then(raw => {
                console.log("Received data for Battery Voltage:", raw);

                if (!raw || raw.length === 0) {
                    console.error("No data returned from API for Battery Voltage");
                    return;
                }

                const rows = raw.map(item => [String(item[0]), Number(item[1])]);

                const data = google.visualization.arrayToDataTable([
                    ["Label", params.y],
                    ...rows
                ]);

                const chart = new google.visualization.AreaChart(
                    document.getElementById("BatteryVoltage")
                );

                chart.draw(data, {
                    height: 400,
                    title: `${params.y} (${params.range})`,
                    legend: "none",
                    hAxis: { slantedText: true, showTextEvery: 1 }
                });
            })
            .catch(err => console.error("Battery Voltage Chart Error:", err));
    }
};

// Initialize only after Google Charts is loaded
google.charts.setOnLoadCallback(() => {
    console.log("Google Charts loaded, initializing Battery Voltage...");
    BatteryVoltage.init();
});