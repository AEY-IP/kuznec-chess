import { User, Tournament, Match } from '@/types';
import { generateGroupStageMatches } from './tournament';

// Глобальное хранилище для переживания hot reload
const globalForStorage = global as typeof globalThis & {
  storageUsers?: Map<string, User>;
  storageTournaments?: Map<string, Tournament>;
  storageCurrentTournamentId?: string | null;
  storageCurrentUserId?: string | null;
};

// Простое хранилище в памяти (в продакшене использовать БД)
class Storage {
  private users: Map<string, User>;
  private tournaments: Map<string, Tournament>;
  private currentTournamentId: string | null;
  private currentUserId: string | null;

  constructor() {
    // Используем глобальное хранилище для переживания hot reload
    this.users = globalForStorage.storageUsers ?? new Map();
    this.tournaments = globalForStorage.storageTournaments ?? new Map();
    this.currentTournamentId = globalForStorage.storageCurrentTournamentId ?? null;
    this.currentUserId = globalForStorage.storageCurrentUserId ?? null;

    // Сохраняем ссылки в глобальное хранилище
    globalForStorage.storageUsers = this.users;
    globalForStorage.storageTournaments = this.tournaments;
    globalForStorage.storageCurrentTournamentId = this.currentTournamentId;
    globalForStorage.storageCurrentUserId = this.currentUserId;
  }

  // Users
  addUser(user: User): void {
    this.users.set(user.id, user);
  }

  getUser(id: string): User | undefined {
    return this.users.get(id);
  }

  getUserByEmail(email: string): User | undefined {
    return Array.from(this.users.values()).find(u => u.email === email);
  }

  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  updateUser(user: User): void {
    this.users.set(user.id, user);
  }

  createUser(user: User): User {
    this.users.set(user.id, user);
    return user;
  }

  // Tournament
  addTournament(tournament: Tournament): void {
    // Если турнир уже существует, не перезаписываем его (сохраняем существующие данные)
    const existing = this.tournaments.get(tournament.id);
    if (existing) {
      console.log('Tournament already exists, not overwriting:', tournament.id);
      return;
    }
    this.tournaments.set(tournament.id, tournament);
  }

  getTournament(id: string): Tournament | undefined {
    return this.tournaments.get(id);
  }

  getCurrentTournament(): Tournament | undefined {
    if (!this.currentTournamentId) return undefined;
    return this.tournaments.get(this.currentTournamentId);
  }

  setCurrentTournament(id: string): void {
    this.currentTournamentId = id;
    globalForStorage.storageCurrentTournamentId = id;
  }

  updateTournament(tournament: Tournament): void {
    this.tournaments.set(tournament.id, tournament);
  }

  createTournament(tournament: Tournament): Tournament {
    this.tournaments.set(tournament.id, tournament);
    this.setCurrentTournament(tournament.id);
    return tournament;
  }

  // Current user
  setCurrentUser(id: string | null): void {
    this.currentUserId = id;
    globalForStorage.storageCurrentUserId = id;
  }

  getCurrentUser(): User | undefined {
    if (!this.currentUserId) return undefined;
    return this.users.get(this.currentUserId);
  }

  // Matches
  updateMatch(tournamentId: string, match: Match): void {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) {
      console.error('Storage: Tournament not found for updateMatch:', tournamentId);
      return;
    }

    const index = tournament.matches.findIndex(m => m.id === match.id);
    if (index === -1) {
      console.error('Storage: Match not found in tournament:', match.id);
      return;
    }

    // Создаем новый массив матчей с обновленным матчем
    const updatedMatches = [...tournament.matches];
    // Создаем полностью новый объект матча, чтобы избежать проблем с мутацией
    updatedMatches[index] = {
      ...match,
      result: match.result ? { ...match.result } : undefined,
    };
    // Создаем новый объект турнира с обновленным массивом матчей
    const updatedTournament = {
      ...tournament,
      matches: updatedMatches,
    };
    this.tournaments.set(tournamentId, updatedTournament);
    
    console.log('Storage: Tournament updated, match count:', updatedMatches.length)
    
    // Проверяем, что матч действительно обновился
    const verifyMatch = this.tournaments.get(tournamentId)?.matches.find(m => m.id === match.id);
    if (verifyMatch) {
      console.log('Storage: Match updated successfully:', {
        matchId: match.id,
        status: verifyMatch.status,
        proposedBy: verifyMatch.result?.proposedBy,
        tournamentId,
        totalMatches: this.tournaments.get(tournamentId)?.matches.length
      });
      
      if (verifyMatch.status !== match.status) {
        console.error('Storage: WARNING - Match status mismatch!', {
          expected: match.status,
          actual: verifyMatch.status,
          matchId: match.id,
          tournamentId
        });
      }
      
      // Дополнительная проверка: сравниваем все поля
      if (JSON.stringify(verifyMatch) !== JSON.stringify(match)) {
        console.warn('Storage: Match object differs from expected:', {
          matchId: match.id,
          verifyMatch: JSON.stringify(verifyMatch),
          expectedMatch: JSON.stringify(match)
        });
      }
    } else {
      console.error('Storage: ERROR - Match was not found after update!', {
        matchId: match.id,
        tournamentId,
        tournamentExists: !!this.tournaments.get(tournamentId)
      });
    }
  }

  getMatch(tournamentId: string, matchId: string): Match | undefined {
    const tournament = this.tournaments.get(tournamentId);
    return tournament?.matches.find(m => m.id === matchId);
  }
}

// Singleton instance
export const storage = new Storage();

