import { useMemo, useState } from "react";
import { Shield, Plus, Users, UserPlus, UserMinus, ArrowLeft, CheckCircle2, AlertCircle, Crown } from "lucide-react";
import { useHeziPlatform } from "../../../lib/hezi/store";
import { ImageUploadField } from "../../../components/hezi/ImageUploadField";
import { useTeamStore } from "../services/teamService";
import { TEAM_MAX_ROSTER, TEAM_MAX_SWAPS_PER_SEASON, type TeamModality } from "../types";

interface TeamsPageProps {
  currentUserId: number | null;
  onBack?: () => void;
}

export function TeamsPage({ currentUserId, onBack }: TeamsPageProps) {
  const users = useHeziPlatform((s) => s.users);
  const {
    teams = [],
    rosterMembers = [],
    teamRequests = [],
    submitTeamRequest,
    addMemberToTeam,
    removeMemberFromTeam,
  } = useTeamStore();

  const [modalityFilter, setModalityFilter] = useState<"all" | TeamModality>("all");
  const [showCreate, setShowCreate] = useState(false);

  // Create form
  const [name, setName] = useState("");
  const [modality, setModality] = useState<TeamModality>("3x3");
  const [logoUrl, setLogoUrl] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);
  const [searchAthlete, setSearchAthlete] = useState("");
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  // Manage roster modal/expanded state
  const [managingTeamId, setManagingTeamId] = useState<string | null>(null);
  const [addSearch, setAddSearch] = useState("");

  const currentYear = new Date().getFullYear();

  const userMap = useMemo(() => {
    const map = new Map<number, { nome: string; apelido: string; username: string }>();
    for (const u of users) {
      map.set(u.id, { nome: u.nome, apelido: u.apelido || u.nome, username: u.username || "" });
    }
    return map;
  }, [users]);

  const filteredTeams = useMemo(() => {
    return teams.filter((t) => modalityFilter === "all" || t.modality === modalityFilter);
  }, [teams, modalityFilter]);

  const busyInModalitySet = useMemo(() => {
    const set = new Set<number>();
    for (const m of rosterMembers) {
      if (m.is_active && m.modality === modality && m.season_year === currentYear) {
        set.add(m.user_id);
      }
    }
    return set;
  }, [rosterMembers, modality, currentYear]);

  const availableAthletesForCreate = useMemo(() => {
    const q = searchAthlete.trim().toLowerCase();
    return users
      .filter((u) => u.id !== currentUserId)
      .filter((u) => !busyInModalitySet.has(u.id))
      .filter((u) => {
        if (!q) return true;
        return (
          u.nome.toLowerCase().includes(q) ||
          (u.apelido && u.apelido.toLowerCase().includes(q)) ||
          (u.username || "").toLowerCase().includes(q)
        );
      })
      .slice(0, 20);
  }, [users, currentUserId, busyInModalitySet, searchAthlete]);

  const toggleInitialMember = (uid: number) => {
    setSelectedMemberIds((prev) => {
      if (prev.includes(uid)) return prev.filter((id) => id !== uid);
      const maxOthers = TEAM_MAX_ROSTER[modality] - 1; // captain counts as 1
      if (prev.length >= maxOthers) return prev;
      return [...prev, uid];
    });
  };

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId) {
      setFeedback({ ok: false, msg: "Faça login para fundar um Time Oficial." });
      return;
    }
    const res = submitTeamRequest({
      name,
      modality,
      captain_user_id: currentUserId,
      logo_url: logoUrl.trim(),
      initialMemberIds: selectedMemberIds,
    });
    if (!res.ok) {
      setFeedback({ ok: false, msg: res.error || "Erro ao enviar solicitação." });
      return;
    }
    setFeedback({
      ok: true,
      msg: `Solicitação do time "${res.request?.name}" enviada! Os administradores foram notificados e o time será criado após aprovação.`,
    });
    setName("");
    setLogoUrl("");
    setSelectedMemberIds([]);
    setShowCreate(false);
  };

  const handleAddMember = (teamId: string, uid: number) => {
    const res = addMemberToTeam(teamId, uid);
    setFeedback({
      ok: res.ok,
      msg: res.ok ? "Atleta adicionado ao elenco." : res.error || "Não foi possível adicionar.",
    });
  };

  const handleRemoveMember = (teamId: string, uid: number) => {
    const res = removeMemberFromTeam(teamId, uid);
    setFeedback({
      ok: res.ok,
      msg: res.ok ? "Atleta removido do elenco." : res.error || "Não foi possível remover.",
    });
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#111317] pb-20">
      <div className="max-w-4xl mx-auto px-4 pt-5 space-y-5">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="w-10 h-10 rounded-xl bg-white border border-[#EAEBEF] flex items-center justify-center text-[#111317] hover:bg-gray-50"
                title="Voltar"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#FF5500]" />
                <h1 className="text-xl font-black tracking-tight uppercase">Times Oficiais HEZI</h1>
              </div>
              <p className="text-xs text-[#6B7280] font-medium">
                Elenco de Temporada ({currentYear}) · 3x3 (máx. 5) e 5x5 (máx. 8) · Máx. 2 trocas/ano
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setShowCreate((v) => !v);
              setFeedback(null);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF5500] text-white text-xs font-black uppercase tracking-wider shadow-sm hover:bg-[#e04b00] transition"
          >
            <Plus className="w-4 h-4" />
            {showCreate ? "Fechar Formulário" : "Fundar Time Oficial"}
          </button>
        </div>

        {/* Feedback banner */}
        {feedback && (
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-xs font-bold ${
              feedback.ok
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            {feedback.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{feedback.msg}</span>
          </div>
        )}

        {/* Create Team Form */}
        {showCreate && (
          <form onSubmit={handleCreateTeam} className="bg-white border border-[#EAEBEF] rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-wide">Novo Time Oficial ({currentYear})</h2>
              <span className="text-[11px] font-bold text-[#6B7280]">
                Você será o Capitão
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-[#6B7280] mb-1">
                  Nome do Time *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Zona Sul Ballers"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAEBEF] bg-[#F8F9FA] text-sm font-semibold focus:outline-none focus:border-[#FF5500]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase text-[#6B7280] mb-1">
                  Modalidade *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(["3x3", "5x5"] as TeamModality[]).map((mod) => (
                    <button
                      type="button"
                      key={mod}
                      onClick={() => {
                        setModality(mod);
                        setSelectedMemberIds([]);
                      }}
                      className={`py-2.5 rounded-xl border text-xs font-black uppercase transition ${
                        modality === mod
                          ? "bg-[#111317] text-white border-[#111317]"
                          : "bg-[#F8F9FA] text-[#111317] border-[#EAEBEF]"
                      }`}
                    >
                      {mod} (máx. {TEAM_MAX_ROSTER[mod]})
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <ImageUploadField
              label="Escudo / Logo do Time (opcional)"
              value={logoUrl}
              onChange={setLogoUrl}
              maxSize={384}
            />

            {/* Select initial roster */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-extrabold uppercase text-[#6B7280]">
                  Convocar Elenco Inicial ({1 + selectedMemberIds.length}/{TEAM_MAX_ROSTER[modality]} vagas)
                </label>
                <span className="text-[11px] text-[#6B7280]">1 time por modalidade/temporada</span>
              </div>

              <input
                type="text"
                value={searchAthlete}
                onChange={(e) => setSearchAthlete(e.target.value)}
                placeholder="Buscar atleta por nome ou @username..."
                className="w-full px-3.5 py-2 rounded-xl border border-[#EAEBEF] bg-[#F8F9FA] text-xs font-medium focus:outline-none focus:border-[#FF5500]"
              />

              <div className="max-h-44 overflow-y-auto divide-y divide-[#EAEBEF] border border-[#EAEBEF] rounded-xl">
                {availableAthletesForCreate.length === 0 ? (
                  <p className="p-3 text-xs text-[#6B7280] text-center">Nenhum atleta disponível encontrado.</p>
                ) : (
                  availableAthletesForCreate.map((u) => {
                    const checked = selectedMemberIds.includes(u.id);
                    return (
                      <button
                        type="button"
                        key={u.id}
                        onClick={() => toggleInitialMember(u.id)}
                        className={`w-full flex items-center justify-between px-3.5 py-2 text-left text-xs transition ${
                          checked ? "bg-orange-50 font-bold text-[#FF5500]" : "hover:bg-gray-50"
                        }`}
                      >
                        <span>
                          {u.apelido || u.nome}{" "}
                          <span className="text-[#6B7280] font-normal">@{u.username}</span>
                        </span>
                        <span className="text-[11px] font-black uppercase">
                          {checked ? "Selecionado" : "+ Adicionar"}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-4 py-2.5 rounded-xl border border-[#EAEBEF] text-xs font-bold text-[#6B7280] hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#FF5500] text-white text-xs font-black uppercase tracking-wider hover:bg-[#e04b00]"
              >
                Confirmar Fundação
              </button>
            </div>
          </form>
        )}

        {/* My Pending / Rejected Requests */}
        {currentUserId !== null &&
          teamRequests.some((r) => r.captain_user_id === currentUserId && r.status !== "aprovado") && (
            <div className="bg-white border border-[#EAEBEF] rounded-2xl p-4 space-y-2 shadow-sm">
              <p className="text-xs font-black uppercase text-[#6B7280]">
                Minhas Solicitações de Time
              </p>
              <div className="space-y-1.5">
                {teamRequests
                  .filter((r) => r.captain_user_id === currentUserId && r.status !== "aprovado")
                  .map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#F8F9FA] border border-[#EAEBEF] text-xs"
                    >
                      <div>
                        <span className="font-black">{r.name}</span>{" "}
                        <span className="text-[#6B7280]">({r.modality})</span>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          r.status === "pendente"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {r.status === "pendente" ? "Aguardando Admin" : "Recusado"}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

        {/* Filter tabs */}
        <div className="flex items-center gap-2">
          {(["all", "3x3", "5x5"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setModalityFilter(tab)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-black uppercase border transition ${
                modalityFilter === tab
                  ? "bg-[#111317] text-white border-[#111317]"
                  : "bg-white text-[#6B7280] border-[#EAEBEF] hover:text-[#111317]"
              }`}
            >
              {tab === "all" ? "Todos" : tab}
            </button>
          ))}
        </div>

        {/* Teams Grid */}
        {filteredTeams.length === 0 ? (
          <div className="bg-white border border-[#EAEBEF] rounded-2xl p-8 text-center space-y-2">
            <Users className="w-8 h-8 text-[#9CA3AF] mx-auto" />
            <p className="text-sm font-bold text-[#111317]">Nenhum Time Oficial cadastrado ainda</p>
            <p className="text-xs text-[#6B7280]">
              Funde o primeiro Time Oficial de 3x3 ou 5x5 para disputar circuitos e acumular Hezi Points.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTeams.map((team) => {
              const activeRoster = rosterMembers.filter((m) => m.team_id === team.id && m.is_active);
              const isCaptain = currentUserId !== null && team.captain_user_id === currentUserId;
              const isManaging = managingTeamId === team.id;
              const swapsLeft = Math.max(0, TEAM_MAX_SWAPS_PER_SEASON - team.swaps_used);

              const busySetForTeam = new Set(
                rosterMembers
                  .filter((m) => m.is_active && m.modality === team.modality && m.season_year === team.season_year)
                  .map((m) => m.user_id),
              );

              const candidates = users
                .filter((u) => !busySetForTeam.has(u.id))
                .filter((u) => {
                  const q = addSearch.trim().toLowerCase();
                  if (!q) return true;
                  return (
                    u.nome.toLowerCase().includes(q) ||
                    (u.apelido && u.apelido.toLowerCase().includes(q)) ||
                    (u.username || "").toLowerCase().includes(q)
                  );
                })
                .slice(0, 10);

              return (
                <div key={team.id} className="bg-white border border-[#EAEBEF] rounded-2xl p-4 space-y-3 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {team.logo_url ? (
                        <img
                          src={team.logo_url}
                          alt={team.name}
                          className="w-11 h-11 rounded-xl object-cover border border-[#EAEBEF]"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#FF5500] font-black text-sm">
                          {team.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-black text-[#111317]">{team.name}</h3>
                          <span className="px-2 py-0.5 rounded-md bg-[#111317] text-white text-[10px] font-black uppercase">
                            {team.modality}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#6B7280] font-medium">
                          Temporada {team.season_year} · {activeRoster.length}/{TEAM_MAX_ROSTER[team.modality]} atletas ·{" "}
                          {swapsLeft} troca(s) restante(s)
                        </p>
                      </div>
                    </div>

                    {isCaptain && (
                      <button
                        onClick={() => {
                          setManagingTeamId(isManaging ? null : team.id);
                          setAddSearch("");
                        }}
                        className="px-3 py-1.5 rounded-lg border border-[#EAEBEF] text-[11px] font-black uppercase hover:border-[#FF5500] hover:text-[#FF5500] transition"
                      >
                        {isManaging ? "Fechar" : "Gerenciar"}
                      </button>
                    )}
                  </div>

                  {/* Roster list */}
                  <div className="space-y-1.5 pt-1">
                    {activeRoster.map((m) => {
                      const info = userMap.get(m.user_id);
                      const memberIsCaptain = m.user_id === team.captain_user_id;
                      return (
                        <div
                          key={m.id}
                          className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#F8F9FA] border border-[#EAEBEF] text-xs"
                        >
                          <div className="flex items-center gap-2">
                            {memberIsCaptain && <Crown className="w-3.5 h-3.5 text-[#FF5500]" />}
                            <span className="font-bold text-[#111317]">
                              {info ? info.apelido : `Atleta #${m.user_id}`}
                            </span>
                            {info && <span className="text-[#6B7280]">@{info.username}</span>}
                          </div>
                          {isManaging && !memberIsCaptain && (
                            <button
                              onClick={() => handleRemoveMember(team.id, m.user_id)}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 hover:underline"
                            >
                              <UserMinus className="w-3.5 h-3.5" /> Remover
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Captain Add Member Drawer */}
                  {isManaging && (
                    <div className="pt-2 border-t border-[#EAEBEF] space-y-2">
                      <p className="text-[11px] font-extrabold uppercase text-[#6B7280]">
                        Adicionar atleta ({swapsLeft} trocas restantes na temporada)
                      </p>
                      <input
                        type="text"
                        value={addSearch}
                        onChange={(e) => setAddSearch(e.target.value)}
                        placeholder="Buscar atleta livre..."
                        className="w-full px-3 py-2 rounded-xl border border-[#EAEBEF] bg-[#F8F9FA] text-xs focus:outline-none focus:border-[#FF5500]"
                      />
                      <div className="max-h-36 overflow-y-auto space-y-1">
                        {candidates.map((u) => (
                          <div
                            key={u.id}
                            className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-white border border-[#EAEBEF] text-xs"
                          >
                            <span>
                              <strong>{u.apelido || u.nome}</strong>{" "}
                              <span className="text-[#6B7280]">@{u.username}</span>
                            </span>
                            <button
                              onClick={() => handleAddMember(team.id, u.id)}
                              disabled={swapsLeft <= 0 || activeRoster.length >= TEAM_MAX_ROSTER[team.modality]}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FF5500] text-white text-[11px] font-black disabled:opacity-40"
                            >
                              <UserPlus className="w-3 h-3" /> Incluir
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
