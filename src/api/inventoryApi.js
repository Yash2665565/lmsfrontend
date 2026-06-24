import api from '../app/axios'

export const inventoryApi = {
  getCategories:  ()      => api.get('/inventory/categories').then(r => r.data.data ?? []),
  createCategory: (b)     => api.post('/inventory/categories', b).then(r => r.data.data),
  deleteCategory: (id)    => api.delete(`/inventory/categories/${id}`),

  getItems:   ()      => api.get('/inventory/items').then(r => r.data.data ?? []),
  createItem: (b)     => api.post('/inventory/items', b).then(r => r.data.data),
  updateItem: (id, b) => api.put(`/inventory/items/${id}`, b).then(r => r.data.data),
  deleteItem: (id)    => api.delete(`/inventory/items/${id}`),

  adjust:  (id, b) => api.post(`/inventory/items/${id}/adjust`, b).then(r => r.data.data),
  getTxns: (id)    => api.get(`/inventory/items/${id}/txns`).then(r => r.data.data ?? []),
}
