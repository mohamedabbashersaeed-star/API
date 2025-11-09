// ===================================
// WAREHOUSE INVENTORY MANAGEMENT
// ===================================

const API_BASE = 'http://localhost:3000/api';

// ===== STATE MANAGEMENT =====
let inventory = [];
let stats = {};
let searchTerm = '';
let categoryFilter = '';

// ===== DOM ELEMENTS =====
const elements = {
    itemName: document.getElementById('itemName'),
    itemSku: document.getElementById('itemSku'),
    itemQuantity: document.getElementById('itemQuantity'),
    itemLocation: document.getElementById('itemLocation'),
    itemCategory: document.getElementById('itemCategory'),
    itemMinStock: document.getElementById('itemMinStock'),
    itemMaxStock: document.getElementById('itemMaxStock'),
    itemUnit: document.getElementById('itemUnit'),
    itemSupplier: document.getElementById('itemSupplier'),
    addItemBtn: document.getElementById('addItemBtn'),
    inventoryContainer: document.getElementById('inventoryItems'),
    statsTotal: document.getElementById('statsTotal'),
    statsQuantity: document.getElementById('statsQuantity'),
    statsLowStock: document.getElementById('statsLowStock'),
    statsCategories: document.getElementById('statsCategories'),
    searchInput: document.getElementById('searchInput'),
    categoryFilter: document.getElementById('categoryFilter'),
    lowStockBtn: document.getElementById('lowStockBtn'),
    refreshBtn: document.getElementById('refreshBtn'),
    invoiceText: document.getElementById('invoiceText'),
    previewImportBtn: document.getElementById('previewImportBtn'),
    confirmImportBtn: document.getElementById('confirmImportBtn'),
    importPreview: document.getElementById('importPreview')
};

const importState = {
    previewItems: [],
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    loadInventory();
    loadStats();
    setupEventListeners();
    setupAutoRefresh();
});

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    // Add inventory item
    elements.addItemBtn?.addEventListener('click', addInventoryItem);
    
    // Enter key to add item
    document.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && e.target.closest('.form-section')) {
            addInventoryItem();
        }
    });

    // Search
    elements.searchInput?.addEventListener('input', (e) => {
        searchTerm = e.target.value.toLowerCase();
        displayInventory(inventory);
    });

    // Category filter
    elements.categoryFilter?.addEventListener('change', (e) => {
        categoryFilter = e.target.value;
        displayInventory(inventory);
    });

    // Low stock filter
    elements.lowStockBtn?.addEventListener('click', showLowStockItems);

    // Refresh
    elements.refreshBtn?.addEventListener('click', () => {
        loadInventory();
        loadStats();
    });

    // Smart invoice import
    elements.previewImportBtn?.addEventListener('click', previewInvoiceImport);
    elements.confirmImportBtn?.addEventListener('click', confirmInvoiceImport);
    if (elements.confirmImportBtn) {
        elements.confirmImportBtn.disabled = true;
    }
}

// ===== API CALLS =====
async function loadInventory() {
    try {
        showLoading();
        const response = await fetch(`${API_BASE}/inventory`);
        if (!response.ok) throw new Error('Failed to load inventory');
        
        inventory = await response.json();
        updateCategoryFilter();
        displayInventory(inventory);
        hideLoading();
    } catch (error) {
        console.error('Error loading inventory:', error);
        showError('Error loading inventory. Make sure the server is running!');
        hideLoading();
    }
}

