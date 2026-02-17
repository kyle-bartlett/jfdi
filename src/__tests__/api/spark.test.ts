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
  sparkEntries: {
    id: "id",
    created_at: "created_at",
  },
}));

vi.mock("uuid", () => ({
  v4: () => "test-spark-uuid",
}));

const { GET, POST, PATCH, DELETE } = await import("@/app/api/spark/route");

function createRequest(options: {
  method?: string;
  body?: Record<string, unknown>;
  searchParams?: Record<string, string>;
} = {}) {
  const url = new URL("http://localhost/api/spark");
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

describe("Spark API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/spark", () => {
    it("returns sparks in reverse order (newest first)", async () => {
      const mockSparks = [
        { id: "1", content: "Old idea", created_at: "2026-01-01" },
        { id: "2", content: "New idea", created_at: "2026-02-01" },
      ];
      mockAll.mockResolvedValue(mockSparks);

      const response = await GET();
      const data = await response.json();

      expect(data).toHaveLength(2);
      expect(data[0].content).toBe("New idea");
    });
  });

  describe("POST /api/spark", () => {
    it("creates a spark with content", async () => {
      const created = { id: "test-spark-uuid", content: "Great idea!" };
      mockGet.mockResolvedValue(created);

      const request = createRequest({
        method: "POST",
        body: { content: "Great idea!" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.content).toBe("Great idea!");
    });

    it("serializes tags and connections as JSON", async () => {
      const created = {
        id: "test-spark-uuid",
        content: "Tagged spark",
        tags: '["ai","idea"]',
        connections: '["JFDI"]',
      };
      mockGet.mockResolvedValue(created);

      const request = createRequest({
        method: "POST",
        body: {
          content: "Tagged spark",
          tags: ["ai", "idea"],
          connections: ["JFDI"],
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.tags).toBe('["ai","idea"]');
      expect(data.connections).toBe('["JFDI"]');
    });
  });

  describe("PATCH /api/spark", () => {
    it("returns 400 without id", async () => {
      const request = createRequest({
        method: "PATCH",
        body: { content: "Updated" },
      });

      const response = await PATCH(request);
      expect(response.status).toBe(400);
    });

    it("updates spark content", async () => {
      const updated = { id: "1", content: "Updated idea" };
      mockGet.mockResolvedValue(updated);

      const request = createRequest({
        method: "PATCH",
        searchParams: { id: "1" },
        body: { content: "Updated idea" },
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(data.content).toBe("Updated idea");
    });
  });

  describe("DELETE /api/spark", () => {
    it("returns 400 without id", async () => {
      const request = createRequest({ method: "DELETE" });
      const response = await DELETE(request);
      expect(response.status).toBe(400);
    });

    it("deletes a spark", async () => {
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
