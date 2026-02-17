import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database module
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
  reminders: {
    id: "id",
    due_date: "due_date",
  },
}));

vi.mock("uuid", () => ({
  v4: () => "test-uuid-123",
}));

// Import after mocks
const { GET, POST, PATCH, DELETE } = await import("@/app/api/reminders/route");

function createRequest(options: {
  method?: string;
  body?: Record<string, unknown>;
  searchParams?: Record<string, string>;
} = {}) {
  const url = new URL("http://localhost/api/reminders");
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

describe("Reminders API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/reminders", () => {
    it("returns all reminders ordered by due_date", async () => {
      const mockReminders = [
        { id: "1", title: "Test", status: "pending" },
        { id: "2", title: "Test 2", status: "pending" },
      ];
      mockAll.mockResolvedValue(mockReminders);

      const response = await GET();
      const data = await response.json();

      expect(data).toEqual(mockReminders);
      expect(response.status).toBe(200);
    });

    it("returns empty array when no reminders exist", async () => {
      mockAll.mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      expect(data).toEqual([]);
    });
  });

  describe("POST /api/reminders", () => {
    it("creates a reminder with required fields", async () => {
      const created = { id: "test-uuid-123", title: "New reminder", status: "pending" };
      mockGet.mockResolvedValue(created);

      const request = createRequest({
        method: "POST",
        body: { title: "New reminder" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.title).toBe("New reminder");
      expect(mockRun).toHaveBeenCalledOnce();
    });

    it("uses default values for optional fields", async () => {
      const created = {
        id: "test-uuid-123",
        title: "Test",
        status: "pending",
        priority: "medium",
        category: "personal",
      };
      mockGet.mockResolvedValue(created);

      const request = createRequest({
        method: "POST",
        body: { title: "Test" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.status).toBe("pending");
      expect(data.priority).toBe("medium");
      expect(data.category).toBe("personal");
    });
  });

  describe("PATCH /api/reminders", () => {
    it("returns 400 when id is missing", async () => {
      const request = createRequest({
        method: "PATCH",
        body: { title: "Updated" },
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("ID required");
    });

    it("updates a reminder", async () => {
      const updated = { id: "1", title: "Updated", status: "completed" };
      mockGet.mockResolvedValue(updated);

      const request = createRequest({
        method: "PATCH",
        searchParams: { id: "1" },
        body: { status: "completed" },
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe("completed");
      expect(mockRun).toHaveBeenCalledOnce();
    });
  });

  describe("DELETE /api/reminders", () => {
    it("returns 400 when id is missing", async () => {
      const request = createRequest({ method: "DELETE" });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("ID required");
    });

    it("deletes a reminder", async () => {
      const request = createRequest({
        method: "DELETE",
        searchParams: { id: "1" },
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockRun).toHaveBeenCalledOnce();
    });
  });
});