async function loadStats() {
    try {
        const response = await fetch(`${API_BASE}/inventory/stats`);
        if (!response.ok) throw new Error('Failed to load stats');
        
        stats = await response.json();
        updateStats();
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function addInventoryItem() {
    const item = {
        name: elements.itemName?.value.trim(),
        sku: elements.itemSku?.value.trim(),
        quantity: parseInt(elements.itemQuantity?.value) || 0,
        location: elements.itemLocation?.value.trim(),
        category: elements.itemCategory?.value.trim(),
        minStock: parseInt(elements.itemMinStock?.value) || 0,
        maxStock: parseInt(elements.itemMaxStock?.value) || 1000,
        unit: elements.itemUnit?.value.trim() || 'units',
        supplier: elements.itemSupplier?.value.trim() || ''
    };

    // Validation
    if (!item.name || !item.sku || !item.location || !item.category) {
        showNotification('Please fill in all required fields (Name, SKU, Location, Category)', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/inventory`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(item)
        });

        if (response.ok) {
            // Clear form
            Object.values(elements).forEach(el => {
                if (el && el.tagName === 'INPUT') {
                    if (el.id === 'itemMinStock') el.value = '0';
                    else if (el.id === 'itemMaxStock') el.value = '1000';
                    else if (el.id === 'itemUnit') el.value = 'units';
                    else el.value = '';
                }
            });
            showNotification('Inventory item added successfully!', 'success');
            loadInventory();
            loadStats();
        } else {
            const error = await response.text();
            showNotification(error, 'error');
        }
    } catch (error) {
        console.error('Error adding inventory item:', error);
        showNotification('Error adding inventory item. Make sure the server is running!', 'error');
    }
}

async function updateInventoryItem(id, updates) {
    try {
        const response = await fetch(`${API_BASE}/inventory/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updates)
        });

        if (response.ok) {
            showNotification('Inventory item updated successfully!', 'success');
            loadInventory();
            loadStats();
        } else {
            showNotification('Error updating inventory item', 'error');
        }
    } catch (error) {
        console.error('Error updating inventory item:', error);
        showNotification('Error updating inventory item', 'error');
    }
}

async function adjustQuantity(id, adjustment, operation) {
    try {
        const response = await fetch(`${API_BASE}/inventory/${id}/quantity`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ adjustment, operation })
        });

        if (response.ok) {
            showNotification(`Quantity ${operation === 'add' ? 'increased' : 'decreased'} successfully!`, 'success');
            loadInventory();
            loadStats();
        } else {
            const error = await response.text();
            showNotification(error, 'error');
        }
    } catch (error) {
        console.error('Error adjusting quantity:', error);
        showNotification('Error adjusting quantity', 'error');
    }
}

async function deleteInventoryItem(id, name) {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/inventory/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showNotification('Inventory item deleted successfully!', 'success');
            loadInventory();
            loadStats();
        } else {
            showNotification('Error deleting inventory item', 'error');
        }
    } catch (error) {
        console.error('Error deleting inventory item:', error);
        showNotification('Error deleting inventory item', 'error');
    }
}

async function showLowStockItems() {
    try {
        const response = await fetch(`${API_BASE}/inventory/low-stock`);
        if (!response.ok) throw new Error('Failed to load low stock items');
        
        const lowStockItems = await response.json();
        displayInventory(lowStockItems);
        showNotification(`Showing ${lowStockItems.length} low stock items`, 'success');
    } catch (error) {
        console.error('Error loading low stock items:', error);
        showNotification('Error loading low stock items', 'error');
    }
}

