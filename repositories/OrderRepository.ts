import { loadData, saveData, Data } from '../utils/storage';

export interface UserOrder {
    items: Record<string, any>;
    status: string;
    lastChange: string | number | Date;
}

export class OrderRepository {
    private data: Data;

    constructor() {
        this.data = loadData();
    }

    private refreshData() {
        this.data = loadData();
    }

    private save() {
        saveData(this.data);
    }

    private migrateUserOrders(userId: string) {
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

    public getUserOrder(userId: string): UserOrder | null {
        this.refreshData();
        this.migrateUserOrders(userId);
        return this.data.orders[userId] || null;
    }

    public getAllOrders(): Record<string, UserOrder> {
        this.refreshData();
        // Migrate all on access
        for (const userId of Object.keys(this.data.orders)) {
            this.migrateUserOrders(userId);
        }
        return this.data.orders;
    }

    public createOrder(userId: string): UserOrder {
        this.refreshData();
        if (!this.data.orders[userId]) {
            this.data.orders[userId] = { items: {}, status: 'New', lastChange: new Date().toISOString() };
        } else {
            this.migrateUserOrders(userId);
        }
        return this.data.orders[userId];
    }

    public saveOrder(userId: string, order: UserOrder): void {
        // In this simple JSON implementation, modifying the object returned by getUserOrder/createOrder
        // modifies the in-memory reference. We just need to persist it.
        // However, to be cleaner and support the pattern, we ensure the data is set.
        this.data.orders[userId] = order;
        this.save();
    }

    public deleteOrder(userId: string): void {
        this.refreshData();
        if (this.data.orders[userId]) {
            delete this.data.orders[userId];
            this.save();
        }
    }

    public deleteAllOrders(): number {
        this.refreshData();
        const count = Object.keys(this.data.orders).length;
        this.data.orders = {};
        this.save();
        return count;
    }
}

export default new OrderRepository();
