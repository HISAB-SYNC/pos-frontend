import type { Category, Product, Shop, Supplier, User } from "@/lib/api/types";

export type Customer = {
  id: string;
  shopId: string;
  name: string;
  email?: string;
  phone?: string;
  isRecurring: boolean;
  loyaltyPoints: number;
  debtBalance: string;
};

export type Debt = {
  id: string;
  shopId: string;
  customerId: string;
  customerName: string;
  amount: string;
  paidAmount: string;
  dueDate: string;
  status: "pending" | "partial" | "paid";
  notes?: string;
};

export type Expense = {
  id: string;
  shopId: string;
  category: string;
  amount: string;
  date: string;
  notes?: string;
  isRecurring: boolean;
};

export type DashboardMetrics = {
  salesOverview: {
    sales: number;
    revenue: number;
    profit: number;
    cost: number;
  };
  inventorySummary: {
    quantityInHand: number;
    toBeReceived: number;
  };
  purchaseOverview: {
    purchase: number;
    cost: number;
    cancel: number;
    return: number;
  };
  productSummary: {
    suppliers: number;
    categories: number;
  };
  salesAndPurchase: Array<{ month: string; sales: number; purchase: number }>;
  orderSummary: Array<{ month: string; ordered: number; delivered: number }>;
  topSellingStock: Array<{
    name: string;
    soldQuantity: number;
    remainingQuantity: number;
    price: string;
  }>;
  lowQuantityStock: Array<{
    id: string;
    name: string;
    remainingQuantity: number;
    unit: string;
  }>;
};

export const MOCK_IDS = {
  shop: "648408bb-c857-43eb-92fe-018cb8a1eb47",
  owner: "8cf48530-64b4-4b3d-b7ce-ebe54893bbdf",
  admin: "b26c9427-0829-4875-96e9-29a8ecc8e1c6",
  sales: "c36d0538-0930-5986-a7fa-39b9fdd2e2d7",
  categoryBeverages: "cddbee02-a5bb-421a-9137-6386671add10",
  categoryGrocery: "eddcee03-b6cc-532b-a248-7497782bee21",
  supplier: "f891a2bc-3d4e-567f-8901-abcdef234567",
  productMilk: "a1b2c3d4-e5f6-7890-abcd-1234567890ab",
  productBread: "b2c3d4e5-f6a7-8901-bcde-2345678901bc",
  productOil: "c3d4e5f6-a7b8-9012-cdef-3456789012cd",
} as const;

const now = new Date().toISOString();

export const seedUsers: User[] = [
  {
    id: MOCK_IDS.owner,
    email: "owner@demo.com",
    name: "Alex Owner",
    role: "OWNER",
    shopId: null,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: MOCK_IDS.admin,
    email: "admin@demo.com",
    name: "Mira Admin",
    role: "ADMIN",
    shopId: MOCK_IDS.shop,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: MOCK_IDS.sales,
    email: "sales@demo.com",
    name: "Sam Sales",
    role: "SALES",
    shopId: MOCK_IDS.shop,
    createdAt: now,
    updatedAt: now,
  },
];

export const seedShops: Shop[] = [
  {
    id: MOCK_IDS.shop,
    name: "SuperMart Boutique",
    address: "123 Commercial Ave, Addis Ababa",
    businessType: "boutique",
    taxRate: "15",
    currency: "ETB",
    language: "en",
    ownerId: MOCK_IDS.owner,
    createdAt: now,
  },
];

export const seedCategories: Category[] = [
  { id: MOCK_IDS.categoryBeverages, shopId: MOCK_IDS.shop, name: "Beverages" },
  { id: MOCK_IDS.categoryGrocery, shopId: MOCK_IDS.shop, name: "Grocery" },
];

export const seedSuppliers: Supplier[] = [
  {
    id: MOCK_IDS.supplier,
    shopId: MOCK_IDS.shop,
    name: "Fresh Farms Distributors",
    contactInfo: "+251911000000",
  },
];

export const seedProducts: Product[] = [
  {
    id: MOCK_IDS.productMilk,
    shopId: MOCK_IDS.shop,
    sku: "MILK-1L",
    name: "Whole Milk 1L",
    description: "Pasteurized whole milk",
    price: "90.00",
    stockQuantity: 2,
    unit: "pcs",
    lowStockThreshold: 5,
    categoryId: MOCK_IDS.categoryBeverages,
    supplierId: MOCK_IDS.supplier,
    category: { id: MOCK_IDS.categoryBeverages, name: "Beverages" },
    supplier: { id: MOCK_IDS.supplier, name: "Fresh Farms Distributors" },
  },
  {
    id: MOCK_IDS.productBread,
    shopId: MOCK_IDS.shop,
    sku: "BRD-001",
    name: "Brown Bread",
    description: "Fresh baked brown bread",
    price: "35.00",
    stockQuantity: 18,
    unit: "pcs",
    lowStockThreshold: 8,
    categoryId: MOCK_IDS.categoryGrocery,
    supplierId: MOCK_IDS.supplier,
    category: { id: MOCK_IDS.categoryGrocery, name: "Grocery" },
    supplier: { id: MOCK_IDS.supplier, name: "Fresh Farms Distributors" },
  },
  {
    id: MOCK_IDS.productOil,
    shopId: MOCK_IDS.shop,
    sku: "OIL-1L",
    name: "Cooking Oil 1L",
    description: "Vegetable cooking oil",
    price: "220.00",
    stockQuantity: 3,
    unit: "pcs",
    lowStockThreshold: 5,
    categoryId: MOCK_IDS.categoryGrocery,
    supplierId: MOCK_IDS.supplier,
    category: { id: MOCK_IDS.categoryGrocery, name: "Grocery" },
    supplier: { id: MOCK_IDS.supplier, name: "Fresh Farms Distributors" },
  },
];

