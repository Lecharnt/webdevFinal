const express = require("express");
const path = require("path");

const app = express();
const PORT = 3001;//the used port

//home page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "pages", "MainPage.html"));
});
app.get("/statistics", (req, res) => {
    res.sendFile(path.join(__dirname, "pages", "EnergyStatistics.html"));
});

app.get("/contact", (req, res) => {
    res.sendFile(path.join(__dirname, "pages", "ContactInformation.html"));
});


app.get("/solar-statistics", (req, res) => {
    res.sendFile(path.join(__dirname, "pages", "SolarStatistics.html"));
});
app.get("/wind-statistics", (req, res) => {
    res.sendFile(path.join(__dirname, "pages", "WindStatistics.html"));
});


app.get("/graph-battery-voltage", (req, res) => {
    res.sendFile(path.join(__dirname, "pages", "GraphBatteryVoltage.html"));
});
app.get("/graph-energy-output", (req, res) => {
    res.sendFile(path.join(__dirname, "pages", "GraphEnergyOutput.html"));
});
app.get("/graph-power-sources", (req, res) => {
    res.sendFile(path.join(__dirname, "pages", "GraphPowerSources.html"));
});

app.get("/api/test-data", (req, res) => {
    const testData = {
        current: 120,
        volts: 55
    };

    res.json(testData);
});
app.get("/api/daily-output", (req, res) => {
    const range = req.query.range;  // day / month / year
    const date = req.query.date;    // YYYY-MM-DD, YYYY-MM, YYYY
    const y = req.query.y;          // solar / wind

    if (!date) return res.status(400).json({ error: "Missing date" });

    const parts = date.split("-");
    const year  = Number(parts[0]);
    const month = parts[1] ? Number(parts[1]) : null;
    const day   = parts[2] ? Number(parts[2]) : null;

    console.log("Parsed:", { range, year, month, day, y });

    // --- Day: 24 hours ---
    if (range === "day") {
        const labels = Array.from({ length: 24 }, (_, i) => `${i + 1}:00`);
        let data;
        if (y === "solar") {
            // simulate sunrise/sunset pattern
            data = labels.map((_, i) => {
                if (i < 6 || i > 18) return 0;       // night
                return Math.floor(Math.random() * 500 + 100); // day power
            });
        } else if (y === "wind") {
            data = labels.map(() => Math.floor(Math.random() * 400 + 50));
        }
        const result = labels.map((label, i) => [label, data[i]]);
        return res.json(result);
    }

    // --- Month: 31 days ---
    if (range === "month") {
        const days = Array.from({ length: 31 }, (_, i) => i + 1);
        let data;
        if (y === "solar") {
            data = days.map(() => Math.floor(Math.random() * 800 + 200));
        } else if (y === "wind") {
            data = days.map(() => Math.floor(Math.random() * 600 + 100));
        }
        const result = days.map((d, i) => [d, data[i]]);
        return res.json(result);
    }

    // --- Year: 12 months ---
    if (range === "year") {
        const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        let data;
        if (y === "solar") {
            data = months.map(() => Math.floor(Math.random() * 12000 + 3000));
        } else if (y === "wind") {
            data = months.map(() => Math.floor(Math.random() * 10000 + 2000));
        }
        const result = months.map((m, i) => [m, data[i]]);
        return res.json(result);
    }

    res.status(400).json({ error: "Invalid range" });
});
app.get("/api/daily-output-cool", (req, res) => {
    const range = req.query.range;  // day / month / year
    const date = req.query.date;    // YYYY-MM-DD, YYYY-MM, YYYY
    const y = req.query.y;          // solar / wind

    if (!date) return res.status(400).json({ error: "Missing date" });

    const parts = date.split("-");
    const year  = Number(parts[0]);
    const month = parts[1] ? Number(parts[1]) : null;
    const day   = parts[2] ? Number(parts[2]) : null;

    console.log("Parsed:", { range, year, month, day, y });

    // --- Day: 24 hours ---
    if (range === "day") {
        const labels = Array.from({ length: 24 }, (_, i) => `${i + 1}:00`);
        let data;
        if (y === "solar") {
            // simulate sunrise/sunset pattern
            data = labels.map((_, i) => {
                if (i < 6 || i > 18) return 0;       // night
                return Math.floor(Math.random() * 500 + 100); // day power
            });
        } else if (y === "wind") {
            data = labels.map(() => Math.floor(Math.random() * 400 + 50));
        }
        const result = labels.map((label, i) => [label, data[i]]);
        return res.json(result);
    }

    // --- Month: 31 days ---
    if (range === "month") {
        const days = Array.from({ length: 31 }, (_, i) => i + 1);
        let data;
        if (y === "solar") {
            data = days.map(() => Math.floor(Math.random() * 800 + 200));
        } else if (y === "wind") {
            data = days.map(() => Math.floor(Math.random() * 600 + 100));
        }
        const result = days.map((d, i) => [d, data[i]]);
        return res.json(result);
    }

    // --- Year: 12 months ---
    if (range === "year") {
        const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        let data;
        if (y === "solar") {
            data = months.map(() => Math.floor(Math.random() * 12000 + 3000));
        } else if (y === "wind") {
            data = months.map(() => Math.floor(Math.random() * 10000 + 2000));
        }
        const result = months.map((m, i) => [m, data[i]]);
        return res.json(result);
    }

    res.status(400).json({ error: "Invalid range" });
});


