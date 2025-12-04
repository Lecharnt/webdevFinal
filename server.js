const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(__dirname));

const url = "mongodb://localhost:27017";
const dbName = "FinalProject";
const collectionName = "data";

app.listen(3000, () => {
    console.log("Server started on port 3000");
});

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
    const testData = { current: 120, volts: 55 };
    res.json(testData);
});

app.get("/api/daily-output", async function (req, res) {
    const range = req.query.range;
    const date = req.query.date;
    const y = req.query.y;

    if (!date) {
        res.status(400).json({ error: "Missing date" });
        return;
    }

    const client = await MongoClient.connect(url);
    const db = client.db(dbName);

    try {
        if (range === "day") {
            var parts = date.split("-");
            var year = Number(parts[0]);
            var month = Number(parts[1]) - 1;
            var day = Number(parts[2]);

            var start = new Date(year, month, day, 0, 0, 0);
            var end   = new Date(year, month, day, 23, 59, 59);

            const items = await db.collection(collectionName).find({
                rowTimestamp: { $gte: start, $lte: end }
            }).toArray();

            var labels = [];
            var sums = [];
            var counts = [];
            for (var i = 0; i < 24; i++) {
                labels.push(i + ":00");
                sums.push(0);
                counts.push(0);
            }

            items.forEach(function (doc) {
                var hour = new Date(doc.rowTimestamp).getHours();
                var val = 0;
                if (y === "solar") {
                    val = parseFloat(doc.PVpow || 0);
                } else if (y === "wind") {
                    var ac = parseFloat(doc.acPower || 0);
                    var pv = parseFloat(doc.PVpow || 0);
                    val = Math.max(ac - pv, 0);   // 👈 clamp negatives
                }
                if (isNaN(val)) val = 0;
                sums[hour] = sums[hour] + val;
                counts[hour] = counts[hour] + 1;
            });

            var averages = [];
            for (var i = 0; i < 24; i++) {
                if (counts[i] > 0) {
                    averages.push((sums[i]) / 1000);
                } else {
                    averages.push(0);
                }
            }

            var result = [];
            for (var i = 0; i < 24; i++) {
                result.push([labels[i], averages[i]]);
            }
            return res.json(result);
        }

        if (range === "month") {
            var parts = date.split("-");
            var yearStr = parts[0];
            var monthStr = parts[1];
            var start = new Date(Number(yearStr), Number(monthStr) - 1, 1, 0, 0, 0);
            var end = new Date(Number(yearStr), Number(monthStr), 0, 23, 59, 59);

            const items = await db.collection(collectionName).find({
                rowTimestamp: { $gte: start, $lte: end }
            }).toArray();

            var daysInMonth = new Date(Number(yearStr), Number(monthStr), 0).getDate();
            var labels = [];
            var sums = [];
            var counts = [];
            for (var i = 1; i <= daysInMonth; i++) {
                labels.push(i);
                sums.push(0);
                counts.push(0);
            }

            items.forEach(function (doc) {
                var day = new Date(doc.rowTimestamp).getDate();
                var val = 0;
                if (y === "solar") {
                    val = parseFloat(doc.PVpow || 0);
                } else if (y === "wind") {
                    var ac = parseFloat(doc.acPower || 0);
                    var pv = parseFloat(doc.PVpow || 0);
                    val = Math.max(ac - pv, 0);   // 👈 clamp negatives
                }
                if (isNaN(val)) val = 0;
                sums[day - 1] = sums[day - 1] + val;
                counts[day - 1] = counts[day - 1] + 1;
            });

            var averages = [];
            for (var i = 0; i < daysInMonth; i++) {
                if (counts[i] > 0) {
                    averages.push((sums[i]) / 1000);
                } else {
                    averages.push(0);
                }
            }

            var result = [];
            for (var i = 0; i < daysInMonth; i++) {
                result.push([labels[i], averages[i]]);
            }
            return res.json(result);
        }

        if (range === "year") {
            var year = Number(date);
            var start = new Date(year, 0, 1, 0, 0, 0);
            var end = new Date(year, 11, 31, 23, 59, 59);

            const items = await db.collection(collectionName).find({
                rowTimestamp: { $gte: start, $lte: end }
            }).toArray();

            var labels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
            var sums = [];
            var counts = [];
            for (var i = 0; i < 12; i++) {
                sums.push(0);
                counts.push(0);
            }

            items.forEach(function (doc) {
                var month = new Date(doc.rowTimestamp).getMonth();
                var val = 0;
                if (y === "solar") {
                    val = parseFloat(doc.PVpow);
                } else if (y === "wind") {
                    var ac = parseFloat(doc.acPower || 0);
                    var pv = parseFloat(doc.PVpow || 0);
                    val = Math.max(ac - pv, 0);   // 👈 clamp negatives
                }
                if (isNaN(val)) val = 0;
                sums[month] += val;
                counts[month] += 1;
            });

            var averages = [];
            for (var i = 0; i < 12; i++) {
                if (counts[i] > 0) {
                    averages.push(sums[i] / 1000);
                } else {
                    averages.push(0);
                }
            }

            var result = [];
            for (var i = 0; i < 12; i++) {
                result.push([labels[i], averages[i]]);
            }
            return res.json(result);
        }

        res.status(400).json({ error: "Invalid range" });
    } finally {
        client.close();
    }
});

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

