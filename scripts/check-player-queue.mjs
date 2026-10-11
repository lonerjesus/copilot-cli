/**
 * Unit checks for queueItemNext — no browser or network required.
 * Usage: node --experimental-strip-types scripts/check-player-queue.mjs
 */
import { queueItemNext } from "../src/components/player/queue.ts";

let pass = 0;
let fail = 0;
function ok(name, cond, detail = "") {
  if (cond) {
    console.log(`PASS  ${name}`);
    pass++;
  } else {
    console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
    fail++;
  }
}

const items = ["A", "B", "C", "D"].map((id) => ({ id }));
const ids = (result) => result.queue.map((item) => item.id).join("");
const a = items[0];
const b = items[1];
const c = items[2];
const d = items[3];

let result = queueItemNext(items, 1, a);
ok("move item before current after current", ids(result) === "BACD" && result.currentIndex === 0,
  `queue=${ids(result)}, index=${result.currentIndex}`);

result = queueItemNext(items, 1, d);
ok("move item after current immediately next", ids(result) === "ABDC" && result.currentIndex === 1,
  `queue=${ids(result)}, index=${result.currentIndex}`);

result = queueItemNext(items, 1, b);
ok("current item is a no-op", ids(result) === "ABCD" && result.currentIndex === 1,
  `queue=${ids(result)}, index=${result.currentIndex}`);

result = queueItemNext([a, b, c], 1, c);
ok("already-next item stays next", ids(result) === "ABC" && result.currentIndex === 1,
  `queue=${ids(result)}, index=${result.currentIndex}`);

result = queueItemNext([a, b], 0, c);
ok("new item is inserted after current", ids(result) === "ACB" && result.currentIndex === 0,
  `queue=${ids(result)}, index=${result.currentIndex}`);

result = queueItemNext([], 0, a);
ok("empty queue starts at inserted item", ids(result) === "A" && result.currentIndex === 0,
  `queue=${ids(result)}, index=${result.currentIndex}`);

console.log(`\\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
