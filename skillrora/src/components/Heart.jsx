import { useState } from 'react'

export default function Heart({ className }) {
  const [saved, setSaved] = useState(false)
  return (
    <button type="button" className={className} aria-pressed={saved}
      aria-label={saved ? 'Remove from saved' : 'Save service'} onClick={() => setSaved(!saved)}>
      {saved ? '♥' : '♡'}
    </button>
  )
}
