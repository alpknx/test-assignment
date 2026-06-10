// backend/store.js
const MIN_ID = 1;
const MAX_ID = 1_000_000;

const selectedItems = [];
const selectedSet = new Set();
const customItemSet = new Set();

function idExists(id) {
  const n = Number(id);
  return (n >= MIN_ID && n <= MAX_ID) || customItemSet.has(n);
}

function addCustomItem(id) {
  const n = Number(id);
  if (n >= MIN_ID && n <= MAX_ID) return { error: 'ID already exists in base range' };
  if (customItemSet.has(n)) return { error: 'ID already exists' };
  if (selectedSet.has(n)) return { error: 'ID already exists' };
  customItemSet.add(n);
  return { ok: true };
}

function getUnselected(page, limit, filter) {
  const offset = (page - 1) * limit;
  const results = [];
  let count = 0;

  if (!filter) {
    let selectedBaseCount = 0;
    for (const id of selectedSet) {
      if (id >= MIN_ID && id <= MAX_ID) selectedBaseCount++;
    }
    let selectedCustomCount = 0;
    for (const id of customItemSet) {
      if (selectedSet.has(id)) selectedCustomCount++;
    }
    const total =
      MAX_ID - MIN_ID + 1 - selectedBaseCount + (customItemSet.size - selectedCustomCount);

    for (let id = MIN_ID; id <= MAX_ID; id++) {
      if (selectedSet.has(id)) continue;
      if (count >= offset && results.length < limit) results.push(id);
      count++;
      if (results.length === limit) break;
    }

    if (results.length < limit) {
      const sortedCustom = [...customItemSet].sort((a, b) => a - b);
      for (const id of sortedCustom) {
        if (selectedSet.has(id)) continue;
        if (count >= offset && results.length < limit) results.push(id);
        count++;
      }
    }

    return { items: results, total, hasMore: total > page * limit };
  }

  for (let id = MIN_ID; id <= MAX_ID; id++) {
    if (selectedSet.has(id)) continue;
    if (!String(id).includes(filter)) continue;
    if (count >= offset && results.length < limit) results.push(id);
    count++;
  }

  const sortedCustom = [...customItemSet].sort((a, b) => a - b);
  for (const id of sortedCustom) {
    if (selectedSet.has(id)) continue;
    if (!String(id).includes(filter)) continue;
    if (count >= offset && results.length < limit) results.push(id);
    count++;
  }

  return { items: results, total: count, hasMore: count > page * limit };
}

function getSelected(page, limit, filter) {
  const offset = (page - 1) * limit;
  const filtered = filter
    ? selectedItems.filter(id => String(id).includes(filter))
    : selectedItems;

  return {
    items: filtered.slice(offset, offset + limit),
    total: filtered.length,
    hasMore: filtered.length > page * limit,
  };
}

function selectItems(ids) {
  for (const id of ids) {
    const n = Number(id);
    if (!idExists(n)) continue;
    if (selectedSet.has(n)) continue;
    selectedItems.push(n);
    selectedSet.add(n);
  }
}

function deselectItems(ids) {
  for (const id of ids) {
    const n = Number(id);
    selectedSet.delete(n);
  }
  for (let i = selectedItems.length - 1; i >= 0; i--) {
    if (!selectedSet.has(selectedItems[i])) selectedItems.splice(i, 1);
  }
}

function reorderSelected(fromIndex, toIndex, filteredIds) {
  if (filteredIds && Array.isArray(filteredIds)) {
    const fromId = filteredIds[fromIndex];
    const toId = filteredIds[toIndex];
    const fromReal = selectedItems.indexOf(fromId);
    const toReal = selectedItems.indexOf(toId);
    if (fromReal === -1 || toReal === -1) return;
    selectedItems.splice(fromReal, 1);
    const adjustedToReal = fromReal < toReal ? toReal - 1 : toReal;
    selectedItems.splice(adjustedToReal, 0, fromId);
  } else {
    const [item] = selectedItems.splice(fromIndex, 1);
    selectedItems.splice(toIndex, 0, item);
  }
}

module.exports = {
  getUnselected,
  getSelected,
  selectItems,
  deselectItems,
  reorderSelected,
  addCustomItem,
  idExists,
};
