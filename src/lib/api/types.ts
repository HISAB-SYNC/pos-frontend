import type { Role } from "@/lib/permissions/roles";

export type ApiError = {
  message: string;
  status: number;
};

export type ApiSuccessResponse<T> = {
  success: true;
  data: T;
};

export type ApiFailureResponse = {
  success: false;
  error: string;
};

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiFailureResponse;

export type PaginatedResponse<T> = {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
  shopId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Shop = {
  id: string;
  name: string;
  address?: string;
  businessType?: string;
  taxRate?: string;
  currency?: string;
  language?: string;
  ownerId?: string;
  createdAt?: string;
};

export type Category = {
  id: string;
  shopId: string;
  name: string;
};

export type Supplier = {
  id: string;
  shopId: string;
  name: string;
  contactInfo?: string;
  product?: string;
  email?: string;
  type?: "Taking Return" | "Not Taking Return";
  onTheWay?: string | number;
};

export type Product = {
  id: string;
  shopId: string;
  sku: string;
  name: string;
  description?: string;
  price: string;
  stockQuantity: number;
  unit: string;
  lowStockThreshold: number;
  categoryId?: string;
  supplierId?: string;
  attributes?: Record<string, unknown> | null;
  category?: Pick<Category, "id" | "name">;
  supplier?: Pick<Supplier, "id" | "name" | "contactInfo">;
};

export type ProductPurchase = {
  id: string;
  productId: string;
  purchaseId: string;
  supplier: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  date: string;
  status: "completed" | "pending";
};

export type ProductAdjustment = {
  id: string;
  productId: string;
  adjustmentId: string;
  quantityChange: number;
  reason: string;
  store: string;
  date: string;
};

export type ProductHistory = {
  id: string;
  productId: string;
  transactionId: string;
  type: "Purchase" | "Sale" | "Adjustment";
  quantity: number;
  store: string;
  value: number;
  date: string;
  person: string;
};

export type DebtTransaction = {
  id: string;
  customerId: string;
  customerName?: string;
  saleId?: string;
  type: "Debt Sale" | "Debt Payment" | "DEBT_SALE" | "DEBT_PAYMENT";
  reference: string;
  amount: number;
  remainingBalance: number;
  date: string;
  paymentMethod?: string;
  notes?: string;
};

export type DebtSummary = {
  totalOutstandingDebt: number;
  totalDebtors: number;
  collectedThisMonth: number;
  overdueCount: number;
};

export type Customer = {
  id: string;
  shopId?: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  debtBalance?: string;
  creditLimit?: number | string;
  daysOverdue?: number | string;
  status?: "Active" | "Overdue" | "Inactive";
  date?: string;
  customerId?: string;
  isRecurring?: boolean;
  loyaltyPoints?: number;
  totalCreditPurchases?: number | string;
  totalPaid?: number | string;
  lastTransactionDate?: string;
  sales?: Sale[];
  debts?: Debt[];
  debtHistory?: DebtTransaction[];
  recentTransactions?: Array<{
    type: string;
    date: string;
    amount: number | string;
    status: "Unpaid" | "Paid" | "Partial";
  }>;
};

export type SaleItem = {
  id?: string;
  productId: string;
  quantity: number;
  unitPrice?: string;
  subtotal?: string;
  product?: {
    id: string;
    name: string;
    sku: string;
    price?: string;
  };
};

export type Sale = {
  id: string;
  shopId: string;
  userId?: string;
  customerId?: string | null;
  subtotal?: string;
  taxAmount?: string;
  discountAmount?: string;
  totalAmount: string;
  paymentMethod: "CASH" | "CARD" | "BANK_TRANSFER" | "MOBILE" | "DEBT" | "CREDIT" | "SPLIT" | string;
  splitDetails?: {
    cashAmount?: number;
    debtAmount?: number;
    paymentMethod?: string;
  };
  status: "COMPLETED" | "CANCELLED" | "PENDING" | string;
  createdAt: string;
  items?: SaleItem[];
  customer?: Customer | null;
  notes?: string;
};

export type DebtPayment = {
  id: string;
  debtId?: string;
  customerId?: string;
  amount: string;
  paymentMethod?: "Cash" | "Card" | "Bank Transfer" | "Mobile Payment" | string;
  reference?: string;
  notes?: string;
  paidAt: string;
};

export type Debt = {
  id: string;
  shopId?: string;
  customerId: string;
  customerName?: string;
  customerPhone?: string;
  saleId?: string;
  amount: string;
  paidAmount?: string;
  dueDate?: string;
  status: "PENDING" | "PARTIAL" | "PAID" | "pending" | "partial" | "paid" | "OVERDUE" | "overdue";
  notes?: string;
  payments?: DebtPayment[];
  transactions?: DebtTransaction[];
  createdAt?: string;
};

export type BackendDashboardMetrics = {
  todaysSales: {
    count: number;
    totalAmount: number;
  };
  lowStockCount: number;
  outstandingDebts: {
    count: number;
    totalAmount: number;
  };
};

export type OrderRecord = {
  id: string;
  shopId?: string;
  product: string;
  price: number | string;
  quantity: string;
  orderId: string;
  expectedDelivery: string;
  status: "Delayed" | "Confirmed" | "Returned" | "Out for delivery";
};

export type OverallOrdersSummary = {
  totalOrders: {
    count: number;
    subtext: string;
  };
  totalReceived: {
    count: number;
    subtext: string;
    revenue: number;
    revenueLabel: string;
  };
  totalReturned: {
    count: number;
    subtext: string;
    cost: number;
    costLabel: string;
  };
  onTheWay: {
    orderedCount: number;
    orderedLabel: string;
    cost: number;
    costLabel: string;
  };
};

export type Expense = {
  id: string;
  shopId?: string;
  date: string;
  description: string;
  category: string;
  amount: number | string;
  paymentMethod: "Bank Transfer" | "Credit Card" | "Digital Pyment" | "Cash" | string;
  status: "Paid" | "Pending" | "Overdue" | string;
  notes?: string;
  isRecurring?: boolean;
};

export type ExpensesSummary = {
  totalExpenses: {
    amount: number;
    changeText: string;
  };
  thisWeek: {
    amount: number;
  };
  pendingPayment: {
    amount: number;
  };
};

export type TeamMember = {
  id: string;
  shopId?: string;
  name: string;
  email: string;
  role: "Shop Admin" | "Shop Sale" | "Owner" | "ADMIN" | "SALES" | "OWNER" | string;
  status?: "Active" | "Suspended" | "Inactive";
  joinedDate: string;
  lastLogin: string;
  phone?: string;
  permissions?: string[];
};

export type TeamSummary = {
  totalTeamMembers: number;
  shopAdminCount: number;
  shopSalesCount: number;
};

export type AuditLogRecord = {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  resource: string;
  resourceId?: string;
  timestamp: string;
  details?: string;
  previousValue?: string;
  newValue?: string;
  ipAddress?: string;
};

/* ------------------------------------------------------------------ */
/* SuperAdmin Types                                                    */
/* ------------------------------------------------------------------ */
export type AdminStats = {
  totalShops: number;
  totalActiveShops: number;
  suspendedShops: number;
  suspendedUsers: number;
  totalSuspendedAccounts: number;
  totalUsersByRole: {
    SUPER_ADMIN: number;
    OWNER: number;
    ADMIN: number;
    SALES: number;
  };
};

export type AdminShop = {
  id: string;
  name: string;
  businessType: string;
  ownerId: string;
  ownerName?: string;
  ownerEmail?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  memberCount?: number;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  shopId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  phone?: string;
  shopName?: string;
};

export type AdminUsersResponse = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  users: AdminUser[];
};