app.get("/api/daily-output-cool", async function (req, res) {
    const range = req.query.range;  // day / month / year
    const date = req.query.date;    // YYYY-MM-DD, YYYY-MM, YYYY

    if (!date) {
        res.status(400).json({ error: "Missing date" });
        return;
    }

    const client = await MongoClient.connect(url);
    const db = client.db(dbName);

    try {
        if (range === "day") {
            var parts = date.split("-");
            var year = Number(parts[0]);
            var month = Number(parts[1]) - 1;
            var day = Number(parts[2]);

            var start = new Date(year, month, day, 0, 0, 0);
            var end   = new Date(year, month, day, 23, 59, 59);

            var items = await db.collection(collectionName).find({
                rowTimestamp: { $gte: start, $lte: end }
            }).toArray();

            var labels = [];
            var sums = [];
            var counts = [];
            for (var i = 0; i < 24; i++) {
                labels.push(i + ":00");
                sums.push(0);
                counts.push(0);
            }

            for (var j = 0; j < items.length; j++) {
                var doc = items[j];
                var hour = new Date(doc.rowTimestamp).getHours();
                var val = parseFloat(doc.BattV);
                if (isNaN(val)) {
                    val = 0;
                }
                sums[hour] = sums[hour] + val;
                counts[hour] = counts[hour] + 1;
            }

            var averages = [];
            for (var i = 0; i < 24; i++) {
                if (counts[i] > 0) {
                    averages.push(sums[i] / counts[i]);
                } else {
                    averages.push(0);
                }
            }

            var result = [];
            for (var i = 0; i < 24; i++) {
                result.push([labels[i], averages[i]]);
            }
            res.json(result);
            return;
        }

        if (range === "month") {
            var parts = date.split("-");
            var year = Number(parts[0]);
            var month = Number(parts[1]);

            var start = new Date(year, month - 1, 1, 0, 0, 0);
            var end   = new Date(year, month, 0, 23, 59, 59);

            var items = await db.collection(collectionName).find({
                rowTimestamp: { $gte: start, $lte: end }
            }).toArray();

            var daysInMonth = new Date(year, month, 0).getDate();
            var labels = [];
            var sums = [];
            var counts = [];
            for (var i = 1; i <= daysInMonth; i++) {
                labels.push(i);
                sums.push(0);
                counts.push(0);
            }

            for (var j = 0; j < items.length; j++) {
                var doc = items[j];
                var day = new Date(doc.rowTimestamp).getDate();
                var val = parseFloat(doc.BattV);
                if (isNaN(val)) {
                    val = 0;
                }
                sums[day - 1] = sums[day - 1] + val;
                counts[day - 1] = counts[day - 1] + 1;
            }

            var averages = [];
            for (var i = 0; i < daysInMonth; i++) {
                if (counts[i] > 0) {
                    averages.push(sums[i] / counts[i]);
                } else {
                    averages.push(0);
                }
            }

            var result = [];
            for (var i = 0; i < daysInMonth; i++) {
                result.push([labels[i], averages[i]]);
            }
            res.json(result);
            return;
        }

        if (range === "year") {
            var year = Number(date);
            var start = new Date(year, 0, 1, 0, 0, 0);
            var end   = new Date(year, 11, 31, 23, 59, 59);

            var items = await db.collection(collectionName).find({
                rowTimestamp: { $gte: start, $lte: end }
            }).toArray();

            var labels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
            var sums = [];
            var counts = [];
            for (var i = 0; i < 12; i++) {
                sums.push(0);
                counts.push(0);
            }

            for (var j = 0; j < items.length; j++) {
                var doc = items[j];
                var month = new Date(doc.rowTimestamp).getMonth();

                var val = 0;
                // Always sanitize BattV
                if (doc.BattV !== undefined && doc.BattV !== null && doc.BattV !== "") {
                    val = parseFloat(doc.BattV);
                    if (isNaN(val)) {
                        val = 0;
                    }
                }

                sums[month] = sums[month] + val;
                counts[month] = counts[month] + 1;
            }

            var averages = [];
            for (var i = 0; i < 12; i++) {
                if (counts[i] > 0) {
                    averages.push(sums[i] / counts[i]);  // average BattV per month
                } else {
                    averages.push(0);
                }
            }

            var result = [];
            for (var i = 0; i < 12; i++) {
                result.push([labels[i], averages[i]]);
            }
            res.json(result);
            return;
        }



        res.status(400).json({ error: "Invalid range" });
    } finally {
        client.close();
    }
});


