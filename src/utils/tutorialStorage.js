export const tutorialStorageKey = (userId) => `tutorial-completed-${userId}`

export const isTutorialCompletedLocally = (userId) => {
  if (!userId) return false
  try {
    return localStorage.getItem(tutorialStorageKey(userId)) === 'true'
  } catch {
    return false
  }
}

export const markTutorialCompletedLocally = (userId) => {
  if (!userId) return
  try {
    localStorage.setItem(tutorialStorageKey(userId), 'true')
  } catch {
    // localStorage may be unavailable in some mobile browsers
  }
}
