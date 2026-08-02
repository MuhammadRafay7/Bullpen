import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type Theme = "light" | "dark";
/**
 * What the user asked for, as opposed to what is currently rendered.
 * `system` means "keep following `prefers-color-scheme`" and is the
 * default until an explicit choice is made.
 */
export type ThemePreference = Theme | "system";

interface ThemeContextValue {
  /** The resolved mode actually applied to the document. */
  theme: Theme;
  /** The user's choice, including the `system` pass-through. */
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const THEME_STORAGE_KEY = "bullpen.theme";
const DARK_THEME_COLOR = "#18181b";
const LIGHT_THEME_COLOR = "#ffffff";
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function resolveThemeFromDocument(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

/**
 * `system` is represented by the *absence* of a stored value, which is
 * exactly what the pre-hydration script in `index.html` already treats as
 * "fall back to `prefers-color-scheme`". Choosing system therefore clears
 * the key rather than writing a third sentinel value.
 */
function readStoredPreference(): ThemePreference {
  if (typeof window === "undefined") return "system";
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : "system";
  } catch {
    return "system";
  }
}

function resolveSystemTheme(): Theme {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return resolveThemeFromDocument();
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const isDark = theme === "dark";
  const root = document.documentElement;
  root.classList.toggle("dark", isDark);
  root.style.colorScheme = isDark ? "dark" : "light";
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (themeColorMeta instanceof HTMLMetaElement) {
    themeColorMeta.setAttribute("content", isDark ? DARK_THEME_COLOR : LIGHT_THEME_COLOR);
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => resolveThemeFromDocument());
  const [preference, setPreferenceState] = useState<ThemePreference>(() => readStoredPreference());
  // When the preference is `system` the theme is derived from the OS
  // `prefers-color-scheme` and should follow OS-level changes mid-session
  // without being persisted.
  const hasExplicitChoice = preference !== "system";

  const setPreference = useCallback((nextPreference: ThemePreference) => {
    setPreferenceState(nextPreference);
    // Resolve immediately so switching back to `system` re-adopts the OS
    // mode in the same tick rather than waiting for the next OS change.
    setThemeState(nextPreference === "system" ? resolveSystemTheme() : nextPreference);
  }, []);

  const setTheme = useCallback(
    (nextTheme: Theme) => {
      setPreference(nextTheme);
    },
    [setPreference],
  );

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const next = current === "dark" ? "light" : "dark";
      setPreferenceState(next);
      return next;
    });
  }, []);

  useEffect(() => {
    applyTheme(theme);
    try {
      if (hasExplicitChoice) {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
      } else {
        // Clearing the key is what makes the choice survive a reload: the
        // bootstrap script reads "no stored value" as "follow the OS".
        localStorage.removeItem(THEME_STORAGE_KEY);
      }
    } catch {
      // Ignore local storage write failures in restricted environments.
    }
  }, [theme, hasExplicitChoice]);

  // When the user has not made an explicit choice, follow OS-level
  // `prefers-color-scheme` changes so the UI flips alongside the OS theme.
  useEffect(() => {
    if (hasExplicitChoice) return;
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event: MediaQueryListEvent) => {
      setThemeState(event.matches ? "dark" : "light");
    };
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [hasExplicitChoice]);

  const value = useMemo(
    () => ({
      theme,
      preference,
      setPreference,
      setTheme,
      toggleTheme,
    }),
    [theme, preference, setPreference, setTheme, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
