import os from "node:os";

import type { ExpoConfig } from "expo/config";

const LOCAL_API_HOSTS = new Set(["localhost", "127.0.0.1", "10.0.2.2"]);

function scoreInterface(alias: string) {
  const normalized = alias.toLowerCase();

  if (
    normalized.includes("vethernet") ||
    normalized.includes("hyper-v") ||
    normalized.includes("wsl") ||
    normalized.includes("docker") ||
    normalized.includes("virtual")
  ) {
    return -5;
  }

  if (
    normalized.includes("wi-fi") ||
    normalized.includes("wifi") ||
    normalized.includes("wireless")
  ) {
    return 4;
  }

  if (normalized.includes("ethernet") || normalized.includes("en0") || normalized.includes("en1")) {
    return 3;
  }

  return 1;
}

function detectLanHost() {
  const interfaces = os.networkInterfaces();
  const candidates: Array<{ address: string; score: number }> = [];

  for (const [alias, addresses] of Object.entries(interfaces)) {
    for (const address of addresses ?? []) {
      if (address.family !== "IPv4" || address.internal) {
        continue;
      }

      if (address.address.startsWith("169.254.")) {
        continue;
      }

      candidates.push({
        address: address.address,
        score: scoreInterface(alias),
      });
    }
  }

  return candidates.sort((left, right) => right.score - left.score)[0]?.address ?? null;
}

function resolveApiBaseUrl() {
  const configured = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  const detectedLanHost = detectLanHost();

  if (!configured) {
    return detectedLanHost ? `http://${detectedLanHost}:3000` : "http://localhost:3000";
  }

  try {
    const url = new URL(configured);

    if (detectedLanHost && LOCAL_API_HOSTS.has(url.hostname)) {
      url.hostname = detectedLanHost;
    }

    return url.toString().replace(/\/$/, "");
  } catch {
    return configured;
  }
}

const config: ExpoConfig = {
  name: "Nova Forza Mobile",
  slug: "nova-forza-mobile",
  scheme: "novaforza",
  version: "1.0.0",
  orientation: "portrait",
  platforms: ["ios", "android"],
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  newArchEnabled: true,
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#fafaf5",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.digitalbitsolutions.novaforza.mobile",
  },
  android: {
    package: "com.digitalbitsolutions.novaforza.mobile",
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#fafaf5",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },
  plugins: ["expo-router", "expo-font", "expo-secure-store"],
  extra: {
    apiBaseUrl: resolveApiBaseUrl(),
    supabaseUrl:
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL ?? "",
    supabaseAnonKey:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
      "",
  },
};

export default config;
