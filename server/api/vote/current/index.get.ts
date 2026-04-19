import { sanitizeChoix } from "../../../utils/sanitizeChoix";

export default defineEventHandler(async () => {
  const vote = await currentVote();

  if (!vote) return null;

  return vote
});