// ===== DISPLAY FUNCTIONS =====
function displayInventory(itemsArray) {
    const container = elements.inventoryContainer;
    if (!container) return;

    const previousScrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousFocusId = previouslyFocused?.id;

    // Filter items
    let filteredItems = itemsArray;
    
    if (searchTerm) {
        filteredItems = filteredItems.filter(item => 
            item.name.toLowerCase().includes(searchTerm) ||
            item.sku.toLowerCase().includes(searchTerm) ||
            item.location.toLowerCase().includes(searchTerm) ||
            item.category.toLowerCase().includes(searchTerm) ||
            (item.supplier && item.supplier.toLowerCase().includes(searchTerm))
        );
    }
    
    if (categoryFilter) {
        filteredItems = filteredItems.filter(item => 
            item.category.toLowerCase() === categoryFilter.toLowerCase()
        );
    }

    if (filteredItems.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <p>${searchTerm || categoryFilter ? 'No items match your filters' : 'No inventory items found. Add some!'}</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filteredItems.map(item => {
        const isLowStock = item.quantity <= item.minStock;
        const stockPercentage = item.maxStock > 0 ? (item.quantity / item.maxStock) * 100 : 0;
        const stockStatusClass = item.quantity === 0 ? 'out-of-stock' : 
                                isLowStock ? 'low-stock' : 
                                stockPercentage > 80 ? 'high-stock' : 'normal-stock';

        return `
            <div class="inventory-item ${stockStatusClass}" data-id="${item.id}">
                <div class="item-header">
                    <div class="item-name-section">
                        <h4 class="item-name">${escapeHtml(item.name)}</h4>
                        <span class="item-sku">SKU: ${escapeHtml(item.sku)}</span>
                    </div>
                    <div class="item-status-badge ${stockStatusClass}">
                        ${item.quantity === 0 ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock'}
                    </div>
                </div>
                
                <div class="item-details">
                    <div class="detail-row">
                        <span class="detail-label">📍 Location:</span>
                        <span class="detail-value">${escapeHtml(item.location)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">📂 Category:</span>
                        <span class="detail-value">${escapeHtml(item.category)}</span>
                    </div>
                    ${item.supplier ? `
                    <div class="detail-row">
                        <span class="detail-label">🏢 Supplier:</span>
                        <span class="detail-value">${escapeHtml(item.supplier)}</span>
                    </div>
                    ` : ''}
                </div>

                <div class="item-quantity-section">
                    <div class="quantity-info">
                        <div class="quantity-display">
                            <span class="quantity-value">${item.quantity}</span>
                            <span class="quantity-unit">${escapeHtml(item.unit)}</span>
                        </div>
                        <div class="stock-range">
                            Min: ${item.minStock} | Max: ${item.maxStock}
                        </div>
                    </div>
                    <div class="stock-bar">
                        <div class="stock-bar-fill" style="width: ${Math.min(stockPercentage, 100)}%"></div>
                    </div>
                </div>

                <div class="item-actions">
                    <div class="quantity-adjustments">
                        <button id="adjust-add10-${item.id}" class="btn btn-sm btn-success" onclick="adjustQuantity(${item.id}, 10, 'add')">
                            +10
                        </button>
                        <button id="adjust-add1-${item.id}" class="btn btn-sm btn-success" onclick="adjustQuantity(${item.id}, 1, 'add')">
                            +1
                        </button>
                        <button id="adjust-subtract1-${item.id}" class="btn btn-sm btn-secondary" onclick="adjustQuantity(${item.id}, 1, 'subtract')">
                            -1
                        </button>
                        <button id="adjust-subtract10-${item.id}" class="btn btn-sm btn-secondary" onclick="adjustQuantity(${item.id}, 10, 'subtract')">
                            -10
                        </button>
                    </div>
                    <div class="item-buttons">
                        <button class="btn btn-sm btn-primary" onclick="editItem(${item.id})">
                            Edit
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteInventoryItem(${item.id}, '${escapeHtml(item.name)}')">
                            Delete
                        </button>
                    </div>
                </div>
                
                <div class="item-footer">
                    <span class="last-updated">Last updated: ${new Date(item.lastUpdated).toLocaleString()}</span>
                </div>
            </div>
        `;
    }).join('');

    requestAnimationFrame(() => {
        window.scrollTo(0, previousScrollTop);

        if (previousFocusId) {
            const focusElement = document.getElementById(previousFocusId);
            if (focusElement) {
                try {
                    focusElement.focus({ preventScroll: true });
                } catch (error) {
                    focusElement.focus();
                }
                return;
            }
        }

        if (previouslyFocused && document.body.contains(previouslyFocused)) {
            try {
                previouslyFocused.focus({ preventScroll: true });
            } catch (error) {
                previouslyFocused.focus();
            }
        }
    });
}

function updateStats() {
    if (elements.statsTotal) elements.statsTotal.textContent = stats.totalItems || 0;
    if (elements.statsQuantity) elements.statsQuantity.textContent = stats.totalQuantity || 0;
    if (elements.statsLowStock) elements.statsLowStock.textContent = stats.lowStockItems || 0;
    if (elements.statsCategories) elements.statsCategories.textContent = stats.categories || 0;
}

function updateCategoryFilter() {
    const categories = [...new Set(inventory.map(item => item.category))].sort();
    const filterSelect = elements.categoryFilter;
    if (!filterSelect) return;

    // Keep the "All Categories" option
    const allOption = filterSelect.querySelector('option[value=""]');
    filterSelect.innerHTML = '';
    if (allOption) filterSelect.appendChild(allOption);

    // Add category options
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        filterSelect.appendChild(option);
    });
}

