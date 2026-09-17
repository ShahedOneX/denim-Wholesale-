export type OrderTag = 'Priority' | 'Wholesale' | 'Sample' | 'Rush' | 'Backorder';

export interface OrderRecord {
  id: string;
  date: string;
  model: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  paymentStatus: 'Full Paid' | 'Partial Adv.' | 'Due / Credit';
  deliveryStatus: 'Pending' | 'Dispatched' | 'Delivered';
  courier: string;
  logisticsNote?: string;
  tags?: OrderTag[];
}

export interface TimelinePulseItem {
  date: string;
  pcs: number;
  label: string;
  isPast: boolean;
  isReorder?: boolean;
}

export interface ActivityItem {
  date: string;
  title: string;
  desc: string;
  type: 'alert' | 'delivery' | 'order' | 'contact';
}

export interface Customer {
  id: string;
  name: string;
  ownerName: string;
  phone: string;
  secondaryPhone?: string;
  detailedAddress?: string;
  district: string;
  avatar: string;
  tier: 'VIP Customer' | 'High Value' | 'Regular Reorder' | 'At Risk' | 'Dormant';
  pipelineStatus: 'Active' | 'At Risk' | 'Dormant' | 'Lost Risk';
  ltv: number;
  totalQuantity: number;
  ordersCount: number;
  ontimePaymentRate: number;
  lastOrderDate: string;
  lastOrderAmount: number;
  lastOrderPcs: number;
  lastOrderModel: string;
  preferredModel: string;
  preferredSpecs: string;
  modelSharePercent: number;
  cycleDays: number;
  leadDays: number;
  nextExpectedOrder: string;
  nextFollowUpDate: string;
  followUpStatus: 'today' | 'tomorrow' | 'this_week' | 'overdue' | 'scheduled';
  overdueDays?: number;
  contactedToday?: boolean;
  lastContactOutcome?: 'Interested' | 'Will Order Later' | 'Ordered (Immediate)' | 'No Response' | 'Not Interested';
  timelinePulse: TimelinePulseItem[];
  orderHistory: OrderRecord[];
  activityLog: ActivityItem[];
  banglaWhatsAppTemplate: string;
}

export interface DenimModel {
  id: string;
  name: string;
  shortLabel: string;
  weight: string;
  defaultPrice: number;
  inStock: boolean;
  lotNumber: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export type ActiveTab = 'dashboard' | 'customers' | 'add-order' | 'follow-ups' | 'analytics' | 'gemini-chat';