app.get("/api/battery-voltage-details", async (req, res) => {
    const { date, hour } = req.query;
    if (!date || hour == null) {
        return res.status(400).json({ error: "Missing date or hour" });
    }

    const client = await MongoClient.connect(url);
    const db = client.db(dbName);

    try {
        const parts = date.split("-");
        const year = Number(parts[0]);
        const month = Number(parts[1]) - 1;
        const day = Number(parts[2]);

        const start = new Date(year, month, day, Number(hour), 0, 0);
        const end   = new Date(year, month, day, Number(hour), 59, 59);

        const items = await db.collection(collectionName).find({
            rowTimestamp: { $gte: start, $lte: end }
        }).toArray();

        // sanitize values
        const results = items.map(doc => {
            let val = parseFloat(doc.BattV || 0);
            if (isNaN(val)) val = 0;
            return { timestamp: doc.rowTimestamp, value: val };
        });

        res.json(results);
    } finally {
        client.close();
    }
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

app.get("/api/power-sources", async function (req, res) {
    const range = req.query.range;  // day / month / year
    const date = req.query.date;    // YYYY-MM-DD, YYYY-MM, YYYY

    if (!date) {
        res.status(400).json({ error: "Missing date" });
        return;
    }

    const client = await MongoClient.connect(url);
    const db = client.db(dbName);

    try {
        if (range === "day") {
            const parts = date.split("-");
            const year = Number(parts[0]);
            const month = Number(parts[1]) - 1;
            const day = Number(parts[2]);

            const start = new Date(year, month, day, 0, 0, 0);
            const end   = new Date(year, month, day, 23, 59, 59);

            const items = await db.collection(collectionName).find({
                rowTimestamp: { $gte: start, $lte: end }
            }).toArray();

            const labels = [];
            const acPower = [], solar = [], battery = [];
            const sumsAc = [], sumsSolar = [], sumsBatt = [], counts = [];

            for (let i = 0; i < 24; i++) {
                labels.push(i + ":00");
                sumsAc.push(0);
                sumsSolar.push(0);
                sumsBatt.push(0);
                counts.push(0);
            }

            for (let j = 0; j < items.length; j++) {
                const doc = items[j];
                const hour = new Date(doc.rowTimestamp).getHours();

                let ac = parseFloat(doc.acPower || 0);
                let pv = parseFloat(doc.PVpow || 0);
                let g = Math.max(ac - pv, 0);
                let s = parseFloat(doc.PVpow || 0);
                let b = parseFloat(doc.BattPow || 0);

                if (isNaN(g)) g = 0;
                if (isNaN(s)) s = 0;
                if (isNaN(b)) b = 0;

                sumsAc[hour] += g;
                sumsSolar[hour] += s;
                sumsBatt[hour] += b;
                counts[hour] += 1;
            }

            for (let i = 0; i < 24; i++) {
                if (counts[i] > 0) {
                    acPower.push(sumsAc[i] / counts[i]);
                    solar.push(sumsSolar[i] / counts[i]);
                    battery.push(sumsBatt[i] / counts[i]);
                } else {
                    acPower.push(0);
                    solar.push(0);
                    battery.push(0);
                }
            }

            return res.json({ labels, acPower, solar, battery });
        }

        if (range === "month") {
            const parts = date.split("-");
            const year = Number(parts[0]);
            const month = Number(parts[1]);

            const start = new Date(year, month - 1, 1, 0, 0, 0);
            const end   = new Date(year, month, 0, 23, 59, 59);

            const items = await db.collection(collectionName).find({
                rowTimestamp: { $gte: start, $lte: end }
            }).toArray();

            const daysInMonth = new Date(year, month, 0).getDate();
            const labels = [];
            const acPower = [], solar = [], battery = [];
            const sumsAc = [], sumsSolar = [], sumsBatt = [], counts = [];

            for (let i = 1; i <= daysInMonth; i++) {
                labels.push(i);
                sumsAc.push(0);
                sumsSolar.push(0);
                sumsBatt.push(0);
                counts.push(0);
            }

            for (let j = 0; j < items.length; j++) {
                const doc = items[j];
                const day = new Date(doc.rowTimestamp).getDate();

                let ac = parseFloat(doc.acPower || 0);
                let pv = parseFloat(doc.PVpow || 0);
                let g = Math.max(ac - pv, 0);
                let s = parseFloat(doc.PVpow || 0);
                let b = parseFloat(doc.BattPow || 0);

                if (isNaN(g)) g = 0;
                if (isNaN(s)) s = 0;
                if (isNaN(b)) b = 0;

                sumsAc[day - 1] += g;
                sumsSolar[day - 1] += s;
                sumsBatt[day - 1] += b;
                counts[day - 1] += 1;
            }

            for (let i = 0; i < daysInMonth; i++) {
                if (counts[i] > 0) {
                    acPower.push(sumsAc[i] / counts[i]);
                    solar.push(sumsSolar[i] / counts[i]);
                    battery.push(sumsBatt[i] / counts[i]);
                } else {
                    acPower.push(0);
                    solar.push(0);
                    battery.push(0);
                }
            }

            return res.json({ labels, acPower, solar, battery });
        }

        if (range === "year") {
            const yearStr = date.split("-")[0];
            const year = Number(yearStr);

            const start = new Date(year, 0, 1, 0, 0, 0);
            const end   = new Date(year, 11, 31, 23, 59, 59);

            const items = await db.collection(collectionName).find({
                rowTimestamp: { $gte: start, $lte: end }
            }).toArray();

            const labels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
            const acPower = [], solar = [], battery = [];
            const sumsAc = [], sumsSolar = [], sumsBatt = [], counts = [];

            for (let i = 0; i < 12; i++) {
                sumsAc.push(0);
                sumsSolar.push(0);
                sumsBatt.push(0);
                counts.push(0);
            }

            for (let j = 0; j < items.length; j++) {
                const doc = items[j];
                const month = new Date(doc.rowTimestamp).getMonth();

                let ac = parseFloat(doc.acPower || 0);
                let pv = parseFloat(doc.PVpow || 0);
                let g = Math.max(ac - pv, 0);
                let s = parseFloat(doc.PVpow || 0);
                let b = parseFloat(doc.BattPow || 0);

                if (isNaN(g)) g = 0;
                if (isNaN(s)) s = 0;
                if (isNaN(b)) b = 0;

                sumsAc[month] += g;
                sumsSolar[month] += s;
                sumsBatt[month] += b;
                counts[month] += 1;
            }

            for (let i = 0; i < 12; i++) {
                if (counts[i] > 0) {
                    acPower.push(sumsAc[i] / counts[i]);
                    solar.push(sumsSolar[i] / counts[i]);
                    battery.push(sumsBatt[i] / counts[i]);
                } else {
                    acPower.push(0);
                    solar.push(0);
                    battery.push(0);
                }
            }

            return res.json({ labels, acPower, solar, battery });
        }

        res.status(400).json({ error: "Invalid range" });
    } finally {
        client.close();
    }
});

app.get("/api/power-sources-details", async (req, res) => {
    const { date, hour, source } = req.query;
    if (!date || hour == null || !source) {
        return res.status(400).json({ error: "Missing date, hour or source" });
    }

    const client = await MongoClient.connect(url);
    const db = client.db(dbName);

    try {
        const parts = date.split("-");
        const year = Number(parts[0]);
        const month = Number(parts[1]) - 1;
        const day = Number(parts[2]);

        const start = new Date(year, month, day, Number(hour), 0, 0);
        const end   = new Date(year, month, day, Number(hour), 59, 59);

        const items = await db.collection(collectionName).find({
            rowTimestamp: { $gte: start, $lte: end }
        }).toArray();

        const results = items.map(doc => {
            let val = 0;

            if (source === "solar") {
                val = parseFloat(doc.PVpow);
                if (isNaN(val)) { val = 0; }
            } else if (source === "wind") {
                let ac = parseFloat(doc.acPower);
                if (isNaN(ac)) { ac = 0; }
                let pv = parseFloat(doc.PVpow);
                if (isNaN(pv)) { pv = 0; }
                val = Math.max(ac - pv, 0);
            } else if (source === "battery") {
                val = parseFloat(doc.BattPow);
                if (isNaN(val)) { val = 0; }
            }

            return { timestamp: doc.rowTimestamp, value: val };
        });

        res.json(results);
    } finally {
        client.close();
    }
});





app.get("/api/daily-output-details", async (req, res) => {
    const { date, hour, y } = req.query;
    if (!date || hour == null) {
        return res.status(400).json({ error: "Missing date or hour" });
    }

    const client = await MongoClient.connect(url);
    const db = client.db(dbName);

    try {
        const parts = date.split("-");
        const year = Number(parts[0]);
        const month = Number(parts[1]) - 1;
        const day = Number(parts[2]);

        const start = new Date(year, month, day, Number(hour), 0, 0);
        const end   = new Date(year, month, day, Number(hour), 59, 59);

        const items = await db.collection(collectionName).find({
            rowTimestamp: { $gte: start, $lte: end }
        }).toArray();

        const results = items.map(doc => {
            let val = 0;
            if (y === "solar") {
                val = parseFloat(doc.PVpow || 0);
            } else if (y === "wind") {
                const ac = parseFloat(doc.acPower || 0);
                const pv = parseFloat(doc.PVpow || 0);
                val = Math.max(ac - pv, 0);   // 👈 apply same formula
            }
            if (isNaN(val)) val = 0;
            return { timestamp: doc.rowTimestamp, value: val };
        });

        res.json(results);
    } finally {
        client.close();
    }
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

app.use("/public", express.static(path.join(__dirname, "public")));
app.use("/components", express.static(path.join(__dirname, "components")));
app.use("/", express.static(path.join(__dirname, "pages")));
