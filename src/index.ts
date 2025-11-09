import express from 'express';
const app = express();
const port = 3000;

// Inventory Item Interface
interface InventoryItem {
  id: number;
  name: string;
  sku: string;
  quantity: number;
  location: string;
  category: string;
  minStock: number;
  maxStock: number;
  unit: string;
  supplier?: string;
  lastUpdated: string;
}

interface InventoryItemInput {
  name: string;
  sku: string;
  quantity: number;
  location: string;
  category: string;
  minStock: number;
  maxStock: number;
  unit: string;
  supplier?: string;
}

interface ParsedInvoiceItem extends Partial<InventoryItemInput> {}

interface InvoiceImportPayload {
  invoiceText: string;
  dryRun?: boolean;
  defaultLocation?: string;
  defaultCategory?: string;
  assumeSupplier?: string;
}

// In-memory database - Sample warehouse inventory
let inventory: InventoryItem[] = [
  {
    id: 1,
    name: 'Laptop - Dell XPS 15',
    sku: 'DL-XPS15-001',
    quantity: 45,
    location: 'A-12-3',
    category: 'Electronics',
    minStock: 20,
    maxStock: 100,
    unit: 'units',
    supplier: 'Dell Inc.',
    lastUpdated: new Date().toISOString()
  },
  {
    id: 2,
    name: 'Office Chair - Ergonomic',
    sku: 'OF-ERG-002',
    quantity: 12,
    location: 'B-5-1',
    category: 'Furniture',
    minStock: 15,
    maxStock: 50,
    unit: 'units',
    supplier: 'Office Supplies Co.',
    lastUpdated: new Date().toISOString()
  },
  {
    id: 3,
    name: 'Printer Paper A4',
    sku: 'PP-A4-500',
    quantity: 8,
    location: 'C-3-2',
    category: 'Office Supplies',
    minStock: 10,
    maxStock: 200,
    unit: 'reams',
    supplier: 'Paper Corp',
    lastUpdated: new Date().toISOString()
  }
];

let nextId = 4;

function generateSku(suffix?: string | number): string {
  const base = `AUTO-${Date.now()}-${Math.floor(Math.random() * 10_000)}`;
  return suffix !== undefined ? `${base}-${suffix}` : base;
}

function sanitizeInventoryInput(payload: any, options: { strict: boolean; fallbackName?: string; fallbackSku?: string; defaultLocation?: string; defaultCategory?: string; defaultQuantity?: number; assumeSupplier?: string } = { strict: false }): InventoryItemInput {
  const normalizedString = (value: unknown, fallback = ''): string => {
    if (value === undefined || value === null) return fallback;
    const str = String(value).trim();
    return str.length ? str : fallback;
  };

  const rawName = normalizedString(payload?.name, options.fallbackName ?? 'Imported Item');
  if (options.strict && !rawName) {
    throw new Error('Name is required');
  }

  let rawSku = normalizedString(payload?.sku, options.fallbackSku ?? '');
  if (!rawSku) {
    rawSku = options.strict ? '' : generateSku();
  }
  if (options.strict && !rawSku) {
    throw new Error('SKU is required');
  }

  const toNumber = (value: unknown, fallback: number): number => {
    const num = Number(value);
    return Number.isFinite(num) && num >= 0 ? num : fallback;
  };

  const quantityValue = toNumber(payload?.quantity, options.defaultQuantity ?? 0);
  if (options.strict && payload?.quantity === undefined) {
    throw new Error('Quantity is required');
  }

  const minStockValue = toNumber(payload?.minStock, 0);
  const defaultMax = Math.max(minStockValue * 2, quantityValue, 100);
  let maxStockValue = toNumber(payload?.maxStock, defaultMax);
  if (maxStockValue < minStockValue) {
    maxStockValue = Math.max(minStockValue, defaultMax);
  }

  const location = normalizedString(payload?.location, options.defaultLocation ?? 'Receiving');
  if (options.strict && !payload?.location) {
    throw new Error('Location is required');
  }

  const category = normalizedString(payload?.category, options.defaultCategory ?? 'Uncategorized');
  if (options.strict && !payload?.category) {
    throw new Error('Category is required');
  }

  const unit = normalizedString(payload?.unit, 'units');
  const supplier = normalizedString(payload?.supplier, options.assumeSupplier ?? '');

  return {
    name: rawName,
    sku: rawSku,
    quantity: quantityValue,
    location,
    category,
    minStock: minStockValue,
    maxStock: maxStockValue,
    unit,
    supplier,
  };
}

