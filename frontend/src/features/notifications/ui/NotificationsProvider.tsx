"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import styles from "./NotificationsProvider.module.scss";
import {
  DEFAULT_SETTINGS,
  categoryOf,
  initialNotifications,
  isImportant,
  isNotificationEvent,
  isNotificationItem,
  mergeNotification,
  notificationText,
  retainNotifications,
} from "../model/notifications";

import type {
  NotificationCategory,
  NotificationEvent,
  NotificationItem,
  NotificationSettings,
} from "../model/notifications";
import type { ReactNode } from "react";

import { useSession, updateSessionProfile } from "@/src/entities/session";
import { isRecord } from "@/src/shared/lib/validation";
import { Modal } from "@/src/shared/ui/modal";
import { useToast } from "@/src/shared/ui/toast/ToastProvider";

type State = { userId: number; items: NotificationItem[]; settings: NotificationSettings };

type Context = {
  items: NotificationItem[];
  settings: NotificationSettings;
  markRead: (id?: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  setCategory: (category: NotificationCategory, enabled: boolean) => void;
  receive: (event: NotificationEvent) => void;
};

const NotificationsContext = createContext<Context | null>(null);
const keyFor = (id: number) => `exchange.notifications.v1.${id}`;

function load(id: number): State {
  try {
    const raw = localStorage.getItem(keyFor(id));
    if (!raw) return { userId: id, items: initialNotifications(), settings: DEFAULT_SETTINGS };

    const value: unknown = JSON.parse(raw);
    if (isRecord(value) && Array.isArray(value.items) && isRecord(value.settings)) {
      const settings = { ...DEFAULT_SETTINGS };
      for (const category of Object.keys(settings) as NotificationCategory[])
        if (typeof value.settings[category] === "boolean")
          settings[category] = value.settings[category];

      return {
        userId: id,
        items: retainNotifications(value.items.filter(isNotificationItem)),
        settings,
      };
    }
  } catch {
    return { userId: id, items: [], settings: DEFAULT_SETTINGS };
  }

  return { userId: id, items: [], settings: DEFAULT_SETTINGS };
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user, ready } = useSession();
  const userId = user?.id;
  const status = user?.status;
  const { notify } = useToast();
  const [state, setState] = useState<State | null>(null);
  const stateRef = useRef(state);
  const [frozenOpen, setFrozenOpen] = useState(false);
  const lastStatus = useRef<{ id: number; status: string } | null>(null);
  const commit = useCallback((next: State) => {
    stateRef.current = next;
    setState(next);
    try {
      localStorage.setItem(keyFor(next.userId), JSON.stringify(next));
    } catch {
      return;
    }
  }, []);

  useEffect(() => {
    if (!ready) return;

    if (!userId) {
      stateRef.current = null;
      setState(null);
      setFrozenOpen(false);
      lastStatus.current = null;

      return;
    }

    commit(load(userId));
    const sync = (event: StorageEvent) => {
      if (event.key === keyFor(userId)) {
        const next = load(userId);
        stateRef.current = next;
        setState(next);
      }
    };

    const timer = window.setInterval(() => {
      const current = stateRef.current;
      if (current) commit({ ...current, items: retainNotifications(current.items) });
    }, 60_000);

    window.addEventListener("storage", sync);

    return () => {
      clearInterval(timer);
      window.removeEventListener("storage", sync);
    };
  }, [ready, userId, commit]);
  const receive = useCallback(
    (event: NotificationEvent) => {
      const current = stateRef.current;
      if (!current || !isNotificationEvent(event)) return;

      const category = categoryOf(event.type);
      if (category && !current.settings[category]) return;

      if (current.items.some((item) => item.id === event.id)) return;

      const items = mergeNotification(current.items, event);
      if (!items.some((item) => item.id === event.id)) return;

      commit({ ...current, items });
      if (event.type === "ACCOUNT_FROZEN") setFrozenOpen(true);

      if (event.type === "ACCOUNT_FROZEN" || event.type === "ACCOUNT_UNFROZEN")
        void updateSessionProfile().catch(() => undefined);

      if (
        isImportant(event.type) &&
        event.type !== "MODERATOR_WARNING" &&
        event.type !== "ACCOUNT_FROZEN"
      ) {
        const text = notificationText(items.find((item) => item.id === event.id) ?? event);
        notify({
          kind: event.type === "LOT_REJECTED" ? "error" : "success",
          title: event.type === "LOT_REJECTED" ? `! ${text.title}` : text.title,
          description: text.text,
          duration: 10000,
        });
      }
    },
    [commit, notify],
  );

  useEffect(() => {
    if (!userId || !status || state?.userId !== userId) return;

    const previous = lastStatus.current;
    if (status === "FROZEN" && (!previous || previous.id !== userId || previous.status !== status))
      setFrozenOpen(true);

    if (status !== "FROZEN") setFrozenOpen(false);

    if (
      previous?.id === userId &&
      previous.status === "FROZEN" &&
      status !== "FROZEN" &&
      !stateRef.current?.items.some(
        (item) =>
          item.type === "ACCOUNT_UNFROZEN" && Date.parse(item.createdAt) > Date.now() - 5000,
      )
    )
      receive({
        id: `unfrozen:${Date.now()}`,
        type: "ACCOUNT_UNFROZEN",
        createdAt: new Date().toISOString(),
      });

    lastStatus.current = { id: userId, status };
  }, [userId, status, state?.userId, receive]);
  useEffect(() => {
    const listener = (event: Event) => {
      if (event instanceof CustomEvent && isNotificationEvent(event.detail)) receive(event.detail);
    };

    window.addEventListener("exchange:notification", listener);

    return () => window.removeEventListener("exchange:notification", listener);
  }, [receive]);
  const mutate = useCallback(
    (change: (current: State) => State) => {
      const current = stateRef.current;
      if (current) commit(change(current));
    },
    [commit],
  );

  const value = useMemo<Context>(
    () => ({
      items: state && state.userId === userId ? state.items : [],
      settings: state?.settings ?? DEFAULT_SETTINGS,
      receive,
      markRead: (id) =>
        mutate((current) => ({
          ...current,
          items: current.items.map((item) =>
            !id || item.id === id ? { ...item, unread: false } : item,
          ),
        })),
      remove: (id) =>
        mutate((current) => ({
          ...current,
          items: current.items.filter((item) => item.id !== id),
        })),
      clear: () =>
        mutate((current) => ({
          ...current,
          items: current.items.filter(
            (item) => item.type === "MODERATOR_WARNING" && !item.acknowledged,
          ),
        })),
      setCategory: (category, enabled) =>
        mutate((current) => ({
          ...current,
          settings: { ...current.settings, [category]: enabled },
        })),
    }),
    [state, userId, receive, mutate],
  );

  const warning = value.items.find(
    (item) => item.type === "MODERATOR_WARNING" && !item.acknowledged,
  );

  const frozen = value.items.find((item) => item.type === "ACCOUNT_FROZEN");
  const frozenText = frozen
    ? notificationText(frozen).text
    : user?.frozenReason
      ? `Ваш аккаунт заморожен. Причина: ${user.frozenReason}. Для разморозки обратитесь в поддержку.`
      : "Ваш аккаунт заморожен. Для разморозки обратитесь в поддержку.";

  return (
    <NotificationsContext.Provider value={value}>
      {children}
      {warning ? (
        <Modal title="Предупреждение модератора" onClose={() => undefined} dismissable={false}>
          <p className={styles.copy}>{notificationText(warning).text}</p>
          <button
            className={styles.accept}
            type="button"
            onClick={() =>
              mutate((current) => ({
                ...current,
                items: current.items.map((item) =>
                  item.id === warning.id ? { ...item, acknowledged: true, unread: false } : item,
                ),
              }))
            }
          >
            Ознакомлен
          </button>
        </Modal>
      ) : (
        frozenOpen && (
          <Modal title="Аккаунт заморожен" onClose={() => setFrozenOpen(false)}>
            <p className={styles.copy}>{frozenText}</p>
            <button className={styles.accept} type="button" onClick={() => setFrozenOpen(false)}>
              Понятно
            </button>
          </Modal>
        )
      )}
      {status === "FROZEN" && !frozenOpen && (
        <aside className={styles.frozen} role="status">
          {frozenText}
        </aside>
      )}
    </NotificationsContext.Provider>
  );
}
export function useNotifications(): Context {
  const context = useContext(NotificationsContext);
  if (!context) throw new Error("NotificationsProvider is missing");

  return context;
}
