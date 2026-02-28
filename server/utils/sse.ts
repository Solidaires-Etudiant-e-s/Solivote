const voteClients = new Set<(payload: string) => Promise<void>>();
const rencontreClients = new Set<(payload: string) => Promise<void>>();

export function registerVoteClient(send: (payload: string) => Promise<void>) {
  voteClients.add(send);
  return () => {
    voteClients.delete(send);
  };
}

export function registerRencontreClient(
  send: (payload: string) => Promise<void>,
) {
  rencontreClients.add(send);
  return () => {
    rencontreClients.delete(send);
  };
}

export async function broadcastVote(payload: string) {
  await Promise.all(
    [...voteClients].map(async (send) => {
      try {
        await send(payload);
      } catch {
        voteClients.delete(send);
      }
    }),
  );
}

export async function broadcastRencontre(payload: string) {
  await Promise.all(
    [...rencontreClients].map(async (send) => {
      try {
        await send(payload);
      } catch {
        rencontreClients.delete(send);
      }
    }),
  );
}
