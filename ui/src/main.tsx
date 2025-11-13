import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

import '@rainbow-me/rainbowkit/styles.css'
import { RainbowKitProvider, lightTheme } from '@rainbow-me/rainbowkit'
import { WagmiProvider, createConfig } from 'wagmi'
import { hardhat, sepolia } from 'wagmi/chains'
import { http } from 'viem'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Use basic config without WalletConnect for local development
const config = createConfig({
  chains: [hardhat, sepolia],
  transports: {
    [hardhat.id]: http('http://localhost:8545', { 
      retryCount: 0,
      timeout: 10000,
    }),
    [sepolia.id]: http(),
  },
  multiInjectedProviderDiscovery: true,
  ssr: false,
})

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <RainbowKitProvider theme={lightTheme({ borderRadius: 'large' })}>
          <App />
        </RainbowKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  </StrictMode>,
)
