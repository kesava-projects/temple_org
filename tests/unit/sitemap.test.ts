import { describe, it, expect, vi, beforeEach } from "vitest";
import sitemap from "@/app/sitemap";
import { prisma } from "@/lib/prisma";
import type { Event } from "@prisma/client";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    event: {
      findMany: vi.fn(),
    },
  },
}));

describe("Sitemap & SEO Generation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should generate all static temple routes and dynamic published event URLs", async () => {
    const updatedAt = new Date("2026-10-25T12:00:00Z");

    vi.spyOn(prisma.event, "findMany").mockResolvedValueOnce([
      {
        slug: "maha-shivaratri-celebrations",
        updatedAt,
      },
      {
        slug: "sri-rama-navami-kalyanotsavam",
        updatedAt,
      },
    ] as unknown as Event[]);

    const routes = await sitemap();

    const urls = routes.map((r) => r.url);

    // Static routes
    expect(urls).toContain("https://temple.org");
    expect(urls).toContain("https://temple.org/events");
    expect(urls).toContain("https://temple.org/about");
    expect(urls).toContain("https://temple.org/contact");
    expect(urls).toContain("https://temple.org/gallery");
    expect(urls).toContain("https://temple.org/privacy");
    expect(urls).toContain("https://temple.org/terms");
    expect(urls).toContain("https://temple.org/refund-policy");

    // Dynamic published event routes
    expect(urls).toContain(
      "https://temple.org/events/maha-shivaratri-celebrations"
    );
    expect(urls).toContain(
      "https://temple.org/events/sri-rama-navami-kalyanotsavam"
    );

    // Verify sitemap does not expose admin or account paths
    expect(urls.some((u) => u.includes("/admin"))).toBe(false);
    expect(urls.some((u) => u.includes("/account"))).toBe(false);
  });

  it("should return static routes gracefully if database is unreachable during build", async () => {
    vi.spyOn(prisma.event, "findMany").mockRejectedValueOnce(
      new Error("Database disconnected")
    );

    const routes = await sitemap();
    expect(routes.length).toBeGreaterThanOrEqual(8);
  });
});
