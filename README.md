# CheesyOrder Bot

A robust Discord bot for managing product orders with unified storage, historical pricing, and admin controls.

## Features
-   **Unified Storage**: Products and orders are shared across all servers where the bot is present.
-   **Historical Pricing**: Orders retain the price at the time of purchase. Changing a product's price does not affect existing orders.
-   **Product Management**: Admins can add, remove, and update prices of products.
-   **Order System**: Users can order products by name or by index number (from the list).
-   **Currency**: Configurable currency symbol (e.g., €, $, £).
-   **Role-Based Access**: Admin commands are restricted to a configurable role.
-   **Dynamic Help**: `/help` command shows available commands based on user permissions.
-   **Internationalization**: Supports multiple languages with per-user language settings and hot reloading for translations.

## Installation

1.  **Clone the repository**
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Configuration**:
    -   Create a `.env` file in the root directory:
        ```env
        DISCORD_TOKEN=your_bot_token
        CLIENT_ID=your_client_id
        GUILD_IDS=guild_id_1,guild_id_2  # Optional: Comma-separated list for specific guild deployment
        ```
    -   Copy `config.template.json` to `config.json`
    -   Edit `config.json`:
        ```json
        {
            "adminRole": "Admin",
            "currency": "€",
            "notificationChannel": "orders",
            "notificationGuildId": ""
        }
        ```
        -   `adminRole`: The name of the Discord role that grants admin privileges.
        -   `currency`: The symbol used for prices.
        -   `notificationChannel`: Channel name for admin notifications (default: "orders").
        -   `notificationGuildId`: (Optional) ID of a central server to send all notifications to.
        -   `language`: The language for the bot (default: "en"). Supported: "en", "de", "sk", "cs".

## Internationalization (i18n)
## Internationalization (i18n)
The bot supports multiple languages.
-   **Global Default**: Set the default language in `config.json`.
-   **Per-User Language**: Users can set their preferred language using the `/language` command.
-   **Hot Reloading**: Translation files in `locales/` are watched for changes. Updates are applied instantly without restarting the bot.

Supported languages:
-   **English** (`en`)
-   **German** (`de`)
-   **Slovak** (`sk`)
-   **Czech** (`cs`)

You can add more languages by creating a new JSON file in the `locales/` directory.

## Testing
The project uses `jest` for unit testing.
To run the tests:
```bash
npm test
```

## Usage

1.  **Deploy Commands**:
    -   If `GUILD_IDS` is set in `.env`, commands deploy immediately to those servers.
    -   If `GUILD_IDS` is empty, commands deploy globally (may take time to propagate).
    ```bash
    npm run deploy
    ```

2.  **Development**:
    Run the bot in development mode (auto-restarts on changes):
    ```bash
    npm run dev
    ```

3.  **Production**:
    Build the project and run the compiled code:
    ```bash
    npm run build
    npm run start
    ```

## Commands

### User Commands
-   `/list`: List available products with their prices and index numbers.
-   `/order <product> [amount]`: Order products (by name or index).
    -   Single: `/order product:Apple amount:5` OR `/order product:1 amount:5`
    -   Bulk: `/order product:Apple:5, Banana:2` OR `/order product:1:5, 2:2`
-   `/edit <product> [amount]`: Set exact order total (by name or index).
    -   Single: `/edit product:Apple amount:10` OR `/edit product:1 amount:10`
    -   Bulk: `/edit product:Apple:10, Banana:0`
-   `/show`: Show your current active orders and total cost.
-   `/help`: Show available commands.
-   `/language <code>`: Set your preferred language (e.g., `/language sk`).

### Admin Commands
-   `/add <name> [price]`: Add products.
    -   Single: `/add name:Apple price:1.5`
    -   Bulk: `/add name:Apple:1.5, Banana:0.8`
-   `/remove <name>`: Remove products (by name or index).
    -   Single: `/remove name:Apple` OR `/remove name:1`
    -   Bulk: `/remove name:Apple, Banana` OR `/remove name:1, 2`
-   `/update <product> [new_price]`: Update product prices (by name or index).
    -   Single: `/update product:Apple new_price:2.0` OR `/update product:1 new_price:2.0`
    -   Bulk: `/update product:Apple:2.0, Banana:1.0`
-   `/orders [user]`: View all orders or orders for a specific user. Displays order indices for easy reference.
-   `/complete [product] [user|index] [amount]`: Complete orders (by name or index).
    -   All Orders: `/complete`
    -   User All: `/complete user:@User` OR `/complete index:1`
    -   User Product All: `/complete user:@User product:Apple` OR `/complete index:1 product:Apple`
    -   Specific Amount: `/complete user:@User product:Apple amount:5` OR `/complete index:1 product:Apple amount:5`
-   `/status <status> <user|index>`: Update order status (e.g., New, Processing, Completed).
    -   By User: `/status status:Processing user:@User`
    -   By Index: `/status status:Completed index:1`

**Note:** All command responses are ephemeral (visible only to you).
