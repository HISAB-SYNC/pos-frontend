import type { Area } from "./types";

// Keys for this area start with "notificationsPage." (example: "notificationsPage.title").
const en = {
  "notificationsPage.title": "Notification Center",
  "notificationsPage.subtitle":
    "Live operational alerts, low-stock warnings, product expiration notices, and system events.",
  "notificationsPage.markAllRead": "Mark all as read",
  "notificationsPage.markRead": "Mark read",
  "notificationsPage.recently": "Recently",
  "notificationsPage.readAt": "• Read at {time}",
  "notificationsPage.noun": "notifications",

  "notificationsPage.card.unread": "Unread Alerts",
  "notificationsPage.card.unreadHint": "Requires attention",
  "notificationsPage.card.critical": "Critical Alerts",
  "notificationsPage.card.criticalHint": "Out-of-stock or expired",
  "notificationsPage.card.warnings": "Warnings & Expiring",
  "notificationsPage.card.warningsHint": "Upcoming action required",

  "notificationsPage.tab.all": "All Alerts",
  "notificationsPage.tab.unread": "Unread ({count})",
  "notificationsPage.tab.read": "Read History",
  "notificationsPage.searchPlaceholder": "Search alerts...",
  "notificationsPage.allTypes": "All Types",
  "notificationsPage.allSeverities": "All Severities",
  "notificationsPage.typeSystem": "System",

  "notificationsPage.type.LOW_STOCK": "Low Stock",
  "notificationsPage.type.PRODUCT_EXPIRED": "Product Expired",
  "notificationsPage.type.PRODUCT_EXPIRING_SOON": "Expiring Soon",
  "notificationsPage.type.OVERDUE_DEBT": "Overdue Debt",
  "notificationsPage.type.PRICE_BELOW_COST": "Priced Below Cost",
  "notificationsPage.type.PENDING_OWNER_APPROVAL": "Approval Needed",
  "notificationsPage.type.SYSTEM": "System Alert",

  "notificationsPage.action.LOW_STOCK": "View Product",
  "notificationsPage.action.PRODUCT_EXPIRED": "Inspect Item",
  "notificationsPage.action.PRODUCT_EXPIRING_SOON": "Review Stock",
  "notificationsPage.action.OVERDUE_DEBT": "Open Debts",
  "notificationsPage.action.PRICE_BELOW_COST": "Fix Prices",
  "notificationsPage.action.PENDING_OWNER_APPROVAL": "Review Owner",
  "notificationsPage.action.SYSTEM": "Details",

  "notificationsPage.severity.CRITICAL": "Critical",
  "notificationsPage.severity.WARNING": "Warning",
  "notificationsPage.severity.INFO": "Info",

  "notificationsPage.empty.title": "No Notifications Found",
  "notificationsPage.empty.text": "You are all caught up! There are no alerts matching the selected filters.",
} as const;

