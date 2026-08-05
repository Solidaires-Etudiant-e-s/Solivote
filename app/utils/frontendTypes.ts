export type VoteChoiceEntry = { type: string | number; mandat: number };

export type VoteChoice = (Choix & {syndicat: Syndicat});

export type VotePayload = (Vote & { choix: VoteChoice[] });

export type TextePayload = (Texte & { votes: VotePayload[] });

export type RencontrePayload = Rencontre & {votes: VotePayload[]} & {mandats: Mandat[]};

export type MandatPayload = Omit<Mandat, "rencontre">;
