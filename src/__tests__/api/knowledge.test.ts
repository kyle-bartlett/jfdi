import { describe, it, expect, vi, beforeEach } from "vitest";

const mockAll = vi.fn();
const mockGet = vi.fn();
const mockRun = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    select: () => ({
      from: () => ({
        orderBy: () => ({ all: mockAll }),
        where: () => ({
          get: mockGet,
          orderBy: () => ({ all: mockAll }),
        }),
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
  knowledgeEntries: {
    id: "id",
    title: "title",
    content: "content",
    created_at: "created_at",
  },
}));

vi.mock("uuid", () => ({
  v4: () => "test-knowledge-uuid",
}));

const { GET, POST, PATCH, DELETE } = await import("@/app/api/knowledge/route");

function createRequest(options: {
  method?: string;
  body?: Record<string, unknown>;
  searchParams?: Record<string, string>;
} = {}) {
  const url = new URL("http://localhost/api/knowledge");
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

describe("Knowledge API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/knowledge", () => {
    it("returns all entries", async () => {
      const mockEntries = [
        { id: "1", title: "Entry 1", content: "Content 1" },
        { id: "2", title: "Entry 2", content: "Content 2" },
      ];
      mockAll.mockResolvedValue(mockEntries);

      const request = createRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(data).toHaveLength(2);
    });

    it("searches by title and content", async () => {
      const mockResults = [{ id: "1", title: "React Tips", content: "Use hooks" }];
      mockAll.mockResolvedValue(mockResults);

      const request = createRequest({ searchParams: { search: "react" } });
      const response = await GET(request);
      const data = await response.json();

      expect(data).toHaveLength(1);
      expect(data[0].title).toBe("React Tips");
    });
  });

  describe("POST /api/knowledge", () => {
    it("creates an entry with title", async () => {
      const created = { id: "test-knowledge-uuid", title: "New Entry" };
      mockGet.mockResolvedValue(created);

      const request = createRequest({
        method: "POST",
        body: { title: "New Entry", content: "Some content" },
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
    });

    it("returns 400 when title is missing", async () => {
      const request = createRequest({
        method: "POST",
        body: { content: "No title" },
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });
  });

  describe("PATCH /api/knowledge", () => {
    it("returns 400 without id", async () => {
      const request = createRequest({
        method: "PATCH",
        body: { title: "Updated" },
      });

      const response = await PATCH(request);
      expect(response.status).toBe(400);
    });

    it("updates entry fields", async () => {
      const updated = { id: "1", title: "Updated Title" };
      mockGet.mockResolvedValue(updated);

      const request = createRequest({
        method: "PATCH",
        searchParams: { id: "1" },
        body: { title: "Updated Title" },
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(data.title).toBe("Updated Title");
    });
  });

  describe("DELETE /api/knowledge", () => {
    it("returns 400 without id", async () => {
      const request = createRequest({ method: "DELETE" });
      const response = await DELETE(request);
      expect(response.status).toBe(400);
    });

    it("deletes an entry", async () => {
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
