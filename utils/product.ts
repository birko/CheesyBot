export function resolveProduct(products: Record<string, any>, input: string): string | null {
    // Check if input is a direct name match
    if (products[input]) {
        return input;
    }

    // Check if input is an index
    const index = parseInt(input);
    if (!isNaN(index) && index > 0) {
        const productNames = Object.keys(products);
        if (index <= productNames.length) {
            return productNames[index - 1];
        }
    }

    return null;
}

