'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useUser } from '@clerk/nextjs';
import { useAuth } from '@/contexts/AuthContext';

const STORAGE_PREFIX = 'flagswing.cart.v1:';
const GUEST_DEVICE_KEY = 'flagswing_cart_guest_id';

export type CartLineItem = {
  productId: string;
  slug: string;
  title: string;
  /** Absolute path to product detail (e.g. /flags/foo or /assets/foo) */
  pathname: string;
  quantity: number;
};

function getOrCreateGuestDeviceId(): string {
  try {
    const existing = localStorage.getItem(GUEST_DEVICE_KEY);
    if (existing && existing.length > 8) return existing;
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
    localStorage.setItem(GUEST_DEVICE_KEY, id);
    return id;
  } catch {
    return `anon-${Math.random().toString(36).slice(2)}`;
  }
}

function parseCart(raw: string | null): CartLineItem[] {
  if (!raw) return [];
  try {
    const j = JSON.parse(raw) as { lines?: CartLineItem[] };
    const lines = Array.isArray(j.lines) ? j.lines : [];
    return lines.filter((l) => typeof l.productId === 'string' && l.productId.trim() !== '');
  } catch {
    return [];
  }
}

function readStorage(key: string): CartLineItem[] {
  try {
    return parseCart(localStorage.getItem(STORAGE_PREFIX + key));
  } catch {
    return [];
  }
}

function writeStorage(key: string, lines: CartLineItem[]) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify({ lines }));
    window.dispatchEvent(new Event('flagswing-cart'));
  } catch {
    // quota / privacy mode
  }
}

/** Merge extras into combined lines (sum quantities per productId). */
function mergeCartLines(primary: CartLineItem[], extras: CartLineItem[]): CartLineItem[] {
  const map = new Map<string, CartLineItem>();
  for (const l of [...primary, ...extras]) {
    const id = l.productId;
    const cur = map.get(id);
    const qAdd = Math.max(1, l.quantity || 1);
    if (!cur)
      map.set(id, {
        ...l,
        quantity: qAdd,
        pathname: (l.pathname || `/flags/${l.slug}`).trim(),
      });
    else
      map.set(id, {
        ...cur,
        quantity: Math.max(1, cur.quantity + qAdd),
        title: cur.title || l.title,
        pathname: cur.pathname || l.pathname,
        slug: cur.slug || l.slug,
      });
  }
  return [...map.values()];
}

/** Move guest-cart lines into a signed-in bucket once, then clear guest bucket lines. */
function mergeGuestIntoIfNeeded(guestStorageKey: string | undefined | null, targetKey: string) {
  if (!guestStorageKey || guestStorageKey === targetKey || !guestStorageKey.startsWith('guest:')) return;
  if (!(targetKey.startsWith('clerk:') || targetKey.startsWith('legacy:'))) return;

  const fromGuest = readStorage(guestStorageKey);
  if (!fromGuest.length) return;

  const intoUser = readStorage(targetKey);
  writeStorage(targetKey, mergeCartLines(intoUser, fromGuest));
  writeStorage(guestStorageKey, []);
}

type CartCtx = {
  ready: boolean;
  lines: CartLineItem[];
  totalItems: number;
  lineCount: number;
  storageKey: string | null;
  addProduct: (item: Omit<CartLineItem, 'quantity'> & { quantity?: number }) => void;
  removeProduct: (productId: string) => void;
  setQuantity: (productId: string, qty: number) => void;
  clear: () => void;
};

const noop = () => {};

const EMPTY_CTX: CartCtx = {
  ready: false,
  lines: [],
  totalItems: 0,
  lineCount: 0,
  storageKey: null,
  addProduct: noop,
  removeProduct: noop,
  setQuantity: noop,
  clear: noop,
};

const CartContext = createContext<CartCtx>(EMPTY_CTX);

/** Must render only inside ClerkProvider when Clerk is enabled */
function ClerkCartHydrationBridge({
  guestKey,
  children,
}: {
  guestKey: string;
  children: (args: { storageKeyReady: boolean; storageKey: string }) => ReactNode;
}) {
  const { user, isLoaded } = useUser();
  const legacy = useAuth().user;

  if (!guestKey) {
    return <>{children({ storageKeyReady: false, storageKey: '' })}</>;
  }

  /** Until Clerk loads, persist under the anonymous guest bucket; merge upward after sign-in. */
  if (!isLoaded) {
    return <>{children({ storageKeyReady: true, storageKey: guestKey })}</>;
  }

  if (user?.id) return <>{children({ storageKeyReady: true, storageKey: `clerk:${user.id}` })}</>;

  if (legacy?.id) return <>{children({ storageKeyReady: true, storageKey: `legacy:${legacy.id}` })}</>;

  return <>{children({ storageKeyReady: true, storageKey: guestKey })}</>;
}