// ===== UTILITY FUNCTIONS =====
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showLoading() {
    const container = elements.inventoryContainer;
    if (container) {
        container.innerHTML = '<div class="empty-state"><div class="loading"></div><p>Loading inventory...</p></div>';
    }
}

function hideLoading() {
    // Loading is hidden when displayInventory is called
}

function showNotification(message, type = 'success') {
    // Remove existing notifications
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    // Create new notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function showError(message) {
    showNotification(message, 'error');
}

// ===== EDIT FUNCTIONALITY =====
function editItem(id) {
    const item = inventory.find(i => i.id === id);
    if (!item) return;

    const updates = {};
    const name = prompt('Item Name:', item.name);
    if (name !== null) updates.name = name;

    const quantity = prompt('Quantity:', item.quantity);
    if (quantity !== null) updates.quantity = Number(quantity);

    const location = prompt('Location:', item.location);
    if (location !== null) updates.location = location;

    if (Object.keys(updates).length > 0) {
        updateInventoryItem(id, updates);
    }
}

// ===== AUTO REFRESH =====
function setupAutoRefresh() {
    // Refresh inventory every 60 seconds
    setInterval(() => {
        if (!searchTerm && !categoryFilter) {
            loadInventory();
            loadStats();
        }
    }, 60000);
}

// ===== EXPORT FUNCTIONS FOR GLOBAL ACCESS =====
window.addInventoryItem = addInventoryItem;
window.deleteInventoryItem = deleteInventoryItem;
window.editItem = editItem;
window.adjustQuantity = adjustQuantity;
window.loadInventory = loadInventory;

// ===== SMART INVOICE IMPORT =====
async function previewInvoiceImport() {
    if (!elements.invoiceText) return;
    const invoiceText = elements.invoiceText.value.trim();
    if (!invoiceText) {
        showNotification('Please paste invoice text before previewing.', 'error');
        return;
    }

    try {
        toggleImportButtons(true);
        const response = await fetch(`${API_BASE}/inventory/import-invoice`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ invoiceText, dryRun: true }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data?.message || 'Failed to parse invoice.');
        }

        importState.previewItems = Array.isArray(data.items) ? data.items : [];
        renderImportPreview(importState.previewItems, data.errors);
        showNotification(`Preview generated with ${importState.previewItems.length} item(s).`, 'success');

        if (elements.confirmImportBtn) {
            elements.confirmImportBtn.disabled = importState.previewItems.length === 0;
        }
    } catch (error) {
        renderImportPreview([]);
        if (elements.confirmImportBtn) {
            elements.confirmImportBtn.disabled = true;
        }
        showNotification(error instanceof Error ? error.message : 'Unable to preview invoice.', 'error');
    } finally {
        toggleImportButtons(false);
    }
}

