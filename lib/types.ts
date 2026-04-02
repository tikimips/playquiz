export interface Quiz {
  id: string
  title: string
  description: string | null
  creator_id: string
  cover_color: string
  is_public: boolean
  created_at: string
  updated_at: string
  questions?: Question[]
}

export interface Question {
  id: string
  quiz_id: string
  text: string
  time_limit: number
  points: number
  order_index: number
  options?: Option[]
}

export interface Option {
  id: string
  question_id: string
  text: string
  is_correct: boolean
  order_index: number
}

export interface Game {
  id: string
  quiz_id: string
  host_id: string
  pin: string
  status: 'lobby' | 'active' | 'ended'
  current_question_index: number
  question_started_at: string | null
  created_at: string
  quiz?: Quiz
}

export interface Player {
  id: string
  game_id: string
  nickname: string
  avatar_color: string
  score: number
  created_at: string
}

export interface Response {
  id: string
  game_id: string
  question_id: string
  player_id: string
  option_id: string | null
  response_time_ms: number | null
  points_earned: number
  is_correct: boolean
}
