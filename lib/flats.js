export const BLOCKS = ["A","B","C","D","E","F","G","H"];

export function getFlats(block) {
  const isH = block === "H";
  const floors = isH
    ? [[1,2],[101,102],[201,202],[301,302]]
    : [[1,2,3,4],[101,102,103,104],[201,202,203,204],[301,302,303,304]];
  return floors.flat().map(n => String(n).padStart(3,"0"));
}

export const BLOCK_COLORS = {
  A:{ bg:"from-violet-600 to-purple-700",  ring:"ring-violet-400",  dot:"bg-violet-500",  text:"text-violet-700",  light:"bg-violet-50",  hex:"#7c3aed" },
  B:{ bg:"from-blue-600 to-indigo-700",    ring:"ring-blue-400",    dot:"bg-blue-500",    text:"text-blue-700",    light:"bg-blue-50",    hex:"#2563eb" },
  C:{ bg:"from-emerald-600 to-teal-700",   ring:"ring-emerald-400", dot:"bg-emerald-500", text:"text-emerald-700", light:"bg-emerald-50", hex:"#059669" },
  D:{ bg:"from-amber-500 to-orange-600",   ring:"ring-amber-400",   dot:"bg-amber-500",   text:"text-amber-700",   light:"bg-amber-50",   hex:"#d97706" },
  E:{ bg:"from-rose-600 to-red-700",       ring:"ring-rose-400",    dot:"bg-rose-500",    text:"text-rose-700",    light:"bg-rose-50",    hex:"#e11d48" },
  F:{ bg:"from-fuchsia-600 to-pink-700",   ring:"ring-fuchsia-400", dot:"bg-fuchsia-500", text:"text-fuchsia-700", light:"bg-fuchsia-50", hex:"#c026d3" },
  G:{ bg:"from-cyan-600 to-sky-700",       ring:"ring-cyan-400",    dot:"bg-cyan-500",    text:"text-cyan-700",    light:"bg-cyan-50",    hex:"#0891b2" },
  H:{ bg:"from-pink-600 to-rose-700",      ring:"ring-pink-400",    dot:"bg-pink-500",    text:"text-pink-700",    light:"bg-pink-50",    hex:"#db2777" },
};
