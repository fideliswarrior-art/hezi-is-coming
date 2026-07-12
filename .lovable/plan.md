## Objetivo

Construir o app "Pelada" como uma rota do site (`/pelada`) — um totem web touch-friendly para gerenciar a fila, os times e as partidas do 3x3, seguindo todas as regras que você definiu.

## Escopo desta primeira versão

- Tudo roda **local no navegador** (estado em memória + `localStorage` para não perder se recarregar). Sem login, sem banco. Assim entregamos rápido e você já valida no totem. Integração com contas do hezi.com.br fica para uma segunda fase.
- Uma tela única em `/pelada`, otimizada para tela grande touch.

## Layout da tela

```text
┌─────────────────────────────────────────────────────────┐
│  BLOCO 1 — QUADRA                                       │
│  ┌───────────────┐   07:00   ┌───────────────┐          │
│  │ TIME A        │  ⏯  ⏺  🔀 │ TIME B        │          │
│  │ M, P, Q       │           │ N, A, B       │          │
│  │ ✅ Venceu     │           │ ✅ Venceu     │          │
│  └───────────────┘           └───────────────┘          │
├─────────────────────────────────────────────────────────┤
│  BLOCO 2 — FILA (cascata, topo = próximo)               │
│  👑 Time O (E, F)         ← campeão aguardando          │
│  Jogador C                                              │
│  Time J (K, L)                                          │
│  ...                                                    │
│  [ + Adicionar jogador ]  [ Formar time ]  [ Admin ]    │
└─────────────────────────────────────────────────────────┘
```

## Regras implementadas

1. **Fila FIFO em cascata**, com dois "trilhos": `waitingChampion` (👑, prioridade absoluta) e `waitingQueue` (fila normal).
2. **Formação de times por toque** (copiar/colar): toca no jogador → fica destacado → toca em "Formar time" ou em um slot de time destino. O novo time herda a posição do jogador mais antigo selecionado.
3. **Numeração de times sequencial e persistente** (Time 1, 2, 3… nunca reutiliza número, mesmo se o time for desfeito).
4. **Sobrevivência de time**: um time só existe com ≥2 jogadores; se cair para 1, vira jogador individual mantendo a posição.
5. **Cooldown 🚫**: quem acabou de perder recebe a flag; ela zera quando uma partida seguinte termina sem ele. Ao tentar escalá-lo, abre modal "acabou de jogar, confirmar mesmo assim?".
6. **Duas vitórias → 👑**: o time sai da quadra e vai para `waitingChampion` (topo), entra depois do próximo jogo. Contagem zera quando voltar.
7. **Substituição em jogo**: pode trocar jogador de um time em quadra; a contagem de vitórias pertence ao slot, não ao jogador.
8. **Cronômetro 7 min**: roda em background, alarme sonoro ao zerar mesmo se estiver mexendo na tela. Botões ⏯ play/pause.
9. **Primeiro empate ⏺**: adiciona 1 min de morte súbita; bota fica bloqueado até um admin reabrir.
10. **Empate total 🔀**: os dois times saem; ordem na fila = (mais vitórias primeiro, depois jogador mais antigo).
11. **Vitória ✅**: perdedor ganha 🚫 e vai pro fim da fila; vencedor fica; se completou 2, vai pra 👑 e entra o próximo da fila.
12. **Cadastro de jogador**: campo de texto simples (nome do convidado). Perfis logados ficam para a v2.
13. **Modo Admin**: PIN simples de 4 dígitos guardado localmente, libera reset do botão ⏺ e ações destrutivas (remover jogador, resetar noite).

## Detalhes técnicos (para referência)

- Rota TanStack: `src/routes/pelada.tsx` com `head()` próprio (title/description/og).
- Estado central em um `zustand` store (`src/lib/pelada/store.ts`) persistido em `localStorage`. Estruturas:
  - `players: { id, name, justPlayed: boolean, createdAt }`
  - `teams: { id, number, memberIds[], wins, createdAt }`
  - `court: { teamAId, teamBId, startedAt, running, suddenDeathUsed }`
  - `waitingChampion: teamId | null`
  - `queue: Array<{ kind: 'player'|'team', id }>` (ordenada)
  - `nextTeamNumber: number`, `matchHistory: […]`
- Regras isoladas em funções puras (`endMatch`, `formTeam`, `movePlayerToTeam`, `resolveTie`) para ficarem testáveis.
- Componentes em `src/components/pelada/`: `CourtPanel`, `Timer`, `QueueList`, `TeamCard`, `PlayerChip`, `SelectionBar`, `ConfirmCooldownDialog`, `AdminDialog`.
- Design system: adicionar tokens semânticos (`--court`, `--champion`, `--cooldown`, `--victory`) em `src/styles.css` e usar variantes do shadcn — nada de cor hardcoded nos componentes.
- Alarme: pequeno `<audio>` gerado com WebAudio (beep) — sem asset externo.
- Touch: alvos grandes (mín 56px), `select-none`, sem drag-and-drop.
- Sitemap: adicionar `/pelada` em `src/routes/sitemap[.]xml.ts`.

## Fora do escopo desta primeira entrega

- Login/integração com contas hezi.com.br (v2, quando plugarmos Lovable Cloud).
- Histórico persistente entre noites / estatísticas por jogador.
- Multi-quadra simultânea.

Se aprovar assim, começo pelo store + regras puras, depois a UI da quadra, depois a fila e por fim admin/alarme.