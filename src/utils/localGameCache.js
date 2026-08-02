/** Cache local para progresso que não deve bloquear o frame 3D com Firestore. */

const INV_KEY = 'farmaai_inventory_v1';
const MAP_KEY = 'farmaai_map_activities_v1';

export function cacheInventory(inventory) {
    try {
        localStorage.setItem(
            INV_KEY,
            JSON.stringify({
                updatedAt: Date.now(),
                inventory: Array.isArray(inventory) ? inventory : [],
            })
        );
    } catch {
        // ignore quota / private mode
    }
}

export function readCachedInventory() {
    try {
        const raw = localStorage.getItem(INV_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw);
        if (!Array.isArray(data.inventory)) return null;
        return data;
    } catch {
        return null;
    }
}

/** Prefere cache local se for mais recente ou tiver mais itens que o servidor. */
export function pickInventory(serverInventory) {
    const local = readCachedInventory();
    const server = Array.isArray(serverInventory) ? serverInventory : [];
    if (!local) return server;
    if (local.inventory.length > server.length) return local.inventory;
    if (local.inventory.length === server.length && local.updatedAt) return local.inventory;
    return server.length ? server : local.inventory;
}

export function cacheMapActivities(payload) {
    if (!payload) return;
    try {
        localStorage.setItem(
            MAP_KEY,
            JSON.stringify({
                updatedAt: Date.now(),
                ...payload,
            })
        );
    } catch {
        // ignore
    }
}

export function readCachedMapActivities() {
    try {
        const raw = localStorage.getItem(MAP_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}
