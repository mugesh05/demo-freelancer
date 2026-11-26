import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api } from '../lib/api.js'

const WalletContext = createContext(null)

export const NETWORKS = [
  { id: 'Polygon', name: 'Polygon (Amoy)', chainId: '0x13882', rpc: 'https://rpc-amoy.polygon.technology', symbol: 'POL', explorer: 'https://amoy.polygonscan.com' },
  { id: 'Ethereum', name: 'Ethereum (Sepolia)', chainId: '0xaa36a7', rpc: 'https://rpc.sepolia.org', symbol: 'ETH', explorer: 'https://sepolia.etherscan.io' },
  { id: 'Arbitrum', name: 'Arbitrum (Sepolia)', chainId: '0x66eee', rpc: 'https://sepolia-rollup.arbitrum.io/rpc', symbol: 'ETH', explorer: 'https://sepolia.arbiscan.io' },
  { id: 'Bitcoin', name: 'Bitcoin (Testnet4)', chainId: 'btc-testnet', symbol: 'tBTC', explorer: 'https://mempool.space/testnet' },
]

export function WalletProvider({ children }) {
  const [account, setAccount] = useState(() => localStorage.getItem('skillrora_wallet_account') || '')
  const [network, setNetwork] = useState(() => localStorage.getItem('skillrora_wallet_network') || 'Polygon')
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState('')

  const hasInjected = typeof window !== 'undefined' && Boolean(window.ethereum)

  const syncWithBackend = useCallback(async (addr, net) => {
    try {
      await api('/api/profile/wallet', {
        method: 'PUT',
        body: { wallet_address: addr, wallet_network: net },
      })
    } catch {
      // User might not be logged in yet
    }
  }, [])

  const connectWeb3 = async () => {
    setIsConnecting(true)
    setError('')
    try {
      if (hasInjected) {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
        if (accounts && accounts[0]) {
          const addr = accounts[0]
          setAccount(addr)
          localStorage.setItem('skillrora_wallet_account', addr)
          syncWithBackend(addr, network)
          return addr
        }
      } else {
        // Fallback demo/testnet wallet address for seamless onboarding
        const fallbackAddr = '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
        setAccount(fallbackAddr)
        localStorage.setItem('skillrora_wallet_account', fallbackAddr)
        syncWithBackend(fallbackAddr, network)
        return fallbackAddr
      }
    } catch (err) {
      setError(err.message || 'Could not connect wallet.')
    } finally {
      setIsConnecting(false)
    }
  }

  const connectManual = (address, chosenNetwork = network) => {
    if (!address || address.trim().length < 8) {
      setError('Please provide a valid wallet address.')
      return false
    }
    const clean = address.trim()
    setAccount(clean)
    setNetwork(chosenNetwork)
    localStorage.setItem('skillrora_wallet_account', clean)
    localStorage.setItem('skillrora_wallet_network', chosenNetwork)
    syncWithBackend(clean, chosenNetwork)
    setError('')
    return true
  }

  const switchNetwork = (targetNetwork) => {
    setNetwork(targetNetwork)
    localStorage.setItem('skillrora_wallet_network', targetNetwork)
    if (account) syncWithBackend(account, targetNetwork)
  }

  const disconnect = () => {
    setAccount('')
    localStorage.removeItem('skillrora_wallet_account')
  }

  const shortAccount = account
    ? `${account.slice(0, 6)}...${account.slice(-4)}`
    : ''

  return (
    <WalletContext.Provider
      value={{
        account,
        shortAccount,
        network,
        isConnected: Boolean(account),
        isConnecting,
        error,
        connectWeb3,
        connectManual,
        switchNetwork,
        disconnect,
        hasInjected,
        networks: NETWORKS,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const ctx = useContext(WalletContext)
  if (!ctx) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return ctx
}
