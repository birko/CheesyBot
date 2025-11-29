const { loadData, saveData } = require('../utils/storage');
const { resolveProduct } = require('../utils/product');

class OrderService {
    constructor() {
        this.data = loadData();
    }

    _refreshData() {
        this.data = loadData();
    }

    _save() {
        saveData(this.data);
    }

    _migrateUserOrders(userId) {
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

    getUserOrders(userId) {
        this._refreshData();
        this._migrateUserOrders(userId);
        return this.data.orders[userId] || null;
    }

    getAllOrders() {
        this._refreshData();
        // Migrate all on access
        for (const userId of Object.keys(this.data.orders)) {
            this._migrateUserOrders(userId);
        }
        return this.data.orders;
    }

    addOrder(userId, productNameOrIndex, amount) {
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
            const oldQty = userOrder.items[productName];
            const currentPrice = this.data.products[productName] || 0;
            userOrder.items[productName] = [{ price: currentPrice, quantity: oldQty }];
        }

        const currentPrice = this.data.products[productName];
        const batches = userOrder.items[productName];
        const existingBatch = batches.find(b => b.price === currentPrice);

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

    editOrder(userId, productNameOrIndex, newTotal) {
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
            const oldQty = userOrder.items[productName];
            const currentPrice = this.data.products[productName] || 0;
            userOrder.items[productName] = [{ price: currentPrice, quantity: oldQty }];
        }

        let batches = userOrder.items[productName];
        let currentTotal = batches.reduce((sum, b) => sum + b.quantity, 0);
        let diff = newTotal - currentTotal;

        if (diff === 0) return { success: true, action: 'unchanged', name: productName, quantity: newTotal };

        if (diff > 0) {
            // Increase
            const currentPrice = this.data.products[productName];
            const existingBatch = batches.find(b => b.price === currentPrice);
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
            userOrder.items[productName] = batches.filter(b => b.quantity > 0);
            if (userOrder.items[productName].length === 0) {
                delete userOrder.items[productName];
            }

            userOrder.status = 'New';
            userOrder.lastChange = new Date().toISOString();

            this._save();
            return { success: true, action: 'decreased', name: productName, quantity: newTotal, diff };
        }
    }

    completeOrder(userId, productNameOrIndex, amount) {
        this._refreshData();
        this._migrateUserOrders(userId);
        const productName = resolveProduct(this.data.products, productNameOrIndex);
        if (!productName) return { success: false, error: `Product "${productNameOrIndex}" not found.` };

        const userOrder = this.data.orders[userId];
        if (!userOrder || !userOrder.items[productName]) {
            return { success: false, error: `User has no order for ${productName}.` };
        }

        let batches = userOrder.items[productName];
        let totalQuantity = batches.reduce((sum, b) => sum + b.quantity, 0);

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

        userOrder.items[productName] = batches.filter(b => b.quantity > 0);
        if (userOrder.items[productName].length === 0) delete userOrder.items[productName];

        // If no items left, do we delete the user? 
        // Maybe keep user entry if we want to track status? 
        // But if empty, status is irrelevant? 
        // Let's delete if empty to keep it clean, or maybe keep it as "Completed"?
        // Current logic deletes. Let's stick to delete for now to avoid clutter, 
        // OR we can check if items are empty and set status to Completed?
        // User request: "admin can change status to Processing".
        // Let's just update lastChange. If empty, we can delete.

        if (Object.keys(userOrder.items).length === 0) {
            delete this.data.orders[userId];
        } else {
            userOrder.lastChange = new Date().toISOString();
        }

        this._save();
        return { success: true, name: productName, cost: completedCost };
    }

    completeAllOrders() {
        this._refreshData();
        const totalOrders = Object.keys(this.data.orders).length;
        if (totalOrders === 0) return { success: false, error: "No active orders to complete." };

        this.data.orders = {};
        this._save();
        return { success: true, count: totalOrders };
    }

    completeUserOrders(userId) {
        this._refreshData();
        if (!this.data.orders[userId]) return { success: false, error: "User has no active orders." };

        delete this.data.orders[userId];
        this._save();
        return { success: true };
    }

    completeProductOrders(userId, productNameOrIndex) {
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

    updateStatus(userId, newStatus) {
        this._refreshData();
        this._migrateUserOrders(userId);

        if (!this.data.orders[userId]) return { success: false, error: "User has no active orders." };

        this.data.orders[userId].status = newStatus;
        this.data.orders[userId].lastChange = new Date().toISOString();

        this._save();
        return { success: true, status: newStatus };
    }
}

module.exports = new OrderService();
