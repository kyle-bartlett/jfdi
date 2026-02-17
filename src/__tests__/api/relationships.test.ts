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
  relationships: {
    id: "id",
    name: "name",
  },
}));

vi.mock("uuid", () => ({
  v4: () => "test-rel-uuid",
}));

const { GET, POST, PATCH, DELETE } = await import("@/app/api/relationships/route");

function createRequest(options: {
  method?: string;
  body?: Record<string, unknown>;
  searchParams?: Record<string, string>;
} = {}) {
  const url = new URL("http://localhost/api/relationships");
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

describe("Relationships API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/relationships", () => {
    it("returns all relationships", async () => {
      const mockRels = [
        { id: "1", name: "Alice", type: "professional" },
        { id: "2", name: "Bob", type: "personal" },
      ];
      mockAll.mockResolvedValue(mockRels);

      const request = createRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(data).toHaveLength(2);
    });

    it("returns a single relationship by id", async () => {
      const mockRel = { id: "1", name: "Alice", type: "professional" };
      mockGet.mockResolvedValue(mockRel);

      const request = createRequest({ searchParams: { id: "1" } });
      const response = await GET(request);
      const data = await response.json();

      expect(data.name).toBe("Alice");
    });

    it("returns 404 for non-existent relationship", async () => {
      mockGet.mockResolvedValue(undefined);

      const request = createRequest({ searchParams: { id: "nonexistent" } });
      const response = await GET(request);

      expect(response.status).toBe(404);
    });
  });

  describe("POST /api/relationships", () => {
    it("creates a relationship with name", async () => {
      const created = { id: "test-rel-uuid", name: "Charlie", type: "casual" };
      mockGet.mockResolvedValue(created);

      const request = createRequest({
        method: "POST",
        body: { name: "Charlie" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.name).toBe("Charlie");
    });

    it("returns 400 when name is missing", async () => {
      const request = createRequest({
        method: "POST",
        body: {},
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Name is required");
    });

    it("stores tags as JSON string", async () => {
      const created = {
        id: "test-rel-uuid",
        name: "Dave",
        tags: '["work","friend"]',
      };
      mockGet.mockResolvedValue(created);

      const request = createRequest({
        method: "POST",
        body: { name: "Dave", tags: ["work", "friend"] },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.tags).toBe('["work","friend"]');
    });
  });

  describe("PATCH /api/relationships", () => {
    it("returns 400 without id", async () => {
      const request = createRequest({
        method: "PATCH",
        body: { name: "Updated" },
      });

      const response = await PATCH(request);
      expect(response.status).toBe(400);
    });

    it("updates relationship fields", async () => {
      const updated = { id: "1", name: "Alice Updated", type: "close" };
      mockGet.mockResolvedValue(updated);

      const request = createRequest({
        method: "PATCH",
        searchParams: { id: "1" },
        body: { name: "Alice Updated", type: "close" },
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(data.name).toBe("Alice Updated");
      expect(data.type).toBe("close");
    });
  });

  describe("DELETE /api/relationships", () => {
    it("returns 400 without id", async () => {
      const request = createRequest({ method: "DELETE" });
      const response = await DELETE(request);
      expect(response.status).toBe(400);
    });

    it("deletes a relationship", async () => {
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
