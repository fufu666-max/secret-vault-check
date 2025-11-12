import * as fhevmjs from "fhevmjs";
import { useCallback, useEffect, useRef, useState } from "react";
import { isAddress } from "viem";

declare global {
  interface Window {
    fhevmInstance: any;
  }
}

async function fetchRelayerMetadata(rpcUrl: string) {
  const body = JSON.stringify({ jsonrpc: "2.0", id: 1, method: "fhevm_relayer_metadata", params: [] });
  const res = await fetch(rpcUrl, { method: "POST", headers: { "content-type": "application/json" }, body });
  if (!res.ok) throw new Error("Cannot fetch FHEVM relayer metadata");
  const json = await res.json();
  if (json && typeof json === "object" && "result" in json && json.result) {
    return json.result as {
      ACLAddress: `0x${string}`;
      InputVerifierAddress: `0x${string}`;
      KMSVerifierAddress: `0x${string}`;
    };
  }
  throw new Error("Invalid relayer metadata response");
}

export function useFhevmMock({ chainId }: { chainId?: number }) {
  const [instance, setInstance] = useState<any>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | undefined>(undefined);
  const keypairRef = useRef<{ publicKey: string; privateKey: string } | undefined>(undefined);

  const ensureKeypair = useCallback(() => {
    if (!keypairRef.current) {
      const privateKey = localStorage.getItem("fhevm_private_key");
      if (privateKey) {
        keypairRef.current = (fhevmjs as any).generateKeypair(privateKey);
      } else {
        keypairRef.current = (fhevmjs as any).generateKeypair();
        localStorage.setItem("fhevm_private_key", keypairRef.current.privateKey);
      }
    }
    return keypairRef.current;
  }, []);

  useEffect(() => {
    const initFhevmInstance = async () => {
      if (!chainId || chainId !== 31337) {
        setInstance(undefined);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(undefined);
      try {
        const metadata = await fetchRelayerMetadata("http://localhost:8545");
        const fhevmInstance = await (fhevmjs as any).createInstance({
          chainId: chainId,
          publicKey: ensureKeypair().publicKey,
          aclAddress: metadata.ACLAddress,
          inputVerifierAddress: metadata.InputVerifierAddress,
          kmsVerifierAddress: metadata.KMSVerifierAddress,
        });
        setInstance(fhevmInstance);
        window.fhevmInstance = fhevmInstance;
      } catch (e: any) {
        console.error("Failed to initialize FHEVM instance:", e);
        setError(e);
        setInstance(undefined);
      } finally {
        setLoading(false);
      }
    };
    initFhevmInstance();
  }, [chainId, ensureKeypair]);

  const encryptInputs = useCallback(
    async (contract: `0x${string}`, user: `0x${string}`, score: number) => {
      if (!instance) throw new Error("FHEVM instance not ready");
      if (!isAddress(contract) || !isAddress(user)) throw new Error("Invalid address");
      const input = instance.createEncryptedInput(contract, user);
      input.add32(score);
      input.add32(1);
      return input.encrypt();
    },
    [instance]
  );

  const buildTypedData = useCallback(
    (contract: `0x${string}`) => {
      if (!instance) throw new Error("FHEVM instance not ready");
      const { publicKey } = ensureKeypair();
      const startTimestamp = Math.floor(Date.now() / 1000);
      const durationDays = 365;
      const eip712 = instance.createEIP712(publicKey, [contract], startTimestamp, durationDays);
      return { eip712, startTimestamp, durationDays };
    },
    [instance, ensureKeypair]
  );

  const decryptHandles = useCallback(
    async (
      contract: `0x${string}`,
      user: `0x${string}`,
      signature: `0x${string}`,
      handles: string[],
      startTimestamp?: number,
      durationDays?: number
    ) => {
      if (!instance) throw new Error("FHEVM instance not ready");
      const { publicKey, privateKey } = ensureKeypair();
      const start = startTimestamp ?? Math.floor(Date.now() / 1000);
      const duration = durationDays ?? 365;
      const items = handles.map((h) => ({ handle: h, contractAddress: contract }));
      return instance.decrypt(items, privateKey, publicKey, signature, [contract], user, start, duration);
    },
    [instance, ensureKeypair]
  );

  return {
    instance,
    loading,
    error,
    encryptInputs,
    buildTypedData,
    decryptHandles,
  };
}
