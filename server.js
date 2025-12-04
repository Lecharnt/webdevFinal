const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const { MongoClient, ObjectId } = require("mongodb");
const mongoose = require('mongoose');
const app = express();
const session = require('express-session');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(__dirname));

const url = "mongodb://localhost:27017";
const dbName = "FinalProject";
const collectionName = "data";

app.listen(3000, () => {
    console.log("Server started on port 3000");
});
// Session middleware - ADD THIS
app.use(session({
    secret: 'qewretrytuyiuoip', // Change this to a random string
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true if using HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));
app.get("/get-all-data", async (req, res) => {
    const client = await MongoClient.connect(url);
    const db = client.db(dbName);
    const items = await db.collection(collectionName).find({}).toArray();
    res.json(items);
    client.close();
});

app.get("/get-data-by-day", async (req, res) => {
    const date = req.query.date;
    const client = await MongoClient.connect(url);
    const db = client.db(dbName);

    const start = new Date(date + "T00:00:00Z");
    const end = new Date(date + "T23:59:59Z");

    const items = await db.collection(collectionName).find({
        rowTimestamp: { $gte: start, $lte: end }
    }).toArray();

    res.json(items);
    client.close();
});

app.get("/get-data-by-id", async (req, res) => {
    const id = req.query.id;
    const client = await MongoClient.connect(url);
    const db = client.db(dbName);
    const item = await db.collection(collectionName).findOne({ _id: new ObjectId(id) });
    res.json(item);
    client.close();
});

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "pages", "MainPage.html"));
});
app.get("/statistics", (req, res) => {
    if (!req.session.loggedIn) {
        return res.redirect('/login');
    }
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
app.get("/login", (req, res) => {
    if (req.session.loggedIn) {
        return res.redirect('/');
    }
    res.sendFile(path.join(__dirname, "pages", "LogIn.html"));
});
app.get("/signup", (req, res) => {
    res.sendFile(path.join(__dirname, "pages", "SignUp.html"));
    if (req.session.loggedIn) {
        return res.redirect('/');
    }
});

app.get("/api/test-data", (req, res) => {
    const testData = { current: 120, volts: 55 };
    res.json(testData);
});

app.get("/api/daily-output", async function (req, res) {
    const { range, y, date } = req.query;
    if (!date) return res.status(400).json({ error: "Missing date" });

    const client = await MongoClient.connect(url);
    const db = client.db(dbName);

    try {
        let start, end;

        if (range === "day") {
            const [Y, M, D] = date.split("-").map(Number);
            start = new Date(Date.UTC(Y, M - 1, D, 0, 0, 0));
            end   = new Date(Date.UTC(Y, M - 1, D, 23, 59, 59));

            const items = await db.collection(collectionName).find({
                rowTimestamp: { $gte: start, $lte: end }
            }).toArray();

            let data = Array(24).fill(0);

            items.forEach(doc => {
                const ts = new Date(doc.rowTimestamp);
                const hour = ts.getUTCHours();

                const value =
                    y === "solar"
                        ? Math.abs(parseFloat(doc.PVpow ?? 0))
                        : Math.abs(parseFloat(doc.acPower ?? 0));

                data[hour] += value / 1000;
            });

            return res.json(data.map((v, i) => [`${i}:00`, v]));
        }

        if (range === "month") {
            const [Y, M] = date.split("-").map(Number);
            start = new Date(Date.UTC(Y, M - 1, 1));
            end   = new Date(Date.UTC(Y, M, 0, 23, 59, 59));

            const items = await db.collection(collectionName).find({
                rowTimestamp: { $gte: start, $lte: end }
            }).toArray();

            const days = new Date(Y, M, 0).getDate();
            let data = Array(days).fill(0);

            items.forEach(doc => {
                const ts = new Date(doc.rowTimestamp);
                const d = ts.getUTCDate() - 1;

                const value =
                    y === "solar"
                        ? Math.abs(parseFloat(doc.PVpow ?? 0))
                        : Math.abs(parseFloat(doc.acPower ?? 0));

                data[d] += value / 1000;
            });

            return res.json(data.map((v, i) => [i + 1, v]));
        }

        if (range === "year") {
            const Y = Number(date);
            start = new Date(Date.UTC(Y, 0, 1));
            end   = new Date(Date.UTC(Y, 11, 31, 23, 59, 59));

            const items = await db.collection(collectionName).find({
                rowTimestamp: { $gte: start, $lte: end }
            }).toArray();

            let data = Array(12).fill(0);

            items.forEach(doc => {
                const ts = new Date(doc.rowTimestamp);
                const m = ts.getUTCMonth();

                const value =
                    y === "solar"
                        ? Math.abs(parseFloat(doc.PVpow ?? 0))
                        : Math.abs(parseFloat(doc.acPower ?? 0));

                data[m] += value / 1000;
            });

            return res.json(
                data.map((v, i) => [
                    ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i],
                    v
                ])
            );
        }

        res.status(400).json({ error: "Invalid range" });

    } finally {
        client.close();
    }
});
// Example Express.js route
app.get('/api/energy-data', (req, res) => {
    const energyData = {
        ac_voltage: 230.5,    // in Volts
        ac_current: 15.2,     // in Amps
        ac_power: 3.5,        // in kW
        timestamp: new Date().toISOString()
    };

    res.json(energyData);
});
const windData = {
    pv_wh: "12,450",          // Total PV watt hours
    used_wh: "8,765",         // Total watt hours used
    wind_wh: "5,432",         // Total wind watt hours
    vawt_v: "24.5",           // VAWT voltage
    vawt_cur: "8.75",         // VAWT current
    vawt_rms: "120.3",        // VAWT RMS
    vawt_pow: "215",          // VAWT power
    hawt_rms: "118.7",        // HAWT RMS
    wind_bat_v: "13.8",       // Wind battery voltage
    wind_cur: "12.45",        // Wind current
    rpm: "1250",              // RPM
    wind_pow: "456"           // Wind power
};
app.get('/api/wind-data', (req, res) => {
    console.log('Wind data requested');

    // Add random variation for demo (remove in production)
    const mockData = {
        ...windData,
        vawt_v: (24 + Math.random() * 2).toFixed(1),
        vawt_cur: (8 + Math.random() * 2).toFixed(2),
        vawt_pow: (200 + Math.random() * 50).toFixed(0),
        wind_pow: (400 + Math.random() * 100).toFixed(0),
        rpm: (1200 + Math.random() * 200).toFixed(0),
        timestamp: new Date().toISOString()
    };

    res.json(mockData);
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
        { label: "REBus", current: 60 },
        { label: "REBus Current", current: 75 },
        { label: "REBus Power", current: 75 },
        { label: "Out Volt", current: 220 },
        { label: "Out Current", current: 15 },
        { label: "Out Power", current: 300 },
        { label: "Out Volt 2", current: 215 },
        { label: "Out Current 2", current: 215 },
        { label: "Out Power 2", current: 280 },
        { label: "Remote Current", current: 10 },
        { label: "Remote Volt", current: 10 },
        { label: "Remote Power", current: 120 }
    ];
    res.json(testData);
});

