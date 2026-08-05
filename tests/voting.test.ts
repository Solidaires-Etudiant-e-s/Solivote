import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import {
  condorcetResult,
  type CondorcetChoix,
  type CondorcetChoiceMeta,
} from "../app/utils/condorcet";

const BASE = "http://localhost:3000";

const ADMIN = {}; // EMULATE_SSOWAT default = superadmin
const SYNDICAT = { headers: { debug: "1" } }; // EMULATE_SSOWAT debug=1 = bordeaux

const TEXTE_ID = 76; // existing texte in the DB

async function api<T = unknown>(
  method: string,
  path: string,
  body?: unknown,
  opts?: RequestInit,
): Promise<{ status: number; data: T }> {
  const headers: Record<string, string> = {
    ...(opts?.headers as Record<string, string>),
  };
  if (body !== undefined && method !== "GET") {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined && method !== "GET" ? JSON.stringify(body) : undefined,
    ...opts,
  });
  const text = await res.text();
  let data: unknown;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data: data as T };
}

const ENCOUNTER_ID = 26;

const stopAllVotes = () => api("POST", "/api/vote/stop", undefined, ADMIN);

const ensureEncounter = async () => {
  const { data: current } = await api<Rencontre | null>("GET", "/api/rencontre/current", undefined, ADMIN);
  if (!current?.id) {
    await api("POST", `/api/rencontre/start/${ENCOUNTER_ID}`, undefined, ADMIN);
  }
};

const getRemaining = async (): Promise<Syndicat[]> => {
  const { data } = await api<Syndicat[]>("GET", "/api/syndicat/remaining", undefined, ADMIN);
  return data;
};

const getCurrentVote = async (): Promise<VotePayload | null> => {
  const { data } = await api<VotePayload | null>("GET", "/api/vote/current", undefined, ADMIN);
  return data;
};

type VoteInput = {
  nom: string;
  type?: string;
  texteId?: number;
  possibilites?: string[];
};

const createVote = async (opts: VoteInput): Promise<VotePayload> => {
  const { data } = await api<VotePayload>("POST", "/api/vote", {
    nom: opts.nom,
    description: null,
    type: opts.type ?? "STANDARD",
    texteId: opts.texteId ?? TEXTE_ID,
    possibilites: opts.possibilites ?? [],
  }, ADMIN);
  return data;
};

const startVote = (id: number) =>
  api<Vote>("POST", `/api/vote/start/${id}`, undefined, ADMIN);

const stopVote = () => api<{ count: number }>("POST", "/api/vote/stop", undefined, ADMIN);

const castVote = async (
  choix: Array<
    { type: string | number; mandat: number }
    | { vote: number[]; mandat: number }
  >,
  syndicatName?: string,
) => {
  const syndicat = syndicatName
    ? (await api<Syndicat | null>("GET", `/api/syndicat/${syndicatName}`, undefined, ADMIN)).data
    : undefined;
  const body: { choix: typeof choix; syndicat?: Syndicat } = { choix };
  if (syndicat) body.syndicat = syndicat;
  return api("POST", "/api/vote/current", body, syndicatName ? ADMIN : SYNDICAT);
};

const toggleResults = (voteId: number) =>
  api<{ hideResults: boolean }>("POST", "/api/vote/toggle-results", { voteId }, ADMIN);

beforeAll(async () => {
  await stopAllVotes();
});

afterAll(async () => {
  await stopAllVotes();
});

beforeEach(async () => {
  await stopAllVotes();
  await ensureEncounter();
});

// ─── Vote Lifecycle ─────────────────────────────────────────────────

describe("Vote lifecycle", () => {
  it("create → start → vote → stop", async () => {
    const vote = await createVote({ nom: "Lifecycle Test" });
    expect(vote.id).toBeDefined();
    expect(vote.status).toBe("INITIAL");

    const started = await startVote(vote.id);
    expect(started.data.status).toBe("EN_VOTE");

    const current = await getCurrentVote();
    expect(current!.id).toBe(vote.id);
    expect(current!.status).toBe("EN_VOTE");

    const res = await castVote([{ type: "POUR", mandat: 1 }], "Bordeaux");
    expect(res.status).toBe(200);

    const stopped = await stopVote();
    expect(stopped.data.count).toBeGreaterThanOrEqual(1);

    const afterStop = await getCurrentVote();
    expect(afterStop).toBeFalsy();
  });
});