/** When Clerk UI is disabled, map legacy session or anonymous guest bucket */
function PlainCartHydrationBridge({
  guestKey,
  children,
}: {
  guestKey: string;
  children: (args: { storageKeyReady: boolean; storageKey: string }) => ReactNode;
}) {
  const legacy = useAuth().user;
  if (!guestKey) return <>{children({ storageKeyReady: false, storageKey: '' })}</>;
  const key = legacy?.id ? `legacy:${legacy.id}` : guestKey;
  return <>{children({ storageKeyReady: true, storageKey: key })}</>;
}

export function CartProvider({
  clerkUiEnabled,
  children,
}: {
  clerkUiEnabled: boolean;
  children: ReactNode;
}) {
  const [guestKey, setGuestKey] = useState('');
  useEffect(() => {
    setGuestKey(`guest:${getOrCreateGuestDeviceId()}`);
  }, []);

  const Bridge = clerkUiEnabled ? ClerkCartHydrationBridge : PlainCartHydrationBridge;

  return (
    <Bridge guestKey={guestKey}>
      {({ storageKeyReady, storageKey }) => (
        <CartSyncedStore guestStableKey={guestKey} resolvedKey={storageKeyReady ? storageKey : null}>
          {children}
        </CartSyncedStore>
      )}
    </Bridge>
  );
}

function CartSyncedStore({
  resolvedKey,
  guestStableKey,
  children,
}: {
  resolvedKey: string | null;
  guestStableKey: string;
  children: ReactNode;
}) {
  const resolvedKeyRef = useRef<string | null>(null);
  const [lines, setLines] = useState<CartLineItem[]>([]);

  /* Attach storage key & merge anonymous guest bucket into Clerk / legacy carts once signed in */
  useEffect(() => {
    if (!guestStableKey || !resolvedKey) return;

    if (resolvedKey.startsWith('clerk:') || resolvedKey.startsWith('legacy:')) {
      mergeGuestIntoIfNeeded(guestStableKey, resolvedKey);
    }

    resolvedKeyRef.current = resolvedKey;
    setLines(readStorage(resolvedKey));

    function onEvt() {
      const k = resolvedKeyRef.current;
      if (k) setLines(readStorage(k));
    }
    window.addEventListener('flagswing-cart', onEvt);
    window.addEventListener('storage', onEvt);
    return () => {
      window.removeEventListener('flagswing-cart', onEvt);
      window.removeEventListener('storage', onEvt);
    };
  }, [resolvedKey, guestStableKey]);

  const persistLines = useCallback((nextKey: string, nextRows: CartLineItem[]) => {
    const normalized = mergeCartLines([], nextRows);
    writeStorage(nextKey, normalized);
    setLines(normalized);
  }, []);

  const addProduct = useCallback(
    (item: Omit<CartLineItem, 'quantity'> & { quantity?: number }) => {
      if (!resolvedKey) return;
      const qty = Math.max(1, item.quantity ?? 1);
      const pathname = item.pathname.trim() || `/flags/${item.slug}`;
      const base = { ...item, pathname, quantity: qty };

      let merged: CartLineItem[];
      const hit = lines.find((l) => l.productId === base.productId);
      if (hit) merged = lines.map((l) => (l.productId === base.productId ? { ...l, quantity: l.quantity + qty } : l));
      else merged = [...lines, base];
      persistLines(resolvedKey, merged);
    },
    [lines, persistLines, resolvedKey],
  );

  const removeProduct = useCallback(
    (productId: string) => {
      if (!resolvedKey) return;
      persistLines(
        resolvedKey,
        lines.filter((l) => l.productId !== productId),
      );
    },
    [lines, persistLines, resolvedKey],
  );

  const setQuantity = useCallback(
    (productId: string, qty: number) => {
      if (!resolvedKey) return;
      if (qty <= 0)
        persistLines(
          resolvedKey,
          lines.filter((l) => l.productId !== productId),
        );
      else persistLines(resolvedKey, lines.map((l) => (l.productId === productId ? { ...l, quantity: qty } : l)));
    },
    [lines, persistLines, resolvedKey],
  );

  const clear = useCallback(() => {
    if (!resolvedKey) return;
    persistLines(resolvedKey, []);
  }, [persistLines, resolvedKey]);

  const totalItems = useMemo(() => lines.reduce((acc, l) => acc + Math.max(1, l.quantity), 0), [lines]);

  const value = useMemo<CartCtx>(() => {
    if (!resolvedKey) {
      return { ...EMPTY_CTX, ready: false };
    }
    return {
      ready: true,
      lines,
      totalItems,
      lineCount: lines.length,
      storageKey: resolvedKey,
      addProduct,
      removeProduct,
      setQuantity,
      clear,
    };
  }, [resolvedKey, lines, totalItems, addProduct, removeProduct, setQuantity, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