async function confirmInvoiceImport() {
    if (!elements.invoiceText) return;
    const invoiceText = elements.invoiceText.value.trim();
    if (!invoiceText) {
        showNotification('Please paste invoice text before importing.', 'error');
        return;
    }

    try {
        toggleImportButtons(true);
        const response = await fetch(`${API_BASE}/inventory/import-invoice`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ invoiceText, dryRun: false }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data?.message || 'Failed to import inventory items.');
        }

        importState.previewItems = [];
        renderImportPreview([]);
        if (elements.invoiceText) {
            elements.invoiceText.value = '';
        }
        if (elements.confirmImportBtn) {
            elements.confirmImportBtn.disabled = true;
        }

        await loadInventory();
        await loadStats();

        showNotification(data?.message || `Imported ${data?.totalItems ?? 0} item(s).`, 'success');
    } catch (error) {
        showNotification(error instanceof Error ? error.message : 'Unable to import invoice items.', 'error');
    } finally {
        toggleImportButtons(false);
    }
}

function renderImportPreview(items = [], errors = []) {
    if (!elements.importPreview) return;

    if (!items.length) {
        elements.importPreview.innerHTML = '<p class="import-preview-empty">No items ready for import. Paste invoice text and click Preview.</p>';
        return;
    }

    const rows = items
        .map((item, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${sanitizePreviewValue(item.name)}</td>
                <td>${sanitizePreviewValue(item.sku)}</td>
                <td>${sanitizePreviewValue(item.quantity)}</td>
                <td>${sanitizePreviewValue(item.location)}</td>
                <td>${sanitizePreviewValue(item.category)}</td>
                <td>${sanitizePreviewValue(item.unit)}</td>
                <td>${sanitizePreviewValue(item.minStock)}</td>
                <td>${sanitizePreviewValue(item.maxStock)}</td>
                <td><button class="btn btn-sm btn-secondary" onclick="useImportedItem(${index})">Use</button></td>
            </tr>
        `)
        .join('');

    const warnings = Array.isArray(errors) && errors.length
        ? `<div class="import-preview warnings">${errors.map((warning) => `<div class="status-pill warning-pill">⚠️ ${sanitizePreviewValue(warning)}</div>`).join('')}</div>`
        : '';

    elements.importPreview.innerHTML = `
        ${warnings}
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>SKU</th>
                    <th>Qty</th>
                    <th>Location</th>
                    <th>Category</th>
                    <th>Unit</th>
                    <th>Min</th>
                    <th>Max</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
    `;
}

function toggleImportButtons(isLoading) {
    const buttons = [elements.previewImportBtn, elements.confirmImportBtn];
    buttons.forEach((button) => {
        if (button) {
            button.disabled = isLoading || (button === elements.confirmImportBtn && (!importState.previewItems.length));
            button.classList.toggle('is-loading', isLoading);
        }
    });
}

const sanitizePreviewValue = (value) => {
    if (value === undefined || value === null) return '-';
    if (typeof value === 'number' && !Number.isFinite(value)) return '-';
    return String(value);
};

function useImportedItem(index) {
    if (!Array.isArray(importState.previewItems) || !importState.previewItems[index]) {
        showNotification('Unable to load selected item from preview.', 'error');
        return;
    }

    const item = importState.previewItems[index];

    const assignValue = (element, value) => {
        if (element) {
            element.value = value ?? '';
        }
    };

    assignValue(elements.itemName, item.name ?? '');
    assignValue(elements.itemSku, item.sku ?? '');
    assignValue(elements.itemQuantity, item.quantity ?? 0);
    assignValue(elements.itemLocation, item.location ?? '');
    assignValue(elements.itemCategory, item.category ?? '');
    assignValue(elements.itemMinStock, item.minStock ?? 0);
    assignValue(elements.itemMaxStock, item.maxStock ?? 0);
    assignValue(elements.itemUnit, item.unit ?? 'units');
    assignValue(elements.itemSupplier, item.supplier ?? '');

    if (elements.itemName) {
        elements.itemName.focus({ preventScroll: true });
    }

    showNotification('Inventory form populated from invoice preview.', 'success');
}