// ─── STANDARD Vote ──────────────────────────────────────────────────

describe("STANDARD vote", () => {
  it("allows voting POUR with correct mandats", async () => {
    const vote = await createVote({ nom: "Standard POUR" });
    await startVote(vote.id);

    const res = await castVote([{ type: "POUR", mandat: 1 }], "Bordeaux");
    expect(res.status).toBe(200);

    const current = await getCurrentVote();
    const bordeauxChoix = current!.choix.find((c) => c.syndicat.nom === "Bordeaux");
    expect(bordeauxChoix).toBeDefined();
    expect(bordeauxChoix!.choix[0].type).toBe("POUR");
    expect(bordeauxChoix!.choix[0].mandat).toBe(1);
  });

  it("allows voting CONTRE", async () => {
    const vote = await createVote({ nom: "Standard CONTRE" });
    await startVote(vote.id);

    await castVote([{ type: "CONTRE", mandat: 1 }], "Bordeaux");

    const current = await getCurrentVote();
    const choix = current!.choix.find((c) => c.syndicat.nom === "Bordeaux");
    expect(choix!.choix[0].type).toBe("CONTRE");
  });

  it("allows voting ABSTENTION", async () => {
    const vote = await createVote({ nom: "Standard ABST" });
    await startVote(vote.id);

    await castVote([{ type: "ABSTENTION", mandat: 1 }], "Bordeaux");

    const current = await getCurrentVote();
    const choix = current!.choix.find((c) => c.syndicat.nom === "Bordeaux");
    expect(choix!.choix[0].type).toBe("ABSTENTION");
  });

  it("overwrites a previous vote from the same syndicat", async () => {
    const vote = await createVote({ nom: "Overwrite test" });
    await startVote(vote.id);

    await castVote([{ type: "POUR", mandat: 1 }], "Bordeaux");
    await castVote([{ type: "CONTRE", mandat: 1 }], "Bordeaux");

    const current = await getCurrentVote();
    const choix = current!.choix.find((c) => c.syndicat.nom === "Bordeaux");
    expect(choix!.choix[0].type).toBe("CONTRE");
  });

  it("allows multiple syndicats to vote independently", async () => {
    const vote = await createVote({ nom: "Multi syndicat" });
    await startVote(vote.id);

    await castVote([{ type: "POUR", mandat: 1 }], "Bordeaux");
    await castVote([{ type: "CONTRE", mandat: 1 }], "Rennes");

    const current = await getCurrentVote();
    expect(current!.choix.length).toBe(2);
  });
});

// ─── STANDARD Panachage (mandat splitting) ─────────────────────────

