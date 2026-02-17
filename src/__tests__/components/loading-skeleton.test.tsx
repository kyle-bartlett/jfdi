import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { LoadingSkeleton, LoadingSkeletonGrid } from "@/components/ui/loading-skeleton";

describe("LoadingSkeleton", () => {
  it("renders default count of 5 items", () => {
    const { container } = render(<LoadingSkeleton />);
    const items = container.querySelectorAll(".card");
    expect(items).toHaveLength(5);
  });

  it("renders custom count", () => {
    const { container } = render(<LoadingSkeleton count={3} />);
    const items = container.querySelectorAll(".card");
    expect(items).toHaveLength(3);
  });

  it("applies custom height class", () => {
    const { container } = render(<LoadingSkeleton count={1} height="h-32" />);
    const item = container.querySelector(".card");
    expect(item?.classList.contains("h-32")).toBe(true);
  });

  it("applies animate-pulse class", () => {
    const { container } = render(<LoadingSkeleton count={1} />);
    const item = container.querySelector(".card");
    expect(item?.classList.contains("animate-pulse")).toBe(true);
  });
});

describe("LoadingSkeletonGrid", () => {
  it("renders default count of 6 items in grid", () => {
    const { container } = render(<LoadingSkeletonGrid />);
    const items = container.querySelectorAll(".card");
    expect(items).toHaveLength(6);
  });

  it("renders custom count", () => {
    const { container } = render(<LoadingSkeletonGrid count={4} />);
    const items = container.querySelectorAll(".card");
    expect(items).toHaveLength(4);
  });

  it("uses grid layout", () => {
    const { container } = render(<LoadingSkeletonGrid />);
    const grid = container.firstElementChild;
    expect(grid?.classList.contains("grid")).toBe(true);
  });
});
