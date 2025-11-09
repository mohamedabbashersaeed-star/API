# Warehouse Inventory API

A TypeScript + Express backend for managing warehouse inventory with a modern frontend dashboard, smart AI-assisted invoice imports, and automated test coverage.

## Features
- **Inventory CRUD**: Manage items with name, SKU, quantity, location, category, stock thresholds, units, and supplier.
- **Statistics dashboard**: View total items, quantity, low-stock count, categories, and locations.
- **AI invoice import**: Paste raw invoice text or JSON; the API extracts line items, previews them, and lets you import with one click.
- **Quantity controls**: Inline `+/-` adjustments keep the page position stable.
- **Metallic UI theme**: Dark modern dashboard with Montserrat typography.

## Tech Stack
- **Runtime**: Node.js 20+
- **Backend**: Express 5 + TypeScript
- **Frontend**: Vanilla JS/HTML/CSS (no framework)

## Getting Started
1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Run in development** (ts-node)
   ```bash
   npm run dev
   ```
3. **Build & run compiled output**
   ```bash
   npm run build
   npm start
   ```

Visit `http://localhost:3000` to use the dashboard.

## Testing
Automated endpoint tests:
```bash
node test-api.js
```

Quick curl-based test:
```bash
./test.sh
```

## API Overview

### Health Check
`GET /api/health`

### Inventory
- `GET /api/inventory` – all items
- `GET /api/inventory/stats` – summary metrics
- `GET /api/inventory/low-stock` – items with quantity ≤ minStock
- `GET /api/inventory/:id` – single item
- `POST /api/inventory` – add item *(requires name, sku, quantity, location, category)*
- `PUT /api/inventory/:id` – update fields
- `PATCH /api/inventory/:id/quantity` – adjust stock (`{ adjustment, operation: 'add'|'subtract' }`)
- `DELETE /api/inventory/:id` – remove item

### Smart Invoice Import
`POST /api/inventory/import-invoice`

Payload:
```json
{
  "invoiceText": "Laptop X200, SKU: LPX200, qty 15, location A-12, category Electronics",
  "dryRun": true,
  "defaultLocation": "Receiving",
  "defaultCategory": "General",
  "assumeSupplier": "Acme Supplies"
}
```
- `dryRun: true` returns normalized items without saving.
- `dryRun: false` (default) persists all valid items.
- Plain text or JSON arrays accepted.

## Frontend Highlights
- Invoice import panel previews extracted items and lets you populate the add-item form.
- Scroll and focus remain stable when inventory updates or buttons are pressed.
- Responsive layout with metallic accents and Montserrat typography.

## Project Structure
```
/Users/mohamedsaeed/Cursor Project
├── src/                # Express + TS source
├── public/
│   ├── index.html      # Dashboard UI
│   ├── css/style.css   # Metallic theme + layout
│   ├── js/app.js       # Frontend logic (fetch, invoice preview, form)
│   ├── CUSTOMIZATION_GUIDE.md
│   └── customization-examples.css
├── test-api.js         # Automated endpoint tests
├── test.sh             # Curl-based test script
├── api-test.http       # REST Client suite (VS Code)
├── tsconfig.json
├── package.json
└── README.md
```

## Customization
- **Theme**: Tweak CSS variables in `public/css/style.css`.
- **Invoice parsing**: Adjust heuristics in `parseInvoiceText` (backend) and enhance prompts if you integrate an external LLM/OCR.
- **Dashboard behaviour**: Modify `public/js/app.js` for additional interactions.

## Contributing
1. Fork the repo
2. Create a feature branch
3. Run tests (`node test-api.js`)
4. Submit a PR

## License
MIT
