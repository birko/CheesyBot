import { loadData, saveData, Data } from '../utils/storage';
import { resolveProduct } from '../utils/product';

interface ServiceResult {
    success: boolean;
    error?: string;
    name?: string;
    price?: number;
    oldName?: string;
    newName?: string;
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

    updateProduct(nameOrIndex: string, updates: { newName?: string, newPrice?: number }): ServiceResult {
        this._refreshData();
        const resolvedName = resolveProduct(this.data.products, nameOrIndex);
        if (!resolvedName) {
            return { success: false, error: `Product "${nameOrIndex}" not found.` };
        }

        const { newName, newPrice } = updates;
        const oldPrice = this.data.products[resolvedName];
        let finalizedName = resolvedName;

        // Validation
        if (!newName && newPrice === undefined) {
            return { success: false, error: "No updates provided." };
        }

        if (newName && newName !== resolvedName) {
            if (resolveProduct(this.data.products, newName)) {
                return { success: false, error: `Product name "${newName}" is already taken.` };
            }
            finalizedName = newName;
        }

        // Apply changes
        if (finalizedName !== resolvedName) {
            delete this.data.products[resolvedName];

            // Update existing orders
            if (this.data.orders) {
                for (const userId in this.data.orders) {
                    const order = this.data.orders[userId];
                    if (order.items && order.items[resolvedName]) {
                        order.items[finalizedName] = order.items[resolvedName];
                        delete order.items[resolvedName];
                    }
                }
            }
        } else {
            // If not renaming, we are updating existing entry
        }

        const priceToSet = newPrice !== undefined ? newPrice : oldPrice;
        this.data.products[finalizedName] = priceToSet;

        this._save();
        return {
            success: true,
            oldName: resolvedName,
            name: finalizedName,
            newName: finalizedName,
            oldPrice,
            newPrice: priceToSet
        };
    }
}

export default new ProductService();