describe("Panachage", () => {
  it("splits mandats evenly across two choices", async () => {
    const vote = await createVote({ nom: "Panachage even" });
    await startVote(vote.id);

    await castVote(
      [
        { type: "POUR", mandat: 1 },
        { type: "CONTRE", mandat: 1 },
      ],
      "Nantes",
    );

    const current = await getCurrentVote();
    const choix = current!.choix.find((c) => c.syndicat.nom === "Nantes");
    expect(choix!.choix.length).toBe(2);
    expect(choix!.choix.find((e) => e.type === "POUR")!.mandat).toBe(1);
    expect(choix!.choix.find((e) => e.type === "CONTRE")!.mandat).toBe(1);
  });

  it("splits mandats unevenly (2+1 for 3-mandat syndicat)", async () => {
    const vote = await createVote({ nom: "Panachage uneven" });
    await startVote(vote.id);

    await castVote(
      [
        { type: "POUR", mandat: 2 },
        { type: "CONTRE", mandat: 1 },
      ],
      "Paris",
    );

    const current = await getCurrentVote();
    const choix = current!.choix.find((c) => c.syndicat.nom === "Paris");
    expect(choix!.choix.length).toBe(2);
    expect(choix!.choix.find((e) => e.type === "POUR")!.mandat).toBe(2);
    expect(choix!.choix.find((e) => e.type === "CONTRE")!.mandat).toBe(1);
  });

  it("puts all mandats on a single choice", async () => {
    const vote = await createVote({ nom: "Panachage single" });
    await startVote(vote.id);

    await castVote([{ type: "POUR", mandat: 3 }], "Lyon");

    const current = await getCurrentVote();
    const choix = current!.choix.find((c) => c.syndicat.nom === "Lyon");
    expect(choix!.choix.length).toBe(1);
    expect(choix!.choix[0].type).toBe("POUR");
    expect(choix!.choix[0].mandat).toBe(3);
  });

  it("splits across three choices (1+1+1 for 3-mandat syndicat)", async () => {
    const vote = await createVote({ nom: "Panachage triple" });
    await startVote(vote.id);

    await castVote(
      [
        { type: "POUR", mandat: 1 },
        { type: "CONTRE", mandat: 1 },
        { type: "ABSTENTION", mandat: 1 },
      ],
      "Paris",
    );

    const current = await getCurrentVote();
    const choix = current!.choix.find((c) => c.syndicat.nom === "Paris");
    expect(choix!.choix.length).toBe(3);
    expect(choix!.choix.find((e) => e.type === "POUR")!.mandat).toBe(1);
    expect(choix!.choix.find((e) => e.type === "CONTRE")!.mandat).toBe(1);
    expect(choix!.choix.find((e) => e.type === "ABSTENTION")!.mandat).toBe(1);
  });

  it("rejects when mandat sum is too high", async () => {
    const vote = await createVote({ nom: "Bad panachage high" });
    await startVote(vote.id);

    const res = await castVote([{ type: "POUR", mandat: 99 }], "Bordeaux");
    expect(res.status).toBe(400);
  });

  it("rejects when mandat sum is too low", async () => {
    const vote = await createVote({ nom: "Bad panachage low" });
    await startVote(vote.id);

    const res = await castVote([{ type: "POUR", mandat: 0 }], "Bordeaux");
    expect(res.status).toBe(400);
  });
});

// ─── Hide Results ───────────────────────────────────────────────────

describe("Hide results", () => {
  it("toggles hideResults flag", async () => {
    const vote = await createVote({ nom: "Hide results test" });
    expect(vote.hideResults).toBe(false);

    const toggled = await toggleResults(vote.id);
    expect(toggled.data.hideResults).toBe(true);

    const toggledBack = await toggleResults(vote.id);
    expect(toggledBack.data.hideResults).toBe(false);
  });

  it("resets hideResults when vote is stopped", async () => {
    const vote = await createVote({ nom: "Reset on stop" });
    await startVote(vote.id);

    await toggleResults(vote.id);
    const mid = await getCurrentVote();
    expect(mid!.hideResults).toBe(true);

    await stopVote();

    // After stop, hideResults is reset to false.
    // Prove it by toggling again — it should go false → true.
    const result = await toggleResults(vote.id);
    expect(result.data.hideResults).toBe(true);
  });

  it("rejects non-admin toggle", async () => {
    const vote = await createVote({ nom: "Admin only toggle" });
    await startVote(vote.id);

    const res = await api("POST", "/api/vote/toggle-results", { voteId: vote.id }, SYNDICAT);
    expect(res.status).toBe(403);
  });

  it("requires voteId in body", async () => {
    const res = await api("POST", "/api/vote/toggle-results", {}, ADMIN);
    expect(res.status).toBe(400);
  });
});

// ─── Syndicats Remaining ────────────────────────────────────────────

describe("Syndicats remaining", () => {
  it("decreases as syndicats vote", async () => {
    const vote = await createVote({ nom: "Remaining test" });
    await startVote(vote.id);

    const before = await getRemaining();
    const beforeCount = before.length;
    expect(beforeCount).toBeGreaterThan(0);

    await castVote([{ type: "POUR", mandat: 1 }], "Bordeaux");

    const after = await getRemaining();
    expect(after.length).toBe(beforeCount - 1);
    expect(after.find((s) => s.nom === "Bordeaux")).toBeUndefined();
  });

  it("returns empty when all syndicats have voted", async () => {
    const vote = await createVote({ nom: "All voted" });
    await startVote(vote.id);

    const before = await getRemaining();
    for (const s of before) {
      const totalMandats = (s.mandats ?? []).reduce((sum, m) => sum + m.mandat, 0);
      await castVote([{ type: "POUR", mandat: totalMandats }], s.nom);
    }

    const remaining = await getRemaining();
    expect(remaining.length).toBe(0);
  });
});

