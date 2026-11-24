/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SubscriptionStatus = 'Active' | 'Cancelled' | 'Paused' | 'Inactive';
export type PlanTier = 'Standard' | 'Bundle' | string;
export type Destination = 'India' | 'International';

export interface Subscriber {
  email: string;
  shipping_address: string;
  subscription_status: SubscriptionStatus;
  plan_tier: PlanTier;
  destination?: Destination;
  cancellation_reason?: string;
  createdAt: string;
  payment_deadline?: string;
  active_until?: string;
}

export interface Region {
  region_id: string;
  region_name: string;
  lore_content: string;
  assets_url: string;
}

export interface AccessLog {
  id?: string;
  email: string;
  region_id: string;
  granted_at: string;
}

export interface MagicToken {
  token: string;
  email: string;
  expires_at: string;
  used: boolean;
}

export interface UserSession {
  authenticated?: boolean;
  email: string;
  subscriber: Subscriber | null;
  unlocked_regions: string[];
}

export interface OrderLineItem {
  productId: string;
  name: string;
  quantity: number;
  priceFormatted: string;
  isSubscription?: boolean;
  image?: string;
}

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  email: string;
  recipientName: string;
  shipping_address: string;
  destination: Destination;
  items: OrderLineItem[];
  totalFormatted: string;
  currency: string;
  gateway: 'razorpay' | 'paypal' | string;
  status: 'Processing' | 'Dispatched' | 'Delivered' | 'Active';
  trackingNumber: string;
  createdDate: string;
  createdAt?: any;
}