export const notifications: Area<typeof en> = {
  en,
  am: {
    "notificationsPage.title": "የማሳወቂያ ማዕከል",
    "notificationsPage.subtitle":
      "ወቅታዊ የሥራ ማንቂያዎች፣ የክምችት መቀነስ ማስጠንቀቂያዎች፣ የምርት ማብቂያ ማሳወቂያዎች እና የሲስተም ክስተቶች።",
    "notificationsPage.markAllRead": "ሁሉንም እንደተነበበ ምልክት አድርግ",
    "notificationsPage.markRead": "እንደተነበበ አድርግ",
    "notificationsPage.recently": "በቅርቡ",
    "notificationsPage.readAt": "• በ{time} ተነበበ",
    "notificationsPage.noun": "ማሳወቂያዎች",

    "notificationsPage.card.unread": "ያልተነበቡ ማንቂያዎች",
    "notificationsPage.card.unreadHint": "ትኩረት ይፈልጋል",
    "notificationsPage.card.critical": "ወሳኝ ማንቂያዎች",
    "notificationsPage.card.criticalHint": "ያለቀ ወይም ጊዜው ያለፈ",
    "notificationsPage.card.warnings": "ማስጠንቀቂያዎችና ሊያልቁ የተቃረቡ",
    "notificationsPage.card.warningsHint": "እርምጃ ሊያስፈልግ ነው",

    "notificationsPage.tab.all": "ሁሉም ማንቂያዎች",
    "notificationsPage.tab.unread": "ያልተነበቡ ({count})",
    "notificationsPage.tab.read": "የተነበቡ",
    "notificationsPage.searchPlaceholder": "ማንቂያ ፈልግ...",
    "notificationsPage.allTypes": "ሁሉም ዓይነቶች",
    "notificationsPage.allSeverities": "ሁሉም ደረጃዎች",
    "notificationsPage.typeSystem": "ሲስተም",

    "notificationsPage.type.LOW_STOCK": "ክምችት ዝቅተኛ",
    "notificationsPage.type.PRODUCT_EXPIRED": "ምርት ጊዜው አልፏል",
    "notificationsPage.type.PRODUCT_EXPIRING_SOON": "ሊያልቅ ነው",
    "notificationsPage.type.OVERDUE_DEBT": "ጊዜው ያለፈ ዕዳ",
    "notificationsPage.type.PRICE_BELOW_COST": "ዋጋ ከግዢ በታች",
    "notificationsPage.type.PENDING_OWNER_APPROVAL": "ማረጋገጫ ያስፈልጋል",
    "notificationsPage.type.SYSTEM": "የሲስተም ማንቂያ",

    "notificationsPage.action.LOW_STOCK": "ምርቱን ይመልከቱ",
    "notificationsPage.action.PRODUCT_EXPIRED": "እቃውን ይመርምሩ",
    "notificationsPage.action.PRODUCT_EXPIRING_SOON": "ክምችት ይገምግሙ",
    "notificationsPage.action.OVERDUE_DEBT": "ዕዳዎችን ክፈት",
    "notificationsPage.action.PRICE_BELOW_COST": "ዋጋዎችን አስተካክል",
    "notificationsPage.action.PENDING_OWNER_APPROVAL": "ባለቤትን ይገምግሙ",
    "notificationsPage.action.SYSTEM": "ዝርዝር",

    "notificationsPage.severity.CRITICAL": "ወሳኝ",
    "notificationsPage.severity.WARNING": "ማስጠንቀቂያ",
    "notificationsPage.severity.INFO": "መረጃ",

    "notificationsPage.empty.title": "ምንም ማሳወቂያ አልተገኘም",
    "notificationsPage.empty.text": "ሁሉንም ጨርሰዋል! ከተመረጡት ማጣሪያዎች ጋር የሚሄድ ማንቂያ የለም።",
  },
  om: {
    "notificationsPage.title": "Giddugala Beeksisaa",
    "notificationsPage.subtitle":
      "Akeekkachiisa hojii yeroo ammaa, akeekkachiisa kuusaan xiqqaachuu, beeksisa dhumaatii meeshaa fi taateewwan sirnaa.",
    "notificationsPage.markAllRead": "Hunda akka dubbifametti mallatteessi",
    "notificationsPage.markRead": "Akka dubbifametti mallatteessi",
    "notificationsPage.recently": "Dhiyeenya",
    "notificationsPage.readAt": "• {time} dubbifame",
    "notificationsPage.noun": "beeksisawwan",

    "notificationsPage.card.unread": "Akeekkachiisa hin dubbifamne",
    "notificationsPage.card.unreadHint": "Xiyyeeffannaa barbaada",
    "notificationsPage.card.critical": "Akeekkachiisa ulfaataa",
    "notificationsPage.card.criticalHint": "Kan dhumate ykn yeroon isaa darbe",
    "notificationsPage.card.warnings": "Akeekkachiisaa fi kan dhumachuuf jiran",
    "notificationsPage.card.warningsHint": "Tarkaanfii ni barbaachisa",

    "notificationsPage.tab.all": "Akeekkachiisa hunda",
    "notificationsPage.tab.unread": "Kan hin dubbifamne ({count})",
    "notificationsPage.tab.read": "Seenaa dubbifame",
    "notificationsPage.searchPlaceholder": "Akeekkachiisa barbaadi...",
    "notificationsPage.allTypes": "Gosa hunda",
    "notificationsPage.allSeverities": "Sadarkaa hunda",
    "notificationsPage.typeSystem": "Sirna",

    "notificationsPage.type.LOW_STOCK": "Kuusaan xiqqaate",
    "notificationsPage.type.PRODUCT_EXPIRED": "Meeshaan yeroon darbe",
    "notificationsPage.type.PRODUCT_EXPIRING_SOON": "Dhumachuuf jira",
    "notificationsPage.type.OVERDUE_DEBT": "Liqii yeroon darbe",
    "notificationsPage.type.PRICE_BELOW_COST": "Gatiin bittaa gadi",
    "notificationsPage.type.PENDING_OWNER_APPROVAL": "Raggaasisni barbaachisa",
    "notificationsPage.type.SYSTEM": "Akeekkachiisa sirnaa",

    "notificationsPage.action.LOW_STOCK": "Meeshaa ilaali",
    "notificationsPage.action.PRODUCT_EXPIRED": "Meeshaa sakatta'i",
    "notificationsPage.action.PRODUCT_EXPIRING_SOON": "Kuusaa ilaali",
    "notificationsPage.action.OVERDUE_DEBT": "Liqiiwwan bani",
    "notificationsPage.action.PRICE_BELOW_COST": "Gatiiwwan sirreessi",
    "notificationsPage.action.PENDING_OWNER_APPROVAL": "Abbaa qabeenyaa ilaali",
    "notificationsPage.action.SYSTEM": "Ibsa",

    "notificationsPage.severity.CRITICAL": "Ulfaataa",
    "notificationsPage.severity.WARNING": "Akeekkachiisa",
    "notificationsPage.severity.INFO": "Odeeffannoo",

    "notificationsPage.empty.title": "Beeksisni hin argamne",
    "notificationsPage.empty.text":
      "Hundi xumurameera! Calleessa filatame wajjin wal-simu akeekkachiisni hin jiru.",
  },
};
