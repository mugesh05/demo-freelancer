import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Scrolls to #hash targets (e.g. /#categories) or back to top on route change
export default function ScrollManager() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    const target = hash && document.getElementById(hash.slice(1))
    if (target) target.scrollIntoView()
    else window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}
