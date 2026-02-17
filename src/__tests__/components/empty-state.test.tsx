import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EmptyState } from "@/components/ui/empty-state";

describe("EmptyState", () => {
  it("renders title", () => {
    render(<EmptyState title="No items yet" />);
    expect(screen.getByText("No items yet")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(
      <EmptyState title="No items" description="Create your first item to get started." />
    );
    expect(screen.getByText("Create your first item to get started.")).toBeInTheDocument();
  });

  it("does not render description when not provided", () => {
    const { container } = render(<EmptyState title="No items" />);
    const descriptions = container.querySelectorAll("p");
    expect(descriptions).toHaveLength(0);
  });

  it("renders default icon", () => {
    render(<EmptyState title="No items" />);
    expect(screen.getByText("📭")).toBeInTheDocument();
  });

  it("renders custom icon", () => {
    render(<EmptyState title="No items" icon="🎯" />);
    expect(screen.getByText("🎯")).toBeInTheDocument();
  });

  it("renders action button when provided", () => {
    const onClick = vi.fn();
    render(
      <EmptyState
        title="No items"
        action={{ label: "Create Item", onClick }}
      />
    );

    const button = screen.getByText("Create Item");
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("does not render action button when not provided", () => {
    render(<EmptyState title="No items" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
