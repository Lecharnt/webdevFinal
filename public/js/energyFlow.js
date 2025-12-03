// Simple Energy Display
async function displayEnergyData() {
    try {
        // Fetch data from server
        const response = await fetch('/api/energy-data');
        const data = await response.json();

        // Create or update display
        let display = document.getElementById('simple-energy-display');

        if (!display) {
            display = document.createElement('div');
            display.id = 'simple-energy-display';
            display.style.cssText = `
                padding: 20px;
                background: #f5f5f5;
                border-radius: 8px;
                margin: 20px;
                font-family: Arial, sans-serif;
            `;
            document.body.appendChild(display);
        }

        // Update display content
        display.innerHTML = `
            <h2 style="color: #333; margin-top: 0;">AC Grid Tie</h2>
            <div style="background: white; padding: 15px; border-radius: 5px;">
                <div><strong>Voltage:</strong> ${data.ac_voltage || '--'} V</div>
                <div><strong>Current:</strong> ${data.ac_current || '--'} A</div>
                <div><strong>AC Power:</strong> ${data.ac_power || '--'} kW</div>
            </div>
            <div style="margin-top: 10px; font-size: 0.8em; color: #666;">
                Updated: ${new Date().toLocaleTimeString()}
            </div>
        `;

    } catch (error) {
        console.error('Error loading energy data:', error);
    }
}

// Load data when page loads and refresh every 10 seconds
document.addEventListener('DOMContentLoaded', () => {
    displayEnergyData();
    setInterval(displayEnergyData, 10000);
});