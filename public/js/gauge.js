window.drawGaugeChart = function () {
    fetch("/api/test-data")
        .then(res => res.json())
        .then(data => {
            var chartData = google.visualization.arrayToDataTable([
                ['Label', 'Value'],
                ['Current', data.current],
                ['Volts', data.volts]
            ]);

            var options = {
                width: 400,
                height: 200,
                redFrom: 160,
                redTo: 200,
                yellowFrom: 120,
                yellowTo: 160,
                minorTicks: 5,
                max: 200
            };

            var chart = new google.visualization.Gauge(
                document.getElementById('gauge_div')
            );

            chart.draw(chartData, options);
        });
};
