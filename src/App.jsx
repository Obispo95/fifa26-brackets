import React, { useMemo, useState } from "react";

// --- Helpers ---------------------------------------------------------------
const NAMES_DEFAULT = [
  "Irving",
  "TucksG",
  "AxlGio",
  "Gerson Sanchez",
  "Jairo Machuca",
  "Jorge Garcia",
  "René Contreras",
  "Saulito",
];

const TEAMS_STRONG = [
  "Real Madrid",
  "Barcelona",
  "Paris Saint-Germain",
  "Liverpool",
  "Manchester City",
  "Arsenal",
  "Bayern Munich",
  "Atlético Madrid",
];

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function makeEmptyMatch(id) {
  return {
    id,
    teamA: null,
    teamB: null,
    leg1A: "",
    leg1B: "",
    leg2A: "",
    leg2B: "",
  };
}

function makeInitialBracket() {
  return {
    quarters: [0, 1, 2, 3].map((i) => makeEmptyMatch(`QF${i + 1}`)),
    semis: [0, 1].map((i) => makeEmptyMatch(`SF${i + 1}`)),
    final: [makeEmptyMatch("F1")],
  };
}

function aggregate(match) {
  const a = (Number(match.leg1A || 0) + Number(match.leg2A || 0)) || 0;
  const b = (Number(match.leg1B || 0) + Number(match.leg2B || 0)) || 0;
  return { a, b };
}

function whoWins(match) {
  const { a, b } = aggregate(match);
  if (!match.teamA || !match.teamB) return null;
  if (a > b) return match.teamA;
  if (b > a) return match.teamB;
  return "EMPATE";
}

const DND_TYPES = {
  PLAYER: "PLAYER",
  SLOT: "SLOT",
};

const Tag = ({ children }) => (
  <span className="px-2 py-1 rounded-full bg-gray-900/5 border border-gray-300 text-sm">
    {children}
  </span>
);

function DraggableName({ name, team, from }) {
  return (
    <div
      className="cursor-move select-none px-3 py-2 rounded-xl border bg-white hover:bg-gray-50 shadow-sm text-sm"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(
          "application/json",
          JSON.stringify({ type: DND_TYPES.PLAYER, name, from })
        );
      }}
    >
      <div className="font-medium">{name}</div>
      {team && <div className="text-xs text-gray-500">{team}</div>}
    </div>
  );
}

function TeamSlot({ label, value, team, onDropName, onClear }) {
  const isEmpty = !value;
  return (
    <div
      className={`flex flex-col gap-1 p-2 rounded-xl border ${
        isEmpty ? "bg-white/50 border-dashed" : "bg-white"
      }`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const payload = JSON.parse(e.dataTransfer.getData("application/json") || "{}");
        if (payload && payload.name) onDropName(payload.name);
      }}
    >
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500">{label}</div>
        {value && (
          <button
            className="text-xs text-gray-500 hover:text-red-600"
            onClick={onClear}
            title="Quitar jugador"
          >
            ✕
          </button>
        )}
      </div>
      <div className="flex-1">
        {value ? (
          <div
            className="cursor-move px-3 py-2 rounded-lg bg-gray-900/5 border text-sm"
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData(
                "application/json",
                JSON.stringify({ type: DND_TYPES.SLOT, name: value })
              );
            }}
          >
            <div>{value}</div>
            {team && <div className="text-xs text-gray-500">{team}</div>}
          </div>
        ) : (
          <div className="text-gray-400 text-sm">Arrastra aquí</div>
        )}
      </div>
    </div>
  );
}

function ScoreRow({ m, onChange }) {
  return (
    <div className="grid grid-cols-5 gap-2 text-sm">
      <div className="col-span-2 flex items-center gap-2">
        <Tag>Ida</Tag>
        <input
          type="number"
          className="w-16 px-2 py-1 rounded-lg border"
          value={m.leg1A}
          onChange={(e) => onChange({ leg1A: e.target.value })}
          placeholder="A"
        />
        <span className="text-gray-500">-</span>
        <input
          type="number"
          className="w-16 px-2 py-1 rounded-lg border"
          value={m.leg1B}
          onChange={(e) => onChange({ leg1B: e.target.value })}
          placeholder="B"
        />
      </div>
      <div className="col-span-2 flex items-center gap-2">
        <Tag>Vuelta</Tag>
        <input
          type="number"
          className="w-16 px-2 py-1 rounded-lg border"
          value={m.leg2A}
          onChange={(e) => onChange({ leg2A: e.target.value })}
          placeholder="A"
        />
        <span className="text-gray-500">-</span>
        <input
          type="number"
          className="w-16 px-2 py-1 rounded-lg border"
          value={m.leg2B}
          onChange={(e) => onChange({ leg2B: e.target.value })}
          placeholder="B"
        />
      </div>
    </div>
  );
}

