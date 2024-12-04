import { config } from "./config.mjs";
import { Log } from "./log.mjs";

// Function assert
async function assert(message, condition, element, replace) {
  if (Log.Verbose()) console.log("[Assert] ", message, condition, element != null, replace);
  if (!element) {
    if (!config.logOnce) {
      if (Log.Warn()) console.log('[Assert] Log Once: "element not found."');
      config.logOnce = true;
    }
    return;
  }
  let msg;
  if (!condition) {
    // ✅, 🟢, 🔴, 🟨, 🔴, 🟡, 🟢, ✴️, ☐, ◯, ⍰, ❓, ❔
    if (message) msg = `🔴 <span style="color: red;">${message}</span><br>`;
    else msg = `🔴`;
    if (replace) element.innerHTML = msg;
    else element.innerHTML = msg + element.innerHTML;
    if (Log.Error() && message) console.log("Assertion Failed: ", message);
  } else {
    if (message) msg = `🟢 ${message}<br>`;
    else msg = `🟢`;
    if (replace) element.innerHTML = msg;
    else element.innerHTML = msg + element.innerHTML;
  }
  if (message) console.log("[Assert] ", message, condition);
  return condition;
}

export { assert };
