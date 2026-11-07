import { create } from "zustand";
import { persist } from "zustand/middleware";

export const LOGO =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUAAAAFACAIAAABC8jL9AAAFEmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iWE1QIENvcmUgNS41LjAiPgogPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIgogICAgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIgogICAgeG1sbnM6ZXhpZj0iaHR0cDovL25zLmFkb2JlLmNvbS9leGlmLzEuMC8iCiAgICB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyIKICAgIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIgogICAgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIKICAgeG1wOkNyZWF0ZURhdGU9IjIwMjYtMDctMjBUMTU6MjE6MTgtMDM6MDAiCiAgIHhtcDpNb2RpZnlEYXRlPSIyMDI2LTA3LTIwVDE1OjI0OjMxLTAzOjAwIgogICB4bXA6TWV0YWRhdGFEYXRlPSIyMDI2LTA3LTIwVDE1OjI0OjMxLTAzOjAwIgogICBwaG90b3Nob3A6RGF0ZUNyZWF0ZWQ9IjIwMjYtMDctMjBUMTU6MjE6MTgtMDM6MDAiCiAgIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiCiAgIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIKICAgZXhpZjpQaXhlbFhEaW1lbnNpb249IjMyMCIKICAgZXhpZjpQaXhlbFlEaW1lbnNpb249IjMyMCIKICAgZXhpZjpDb2xvclNwYWNlPSIxIgogICB0aWZmOkltYWdlV2lkdGg9IjMyMCIKICAgdGlmZjpJbWFnZUxlbmd0aD0iMzIwIgogICB0aWZmOlJlc29sdXRpb25Vbml0PSIyIgogICB0aWZmOlhSZXNvbHV0aW9uPSIzMDAvMSIKICAgdGlmZjpZUmVzb2x1dGlvbj0iMzAwLzEiPgogICA8eG1wTU06SGlzdG9yeT4KICAgIDxyZGY6U2VxPgogICAgIDxyZGY6bGkKICAgICAgc3RFdnQ6YWN0aW9uPSJwcm9kdWNlZCIKICAgICAgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWZmaW5pdHkgMy4yLjEiCiAgICAgIHN0RXZ0OndoZW49IjIwMjYtMDctMjBUMTU6MjQ6MzEtMDM6MDAiLz4KICAgIDwvcmRmOlNlcT4KICAgPC94bXBNTTpIaXN0b3J5PgogIDwvcmRmOkRlc2NyaXB0aW9uPgogPC9yZGY6UkRGPgo8L3g6eG1wbWV0YT4KPD94cGFja2V0IGVuZD0iciI/PjzLAcoAAAGCaUNDUHNSR0IgSUVDNjE5NjYtMi4xAAAokXWRzytEURTHP2ZohAmxsLAYwsaPGDWxsZiJobAYoww2M29+qfnxem8mTbbKdooSG78W/AVslbVSRErWsiQ26DlvZmommXM793zu995zuvdcsPgTSlKvHYZkKqP5vG7HUmDZYXvFhp1W+ukKKro6tzDlp6p93lNjxttBs1b1c/9aYziiK1BTLzyhqFpGeFp4dj2jmrwj3K7Eg2HhM+EBTS4ofGfqoSK/mBwr8rfJmt/nAUuLsCNWwaEKVuJaUlheTk8ykVVK9zFf0hRJLS5I7BbvRMeHFzcOZpjEg4sRxmV2MYiTIVlRJX+4kD9PWnIVmVVyaKwRI06GAVGzUj0iMSp6REaCnNn/v33Vo6POYvUmN9Q9G8Z7L9i24SdvGF9HhvFzDNYnuEyV89OHMPYher6s9RxA8yacX5W10C5cbEHHoxrUggXJKm6JRuHtFOwBaLuBhpViz0r7nDyAf0O+6hr29qFPzjev/gKViGf7BrltqwAAAAlwSFlzAAAuIwAALiMBeKU/dgAAIABJREFUeJzsfXecVdW18Nq3TIEZYIYyIENTVERAESOigFiiIiKW8GJEU0TMw8RE1CSWxPclUZ/RJEbFEl/UKDEx9hIL0UAEFUREmiioFGVgKMMAA8PM3HvP+v7YZ6+9djln7gDqS95dv+Fyyj57r77WLmcfgAIUoAAFKEABClCAAhSgAAUoQAEKUIACFKAABShAAQpQgAIUoAAFKEABClCAAhSgAAUoQAEKUIACFKAABShAAQpQgAIUoAAFKEABClCAAhSgAAUoQAEKUIACFKAABShAAQpQgAIUoAAFKEABClCAAhSgAAUoQAEKUIACFKAABShAAQpQgAIUoAAFKEABClCAAhSgAAUoQAEKUIACFKAABShAAQpQgAIUoAAFKEABClCAAhSgAAUoQAEKUIACFKAABShAAQpQgAIUoAAFKEABClCAAhSgAAUoQAEKUIACFKAA/xdAfNkIFEBDKpUCAERExGQymcvl6BcRgyAAgGQyKUQotVwuFwRBKpUSQuRyOXldCAgCTCQSiAiAuVyAiF8iUQX4XKFgwF8aSHuTBplIJDAIMtksIgohEBEECBDylB6JP41qRVp4kAsQMJfL0bOfA00F+KKhYMBfNCQSiWQyCQBkSzK0SrulX4gwV+tumwqrEC2E/BUiQMxms18Y7QXY71Aw4C8IZKQVQgRBLgh09KNISJZGt8JQzE7d8lE1uM/y6/QrAFLpNAZBgCgLSG/yfxmEAkAUiUQikZD9lEwmo3gIiBD2XLJZkUjIXo9k/RfMwIIBf+6QTqdBQCaTATNptSywTacQYc9Rxmw9Cz6TJmyFEM3NzfuD9H8xKC4uBoBcLiezEi+LYvIgREwlk8lUMggwk8l8MTgXDPhzhHQ6HQSBDG/yCg+MXpv0hlyuImBGUbdRN5K7bbnWbtWfSCRkfEaAXC73b9xhTiQSyWRC5kRcUl6I4rl1lxgIAJ93D6VgwJ8LyKGjTCaTj9v2lpHQ6l0wjTOfu21tSI6NSzP+d7LkRCKRSqVyuRwNRoBphFZ5zhPLD2qOMQYJIYRIpFLJbDb7b8a6f2cQQqTSKZEIh4usW+4pH1tyy7iF4+9aVcWftgm3RCKRSCTS6bS0539pSKaSsqdgXY/iSf4c854KIdLp9D5j7YdCBN5vIIRIJpMAmM3GefSoUzf0xaS4bl/XLQNOlxjyiNLuqUWLtGQAQAwQ/5UGvSizpU6BxUmXgRK8sdc7/h8zyiD7Uzza7xdI7t/q/s9CIplMJZPZbJaPMHMXztWCi19GOX4KbNbHe5eechXIbdpCwHur1WctQiQEASaTyXQ6XHzSBmZ9GZBOpxMJkcsF3ONYpHk54+1xQLSL5Kf8YhAEMhTvXxv+vxWBaamTPEXEZDIZBDnAkNkIIIMMFWiV3clkAoTAAN1YZGkARPj1VoepuPm5p+5Fr+Z5h8esK+7FKMvkuAkhEolwavkLG33NH1KpFCLSAJUbdd3jKHCNNibkRh0kk0k5tLlfqPv3N2CpYXIatqWlJUpOXhsTYVasxyelH+XV0vQgr8cbG72nXrvlZcC0rpj62wT54xbVkBfn/z0jXjLVF0JkMlk+uhTvJfPxsBZPvCE6xh0DAF8bu4/wb27A6XRacspd7URlvLHLKkxGaymlt5fYptNW9SmfGoBrjAABoqy8bNiwYX369E0lk5s2bVq8eHFNTU1bcWsr5hYrpDG3tLTAFwvJZNLNlgmr/cuEPE/dizIv2O9d4n8TkNoTP17KAym/SODezaddKm/VwE+9F/M85deti+3btx83btydd965bNkymRcQZLPZ999//8YbbzzooIM4Gm6F+TTET6MeoYNUMillkUom+ZsY+x3kGlXZjrdAFNXx7I0/ternZbwI8F+5lmsfqf43BPL9/Ao/9losL8lP3btWzd7K48UfVXmbTvnFDh06fPe7392yZYs014ABIobrJBERsbGx8bTTTuO1tarBeRLi5Z79iIBUKlVSVFxcXBye7zMIIdLpdHFxsRy5iDGeNnHYJdOq3L3l0htVGx14Z7P+T0MqlaIhKAnxYmgVYpQyqqSlE1GY7IU+ufWfMOaEx/76mEyPlblKe6XfgIfiAHHXrl2TL5kcg7mrZ63yJF7vwaf6MmAmkmHYlDPM6XSqqKgoRkBCiGQyWVRUJIM6vRkSU9499goxyiDzrDzm1Hudfj+/KeJ/MUgkEkVFRfwKtwFXR627bmHwaapV2PuIW7P3qahK4h8BgHbt2g0dOnTatGnvr1gRmPaZJ2zatMnNpWMwj+eGW9g9zYefJLhUMllSXJxIJIqKQygqKpLyzSfM5kNXFJl5kpNnza4eepnwb7A2Zl8hmUxyT2wJ2GKZC15ti6nKfTBGX70PtqlCunXwIYfcdtttNTU1jY2NLKZasZcfGWcsqQ5WfLAixXx/nmTG4O+lOoon8afEgXjDaLWGGH7mI+sokmPIbCvV8mBfDLiVJOFfAlKplDuxxhmKEfMBslg+d9tUGMx5F3m3U6dO/fr169GjR0VFRUlJSTabzWQy8sWXTCbTqKCpqamxsTEX5IqLiysqKrtXVfXu3fvAAw889NBDDz/88D59+jgZI3qEKEc6o2WLiELA17428amnnoonk5OQTqePPPLIwYMHV1RU1NfXL1my5L333kM2qe5yZq9PY7DihV1x5yMvqxjVsNeiB8eA86SL7hYVFX3xw/VfPgghUum0park2Og4ypfzK+6z4IvMli93y1sNlZWVnXDCCa+88kpLS0v+KW4eEJs5B3bX17kfIOILL7wQgzmnK5FIDBo06K233rLq+fTTT7/1rW917tw5fHspmidu/TH8jxFHFMPdAlHtRp3GSNNSBtGaVkTpSRQT5BVr7ObfH9LptJdml5XuXffUuh7zSFRD4PiO//iP/1iyZIk1oxNlTm2EIOK4DdDU1NSrV694kuXBRRddVF9fH4X8unXr/vu//7tDhw5ejlma6l6JsVj3rlt5qw1FGZW3kijw1typomLo0KFnnHHG+PHjx4wZc+CBB1IyHNW0lwp5+i8wmiXHDJPJpHyTK6Vm7eSamaRaJR8PQohEMhlFreXkIMIFgslHb+GoZ90yzl3RtWvXBx54ACMs02uxMWbMb7HubuDe1becfq9VRl686aabON9cQgDgzDPPdBFwYfXq1RdffHHXrl3z4dhenLoXYwTU1tMosZJeFRUVHXrooePGjfvRj340Y8aMt99+e/PmzbTgjKC+vv6VV175/ve/f/jhh9N4m1u/CxCuP/lfGYSTyaQcS4ynQQiREImioqKSkmJvdE2lUsXFxd5pA85riJa39y5dFI7GeJ+1nnIrHDBgwPbt2+2BJce0aPzJLcltTf1aU7tBEOSsSoIgQMdcrfEsfjEIgpUrV8ptKKKULJlMrVu3zrJ9B3ld7bZt2y677DKa3nTZ6L2e5ykXQYyAvNKMqtmVpiXokpKSyZMnf/TRR83NzdxiLalZjrKpqWnGjBnt27ePb906/d8VhJMswLp3o1hJvzJWyxnCdDrtLuJplR3udUtBwRG/F0lvzd7aAGD48OFr1qyOsB/DiMikXVXwWbJZYatd4PjHFdTV1fXt2xdMVWb0Je655x7r8dYS/iAIgjVrVt91113Dhw+3vK3X9vIxufwN0ltzvKZ51am0tPQ/vv71J554YtOmTTGcjOfGkiVLRo8eHd86P42f0/araFsfaL1GIWidJ0a/ywK+DZxExJJxjH6PhFsgPQVsPTM7FUKEZUpKSkpLS0tKSmRqUFpa2rFjx46dOnau7FxaWio3Vd5WX//JJx/XbqzdsmXLnj17wBxoJRw4Vl26dHlr3lsH9z8YAAABIZAcZmUEgLF1gxAg1y8jyDrDMrKF8AoiQPjGFN1wR5/VFaGHoVWz6kHVuhqIzmZzo0ePnjdvnvANyVZXVy9evLhz50razQslFiEygKhOQIDkLbUtBCLOmTPnlltuWbRoUV1dHU0TWMIF33iyT3xtuGtpBb8L4Bki5neFSBx66CEPPvjgscce69RhgBAAimKULBBmUSEadu48/fTT582fJ5edRSmt/JUb6EVZzecOsmebSCS8bsGKdfzUcsxtKmw96DbKXd2xxx55ww03zJw5c+nSpatXr66trd2xY0dTU1NObn/OPKuEXC63bdu29957b8qUKbRy1Wqat37bbbdRlsU9tOGt6VhlvCwrdgMy7/EGqB6Sby86cUAltCyrNYMG8rbk8fe+9z2vpIQQ48ePZ0ljgLIDYCaNTkwOrDHwbDb76aefPv/88xMnTiwtLeX1W821Kvqop+IDclSMjap56tSpO3bsMPlGZBry0iwNifbH5Nra2gPVspl4ukTbs+j9E4GFEOEbUrkcsouuU6cD4cyz5dmW5T75RfcAEcvLy0844YSzzjrrrLPGd+tWlX9DVqP//Oc/r7zyysWLF0fF/IMOOmjFihVaAAgyALLymjcUqBj5FFPRDLHhgZdk66LZUCuUymf/9OijF114IZgikFg99NCD3/72d1idNhqe1hFARLZeX18/a9asWbNmrVixYtWqVbW1tUEQuGmXhUYUwwkqKyurq6t79uzZq1evAw88sHv37olEoqamZuHChbNmz6rfVm897moLqJfDf/azn91www1OE8hEBkxqoOQbCtt8UCdJf338r984/xuucrqnRUXp5uYvdkJYbpVkXczT23nL5Hnqeln34te//vWdO3fifoJt9dt69+7NNZM397Of/YwXthy2D3ikcuKYv5vLi0XPJLVlXunDDz90yZFQW1ubXx1W63k1HwTBxo0bH3jggYkTJ1ZVVfGZ5BjFEELIRO+ggw66+OKLH3300U2bNsV0RJub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";

