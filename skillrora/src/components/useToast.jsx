import { useCallback, useEffect, useRef, useState } from 'react'

export default function useToast() {
  const [message, setMessage] = useState('')
  const [show, setShow] = useState(false)
  const timer = useRef()
  useEffect(() => () => clearTimeout(timer.current), [])
  const notify = useCallback((text) => {
    setMessage(text)
    setShow(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setShow(false), 2500)
  }, [])
  const toast = <div className={'toast' + (show ? ' show' : '')} role="status" aria-live="polite">{message}</div>
  return [notify, toast]
}
