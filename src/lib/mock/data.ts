import type {
  Category,
  Customer,
  Debt,
  Expense,
  ExpensesSummary,
  OrderRecord,
  OverallOrdersSummary,
  Product,
  ProductAdjustment,
  ProductHistory,
  ProductPurchase,
  Sale,
  Shop,
  Supplier,
  TeamMember,
  TeamSummary,
  User,
} from "@/lib/api/types";




export type DashboardMetrics = {
  salesOverview: {
    sales: number;
    revenue: number;
    profit: number;
    cost: number;
  };
  netProfit: number;
  grossProfit: number;
  totalExpenses: number;
  cogs: number;
  outstandingDebt: number;
  debtorsCount: number;
  todaySalesCount: number;
  todayRevenue: number;
  paymentBreakdown: {
    cash: number;
    bank: number;
    telebirr: number;
  };
  salesAndPurchase: Array<{ month: string; sales: number; purchase: number }>;
  trendWeekly?: Array<{ month: string; sales: number; purchase: number }>;
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
  recentSales?: Array<{
    id: string;
    customerName: string;
    totalAmount: number;
    paymentMethod: string;
    date: string;
    status: string;
  }>;
};


export type ReportMetrics = {
  overview: {
    totalProfit: number;
    revenue: number;
    sales: number;
  };
  bestSellingCategories: Array<{
    category: string;
    turnOver: number;
    increaseBy: string;
  }>;
  profitAndRevenue: Array<{
    month: string;
    revenue: number;
    profit: number;
  }>;
  bestSellingProducts: Array<{
    name: string;
    productId: string;
    category: string;
    remainingQuantity: string;
    turnOver: number;
    increaseBy: string;
  }>;
};

