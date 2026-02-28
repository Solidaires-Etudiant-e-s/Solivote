import { currentSyndicat } from "../../../utils/currentSyndicat";

export default defineEventHandler(async (event) => {
    return currentSyndicat(event);
});
