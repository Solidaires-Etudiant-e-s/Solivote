export const TypeRencontre = {
  CONGRES: "CONGRES",
  CF: "CF",
  BF: "BF",
  PU: "PU",
} as const;
export type TypeRencontre = (typeof TypeRencontre)[keyof typeof TypeRencontre];

export const TypeChoix = {
  POUR: "POUR",
  CONTRE: "CONTRE",
  ABSTENTION: "ABSTENTION",
  NPPV: "NPPV",
} as const;
export type TypeChoix = (typeof TypeChoix)[keyof typeof TypeChoix];

export const TypeVote = {
  STANDARD: "STANDARD",
  EN_CONTRE: "EN_CONTRE",
  CONDORCET: "CONDORCET",
} as const;
export type TypeVote = (typeof TypeVote)[keyof typeof TypeVote];

export const StatusRencontre = {
  INITIAL: "INITIAL",
  DEMARE: "DEMARE",
  CLOTURE: "CLOTURE",
} as const;
export type StatusRencontre =
  (typeof StatusRencontre)[keyof typeof StatusRencontre];

export const StatusVote = {
  INITIAL: "INITIAL",
  EN_VOTE: "EN_VOTE",
  CLOTURE: "CLOTURE",
} as const;
export type StatusVote = (typeof StatusVote)[keyof typeof StatusVote];

export type Possibilite = {
  id: number;
  nom: string;
  voteId: number;
};

export type Vote = {
  id: number;
  date: Date | string;
  nom: string;
  type: TypeVote;
  description: string | null;
  status: StatusVote;
  choix: Choix[];
  possibilites?: Possibilite[];
};

export type Choix = {
  id: number;
  date: Date | string;
  syndicat: Syndicat;
  syndicatId?: number;
  voteId?: number;
  vote?: Vote;
  choix: Array<{ type: TypeChoix | number; mandat: number }>;
};

export type Syndicat = {
  id: number;
  nom: string;
  mandats?: Mandat[];
  defaultMandats: number;
  actif: boolean;
};

export type Mandat = {
  syndicatId: number;
  rencontreId: number;
  syndicat: Syndicat;
  rencontre: Rencontre;
  mandat: number;
};

export type Rencontre = {
  id: number;
  nom: string;
  dateDebut: Date | string;
  dateFin: Date | string;
  type: TypeRencontre;
  status: StatusRencontre;
  mandats?: Mandat[];
  votes?: Vote[];
};

export type Texte = {
  id: number;
  titre: string;
  votes: Vote[];
  rencontre?: Rencontre;
  rencontreId: number;
};