app.get("/api/power-sources", (req, res) => {
    const range = req.query.range;
    const date = req.query.date;
    if (!date) return res.status(400).json({ error: "Missing date" });

    const [yearStr, monthStr, dayStr] = date.split("-");
    const year = Number(yearStr);
    const month = Number(monthStr);
    const day = Number(dayStr);

    if (range === "day" && month === 12 && day === 1) {
        return res.json({
            labels: ["1AM","2AM","3AM","4AM","5AM","6AM","7AM","8AM","9AM","10AM","11AM","12PM"],
            grid:    [500,550,600,650,700,750,800,1200,1500,1700,1400,1000],
            solar:   [0,0,0,10,50,150,300,800,1200,1600,1800,1500],
            battery: [200,180,150,120,100,90,85,80,120,200,400,600]
        });
    }

    if (range === "month" && month === 12) {
        return res.json({
            labels: [1,2,3,4,5,6,7,8,9,10,11,12],
            grid:    [800,750,900,950,1000,1100,1200,1300,1400,1500,1200,1200],
            solar:   [200,400,500,600,700,800,900,1000,1100,1200,1200,1200],
            battery: [100,120,90,80,150,200,250,300,350,400,1200,1200]
        });
    }

    if (range === "year" && year === 2025) {
        return res.json({
            labels: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
            grid:    [15000,14000,16000,17000,18000,19000,17500,16500,16000,15000,14500,14800],
            solar:   [3000,4000,6000,8000,12000,15000,16000,17000,13000,9000,5000,3000],
            battery: [2000,2500,2300,2200,2100,2600,2700,3000,3200,2800,2600,2300]
        });
    }

    res.json({ error: "No data available" });
});

