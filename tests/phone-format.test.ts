import assert from "node:assert/strict";

import { formatRussianPhoneInput, hasValidRussianPhoneDigits } from "../lib/phone";

assert.equal(formatRussianPhoneInput(""), "");
assert.equal(formatRussianPhoneInput("7"), "+7");
assert.equal(formatRussianPhoneInput("79991234567"), "+7(999)123-45-67");
assert.equal(formatRussianPhoneInput("89991234567"), "+7(999)123-45-67");
assert.equal(formatRussianPhoneInput("+7 (999) 123-45-67"), "+7(999)123-45-67");

assert.equal(hasValidRussianPhoneDigits("79991234567"), true);
assert.equal(hasValidRussianPhoneDigits("+7(999)123-45-67"), true);
assert.equal(hasValidRussianPhoneDigits("7999123456"), false);
assert.equal(hasValidRussianPhoneDigits("799912345678"), false);

console.log("phone-format.test.ts passed");
