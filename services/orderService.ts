import { loadData, Data } from '../utils/storage'; // Still needed for product resolution if not moved to repo? 
// Wait, resolveProduct needs data.products. OrderRepository only handles orders? 
// The original code used loadData() which returned { products, orders }.
// OrderRepository only manages orders. ProductService manages products.
// OrderService needs both.
// Let's check ProductService. It uses storage directly too.
// Ideally, we should have ProductRepository too, but for now let's keep it simple and use ProductService for products if possible, or just load data for products.
// Actually, resolveProduct takes `data.products`.
// Let's use ProductService to get products? ProductService has getAllProducts().

import orderRepository from '../repositories/OrderRepository';
import productService from './productService'; // To get products
import { resolveProduct } from '../utils/product';

interface Batch {
    price: number;
    quantity: number;
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

    addOrder(userId: string, productNameOrIndex: string, amount: number): ServiceResult {
        const products = productService.getAllProducts();
        const productName = resolveProduct(products, productNameOrIndex);
        if (!productName) return { success: false, error: `Product "${productNameOrIndex}" not found.` };

        const userOrder = orderRepository.createOrder(userId);

        if (!userOrder.items[productName]) userOrder.items[productName] = [];

        // Legacy check
        if (typeof userOrder.items[productName] === 'number') {
            const oldQty = userOrder.items[productName] as unknown as number;
            const currentPrice = products[productName] || 0;
            userOrder.items[productName] = [{ price: currentPrice, quantity: oldQty }];
        }

        const currentPrice = products[productName];
        const batches = userOrder.items[productName];
        const existingBatch = batches.find((b: Batch) => b.price === currentPrice);

        if (existingBatch) {
            existingBatch.quantity += amount;
        } else {
            batches.push({ price: currentPrice, quantity: amount });
        }

        userOrder.status = 'New';
        userOrder.lastChange = new Date().toISOString();

        orderRepository.saveOrder(userId, userOrder);
        return { success: true, name: productName, amount, price: currentPrice };
    }

    editOrder(userId: string, productNameOrIndex: string, newTotal: number): ServiceResult {
        const products = productService.getAllProducts();
        const productName = resolveProduct(products, productNameOrIndex);
        if (!productName) return { success: false, error: `Product "${productNameOrIndex}" not found.` };
        if (newTotal < 0) return { success: false, error: `Amount cannot be negative.` };

        const userOrder = orderRepository.createOrder(userId);

        if (!userOrder.items[productName]) userOrder.items[productName] = [];

        // Legacy check
        if (typeof userOrder.items[productName] === 'number') {
            const oldQty = userOrder.items[productName] as unknown as number;
            const currentPrice = products[productName] || 0;
            userOrder.items[productName] = [{ price: currentPrice, quantity: oldQty }];
        }

        let batches = userOrder.items[productName];
        let currentTotal = batches.reduce((sum: number, b: Batch) => sum + b.quantity, 0);
        let diff = newTotal - currentTotal;

        if (diff === 0) return { success: true, action: 'unchanged', name: productName, quantity: newTotal };

        if (diff > 0) {
            this._increaseOrderQuantity(batches, products[productName], diff);
            userOrder.status = 'New';
            userOrder.lastChange = new Date().toISOString();
            orderRepository.saveOrder(userId, userOrder);
            return { success: true, action: 'increased', name: productName, quantity: newTotal, diff };
        } else {
            this._decreaseOrderQuantity(batches, Math.abs(diff));
            userOrder.items[productName] = batches.filter((b: Batch) => b.quantity > 0);
            if (userOrder.items[productName].length === 0) {
                delete userOrder.items[productName];
            }
            userOrder.status = 'New';
            userOrder.lastChange = new Date().toISOString();
            orderRepository.saveOrder(userId, userOrder);
            return { success: true, action: 'decreased', name: productName, quantity: newTotal, diff };
        }
    }

    private _increaseOrderQuantity(batches: Batch[], currentPrice: number, amount: number) {
        const existingBatch = batches.find((b: Batch) => b.price === currentPrice);
        if (existingBatch) {
            existingBatch.quantity += amount;
        } else {
            batches.push({ price: currentPrice, quantity: amount });
        }
    }

    private _decreaseOrderQuantity(batches: Batch[], amountToRemove: number) {
        let remaining = amountToRemove;
        for (let i = 0; i < batches.length; i++) {
            if (remaining <= 0) break;
            let batch = batches[i];
            if (batch.quantity <= remaining) {
                remaining -= batch.quantity;
                batch.quantity = 0;
            } else {
                batch.quantity -= remaining;
                remaining = 0;
            }
        }
    }

    completeOrder(userId: string, productNameOrIndex: string, amount: number): ServiceResult {
        const products = productService.getAllProducts();
        const productName = resolveProduct(products, productNameOrIndex);
        if (!productName) return { success: false, error: `Product "${productNameOrIndex}" not found.` };

        const userOrder = orderRepository.getUserOrder(userId);
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
            orderRepository.deleteOrder(userId);
        } else {
            userOrder.lastChange = new Date().toISOString();
            orderRepository.saveOrder(userId, userOrder);
        }

        return { success: true, name: productName, cost: completedCost };
    }

    completeAllOrders(): ServiceResult {
        const count = orderRepository.deleteAllOrders();
        if (count === 0) return { success: false, error: "No active orders to complete." };
        return { success: true, count };
    }

    completeUserOrders(userId: string): ServiceResult {
        const userOrder = orderRepository.getUserOrder(userId);
        if (!userOrder) return { success: false, error: "User has no active orders." };

        orderRepository.deleteOrder(userId);
        return { success: true };
    }

    completeProductOrders(userId: string, productNameOrIndex: string): ServiceResult {
        const products = productService.getAllProducts();
        const productName = resolveProduct(products, productNameOrIndex);
        if (!productName) return { success: false, error: `Product "${productNameOrIndex}" not found.` };

        const userOrder = orderRepository.getUserOrder(userId);
        if (!userOrder || !userOrder.items[productName]) {
            return { success: false, error: `User has no order for ${productName}.` };
        }

        delete userOrder.items[productName];
        if (Object.keys(userOrder.items).length === 0) {
            orderRepository.deleteOrder(userId);
        } else {
            userOrder.lastChange = new Date().toISOString();
            orderRepository.saveOrder(userId, userOrder);
        }
        return { success: true, name: productName };
    }

    updateStatus(userId: string, newStatus: string): ServiceResult {
        const userOrder = orderRepository.getUserOrder(userId);
        if (!userOrder) return { success: false, error: "User has no active orders." };

        userOrder.status = newStatus;
        userOrder.lastChange = new Date().toISOString();
        orderRepository.saveOrder(userId, userOrder);

        return { success: true, status: newStatus };
    }

    // Proxy for backward compatibility if needed, or just use repo directly in other places?
    // The original service exposed getUserOrders and getAllOrders.
    getUserOrders(userId: string) {
        return orderRepository.getUserOrder(userId);
    }

    getAllOrders() {
        return orderRepository.getAllOrders();
    }
}

export default new OrderService();

