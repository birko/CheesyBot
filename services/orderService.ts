import { loadData, saveData, Data } from '../utils/storage';
import { resolveProduct } from '../utils/product';

interface Batch {
    price: number;
    quantity: number;
}

interface OrderItems {
    [productName: string]: Batch[];
}

interface UserOrder {
    items: OrderItems;
    status: string;
    lastChange: string | number | Date;
}

interface ServiceResult {
    success: boolean;
    error?: string;
    name?: string;
    amount?: number;
    price?: number;
    quantity?: number;
    action?: string;
    diff?: number;
    cost?: number;
    count?: number;
    status?: string;
}

class OrderService {
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

    private _migrateUserOrders(userId: string) {
        const userOrders = this.data.orders[userId];
        if (!userOrders) return;

        // Check if already migrated (has 'items' property)
        if (!userOrders.items) {
            const items = { ...userOrders };
            this.data.orders[userId] = {
                items: items,
                status: 'New',
                lastChange: new Date().toISOString()
            };
        }
    }

    getUserOrders(userId: string): UserOrder | null {
        this._refreshData();
        this._migrateUserOrders(userId);
        return this.data.orders[userId] || null;
    }

    getAllOrders(): Record<string, UserOrder> {
        this._refreshData();
        // Migrate all on access
        for (const userId of Object.keys(this.data.orders)) {
            this._migrateUserOrders(userId);
        }
        return this.data.orders;
    }

    addOrder(userId: string, productNameOrIndex: string, amount: number): ServiceResult {
        this._refreshData();
        const productName = resolveProduct(this.data.products, productNameOrIndex);
        if (!productName) return { success: false, error: `Product "${productNameOrIndex}" not found.` };

        if (!this.data.orders[userId]) {
            this.data.orders[userId] = { items: {}, status: 'New', lastChange: new Date().toISOString() };
        } else {
            this._migrateUserOrders(userId);
        }

        const userOrder = this.data.orders[userId];
        if (!userOrder.items[productName]) userOrder.items[productName] = [];

        // Legacy check for items (should be handled by migration but safe to keep for individual item structure)
        if (typeof userOrder.items[productName] === 'number') {
            const oldQty = userOrder.items[productName] as unknown as number;
            const currentPrice = this.data.products[productName] || 0;
            userOrder.items[productName] = [{ price: currentPrice, quantity: oldQty }];
        }

        const currentPrice = this.data.products[productName];
        const batches = userOrder.items[productName];
        const existingBatch = batches.find((b: Batch) => b.price === currentPrice);

        if (existingBatch) {
            existingBatch.quantity += amount;
        } else {
            batches.push({ price: currentPrice, quantity: amount });
        }

        // Update metadata
        userOrder.status = 'New'; // Reset status on new order? Or keep? User request says "when user creates or edit order the status will be New"
        userOrder.lastChange = new Date().toISOString();

        this._save();
        return { success: true, name: productName, amount, price: currentPrice };
    }

    editOrder(userId: string, productNameOrIndex: string, newTotal: number): ServiceResult {
        this._refreshData();
        const productName = resolveProduct(this.data.products, productNameOrIndex);
        if (!productName) return { success: false, error: `Product "${productNameOrIndex}" not found.` };
        if (newTotal < 0) return { success: false, error: `Amount cannot be negative.` };

        if (!this.data.orders[userId]) {
            this.data.orders[userId] = { items: {}, status: 'New', lastChange: new Date().toISOString() };
        } else {
            this._migrateUserOrders(userId);
        }

        const userOrder = this.data.orders[userId];
        if (!userOrder.items[productName]) userOrder.items[productName] = [];

        // Legacy check
        if (typeof userOrder.items[productName] === 'number') {
            const oldQty = userOrder.items[productName] as unknown as number;
            const currentPrice = this.data.products[productName] || 0;
            userOrder.items[productName] = [{ price: currentPrice, quantity: oldQty }];
        }

        let batches = userOrder.items[productName];
        let currentTotal = batches.reduce((sum: number, b: Batch) => sum + b.quantity, 0);
        let diff = newTotal - currentTotal;

        if (diff === 0) return { success: true, action: 'unchanged', name: productName, quantity: newTotal };

        if (diff > 0) {
            // Increase
            const currentPrice = this.data.products[productName];
            const existingBatch = batches.find((b: Batch) => b.price === currentPrice);
            if (existingBatch) {
                existingBatch.quantity += diff;
            } else {
                batches.push({ price: currentPrice, quantity: diff });
            }

            userOrder.status = 'New';
            userOrder.lastChange = new Date().toISOString();

            this._save();
            return { success: true, action: 'increased', name: productName, quantity: newTotal, diff };
        } else {
            // Decrease
            let toRemove = Math.abs(diff);
            for (let i = 0; i < batches.length; i++) {
                if (toRemove <= 0) break;
                let batch = batches[i];
                if (batch.quantity <= toRemove) {
                    toRemove -= batch.quantity;
                    batch.quantity = 0;
                } else {
                    batch.quantity -= toRemove;
                    toRemove = 0;
                }
            }
            userOrder.items[productName] = batches.filter((b: Batch) => b.quantity > 0);
            if (userOrder.items[productName].length === 0) {
                delete userOrder.items[productName];
            }

            userOrder.status = 'New';
            userOrder.lastChange = new Date().toISOString();

            this._save();
            return { success: true, action: 'decreased', name: productName, quantity: newTotal, diff };
        }
    }

