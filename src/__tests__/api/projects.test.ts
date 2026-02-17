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
  projects: {
    id: "id",
    name: "name",
  },
}));

vi.mock("uuid", () => ({
  v4: () => "test-project-uuid",
}));

const { GET, POST, PATCH, DELETE } = await import("@/app/api/projects/route");

function createRequest(options: {
  method?: string;
  body?: Record<string, unknown>;
  searchParams?: Record<string, string>;
} = {}) {
  const url = new URL("http://localhost/api/projects");
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

describe("Projects API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/projects", () => {
    it("returns all projects", async () => {
      const mockProjects = [
        { id: "1", name: "JFDI", space: "bartlett-labs", progress: 65 },
        { id: "2", name: "TuneUp", space: "bartlett-labs", progress: 30 },
      ];
      mockAll.mockResolvedValue(mockProjects);

      const response = await GET();
      const data = await response.json();

      expect(data).toHaveLength(2);
      expect(data[0].name).toBe("JFDI");
    });
  });

  describe("POST /api/projects", () => {
    it("creates a project with required fields", async () => {
      const created = {
        id: "test-project-uuid",
        name: "New Project",
        space: "personal",
        status: "active-focus",
      };
      mockGet.mockResolvedValue(created);

      const request = createRequest({
        method: "POST",
        body: { name: "New Project" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.name).toBe("New Project");
    });

    it("serializes tags as JSON", async () => {
      const created = {
        id: "test-project-uuid",
        name: "Tagged Project",
        tags: '["ai","web"]',
      };
      mockGet.mockResolvedValue(created);

      const request = createRequest({
        method: "POST",
        body: { name: "Tagged Project", tags: ["ai", "web"] },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.tags).toBe('["ai","web"]');
    });
  });

  describe("PATCH /api/projects", () => {
    it("returns 400 without id", async () => {
      const request = createRequest({
        method: "PATCH",
        body: { progress: 50 },
      });

      const response = await PATCH(request);
      expect(response.status).toBe(400);
    });

    it("updates project progress", async () => {
      const updated = { id: "1", name: "JFDI", progress: 80 };
      mockGet.mockResolvedValue(updated);

      const request = createRequest({
        method: "PATCH",
        searchParams: { id: "1" },
        body: { progress: 80 },
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(data.progress).toBe(80);
    });
  });

  describe("DELETE /api/projects", () => {
    it("returns 400 without id", async () => {
      const request = createRequest({ method: "DELETE" });
      const response = await DELETE(request);
      expect(response.status).toBe(400);
    });

    it("deletes a project", async () => {
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
