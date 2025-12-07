import type { DataProvider } from "@refinedev/core";

// API base URL
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

/**
 * Get auth headers for API requests
 */
const getHeaders = (): HeadersInit => {
  const token = localStorage.getItem("access_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

/**
 * REST Data Provider for Refine
 * Connects to the NestJS backend API
 */
export const dataProvider: DataProvider = {
  getList: async ({ resource, pagination, filters, sorters }) => {
    const currentPage = pagination?.currentPage ?? 1;
    const pageSize = pagination?.pageSize ?? 10;

    const queryParams = new URLSearchParams({
      page: String(currentPage),
      limit: String(pageSize)
    });

    // Add filters
    filters?.forEach((filter) => {
      if ("field" in filter && filter.value !== undefined) {
        queryParams.append(filter.field, String(filter.value));
      }
    });

    // Add sorters
    if (sorters && sorters.length > 0) {
      queryParams.append("sortBy", sorters[0].field);
      queryParams.append("sortOrder", sorters[0].order.toUpperCase());
    }

    const response = await fetch(`${API_URL}/${resource}?${queryParams}`, {
      headers: getHeaders()
    });

    if (!response.ok) throw new Error("Failed to fetch data");

    const data = await response.json();

    return {
      data: data.data || data,
      total: data.total || data.length
    };
  },

  getOne: async ({ resource, id }) => {
    const response = await fetch(`${API_URL}/${resource}/${id}`, {
      headers: getHeaders()
    });

    if (!response.ok) throw new Error("Failed to fetch record");

    const data = await response.json();
    return { data };
  },

  create: async ({ resource, variables }) => {
    const response = await fetch(`${API_URL}/${resource}`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(variables)
    });

    if (!response.ok) throw new Error("Failed to create record");

    const data = await response.json();
    return { data };
  },

  update: async ({ resource, id, variables }) => {
    const response = await fetch(`${API_URL}/${resource}/${id}`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify(variables)
    });

    if (!response.ok) throw new Error("Failed to update record");

    const data = await response.json();
    return { data };
  },

  deleteOne: async ({ resource, id }) => {
    const response = await fetch(`${API_URL}/${resource}/${id}`, {
      method: "DELETE",
      headers: getHeaders()
    });

    if (!response.ok) throw new Error("Failed to delete record");

    const data = await response.json();
    return { data };
  },

  getApiUrl: () => API_URL
};
