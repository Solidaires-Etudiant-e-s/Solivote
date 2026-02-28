import { createEventStream } from "h3";
import { registerRencontreClient } from "../../utils/sse";
import { getUser } from "../../utils/role";

export default defineEventHandler(async (event) => {
  await getUser(event);

  const eventStream = createEventStream(event);
  const send = (payload: string) =>
    eventStream.push({ event: "rencontre", data: payload, retry: 3000 });
  const unregister = registerRencontreClient(send);

  eventStream.onClosed(async () => {
    unregister();
    await eventStream.close();
  });

  queueMicrotask(() => {
    send("connected").catch(() => {});
  });

  return eventStream.send();
});
