export const API_ENDPOINTS = {
  auth: {
    login: "/auth/login",
    registerOwner: "/auth/register/owner",
    registerStaff: "/auth/register/staff",
    requestResetPassword: "/auth/request-reset-password",
    resetPassword: "/auth/reset-password",
  },
  shops: {
    list: "/shops",
    create: "/shops",
    update: (shopId: string) => `/shops/${shopId}`,
    categories: (shopId: string) => `/shops/${shopId}/categories`,
    suppliers: (shopId: string) => `/shops/${shopId}/suppliers`,
    products: (shopId: string) => `/shops/${shopId}/products`,
    lowStockProducts: (shopId: string) => `/shops/${shopId}/products/low-stock`,
    product: (shopId: string, productId: string) => `/shops/${shopId}/products/${productId}`,
  },
} as const;
