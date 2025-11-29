const { loadData, saveData } = require('../utils/storage');
const { resolveProduct } = require('../utils/product');

class ProductService {
    constructor() {
        this.data = loadData();
    }

    _refreshData() {
        this.data = loadData();
    }

    _save() {
        saveData(this.data);
    }

    getAllProducts() {
        this._refreshData();
        return this.data.products;
    }

    exists(nameOrIndex) {
        this._refreshData();
        return resolveProduct(this.data.products, nameOrIndex);
    }

    addProduct(name, price) {
        this._refreshData();
        // Check if exists by name or index
        const existing = resolveProduct(this.data.products, name);
        if (existing) {
            return { success: false, error: `Product "${name}" already exists (resolves to "${existing}").` };
        }

        this.data.products[name] = price;
        this._save();
        return { success: true, name, price };
    }

    removeProduct(nameOrIndex) {
        this._refreshData();
        const resolvedName = resolveProduct(this.data.products, nameOrIndex);
        if (!resolvedName) {
            return { success: false, error: `Product "${nameOrIndex}" not found.` };
        }

        delete this.data.products[resolvedName];
        this._save();
        return { success: true, name: resolvedName };
    }

    updatePrice(nameOrIndex, newPrice) {
        this._refreshData();
        const resolvedName = resolveProduct(this.data.products, nameOrIndex);
        if (!resolvedName) {
            return { success: false, error: `Product "${nameOrIndex}" not found.` };
        }

        const oldPrice = this.data.products[resolvedName];
        this.data.products[resolvedName] = newPrice;
        this._save();
        return { success: true, name: resolvedName, oldPrice, newPrice };
    }
}

module.exports = new ProductService();
