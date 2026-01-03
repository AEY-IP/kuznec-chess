'use client'

import { Match } from '@/types'
import { CheckCircle, Clock, XCircle } from 'lucide-react'

interface BracketTreeProps {
  matches: Match[]
  stage: 'winners' | 'losers' | 'final'
  currentUserId?: string
  onResultClick?: (match: Match) => void
}

export function BracketTree({ matches, stage, currentUserId, onResultClick }: BracketTreeProps) {
  const stageMatches = matches.filter(m => m.stage === stage)
  const rounds = Array.from(new Set(stageMatches.map(m => m.round || 0))).sort((a, b) => a - b)

  const getStatusIcon = (match: Match) => {
    if (match.status === 'confirmed') {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    }
    if (match.status === 'result_pending_confirmation') {
      return <Clock className="h-4 w-4 text-yellow-500" />
    }
    return <XCircle className="h-4 w-4 text-slate-400" />
  }

  const canInteract = (match: Match) => {
    if (!currentUserId) return false
    return match.player1Id === currentUserId || match.player2Id === currentUserId
  }

  const getWinner = (match: Match): string | null => {
    if (!match.result || match.status !== 'confirmed') return null
    if (match.result.player1Score > match.result.player2Score) return match.player1Id
    if (match.result.player2Score > match.result.player1Score) return match.player2Id
    return null
  }

  const getMatchCard = (match: Match) => {
    const isParticipant = canInteract(match)
    const isPending = match.status === 'result_pending_confirmation'
    const needsConfirmation = isPending && match.result?.proposedBy && 
      match.result.proposedBy !== currentUserId

    const winnerId = getWinner(match)
    const hasResult = match.result && match.status === 'confirmed'

    return (
      <div
        className={`relative border rounded-lg min-w-[200px] transition-all ${
          isParticipant
            ? 'border-primary-500 bg-primary-50/30 dark:bg-primary-900/10'
            : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
        } ${needsConfirmation ? 'ring-2 ring-yellow-500' : ''} ${
          winnerId ? 'shadow-md border-green-500' : ''
        }`}
      >
        {/* Статус и подтверждение */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-1.5">
            {getStatusIcon(match)}
            {needsConfirmation && (
              <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 px-1.5 py-0.5 rounded">
                Подтвердить
              </span>
            )}
          </div>
        </div>

        {/* Игроки и счет */}
        <div className="py-2">
          <div className={`flex items-center justify-between px-3 py-2 ${
            winnerId === match.player1Id 
              ? 'bg-green-50 dark:bg-green-900/20 font-semibold' 
              : 'bg-white dark:bg-slate-800'
          }`}>
            <span className={`text-sm ${
              winnerId === match.player1Id 
                ? 'text-green-700 dark:text-green-300' 
                : 'text-slate-700 dark:text-slate-300'
            }`}>
              {match.player1Name}
            </span>
            {hasResult && (
              <span className={`text-sm font-bold ${
                winnerId === match.player1Id 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-slate-600 dark:text-slate-400'
              }`}>
                {match.result!.player1Score}
              </span>
            )}
          </div>
          
          <div className={`flex items-center justify-between px-3 py-2 border-t border-slate-100 dark:border-slate-700 ${
            winnerId === match.player2Id 
              ? 'bg-green-50 dark:bg-green-900/20 font-semibold' 
              : 'bg-white dark:bg-slate-800'
          }`}>
            <span className={`text-sm ${
              winnerId === match.player2Id 
                ? 'text-green-700 dark:text-green-300' 
                : 'text-slate-700 dark:text-slate-300'
            }`}>
              {match.player2Name}
            </span>
            {hasResult && (
              <span className={`text-sm font-bold ${
                winnerId === match.player2Id 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-slate-600 dark:text-slate-400'
              }`}>
                {match.result!.player2Score}
              </span>
            )}
          </div>
        </div>

        {/* Кнопка действия */}
        {isParticipant && onResultClick && (
          <div className="px-3 pb-2">
            <button
              onClick={() => onResultClick(match)}
              className="w-full text-xs px-2 py-1.5 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
            >
              {match.status === 'pending' ? 'Ввести результат' : 'Изменить'}
            </button>
          </div>
        )}
      </div>
    )
  }

  // Организуем матчи по раундам
  const organizeMatches = () => {
    const organized: { round: number; matches: Match[] }[] = []
    
    rounds.forEach(round => {
      const roundMatches = stageMatches
        .filter(m => (m.round || 0) === round)
        .sort((a, b) => a.id.localeCompare(b.id))
      organized.push({ round, matches: roundMatches })
    })
    
    return organized
  }

  const organizedRounds = organizeMatches()
  const matchHeight = 120
  const matchGap = 24
  const connectorWidth = 80

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 overflow-x-auto">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
        {stage === 'winners' ? 'Верхняя сетка (Топ-2)' :
         stage === 'losers' ? 'Нижняя сетка (3-4 места)' :
         'Финал'}
      </h2>

      <div className="relative flex items-start py-2">
        {organizedRounds.map((roundData, roundIndex) => {
          const isLastRound = roundIndex === organizedRounds.length - 1
          const roundHeight = roundData.matches.length * matchHeight + (roundData.matches.length - 1) * matchGap
          
          return (
            <div key={roundData.round} className="flex items-start relative">
              {/* Колонка с матчами */}
              <div className="flex flex-col relative">
                {/* Заголовок раунда */}
                <div className="text-center mb-3">
                  <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                    {isLastRound && stage === 'final' 
                      ? 'Финал' 
                      : stage === 'winners' && roundData.round === 1
                        ? '1/2 финала'
                        : stage === 'losers' && roundData.round === 1
                          ? 'Раунд 1'
                          : stage === 'losers' && roundData.round === 2
                            ? 'Раунд 2'
                            : stage === 'losers' && roundData.round === 3
                              ? 'Полуфинал'
                              : stage === 'losers' && roundData.round === 4
                                ? 'Финал нижней сетки'
                                : `Раунд ${roundData.round}`}
                  </h3>
                </div>

                {/* Матчи */}
                <div className="flex flex-col gap-6">
                  {roundData.matches.map((match, matchIndex) => (
                    <div key={match.id} className="relative">
                      {getMatchCard(match)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Соединения между раундами */}
              {!isLastRound && (
                <div 
                  className="relative flex-shrink-0"
                  style={{ 
                    width: `${connectorWidth}px`,
                    height: `${roundHeight}px`,
                    marginTop: '40px',
                  }}
                >
                  <svg
                    width={connectorWidth}
                    height={roundHeight}
                    className="absolute top-0 left-0"
                    style={{ overflow: 'visible' }}
                  >
                    {roundData.matches.map((match, matchIndex) => {
                      const y = matchIndex * (matchHeight + matchGap) + matchHeight / 2
                      const isFirst = matchIndex === 0
                      const isLast = matchIndex === roundData.matches.length - 1
                      
                      return (
                        <g key={match.id}>
                          {/* Горизонтальная линия вправо от матча */}
                          <line
                            x1="0"
                            y1={y}
                            x2={connectorWidth / 2}
                            y2={y}
                            stroke="#64748b"
                            strokeWidth="2.5"
                            className="dark:stroke-slate-500"
                          />
                          
                          {/* Вертикальная линия для соединения всех матчей */}
                          {roundData.matches.length > 1 && (
                            <line
                              x1={connectorWidth / 2}
                              y1={isFirst ? y : 0}
                              x2={connectorWidth / 2}
                              y2={isLast ? y : roundHeight}
                              stroke="#64748b"
                              strokeWidth="2.5"
                              className="dark:stroke-slate-500"
                            />
                          )}
                          
                          {/* Горизонтальная линия к следующему раунду */}
                          <line
                            x1={connectorWidth / 2}
                            y1={y}
                            x2={connectorWidth}
                            y2={y}
                            stroke="#64748b"
                            strokeWidth="2.5"
                            className="dark:stroke-slate-500"
                          />
                        </g>
                      )
                    })}
                  </svg>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
