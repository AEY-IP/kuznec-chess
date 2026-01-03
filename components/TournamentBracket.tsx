'use client'

import { Match, TournamentStage } from '@/types'
import { CheckCircle, Clock, XCircle } from 'lucide-react'

interface TournamentBracketProps {
  matches: Match[]
  stage: TournamentStage
  currentUserId?: string
  onResultClick?: (match: Match) => void
}

export function TournamentBracket({ matches, stage, currentUserId, onResultClick }: TournamentBracketProps) {
  const stageMatches = matches.filter(m => m.stage === stage)
  const rounds = Array.from(new Set(stageMatches.map(m => m.round || 0))).sort((a, b) => a - b)

  const getStageTitle = () => {
    switch (stage) {
      case 'winners':
        return 'Сетка винеров'
      case 'losers':
        return 'Сетка лузеров'
      case 'final':
        return 'Финал'
      default:
        return 'Турнирная сетка'
    }
  }

  const getStatusIcon = (match: Match) => {
    if (match.status === 'confirmed') {
      return <CheckCircle className="h-5 w-5 text-green-500" />
    }
    if (match.status === 'result_pending_confirmation') {
      return <Clock className="h-5 w-5 text-yellow-500" />
    }
    return <XCircle className="h-5 w-5 text-slate-400" />
  }

  const canInteract = (match: Match) => {
    if (!currentUserId) return false
    return match.player1Id === currentUserId || match.player2Id === currentUserId
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">{getStageTitle()}</h2>
      
      <div className="space-y-8">
        {rounds.map(round => {
          const roundMatches = stageMatches.filter(m => (m.round || 0) === round)
          return (
            <div key={round}>
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-4">
                Раунд {round}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {roundMatches.map(match => {
                  const isParticipant = canInteract(match)
                  const isPending = match.status === 'result_pending_confirmation'
                  const needsConfirmation = isPending && match.result?.proposedBy && 
                    match.result.proposedBy !== currentUserId

                  return (
                    <div
                      key={match.id}
                      className={`border rounded-lg p-4 ${
                        isParticipant
                          ? 'border-primary-500 bg-primary-50/30 dark:bg-primary-900/10'
                          : 'border-slate-200 dark:border-slate-700'
                      } ${needsConfirmation ? 'ring-2 ring-yellow-500' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        {getStatusIcon(match)}
                        {needsConfirmation && (
                          <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 px-2 py-1 rounded">
                            Требует подтверждения
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <div className={`font-medium ${match.result?.player1Score === 1 ? 'text-green-600 dark:text-green-400' : ''}`}>
                          {match.player1Name}
                          {match.result && (
                            <span className="ml-2 font-bold">
                              {match.result.player1Score}
                            </span>
                          )}
                        </div>
                        <div className="text-slate-400">vs</div>
                        <div className={`font-medium ${match.result?.player2Score === 1 ? 'text-green-600 dark:text-green-400' : ''}`}>
                          {match.player2Name}
                          {match.result && (
                            <span className="ml-2 font-bold">
                              {match.result.player2Score}
                            </span>
                          )}
                        </div>
                      </div>

                      {isParticipant && onResultClick && (
                        <button
                          onClick={() => onResultClick(match)}
                          className="mt-3 w-full text-sm px-3 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
                        >
                          {match.status === 'pending' ? 'Ввести результат' : 'Изменить результат'}
                        </button>
                      )}

                      {needsConfirmation && onResultClick && (
                        <div className="mt-3 space-y-2">
                          <button
                            onClick={() => onResultClick(match)}
                            className="w-full text-sm px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                          >
                            Подтвердить
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

