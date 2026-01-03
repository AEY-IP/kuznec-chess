import { Match, Tournament, TournamentStage, GroupStageStats, MatchResult } from '@/types';

// Генерация всех матчей для группового этапа (каждый с каждым, по 2 игры)
export function generateGroupStageMatches(participantIds: string[], participantNames: Record<string, string>): Match[] {
  const matches: Match[] = [];
  let matchId = 1;

  for (let i = 0; i < participantIds.length; i++) {
    for (let j = i + 1; j < participantIds.length; j++) {
      // Первая игра: player1 белые, player2 черные
      matches.push({
        id: `group-${matchId++}`,
        player1Id: participantIds[i],
        player2Id: participantIds[j],
        player1Name: participantNames[participantIds[i]],
        player2Name: participantNames[participantIds[j]],
        stage: 'group',
        round: 1,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      // Вторая игра: player1 черные, player2 белые
      matches.push({
        id: `group-${matchId++}`,
        player1Id: participantIds[i],
        player2Id: participantIds[j],
        player1Name: participantNames[participantIds[i]],
        player2Name: participantNames[participantIds[j]],
        stage: 'group',
        round: 2,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  return matches;
}

// Генерация сетки винеров (топ-2, один матч → финал)
export function generateWinnersBracket(participantIds: string[], participantNames: Record<string, string>): Match[] {
  if (participantIds.length !== 2) {
    throw new Error('Winners bracket requires exactly 2 participants (top-2)');
  }

  const matches: Match[] = [];

  // Один матч между топ-2
  matches.push({
    id: 'winners-1',
    player1Id: participantIds[0],
    player2Id: participantIds[1],
    player1Name: participantNames[participantIds[0]],
    player2Name: participantNames[participantIds[1]],
    stage: 'winners',
    round: 1,
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return matches;
}

// Генерация сетки лузеров (3-4 места, 2 матча → финал)
export function generateLosersBracket(participantIds: string[], participantNames: Record<string, string>): Match[] {
  if (participantIds.length !== 2) {
    throw new Error('Losers bracket requires exactly 2 participants (3-4 places)');
  }

  const matches: Match[] = [];

  // Первый тур лузеров (между 3-4 местами)
  matches.push({
    id: 'losers-1',
    player1Id: participantIds[0],
    player2Id: participantIds[1],
    player1Name: participantNames[participantIds[0]],
    player2Name: participantNames[participantIds[1]],
    stage: 'losers',
    round: 1,
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Второй тур лузеров (победитель первого тура vs проигравший из верхней сетки)
  matches.push({
    id: 'losers-2',
    player1Id: 'loser-winner-1', // placeholder - победитель первого тура
    player2Id: 'loser-from-winners', // placeholder - проигравший из верхней сетки
    player1Name: 'TBD',
    player2Name: 'TBD',
    stage: 'losers',
    round: 2,
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return matches;
}

// Генерация финала (2 игры, при 1-1 третья)
export function generateFinalMatches(player1Id: string, player2Id: string, player1Name: string, player2Name: string): Match[] {
  const matches: Match[] = [];

  // Первая игра финала
  matches.push({
    id: 'final-1',
    player1Id,
    player2Id,
    player1Name,
    player2Name,
    stage: 'final',
    round: 1,
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Вторая игра финала
  matches.push({
    id: 'final-2',
    player1Id,
    player2Id,
    player1Name,
    player2Name,
    stage: 'final',
    round: 2,
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Третья игра финала (если понадобится)
  matches.push({
    id: 'final-3',
    player1Id,
    player2Id,
    player1Name,
    player2Name,
    stage: 'final',
    round: 3,
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return matches;
}

// Подсчет статистики группового этапа
export function calculateGroupStageStats(
  matches: Match[],
  participantIds: string[],
  participantNames: Record<string, string>
): GroupStageStats[] {
  const stats: Record<string, GroupStageStats> = {};

  // Инициализация
  const totalGamesPerPlayer = (participantIds.length - 1) * 2; // по 2 игры с каждым
  participantIds.forEach(id => {
    stats[id] = {
      userId: id,
      username: participantNames[id] || 'TBD',
      wins: 0,
      draws: 0,
      losses: 0,
      points: 0,
      gamesPlayed: 0,
      gamesRemaining: totalGamesPerPlayer,
      whitePoints: 0,
      blackPoints: 0,
      whiteGames: 0,
      blackGames: 0,
    };
  });

  // Подсчет результатов
  matches
    .filter(m => m.stage === 'group' && m.status === 'confirmed' && m.result)
    .forEach(match => {
      const result = match.result!;
      const p1Stats = stats[match.player1Id];
      const p2Stats = stats[match.player2Id];

      p1Stats.gamesPlayed++;
      p2Stats.gamesPlayed++;
      p1Stats.gamesRemaining--;
      p2Stats.gamesRemaining--;

      // Определяем цвета (player1 всегда первый в паре, значит в первой игре белые, во второй черные)
      const isFirstGame = match.round === 1;
      const p1Color = isFirstGame ? 'white' : 'black';
      const p2Color = isFirstGame ? 'black' : 'white';

      if (result.player1Score > result.player2Score) {
        p1Stats.wins++;
        p1Stats.points += 1;
        p2Stats.losses++;
        // Очки за цвет
        if (p1Color === 'white') {
          p1Stats.whitePoints += 1;
          p1Stats.whiteGames++;
          p2Stats.blackGames++;
        } else {
          p1Stats.blackPoints += 1;
          p1Stats.blackGames++;
          p2Stats.whiteGames++;
        }
      } else if (result.player1Score < result.player2Score) {
        p2Stats.wins++;
        p2Stats.points += 1;
        p1Stats.losses++;
        // Очки за цвет
        if (p2Color === 'white') {
          p2Stats.whitePoints += 1;
          p2Stats.whiteGames++;
          p1Stats.blackGames++;
        } else {
          p2Stats.blackPoints += 1;
          p2Stats.blackGames++;
          p1Stats.whiteGames++;
        }
      } else {
        p1Stats.draws++;
        p1Stats.points += 0.5;
        p2Stats.draws++;
        p2Stats.points += 0.5;
        // Очки за цвет (ничья)
        if (p1Color === 'white') {
          p1Stats.whitePoints += 0.5;
          p1Stats.whiteGames++;
          p2Stats.blackPoints += 0.5;
          p2Stats.blackGames++;
        } else {
          p1Stats.blackPoints += 0.5;
          p1Stats.blackGames++;
          p2Stats.whitePoints += 0.5;
          p2Stats.whiteGames++;
        }
      }
    });

  return Object.values(stats).sort((a, b) => {
    // 1. Сортировка по очкам
    if (b.points !== a.points) return b.points - a.points;
    
    // 2. При равных очках - по количеству побед
    if (b.wins !== a.wins) return b.wins - a.wins;
    
    // 3. При равных победах - по разнице забитых/пропущенных (голы)
    const aGoalDiff = calculateGoalDifference(matches, a.userId);
    const bGoalDiff = calculateGoalDifference(matches, b.userId);
    if (bGoalDiff !== aGoalDiff) return bGoalDiff - aGoalDiff;
    
    // 4. При равной разнице - по количеству забитых
    const aGoalsFor = calculateGoalsFor(matches, a.userId);
    const bGoalsFor = calculateGoalsFor(matches, b.userId);
    if (bGoalsFor !== aGoalsFor) return bGoalsFor - aGoalsFor;
    
    // 5. Личная встреча (если есть)
    const headToHead = getHeadToHeadResult(matches, a.userId, b.userId);
    if (headToHead !== 0) return headToHead;
    
    return 0;
  });
}

// Вспомогательные функции для разрешения ничьих
function calculateGoalDifference(matches: Match[], userId: string): number {
  let goalsFor = 0;
  let goalsAgainst = 0;
  
  matches
    .filter(m => m.stage === 'group' && m.status === 'confirmed' && m.result)
    .filter(m => m.player1Id === userId || m.player2Id === userId)
    .forEach(match => {
      const result = match.result!;
      if (match.player1Id === userId) {
        goalsFor += result.player1Score;
        goalsAgainst += result.player2Score;
      } else {
        goalsFor += result.player2Score;
        goalsAgainst += result.player1Score;
      }
    });
  
  return goalsFor - goalsAgainst;
}

function calculateGoalsFor(matches: Match[], userId: string): number {
  let goalsFor = 0;
  
  matches
    .filter(m => m.stage === 'group' && m.status === 'confirmed' && m.result)
    .filter(m => m.player1Id === userId || m.player2Id === userId)
    .forEach(match => {
      const result = match.result!;
      if (match.player1Id === userId) {
        goalsFor += result.player1Score;
      } else {
        goalsFor += result.player2Score;
      }
    });
  
  return goalsFor;
}

function getHeadToHeadResult(matches: Match[], userId1: string, userId2: string): number {
  let user1Points = 0;
  let user2Points = 0;
  
  matches
    .filter(m => m.stage === 'group' && m.status === 'confirmed' && m.result)
    .filter(m => 
      (m.player1Id === userId1 && m.player2Id === userId2) ||
      (m.player1Id === userId2 && m.player2Id === userId1)
    )
    .forEach(match => {
      const result = match.result!;
      if (match.player1Id === userId1) {
        if (result.player1Score > result.player2Score) user1Points += 1;
        else if (result.player1Score < result.player2Score) user2Points += 1;
        else { user1Points += 0.5; user2Points += 0.5; }
      } else {
        if (result.player2Score > result.player1Score) user1Points += 1;
        else if (result.player2Score < result.player1Score) user2Points += 1;
        else { user1Points += 0.5; user2Points += 0.5; }
      }
    });
  
  if (user1Points > user2Points) return -1; // user1 выше
  if (user2Points > user1Points) return 1;  // user2 выше
  return 0; // все еще равны
}

// Получение топ-4 для финального этапа
export function getTop4Participants(stats: GroupStageStats[]): string[] {
  return stats.slice(0, 4).map(s => s.userId);
}

// Получение топ-2 для верхней сетки
export function getTop2Participants(stats: GroupStageStats[]): string[] {
  return stats.slice(0, 2).map(s => s.userId);
}

// Получение 3-4 мест для нижней сетки
export function getPlaces3And4(stats: GroupStageStats[]): string[] {
  return stats.slice(2, 4).map(s => s.userId);
}