app.get("/api/battery", (req, res) => {
    res.json({ percent: 72, volts: 12.6, current: 4.2 });
});

app.get("/api/power-stats", (req, res) => {
    res.json({
        solarPower: 850,
        outputPower: 430,
        energyCost: 1200,
        energyEarned: 1650
    });
});
const createUserCollection = async () => {
    const client = await MongoClient.connect(url);
    const db = client.db(dbName); // Use the SAME database "FinalProject"

    // Create users collection if it doesn't exist
    const collections = await db.listCollections().toArray();
    const userCollectionExists = collections.some(col => col.name === 'users');

    if (!userCollectionExists) {
        await db.createCollection('users');
        // Create index on username for uniqueness
        await db.collection('users').createIndex({ username: 1 }, { unique: true });
        console.log('Users collection created');
    }

    client.close();
};

// Call this when server starts
createUserCollection().catch(console.error);
// SIGNUP API
app.post('/api/signup', async (req, res) => {
    let client;
    try {
        console.log('Signup request:', req.body);
        const { username, password } = req.body;

        if (!username || !password) {
            return res.json({ success: false, message: 'Username and password required' });
        }

        client = await MongoClient.connect(url);
        const db = client.db(dbName);

        // Check if user exists
        const existing = await db.collection('users').findOne({ username });
        if (existing) {
            return res.json({ success: false, message: 'Username already exists' });
        }

        // Create user
        const user = {
            username,
            password,
            createdAt: new Date()
        };

        await db.collection('users').insertOne(user);
        console.log('User saved:', username);

        res.json({ success: true, message: 'Account created!' });
    } catch (err) {
        console.error('Signup error:', err);
        res.json({ success: false, message: 'Server error: ' + err.message });
    } finally {
        if (client) client.close();
    }
});

// LOGIN API
app.post('/api/login', async (req, res) => {
    let client;
    try {
        console.log('Login request:', req.body);
        const { username, password } = req.body;

        if (!username || !password) {
            return res.json({ success: false, message: 'Username and password required' });
        }

        client = await MongoClient.connect(url);
        const db = client.db(dbName);

        // Find user
        const user = await db.collection('users').findOne({ username, password });

        if (user) {
            // SET SESSION VARIABLE
            req.session.loggedIn = true;
            req.session.username = username;

            res.json({
                success: true,
                message: 'Login successful!'
            });
        } else {
            res.json({ success: false, message: 'Wrong username or password' });
        }
    } catch (err) {
        console.error('Login error:', err);
        res.json({ success: false, message: 'Server error: ' + err.message });
    } finally {
        if (client) client.close();
    }
});

// LOGOUT API
app.get('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.json({ success: false, message: 'Logout failed' });
        }
        res.json({ success: true, message: 'Logged out successfully' });
    });
});

// CHECK LOGIN STATUS API
app.get('/api/check-login', (req, res) => {
    if (req.session.loggedIn) {
        res.json({ loggedIn: true, username: req.session.username });
    } else {
        res.json({ loggedIn: false });
    }
});

app.use("/public", express.static(path.join(__dirname, "public")));
app.use("/components", express.static(path.join(__dirname, "components")));
app.use("/", express.static(path.join(__dirname, "pages")));
