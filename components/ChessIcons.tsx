// Шахматные иконки в виде Unicode символов
export const ChessPieces = {
  King: ({ className = "text-2xl" }: { className?: string }) => (
    <span className={className}>♔</span>
  ),
  Queen: ({ className = "text-2xl" }: { className?: string }) => (
    <span className={className}>♕</span>
  ),
  Rook: ({ className = "text-2xl" }: { className?: string }) => (
    <span className={className}>♖</span>
  ),
  Bishop: ({ className = "text-2xl" }: { className?: string }) => (
    <span className={className}>♗</span>
  ),
  Knight: ({ className = "text-2xl" }: { className?: string }) => (
    <span className={className}>♘</span>
  ),
  Pawn: ({ className = "text-2xl" }: { className?: string }) => (
    <span className={className}>♙</span>
  ),
}

export const ChessPiecesBlack = {
  King: ({ className = "text-2xl" }: { className?: string }) => (
    <span className={className}>♚</span>
  ),
  Queen: ({ className = "text-2xl" }: { className?: string }) => (
    <span className={className}>♛</span>
  ),
  Rook: ({ className = "text-2xl" }: { className?: string }) => (
    <span className={className}>♜</span>
  ),
  Bishop: ({ className = "text-2xl" }: { className?: string }) => (
    <span className={className}>♝</span>
  ),
  Knight: ({ className = "text-2xl" }: { className?: string }) => (
    <span className={className}>♞</span>
  ),
  Pawn: ({ className = "text-2xl" }: { className?: string }) => (
    <span className={className}>♟</span>
  ),
}

// Декоративные шахматные элементы
export const ChessBoard = ({ className = "" }: { className?: string }) => (
  <div className={`inline-block ${className}`}>
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" fill="#f0d9b5"/>
      <rect width="12" height="12" fill="#b58863"/>
      <rect x="12" y="12" width="12" height="12" fill="#b58863"/>
    </svg>
  </div>
)

