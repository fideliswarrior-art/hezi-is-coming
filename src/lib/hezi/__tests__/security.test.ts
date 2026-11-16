import test from "node:test";
import assert from "node:assert/strict";
import { hashPassword, isPasswordHashed, verifyPassword } from "../security.ts";

test("hashPassword gera hash PBKDF2-SHA256 e verifyPassword valida", async () => {
  const hash = await hashPassword("Hezi@2026");
  assert.equal(isPasswordHashed(hash), true);
  assert.equal(await verifyPassword("Hezi@2026", hash), true);
  assert.equal(await verifyPassword("SenhaErrada", hash), false);
});

test("verifyPassword mantem compatibilidade com senha antiga em texto claro", async () => {
  assert.equal(isPasswordHashed("Hezi@2026"), false);
  assert.equal(await verifyPassword("Hezi@2026", "Hezi@2026"), true);
  assert.equal(await verifyPassword("outra", "Hezi@2026"), false);
});
