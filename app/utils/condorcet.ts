export type CondorcetChoiceMeta = {
  key: number;
  label: string;
};

export type CondorcetVoter = {
  vote: number[];
  mandat: number;
  syndicat?: string;
};

export type CondorcetChoix = {
  choix: { vote: number[]; mandat: number }[];
  syndicat: { nom: string };
};

export function sumCondorcetVotes(choix: CondorcetChoix[]): CondorcetVoter[] {
  const votes: CondorcetVoter[] = [];
  for (const c of choix) {
    for (const v of c.choix) {
      votes.push({ vote: v.vote, mandat: v.mandat, syndicat: c.syndicat.nom });
    }
  }
  return votes;
}

export function mergeDuplicateRankings(
  votes: CondorcetVoter[],
): { vote: number[]; mandat: number }[] {
  return votes.reduce(
    (acc, item) => {
      const existing = acc.find(
        (x) => JSON.stringify(x.vote) === JSON.stringify(item.vote),
      );
      if (existing) {
        existing.mandat += item.mandat;
      } else {
        acc.push({ vote: item.vote, mandat: item.mandat });
      }
      return acc;
    },
    [] as { vote: number[]; mandat: number }[],
  );
}

export function buildCondorcetMatrix(
  choix: CondorcetChoix[],
  choiceMeta: CondorcetChoiceMeta[],
): number[][] {
  const votesSum = mergeDuplicateRankings(sumCondorcetVotes(choix));

  const matrix: number[][] = [];
  for (const x of choiceMeta) {
    const line: number[] = [];
    for (const y of choiceMeta) {
      if (x.key === y.key) {
        line.push(0);
        continue;
      }
      let win = 0;
      for (const v of votesSum) {
        win +=
          v.vote.indexOf(x.key) < v.vote.indexOf(y.key)
            ? v.mandat
            : -v.mandat;
      }
      line.push(win);
    }
    matrix.push(line);
  }
  return matrix;
}

export function findCondorcetWinner(matrix: number[][]): number {
  return matrix.findIndex((line) =>
    line.every((value) => value === 0 || value > 0),
  );
}

export function condorcetResult(
  choix: CondorcetChoix[],
  choiceMeta: CondorcetChoiceMeta[],
) {
  const allVotes = sumCondorcetVotes(choix);
  if (allVotes.length === 0) {
    return { matrix: [], winnerIndex: -1, isParadox: false, winnerLabel: null };
  }

  const matrix = buildCondorcetMatrix(choix, choiceMeta);
  const winnerIndex = findCondorcetWinner(matrix);
  const isParadox = winnerIndex === -1;
  const winnerLabel = isParadox ? null : choiceMeta[winnerIndex]?.label ?? null;

  return { matrix, winnerIndex, isParadox, winnerLabel };
}