// Инициализация тестовых данных
export function initializeTestData() {
  // Проверка, не инициализированы ли уже данные
  const existingTournament = storage.getTournament('tournament-1');
  if (storage.getAllUsers().length > 0 && existingTournament) {
    console.log('Storage: Test data already initialized, skipping');
    return; // Данные уже инициализированы
  }
  
  console.log('Storage: Initializing test data...', {
    usersCount: storage.getAllUsers().length,
    tournamentExists: !!existingTournament
  });

  // 8 пользователей для турнира
  const users: User[] = [
    { 
      id: 'user-1', 
      username: 'Nickolay', 
      email: 'nickolay@chess.com', 
      role: 'user', 
      rating: 1500,
      nickname: 'Nickolay',
      createdAt: new Date() 
    },
    { 
      id: 'user-2', 
      username: 'Sergey', 
      email: 'sergey@chess.com', 
      role: 'user', 
      rating: 1600,
      nickname: 'Sergey',
      createdAt: new Date() 
    },
    { 
      id: 'user-3', 
      username: 'Elizabeth', 
      email: 'elizabeth@chess.com', 
      role: 'user', 
      rating: 1550,
      nickname: 'Elizabeth',
      createdAt: new Date() 
    },
    { 
      id: 'user-4', 
      username: 'Pavel', 
      email: 'pavel@chess.com', 
      role: 'user', 
      rating: 1650,
      nickname: 'Pavel',
      createdAt: new Date() 
    },
    { 
      id: 'user-5', 
      username: 'Roman', 
      email: 'roman@chess.com', 
      role: 'user', 
      rating: 1520,
      nickname: 'Roman',
      createdAt: new Date() 
    },
    { 
      id: 'user-6', 
      username: 'Polina', 
      email: 'polina@chess.com', 
      role: 'user', 
      rating: 1580,
      nickname: 'Polina',
      createdAt: new Date() 
    },
    { 
      id: 'user-7', 
      username: 'Alexander', 
      email: 'alexander@chess.com', 
      role: 'user', 
      rating: 1620,
      nickname: 'Alexander',
      createdAt: new Date() 
    },
    { 
      id: 'user-8', 
      username: 'Alexey', 
      email: 'alexey@chess.com', 
      role: 'user', 
      rating: 1590,
      nickname: 'Alexey',
      createdAt: new Date() 
    },
  ];

  users.forEach(user => storage.addUser(user));

  // Тестовый турнир (все 8 пользователей)
  const participantIds = users.map(u => u.id);
  const participantNames: Record<string, string> = {};
  participantIds.forEach(id => {
    const user = users.find(u => u.id === id);
    if (user) participantNames[id] = user.nickname || user.username;
  });

  // Генерируем матчи группового этапа
  const groupMatches = generateGroupStageMatches(participantIds, participantNames);

  // Заполняем рандомными результатами (каждый сыграл 10 игр из 14)
  // Для каждого игрока выбираем случайные 10 матчей из его возможных 14
  const matchesWithResults: Match[] = [];
  const playerMatchCount: Record<string, number> = {};
  participantIds.forEach(id => {
    playerMatchCount[id] = 0;
  });

  // Группируем матчи по игрокам
  const playerMatches: Record<string, Match[]> = {};
  participantIds.forEach(id => {
    playerMatches[id] = groupMatches.filter(m => m.player1Id === id || m.player2Id === id);
  });

  // Для каждого игрока выбираем детерминированные 10 матчей
  // Используем фиксированный seed для стабильности результатов
  const matchesToFill = new Set<string>();
  
  participantIds.forEach(id => {
    // Сортируем матчи по ID для детерминированности
    const playerGames = [...playerMatches[id]].sort((a, b) => a.id.localeCompare(b.id));
    // Берем первые 10 матчей для каждого игрока (детерминированно)
    const selectedGames = playerGames.slice(0, 10);
    selectedGames.forEach(match => {
      matchesToFill.add(match.id);
    });
  });

  // Заполняем выбранные матчи результатами
  for (const match of groupMatches) {
    if (matchesToFill.has(match.id)) {
      // Генерируем детерминированный результат на основе ID матча
      // Это гарантирует, что результаты не будут меняться при перезагрузке
      const matchHash = match.id.split('-').reduce((acc, val) => acc + parseInt(val.replace(/\D/g, '') || '0'), 0);
      const rand = (matchHash % 100) / 100;
      let player1Score: number;
      let player2Score: number;

      if (rand < 0.4) {
        // 40% вероятность победы первого игрока
        player1Score = 1;
        player2Score = 0;
      } else if (rand < 0.8) {
        // 40% вероятность победы второго игрока
        player1Score = 0;
        player2Score = 1;
      } else {
        // 20% вероятность ничьей
        player1Score = 0.5;
        player2Score = 0.5;
      }

      match.result = {
        player1Score,
        player2Score,
        proposedBy: match.player1Id,
        confirmedBy: match.player2Id,
      };
      match.status = 'confirmed';
    }
    matchesWithResults.push(match);
  }

  // Проверяем, существует ли уже турнир с таким ID
  if (!existingTournament) {
    const tournament: Tournament = {
      id: 'tournament-1',
      name: 'Шахматный турнир 2024',
      stage: 'group',
      participantIds: participantIds,
      matches: matchesWithResults,
      groupStageCompleted: false,
      winnersRoundStarted: false,
      finalStageStarted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    storage.addTournament(tournament);
    storage.setCurrentTournament(tournament.id);
  } else {
    // Турнир уже существует, просто убеждаемся, что он установлен как текущий
    storage.setCurrentTournament('tournament-1');
  }
}