export const WA = "https://wa.me/5521999999999?text=";
export const wa = (t: string) => WA + encodeURIComponent(t);

export type CatKey = "ban" | "arr" | "pla" | "def" | "fis" | "qi";
export type NanoKey =
  | "dir"
  | "esq"
  | "mid"
  | "tres"
  | "lt"
  | "pas"
  | "ctr"
  | "lat"
  | "con"
  | "vel"
  | "res"
  | "imp"
  | "dec"
  | "rea";

export interface CategoryDef {
  k: CatKey;
  t: string;
  e: string;
  n: [NanoKey, string][];
}

export const CATS: CategoryDef[] = [
  {
    k: "ban",
    t: "Finalização na Bandeja",
    e: "🏀",
    n: [
      ["dir", "Mão Direita"],
      ["esq", "Mão Esquerda"],
    ],
  },
  {
    k: "arr",
    t: "Arremesso",
    e: "🎯",
    n: [
      ["mid", "Meia Distância"],
      ["tres", "Bola de 3 Pontos"],
      ["lt", "Lance Livre"],
    ],
  },
  {
    k: "pla",
    t: "Playmaking & Controle",
    e: "🧠",
    n: [
      ["pas", "Passe Alvo em Movimento"],
      ["ctr", "Controle sob Pressão"],
    ],
  },
  {
    k: "def",
    t: "Defesa Individual",
    e: "🛡️",
    n: [
      ["lat", "Deslocamento Lateral"],
      ["con", "Contestação de Arremesso"],
    ],
  },
  {
    k: "fis",
    t: "Físico & Atleticismo",
    e: "⚡",
    n: [
      ["vel", "Velocidade / Sprint"],
      ["res", "Resistência / Suicídio"],
      ["imp", "Impulsão / Salto"],
    ],
  },
  {
    k: "qi",
    t: "QI de Jogo & Reação",
    e: "👁️",
    n: [
      ["dec", "Decisão em Vantagem Numérica"],
      ["rea", "Reação a Estímulo"],
    ],
  },
];

