const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const mongoose = require('mongoose');

const supersetHeaders = [
    "PVvolts","PVcur","PVpow",
    "OutCur","OutV","OutV1","OutV2","OutPow",
    "BattV","BattV1","BattV2",
    "BattCurr","BattCurr1","BattCurr2",
    "RPM","REBuss",
    "Wind","WindCur","WindV","WindRMS",
    "VAWTdcV","VAWTrms","VAWTCur",
    "OutCur1","OutCur2",
    "RemoteCurr",
    "HAWTCur","HAWTBatV","HAWTrms",
    "acPower","ACVolts","ACCurr","CosAngle","BattPow",
    "DateS","TimeS","acCurRMS","anemometer"
];

const headerMappings = {
    2014: { "OutCur": "OutCur1", "Wind": "WindV" },
    2015: { "OutCur": "OutCur1", "Wind": "WindV" },
    2016: { "OutCur": "OutCur1", "OutV": "OutV1", "Wind": "WindV" },
    "2016_oct": {
        "OutV1": "OutV1","OutV2": "OutV2",
        "BattV1": "BattV1","BattCurr1": "BattCurr1",
        "BattV2": "BattV2","BattCurr2": "BattCurr2",
        "OutCur1": "OutCur1","OutCur2": "OutCur2","RemoteCurr": "RemoteCurr"
    },
    2017: {
        "BattV1": "BattV1","BattCurr1": "BattCurr1","VAWTrms": "VAWTrms",
        "BattCurr2": "BattCurr2","OutCur1": "OutCur1","OutCur2": "OutCur2",
        "WindCur": "WindCur","WindV": "WindV","HAWTrms": "HAWTrms",
        "acPower": "acPower","ACVolts": "ACVolts","ACCurr": "ACCurr",
        "CosAngle": "CosAngle","BattPow": "BattPow"
    },
    2018: { "acCurRMS": "acCurRMS" },
    2019: {
        "BattV": "BattV","VAWTdcV": "VAWTdcV","VAWTrms": "VAWTrms",
        "BattCurr": "BattCurr","VAWTCur": "VAWTCur","OutCur2": "OutCur2",
        "RemoteCurr": "RemoteCurr","HAWTCur": "HAWTCur","HAWTBatV": "HAWTBatV",
        "HAWTrms": "HAWTrms","acCurRMS": "acCurRMS"
    },
    2024: { "anemometer": "anemometer" }
};

const dataSchema = new mongoose.Schema({}, { strict: false });
const DataDB = mongoose.model('DataDB', dataSchema, 'data');

function getHeaderForFile(mtime) {
    const year = mtime.getFullYear();
    const month = mtime.getMonth() + 1;
    const day = mtime.getDate();
    if (year === 2014) return headerMappings[2014];
    if (year === 2015) return headerMappings[2015];
    if (year === 2016) {
        if (month < 10 || (month === 10 && day < 3)) return headerMappings[2016];
        return headerMappings["2016_oct"];
    }
    if (year === 2017) return headerMappings[2017];
    if (year === 2018) return Object.assign({}, headerMappings[2017], headerMappings[2018]);
    if (year === 2019) return headerMappings[2019];
    if (year >= 2021 && year <= 2023) return headerMappings[2019];
    if (year === 2024) return Object.assign({}, headerMappings[2019], headerMappings[2024]);
    return {};
}

function mapRow(row, mapping) {
    if (mapping === undefined) {
        mapping = {};
    }
    const mapped = {};
    for (let i = 0; i < supersetHeaders.length; i++) {
        const h = supersetHeaders[i];
        if (row[h] !== undefined) {
            if (row[h] === '') {
                mapped[h] = null;
            } else {
                mapped[h] = row[h];
            }
        } else {
            const keys = Object.keys(mapping);
            let source = null;
            for (let j = 0; j < keys.length; j++) {
                if (mapping[keys[j]] === h) {
                    source = keys[j];
                    break;
                }
            }
            if (source) {
                mapped[h] = row[source];
            } else {
                mapped[h] = null;
            }
        }
    }
    return mapped;
}

async function run() {
    await mongoose.connect('mongodb://localhost:27017/FinalProject');
    const dataDir = path.resolve(__dirname, 'Data');
    let files = fs.readdirSync(dataDir)
        .filter(function(f) { return !f.startsWith('.'); })
        .map(function(f) {
            const filePath = path.join(dataDir, f);
            const stat = fs.statSync(filePath);
            return { name: f, path: filePath, mtime: stat.mtime };
        })
        .sort(function(a, b) { return b.mtime - a.mtime; });
    for (let i = 0; i < files.length; i++) {
        const file = files[i].name;
        const filePath = files[i].path;
        const mtime = files[i].mtime;
        console.log("\n=== Processing file: " + file + " (mtime: " + mtime.toISOString() + ") ===");
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n').filter(function(l) { return l.trim() !== ''; });
        if (lines.length === 0) {
            console.log("Skipped " + file + " — file is empty");
            continue;
        }
        const headerLine = lines[0];
        const headers = headerLine.split(',').map(function(h) { return h.trim(); });
        const dataLines = lines.slice(1).join('\n');
        let records = parse(dataLines, {
            columns: headers,
            skip_empty_lines: true,
            trim: true,
            delimiter: '\t',
            relax_column_count: true
        });
        console.log('Parsed headers:', headers);
        if (records.length > 0) {
            console.log('First parsed record:', records[0]);
            let missingCount = 0;
            for (let j = 0; j < records.length; j++) {
                if (!records[j] || records[j].TimeS === undefined || records[j].TimeS === '') {
                    missingCount++;
                }
            }
            console.log("Rows with missing/blank TimeS: " + missingCount + "/" + records.length);
        }
        const mapping = getHeaderForFile(mtime);
        const docs = [];
        for (let j = 0; j < records.length; j++) {
            const r = records[j];
            if (r && Object.keys(r).length > 0) {
                const mapped = mapRow(r, mapping);
                const rowDate = new Date(mtime.getTime() - ((records.length - 1 - j) * 60000));
                docs.push(Object.assign({}, mapped, {
                    fileDateMS: mtime,
                    rowTimestamp: rowDate,
                    rowTimestampReadable: rowDate.toISOString()
                }));
            }
        }
        if (docs.length > 0) {
            console.log("  First row timestamp: " + docs[0].rowTimestampReadable);
            console.log("  Last row timestamp: " + docs[docs.length - 1].rowTimestampReadable);
            const result = await DataDB.insertMany(docs);
            console.log("Inserted " + result.length + " rows into FinalProject.data from " + file);
        } else {
            console.log("Skipped " + file + " — no rows parsed");
        }
    }
    await mongoose.connection.close();
}

run().catch(function(err) {
    console.error(err);
    mongoose.connection.close();
});
