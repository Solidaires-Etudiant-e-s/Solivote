export const displayName = (name: string | undefined) => {
  if (!name) return "";

  if (name === "ehess") return "EHESS"

  return name.charAt(0).toUpperCase() + name.slice(1);
};
