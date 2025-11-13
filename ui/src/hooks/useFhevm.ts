import { useState, useEffect, useCallback } from "react";
import { initializeFHEVM, encryptInput, resetFHEVMInstance, decryptEuint32, batchDecrypt } from "../lib/fhevm";
import type { FhevmInstance } from "@zama-fhe/relayer-sdk/bundle";
import { BrowserProvider } from "ethers";

export function useFhevm(chainId?: number) {
  const [instance, setInstance] = useState<FhevmInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Initialize FHEVM
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      console.log("[useFhevm] Init called, chainId:", chainId);
      setLoading(true);
      
      if (!chainId) {
        console.log("[useFhevm] No chainId, skipping initialization");
        setLoading(false);
        return;
      }

      // Only support local network and Sepolia
      if (chainId !== 31337 && chainId !== 11155111) {
        console.error("[useFhevm] Unsupported network:", chainId);
        setError(new Error(`Unsupported network. Please switch to local network (31337) or Sepolia (11155111).`));
        setLoading(false);
        return;
      }

      try {
        setError(null);

        console.log("[useFhevm] Starting FHEVM initialization, chainId:", chainId);
        
        // 简化的初始化流程（参考 Linkedin 项目）
        const fhevmInstance = await initializeFHEVM(chainId);

        if (mounted) {
          setInstance(fhevmInstance);
          setLoading(false);
          console.log("[useFhevm] ✅ FHEVM initialized successfully");
        } else {
          console.log("[useFhevm] Component unmounted, skipping state update");
        }
      } catch (err: any) {
        console.error("[useFhevm] ❌ FHEVM initialization failed:", err);
        console.error("[useFhevm] Error details:", {
          message: err.message,
          stack: err.stack,
          name: err.name
        });
        if (mounted) {
          setError(err);
          setLoading(false);
        }
      }
    };

    init();

    return () => {
      console.log("[useFhevm] Cleanup, chainId:", chainId);
      mounted = false;
    };
  }, [chainId]);

  // Reset instance on network change
  useEffect(() => {
    return () => {
      resetFHEVMInstance();
    };
  }, [chainId]);

  // Encryption function
  const encrypt = useCallback(
    async (contractAddress: string, userAddress: string, score: number) => {
      if (!instance) {
        throw new Error("FHEVM instance not initialized");
      }
      return encryptInput(instance, contractAddress, userAddress, score);
    },
    [instance]
  );

  // Decryption function (single value)
  const decrypt = useCallback(
    async (handle: string, contractAddress: string, userAddress: string) => {
      if (!instance) {
        throw new Error("FHEVM instance not initialized");
      }
      
      // Get signer from window.ethereum
      const provider = new BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      
      return decryptEuint32(instance, handle, contractAddress, userAddress, signer);
    },
    [instance]
  );

  // Batch decryption function (multiple values with one signature)
  const decryptMultiple = useCallback(
    async (handles: { handle: string; contractAddress: string }[], userAddress: string) => {
      if (!instance) {
        throw new Error("FHEVM instance not initialized");
      }
      
      // Get signer from window.ethereum
      const provider = new BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      
      return batchDecrypt(instance, handles, userAddress, signer, chainId);
    },
    [instance, chainId]
  );

  return {
    instance,
    loading,
    error,
    isReady: !!instance && !loading,
    encrypt,
    decrypt,
    decryptMultiple,
  };
}