export const MOCK_IDS = {
  shop: "648408bb-c857-43eb-92fe-018cb8a1eb47",
  secondShop: "759519cc-d968-54fc-03af-129dc9b2fc58",
  owner: "8cf48530-64b4-4b3d-b7ce-ebe54893bbdf",
  admin: "b26c9427-0829-4875-96e9-29a8ecc8e1c6",
  sales: "c36d0538-0930-5986-a7fa-39b9fdd2e2d7",
  categoryBeverages: "cddbee02-a5bb-421a-9137-6386671add10",
  categoryGrocery: "eddcee03-b6cc-532b-a248-7497782bee21",
  categoryElectronics: "f11aee04-c7dd-643c-b359-8508893cff32",
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
  {
    id: MOCK_IDS.secondShop,
    name: "Andalus Electronics",
    address: "Bole Medhanialem Mall, Addis Ababa",
    businessType: "electronics",
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
  { id: MOCK_IDS.categoryElectronics, shopId: MOCK_IDS.secondShop, name: "Smartphones & Tablets" },
  { id: "cat-audio-acc", shopId: MOCK_IDS.secondShop, name: "Audio & Accessories" },
];

export const seedSuppliers: Supplier[] = [
  {
    id: "sup-001",
    shopId: MOCK_IDS.shop,
    name: "Richard Martin",
    product: "Kit Kat",
    contactInfo: "7687764556",
    email: "richard@gmail.com",
    type: "Taking Return",
    onTheWay: 13,
  },
  {
    id: "sup-002",
    shopId: MOCK_IDS.shop,
    name: "Tom Homan",
    product: "Maaza",
    contactInfo: "9867545368",
    email: "tomhoman@gmail.com",
    type: "Taking Return",
    onTheWay: "-",
  },
  {
    id: "sup-003",
    shopId: MOCK_IDS.shop,
    name: "Veandir",
    product: "Dairy Milk",
    contactInfo: "9867545566",
    email: "veandier@gmail.com",
    type: "Not Taking Return",
    onTheWay: "-",
  },
  {
    id: "sup-004",
    shopId: MOCK_IDS.shop,
    name: "Charin",
    product: "Tomato",
    contactInfo: "9267545457",
    email: "charin@gmail.com",
    type: "Taking Return",
    onTheWay: 12,
  },
  {
    id: "sup-005",
    shopId: MOCK_IDS.shop,
    name: "Hoffman",
    product: "Milk Bikis",
    contactInfo: "9367546531",
    email: "hoffman@gmail.com",
    type: "Taking Return",
    onTheWay: "-",
  },
  {
    id: "sup-006",
    shopId: MOCK_IDS.shop,
    name: "Fainden Juke",
    product: "Marie Gold",
    contactInfo: "9667545982",
    email: "fainden@gmail.com",
    type: "Not Taking Return",
    onTheWay: 9,
  },
  {
    id: "sup-007",
    shopId: MOCK_IDS.shop,
    name: "Martin",
    product: "Saffola",
    contactInfo: "9867545457",
    email: "martin@gmail.com",
    type: "Taking Return",
    onTheWay: "-",
  },
  {
    id: "sup-008",
    shopId: MOCK_IDS.shop,
    name: "Joe Nike",
    product: "Good day",
    contactInfo: "9567545769",
    email: "joenike@gmail.com",
    type: "Taking Return",
    onTheWay: "-",
  },
  {
    id: "sup-009",
    shopId: MOCK_IDS.shop,
    name: "Dender Luke",
    product: "Apple",
    contactInfo: "9667545980",
    email: "dender@gmail.com",
    type: "Taking Return",
    onTheWay: 7,
  },
  {
    id: "sup-010",
    shopId: MOCK_IDS.shop,
    name: "Martin",
    product: "Saffola",
    contactInfo: "9867545457",
    email: "martin@gmail.com",
    type: "Taking Return",
    onTheWay: "-",
  },
  {
    id: "sup-011",
    shopId: MOCK_IDS.shop,
    name: "Joe Nike",
    product: "Good day",
    contactInfo: "9567545769",
    email: "joenike@gmail.com",
    type: "Taking Return",
    onTheWay: "-",
  },
  {
    id: "sup-012",
    shopId: MOCK_IDS.shop,
    name: "Dender Luke",
    product: "Apple",
    contactInfo: "9667545980",
    email: "dender@gmail.com",
    type: "Not Taking Return",
    onTheWay: 7,
  },
  {
    id: "sup-013",
    shopId: MOCK_IDS.shop,
    name: "Joe Nike",
    product: "Good day",
    contactInfo: "9567545769",
    email: "joenike@gmail.com",
    type: "Taking Return",
    onTheWay: "-",
  },
  {
    id: "sup-014",
    shopId: MOCK_IDS.shop,
    name: "Joe Nike",
    product: "Good day",
    contactInfo: "9567545769",
    email: "joenike@gmail.com",
    type: "Taking Return",
    onTheWay: "-",
  },
];


export const seedProducts: Product[] = [
  {
    id: "prod-coca-cola",
    shopId: MOCK_IDS.shop,
    sku: "456567",
    name: "Coca Cola",
    description: "500ml Coca-Cola bottle",
    price: "75.00",
    stockQuantity: 24,
    unit: "pcs",
    lowStockThreshold: 10,
    categoryId: MOCK_IDS.categoryBeverages,
    supplierId: MOCK_IDS.supplier,
    category: { id: MOCK_IDS.categoryBeverages, name: "Soft drink" },
    supplier: { id: MOCK_IDS.supplier, name: "Mr. X" },
    attributes: {
      productId: "456567",
      buyingPrice: "50.00",
      salingPrice: "75.00",
      expiryDate: "13/09/25",
      location: "Addis Ababa",
      openingStock: 40,
      remainingStock: 34,
      onTheWay: 15,
      thresholdValue: 12,
      supplierName: "Mr. X",
      supplierContact: "98789 86757",
      storeLocations: [
        { name: "Kolfe Branch", stock: 15 },
        { name: "Merkato Branch", stock: 19 },
      ],
    },
  },
  {
    id: "prod-mango-juice",
    shopId: MOCK_IDS.shop,
    sku: "MNJ-200",
    name: "Mango Juice",
    description: "200ml mango juice",
    price: "50.00",
    stockQuantity: 30,
    unit: "pcs",
    lowStockThreshold: 8,
    categoryId: MOCK_IDS.categoryBeverages,
    supplierId: MOCK_IDS.supplier,
    category: { id: MOCK_IDS.categoryBeverages, name: "drink" },
    supplier: { id: MOCK_IDS.supplier, name: "Fresh Farms Distributors" },
  },
  {
    id: "prod-orange",
    shopId: MOCK_IDS.shop,
    sku: "ORG-KG",
    name: "Orange",
    description: "Fresh oranges per kg",
    price: "55.00",
    stockQuantity: 50,
    unit: "kg",
    lowStockThreshold: 10,
    categoryId: MOCK_IDS.categoryGrocery,
    supplierId: MOCK_IDS.supplier,
    category: { id: MOCK_IDS.categoryGrocery, name: "Fruit" },
    supplier: { id: MOCK_IDS.supplier, name: "Fresh Farms Distributors" },
  },
  {
    id: "prod-tomato",
    shopId: MOCK_IDS.shop,
    sku: "TOM-KG",
    name: "Tomato",
    description: "Fresh tomatoes per kg",
    price: "30.00",
    stockQuantity: 45,
    unit: "kg",
    lowStockThreshold: 10,
    categoryId: MOCK_IDS.categoryGrocery,
    supplierId: MOCK_IDS.supplier,
    category: { id: MOCK_IDS.categoryGrocery, name: "Vegetable" },
    supplier: { id: MOCK_IDS.supplier, name: "Fresh Farms Distributors" },
  },
  {
    id: "prod-akg-earphone",
    shopId: MOCK_IDS.shop,
    sku: "AKG-EP1",
    name: "AKG Earphone",
    description: "AKG wired earphone",
    price: "300.00",
    stockQuantity: 100,
    unit: "pcs",
    lowStockThreshold: 5,
    categoryId: "cat-electronics",
    supplierId: MOCK_IDS.supplier,
    category: { id: "cat-electronics", name: "Electronics" },
    supplier: { id: MOCK_IDS.supplier, name: "Fresh Farms Distributors" },
  },
  {
    id: "prod-lg-tv",
    shopId: MOCK_IDS.shop,
    sku: "LG-TV43",
    name: "LG TV",
    description: "LG 43 inch Smart TV",
    price: "35000.00",
    stockQuantity: 10,
    unit: "pcs",
    lowStockThreshold: 2,
    categoryId: "cat-electronics",
    supplierId: MOCK_IDS.supplier,
    category: { id: "cat-electronics", name: "Electronics" },
    supplier: { id: MOCK_IDS.supplier, name: "Fresh Farms Distributors" },
  },
  {
    id: "prod-laptop",
    shopId: MOCK_IDS.shop,
    sku: "LAP-001",
    name: "Laptop",
    description: "General-purpose laptop 8GB RAM",
    price: "55000.00",
    stockQuantity: 15,
    unit: "pcs",
    lowStockThreshold: 2,
    categoryId: "cat-electronics",
    supplierId: MOCK_IDS.supplier,
    category: { id: "cat-electronics", name: "Electronics" },
    supplier: { id: MOCK_IDS.supplier, name: "Fresh Farms Distributors" },
  },
  {
    id: "prod-samsung-a50",
    shopId: MOCK_IDS.shop,
    sku: "SAM-A50",
    name: "Samsung A50",
    description: "Samsung Galaxy A50 smartphone",
    price: "11000.00",
    stockQuantity: 13,
    unit: "pcs",
    lowStockThreshold: 3,
    categoryId: "cat-electronics",
    supplierId: MOCK_IDS.supplier,
    category: { id: "cat-electronics", name: "Electronics" },
    supplier: { id: MOCK_IDS.supplier, name: "Fresh Farms Distributors" },
  },
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
  {
    id: "prod-galaxy-a54",
    shopId: MOCK_IDS.secondShop,
    sku: "SMSG-A54-128",
    name: "Samsung Galaxy A54 5G (128GB)",
    description: "Awesome Graphite, 8GB RAM, 128GB Storage",
    price: "38500.00",
    stockQuantity: 14,
    unit: "pcs",
    lowStockThreshold: 3,
    categoryId: MOCK_IDS.categoryElectronics,
    supplierId: "sup-001",
    category: { id: MOCK_IDS.categoryElectronics, name: "Smartphones & Tablets" },
    supplier: { id: "sup-001", name: "Richard Martin" },
    attributes: { buyingPrice: "31000.00", costPrice: "31000.00" },
  },
  {
    id: "prod-anker-charger",
    shopId: MOCK_IDS.secondShop,
    sku: "ANK-CHG-45W",
    name: "Anker 45W USB-C Fast Charger",
    description: "PowerPort III with Foldable Plug",
    price: "1850.00",
    stockQuantity: 38,
    unit: "pcs",
    lowStockThreshold: 10,
    categoryId: "cat-audio-acc",
    supplierId: "sup-002",
    category: { id: "cat-audio-acc", name: "Audio & Accessories" },
    supplier: { id: "sup-002", name: "Tom Homan" },
    attributes: { buyingPrice: "1200.00", costPrice: "1200.00" },
  },
  {
    id: "prod-sony-earbuds",
    shopId: MOCK_IDS.secondShop,
    sku: "SNY-EAR-C500",
    name: "Sony WF-C500 Wireless Earbuds",
    description: "True Wireless Bluetooth In-Ear Headphones with Mic",
    price: "7200.00",
    stockQuantity: 2,
    unit: "pcs",
    lowStockThreshold: 5,
    categoryId: "cat-audio-acc",
    supplierId: "sup-003",
    category: { id: "cat-audio-acc", name: "Audio & Accessories" },
    supplier: { id: "sup-003", name: "Veandir" },
    attributes: { buyingPrice: "5100.00", costPrice: "5100.00" },
  },
  {
    id: "prod-smart-watch",
    shopId: MOCK_IDS.secondShop,
    sku: "WCH-ULTRA-8",
    name: "Smart Watch Ultra 49mm",
    description: "Titanium Case with Orange Alpine Loop",
    price: "6500.00",
    stockQuantity: 9,
    unit: "pcs",
    lowStockThreshold: 4,
    categoryId: "cat-audio-acc",
    supplierId: "sup-004",
    category: { id: "cat-audio-acc", name: "Audio & Accessories" },
    supplier: { id: "sup-004", name: "Charin" },
    attributes: { buyingPrice: "4200.00", costPrice: "4200.00" },
  },
];


export const seedCustomers: Customer[] = [
  {
    id: "cust-001",
    shopId: MOCK_IDS.shop,
    name: "Ahmed Ali",
    customerId: "Cust-001",
    phone: "+251912345678",
    address: "Addis Ababa, Bole",
    email: "ahmed.ali@example.com",
    debtBalance: "2500",
    creditLimit: "5000",
    daysOverdue: "5 days",
    date: "15/07/2025",
    status: "Active",
    isRecurring: true,
    loyaltyPoints: 120,
    totalCreditPurchases: 6000,
    totalPaid: 3500,
    lastTransactionDate: "Aug 20, 2026",
    debtHistory: [
      {
        id: "dth-001",
        customerId: "cust-001",
        customerName: "Ahmed Ali",
        type: "Debt Sale",
        reference: "INV-001",
        amount: 3000,
        remainingBalance: 3000,
        date: "Aug 15, 2026",
        paymentMethod: "Debt/Credit",
        notes: "Monthly inventory items on credit",
      },
      {
        id: "dth-002",
        customerId: "cust-001",
        customerName: "Ahmed Ali",
        type: "Debt Payment",
        reference: "PAY-001",
        amount: -500,
        remainingBalance: 2500,
        date: "Aug 18, 2026",
        paymentMethod: "Cash",
        notes: "Partial debt repayment at counter",
      },
    ],
    recentTransactions: [
      { type: "Purchase", date: "07/07/2025", amount: "1000 Birr", status: "Unpaid" },
      { type: "Purchase", date: "07/07/2025", amount: "500 Birr", status: "Unpaid" },
      { type: "Purchase", date: "07/07/2025", amount: "1000 Birr", status: "Unpaid" },
    ],
  },
  {
    id: "cust-002",
    shopId: MOCK_IDS.shop,
    name: "Fatima Ali",
    customerId: "Cust-002",
    phone: "+251922334455",
    address: "Addis Ababa, Piassa",
    email: "fatima@example.com",
    debtBalance: "0",
    creditLimit: "3000",
    daysOverdue: "-",
    date: "14/07/2025",
    status: "Active",
    isRecurring: false,
    loyaltyPoints: 30,
    totalCreditPurchases: 1500,
    totalPaid: 1500,
    lastTransactionDate: "Aug 10, 2026",
    debtHistory: [
      {
        id: "dth-003",
        customerId: "cust-002",
        customerName: "Fatima Ali",
        type: "Debt Sale",
        reference: "INV-004",
        amount: 1500,
        remainingBalance: 1500,
        date: "Aug 02, 2026",
        paymentMethod: "Debt/Credit",
        notes: "Spices & Grocery credit order",
      },
      {
        id: "dth-004",
        customerId: "cust-002",
        customerName: "Fatima Ali",
        type: "Debt Payment",
        reference: "PAY-002",
        amount: -1500,
        remainingBalance: 0,
        date: "Aug 10, 2026",
        paymentMethod: "Bank Transfer",
        notes: "Full settlement via CBE Birr",
      },
    ],
    recentTransactions: [],
  },
  {
    id: "cust-003",
    shopId: MOCK_IDS.shop,
    name: "Amira Hassen",
    customerId: "Cust-003",
    phone: "+251933445566",
    address: "Addis Ababa, Merkato",
    email: "amira@example.com",
    debtBalance: "4200",
    creditLimit: "4000",
    daysOverdue: "15 days",
    date: "15/07/2025",
    status: "Overdue",
    isRecurring: true,
    loyaltyPoints: 85,
    totalCreditPurchases: 5200,
    totalPaid: 1000,
    lastTransactionDate: "Aug 12, 2026",
    debtHistory: [
      {
        id: "dth-005",
        customerId: "cust-003",
        customerName: "Amira Hassen",
        type: "Debt Sale",
        reference: "INV-008",
        amount: 5200,
        remainingBalance: 5200,
        date: "Jul 28, 2026",
        paymentMethod: "Debt/Credit",
        notes: "Bulk soft drinks purchase",
      },
      {
        id: "dth-006",
        customerId: "cust-003",
        customerName: "Amira Hassen",
        type: "Debt Payment",
        reference: "PAY-003",
        amount: -1000,
        remainingBalance: 4200,
        date: "Aug 05, 2026",
        paymentMethod: "Mobile Payment",
        notes: "Telebirr transfer",
      },
    ],
    recentTransactions: [
      { type: "Purchase", date: "01/07/2025", amount: "2000 Birr", status: "Unpaid" },
      { type: "Purchase", date: "05/07/2025", amount: "2200 Birr", status: "Unpaid" },
    ],
  },
  {
    id: "cust-004",
    shopId: MOCK_IDS.shop,
    name: "Helen Bekele",
    customerId: "Cust-004",
    phone: "+251944556677",
    address: "Addis Ababa, Sarbet",
    email: "helen@example.com",
    debtBalance: "600",
    creditLimit: "3000",
    daysOverdue: "2 days",
    date: "14/07/2025",
    status: "Active",
    isRecurring: false,
    loyaltyPoints: 10,
    totalCreditPurchases: 1800,
    totalPaid: 1200,
    lastTransactionDate: "Aug 19, 2026",
    debtHistory: [
      {
        id: "dth-007",
        customerId: "cust-004",
        customerName: "Helen Bekele",
        type: "Debt Sale",
        reference: "INV-012",
        amount: 1800,
        remainingBalance: 1800,
        date: "Aug 01, 2026",
        paymentMethod: "Debt/Credit",
        notes: "Cooking oil & household essentials",
      },
      {
        id: "dth-008",
        customerId: "cust-004",
        customerName: "Helen Bekele",
        type: "Debt Payment",
        reference: "PAY-004",
        amount: -1200,
        remainingBalance: 600,
        date: "Aug 14, 2026",
        paymentMethod: "Cash",
        notes: "Cash installment",
      },
    ],
    recentTransactions: [],
  },
  {
    id: "cust-elec-001",
    shopId: MOCK_IDS.secondShop,
    name: "Dawit Electronics Buyer",
    customerId: "Cust-E01",
    phone: "+251911998877",
    address: "Addis Ababa, Bole Medhanialem",
    email: "dawit.elec@example.com",
    debtBalance: "4500",
    creditLimit: "15000",
    daysOverdue: "2 days",
    date: "10/08/2026",
    status: "Active",
    isRecurring: false,
    loyaltyPoints: 340,
    totalCreditPurchases: 18000,
    totalPaid: 13500,
    lastTransactionDate: "Sep 05, 2026",
    debtHistory: [],
    recentTransactions: [],
  },
];


export const seedDebts: Debt[] = [
  {
    id: "debt-001",
    shopId: MOCK_IDS.shop,
    customerId: "cust-001",
    customerName: "Ahmed Ali",
    customerPhone: "+251912345678",
    amount: "2500.00",
    paidAmount: "3500.00",
    dueDate: "2026-08-30",
    status: "partial",
    notes: "Monthly inventory items on credit",
    transactions: seedCustomers[0].debtHistory,
  },
  {
    id: "debt-002",
    shopId: MOCK_IDS.shop,
    customerId: "cust-003",
    customerName: "Amira Hassen",
    customerPhone: "+251933445566",
    amount: "4200.00",
    paidAmount: "1000.00",
    dueDate: "2026-08-15",
    status: "OVERDUE",
    notes: "Bulk soft drinks purchase",
    transactions: seedCustomers[2].debtHistory,
  },
  {
    id: "debt-003",
    shopId: MOCK_IDS.shop,
    customerId: "cust-004",
    customerName: "Helen Bekele",
    customerPhone: "+251944556677",
    amount: "600.00",
    paidAmount: "1200.00",
    dueDate: "2026-08-28",
    status: "partial",
    notes: "Cooking oil & household essentials",
    transactions: seedCustomers[3].debtHistory,
  },
  {
    id: "debt-elec-001",
    shopId: MOCK_IDS.secondShop,
    customerId: "cust-elec-001",
    customerName: "Dawit Electronics Buyer",
    customerPhone: "+251911998877",
    amount: "4500.00",
    paidAmount: "13500.00",
    dueDate: "2026-09-25",
    status: "partial",
    notes: "Smart Watch installment balance",
    transactions: [],
  },
];


export const seedExpensesSummary: ExpensesSummary = {
  totalExpenses: {
    amount: 5040,
    changeText: "+12.5% from last month",
  },
  thisWeek: {
    amount: 0.0,
  },
  pendingPayment: {
    amount: 1200,
  },
};

export const seedExpenses: Expense[] = [
  {
    id: "exp-001",
    shopId: MOCK_IDS.shop,
    date: "Jan 15, 2025",
    description: "Monthly Electricity Bill",
    category: "Utilities",
    amount: "2,450",
    paymentMethod: "Bank Transfer",
    status: "Paid",
    isRecurring: true,
  },
  {
    id: "exp-002",
    shopId: MOCK_IDS.shop,
    date: "Jan 15, 2025",
    description: "Staff Overtime Payments",
    category: "Staff",
    amount: "2,450",
    paymentMethod: "Bank Transfer",
    status: "Pending",
    isRecurring: false,
  },
  {
    id: "exp-003",
    shopId: MOCK_IDS.shop,
    date: "Jan 15, 2025",
    description: "Cash Register Maintenance",
    category: "Equipment",
    amount: "2,450",
    paymentMethod: "Credit Card",
    status: "Overdue",
    isRecurring: false,
  },
  {
    id: "exp-004",
    shopId: MOCK_IDS.shop,
    date: "Jan 15, 2025",
    description: "Weekly newspaper advertisement",
    category: "Marketing",
    amount: "2,450",
    paymentMethod: "Digital Pyment",
    status: "Paid",
    isRecurring: false,
  },
  {
    id: "exp-elec-001",
    shopId: MOCK_IDS.secondShop,
    date: "Sep 01, 2026",
    description: "Bole Mall Showroom Rent",
    category: "Rent",
    amount: "15,000",
    paymentMethod: "Bank Transfer",
    status: "Paid",
    isRecurring: true,
  },
  {
    id: "exp-elec-002",
    shopId: MOCK_IDS.secondShop,
    date: "Sep 05, 2026",
    description: "Ethio Telecom High-Speed Fiber",
    category: "Utilities",
    amount: "2,200",
    paymentMethod: "Mobile Payment",
    status: "Paid",
    isRecurring: true,
  },
];

export const seedTeamSummary: TeamSummary = {

  totalTeamMembers: 3,
  shopAdminCount: 1,
  shopSalesCount: 2,
};

export const seedTeamMembers: TeamMember[] = [
  {
    id: "tm-1",
    shopId: MOCK_IDS.shop,
    name: "Ahmed Hassen",
    email: "ahmed.andalus@gmail.com",
    role: "Shop Admin",
    joinedDate: "11/11/22",
    lastLogin: "11/12/22",
  },
  {
    id: "tm-2",
    shopId: MOCK_IDS.shop,
    name: "Ahmed Hassen",
    email: "ahmed.andalus@gmail.com",
    role: "Shop Sale",
    joinedDate: "11/11/22",
    lastLogin: "11/12/22",
  },
  {
    id: "tm-3",
    shopId: MOCK_IDS.shop,
    name: "Ahmed Hassen",
    email: "ahmed.andalus@gmail.com",
    role: "Shop Sale",
    joinedDate: "11/11/22",
    lastLogin: "11/12/22",
  },
  {
    id: "tm-4",
    shopId: MOCK_IDS.shop,
    name: "Ahmed Hassen",
    email: "ahmed.andalus@gmail.com",
    role: "Shop Admin",
    joinedDate: "11/11/22",
    lastLogin: "11/12/22",
  },
  {
    id: "tm-elec-1",
    shopId: MOCK_IDS.secondShop,
    name: "Dawit Bekele",
    email: "dawit.elec@gmail.com",
    role: "Shop Admin",
    joinedDate: "15/01/24",
    lastLogin: "18/09/26",
  },
  {
    id: "tm-elec-2",
    shopId: MOCK_IDS.secondShop,
    name: "Sara Solomon",
    email: "sara.elec@gmail.com",
    role: "Shop Sale",
    joinedDate: "20/02/24",
    lastLogin: "17/09/26",
  },
];



export const seedOverallOrders: OverallOrdersSummary = {
  totalOrders: {
    count: 37,
    subtext: "Last 7 days",
  },
  totalReceived: {
    count: 32,
    subtext: "Last 7 days",
    revenue: 25000,
    revenueLabel: "Revenue",
  },
  totalReturned: {
    count: 5,
    subtext: "Last 7 days",
    cost: 2500,
    costLabel: "Cost",
  },
  onTheWay: {
    orderedCount: 12,
    orderedLabel: "Ordered",
    cost: 2356,
    costLabel: "Cost",
  },
};

export const seedOrders: OrderRecord[] = [
  {
    id: "ord-1",
    shopId: MOCK_IDS.shop,
    product: "Coca Cola",
    price: 75,
    quantity: "43 Packets",
    orderId: "7535",
    expectedDelivery: "11/12/22",
    status: "Delayed",
  },
  {
    id: "ord-2",
    shopId: MOCK_IDS.shop,
    product: "Bru",
    price: 255,
    quantity: "22 Packets",
    orderId: "5724",
    expectedDelivery: "21/12/22",
    status: "Confirmed",
  },
  {
    id: "ord-3",
    shopId: MOCK_IDS.shop,
    product: "Red Bull",
    price: 40,
    quantity: "36 Packets",
    orderId: "2775",
    expectedDelivery: "5/12/22",
    status: "Returned",
  },
  {
    id: "ord-4",
    shopId: MOCK_IDS.shop,
    product: "Bourn Vita",
    price: 50,
    quantity: "14 Packets",
    orderId: "2275",
    expectedDelivery: "8/12/22",
    status: "Out for delivery",
  },
  {
    id: "ord-5",
    shopId: MOCK_IDS.shop,
    product: "Horlicks",
    price: 53,
    quantity: "5 Packets",
    orderId: "2427",
    expectedDelivery: "9/1/23",
    status: "Returned",
  },
  {
    id: "ord-6",
    shopId: MOCK_IDS.shop,
    product: "Harpic",
    price: 60,
    quantity: "10 Packets",
    orderId: "2578",
    expectedDelivery: "9/1/23",
    status: "Out for delivery",
  },
  {
    id: "ord-7",
    shopId: MOCK_IDS.shop,
    product: "Ariel",
    price: 40,
    quantity: "23 Packets",
    orderId: "2757",
    expectedDelivery: "15/12/23",
    status: "Delayed",
  },
  {
    id: "ord-8",
    shopId: MOCK_IDS.shop,
    product: "Scotch Brite",
    price: 35,
    quantity: "43 Packets",
    orderId: "3757",
    expectedDelivery: "6/6/23",
    status: "Confirmed",
  },
  {
    id: "ord-9",
    shopId: MOCK_IDS.shop,
    product: "Coca cola",
    price: 75,
    quantity: "41 Packets",
    orderId: "2474",
    expectedDelivery: "11/11/22",
    status: "Delayed",
  },
  {
    id: "ord-elec-1",
    shopId: MOCK_IDS.secondShop,
    product: "Samsung Galaxy A54",
    price: 42000,
    quantity: "2 Units",
    orderId: "8910",
    expectedDelivery: "25/09/26",
    status: "Confirmed",
  },
  {
    id: "ord-elec-2",
    shopId: MOCK_IDS.secondShop,
    product: "Anker 65W Fast Charger",
    price: 3200,
    quantity: "5 Units",
    orderId: "8911",
    expectedDelivery: "28/09/26",
    status: "Out for delivery",
  },
];


export const seedDashboardMetrics: DashboardMetrics = {
  salesOverview: {
    sales: 832,
    revenue: 18300,
    profit: 5490,
    cost: 12810,
  },
  netProfit: 4190,
  grossProfit: 5490,
  totalExpenses: 1300,
  cogs: 12810,
  outstandingDebt: 6700,
  debtorsCount: 3,
  todaySalesCount: 14,
  todayRevenue: 2450,
  paymentBreakdown: {
    cash: 9500,
    bank: 5200,
    telebirr: 3600,
  },
  salesAndPurchase: [
    { month: "Jan", sales: 18000, purchase: 22000 },
    { month: "Feb", sales: 25000, purchase: 28000 },
    { month: "Mar", sales: 32000, purchase: 30000 },
    { month: "Apr", sales: 28000, purchase: 35000 },
    { month: "May", sales: 42000, purchase: 38000 },
    { month: "Jun", sales: 38000, purchase: 45000 },
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
  recentSales: [
    { id: "S-1049", customerName: "Abebe Kebede", totalAmount: 850, paymentMethod: "Telebirr", date: "Today, 02:45 PM", status: "COMPLETED" },
    { id: "S-1048", customerName: "Sara Mohammed", totalAmount: 1420, paymentMethod: "Cash", date: "Today, 01:15 PM", status: "COMPLETED" },
    { id: "S-1047", customerName: "Walk-in Customer", totalAmount: 320, paymentMethod: "Cash", date: "Today, 11:30 AM", status: "COMPLETED" },
    { id: "S-1046", customerName: "Amira Hassen", totalAmount: 2100, paymentMethod: "Bank", date: "Yesterday", status: "COMPLETED" },
  ],
};


export const seedReportMetrics: ReportMetrics = {
  overview: {
    totalProfit: 21190,
    revenue: 18300,
    sales: 17432,
  },
  bestSellingCategories: [
    { category: "Soft Drinks", turnOver: 26000, increaseBy: "3.2%" },
    { category: "Snacks", turnOver: 22000, increaseBy: "2%" },
  ],
  profitAndRevenue: [
    { month: "Sep", revenue: 26000, profit: 42000 },
    { month: "Oct", revenue: 36000, profit: 35000 },
    { month: "Nov", revenue: 33000, profit: 42000 },
    { month: "Dec", revenue: 62000, profit: 58000 },
    { month: "Jan", revenue: 65000, profit: 59000 },
    { month: "Feb", revenue: 78000, profit: 60000 },
    { month: "Mar", revenue: 45000, profit: 46000 },
  ],
  bestSellingProducts: [
    {
      name: "Tomato",
      productId: "23567",
      category: "Vegetable",
      remainingQuantity: "225 kg",
      turnOver: 17000,
      increaseBy: "2.3%",
    },
    {
      name: "Onion",
      productId: "25831",
      category: "Vegetable",
      remainingQuantity: "200 kg",
      turnOver: 12000,
      increaseBy: "1.3%",
    },
    {
      name: "Indomie",
      productId: "56841",
      category: "Instant Food",
      remainingQuantity: "200 Packet",
      turnOver: 10000,
      increaseBy: "1.3%",
    },
    {
      name: "Indomie",
      productId: "56841",
      category: "Instant Food",
      remainingQuantity: "200 Packet",
      turnOver: 10000,
      increaseBy: "1.3%",
    },
  ],
};


export const seedProductPurchases: ProductPurchase[] = [
  {
    id: "pur-1",
    productId: "prod-coca-cola",
    purchaseId: "P-1234",
    supplier: "Mr.x",
    quantity: 50,
    unitCost: 75,
    totalCost: 3750,
    date: "15/07/2025",
    status: "completed",
  },
  {
    id: "pur-2",
    productId: "prod-coca-cola",
    purchaseId: "P-1234",
    supplier: "Mr.x",
    quantity: 50,
    unitCost: 72,
    totalCost: 3750,
    date: "14/07/2025",
    status: "pending",
  },
  {
    id: "pur-3",
    productId: "prod-coca-cola",
    purchaseId: "P-1234",
    supplier: "Mr.y",
    quantity: 50,
    unitCost: 70,
    totalCost: 3750,
    date: "13/07/2025",
    status: "completed",
  },
  {
    id: "pur-4",
    productId: "prod-coca-cola",
    purchaseId: "P-1234",
    supplier: "Mr.y",
    quantity: 50,
    unitCost: 70,
    totalCost: 3750,
    date: "12/07/2025",
    status: "pending",
  },
];

export const seedProductAdjustments: ProductAdjustment[] = [
  {
    id: "adj-1",
    productId: "prod-coca-cola",
    adjustmentId: "A-0001",
    quantityChange: -5,
    reason: "Damaged",
    store: "Kolfe Branch",
    date: "15/07/2025",
  },
  {
    id: "adj-2",
    productId: "prod-coca-cola",
    adjustmentId: "A-0002",
    quantityChange: -2,
    reason: "Expired",
    store: "Merkato Branch",
    date: "14/07/2025",
  },
  {
    id: "adj-3",
    productId: "prod-coca-cola",
    adjustmentId: "A-0003",
    quantityChange: 3,
    reason: "Found stock",
    store: "Kolfe Branch",
    date: "13/07/2025",
  },
  {
    id: "adj-4",
    productId: "prod-coca-cola",
    adjustmentId: "A-0004",
    quantityChange: -1,
    reason: "Theft",
    store: "Merkato Branch",
    date: "12/07/2025",
  },
];

export const seedProductHistory: ProductHistory[] = [
  {
    id: "hist-1",
    productId: "prod-coca-cola",
    transactionId: "T-1234",
    type: "Purchase",
    quantity: 50,
    store: "Both",
    value: 3750,
    date: "15/07/2025",
    person: "Mr. X",
  },
  {
    id: "hist-2",
    productId: "prod-coca-cola",
    transactionId: "T-1234",
    type: "Sale",
    quantity: -5,
    store: "Kolfe",
    value: 3750,
    date: "14/07/2025",
    person: "Mr. Y",
  },
  {
    id: "hist-3",
    productId: "prod-coca-cola",
    transactionId: "T-1234",
    type: "Adjustment",
    quantity: -5,
    store: "Merkato",
    value: 3750,
    date: "13/07/2025",
    person: "Mr. Z",
  },
  {
    id: "hist-4",
    productId: "prod-coca-cola",
    transactionId: "T-1234",
    type: "Sale",
    quantity: -10,
    store: "Merkato",
    value: 3750,
    date: "12/07/2025",
    person: "Mr. X",
  },
];

export const seedSales: Sale[] = [
  {
    id: "sale-101",
    shopId: MOCK_IDS.shop,
    customerId: "cust-001",
    totalAmount: "450.00",
    subtotal: "450.00",
    discountAmount: "0.00",
    taxAmount: "0.00",
    paymentMethod: "CASH",
    status: "COMPLETED",
    createdAt: new Date().toISOString(),
    items: [
      {
        id: "item-1",
        productId: "prod-sun-chips",
        quantity: 5,
        unitPrice: "90.00",
        subtotal: "450.00",
        product: { id: "prod-sun-chips", name: "Sun Chips", sku: "CHIP-001" },
      },
    ],
  },
  {
    id: "sale-102",
    shopId: MOCK_IDS.shop,
    customerId: "cust-003",
    totalAmount: "2200.00",
    subtotal: "2200.00",
    discountAmount: "0.00",
    taxAmount: "0.00",
    paymentMethod: "BANK",
    status: "COMPLETED",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    items: [
      {
        id: "item-2",
        productId: MOCK_IDS.productOil,
        quantity: 10,
        unitPrice: "220.00",
        subtotal: "2200.00",
        product: { id: MOCK_IDS.productOil, name: "Cooking Oil 1L", sku: "OIL-1L" },
      },
    ],
  },
  {
    id: "sale-elec-101",
    shopId: MOCK_IDS.secondShop,
    customerId: "cust-elec-001",
    totalAmount: "38500.00",
    subtotal: "38500.00",
    discountAmount: "0.00",
    taxAmount: "0.00",
    paymentMethod: "BANK",
    status: "COMPLETED",
    createdAt: new Date().toISOString(),
    items: [
      {
        id: "item-elec-1",
        productId: "prod-galaxy-a54",
        quantity: 1,
        unitPrice: "38500.00",
        subtotal: "38500.00",
        product: { id: "prod-galaxy-a54", name: "Samsung Galaxy A54 5G (128GB)", sku: "SMSG-A54-128" },
      },
    ],
  },
  {
    id: "sale-elec-102",
    shopId: MOCK_IDS.secondShop,
    customerId: "cust-elec-001",
    totalAmount: "9050.00",
    subtotal: "9050.00",
    discountAmount: "0.00",
    taxAmount: "0.00",
    paymentMethod: "TELEBIRR",
    status: "COMPLETED",
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    items: [
      {
        id: "item-elec-2",
        productId: "prod-anker-charger",
        quantity: 1,
        unitPrice: "1850.00",
        subtotal: "1850.00",
        product: { id: "prod-anker-charger", name: "Anker 45W USB-C Fast Charger", sku: "ANK-CHG-45W" },
      },
      {
        id: "item-elec-3",
        productId: "prod-sony-earbuds",
        quantity: 1,
        unitPrice: "7200.00",
        subtotal: "7200.00",
        product: { id: "prod-sony-earbuds", name: "Sony WF-C500 Wireless Earbuds", sku: "SNY-EAR-C500" },
      },
    ],
  },
];

export type MockStore = {
  users: User[];
  shops: Shop[];
  categories: Category[];
  suppliers: Supplier[];
  products: Product[];
  productPurchases: ProductPurchase[];
  productAdjustments: ProductAdjustment[];
  productHistory: ProductHistory[];
  customers: Customer[];
  debts: Debt[];
  expenses: Expense[];
  sales: Sale[];
  orders: OrderRecord[];
  teamMembers: TeamMember[];
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
    productPurchases: structuredClone(seedProductPurchases),
    productAdjustments: structuredClone(seedProductAdjustments),
    productHistory: structuredClone(seedProductHistory),
    customers: structuredClone(seedCustomers),
    debts: structuredClone(seedDebts),
    expenses: structuredClone(seedExpenses),
    sales: structuredClone(seedSales),
    orders: structuredClone(seedOrders),
    teamMembers: structuredClone(seedTeamMembers),
    resetTokens: {},
    passwords: {
      "owner@demo.com": "demo1234",
      "admin@demo.com": "demo1234",
      "sales@demo.com": "demo1234",
    },
  };
}


