import { Match, Tournament } from '@/types';
import { storage } from './storage';

// Определение победителя и проигравшего матча
export function getMatchWinner(match: Match): { winnerId: string; loserId: string } | null {
  if (!match.result || match.status !== 'confirmed') {
    return null;
  }

  const { player1Score, player2Score } = match.result;

  if (player1Score > player2Score) {
    return { winnerId: match.player1Id, loserId: match.player2Id };
  } else if (player2Score > player1Score) {
    return { winnerId: match.player2Id, loserId: match.player1Id };
  }

  // Ничья - определяем по дополнительным критериям (можно улучшить)
  return null;
}

// Получение имени игрока по ID (использует nickname если есть, иначе username)
function getPlayerName(playerId: string): string {
  const user = storage.getUser(playerId);
  return user?.nickname || user?.username || 'TBD';
}

// Продвижение игроков в сетке винеров (топ-2, один матч)
export function advanceWinnersBracket(tournament: Tournament, completedMatch: Match): void {
  const result = getMatchWinner(completedMatch);
  if (!result) return;

  const { winnerId, loserId } = result;

  // Победитель идет в финал
  createFinalIfNeeded(tournament, winnerId);
  
  // Проигравший идет во второй тур нижней сетки
  advanceToLosersBracket(tournament, loserId, 2, 0);
}

// Создание финала если нужно
function createFinalIfNeeded(tournament: Tournament, playerId: string): void {
  // Проверяем, есть ли уже финал с этим игроком
  const existingFinal = tournament.matches.find(m => 
    m.stage === 'final' && 
    (m.player1Id === playerId || m.player2Id === playerId)
  );

  if (existingFinal) {
    // Финал уже создан, просто обновляем игрока если нужно
    return;
  }

  // Проверяем, есть ли уже финал с другим игроком
  const finalMatches = tournament.matches.filter(m => m.stage === 'final');
  
  if (finalMatches.length === 0) {
    // Создаем первую игру финала (пока без второго игрока)
    const { generateFinalMatches } = require('./tournament');
    const playerName = getPlayerName(playerId);
    
    // Создаем финал с одним игроком (второй будет добавлен позже)
    const final1 = {
      id: 'final-1',
      player1Id: playerId,
      player2Id: 'final-player-2',
      player1Name: playerName,
      player2Name: 'TBD',
      stage: 'final' as const,
      round: 1,
      status: 'pending' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const final2 = {
      id: 'final-2',
      player1Id: playerId,
      player2Id: 'final-player-2',
      player1Name: playerName,
      player2Name: 'TBD',
      stage: 'final' as const,
      round: 2,
      status: 'pending' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    tournament.matches.push(final1, final2);
    storage.updateTournament(tournament);
  } else {
    // Финал уже начат, добавляем второго игрока
    const firstFinal = finalMatches.find(m => m.round === 1);
    if (firstFinal && firstFinal.player2Name === 'TBD') {
      firstFinal.player2Id = playerId;
      firstFinal.player2Name = getPlayerName(playerId);
      
      const secondFinal = tournament.matches.find(m => m.stage === 'final' && m.round === 2);
      if (secondFinal) {
        secondFinal.player1Id = firstFinal.player1Id;
        secondFinal.player2Id = playerId;
        secondFinal.player1Name = firstFinal.player1Name;
        secondFinal.player2Name = getPlayerName(playerId);
      }
      
      storage.updateMatch(tournament.id, firstFinal);
      if (secondFinal) {
        storage.updateMatch(tournament.id, secondFinal);
      }
    }
  }
}

// Продвижение в сетку лузеров
function advanceToLosersBracket(tournament: Tournament, playerId: string, fromRound: number, matchNumber: number = 0): void {
  const playerName = getPlayerName(playerId);

  if (fromRound === 2) {
    // Проигравший из верхней сетки идет во второй тур нижней сетки
    const losersRound2 = tournament.matches.find(
      m => m.stage === 'losers' && m.round === 2 && m.id === 'losers-2'
    );

    if (losersRound2) {
      if (losersRound2.player2Name === 'TBD') {
        losersRound2.player2Id = playerId;
        losersRound2.player2Name = playerName;
      } else {
        losersRound2.player1Id = playerId;
        losersRound2.player1Name = playerName;
      }
      storage.updateMatch(tournament.id, losersRound2);
    }
  }
}

// Продвижение в сетке лузеров
export function advanceLosersBracket(tournament: Tournament, completedMatch: Match): void {
  const result = getMatchWinner(completedMatch);
  if (!result) return;

  const { winnerId } = result;
  const round = completedMatch.round || 1;

  if (round === 1) {
    // Первый раунд лузеров (losers-1) - один матч между 3-4 местами
    // Победитель идет во второй раунд лузеров
    const nextRoundMatch = tournament.matches.find(
      m => m.stage === 'losers' && m.round === 2 && m.id === 'losers-2'
    );

    if (nextRoundMatch) {
      // Победитель становится player1 во втором туре
      if (nextRoundMatch.player1Name === 'TBD') {
        nextRoundMatch.player1Id = winnerId;
        nextRoundMatch.player1Name = getPlayerName(winnerId);
        storage.updateMatch(tournament.id, nextRoundMatch);
      }
    }
    // Проигравший вылетает
  } else if (round === 2) {
    // Второй раунд лузеров - победитель идет в финал
    createFinalIfNeeded(tournament, winnerId);
    // Проигравший вылетает
  }
}

// Основная функция для обработки продвижения после подтверждения матча
export function processMatchCompletion(tournament: Tournament, match: Match): void {
  if (match.stage === 'winners') {
    advanceWinnersBracket(tournament, match);
  } else if (match.stage === 'losers') {
    advanceLosersBracket(tournament, match);
  } else if (match.stage === 'final') {
    // Для финала проверяем, нужно ли создавать третью игру
    checkFinalProgress(tournament, match);
  }
  // Для группового этапа продвижение не требуется
}

// Проверка прогресса финала (2 игры, при 1-1 третья)
function checkFinalProgress(tournament: Tournament, completedMatch: Match): void {
  const finalMatches = tournament.matches.filter(m => 
    m.stage === 'final' && 
    m.status === 'confirmed' &&
    (m.round === 1 || m.round === 2)
  );
  
  if (finalMatches.length === 2) {
    // Подсчитываем общий счет (нужно определить, кто player1, кто player2)
    const player1Id = finalMatches[0].player1Id;
    const player2Id = finalMatches[0].player2Id;
    
    let player1Total = 0;
    let player2Total = 0;
    
    finalMatches.forEach(m => {
      if (m.result) {
        // Определяем, какой игрок player1, какой player2
        if (m.player1Id === player1Id) {
          player1Total += m.result.player1Score;
          player2Total += m.result.player2Score;
        } else {
          player1Total += m.result.player2Score;
          player2Total += m.result.player1Score;
        }
      }
    });
    
    // Если счет 1-1, создаем третью игру (если еще не создана)
    if (player1Total === 1 && player2Total === 1) {
      const thirdGame = tournament.matches.find(m => m.stage === 'final' && m.round === 3);
      if (thirdGame) {
        // Третья игра уже создана
        return;
      }
      
      // Создаем третью игру
      const player1Name = getPlayerName(player1Id);
      const player2Name = getPlayerName(player2Id);
      
      const thirdGameMatch = {
        id: 'final-3',
        player1Id,
        player2Id,
        player1Name,
        player2Name,
        stage: 'final' as const,
        round: 3,
        status: 'pending' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      tournament.matches.push(thirdGameMatch);
      storage.updateTournament(tournament);
    }
  }
}