export const seedCustomers: Customer[] = [
  {
    id: "cust-001",
    shopId: MOCK_IDS.shop,
    name: "Helen Bekele",
    email: "helen@example.com",
    phone: "+251911234567",
    isRecurring: true,
    loyaltyPoints: 120,
    debtBalance: "450.00",
  },
  {
    id: "cust-002",
    shopId: MOCK_IDS.shop,
    name: "Daniel Tesfaye",
    phone: "+251922345678",
    isRecurring: false,
    loyaltyPoints: 30,
    debtBalance: "0.00",
  },
];

export const seedDebts: Debt[] = [
  {
    id: "debt-001",
    shopId: MOCK_IDS.shop,
    customerId: "cust-001",
    customerName: "Helen Bekele",
    amount: "600.00",
    paidAmount: "150.00",
    dueDate: "2026-08-20",
    status: "partial",
    notes: "Monthly groceries on credit",
  },
];

export const seedExpenses: Expense[] = [
  {
    id: "exp-001",
    shopId: MOCK_IDS.shop,
    category: "Rent",
    amount: "15000.00",
    date: "2026-08-01",
    notes: "Shop rent for August",
    isRecurring: true,
  },
  {
    id: "exp-002",
    shopId: MOCK_IDS.shop,
    category: "Utilities",
    amount: "2500.00",
    date: "2026-08-05",
    isRecurring: false,
  },
];

export const seedDashboardMetrics: DashboardMetrics = {
  salesOverview: {
    sales: 832,
    revenue: 18300,
    profit: 868,
    cost: 17432,
  },
  inventorySummary: {
    quantityInHand: 868,
    toBeReceived: 200,
  },
  purchaseOverview: {
    purchase: 82,
    cost: 13573,
    cancel: 5,
    return: 17432,
  },
  productSummary: {
    suppliers: 31,
    categories: 21,
  },
  salesAndPurchase: [
    { month: "Jan", sales: 18000, purchase: 22000 },
    { month: "Feb", sales: 25000, purchase: 28000 },
    { month: "Mar", sales: 32000, purchase: 30000 },
    { month: "Apr", sales: 28000, purchase: 35000 },
    { month: "May", sales: 42000, purchase: 38000 },
    { month: "Jun", sales: 38000, purchase: 45000 },
  ],
  orderSummary: [
    { month: "Jan", ordered: 1200, delivered: 900 },
    { month: "Feb", ordered: 1800, delivered: 1400 },
    { month: "Mar", ordered: 2200, delivered: 1900 },
    { month: "Apr", ordered: 2800, delivered: 2400 },
    { month: "May", ordered: 3200, delivered: 2900 },
  ],
  topSellingStock: [
    { name: "Coca Cola", soldQuantity: 40, remainingQuantity: 12, price: "75 Birr" },
    { name: "Sun Chips", soldQuantity: 25, remainingQuantity: 15, price: "50 Birr" },
    { name: "Tomato", soldQuantity: 22, remainingQuantity: 30, price: "30 Birr" },
  ],
  lowQuantityStock: [
    { id: "1", name: "Sun Chips", remainingQuantity: 10, unit: "Packet" },
    { id: "2", name: "Whole Milk 1L", remainingQuantity: 2, unit: "pcs" },
    { id: "3", name: "Cooking Oil 1L", remainingQuantity: 3, unit: "pcs" },
  ],
};

export type MockStore = {
  users: User[];
  shops: Shop[];
  categories: Category[];
  suppliers: Supplier[];
  products: Product[];
  customers: Customer[];
  debts: Debt[];
  expenses: Expense[];
  resetTokens: Record<string, string>;
  passwords: Record<string, string>;
};

export function createSeedStore(): MockStore {
  return {
    users: structuredClone(seedUsers),
    shops: structuredClone(seedShops),
    categories: structuredClone(seedCategories),
    suppliers: structuredClone(seedSuppliers),
    products: structuredClone(seedProducts),
    customers: structuredClone(seedCustomers),
    debts: structuredClone(seedDebts),
    expenses: structuredClone(seedExpenses),
    resetTokens: {},
    passwords: {
      "owner@demo.com": "demo1234",
      "admin@demo.com": "demo1234",
      "sales@demo.com": "demo1234",
    },
  };
}