    completeOrder(userId: string, productNameOrIndex: string, amount: number): ServiceResult {
        this._refreshData();
        this._migrateUserOrders(userId);
        const productName = resolveProduct(this.data.products, productNameOrIndex);
        if (!productName) return { success: false, error: `Product "${productNameOrIndex}" not found.` };

        const userOrder = this.data.orders[userId];
        if (!userOrder || !userOrder.items[productName]) {
            return { success: false, error: `User has no order for ${productName}.` };
        }

        let batches = userOrder.items[productName];
        let totalQuantity = batches.reduce((sum: number, b: Batch) => sum + b.quantity, 0);

        if (amount > totalQuantity) {
            return { success: false, error: `Cannot complete ${amount}. User only ordered ${totalQuantity}.` };
        }

        let remainingToComplete = amount;
        let completedCost = 0;

        for (let i = 0; i < batches.length; i++) {
            if (remainingToComplete <= 0) break;
            let batch = batches[i];
            if (batch.quantity <= remainingToComplete) {
                completedCost += batch.quantity * batch.price;
                remainingToComplete -= batch.quantity;
                batch.quantity = 0;
            } else {
                completedCost += remainingToComplete * batch.price;
                batch.quantity -= remainingToComplete;
                remainingToComplete = 0;
            }
        }

        userOrder.items[productName] = batches.filter((b: Batch) => b.quantity > 0);
        if (userOrder.items[productName].length === 0) delete userOrder.items[productName];

        if (Object.keys(userOrder.items).length === 0) {
            delete this.data.orders[userId];
        } else {
            userOrder.lastChange = new Date().toISOString();
        }

        this._save();
        return { success: true, name: productName, cost: completedCost };
    }

    completeAllOrders(): ServiceResult {
        this._refreshData();
        const totalOrders = Object.keys(this.data.orders).length;
        if (totalOrders === 0) return { success: false, error: "No active orders to complete." };

        this.data.orders = {};
        this._save();
        return { success: true, count: totalOrders };
    }

    completeUserOrders(userId: string): ServiceResult {
        this._refreshData();
        if (!this.data.orders[userId]) return { success: false, error: "User has no active orders." };

        delete this.data.orders[userId];
        this._save();
        return { success: true };
    }

    completeProductOrders(userId: string, productNameOrIndex: string): ServiceResult {
        this._refreshData();
        this._migrateUserOrders(userId);
        const productName = resolveProduct(this.data.products, productNameOrIndex);
        if (!productName) return { success: false, error: `Product "${productNameOrIndex}" not found.` };

        const userOrder = this.data.orders[userId];

        if (!userOrder || !userOrder.items[productName]) {
            return { success: false, error: `User has no order for ${productName}.` };
        }

        delete userOrder.items[productName];
        if (Object.keys(userOrder.items).length === 0) {
            delete this.data.orders[userId];
        } else {
            userOrder.lastChange = new Date().toISOString();
        }
        this._save();
        return { success: true, name: productName };
    }

    updateStatus(userId: string, newStatus: string): ServiceResult {
        this._refreshData();
        this._migrateUserOrders(userId);

        if (!this.data.orders[userId]) return { success: false, error: "User has no active orders." };

        this.data.orders[userId].status = newStatus;
        this.data.orders[userId].lastChange = new Date().toISOString();

        this._save();
        return { success: true, status: newStatus };
    }
}

export default new OrderService();

