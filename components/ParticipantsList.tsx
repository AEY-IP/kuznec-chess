'use client'

import { useState } from 'react'
import { User, Match, Tournament } from '@/types'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface ParticipantsListProps {
  participants: User[]
  currentUserId: string
  tournament: Tournament | null
}

interface ParticipantInfo {
  user: User
  gamesRemaining: number
  gamesPlayed: number
  playerScore: number
  opponentScore: number
  matches: Match[]
}

export function ParticipantsList({ participants, currentUserId, tournament }: ParticipantsListProps) {
  const [expandedParticipants, setExpandedParticipants] = useState<Record<string, boolean>>({})
  const [activeTab, setActiveTab] = useState<'group' | 'final'>('group')

  const toggleExpand = (userId: string) => {
    setExpandedParticipants(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }))
  }

  if (!tournament) return null

  // Получаем информацию о каждом участнике для группового тура
  const getParticipantInfo = (participant: User): ParticipantInfo => {
    const matchesWithParticipant = tournament.matches.filter(m =>
      (m.player1Id === currentUserId && m.player2Id === participant.id) ||
      (m.player1Id === participant.id && m.player2Id === currentUserId)
    )

    const groupMatches = matchesWithParticipant.filter(m => m.stage === 'group')
    const confirmedGroupMatches = groupMatches.filter(m => m.status === 'confirmed')
    
    const gamesPlayed = confirmedGroupMatches.length
    const gamesRemaining = 2 - gamesPlayed

    let playerScore = 0
    let opponentScore = 0

    confirmedGroupMatches.forEach(match => {
      if (!match.result) return
      
      const isPlayer1 = match.player1Id === currentUserId
      const playerScoreInMatch = isPlayer1 ? match.result.player1Score : match.result.player2Score
      const opponentScoreInMatch = isPlayer1 ? match.result.player2Score : match.result.player1Score

      playerScore += playerScoreInMatch
      opponentScore += opponentScoreInMatch
    })

    return {
      user: participant,
      gamesRemaining,
      gamesPlayed,
      playerScore,
      opponentScore,
      matches: groupMatches,
    }
  }

  const participantsInfo = participants
    .filter(p => p.id !== currentUserId)
    .map(getParticipantInfo)

  // Финальный тур
  const getFinalStageMatches = () => {
    return tournament.matches.filter(m => 
      m.stage === 'winners' || m.stage === 'losers' || m.stage === 'final' || m.stage === 'third_place'
    )
  }

  const getPlayerFinalMatches = (userId: string) => {
    const finalMatches = getFinalStageMatches()
    return finalMatches.filter(m => m.player1Id === userId || m.player2Id === userId)
  }

  const getMatchResultText = (match: Match, userId: string) => {
    if (match.status !== 'confirmed' || !match.result) {
      return { text: 'Ожидается', color: 'text-gray-500', icon: '⏳' }
    }

    const isPlayer1 = match.player1Id === userId
    const playerScore = isPlayer1 ? match.result.player1Score : match.result.player2Score
    const opponentScore = isPlayer1 ? match.result.player2Score : match.result.player1Score

    if (playerScore > opponentScore) {
      return { text: 'Победа', color: 'text-accent-mint', icon: '✓' }
    } else if (playerScore < opponentScore) {
      return { text: 'Поражение', color: 'text-red-500', icon: '✗' }
    } else {
      return { text: 'Ничья', color: 'text-yellow-500', icon: '=' }
    }
  }

  const getMatchStage = (matchId: string) => {
    if (matchId === 'winners-1') return '1 тур • Верхняя сетка'
    if (matchId === 'losers-1') return '1 тур • Нижняя сетка'
    if (matchId === 'losers-2') return '2 тур • Нижняя сетка'
    if (matchId.startsWith('final-')) return 'Финал'
    if (matchId === 'third_place') return 'Матч за 3-е место'
    return 'Финальный этап'
  }

  const finalStageParticipants = participants.filter(p => {
    const matches = getPlayerFinalMatches(p.id)
    return matches.length > 0
  })

  return (
    <div className="bg-gradient-to-br from-white to-blue-50 rounded-3xl shadow-2xl p-8 border-2 border-primary/10">
      {/* Табы */}
      <div className="flex space-x-2 mb-6 border-b-2 border-gray-200">
        <button
          onClick={() => setActiveTab('group')}
          className={`px-6 py-3 font-bold text-lg transition-all duration-300 border-b-4 ${
            activeTab === 'group'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-primary'
          }`}
        >
          Групповой тур
        </button>
        <button
          onClick={() => setActiveTab('final')}
          className={`px-6 py-3 font-bold text-lg transition-all duration-300 border-b-4 ${
            activeTab === 'final'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-primary'
          }`}
        >
          Финальный тур
        </button>
      </div>

      <h2 className="text-3xl font-bold text-primary mb-6 flex items-center space-x-3">
        <span className="text-4xl">👥</span>
        <span>{activeTab === 'group' ? 'Участники турнира' : 'Участники финального тура'}</span>
      </h2>

      {/* Контент в зависимости от активной вкладки */}
      {activeTab === 'group' ? (
        <div className="space-y-4">
          {participantsInfo.map(info => {
            const isExpanded = expandedParticipants[info.user.id]

            return (
              <div 
                key={info.user.id}
                className="border-2 border-primary/10 rounded-2xl overflow-hidden bg-white hover:border-primary/30 transition-all duration-300"
              >
                <button
                  onClick={() => toggleExpand(info.user.id)}
                  className="w-full px-6 py-5 flex items-center justify-between hover:bg-primary/5 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-3xl">
                      {info.user.id === currentUserId ? '♔' : '♟'}
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-primary text-lg">
                        {info.user.nickname || info.user.username}
                        {info.user.id === currentUserId && (
                          <span className="ml-2 text-xs px-3 py-1 bg-gradient-to-r from-primary to-accent-mint text-white rounded-full font-bold">
                            Вы
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 font-medium">
                        {info.gamesRemaining === 0 ? (
                          <span className="text-accent-mint font-bold">Все игры сыграны</span>
                        ) : (
                          <>Осталось игр: <span className="font-bold">{info.gamesRemaining}</span> / 2</>
                        )}
                      </div>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-6 w-6 text-primary" />
                  ) : (
                    <ChevronDown className="h-6 w-6 text-primary" />
                  )}
                </button>

                {isExpanded && info.gamesPlayed > 0 && (
                  <div className="px-6 py-4 bg-gradient-to-br from-gray-50 to-blue-50 border-t-2 border-primary/10">
                    <div className="text-sm text-gray-700 mb-3 font-bold">
                      Результаты матчей:
                    </div>
                    <div className="space-y-3">
                      {info.matches
                        .filter(m => m.status === 'confirmed' && m.result)
                        .map((match, idx) => {
                          const isPlayer1 = match.player1Id === currentUserId
                          const playerScore = isPlayer1 ? match.result!.player1Score : match.result!.player2Score
                          const opponentScore = isPlayer1 ? match.result!.player2Score : match.result!.player1Score
                          const playerColor = isPlayer1 
                            ? (match.result!.player1Color || (match.round === 1 ? 'white' : 'black'))
                            : (match.result!.player2Color || (match.round === 1 ? 'black' : 'white'))

                          return (
                            <div 
                              key={match.id}
                              className="flex items-center justify-between py-3 px-4 bg-white rounded-xl border border-primary/10 hover:border-primary/30 transition-all"
                            >
                              <div className="text-sm text-gray-800 font-semibold">
                                Игра {idx + 1} ({playerColor === 'white' ? '⚪ Белые' : '⚫ Черные'})
                              </div>
                              <div className="flex items-center space-x-3">
                                <span className="text-sm font-bold text-primary">
                                  {playerScore} : {opponentScore}
                                </span>
                                <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                                  playerScore > opponentScore
                                    ? 'bg-gradient-to-r from-accent-mint to-accent-cyan text-white'
                                    : playerScore < opponentScore
                                    ? 'bg-red-500 text-white'
                                    : 'bg-yellow-500 text-white'
                                }`}>
                                  {playerScore > opponentScore ? '✓ Победа' :
                                   playerScore < opponentScore ? '✗ Поражение' : '= Ничья'}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        /* Финальный тур */
        <div className="space-y-4">
          {finalStageParticipants.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏆</div>
              <p className="text-gray-600 text-lg font-medium">
                Участники финального тура будут определены после завершения группового этапа
              </p>
            </div>
          ) : (
            finalStageParticipants.map(participant => {
              const isExpanded = expandedParticipants[participant.id]
              const playerMatches = getPlayerFinalMatches(participant.id)

              return (
                <div 
                  key={participant.id}
                  className="border-2 border-primary/10 rounded-2xl overflow-hidden bg-white hover:border-primary/30 transition-all duration-300"
                >
                  <button
                    onClick={() => toggleExpand(participant.id)}
                    className="w-full px-6 py-5 flex items-center justify-between hover:bg-primary/5 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="text-3xl">
                        {participant.id === currentUserId ? '♔' : '♟'}
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-primary text-lg">
                          {participant.nickname || participant.username}
                          {participant.id === currentUserId && (
                            <span className="ml-2 text-xs px-3 py-1 bg-gradient-to-r from-primary to-accent-mint text-white rounded-full font-bold">
                              Вы
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 font-medium">
                          Матчей: {playerMatches.length}
                        </div>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-6 w-6 text-primary" />
                    ) : (
                      <ChevronDown className="h-6 w-6 text-primary" />
                    )}
                  </button>

                  {isExpanded && playerMatches.length > 0 && (
                    <div className="px-6 py-4 bg-gradient-to-br from-gray-50 to-blue-50 border-t-2 border-primary/10">
                      <div className="text-sm text-gray-700 mb-3 font-bold">
                        Результаты финального этапа:
                      </div>
                      <div className="space-y-3">
                        {playerMatches.map(match => {
                          const opponentId = match.player1Id === participant.id ? match.player2Id : match.player1Id
                          const opponent = participants.find(p => p.id === opponentId)
                          const result = getMatchResultText(match, participant.id)
                          const stage = getMatchStage(match.id)

                          return (
                            <div 
                              key={match.id}
                              className="bg-white rounded-xl border border-primary/10 hover:border-primary/30 transition-all p-4"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="text-xs text-gray-500 font-semibold uppercase">
                                  {stage}
                                </div>
                                <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                                  result.color === 'text-accent-mint' ? 'bg-accent-mint/10 text-accent-mint' :
                                  result.color === 'text-red-500' ? 'bg-red-100 text-red-500' :
                                  'bg-gray-100 text-gray-500'
                                }`}>
                                  {result.icon} {result.text}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-800 font-semibold">
                                  vs {opponent?.nickname || opponent?.username || 'TBD'}
                                </div>
                                {match.status === 'confirmed' && match.result && (
                                  <span className="text-sm font-bold text-primary">
                                    {match.player1Id === participant.id ? match.result.player1Score : match.result.player2Score}
                                    {' : '}
                                    {match.player1Id === participant.id ? match.result.player2Score : match.result.player1Score}
                                  </span>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
