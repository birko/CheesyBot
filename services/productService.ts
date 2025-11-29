import { loadData, saveData, Data } from '../utils/storage';
import { resolveProduct } from '../utils/product';

interface ServiceResult {
    success: boolean;
    error?: string;
    name?: string;
    price?: number;
    oldPrice?: number;
    newPrice?: number;
}

class ProductService {
    private data: Data;

    constructor() {
        this.data = loadData();
    }

    private _refreshData() {
        this.data = loadData();
    }

    private _save() {
        saveData(this.data);
    }

    getAllProducts(): Record<string, number> {
        this._refreshData();
        return this.data.products;
    }

    exists(nameOrIndex: string): string | null {
        this._refreshData();
        return resolveProduct(this.data.products, nameOrIndex);
    }

    addProduct(name: string, price: number): ServiceResult {
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

    removeProduct(nameOrIndex: string): ServiceResult {
        this._refreshData();
        const resolvedName = resolveProduct(this.data.products, nameOrIndex);
        if (!resolvedName) {
            return { success: false, error: `Product "${nameOrIndex}" not found.` };
        }

        delete this.data.products[resolvedName];
        this._save();
        return { success: true, name: resolvedName };
    }

    updatePrice(nameOrIndex: string, newPrice: number): ServiceResult {
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

export default new ProductService();