function createInventoryItem(input: InventoryItemInput): InventoryItem {
  const sanitizeNumber = (value: number, min = 0): number => {
    const num = Math.floor(Number(value));
    return Number.isFinite(num) && num >= min ? num : min;
  };

  const minStock = sanitizeNumber(input.minStock);
  const maxStock = Math.max(sanitizeNumber(input.maxStock), minStock);
  const quantity = sanitizeNumber(input.quantity);

  const item: InventoryItem = {
    id: nextId++,
    name: input.name,
    sku: input.sku,
    quantity,
    location: input.location,
    category: input.category,
    minStock,
    maxStock,
    unit: input.unit,
    supplier: input.supplier ?? '',
    lastUpdated: new Date().toISOString(),
  };

  inventory.push(item);
  return item;
}

function parseInvoiceText(invoiceText: string): ParsedInvoiceItem[] {
  const trimmed = invoiceText?.trim();
  if (!trimmed) {
    return [];
  }

  const results: ParsedInvoiceItem[] = [];

  // Attempt JSON parsing first
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      parsed.forEach((entry) => {
        if (entry && typeof entry === 'object') {
          results.push({
            name: entry.name ?? entry.description ?? entry.product ?? '',
            sku: entry.sku ?? entry.code ?? entry.skuCode ?? entry.partNumber,
            quantity: entry.quantity ?? entry.qty ?? entry.count,
            location: entry.location ?? entry.bin ?? entry.aisle,
            category: entry.category ?? entry.type ?? entry.group,
            unit: entry.unit ?? entry.units,
            supplier: entry.supplier ?? entry.vendor ?? entry.manufacturer,
            minStock: entry.minStock ?? entry.reorderLevel,
            maxStock: entry.maxStock ?? entry.orderQuantity,
          });
        }
      });
    }
    if (results.length) {
      return results;
    }
  } catch (error) {
    // Ignore JSON parsing errors and fallback to plain text parsing
  }

  const lines = trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const quantityRegex = /(?:qty|quantity)\s*[:=]?\s*(\d+(?:\.\d+)?)/i;
  const skuRegex = /(?:sku|item|code|part)\s*[:=]?\s*([A-Za-z0-9\-]+)/i;
  const locationRegex = /(?:loc|location|bin|aisle)\s*[:=]?\s*([A-Za-z0-9\-]+)/i;
  const categoryRegex = /(?:cat|category|dept|department)\s*[:=]?\s*([A-Za-z0-9\-\s]+)/i;
  const unitRegex = /(?:unit|units|uom)\s*[:=]?\s*([A-Za-z]+)/i;
  const supplierRegex = /(?:supplier|vendor|from)\s*[:=]?\s*([A-Za-z0-9\-\s]+)/i;

  lines.forEach((line, index) => {
    const segments = line.split(/[|,;]/).map((segment) => segment.trim()).filter(Boolean);
    if (!segments.length) {
      return;
    }

    let candidateName = segments[0];
    let extractedSku: string | undefined;
    let extractedQuantity: number | undefined;
    let extractedLocation: string | undefined;
    let extractedCategory: string | undefined;
    let extractedUnit: string | undefined;
    let extractedSupplier: string | undefined;
    let extractedMinStock: number | undefined;
    let extractedMaxStock: number | undefined;

    const applyRegex = (regex: RegExp, target: string): RegExpExecArray | null => regex.exec(target);

    const matches = [
      applyRegex(quantityRegex, line),
      applyRegex(skuRegex, line),
      applyRegex(locationRegex, line),
      applyRegex(categoryRegex, line),
      applyRegex(unitRegex, line),
      applyRegex(supplierRegex, line),
    ];

    matches.forEach((match) => {
      if (!match) return;
      const [fullMatch, value] = match;
      if (!value) return;
      const lower = fullMatch.toLowerCase();
      if (lower.includes('qty')) {
        extractedQuantity = Number(value);
      } else if (lower.includes('sku') || lower.includes('item') || lower.includes('code')) {
        extractedSku = value.trim();
      } else if (lower.includes('loc')) {
        extractedLocation = value.trim();
      } else if (lower.includes('cat') || lower.includes('dept')) {
        extractedCategory = value.trim();
      } else if (lower.includes('unit') || lower.includes('uom')) {
        extractedUnit = value.trim();
      } else if (lower.includes('supplier') || lower.includes('vendor') || lower.includes('from')) {
        extractedSupplier = value.trim();
      }
    });

    const minStockMatch = line.match(/(?:reorder|min\s*stock|min\s*qty)\s*[:=]?\s*(\d+(?:\.\d+)?)/i);
    if (minStockMatch) {
      extractedMinStock = Number(minStockMatch[1]);
    }
    const maxStockMatch = line.match(/(?:max\s*stock|order\s*qty|order\s*quantity)\s*[:=]?\s*(\d+(?:\.\d+)?)/i);
    if (maxStockMatch) {
      extractedMaxStock = Number(maxStockMatch[1]);
    }

    // Remove known tokens from candidate name
    const cleanedSegments = segments.filter((segment) => {
      const lower = segment.toLowerCase();
      return !(
        lower.startsWith('qty') ||
        lower.startsWith('quantity') ||
        lower.startsWith('sku') ||
        lower.startsWith('item') ||
        lower.startsWith('code') ||
        lower.startsWith('part') ||
        lower.startsWith('loc') ||
        lower.startsWith('location') ||
        lower.startsWith('bin') ||
        lower.startsWith('aisle') ||
        lower.startsWith('cat') ||
        lower.startsWith('category') ||
        lower.startsWith('dept') ||
        lower.startsWith('unit') ||
        lower.startsWith('uom') ||
        lower.startsWith('supplier') ||
        lower.startsWith('vendor') ||
        lower.startsWith('from') ||
        lower.startsWith('reorder') ||
        lower.startsWith('min ') ||
        lower.startsWith('max ')
      );
    });

    if (cleanedSegments.length) {
      candidateName = cleanedSegments[0];
    }

    if (!candidateName) {
      candidateName = `Imported Item ${index + 1}`;
    }

    if (!extractedSku) {
      extractedSku = generateSku(index + 1);
    }

    if (extractedQuantity === undefined) {
      const trailingNumberMatch = line.match(/(\d+(?:\.\d+)?)\s*$/);
      if (trailingNumberMatch) {
        extractedQuantity = Number(trailingNumberMatch[1]);
      }
    }

    results.push({
      name: candidateName,
      sku: extractedSku,
      quantity: extractedQuantity,
      location: extractedLocation,
      category: extractedCategory,
      unit: extractedUnit,
      supplier: extractedSupplier,
      minStock: extractedMinStock,
      maxStock: extractedMaxStock,
    });
  });

  return results;
}

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from public directory
app.use(express.static('public'));

