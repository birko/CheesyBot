const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../data.json');

// Global storage (not per-guild)
function loadData() {
    if (!fs.existsSync(dataPath)) {
        return { products: {}, orders: {} };
    }
    try {
        const data = fs.readFileSync(dataPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error("Error reading data file:", error);
        return { products: {}, orders: {} };
    }
}

function saveData(data) {
    try {
        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Error writing data file:", error);
    }
}

module.exports = { loadData, saveData };
