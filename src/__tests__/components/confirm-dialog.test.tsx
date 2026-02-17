import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

describe("ConfirmDialog", () => {
  it("renders nothing when closed", () => {
    const { container } = render(
      <ConfirmDialog open={false} onClose={() => {}} onConfirm={() => {}} />
    );
    expect(container.innerHTML).toBe("");
  });

  it("shows default title and message", () => {
    render(
      <ConfirmDialog open={true} onClose={() => {}} onConfirm={() => {}} />
    );
    expect(screen.getByText("Are you sure?")).toBeInTheDocument();
    expect(screen.getByText("This action cannot be undone.")).toBeInTheDocument();
  });

  it("shows custom title and message", () => {
    render(
      <ConfirmDialog
        open={true}
        onClose={() => {}}
        onConfirm={() => {}}
        title="Delete Goal"
        message="This goal will be permanently removed."
      />
    );
    expect(screen.getByText("Delete Goal")).toBeInTheDocument();
    expect(screen.getByText("This goal will be permanently removed.")).toBeInTheDocument();
  });

  it("calls onConfirm and onClose when confirm button is clicked", () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();

    render(
      <ConfirmDialog
        open={true}
        onClose={onClose}
        onConfirm={onConfirm}
        confirmLabel="Remove"
      />
    );

    fireEvent.click(screen.getByText("Remove"));
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when cancel button is clicked", () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();

    render(
      <ConfirmDialog open={true} onClose={onClose} onConfirm={onConfirm} />
    );

    fireEvent.click(screen.getByText("Cancel"));
    expect(onClose).toHaveBeenCalledOnce();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("uses danger button style by default", () => {
    render(
      <ConfirmDialog open={true} onClose={() => {}} onConfirm={() => {}} />
    );
    const deleteBtn = screen.getByText("Delete");
    expect(deleteBtn.classList.contains("btn-danger")).toBe(true);
  });

  it("uses primary button style when variant is primary", () => {
    render(
      <ConfirmDialog
        open={true}
        onClose={() => {}}
        onConfirm={() => {}}
        variant="primary"
        confirmLabel="Confirm"
      />
    );
    const confirmBtn = screen.getByText("Confirm");
    expect(confirmBtn.classList.contains("btn-primary")).toBe(true);
  });
});
