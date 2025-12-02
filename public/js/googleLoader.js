google.charts.load('current', {
    packages: ['gauge', 'bar', 'corechart']
});

// Register callbacks from both scripts
google.charts.setOnLoadCallback(onGoogleLoaded);

function onGoogleLoaded() {
    if (window.drawGaugeChart) window.drawGaugeChart();
    if (window.drawMaterialChart) window.drawMaterialChart();
}
