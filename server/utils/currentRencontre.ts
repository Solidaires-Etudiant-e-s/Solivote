import {StatusRencontre} from "@prisma/client";

export async function currentRencontre() {
    return prisma.rencontre.findFirst({
        where: {
            status: StatusRencontre.DEMARE
        }
    })
}