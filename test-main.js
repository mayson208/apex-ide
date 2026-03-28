"use strict";
const e = require("electron");
console.log("typeof e:", typeof e);
console.log("e is null:", e === null);
if (typeof e === 'object' && e !== null) {
  console.log("keys:", JSON.stringify(Object.keys(e)));
  console.log("app:", typeof e.app);
} else {
  console.log("e value:", String(e).slice(0, 200));
}
