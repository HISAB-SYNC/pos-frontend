import { isMockApiEnabled } from "@/config/env";
import { mockGetCustomers } from "@/lib/mock";
import { getMockStore } from "@/lib/mock/store";
import { apiRequest } from "./client";
import { API_ENDPOINTS } from "./endpoints";
import type { Customer } from "./types";

/* ------------------------------------------------------------------ */
/* Customers API                                                       */
/* ------------------------------------------------------------------ */



export async function getCustomers(shopId: string, params?: { search?: string }) {
  if (isMockApiEnabled()) {
    const store = getMockStore();
    let list = store.customers.filter((c) => !c.shopId || c.shopId === shopId);
    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q)));
    }
    return list;
  }

  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  const suffix = query.size > 0 ? `?${query.toString()}` : "";

  // Errors propagate so the page can show "couldn't load" instead of demo data.
  const liveData = await apiRequest<Customer[]>(`${API_ENDPOINTS.shops.customers(shopId)}${suffix}`);

  if (Array.isArray(liveData)) {
    return liveData.map((c) => ({
      ...c,
      creditLimit: c.creditLimit || "5000",
      debtBalance: c.debtBalance !== undefined ? String(c.debtBalance) : "0.00",
      status: (c.status || (parseFloat(c.debtBalance || "0") > 0 ? "Active" : "Active")) as "Active" | "Overdue" | "Inactive",
      date: c.date || (c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-GB") : "Recent"),
      recentTransactions: c.recentTransactions || [],
    }));
  }
  return [];
}





export async function createCustomer(
  shopId: string,
  input: { name: string; phone?: string; email?: string; address?: string },
) {
  if (isMockApiEnabled()) {
    return {
      id: `cust-${Date.now()}`,
      shopId,
      name: input.name,
      phone: input.phone,
      email: input.email,
      address: input.address,
      debtBalance: "0.00",
    } as Customer;
  }

  return apiRequest<Customer>(API_ENDPOINTS.shops.customers(shopId), {
    method: "POST",
    body: input,
  });
}

export async function updateCustomer(
  shopId: string,
  customerId: string,
  input: Partial<{ name: string; phone: string; email: string; address: string }>,
) {
  if (isMockApiEnabled()) {
    return { id: customerId, ...input } as Customer;
  }

  return apiRequest<Customer>(`${API_ENDPOINTS.shops.customers(shopId)}/${customerId}`, {
    method: "PATCH",
    body: input,
  });
}

export async function getCustomerDetail(shopId: string, customerId: string) {
  if (isMockApiEnabled()) {
    const list = await mockGetCustomers(shopId);
    return list.find((c) => c.id === customerId) || null;
  }

  return apiRequest<Customer>(API_ENDPOINTS.shops.customerDetail(shopId, customerId));
}

export async function deleteCustomer(_shopId: string, customerId: string) {
  const { seedCustomers } = await import("@/lib/mock/data");
  const idx = seedCustomers.findIndex((c) => c.id === customerId);
  if (idx !== -1) {
    seedCustomers.splice(idx, 1);
  }

  return { success: true, message: "Customer deleted" };
}
