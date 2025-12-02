async function loadBattery() {
    try {
        const res = await fetch("/api/battery");
        const data = await res.json();

        updateBatteryUI(data.percent, data.volts, data.current);
    } catch (err) {
        console.error("Could not load battery data:", err);
    }
}

function updateBatteryUI(percent, volts, current) {
    // Update bar width
    const bar = document.getElementById("battery-fill");
    bar.style.width = percent + "%";

    // Change color based on battery level
    if (percent < 25) bar.style.background = "red";
    else if (percent < 50) bar.style.background = "orange";
    else bar.style.background = "green";

    // Update text values
    document.getElementById("battery-percent").textContent = percent + "%";
    document.getElementById("battery-volts").textContent = volts + " V";
    document.getElementById("battery-current").textContent = current + " A";
}

// Auto-load on page load
window.addEventListener("DOMContentLoaded", loadBattery);
