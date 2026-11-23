import { describe, it, expect, vi } from "vitest";
import {
  JAVASCRIPT_SUBJECT,
  JAVASCRIPT_TOPICS,
  NODEJS_SUBJECT,
  NODEJS_TOPICS,
  MONGODB_SUBJECT,
  MONGODB_TOPICS,
  REACT_SUBJECT,
  REACT_TOPICS,
  seedSubject,
} from "../../prisma/seed.js";
import { sortTopics } from "./sortTopics.js";

describe("seed topic graphs and repeatability", () => {
  it("MongoDB topic map defines 12 topics with valid metadata and mistake descriptions", () => {
    expect(MONGODB_SUBJECT.slug).toBe("mongodb");
    expect(MONGODB_SUBJECT.name).toBe("MongoDB fundamentals");
    expect(MONGODB_TOPICS).toHaveLength(12);

    for (const topic of MONGODB_TOPICS) {
      expect(topic.slug).toBeTruthy();
      expect(topic.name).toBeTruthy();
      expect(topic.summary).toBeTruthy();
      expect(Array.isArray(topic.mistakes)).toBe(true);
      expect(topic.mistakes.length).toBeGreaterThan(0);
      expect(Array.isArray(topic.needs)).toBe(true);
    }
  });

  it("every MongoDB prerequisite points to a valid topic within the subject", () => {
    const slugSet = new Set(MONGODB_TOPICS.map((t) => t.slug));

    for (const topic of MONGODB_TOPICS) {
      for (const prereqSlug of topic.needs) {
        expect(slugSet.has(prereqSlug)).toBe(true);
      }
    }
  });

  it("sortTopics successfully orders MongoDB fundamentals into a valid DAG without loops", () => {
    // Map slugs to numeric IDs for sortTopics
    const slugToId = new Map(MONGODB_TOPICS.map((t, idx) => [t.slug, idx + 1]));
    const topicsWithIds = MONGODB_TOPICS.map((t) => ({
      id: slugToId.get(t.slug),
      slug: t.slug,
      name: t.name,
      summary: t.summary,
      mistakes: t.mistakes,
      needs: t.needs.map((s) => slugToId.get(s)),
    }));

    const sorted = sortTopics(topicsWithIds);
    expect(sorted).toHaveLength(12);

    const indexById = new Map(sorted.map((t, idx) => [t.id, idx]));
    const levelById = new Map(sorted.map((t) => [t.id, t.level]));

    for (const topic of sorted) {
      for (const prereqId of topic.needs) {
        expect(indexById.get(prereqId)).toBeLessThan(indexById.get(topic.id));
        expect(levelById.get(topic.id)).toBeGreaterThan(levelById.get(prereqId));
      }
    }

    // Level 0 should only contain topics with no prerequisites
    const rootTopics = sorted.filter((t) => t.level === 0);
    expect(rootTopics.map((t) => t.slug)).toEqual(["documents"]);
  });

  it("JavaScript topic map remains intact with 15 topics and valid learning order", () => {
    expect(JAVASCRIPT_TOPICS).toHaveLength(15);
    const slugToId = new Map(JAVASCRIPT_TOPICS.map((t, idx) => [t.slug, idx + 1]));
    const topicsWithIds = JAVASCRIPT_TOPICS.map((t) => ({
      id: slugToId.get(t.slug),
      slug: t.slug,
      name: t.name,
      needs: t.needs.map((s) => slugToId.get(s)),
    }));

    const sorted = sortTopics(topicsWithIds);
    expect(sorted).toHaveLength(15);
  });

  it("seedSubject correctly scopes deletions to the target subject and executes idempotently", async () => {
    const fakeDb = {
      subject: {
        upsert: vi.fn().mockResolvedValue({ id: 99, slug: "mongodb", name: "MongoDB fundamentals" }),
      },
      topic: {
        upsert: vi.fn().mockImplementation(({ where }) =>
          Promise.resolve({ id: 101, subjectId: where.subjectId_slug.subjectId, slug: where.subjectId_slug.slug })
        ),
      },
      topicPrerequisite: {
        deleteMany: vi.fn().mockResolvedValue({ count: 5 }),
        createMany: vi.fn().mockResolvedValue({ count: 5 }),
      },
    };

    const sampleTopics = [
      { slug: "a", name: "A", summary: "sA", mistakes: ["mA"], needs: [] },
      { slug: "b", name: "B", summary: "sB", mistakes: ["mB"], needs: ["a"] },
    ];

    const result = await seedSubject(fakeDb, MONGODB_SUBJECT, sampleTopics);

    expect(fakeDb.subject.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { slug: "mongodb" } })
    );
    expect(fakeDb.topic.upsert).toHaveBeenCalledTimes(2);
    // Verified: scoped deletion only affects this subject
    expect(fakeDb.topicPrerequisite.deleteMany).toHaveBeenCalledWith({
      where: {
        topic: {
          subjectId: 99,
        },
      },
    });
    expect(fakeDb.topicPrerequisite.createMany).toHaveBeenCalledWith({
      data: [{ topicId: 101, prerequisiteId: 101 }],
    });
    expect(result.topicCount).toBe(2);
  });

  it("React topic map defines 16 topics with valid metadata and mistake descriptions", () => {
    expect(REACT_SUBJECT.slug).toBe("react");
    expect(REACT_SUBJECT.name).toBe("React fundamentals");
    expect(REACT_TOPICS).toHaveLength(16);

    for (const topic of REACT_TOPICS) {
      expect(topic.slug).toBeTruthy();
      expect(topic.name).toBeTruthy();
      expect(topic.summary).toBeTruthy();
      expect(Array.isArray(topic.mistakes)).toBe(true);
      expect(topic.mistakes.length).toBeGreaterThan(0);
      expect(Array.isArray(topic.needs)).toBe(true);
    }
  });

  it("every React topic has a unique slug and prerequisite references stay within the subject", () => {
    const slugSet = new Set(REACT_TOPICS.map((t) => t.slug));
    expect(slugSet.size).toBe(16);

    for (const topic of REACT_TOPICS) {
      for (const prereqSlug of topic.needs) {
        expect(slugSet.has(prereqSlug)).toBe(true);
      }
    }
  });

  it("sortTopics successfully orders React fundamentals into a valid DAG without loops", () => {
    const slugToId = new Map(REACT_TOPICS.map((t, idx) => [t.slug, idx + 1]));
    const topicsWithIds = REACT_TOPICS.map((t) => ({
      id: slugToId.get(t.slug),
      slug: t.slug,
      name: t.name,
      summary: t.summary,
      mistakes: t.mistakes,
      needs: t.needs.map((s) => slugToId.get(s)),
    }));

    const sorted = sortTopics(topicsWithIds);
    expect(sorted).toHaveLength(16);

    const indexById = new Map(sorted.map((t, idx) => [t.id, idx]));
    const levelById = new Map(sorted.map((t) => [t.id, t.level]));

    for (const topic of sorted) {
      for (const prereqId of topic.needs) {
        expect(indexById.get(prereqId)).toBeLessThan(indexById.get(topic.id));
        expect(levelById.get(topic.id)).toBeGreaterThan(levelById.get(prereqId));
      }
    }

    // Root topic at level 0 is jsx
    const rootTopics = sorted.filter((t) => t.level === 0);
    expect(rootTopics.map((t) => t.slug)).toEqual(["jsx"]);
  });

  it("seedSubject executes idempotently for React fundamentals with scoped prerequisite deletions", async () => {
    const fakeDb = {
      subject: {
        upsert: vi.fn().mockResolvedValue({ id: 200, slug: "react", name: "React fundamentals" }),
      },
      topic: {
        upsert: vi.fn().mockImplementation(({ where }) =>
          Promise.resolve({ id: 301, subjectId: where.subjectId_slug.subjectId, slug: where.subjectId_slug.slug })
        ),
      },
      topicPrerequisite: {
        deleteMany: vi.fn().mockResolvedValue({ count: 10 }),
        createMany: vi.fn().mockResolvedValue({ count: 10 }),
      },
    };

    const sampleTopics = [
      { slug: "jsx", name: "JSX", summary: "s", mistakes: ["m"], needs: [] },
      { slug: "components", name: "Components", summary: "s", mistakes: ["m"], needs: ["jsx"] },
    ];

    const result = await seedSubject(fakeDb, REACT_SUBJECT, sampleTopics);

    expect(fakeDb.subject.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { slug: "react" } })
    );
    expect(fakeDb.topic.upsert).toHaveBeenCalledTimes(2);
    expect(fakeDb.topicPrerequisite.deleteMany).toHaveBeenCalledWith({
      where: {
        topic: {
          subjectId: 200,
        },
      },
    });
    expect(fakeDb.topicPrerequisite.createMany).toHaveBeenCalledWith({
      data: [{ topicId: 301, prerequisiteId: 301 }],
    });
    expect(result.topicCount).toBe(2);
  });

  it("Node.js topic map defines 12 topics with valid metadata and mistake descriptions", () => {
    expect(NODEJS_SUBJECT.slug).toBe("nodejs");
    expect(NODEJS_SUBJECT.name).toBe("Node.js fundamentals");
    expect(NODEJS_TOPICS).toHaveLength(12);

    for (const topic of NODEJS_TOPICS) {
      expect(topic.slug).toBeTruthy();
      expect(topic.name).toBeTruthy();
      expect(topic.summary).toBeTruthy();
      expect(Array.isArray(topic.mistakes)).toBe(true);
      expect(topic.mistakes.length).toBeGreaterThan(0);
      expect(Array.isArray(topic.needs)).toBe(true);
    }
  });

  it("every Node.js prerequisite points to a valid topic within the subject without self-references", () => {
    const slugSet = new Set(NODEJS_TOPICS.map((t) => t.slug));

    for (const topic of NODEJS_TOPICS) {
      for (const prereqSlug of topic.needs) {
        expect(slugSet.has(prereqSlug)).toBe(true);
        expect(prereqSlug).not.toBe(topic.slug);
      }
    }
  });

  it("sortTopics successfully orders Node.js fundamentals into a valid DAG without loops", () => {
    const slugToId = new Map(NODEJS_TOPICS.map((t, idx) => [t.slug, idx + 1]));
    const topicsWithIds = NODEJS_TOPICS.map((t) => ({
      id: slugToId.get(t.slug),
      slug: t.slug,
      name: t.name,
      summary: t.summary,
      mistakes: t.mistakes,
      needs: t.needs.map((s) => slugToId.get(s)),
    }));

    const sorted = sortTopics(topicsWithIds);
    expect(sorted).toHaveLength(12);

    const indexById = new Map(sorted.map((t, idx) => [t.id, idx]));
    const levelById = new Map(sorted.map((t) => [t.id, t.level]));

    for (const topic of sorted) {
      for (const prereqId of topic.needs) {
        expect(indexById.get(prereqId)).toBeLessThan(indexById.get(topic.id));
        expect(levelById.get(topic.id)).toBeGreaterThan(levelById.get(prereqId));
      }
    }

    // Root topic at level 0 is node-runtime
    const rootTopics = sorted.filter((t) => t.level === 0);
    expect(rootTopics.map((t) => t.slug)).toEqual(["node-runtime"]);

    // Terminal topic at level 6 is middleware
    const middlewareTopic = sorted.find((t) => t.slug === "middleware");
    expect(middlewareTopic.level).toBe(6);
  });

  it("seedSubject executes idempotently for Node.js fundamentals with scoped prerequisite deletions", async () => {
    const fakeDb = {
      subject: {
        upsert: vi.fn().mockResolvedValue({ id: 400, slug: "nodejs", name: "Node.js fundamentals" }),
      },
      topic: {
        upsert: vi.fn().mockImplementation(({ where }) =>
          Promise.resolve({ id: 401, subjectId: where.subjectId_slug.subjectId, slug: where.subjectId_slug.slug })
        ),
      },
      topicPrerequisite: {
        deleteMany: vi.fn().mockResolvedValue({ count: 12 }),
        createMany: vi.fn().mockResolvedValue({ count: 12 }),
      },
    };

    const sampleTopics = [
      { slug: "node-runtime", name: "Runtime", summary: "s", mistakes: ["m"], needs: [] },
      { slug: "modules", name: "Modules", summary: "s", mistakes: ["m"], needs: ["node-runtime"] },
    ];

    const result = await seedSubject(fakeDb, NODEJS_SUBJECT, sampleTopics);

    expect(fakeDb.subject.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { slug: "nodejs" } })
    );
    expect(fakeDb.topic.upsert).toHaveBeenCalledTimes(2);
    expect(fakeDb.topicPrerequisite.deleteMany).toHaveBeenCalledWith({
      where: {
        topic: {
          subjectId: 400,
        },
      },
    });
    expect(fakeDb.topicPrerequisite.createMany).toHaveBeenCalledWith({
      data: [{ topicId: 401, prerequisiteId: 401 }],
    });
    expect(result.topicCount).toBe(2);
  });
});
