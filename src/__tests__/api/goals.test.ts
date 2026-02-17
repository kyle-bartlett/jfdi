import { describe, it, expect, vi, beforeEach } from "vitest";

const mockAll = vi.fn();
const mockGet = vi.fn();
const mockRun = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    select: () => ({
      from: () => ({
        orderBy: () => ({ all: mockAll }),
        where: () => ({ get: mockGet }),
      }),
    }),
    insert: () => ({
      values: () => ({ run: mockRun }),
    }),
    update: () => ({
      set: () => ({
        where: () => ({ run: mockRun }),
      }),
    }),
    delete: () => ({
      where: () => ({ run: mockRun }),
    }),
  },
}));

vi.mock("@/lib/schema", () => ({
  goals: {
    id: "id",
    category: "category",
  },
}));

vi.mock("uuid", () => ({
  v4: () => "test-goal-uuid",
}));

const { GET, POST, PATCH, DELETE } = await import("@/app/api/goals/route");

function createRequest(options: {
  method?: string;
  body?: Record<string, unknown>;
  searchParams?: Record<string, string>;
} = {}) {
  const url = new URL("http://localhost/api/goals");
  if (options.searchParams) {
    for (const [key, value] of Object.entries(options.searchParams)) {
      url.searchParams.set(key, value);
    }
  }

  return {
    method: options.method || "GET",
    json: () => Promise.resolve(options.body || {}),
    nextUrl: url,
  } as never;
}

describe("Goals API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/goals", () => {
    it("returns all goals ordered by category", async () => {
      const mockGoals = [
        { id: "1", title: "Exercise", category: "health", current_percentage: 50, target_percentage: 100 },
        { id: "2", title: "Read books", category: "learning", current_percentage: 25, target_percentage: 100 },
      ];
      mockAll.mockResolvedValue(mockGoals);

      const response = await GET();
      const data = await response.json();

      expect(data).toHaveLength(2);
      expect(data[0].category).toBe("health");
    });
  });

  describe("POST /api/goals", () => {
    it("creates a goal with all fields", async () => {
      const created = {
        id: "test-goal-uuid",
        title: "Ship MVP",
        category: "work",
        target_percentage: 100,
        current_percentage: 30,
        period_start: "2026-01-01",
        period_end: "2026-03-31",
      };
      mockGet.mockResolvedValue(created);

      const request = createRequest({
        method: "POST",
        body: {
          title: "Ship MVP",
          category: "work",
          target_percentage: 100,
          current_percentage: 30,
          period_start: "2026-01-01",
          period_end: "2026-03-31",
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.title).toBe("Ship MVP");
      expect(data.current_percentage).toBe(30);
    });

    it("uses defaults for optional fields", async () => {
      const created = {
        id: "test-goal-uuid",
        title: "Test Goal",
        category: "personal",
        target_percentage: 100,
        current_percentage: 0,
      };
      mockGet.mockResolvedValue(created);

      const request = createRequest({
        method: "POST",
        body: { title: "Test Goal" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.category).toBe("personal");
      expect(data.target_percentage).toBe(100);
      expect(data.current_percentage).toBe(0);
    });
  });

  describe("PATCH /api/goals", () => {
    it("returns 400 without id", async () => {
      const request = createRequest({
        method: "PATCH",
        body: { current_percentage: 75 },
      });

      const response = await PATCH(request);
      expect(response.status).toBe(400);
    });

    it("updates progress", async () => {
      const updated = { id: "1", title: "Exercise", current_percentage: 75 };
      mockGet.mockResolvedValue(updated);

      const request = createRequest({
        method: "PATCH",
        searchParams: { id: "1" },
        body: { current_percentage: 75 },
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(data.current_percentage).toBe(75);
    });
  });

  describe("DELETE /api/goals", () => {
    it("returns 400 without id", async () => {
      const request = createRequest({ method: "DELETE" });
      const response = await DELETE(request);
      expect(response.status).toBe(400);
    });

    it("deletes a goal", async () => {
      const request = createRequest({
        method: "DELETE",
        searchParams: { id: "1" },
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(data.success).toBe(true);
    });
  });
});
