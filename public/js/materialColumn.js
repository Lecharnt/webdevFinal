window.drawMaterialChart = function () {
    fetch("/api/performance-data")
        .then(res => res.json())
        .then(serverData => {

            // Define the pattern (3 bar types)
            const COLORS = {
                current: "#ff9800", // orange
                volts:   "#ffeb3b", // yellow
                power:   "#4caf50"  // green
            };

            // Order in groups of 3
            // DEFINE YOUR PATTERN HERE:
            const groups = [
                { label: "REBus", types: ["current", "volts", "power"] },
                { label: "Out 1", types: ["current", "volts", "power"] },
                { label: "Out 2", types: ["current", "volts", "power"] },
                { label: "Remote", types: ["current", "volts", "power"] }
            ];

            // Build table header
            let chartData = [
                ["Group", "Value", { role: "style" }]
            ];

            // Fill rows (3 bars per group)
            groups.forEach((group, gIndex) => {
                group.types.forEach((type, tIndex) => {
                    let item = serverData[gIndex * 3 + tIndex];
                    chartData.push([
                        item.label,          // X-axis label per group
                        item.current,         // The value
                        COLORS[type]          // Color per bar
                    ]);
                });
            });

            let data = google.visualization.arrayToDataTable(chartData);

            let options = {
                title: "",
                chartArea: { bottom: 50 },
                legend: "none"
            };

            let chart = new google.visualization.ColumnChart(
                document.getElementById("columnchart_material")
            );

            chart.draw(data, options);
        });
};