// GET all inventory items
app.get('/api/inventory', (req, res) => {
  res.send(inventory);
});

// GET inventory statistics
app.get('/api/inventory/stats', (req, res) => {
  const totalItems = inventory.length;
  const totalQuantity = inventory.reduce((sum, item) => sum + item.quantity, 0);
  const lowStockItems = inventory.filter(item => item.quantity <= item.minStock).length;
  const outOfStockItems = inventory.filter(item => item.quantity === 0).length;
  const categories = [...new Set(inventory.map(item => item.category))].length;
  
  res.send({
    totalItems,
    totalQuantity,
    lowStockItems,
    outOfStockItems,
    categories,
    locations: [...new Set(inventory.map(item => item.location))].length
  });
});

// GET low stock items (must be before /:id route)
app.get('/api/inventory/low-stock', (req, res) => {
  const lowStockItems = inventory.filter(item => item.quantity <= item.minStock);
  res.send(lowStockItems);
});

// GET items by category (must be before /:id route)
app.get('/api/inventory/category/:category', (req, res) => {
  const category = req.params.category;
  const items = inventory.filter(i => 
    i.category.toLowerCase() === category.toLowerCase()
  );
  res.send(items);
});

// GET a specific inventory item by id
app.get('/api/inventory/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const item = inventory.find(i => i.id === id);
  if (item) {
    res.send(item);
  } else {
    res.status(404).send('Inventory item not found');
  }
});

// POST a new inventory item
app.post('/api/inventory', (req, res) => {
  try {
    const sanitized = sanitizeInventoryInput(req.body, { strict: true });

    if (inventory.some((item) => item.sku.toLowerCase() === sanitized.sku.toLowerCase())) {
      return res.status(400).send('SKU already exists');
    }

    const created = createInventoryItem(sanitized);
    res.status(201).send(created);
  } catch (error) {
    res.status(400).send(error instanceof Error ? error.message : 'Invalid payload');
  }
});

// PUT to update an inventory item
app.put('/api/inventory/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const itemIndex = inventory.findIndex(i => i.id === id);
  
  if (itemIndex === -1) {
    return res.status(404).send('Inventory item not found');
  }
  
  const item = inventory[itemIndex]!;
  const { name, sku, quantity, location, category, minStock, maxStock, unit, supplier } = req.body;
  
  // Update item
  if (name) item.name = name;
  if (sku) item.sku = sku;
  if (quantity !== undefined) item.quantity = Number(quantity);
  if (location) item.location = location;
  if (category) item.category = category;
  if (minStock !== undefined) item.minStock = Number(minStock);
  if (maxStock !== undefined) item.maxStock = Number(maxStock);
  if (unit) item.unit = unit;
  if (supplier !== undefined) item.supplier = supplier;
  
  item.lastUpdated = new Date().toISOString();
  
  res.send(item);
});