export const W: Record<CatKey, number> = {
  ban: 0.2,
  arr: 0.25,
  pla: 0.15,
  def: 0.15,
  fis: 0.15,
  qi: 0.1,
};

export const BN = ["Bloqueado", "Bronze", "Prata", "Ouro"];
export const BE = ["🔒", "🥉", "🥈", "🥇"];
export const THR = [70, 80, 90];

export const PASS: [number, string][] = [
  [150, "Kit Adesivos + Par de Meias HEZI FAM"],
  [400, "Cupom de 20% OFF na linha de roupas"],
  [750, "Camiseta Oficial de Treino Exclusiva"],
];

export const nano = (n: number) => Math.round(50 + n * 2.45);

export const ovr = (s: Record<CatKey, number>) =>
  Math.round(CATS.reduce((a, c) => a + s[c.k] * W[c.k], 0));

export const sessao = (c: CategoryDef, r: Record<NanoKey, number>) => {
  const v = c.n.map(([k]) => r[k] ?? 0);
  if (c.k === "ban") {
    const [a, b] = v.map(nano);
    const f = Math.max(a, b);
    const w = Math.min(a, b);
    const d = Math.abs(v[0] - v[1]);
    return Math.max(
      50,
      Math.round(f * 0.6 + w * 0.4 - (d > 4 ? (d - 4) * 1.2 : 0)),
    );
  }
  if (c.k === "arr") {
    return Math.round(nano(v[0]) * 0.4 + nano(v[1]) * 0.35 + nano(v[2]) * 0.25);
  }
  return Math.round(v.map(nano).reduce((a, b) => a + b, 0) / v.length);
};

