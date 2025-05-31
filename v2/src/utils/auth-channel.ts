import Channel from "~/utils/channel";
import { EventName } from "~/types";
import Browser from "webextension-polyfill";

const channel = new Channel();

export interface AuthStatus {
  isAuthenticated: boolean;
  userId: string | null;
  email: string | null;
  taskId: string | null;
  lastUpdated?: number;
}

const AUTH_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const AUTH_STORAGE_KEY = "auth_status_cache";

export const useAuthChannel = () => {
  const getCachedAuthStatus = async (): Promise<AuthStatus | null> => {
    try {
      const result = await Browser.storage.local.get(AUTH_STORAGE_KEY);
      const cached = result[AUTH_STORAGE_KEY] as AuthStatus | undefined;

      if (cached && cached.lastUpdated) {
        const isExpired = Date.now() - cached.lastUpdated > AUTH_CACHE_DURATION;
        if (!isExpired) {
          return cached;
        } else {
          // Remove expired cache
          await Browser.storage.local.remove(AUTH_STORAGE_KEY);
        }
      }

      return null;
    } catch (error) {
      console.error("Error getting cached auth status:", error);
      return null;
    }
  };

  const setCachedAuthStatus = async (authStatus: AuthStatus) => {
    try {
      const cacheData = {
        ...authStatus,
        lastUpdated: Date.now(),
      };
      await Browser.storage.local.set({
        [AUTH_STORAGE_KEY]: cacheData,
      });
    } catch (error) {
      console.error("Error setting cached auth status:", error);
    }
  };

  const requestAuthStatus = async (
    forceRefresh = false
  ): Promise<AuthStatus> => {
    // Check cache first if not forcing refresh
    if (!forceRefresh) {
      const cached = await getCachedAuthStatus();
      if (cached) {
        return cached;
      }
    }

    try {
      // Use service request directly instead of emit + request
      const authStatus = (await channel.request(
        "getAuthStatus",
        {}
      )) as AuthStatus;
      await setCachedAuthStatus(authStatus);
      return authStatus;
    } catch (error) {
      console.error("Error requesting auth status:", error);

      // Return fallback status
      const fallbackStatus: AuthStatus = {
        isAuthenticated: false,
        userId: null,
        email: null,
        taskId: null,
        lastUpdated: Date.now(),
      };

      await setCachedAuthStatus(fallbackStatus);
      return fallbackStatus;
    }
  };

  const onAuthStatusChange = (callback: (authStatus: AuthStatus) => void) => {
    return channel.on(EventName.AuthStatusChanged, async (data) => {
      const authStatus = data as AuthStatus;
      await setCachedAuthStatus(authStatus);
      callback(authStatus);
    });
  };

  const clearAuthCache = async () => {
    try {
      await Browser.storage.local.remove(AUTH_STORAGE_KEY);
    } catch (error) {
      console.error("Error clearing auth cache:", error);
    }
  };

  // Force refresh auth status
  const refreshAuthStatus = async (): Promise<AuthStatus> => {
    // Clear cache first
    await clearAuthCache();
    // Request fresh status
    channel.emit(EventName.AuthStatusRequested, {});
    return requestAuthStatus(true);
  };

  return {
    requestAuthStatus,
    onAuthStatusChange,
    getCachedAuthStatus,
    clearAuthCache,
    refreshAuthStatus,
  };
};
