import test from "node:test";
import assert from "node:assert/strict";
import { CATS, W, baseSub, calcMiniOvr, nano, ovr, sessao } from "../store.ts";

test("escala nano(0..20) mapeia corretamente para 50..99", () => {
  assert.equal(nano(0), 50);
  assert.equal(nano(20), 99);
});

test("pesos W das 7 categorias somam exatamente 1.00", () => {
  const sum = Object.values(W).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sum - 1) < 1e-9);
});

test("ovr(baseSub) retorna 65", () => {
  assert.equal(ovr(baseSub), 65);
});

test("calcMiniOvr e sessao calculam corretamente com mao dominante", () => {
  const arrCat = CATS.find((c) => c.k === "arr")!;
  const rPerfect: Record<string, number> = {};
  for (const c of CATS) {
    for (const [k] of c.n) rPerfect[k] = 20;
  }
  assert.equal(calcMiniOvr(arrCat.mini[0], rPerfect), 99);
  assert.equal(sessao(arrCat, rPerfect, "destro"), 99);

  const banCat = CATS.find((c) => c.k === "ban")!;
  const rAsym: Record<string, number> = { flo: 10, bd: 20, brd: 20, be: 2, bre: 2 };
  const scoreDestro = sessao(banCat, rAsym, "destro");
  const scoreCanhoto = sessao(banCat, rAsym, "canhoto");
  assert.ok(scoreDestro > scoreCanhoto);
});
