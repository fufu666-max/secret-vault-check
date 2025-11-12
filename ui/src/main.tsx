import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

import '@rainbow-me/rainbowkit/styles.css'
import { RainbowKitProvider, getDefaultConfig, lightTheme } from '@rainbow-me/rainbowkit'
import { WagmiProvider, createConfig } from 'wagmi'
import { hardhat, sepolia } from 'wagmi/chains'
import { http } from 'viem'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string | undefined
const hasProjectId = typeof projectId === 'string' && projectId.length > 0 && projectId !== 'WALLETCONNECT_PROJECT_ID_REQUIRED'

const config = hasProjectId
  ? getDefaultConfig({
      appName: 'Employee Satisfaction Survey',
      projectId: projectId!,
      chains: [hardhat, sepolia],
      transports: {
        [hardhat.id]: http('http://localhost:8545', { 
          retryCount: 0,
          timeout: 10000,
        }),
        [sepolia.id]: http(),
      },
      ssr: false,
    })
  : createConfig({
      chains: [hardhat, sepolia],
      transports: {
        [hardhat.id]: http('http://localhost:8545', { 
          retryCount: 0,
          timeout: 10000,
        }),
        [sepolia.id]: http(),
      },
      multiInjectedProviderDiscovery: false,
      ssr: false,
    })

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        {hasProjectId ? (
          <RainbowKitProvider theme={lightTheme({ borderRadius: 'large' })}>
            <App />
          </RainbowKitProvider>
        ) : (
          <App />
        )}
      </WagmiProvider>
    </QueryClientProvider>
  </StrictMode>,
)
