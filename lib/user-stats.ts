import { Match, UserStats, PieceColor } from '@/types';

// Подсчет статистики пользователя
export function calculateUserStats(userId: string, matches: Match[]): UserStats {
  const userMatches = matches.filter(
    m => (m.player1Id === userId || m.player2Id === userId) && m.status === 'confirmed' && m.result
  );

  let totalGames = 0;
  let wins = 0;
  let draws = 0;
  let losses = 0;
  let whitePoints = 0;
  let blackPoints = 0;
  let whiteGames = 0;
  let blackGames = 0;

  userMatches.forEach(match => {
    const result = match.result!;
    const isPlayer1 = match.player1Id === userId;
    const playerScore = isPlayer1 ? result.player1Score : result.player2Score;
    const opponentScore = isPlayer1 ? result.player2Score : result.player1Score;

    totalGames++;

    if (playerScore > opponentScore) {
      wins++;
    } else if (playerScore < opponentScore) {
      losses++;
    } else {
      draws++;
    }

    // Определяем цвет игрока
    const playerColor = isPlayer1 
      ? (result.player1Color || (match.round === 1 ? 'white' : 'black'))
      : (result.player2Color || (match.round === 1 ? 'black' : 'white'));

    if (playerColor === 'white') {
      whitePoints += playerScore;
      whiteGames++;
    } else {
      blackPoints += playerScore;
      blackGames++;
    }
  });

  const winPercentage = totalGames > 0 ? (wins / totalGames) * 100 : 0;
  const drawPercentage = totalGames > 0 ? (draws / totalGames) * 100 : 0;
  const lossPercentage = totalGames > 0 ? (losses / totalGames) * 100 : 0;

  // Определение лучшего цвета
  let bestColor: 'white' | 'black' | 'equal';
  if (whitePoints > blackPoints) {
    bestColor = 'white';
  } else if (blackPoints > whitePoints) {
    bestColor = 'black';
  } else {
    bestColor = 'equal';
  }

  return {
    totalGames,
    wins,
    draws,
    losses,
    winPercentage: Math.round(winPercentage * 10) / 10,
    drawPercentage: Math.round(drawPercentage * 10) / 10,
    lossPercentage: Math.round(lossPercentage * 10) / 10,
    whitePoints,
    blackPoints,
    whiteGames,
    blackGames,
    bestColor,
  };
}

