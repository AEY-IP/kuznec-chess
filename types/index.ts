export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  rating?: number;
  nickname?: string; // Никнейм, выбранный пользователем при первой авторизации
  createdAt: Date;
}

export type MatchStatus = 'pending' | 'result_pending_confirmation' | 'confirmed' | 'completed';
export type TournamentStage = 'group' | 'winners' | 'losers' | 'final' | 'third_place';

export interface Match {
  id: string;
  player1Id: string;
  player2Id: string;
  player1Name: string;
  player2Name: string;
  stage: TournamentStage;
  round?: number; // для группового этапа
  result?: MatchResult;
  status: MatchStatus;
  proposedBy?: string; // id игрока, который предложил результат
  createdAt: Date;
  updatedAt: Date;
}

export type PieceColor = 'white' | 'black';

export interface MatchResult {
  player1Score: number; // 0, 0.5, 1
  player2Score: number; // 0, 0.5, 1
  proposedBy: string;
  confirmedBy?: string;
  player1Color?: PieceColor; // цвет первого игрока
  player2Color?: PieceColor; // цвет второго игрока (обратный)
  gameNumber?: number; // номер игры (1 или 2) для группового этапа
}

export interface Tournament {
  id: string;
  name: string;
  stage: TournamentStage;
  participantIds: string[]; // user ids
  matches: Match[];
  groupStageCompleted: boolean;
  winnersRoundStarted: boolean;
  finalStageStarted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GroupStageStats {
  userId: string;
  username: string;
  wins: number;
  draws: number;
  losses: number;
  points: number; // wins * 1 + draws * 0.5
  gamesPlayed: number;
  gamesRemaining: number; // сколько игр осталось сыграть
  whitePoints: number; // очки за белых
  blackPoints: number; // очки за черных
  whiteGames: number; // количество игр за белых
  blackGames: number; // количество игр за черных
}

export interface UserStats {
  totalGames: number;
  wins: number;
  draws: number;
  losses: number;
  winPercentage: number;
  drawPercentage: number;
  lossPercentage: number;
  whitePoints: number;
  blackPoints: number;
  whiteGames: number;
  blackGames: number;
  bestColor: 'white' | 'black' | 'equal';
}

