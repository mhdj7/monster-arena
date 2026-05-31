import {
  ATTACK_PAIRS,
  ATTRIBUTE_LABELS_FA,
  OFFENSIVE_KEYS,
  TUNING,
} from "./constants";
import { SpeciesStats } from "./stats";

export type BattleCard = {
  name: string;
  nameFa: string;
  icon: string;
  imageUrl?: string | null;
  stats: SpeciesStats;
};

export type ClashLog = {
  clash: number;
  attackerSide: "self" | "opp";
  attackerName: string;
  attackerNameFa: string;
  attackerIcon: string;
  defenderName: string;
  defenderNameFa: string;
  defenderIcon: string;
  attackAttr: "power" | "speed" | "intelligence";
  defenseAttr: "defense" | "evasion" | "accuracy";
  attackAttrFa: string;
  defenseAttrFa: string;
  attackValue: number;
  defenseValue: number;
  winnerSide: "self" | "opp";
  scoreSelf: number;
  scoreOpp: number;
};

export type BattleResult = {
  winner: "self" | "opp";
  scoreSelf: number;
  scoreOpp: number;
  log: ClashLog[];
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Resolve a battle between two teams. First to TUNING.battlePointTarget points wins.
export function simulateBattle(
  selfTeam: BattleCard[],
  oppTeam: BattleCard[]
): BattleResult {
  const target = TUNING.battlePointTarget;
  let scoreSelf = 0;
  let scoreOpp = 0;
  const log: ClashLog[] = [];

  // alternate which side attacks; randomize who starts
  let attackerSide: "self" | "opp" = Math.random() < 0.5 ? "self" : "opp";
  let selfIdx = 0;
  let oppIdx = 0;
  let clash = 0;

  while (scoreSelf < target && scoreOpp < target) {
    clash += 1;
    const attackerTeam = attackerSide === "self" ? selfTeam : oppTeam;
    const defenderSide: "self" | "opp" = attackerSide === "self" ? "opp" : "self";
    const defenderTeam = attackerSide === "self" ? oppTeam : selfTeam;

    const attacker =
      attackerSide === "self"
        ? attackerTeam[selfIdx % attackerTeam.length]
        : attackerTeam[oppIdx % attackerTeam.length];
    const defender =
      defenderSide === "self"
        ? defenderTeam[selfIdx % defenderTeam.length]
        : defenderTeam[oppIdx % defenderTeam.length];

    const attackAttr = pick([...OFFENSIVE_KEYS]);
    const defenseAttr = ATTACK_PAIRS[attackAttr];
    const attackValue = attacker.stats[attackAttr];
    const defenseValue = defender.stats[defenseAttr];

    // attacker wins the point if its offensive stat beats the matching defense
    const winnerSide: "self" | "opp" =
      attackValue > defenseValue ? attackerSide : defenderSide;

    if (winnerSide === "self") scoreSelf += 1;
    else scoreOpp += 1;

    log.push({
      clash,
      attackerSide,
      attackerName: attacker.name,
      attackerNameFa: attacker.nameFa,
      attackerIcon: attacker.icon,
      defenderName: defender.name,
      defenderNameFa: defender.nameFa,
      defenderIcon: defender.icon,
      attackAttr,
      defenseAttr,
      attackAttrFa: ATTRIBUTE_LABELS_FA[attackAttr],
      defenseAttrFa: ATTRIBUTE_LABELS_FA[defenseAttr],
      attackValue,
      defenseValue,
      winnerSide,
      scoreSelf,
      scoreOpp,
    });

    // rotate active monster of whichever team attacked, alternate sides
    if (attackerSide === "self") selfIdx += 1;
    else oppIdx += 1;
    attackerSide = defenderSide;
  }

  return {
    winner: scoreSelf >= target ? "self" : "opp",
    scoreSelf,
    scoreOpp,
    log,
  };
}

// ---- official 3v3 = three fixed 1v1 matchups ----

export type MatchupFighter = {
  nameFa: string;
  icon: string;
  imageUrl?: string | null;
};

export type Matchup = {
  index: number; // 1..3
  self: MatchupFighter;
  opp: MatchupFighter;
  result: BattleResult; // the 1v1 clash-by-clash result
  winner: "self" | "opp";
};

export type OfficialResult = {
  winner: "self" | "opp";
  winsSelf: number;
  winsOpp: number;
  matchups: Matchup[];
};

function fighter(card: BattleCard): MatchupFighter {
  return { nameFa: card.nameFa, icon: card.icon, imageUrl: card.imageUrl };
}

// Official battle: card[i] fights opp[i] in a separate 1v1. The team that wins
// more of the individual matchups wins overall.
export function simulateOfficial(
  selfTeam: BattleCard[],
  oppTeam: BattleCard[]
): OfficialResult {
  const n = Math.min(selfTeam.length, oppTeam.length);
  const matchups: Matchup[] = [];
  let winsSelf = 0;
  let winsOpp = 0;

  for (let i = 0; i < n; i++) {
    const self = selfTeam[i];
    const opp = oppTeam[i];
    const result = simulateBattle([self], [opp]);
    if (result.winner === "self") winsSelf += 1;
    else winsOpp += 1;
    matchups.push({
      index: i + 1,
      self: fighter(self),
      opp: fighter(opp),
      result,
      winner: result.winner,
    });
  }

  return {
    winner: winsSelf >= winsOpp ? "self" : "opp",
    winsSelf,
    winsOpp,
    matchups,
  };
}
