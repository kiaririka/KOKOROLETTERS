/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SubscriptionStatus = 'Active' | 'Cancelled' | 'Inactive';
export type PlanTier = 'India' | 'International';

export interface Subscriber {
  email: string;
  shipping_address: string;
  subscription_status: SubscriptionStatus;
  plan_tier: PlanTier;
  createdAt: string;
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
  email: string;
  subscriber: Subscriber | null;
  unlocked_regions: string[];
}
