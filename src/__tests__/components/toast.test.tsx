import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ToastProvider, useToast } from "@/components/ui/toast";

function TestComponent() {
  const { toast } = useToast();
  return (
    <div>
      <button onClick={() => toast("Success message")}>Show Success</button>
      <button onClick={() => toast("Error occurred", "error")}>Show Error</button>
      <button onClick={() => toast("Info note", "info")}>Show Info</button>
    </div>
  );
}

describe("Toast", () => {
  it("shows a toast when triggered", () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText("Show Success"));
    expect(screen.getByText("Success message")).toBeInTheDocument();
  });

  it("shows error toast with correct styling", () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText("Show Error"));
    const toast = screen.getByText("Error occurred").closest(".toast");
    expect(toast?.classList.contains("toast-error")).toBe(true);
  });

  it("removes toast when clicked", () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText("Show Success"));
    expect(screen.getByText("Success message")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("alert"));
    expect(screen.queryByText("Success message")).not.toBeInTheDocument();
  });

  it("auto-removes toast after timeout", async () => {
    vi.useFakeTimers();

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText("Show Success"));
    expect(screen.getByText("Success message")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(screen.queryByText("Success message")).not.toBeInTheDocument();

    vi.useRealTimers();
  });

  it("can show multiple toasts", () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText("Show Success"));
    fireEvent.click(screen.getByText("Show Error"));

    expect(screen.getByText("Success message")).toBeInTheDocument();
    expect(screen.getByText("Error occurred")).toBeInTheDocument();
  });
});