export type BadgeState = Record<CatKey, { l: number; s: number }>;

export const B0 = (): BadgeState =>
  Object.fromEntries(CATS.map((c) => [c.k, { l: 0, s: 0 }])) as BadgeState;

export const baseSub: Record<CatKey, number> = {
  ban: 65,
  arr: 65,
  pla: 65,
  def: 65,
  fis: 65,
  qi: 65,
};

const sL: Record<CatKey, number> = {
  ban: 72,
  arr: 70,
  pla: 71,
  def: 70,
  fis: 74,
  qi: 70,
};

const sM: Record<CatKey, number> = {
  ban: 68,
  arr: 66,
  pla: 67,
  def: 67,
  fis: 68,
  qi: 66,
};

export const mkR = (
  s: Record<CatKey, number>,
  o: Partial<Record<NanoKey, number>> = {},
): Record<NanoKey, number> => {
  const r = {} as Record<NanoKey, number>;
  CATS.forEach((c) =>
    c.n.forEach(([k]) => {
      r[k] = Math.round((s[c.k] - 50) / 2.45);
    }),
  );
  return { ...r, ...o };
};

export interface HeziUser {
  id: number;
  tipo: "aluno" | "jogador";
  nome: string;
  pos: string;
  st?: "ativo" | "inativo";
  hp: number;
  of?: number;
  foto?: string;
  wpp?: string;
  sub?: Record<CatKey, number>;
  r?: Record<NanoKey, number>;
  bd?: BadgeState;
  ev?: { d: string; c: string } | null;
  nota?: string;
}