// ─── Error Cases ────────────────────────────────────────────────────

describe("Error cases", () => {
  it("rejects vote with wrong mandat count", async () => {
    const vote = await createVote({ nom: "Wrong mandats" });
    await startVote(vote.id);

    const res = await castVote([{ type: "POUR", mandat: 99 }], "Bordeaux");
    expect(res.status).toBe(400);
  });

  it("rejects starting a vote when one is already active", async () => {
    const v1 = await createVote({ nom: "Vote A" });
    const v2 = await createVote({ nom: "Vote B" });

    await startVote(v1.id);
    const res = await startVote(v2.id);
    expect(res.status).toBe(400);
  });

  it("rejects vote with invalid choice type", async () => {
    const vote = await createVote({ nom: "Bad type" });
    await startVote(vote.id);

    const res = await castVote([{ type: "INVALID", mandat: 1 }], "Bordeaux");
    expect(res.status).toBe(400);
  });

  it("rejects creating vote without active rencontre", async () => {
    await stopAllVotes();
    await api("POST", "/api/rencontre/stop", undefined, ADMIN).catch(() => {});

    const res = await api("POST", "/api/vote", {
      nom: "No rencontre",
      description: null,
      type: "STANDARD",
      texteId: 999999,
      possibilites: [],
    }, ADMIN);
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it("rejects non-admin from creating vote", async () => {
    const res = await api("POST", "/api/vote", {
      nom: "Syndicat create",
      description: null,
      type: "STANDARD",
      texteId: TEXTE_ID,
      possibilites: [],
    }, SYNDICAT);
    expect(res.status).toBe(403);
  });

  it("rejects non-admin from starting vote", async () => {
    const vote = await createVote({ nom: "Admin start only" });
    const res = await api("POST", `/api/vote/start/${vote.id}`, undefined, SYNDICAT);
    expect(res.status).toBe(403);
  });

  it("rejects non-admin from stopping vote", async () => {
    const res = await api("POST", "/api/vote/stop", undefined, SYNDICAT);
    expect(res.status).toBe(403);
  });

  it("rejects vote for unknown syndicat name", async () => {
    const vote = await createVote({ nom: "Unknown syndicat" });
    await startVote(vote.id);

    const res = await castVote([{ type: "POUR", mandat: 1 }], "Atlantis");
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

// ─── Condorcet Vote ─────────────────────────────────────────────────

describe("CONDORCET vote", () => {
  it("creates with possibilites", async () => {
    const vote = await createVote({
      nom: "Condorcet create",
      type: "CONDORCET",
      possibilites: ["Chat", "Chien", "Poisson"],
    });
    expect(vote.type).toBe("CONDORCET");
    expect(vote.possibilites!.length).toBe(3);
    expect(vote.possibilites!.map((p) => p.nom).sort()).toEqual(["Chat", "Chien", "Poisson"]);
  });

  it("accepts a ranking vote", async () => {
    const vote = await createVote({
      nom: "Condorcet ranking",
      type: "CONDORCET",
      possibilites: ["A", "B", "C"],
    });
    await startVote(vote.id);

    const ids = vote.possibilites!.map((p) => p.id);
    const ranking = [{ vote: ids, mandat: 1 }];

    const res = await castVote(ranking, "Bordeaux");
    expect(res.status).toBe(200);

    const current = await getCurrentVote();
    const choix = current!.choix.find((c) => c.syndicat.nom === "Bordeaux");
    expect(choix).toBeDefined();
    expect(choix!.choix).toBeDefined();
  });

  it("rejects CONDORCET without possibilites", async () => {
    const res = await api("POST", "/api/vote", {
      nom: "Condorcet no possibilites",
      description: null,
      type: "CONDORCET",
      texteId: TEXTE_ID,
      possibilites: [],
    }, ADMIN);
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

// ─── Condorcet Panachage (split rankings) ──────────────────────────

describe("Condorcet Panachage", () => {
  it("splits mandats across two different rankings", async () => {
    const vote = await createVote({
      nom: "Condorcet panachage",
      type: "CONDORCET",
      possibilites: ["A", "B", "C"],
    });
    await startVote(vote.id);

    const ids = vote.possibilites!.map((p) => p.id);

    const ranking = [
      { vote: [ids[0]!, ids[1]!, ids[2]!], mandat: 2 },
      { vote: [ids[1]!, ids[2]!, ids[0]!], mandat: 1 },
    ];

    const res = await castVote(ranking, "Paris");
    expect(res.status).toBe(200);

    const current = await getCurrentVote();
    const choix = current!.choix.find((c) => c.syndicat.nom === "Paris");
    expect(choix!.choix.length).toBe(2);
    expect(choix!.choix[0].mandat).toBe(2);
    expect((choix!.choix[0] as unknown as { vote: number[] }).vote).toEqual([ids[0], ids[1], ids[2]]);
    expect(choix!.choix[1].mandat).toBe(1);
    expect((choix!.choix[1] as unknown as { vote: number[] }).vote).toEqual([ids[1], ids[2], ids[0]]);
  });

  it("splits mandats into three rankings", async () => {
    const vote = await createVote({
      nom: "Condorcet triple panachage",
      type: "CONDORCET",
      possibilites: ["X", "Y", "Z"],
    });
    await startVote(vote.id);

    const ids = vote.possibilites!.map((p) => p.id);

    const ranking = [
      { vote: [ids[0]!, ids[1]!, ids[2]!], mandat: 1 },
      { vote: [ids[1]!, ids[2]!, ids[0]!], mandat: 1 },
      { vote: [ids[2]!, ids[0]!, ids[1]!], mandat: 1 },
    ];

    const res = await castVote(ranking, "Paris");
    expect(res.status).toBe(200);

    const current = await getCurrentVote();
    const choix = current!.choix.find((c) => c.syndicat.nom === "Paris");
    expect(choix!.choix.length).toBe(3);
  });

  it("rejects when ranking mandat sum doesn't match", async () => {
    const vote = await createVote({
      nom: "Condorcet bad panachage",
      type: "CONDORCET",
      possibilites: ["A", "B", "C"],
    });
    await startVote(vote.id);

    const ids = vote.possibilites!.map((p) => p.id);
    const ranking = [{ vote: ids, mandat: 99 }];

    const res = await castVote(ranking, "Bordeaux");
    expect(res.status).toBe(400);
  });
});

// ─── Condorcet Result Calculation ──────────────────────────────────
// Uses the same shared code as Matrice.vue via ~/utils/condorcet

describe("Condorcet result calculation", () => {
  it("identifies a clear winner (A beats B and C)", async () => {
    const vote = await createVote({
      nom: "Result clear winner",
      type: "CONDORCET",
      possibilites: ["Alpha", "Beta", "Gamma"],
    });
    await startVote(vote.id);

    const ids = vote.possibilites!.map((p) => p.id);
    const [alphaId, betaId, gammaId] = ids;

    await castVote([{ vote: [alphaId, betaId, gammaId], mandat: 1 }], "Bordeaux");
    await castVote([{ vote: [alphaId, gammaId, betaId], mandat: 1 }], "Rennes");
    await castVote([{ vote: [betaId, alphaId, gammaId], mandat: 2 }], "Nantes");

    const current = await getCurrentVote();
    const choiceMeta: CondorcetChoiceMeta[] = current!.possibilites!.map((p) => ({
      key: p.id,
      label: p.nom,
    }));

    const { matrix, winnerIndex, winnerLabel } = condorcetResult(
      current!.choix as unknown as CondorcetChoix[],
      choiceMeta,
    );

    expect(winnerIndex).toBeGreaterThanOrEqual(0);
    expect(winnerLabel).toBe("Alpha");

    const alphaIdx = choiceMeta.findIndex((c) => c.label === "Alpha");
    const gammaIdx = choiceMeta.findIndex((c) => c.label === "Gamma");
    expect(matrix[alphaIdx]![gammaIdx]).toBe(4);
  });

  it("detects a Condorcet paradox (A>B>C>A cycle)", async () => {
    const vote = await createVote({
      nom: "Result paradox",
      type: "CONDORCET",
      possibilites: ["A", "B", "C"],
    });
    await startVote(vote.id);

    const ids = vote.possibilites!.map((p) => p.id);
    const [aId, bId, cId] = ids;

    await castVote(
      [
        { vote: [aId, bId, cId], mandat: 1 },
        { vote: [bId, cId, aId], mandat: 1 },
        { vote: [cId, aId, bId], mandat: 1 },
      ],
      "Paris",
    );

    const current = await getCurrentVote();
    const choiceMeta: CondorcetChoiceMeta[] = current!.possibilites!.map((p) => ({
      key: p.id,
      label: p.nom,
    }));

    const { matrix, winnerIndex, isParadox } = condorcetResult(
      current!.choix as unknown as CondorcetChoix[],
      choiceMeta,
    );

    expect(isParadox).toBe(true);
    expect(winnerIndex).toBe(-1);

    for (let i = 0; i < 3; i++) {
      const hasNegative = matrix[i]!.some((v, j) => j !== i && v < 0);
      expect(hasNegative).toBe(true);
    }
  });

  it("handles mandat-weighted voting correctly", async () => {
    const vote = await createVote({
      nom: "Result weighted",
      type: "CONDORCET",
      possibilites: ["X", "Y", "Z"],
    });
    await startVote(vote.id);

    const ids = vote.possibilites!.map((p) => p.id);
    const [xId, yId, zId] = ids;

    await castVote([{ vote: [xId, yId, zId], mandat: 1 }], "Bordeaux");
    await castVote([{ vote: [yId, zId, xId], mandat: 3 }], "Paris");

    const current = await getCurrentVote();
    const choiceMeta: CondorcetChoiceMeta[] = current!.possibilites!.map((p) => ({
      key: p.id,
      label: p.nom,
    }));

    const { matrix, winnerIndex, winnerLabel } = condorcetResult(
      current!.choix as unknown as CondorcetChoix[],
      choiceMeta,
    );

    expect(winnerIndex).toBeGreaterThanOrEqual(0);
    expect(winnerLabel).toBe("Y");

    const yIdx = choiceMeta.findIndex((c) => c.label === "Y");
    const xIdx = choiceMeta.findIndex((c) => c.label === "X");
    expect(matrix[yIdx]![xIdx]).toBe(2);
  });

  it("handles panachage in result calculation", async () => {
    const vote = await createVote({
      nom: "Result panachage",
      type: "CONDORCET",
      possibilites: ["A", "B", "C"],
    });
    await startVote(vote.id);

    const ids = vote.possibilites!.map((p) => p.id);
    const [aId, bId, cId] = ids;

    await castVote(
      [
        { vote: [aId, bId, cId], mandat: 2 },
        { vote: [bId, cId, aId], mandat: 1 },
      ],
      "Paris",
    );
    await castVote([{ vote: [cId, aId, bId], mandat: 1 }], "Rennes");

    const current = await getCurrentVote();
    const choiceMeta: CondorcetChoiceMeta[] = current!.possibilites!.map((p) => ({
      key: p.id,
      label: p.nom,
    }));

    const { winnerIndex, winnerLabel } = condorcetResult(
      current!.choix as unknown as CondorcetChoix[],
      choiceMeta,
    );

    expect(winnerIndex).toBeGreaterThanOrEqual(0);
    expect(winnerLabel).toBe("A");
  });

  it("reports matrix values correctly for equal opposing votes", async () => {
    const vote = await createVote({
      nom: "Result matrix check",
      type: "CONDORCET",
      possibilites: ["P", "Q"],
    });
    await startVote(vote.id);

    const ids = vote.possibilites!.map((p) => p.id);
    const [pId, qId] = ids;

    await castVote([{ vote: [pId, qId], mandat: 1 }], "Bordeaux");
    await castVote([{ vote: [qId, pId], mandat: 1 }], "Rennes");

    const current = await getCurrentVote();
    const choiceMeta: CondorcetChoiceMeta[] = current!.possibilites!.map((p) => ({
      key: p.id,
      label: p.nom,
    }));

    const { matrix, winnerIndex } = condorcetResult(
      current!.choix as unknown as CondorcetChoix[],
      choiceMeta,
    );

    expect(matrix[0]![0]).toBe(0);
    expect(matrix[1]![1]).toBe(0);
    expect(matrix[0]![1]).toBe(0);
    expect(matrix[1]![0]).toBe(0);

    expect(winnerIndex).toBeGreaterThanOrEqual(0);
  });
});
