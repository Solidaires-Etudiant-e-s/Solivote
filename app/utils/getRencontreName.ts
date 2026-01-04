import type {Rencontre} from "@prisma/client";

export default function (rencontre: Rencontre) {
    const date = new Date(rencontre.dateDebut)
    return `${rencontre.type} de ${ new Intl.DateTimeFormat(useI18n().locale.value, { month: "long" }).format(date) } ${ date.getFullYear() }`
}