export interface HeziEventItem {
  id: number;
  t: string;
  tp: string;
  q: string;
  l: string;
  r: string;
  f: number[];
}

export const U0: HeziUser[] = [
  {
    id: 1,
    tipo: "aluno",
    nome: "Lucas Silva",
    pos: "Armador",
    st: "ativo",
    hp: 120,
    of: 3,
    foto: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=150",
    sub: sL,
    r: mkR(sL, { dir: 19, esq: 10 }),
    bd: { ...B0(), ban: { l: 1, s: 0 }, fis: { l: 2, s: 0 } },
    ev: { d: "03/11/2026", c: "Quinzenal" },
    nota: "Ótima mão direita! Foco na esquerda: faça séries de bandeja só com a esquerda antes do treino.",
  },
  {
    id: 2,
    tipo: "aluno",
    nome: "Matheus Rocha",
    pos: "Ala",
    st: "ativo",
    hp: 45,
    of: 1,
    foto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    sub: sM,
    r: mkR(sM, { dir: 14, esq: 13 }),
    bd: { ...B0(), fis: { l: 1, s: 0 } },
    ev: { d: "03/11/2026", c: "Quinzenal" },
    nota: "Evolução equilibrada. Manter a constância nos treinos.",
  },
  {
    id: 3,
    tipo: "aluno",
    nome: "Gabriel Santos",
    pos: "Pivô",
    st: "inativo",
    hp: 90,
    of: 0,
    foto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    sub: baseSub,
    r: mkR(baseSub),
    bd: { ...B0(), ban: { l: 1, s: 0 }, arr: { l: 1, s: 0 } },
    ev: null,
    nota: "",
  },
  {
    id: 4,
    tipo: "aluno",
    nome: "Enzo Pereira",
    pos: "Ala",
    st: "ativo",
    hp: 15,
    of: 1,
    foto: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150",
    sub: baseSub,
    r: mkR(baseSub),
    bd: B0(),
    ev: null,
    nota: "",
  },
  {
    id: 11,
    tipo: "jogador",
    nome: "Carlos Mendes",
    pos: "Ala",
    hp: 30,
    wpp: "(21) 98888-1111",
  },
  {
    id: 12,
    tipo: "jogador",
    nome: "Rafael Souza",
    pos: "Pivô",
    hp: 10,
    wpp: "(21) 97777-2222",
  },
];

