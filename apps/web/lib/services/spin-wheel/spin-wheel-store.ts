import { db } from "@white-shop/db";
import type {
  SpinWheelAttemptsSettingValue,
  SpinWheelFeatureSettingValue,
  SpinWheelPrizesSettingValue,
} from "./spin-wheel.types";
import {
  SPIN_WHEEL_ATTEMPTS_SETTINGS_KEY,
  SPIN_WHEEL_FEATURE_SETTINGS_KEY,
  SPIN_WHEEL_PRIZES_SETTINGS_KEY,
} from "./spin-wheel.constants";

export function toPrizesStore(value: unknown): SpinWheelPrizesSettingValue {
  if (
    value &&
    typeof value === "object" &&
    Array.isArray((value as SpinWheelPrizesSettingValue).prizes)
  ) {
    return value as SpinWheelPrizesSettingValue;
  }
  return { prizes: [] };
}

export function toAttemptsStore(value: unknown): SpinWheelAttemptsSettingValue {
  if (
    value &&
    typeof value === "object" &&
    Array.isArray((value as SpinWheelAttemptsSettingValue).attempts)
  ) {
    return value as SpinWheelAttemptsSettingValue;
  }
  return { attempts: [] };
}

export function toFeatureStore(value: unknown): SpinWheelFeatureSettingValue {
  if (value && typeof value === "object" && "enabled" in value) {
    const raw = (value as { enabled: unknown }).enabled;
    return { enabled: typeof raw === "boolean" ? raw : true };
  }
  return { enabled: true };
}

export async function getPrizesStore(): Promise<SpinWheelPrizesSettingValue> {
  const setting = await db.settings.findUnique({
    where: { key: SPIN_WHEEL_PRIZES_SETTINGS_KEY },
    select: { value: true },
  });
  return toPrizesStore(setting?.value);
}

export async function getAttemptsStore(): Promise<SpinWheelAttemptsSettingValue> {
  const setting = await db.settings.findUnique({
    where: { key: SPIN_WHEEL_ATTEMPTS_SETTINGS_KEY },
    select: { value: true },
  });
  return toAttemptsStore(setting?.value);
}

export async function savePrizesStore(
  store: SpinWheelPrizesSettingValue
): Promise<void> {
  await db.settings.upsert({
    where: { key: SPIN_WHEEL_PRIZES_SETTINGS_KEY },
    update: { value: store, updatedAt: new Date() },
    create: {
      key: SPIN_WHEEL_PRIZES_SETTINGS_KEY,
      value: store,
      description: "Spin wheel prizes configuration",
    },
  });
}

export async function saveAttemptsStore(
  store: SpinWheelAttemptsSettingValue
): Promise<void> {
  await db.settings.upsert({
    where: { key: SPIN_WHEEL_ATTEMPTS_SETTINGS_KEY },
    update: { value: store, updatedAt: new Date() },
    create: {
      key: SPIN_WHEEL_ATTEMPTS_SETTINGS_KEY,
      value: store,
      description: "Spin wheel spin attempts history",
    },
  });
}

export async function getSpinWheelFeatureEnabled(): Promise<boolean> {
  const setting = await db.settings.findUnique({
    where: { key: SPIN_WHEEL_FEATURE_SETTINGS_KEY },
    select: { value: true },
  });
  return toFeatureStore(setting?.value).enabled;
}

export async function saveSpinWheelFeatureEnabled(enabled: boolean): Promise<void> {
  const value: SpinWheelFeatureSettingValue = { enabled };
  await db.settings.upsert({
    where: { key: SPIN_WHEEL_FEATURE_SETTINGS_KEY },
    update: { value, updatedAt: new Date() },
    create: {
      key: SPIN_WHEEL_FEATURE_SETTINGS_KEY,
      value,
      description: "Spin wheel public visibility (on/off)",
    },
  });
}
