/**
 * Lightweight web audio chime for incoming messages (no external audio files needed)
 */
export function playNotificationSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) return

    const ctx = new AudioContextClass()
    const now = ctx.currentTime

    // Two pleasant sine tones (MAX / iOS message chime vibe)
    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const gainNode = ctx.createGain()

    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(587.33, now) // D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.1) // A5

    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(880, now + 0.1)
    osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.22) // D6

    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(0.15, now + 0.02)
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35)

    osc1.connect(gainNode)
    osc2.connect(gainNode)
    gainNode.connect(ctx.destination)

    osc1.start(now)
    osc1.stop(now + 0.12)

    osc2.start(now + 0.1)
    osc2.stop(now + 0.35)
  } catch (e) {
    // Audio autoplay might be blocked before first interaction
  }
}
