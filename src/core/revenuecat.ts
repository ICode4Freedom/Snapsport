import Purchases, { LOG_LEVEL } from 'react-native-purchases';

// Get this from https://app.revenuecat.com → Project → API Keys → iOS
const RC_API_KEY_IOS = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;

// Must match the entitlement identifier you create in the RevenueCat dashboard
const ENTITLEMENT_ID = 'unlock';

export function initRevenueCat() {
  Purchases.configure({ apiKey: RC_API_KEY_IOS });
  if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
}

export async function checkUnlockStatus(): Promise<boolean> {
  try {
    const info = await Purchases.getCustomerInfo();
    return !!info.entitlements.active[ENTITLEMENT_ID];
  } catch {
    return false;
  }
}

export async function purchaseUnlock(): Promise<'purchased' | 'cancelled'> {
  const offerings = await Purchases.getOfferings();
  const pkg = offerings.current?.availablePackages?.[0];
  if (!pkg) throw new Error('No offerings configured in RevenueCat dashboard.');
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return customerInfo.entitlements.active[ENTITLEMENT_ID] ? 'purchased' : 'cancelled';
  } catch (err: any) {
    if (err?.userCancelled) return 'cancelled';
    throw err;
  }
}

export async function restoreUnlock(): Promise<boolean> {
  const info = await Purchases.restorePurchases();
  return !!info.entitlements.active[ENTITLEMENT_ID];
}
