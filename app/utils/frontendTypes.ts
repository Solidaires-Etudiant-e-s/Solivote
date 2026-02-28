import type {
    Mandat,
    Possibilite,
    Rencontre,
    StatusVote,
    Syndicat,
    TypeVote,
} from "~/utils/backendTypes";

export type VoteChoiceEntry = { type: string | number; mandat: number };

export type VoteChoice = {
    id: number;
    date: string;
    syndicat: Syndicat;
    syndicatId?: number;
    voteId?: number;
    choix: VoteChoiceEntry[];
};

export type VotePayload = {
    id: number;
    date: string;
    nom: string;
    type: TypeVote;
    description: string | null;
    content: string;
    rencontreId: number;
    status: StatusVote;
    choix: VoteChoice[];
    possibilites?: Possibilite[];
};

export type RencontrePayload = Omit<Rencontre, "dateDebut" | "dateFin"> & {
    dateDebut: string;
    dateFin: string;
};

export type MandatPayload = Omit<Mandat, "rencontre">;