// PATCH to adjust inventory quantity (for stock in/out operations)
app.patch('/api/inventory/:id/quantity', (req, res) => {
  const id = parseInt(req.params.id);
  const itemIndex = inventory.findIndex(i => i.id === id);
  
  if (itemIndex === -1) {
    return res.status(404).send('Inventory item not found');
  }
  
  const item = inventory[itemIndex]!;
  const { adjustment, operation } = req.body; // operation: 'add' or 'subtract'
  
  if (adjustment === undefined || !operation) {
    return res.status(400).send('Missing adjustment or operation');
  }
  
  const adjustValue = Number(adjustment);
  
  if (operation === 'add') {
    item.quantity += adjustValue;
  } else if (operation === 'subtract') {
    if (item.quantity - adjustValue < 0) {
      return res.status(400).send('Insufficient stock');
    }
    item.quantity -= adjustValue;
  } else {
    return res.status(400).send('Invalid operation. Use "add" or "subtract"');
  }
  
  item.lastUpdated = new Date().toISOString();
  
  res.send(item);
});

// DELETE an inventory item
app.delete('/api/inventory/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const itemIndex = inventory.findIndex(i => i.id === id);
  
  if (itemIndex === -1) {
    return res.status(404).send('Inventory item not found');
  }
  
  const deletedItem = inventory[itemIndex]!;
  inventory = inventory.filter(i => i.id !== id);
  res.send({ message: 'Inventory item deleted', item: deletedItem });
});

// Import inventory items from invoice text using AI-assisted parsing
app.post('/api/inventory/import-invoice', (req, res) => {
  const { invoiceText, dryRun = false, defaultLocation, defaultCategory, assumeSupplier } = req.body as InvoiceImportPayload;

  if (!invoiceText || typeof invoiceText !== 'string') {
    return res.status(400).send('invoiceText is required');
  }

  const parsedItems = parseInvoiceText(invoiceText);
  if (!parsedItems.length) {
    return res.status(400).send('Unable to extract any inventory items from the provided invoice text');
  }

  const normalizedItems: InventoryItemInput[] = [];
  const errors: string[] = [];

  parsedItems.forEach((item, index) => {
    try {
      const sanitized = sanitizeInventoryInput(item, {
        strict: false,
        fallbackName: item.name ?? `Imported Item ${index + 1}`,
        fallbackSku: item.sku ?? generateSku(index + 1),
        defaultLocation: defaultLocation,
        defaultCategory: defaultCategory,
        defaultQuantity: item.quantity ?? 0,
        assumeSupplier,
      });

      // Ensure SKU uniqueness by appending index if necessary
      let uniqueSku = sanitized.sku;
      let attempt = 1;
      while (inventory.some((existing) => existing.sku.toLowerCase() === uniqueSku.toLowerCase()) || normalizedItems.some((existing) => existing.sku.toLowerCase() === uniqueSku.toLowerCase())) {
        uniqueSku = `${sanitized.sku}-${attempt++}`;
      }
      sanitized.sku = uniqueSku;

      normalizedItems.push(sanitized);
    } catch (error) {
      errors.push(`Line ${index + 1}: ${error instanceof Error ? error.message : 'Invalid data'}`);
    }
  });

  if (!normalizedItems.length) {
    return res.status(400).send({ message: 'No valid inventory items could be extracted', errors });
  }

  if (dryRun) {
    return res.send({ dryRun: true, items: normalizedItems, totalItems: normalizedItems.length, errors });
  }

  const createdItems = normalizedItems.map((input) => createInventoryItem(input));
  res.status(201).send({
    message: `Imported ${createdItems.length} inventory item(s)` + (errors.length ? ` with ${errors.length} warning(s)` : ''),
    items: createdItems,
    totalItems: createdItems.length,
    errors,
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.send({ status: 'ok', message: 'Warehouse Inventory API is running' });
});

app.listen(port, () => {
  console.log(`🚀 Warehouse Inventory API is running at http://localhost:${port}`);
  console.log(`📦 Inventory Management System`);
  console.log(`   GET    /api/inventory         - Get all items`);
  console.log(`   GET    /api/inventory/stats   - Get statistics`);
  console.log(`   GET    /api/inventory/:id     - Get specific item`);
  console.log(`   GET    /api/inventory/low-stock - Get low stock items`);
  console.log(`   POST   /api/inventory         - Add new item`);
  console.log(`   PUT    /api/inventory/:id     - Update item`);
  console.log(`   PATCH  /api/inventory/:id/quantity - Adjust quantity`);
  console.log(`   DELETE /api/inventory/:id     - Delete item`);
});
