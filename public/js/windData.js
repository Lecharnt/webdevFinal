// Simple Wind Data Display
function showWindData() {
    console.log("Loading wind data...");

    // Get data from server
    fetch('/api/wind-data')
        .then(res => res.json())
        .then(data => {
            updateDisplay(data);
        })
        .catch(err => {
            console.error("Error:", err);
            showError();
        });
}

// Update the display with data
function updateDisplay(data) {
    console.log("Updating with:", data);

    // Create or find the container
    let box = document.getElementById('wind-box');
    if (!box) {
        box = document.createElement('div');
        box.id = 'wind-box';
        box.style.cssText = `
            width: 400px;
            margin: 20px;
            padding: 20px;
            background: #f0f8ff;
            border: 2px solid #007bff;
            border-radius: 10px;
            font-family: Arial, sans-serif;
        `;
        document.body.appendChild(box);
    }

    // Add title
    box.innerHTML = '<h2 style="color: #007bff; margin-top: 0;">Wind Data</h2>';

    // Summary section
    box.innerHTML += `
        <div style="background: white; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
            <h3 style="margin-top: 0;">Summary</h3>
            <div><b>PV Watt Hours:</b> ${data.pv_wh || '--'}</div>
            <div><b>Watt Hours Used:</b> ${data.used_wh || '--'}</div>
            <div><b>Wind Watt Hours:</b> ${data.wind_wh || '--'}</div>
        </div>
    `;

    // Wind data section
    box.innerHTML += `
        <div style="background: white; padding: 15px; border-radius: 5px;">
            <h3 style="margin-top: 0;">Wind Turbine</h3>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <!-- Left column -->
                <div>
                    <h4>VAWT</h4>
                    <div><b>Voltage:</b> ${data.vawt_v || '--'} V</div>
                    <div><b>Current:</b> ${data.vawt_cur || '--'} A</div>
                    <div><b>RMS:</b> ${data.vawt_rms || '--'} V</div>
                    <div><b>Power:</b> ${data.vawt_pow || '--'} W</div>
                </div>
                
                <!-- Right column -->
                <div>
                    <h4>System</h4>
                    <div><b>HAWT RMS:</b> ${data.hawt_rms || '--'} V</div>
                    <div><b>Battery V:</b> ${data.wind_bat_v || '--'} V</div>
                    <div><b>Current:</b> ${data.wind_cur || '--'} A</div>
                    <div><b>RPM:</b> ${data.rpm || '--'}</div>
                    <div><b>Power:</b> ${data.wind_pow || '--'} W</div>
                </div>
            </div>
        </div>
        
        <div style="margin-top: 10px; text-align: center; color: #666; font-size: 0.9em;">
            Updated: ${new Date().toLocaleTimeString()}
        </div>
    `;
}

// Show error message
function showError() {
    let box = document.getElementById('wind-box');
    if (box) {
        box.innerHTML = `
            <h2 style="color: #dc3545;">Wind Data</h2>
            <div style="color: #dc3545; padding: 20px; text-align: center;">
                Could not load wind data
            </div>
        `;
    }
}

// Start when page loads and refresh every 10 seconds
document.addEventListener('DOMContentLoaded', function() {
    showWindData();
    setInterval(showWindData, 10000);
});