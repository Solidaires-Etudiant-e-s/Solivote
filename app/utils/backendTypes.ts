import type { Possibilite } from "@prisma/client";

export enum TypeRencontre {
  CONGRES = "CONGRES",
  CF = "CF",
  BF = "BF",
  PU = "PU",
}

export enum TypeChoix {
  POUR = "POUR",
  CONTRE = "CONTRE",
  ABSTENTION = "ABSTENTION",
  NPPV = "NPPV",
}

export enum TypeVote {
  STANDARD = "STANDARD",
  EN_CONTRE = "EN_CONTRE",
  CONDORCET = "CONDORCET",
}

export enum StatusRencontre {
  INITIAL = "INITIAL",
  DEMARE = "DEMARE",
  CLOTURE = "CLOTURE",
}

export enum StatusVote {
  INITAL = "INITAL",
  EN_VOTE = "EN_VOTE",
  CLOTURE = "CLOTURE",
}

export type Vote = {
  id: number;
  date: Date;
  nom: string;
  type: string;
  description: string;
  rencontreId: number;
  status: StatusVote;
  choix: Choix[];
  possibilites: Possibilite[];
  rencontre: Rencontre;
};

export type Choix = {
  id: number;
  date: Date;
  syndicat: Syndicat;
  vote: Vote;
  choix: string; //json
};

export type Syndicat = {
  id: number;
  nom: string;
};

export type Mandat = {
  syndicat: Syndicat;
  rencontre: Rencontre;
  mandat: number;
};

export type Rencontre = {
  id: number;
  nom: string;
  dateDebut: Date;
  dateFin: Date;
  type: TypeRencontre;
  status: StatusRencontre;
  mandats: Mandat[];
  votes: Vote[];
};

export type possibilite = {
  id: number;
  nom: string;
  vote: Vote;
  voteId: number;
};
