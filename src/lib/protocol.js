// Message protocol between host (hub) and contestants.
// Every message is a plain object with a `type` field.

export const MSG = {
  // Contestant -> Host
  JOIN: 'JOIN',
  ANSWER: 'ANSWER',
  // Host -> Contestant
  WELCOME: 'WELCOME',
  QUESTION: 'QUESTION',
  REVEAL: 'REVEAL',
  FINISHED: 'FINISHED',
}

// ---- Contestant -> Host ----

export function join(name) {
  return { type: MSG.JOIN, name }
}

export function answer(questionIndex, choice) {
  return { type: MSG.ANSWER, questionIndex, choice }
}

// ---- Host -> Contestant ----

export function welcome(playerId, playerCount) {
  return { type: MSG.WELCOME, playerId, playerCount }
}

// Note: the correct answer is deliberately NOT included in a QUESTION message.
export function question(index, total, payload) {
  return {
    type: MSG.QUESTION,
    index,
    total,
    question: payload.question,
    answers: payload.answers,
  }
}

export function reveal(index, correct, distribution, yourChoice, yourScore, wasCorrect) {
  return {
    type: MSG.REVEAL,
    index,
    correct,
    distribution,
    yourChoice,
    yourScore,
    wasCorrect,
  }
}

export function finished(leaderboard) {
  return { type: MSG.FINISHED, leaderboard }
}