function MatchCard({ title, match, onUpdate, onAdvance, assignments }) {
  const { a, b } = aggregate(match);
  const winner = whoWins(match);
  return (
    <div className="rounded-2xl border shadow-sm p-3 bg-white/70 backdrop-blur">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-sm text-gray-700">{title}</h4>
        <div className="text-xs text-gray-500">Global: {a} – {b}</div>
      </div>
      <div className="space-y-2">
        <TeamSlot
          label="Equipo A"
          value={match.teamA}
          team={assignments[match.teamA]}
          onDropName={(name) => onUpdate({ teamA: name })}
          onClear={() => onUpdate({ teamA: null })}
        />
        <TeamSlot
          label="Equipo B"
          value={match.teamB}
          team={assignments[match.teamB]}
          onDropName={(name) => onUpdate({ teamB: name })}
          onClear={() => onUpdate({ teamB: null })}
        />
        <div className="my-2"><ScoreRow m={match} onChange={onUpdate} /></div>
        <div className="flex items-center justify-between text-sm">
          <div className={`font-medium ${winner === "EMPATE" ? "text-amber-600" : "text-emerald-700"}`}>
            {winner ? (winner === "EMPATE" ? "Empate en el global – define manual" : `Gana: ${winner}`) : ""}
          </div>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 rounded-lg border bg-white hover:bg-gray-50"
              onClick={() => onUpdate({ leg1A: "", leg1B: "", leg2A: "", leg2B: "" })}
            >
              Limpiar
            </button>
            <button
              className="px-3 py-1 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40"
              disabled={!match.teamA || !match.teamB}
              onClick={() => onAdvance(winner)}
            >
              Avanzar ▶
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [pool, setPool] = useState(NAMES_DEFAULT);
  const [bracket, setBracket] = useState(makeInitialBracket());
  const [assignments, setAssignments] = useState({});

  const assignTeams = () => {
    const shuffledTeams = [...TEAMS_STRONG].sort(() => Math.random() - 0.5);
    const map = {};
    NAMES_DEFAULT.forEach((n, i) => {
      map[n] = shuffledTeams[i];
    });
    setAssignments(map);
  };

  const removeEverywhere = (name, current) => {
    const b = deepClone(current || bracket);
    ["quarters", "semis", "final"].forEach((round) => {
      b[round].forEach((m) => {
        if (m.teamA === name) m.teamA = null;
        if (m.teamB === name) m.teamB = null;
      });
    });
    return b;
  };

  const placeIntoPool = (name) => {
    setBracket((prev) => removeEverywhere(name, prev));
    setPool((p) => (p.includes(name) ? p : [...p, name]));
  };

  const dropToSlot = (roundKey, index, patch) => {
    setBracket((prev) => {
      let b = removeEverywhere(patch.teamA || patch.teamB, prev);
      const m = b[roundKey][index];
      b[roundKey][index] = { ...m, ...patch };
      return b;
    });
    if (patch.teamA || patch.teamB) {
      const name = patch.teamA || patch.teamB;
      setPool((p) => p.filter((n) => n !== name));
    }
  };

  const seedDefault = () => {
    const pairs = [
      [NAMES_DEFAULT[0], NAMES_DEFAULT[1]],
      [NAMES_DEFAULT[2], NAMES_DEFAULT[3]],
      [NAMES_DEFAULT[4], NAMES_DEFAULT[5]],
      [NAMES_DEFAULT[6], NAMES_DEFAULT[7]],
    ];
    const b = makeInitialBracket();
    b.quarters.forEach((m, i) => {
      m.teamA = pairs[i][0];
      m.teamB = pairs[i][1];
    });
    setBracket(b);
    setPool([]);
  };

  const shuffleSeeds = () => {
    const shuffled = [...NAMES_DEFAULT].sort(() => Math.random() - 0.5);
    const b = makeInitialBracket();
    for (let i = 0; i < 4; i++) {
      b.quarters[i].teamA = shuffled[i * 2];
      b.quarters[i].teamB = shuffled[i * 2 + 1];
    }
    setBracket(b);
    setPool([]);
  };

  const resetAll = () => {
    setBracket(makeInitialBracket());
    setPool(NAMES_DEFAULT);
    setAssignments({});
  };

  const advanceFrom = (roundKey, index, winnerName) => {
    setBracket((prev) => {
      const b = deepClone(prev);
      if (roundKey === "quarters") {
        const targetIdx = Math.floor(index / 2);
        const target = b.semis[targetIdx];
        if (index % 2 === 0) target.teamA = winnerName && winnerName !== "EMPATE" ? winnerName : target.teamA;
        else target.teamB = winnerName && winnerName !== "EMPATE" ? winnerName : target.teamB;
      } else if (roundKey === "semis") {
        const target = b.final[0];
        if (index === 0) target.teamA = winnerName && winnerName !== "EMPATE" ? winnerName : target.teamA;
        else target.teamB = winnerName && winnerName !== "EMPATE" ? winnerName : target.teamB;
      }
      return b;
    });
  };

  const PoolDropZone = () => (
    <div
      className="min-h-24 rounded-2xl border-2 border-dashed border-gray-300 p-3 bg-white/50"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const payload = JSON.parse(e.dataTransfer.getData("application/json") || "{}");
        if (payload && payload.name) placeIntoPool(payload.name);
      }}
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {pool.map((n) => (
          <DraggableName key={n} name={n} from="pool" team={assignments[n]} />
        ))}
        {pool.length === 0 && (
          <div className="text-sm text-gray-500 col-span-full">Arrastra aquí para devolver jugadores a la reserva</div>
        )}
      </div>
    </div>
  );

  const Round = ({ title, roundKey }) => (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-700">{title}</h3>
      <div className="grid gap-3">
        {bracket[roundKey].map((m, i) => (
          <MatchCard
            key={m.id}
            title={`${m.id}`}
            match={m}
            assignments={assignments}
            onUpdate={(patch) => dropToSlot(roundKey, i, { ...m, ...patch })}
            onAdvance={(winner) => advanceFrom(roundKey, i, winner)}
          />
        ))}
      </div>
    </div>
  );

  const FinalRound = () => (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-700">Final</h3>
      <MatchCard
        title="Gran Final"
        match={bracket.final[0]}
        assignments={assignments}
        onUpdate={(patch) => dropToSlot("final", 0, { ...bracket.final[0], ...patch })}
        onAdvance={() => {}}
      />
    </div>
  );

  const champion = useMemo(() => whoWins(bracket.final[0]), [bracket]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-indigo-50 via-white to-emerald-50 text-gray-900">
      <div className="max-w-6xl mx-auto p-4 sm:p-8">
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">FIFA 26 – Bracket</h1>
            <p className="text-gray-600">Arrastra los jugadores, anota ida/vuelta y avanza ganadores.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-50" onClick={resetAll}>Reiniciar</button>
            <button className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-50" onClick={seedDefault}>Sembrar fijo</button>
            <button className="px-3 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700" onClick={shuffleSeeds}>Sembrar aleatorio</button>
            <button className="px-3 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700" onClick={assignTeams}>Asignar equipos</button>
          </div>
        </header>

        <section className="mb-8">
          <h2 className="font-semibold text-gray-700 mb-2">Reserva de jugadores (arrastra a los slots)</h2>
          <PoolDropZone />
        </section>

        <section className="grid lg:grid-cols-3 gap-6">
          <Round title="Cuartos de final" roundKey="quarters" />
          <Round title="Semifinales" roundKey="semis" />
          <FinalRound />
        </section>

        <footer className="mt-8">
          <div className="rounded-2xl bg-white border p-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">Tip: puedes devolver un jugador a la reserva soltándolo sobre el cuadro punteado de arriba.</div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Campeón (según global de la Final)</div>
              <div className="text-xl font-bold">{champion && champion !== 'EMPATE' ? champion : '—'}</div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
