import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { useTheme, type ThemePreference } from "../context/ThemeContext";

interface ThemeModeSelectProps {
  className?: string;
  /**
   * Called after the preference changes. Surfaces like a popover menu use
   * this to dismiss the menu once the user has acted.
   */
  onAfterSelect?: () => void;
}

const OPTIONS: { value: ThemePreference; label: string; icon: LucideIcon }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

/**
 * Three-way appearance control: Light / Dark / System. Unlike the binary
 * `ThemeToggle`, this can return the user to `system`, which is the only
 * state that keeps following the OS `prefers-color-scheme`.
 */
export function ThemeModeSelect({ className, onAfterSelect }: ThemeModeSelectProps) {
  const { preference, setPreference } = useTheme();

  function handleSelect(value: ThemePreference) {
    setPreference(value);
    onAfterSelect?.();
  }

  return (
    <div className={cn("rounded-xl px-3 py-3", className)}>
      <p className="text-sm font-medium text-foreground">Appearance</p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Choose a mode, or follow your system setting.
      </p>
      <div
        role="radiogroup"
        aria-label="Appearance"
        className="mt-2 flex gap-1 rounded-lg border border-border bg-background/70 p-1"
      >
        {OPTIONS.map(({ value, label, icon: Icon }) => {
          const selected = preference === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => handleSelect(value)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                selected
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
              )}
            >
              <Icon className="size-3.5" />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