export const E0: HeziEventItem[] = [
  {
    id: 1,
    t: "Pelada Oficial Hezi",
    tp: "Pelada",
    q: "Sábado · 17:00",
    l: "Quadra Central",
    r: "Jogos até 12 pontos ou 10 min",
    f: [1, 12, 2],
  },
  {
    id: 2,
    t: "Treino Hezi Skills",
    tp: "Treino",
    q: "Terça · 16:30",
    l: "Quadra Central",
    r: "Somente alunos assinantes",
    f: [],
  },
];

export interface HeziPlatformState {
  lastModified: number;
  users: HeziUser[];
  evs: HeziEventItem[];
  updUser: (id: number, patch: Partial<HeziUser>) => void;
  addUser: (u: HeziUser) => void;
  setEvs: (evs: HeziEventItem[]) => void;
  addQueue: (eid: number, uid: number) => void;
  hydrateFromRemote: (
    remote: Partial<Pick<HeziPlatformState, "lastModified" | "users" | "evs">>,
  ) => void;
}

export const useHeziPlatform = create<HeziPlatformState>()(
  persist(
    (set) => ({
      lastModified: 0,
      users: U0,
      evs: E0,

      updUser: (id, patch) =>
        set((s) => ({
          ...s,
          lastModified: Date.now(),
          users: s.users.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),

      addUser: (u) =>
        set((s) => ({
          ...s,
          lastModified: Date.now(),
          users: [...s.users, u],
        })),

      setEvs: (evs) =>
        set((s) => ({
          ...s,
          lastModified: Date.now(),
          evs,
        })),

      addQueue: (eid, uid) =>
        set((s) => ({
          ...s,
          lastModified: Date.now(),
          evs: s.evs.map((e) =>
            e.id === eid && !e.f.includes(uid) ? { ...e, f: [...e.f, uid] } : e,
          ),
        })),

      hydrateFromRemote: (remote) =>
        set((s) => ({
          ...s,
          ...remote,
        })),
    }),
    {
      name: "hezi-platform-store-v2",
      partialize: (s) => ({
        lastModified: s.lastModified,
        users: s.users,
        evs: s.evs,
      }),
    },
  ),
);

export type SessionId = "visitante" | "prof" | "admin" | number;

interface SessionStore {
  sid: SessionId;
  setSid: (sid: SessionId) => void;
}

export const useHeziSession = create<SessionStore>()(
  persist(
    (set) => ({
      sid: "visitante",
      setSid: (sid) => set({ sid }),
    }),
    {
      name: "hezi-session-device-v2",
    },
  ),
);