export type RegisterOwnerInput = {
  name: string;
  email: string;
  password: string;
  phone?: string;
  shopName: string;
  businessType?: string;
  address?: string;
  currency?: string;
};

/* ------------------------------------------------------------------ */
/* Shop Analytics & Reports Types                                      */
/* ------------------------------------------------------------------ */
export type AnalyticsPeriod = "daily" | "weekly" | "monthly" | "custom";

export type SalesTrendPoint = {
  date: string;
  salesCount: number;
  totalRevenue: number;
};

export type PaymentMethodStat = {
  count: number;
  totalAmount: number;
};

export type TopSellingProductStat = {
  productId: string;
  name: string;
  sku: string;
  totalQuantitySold: number;
  totalRevenue: number;
};

export type TopCustomerStat = {
  customerId: string;
  name: string;
  email?: string;
  phone?: string;
  salesCount: number;
  totalSpent: number;
};

export type ShopAnalyticsReport = {
  period: AnalyticsPeriod;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  salesAnalytics: {
    totalSalesCount: number;
    totalRevenue: number;
    totalTaxCollected: number;
    totalDiscountsGiven: number;
    averageOrderValue: number;
    paymentMethodBreakdown: {
      CASH?: PaymentMethodStat;
      CARD?: PaymentMethodStat;
      MOBILE?: PaymentMethodStat;
      BANK_TRANSFER?: PaymentMethodStat;
      DEBT?: PaymentMethodStat;
      [key: string]: PaymentMethodStat | undefined;
    };
    salesTrend: SalesTrendPoint[];
  };
  productAnalytics: {
    topSellingProducts: TopSellingProductStat[];
    lowStockCount: number;
    totalProductsCount: number;
  };
  customerAnalytics: {
    totalCustomers: number;
    newCustomersInPeriod: number;
    topCustomers: TopCustomerStat[];
    outstandingDebt: {
      count: number;
      totalAmount: number;
    };
  };
};

/* ------------------------------------------------------------------ */
/* User Profile Types                                                  */
/* ------------------------------------------------------------------ */
export type UserProfile = {
  id: string;
  email: string;
  name: string;
  role: Role;
  shopId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  ownedShops?: Array<{
    id: string;
    name: string;
    businessType?: string;
    currency?: string;
    taxRate?: string;
    isActive: boolean;
  }>;
  shop?: {
    id: string;
    name: string;
    businessType?: string;
    currency?: string;
    isActive: boolean;
  } | null;
};

export type UpdateProfileInput = {
  name?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
};
