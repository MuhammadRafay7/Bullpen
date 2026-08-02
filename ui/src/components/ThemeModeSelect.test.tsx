// @vitest-environment jsdom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeModeSelect } from "./ThemeModeSelect";

const mockSetPreference = vi.hoisted(() => vi.fn());
const mockPreference = vi.hoisted(() => ({ value: "system" as "light" | "dark" | "system" }));

vi.mock("../context/ThemeContext", () => ({
  useTheme: () => ({
    preference: mockPreference.value,
    setPreference: mockSetPreference,
  }),
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

function radios(container: HTMLElement) {
  return Array.from(container.querySelectorAll('[role="radio"]')) as HTMLButtonElement[];
}

describe("ThemeModeSelect", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    mockPreference.value = "system";
  });

  afterEach(() => {
    container.remove();
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  async function render(node: React.ReactNode) {
    const root = createRoot(container);
    await act(async () => {
      root.render(node);
    });
    return root;
  }

  it("renders Light, Dark, and System options", async () => {
    const root = await render(<ThemeModeSelect />);

    expect(radios(container).map((r) => r.textContent)).toEqual(["Light", "Dark", "System"]);

    await act(async () => root.unmount());
  });

  it("marks the active preference as checked", async () => {
    mockPreference.value = "dark";
    const root = await render(<ThemeModeSelect />);

    const checked = radios(container).filter((r) => r.getAttribute("aria-checked") === "true");
    expect(checked).toHaveLength(1);
    expect(checked[0].textContent).toBe("Dark");

    await act(async () => root.unmount());
  });

  it("sets the preference on click, including back to system", async () => {
    mockPreference.value = "dark";
    const root = await render(<ThemeModeSelect />);

    const [light, , system] = radios(container);

    await act(async () => light.click());
    expect(mockSetPreference).toHaveBeenLastCalledWith("light");

    await act(async () => system.click());
    expect(mockSetPreference).toHaveBeenLastCalledWith("system");

    await act(async () => root.unmount());
  });

  it("calls onAfterSelect when provided", async () => {
    const onAfterSelect = vi.fn();
    const root = await render(<ThemeModeSelect onAfterSelect={onAfterSelect} />);

    await act(async () => radios(container)[0].click());
    expect(onAfterSelect).toHaveBeenCalledTimes(1);

    await act(async () => root.unmount());
  });
});
