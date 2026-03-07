import { triggerRef, type Ref } from "vue";
import {
  patchArrayInPlace,
  patchByIdInPlace,
  sameJson,
} from "~/utils/patchInPlace";

type SyncMode = "value" | "array" | "byId";

export function usePatchedFetchState() {
  const sync = async <T>(
    target: Ref<T>,
    fetcher: () => Promise<T>,
    mode: SyncMode = "value",
  ) => {
    const next = await fetcher();

    if (target.value == null) {
      target.value = next;
      return true;
    }

    if (mode === "value") {
      if (sameJson(target.value, next)) return false;
      target.value = next;
      return true;
    }

    if (!Array.isArray(target.value) || !Array.isArray(next)) {
      target.value = next;
      return true;
    }

    if (mode === "array") {
      const changed = patchArrayInPlace(target.value, next, sameJson);
      if (changed) {
        triggerRef(target);
      }
      return changed;
    }

    if (sameJson(target.value, next)) return false;
    const changed = patchByIdInPlace(
      target.value as Array<{ id: number }>,
      next as Array<{ id: number }>,
    );
    if (changed) {
      triggerRef(target);
    }
    return changed;
  };

  return { sync };
}