app.get("/api/performance-data", (req, res) => {
    const testData = [
        {
            label: "REBus",
            current: 60
        },
        {
            label: "REBus Current",
            current: 75
        },
        {
            label: "REBus Power",
            current: 75
        },
        {
            label: "Out Volt",
            current: 220
        },
        {
            label: "Out Current",
            current: 15
        },
        {
            label: "Out Power",
            current: 300
        },
        {
            label: "Out Volt 2",
            current: 215
        },
        {
            label: "Out Current 2",
            current: 215
        },
        {
            label: "Out Power 2",
            current: 280
        },
        {
            label: "Remote Current",
            current: 10
        },
        {
            label: "Remote Volt",
            current: 10
        },
        {
            label: "Remote Power",
            current: 120
        }
    ];

    res.json(testData);
});
app.get("/api/power-sources", (req, res) => {
    const range = req.query.range;  // "day" | "month" | "year"
    const date = req.query.date;    // "YYYY-MM-DD"

    if (!date) {
        return res.status(400).json({ error: "Missing date" });
    }

    // ✅ Parse as plain string, no timezone issues
    const [yearStr, monthStr, dayStr] = date.split("-");
    const year = Number(yearStr);
    const month = Number(monthStr); // 1–12
    const day = Number(dayStr);

    console.log("Parsed date:", { range, year, month, day });

    // === TEST DATA for DEMO ===
    if (range === "day") {
        if (month === 12 && day === 1) {
            return res.json({
                labels: [
                    "1AM","2AM","3AM","4AM","5AM","6AM",
                    "7AM","8AM","9AM","10AM","11AM","12PM"
                ],
                grid:    [500,550,600,650,700,750,800,1200,1500,1700,1400,1000],
                solar:   [0,0,0,10,50,150,300,800,1200,1600,1800,1500],
                battery: [200,180,150,120,100,90,85,80,120,200,400,600]
            });
        }

        return res.json({ error: "No data available for that day." });
    }

    if (range === "month") {
        if (month === 12) {
            return res.json({
                labels: [1,2,3,4,5,6,7,8,9,10,11,12],
                grid:    [800,750,900,950,1000,1100,1200,1300,1400,1500,1200,1200],
                solar:   [200,400,500,600,700,800,900,1000,1100,1200,1200,1200],
                battery: [100,120,90,80,150,200,250,300,350,400,1200,1200]
            });
        }

        return res.json({ error: "No data for that month." });
    }

    if (range === "year") {
        if (year === 2025) {
            return res.json({
                labels: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
                grid:    [15000,14000,16000,17000,18000,19000,17500,16500,16000,15000,14500,14800],
                solar:   [3000,4000,6000,8000,12000,15000,16000,17000,13000,9000,5000,3000],
                battery: [2000,2500,2300,2200,2100,2600,2700,3000,3200,2800,2600,2300]
            });
        }

        return res.json({ error: "No data for that year." });
    }

    res.status(400).json({ error: "Invalid range" });
});





app.get("/api/battery", (req, res) => {
    // Test data — you can update these later with real values
    const batteryData = {
        percent: 72,
        volts: 12.6,
        current: 4.2
    };

    res.json(batteryData);
});
app.get("/api/power-stats", (req, res) => {
    const data = {
        solarPower: 850,          // 0–1500
        outputPower: 430,         // 0–700
        energyCost: 1200,         // used energy
        energyEarned: 1650        // generated energy
    };

    res.json(data);
});

//these are the static files that are being used
app.use("/public", express.static(path.join(__dirname, "public")));//for the public files like pages images cs and js
app.use("/components", express.static(path.join(__dirname, "components")));//for the footer and header and ather components
app.use("/", express.static(path.join(__dirname, "pages")));//this is to manage all the pages for the site

app.listen(PORT, () => {
    console.log(`Server started at http://localhost:${PORT}`);
});
