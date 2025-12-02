async function loadPowerStats() {
    try {
        const res = await fetch("/api/power-stats");
        const data = await res.json();

        updatePowerBars(data);
    } catch (err) {
        console.error("Error loading power stats:", err);
    }
}

function updatePowerBars(data) {
    // Vertical bars
    const solarPercent = (data.solarPower / 1500) * 100;
    const outputPercent = (data.outputPower / 700) * 100;

    document.getElementById("solar-bar").style.height = solarPercent + "%";
    document.getElementById("solar-amount").textContent = data.solarPower + " W";

    document.getElementById("output-bar").style.height = outputPercent + "%";
    document.getElementById("output-amount").textContent = data.outputPower + " W";

    // Horizontal energy bar
    const diff = data.energyEarned - data.energyCost;
    const percent = ((diff + 2000) / 4000) * 100; // convert -2000–2000 to 0–100%

    const bar = document.getElementById("energy-flow-fill");
    bar.style.width = percent + "%";

    if (diff < 0) bar.style.background = "red";
    else bar.style.background = "green";

    // Text values
    document.getElementById("energy-cost").textContent = data.energyCost + " W";
    document.getElementById("energy-earned").textContent = data.energyEarned + " W";
    document.getElementById("energy-diff").textContent = diff + " W";
}

window.addEventListener("DOMContentLoaded", loadPowerStats);
