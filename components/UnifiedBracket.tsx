'use client'

import { Match } from '@/types'
import { CheckCircle, Clock, XCircle } from 'lucide-react'
import { useEffect, useRef, useState, useMemo } from 'react'

interface UnifiedBracketProps {
  matches: Match[]
  currentUserId?: string
  onResultClick?: (match: Match) => void
  readOnly?: boolean
}

export function UnifiedBracket({ matches, currentUserId, onResultClick, readOnly = false }: UnifiedBracketProps) {
  const winnersMatch = matches.find(m => m.stage === 'winners' && m.round === 1)
  const losersRound1 = matches.find(m => m.stage === 'losers' && m.round === 1)
  const losersRound2 = matches.find(m => m.stage === 'losers' && m.round === 2)
  const finalMatches = matches.filter(m => m.stage === 'final').sort((a, b) => (a.round || 0) - (b.round || 0))
  const thirdPlaceMatch = matches.find(m => m.stage === 'third_place' && m.round === 1)

  // Стабильные ID для зависимостей
  const winnersMatchId = winnersMatch?.id
  const losersRound1Id = losersRound1?.id
  const losersRound2Id = losersRound2?.id
  const finalMatchesIds = useMemo(() => finalMatches.map(m => m.id).join(','), [finalMatches])
  
  // Refs для получения реальных позиций элементов
  const winnersRef = useRef<HTMLDivElement>(null)
  const losers1Ref = useRef<HTMLDivElement>(null)
  const losers2Ref = useRef<HTMLDivElement>(null)
  const finalRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const [positions, setPositions] = useState<{
    winners: { x: number; y: number } | null
    losers1: { x: number; y: number } | null
    losers2: { x: number; y: number } | null
    final: { x: number; y: number } | null
  }>({
    winners: null,
    losers1: null,
    losers2: null,
    final: null
  })

  // Вычисляем реальные позиции элементов
  useEffect(() => {
    // Пропускаем, если нет всех необходимых элементов
    if (!winnersMatch && !losersRound1 && !losersRound2 && finalMatches.length === 0) {
      return
    }

    const updatePositions = () => {
      if (!containerRef.current) return

      const containerRect = containerRef.current.getBoundingClientRect()
      
      const getCenter = (ref: React.RefObject<HTMLDivElement>) => {
        if (!ref.current) return null
        const rect = ref.current.getBoundingClientRect()
        return {
          x: rect.left + rect.width / 2 - containerRect.left,
          y: rect.top + rect.height / 2 - containerRect.top
        }
      }

      const newPositions = {
        winners: getCenter(winnersRef),
        losers1: getCenter(losers1Ref),
        losers2: getCenter(losers2Ref),
        final: getCenter(finalRef)
      }

      // Обновляем только если позиции изменились
      setPositions(prev => {
        if (
          prev.winners?.x === newPositions.winners?.x && prev.winners?.y === newPositions.winners?.y &&
          prev.losers1?.x === newPositions.losers1?.x && prev.losers1?.y === newPositions.losers1?.y &&
          prev.losers2?.x === newPositions.losers2?.x && prev.losers2?.y === newPositions.losers2?.y &&
          prev.final?.x === newPositions.final?.x && prev.final?.y === newPositions.final?.y
        ) {
          return prev
        }
        return newPositions
      })
    }

    // Используем requestAnimationFrame для обновления после рендера
    const timeoutId = setTimeout(() => {
      requestAnimationFrame(updatePositions)
    }, 100)

    window.addEventListener('resize', updatePositions)

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', updatePositions)
    }
  }, [winnersMatchId, losersRound1Id, losersRound2Id, finalMatchesIds])

  const getStatusIcon = (match: Match) => {
    if (match.status === 'confirmed') {
      return <CheckCircle className="h-3 w-3 text-green-500" />
    }
    if (match.status === 'result_pending_confirmation') {
      return <Clock className="h-3 w-3 text-yellow-500" />
    }
    return <XCircle className="h-3 w-3 text-slate-400" />
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

  const getMatchCard = (match: Match, width: string = '220px') => {
    const isParticipant = canInteract(match)
    const isPending = match.status === 'result_pending_confirmation'
    const needsConfirmation = isPending && match.result?.proposedBy && 
      match.result.proposedBy !== currentUserId

    const winnerId = getWinner(match)
    const hasResult = match.result && match.status === 'confirmed'

    return (
      <div
        className={`relative border-2 rounded-lg bg-white dark:bg-slate-800 shadow-md transition-all hover:shadow-lg ${
          isParticipant ? 'border-primary-500 ring-2 ring-primary-200 dark:ring-primary-800' : 'border-slate-300 dark:border-slate-600'
        } ${needsConfirmation ? 'ring-2 ring-yellow-400 border-yellow-500' : ''} ${
          winnerId ? 'border-green-500' : ''
        }`}
        style={{ minWidth: width, width: width }}
      >
        {/* Статус в правом верхнем углу */}
        <div className="absolute top-2 right-2">
          {getStatusIcon(match)}
        </div>

        {/* Игроки */}
        <div className="p-3 space-y-1">
          {/* Игрок 1 */}
          <div className={`flex items-center justify-between px-3 py-2 rounded ${
            winnerId === match.player1Id 
              ? 'bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700' 
              : 'bg-slate-50 dark:bg-slate-700/50'
          }`}>
            <span className={`text-sm font-medium ${
              winnerId === match.player1Id 
                ? 'text-green-800 dark:text-green-200 font-bold' 
                : 'text-slate-700 dark:text-slate-300'
            }`}>
              {match.player1Name}
            </span>
            {hasResult && (
              <span className={`text-sm font-bold px-2 py-0.5 rounded ${
                winnerId === match.player1Id 
                  ? 'bg-green-500 text-white' 
                  : 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300'
              }`}>
                {match.result!.player1Score}
              </span>
            )}
          </div>
          
          {/* VS разделитель */}
          <div className="text-center text-xs text-slate-400 dark:text-slate-500 font-semibold py-1">
            VS
          </div>
          
          {/* Игрок 2 */}
          <div className={`flex items-center justify-between px-3 py-2 rounded ${
            winnerId === match.player2Id 
              ? 'bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700' 
              : 'bg-slate-50 dark:bg-slate-700/50'
          }`}>
            <span className={`text-sm font-medium ${
              winnerId === match.player2Id 
                ? 'text-green-800 dark:text-green-200 font-bold' 
                : 'text-slate-700 dark:text-slate-300'
            }`}>
              {match.player2Name}
            </span>
            {hasResult && (
              <span className={`text-sm font-bold px-2 py-0.5 rounded ${
                winnerId === match.player2Id 
                  ? 'bg-green-500 text-white' 
                  : 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300'
              }`}>
                {match.result!.player2Score}
              </span>
            )}
          </div>
        </div>

        {/* Кнопка действия - скрываем в режиме readOnly */}
        {!readOnly && isParticipant && onResultClick && (
          <div className="px-3 pb-3">
            <button
              onClick={() => onResultClick(match)}
              className="w-full text-xs px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors font-medium"
            >
              {match.status === 'pending' ? 'Ввести результат' : needsConfirmation ? 'Подтвердить' : 'Изменить'}
            </button>
          </div>
        )}

        {/* Бейдж подтверждения */}
        {needsConfirmation && (
          <div className="absolute -top-2 -right-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
            !
          </div>
        )}
      </div>
    )
  }

  // Размеры для визуализации
  const matchWidth = 220
  const matchHeight = 140
  const connectorWidth = 100

  // Проверяем, что есть данные для отображения
  if (!winnersMatch && !losersRound1 && !losersRound2 && finalMatches.length === 0 && !thirdPlaceMatch) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
        <div className="text-center text-slate-600 dark:text-slate-400">
          Нет данных для отображения
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 overflow-x-auto">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 text-center">
        Турнирная сетка
      </h2>

      {/* Матрица 2x3:
          1  2  3
          4  5  6
      */}
      <div 
        ref={containerRef}
        className="relative grid grid-cols-3 grid-rows-2 gap-12 py-12" 
        style={{ minHeight: '600px', width: '100%', backgroundColor: 'transparent' }}
      >
        {/* Координата 1: Верхняя сетка, тур 1 */}
        {winnersMatch && (
          <div 
            ref={winnersRef}
            className="flex flex-col items-center justify-center relative z-10"
          >
            <div className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-3">
              1 тур • Верхняя сетка
            </div>
            {getMatchCard(winnersMatch, `${matchWidth}px`)}
          </div>
        )}

        {/* Координата 2: Пусто */}
        <div className="min-h-[200px]"></div>

        {/* Координата 3: Финал */}
        {finalMatches.length > 0 && (
          <div 
            ref={finalRef}
            className="flex flex-col items-center justify-center relative z-10"
          >
            <div className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-3">
              Финал
            </div>
            {getMatchCard(finalMatches[0], `${matchWidth}px`)}
          </div>
        )}

        {/* Координата 4: Нижняя сетка, раунд 1 */}
        {losersRound1 && (
          <div 
            ref={losers1Ref}
            className="flex flex-col items-center justify-center relative z-10"
          >
            <div className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-3">
              1 тур • Нижняя сетка
            </div>
            {getMatchCard(losersRound1, `${matchWidth}px`)}
          </div>
        )}

        {/* Координата 5: Нижняя сетка, раунд 2 */}
        {losersRound2 && (
          <div 
            ref={losers2Ref}
            className="flex flex-col items-center justify-center relative z-10"
          >
            <div className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-3">
              2 тур • Нижняя сетка
            </div>
            {getMatchCard(losersRound2, `${matchWidth}px`)}
          </div>
        )}

        {/* Координата 6: Матч за 3-е место */}
        {thirdPlaceMatch && (
          <div 
            className="flex flex-col items-center justify-center relative z-10"
          >
            <div className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-3">
              Матч за 3-е место
            </div>
            {getMatchCard(thirdPlaceMatch, `${matchWidth}px`)}
          </div>
        )}
        {!thirdPlaceMatch && <div className="min-h-[200px]"></div>}

        {/* SVG соединения с реальными координатами - стиль киберспорта */}
        {positions.winners && positions.losers1 && positions.losers2 && positions.final && (
          <svg 
            className="absolute top-0 left-0 w-full h-full pointer-events-none z-0"
            style={{ width: '100%', height: '100%', overflow: 'visible' }}
          >
            <defs>
              {/* Градиент для линий */}
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#64748b" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.6" />
              </linearGradient>
              
              {/* Стрелка для указания направления */}
              <marker
                id="arrowhead"
                markerWidth="12"
                markerHeight="12"
                refX="10"
                refY="3"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <path
                  d="M 0,0 L 0,6 L 12,3 z"
                  fill="#64748b"
                  className="dark:fill-slate-400"
                />
              </marker>
            </defs>

            {/* От координаты 1 (верхняя сетка) к координате 3 (финал) - победитель */}
            <path
              d={`M ${positions.winners.x + matchWidth / 2} ${positions.winners.y} 
                  L ${positions.winners.x + matchWidth / 2 + connectorWidth} ${positions.winners.y}
                  L ${positions.winners.x + matchWidth / 2 + connectorWidth} ${positions.final.y}
                  L ${positions.final.x - matchWidth / 2} ${positions.final.y}`}
              fill="none"
              stroke="url(#lineGradient)"
              strokeWidth="3"
              className="dark:stroke-slate-400"
              markerEnd="url(#arrowhead)"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
            />

            {/* От координаты 1 (верхняя сетка) к координате 5 (нижняя сетка раунд 2) - проигравший */}
            <path
              d={`M ${positions.winners.x + matchWidth / 2} ${positions.winners.y} 
                  L ${positions.winners.x + matchWidth / 2} ${positions.losers2.y}
                  L ${positions.losers2.x - matchWidth / 2} ${positions.losers2.y}`}
              fill="none"
              stroke="url(#lineGradient)"
              strokeWidth="3"
              className="dark:stroke-slate-400"
              markerEnd="url(#arrowhead)"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
            />

            {/* От координаты 4 (нижняя сетка раунд 1) к координате 5 (нижняя сетка раунд 2) - победитель */}
            <path
              d={`M ${positions.losers1.x + matchWidth / 2} ${positions.losers1.y} 
                  L ${positions.losers1.x + matchWidth / 2 + connectorWidth} ${positions.losers1.y}
                  L ${positions.losers1.x + matchWidth / 2 + connectorWidth} ${positions.losers2.y}
                  L ${positions.losers2.x - matchWidth / 2} ${positions.losers2.y}`}
              fill="none"
              stroke="url(#lineGradient)"
              strokeWidth="3"
              className="dark:stroke-slate-400"
              markerEnd="url(#arrowhead)"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
            />

            {/* От координаты 5 (нижняя сетка раунд 2) к координате 3 (финал) - победитель */}
            <path
              d={`M ${positions.losers2.x + matchWidth / 2} ${positions.losers2.y} 
                  L ${positions.losers2.x + matchWidth / 2 + connectorWidth} ${positions.losers2.y}
                  L ${positions.losers2.x + matchWidth / 2 + connectorWidth} ${positions.final.y}
                  L ${positions.final.x - matchWidth / 2} ${positions.final.y}`}
              fill="none"
              stroke="url(#lineGradient)"
              strokeWidth="3"
              className="dark:stroke-slate-400"
              markerEnd="url(#arrowhead)"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
            />
          </svg>
        )}
      </div>
    </div>
  )
}

