import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FormField } from "@/components/ui/form-field";

describe("FormField", () => {
  it("renders label", () => {
    render(
      <FormField label="Email">
        <input type="email" />
      </FormField>
    );
    expect(screen.getByText("Email")).toBeInTheDocument();
  });

  it("renders children", () => {
    render(
      <FormField label="Name">
        <input type="text" placeholder="Enter name" />
      </FormField>
    );
    expect(screen.getByPlaceholderText("Enter name")).toBeInTheDocument();
  });

  it("shows required indicator", () => {
    render(
      <FormField label="Title" required>
        <input type="text" />
      </FormField>
    );
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("does not show required indicator by default", () => {
    render(
      <FormField label="Description">
        <textarea />
      </FormField>
    );
    expect(screen.queryByText("*")).not.toBeInTheDocument();
  });

  it("shows error message", () => {
    render(
      <FormField label="Email" error="Invalid email address">
        <input type="email" />
      </FormField>
    );
    expect(screen.getByText("Invalid email address")).toBeInTheDocument();
  });

  it("does not show error when not provided", () => {
    const { container } = render(
      <FormField label="Name">
        <input type="text" />
      </FormField>
    );
    expect(container.querySelector(".text-destructive")).not.toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <FormField label="Name" className="mt-4">
        <input type="text" />
      </FormField>
    );
    expect(container.firstElementChild?.classList.contains("mt-4")).toBe(true);
  });
});
