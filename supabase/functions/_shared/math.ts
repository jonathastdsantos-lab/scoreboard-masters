// _shared/math.ts

export interface SquadRatings {
  attack: number;
  defense: number;
}

export function calculateGoalProbability(
  attackerStats: SquadRatings,
  defenderStats: SquadRatings
): number {
  // Base chance per 10-minute block
  const baseChance = 0.08; 
  
  // Calculate delta: Attack vs Defense
  const delta = attackerStats.attack - defenderStats.defense;
  
  // Each point of delta adds or subtracts 1% chance (0.01)
  // Example: 85 ATK vs 75 DEF = +10 delta = +0.10 chance = 18% total chance
  const adjustedChance = baseChance + (delta * 0.01);
  
  // Cap the probabilities between 2% and 30% per block
  return Math.max(0.02, Math.min(0.30, adjustedChance));
}

export function simulateBlock(
  matchId: string,
  blockNumber: number,
  teamAStats: SquadRatings,
  teamBStats: SquadRatings
): { scoringTeam: 'A' | 'B' | null } {
  const chanceA = calculateGoalProbability(teamAStats, teamBStats);
  const chanceB = calculateGoalProbability(teamBStats, teamAStats);
  
  // Use a pseudo-random approach based on time and matchId for variation,
  // but Math.random() is fine for live since edge function handles it centrally.
  const roll = Math.random();
  
  // Team A rolls first (home advantage)
  if (roll < chanceA) {
    return { scoringTeam: 'A' };
  }
  
  // Team B rolls in the remaining probability space
  const rollB = Math.random();
  if (rollB < chanceB) {
    return { scoringTeam: 'B' };
  }
  
  return { scoringTeam: null };
}

export function calculateNewElo(playerElo: number, opponentElo: number, actualScore: number): number {
  // K-factor determines how much the rating changes
  const K = 32;
  
  // Expected score (0 to 1)
  const expectedScore = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
  
  // New Elo
  return Math.round(playerElo + K * (actualScore - expectedScore));
}
