import { createEventStream } from "h3";
import { registerVoteClient } from "../../utils/sse";
import { getUser } from "../../utils/role";

export default defineEventHandler(async (event) => {
  await getUser(event);

  const eventStream = createEventStream(event);
  const send = (payload: string) =>
    eventStream.push({ event: "vote", data: payload, retry: 3000 });
  const unregister = registerVoteClient(send);

  eventStream.onClosed(async () => {
    unregister();
    await eventStream.close();
  });

  queueMicrotask(() => {
    send("connected").catch(() => {});
  });

  return eventStream.send();
});
