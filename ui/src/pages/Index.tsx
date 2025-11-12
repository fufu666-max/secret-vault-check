import { useEffect, useMemo, useState, useRef } from "react";
import { useAccount, useChainId, useReadContract, useWriteContract, useSignTypedData } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { isHex, toHex, bytesToHex, padHex } from "viem";
import { useFhevmMock } from "../hooks/useFhevmMock";
import { SatisfactionSurveyABI } from "../abi/SatisfactionSurveyABI";
import { SatisfactionSurveyAddresses } from "../abi/SatisfactionSurveyAddresses";

const DEPARTMENTS = [
  { id: 0, name: "Marketing" },
  { id: 1, name: "Sales" },
  { id: 2, name: "Engineering" },
  { id: 3, name: "HR" },
  { id: 4, name: "Finance" },
];

function SurveyMVP() {
  const chainId = useChainId();
  const { address } = useAccount();
  const effectiveChainId = chainId ?? 31337;
  
  const contractInfo = useMemo(
    () => SatisfactionSurveyAddresses[effectiveChainId.toString()],
    [effectiveChainId]
  );
  const contractAddress = contractInfo?.address;
  const deployed = contractAddress && contractAddress !== "0x0000000000000000000000000000000000000000";

  const [dept, setDept] = useState<number>(0);
  const [rating, setRating] = useState<string>("5");

  const { data: globalAgg } = useReadContract({
    abi: SatisfactionSurveyABI.abi,
    address: deployed ? contractAddress : undefined,
    functionName: "getGlobalAggregates",
    chainId: effectiveChainId,
    query: { enabled: Boolean(deployed && contractAddress) }
  });

  const { data: deptAgg } = useReadContract({
    abi: SatisfactionSurveyABI.abi,
    address: deployed ? contractAddress : undefined,
    functionName: "getDepartmentAggregates",
    args: [BigInt(dept)],
    chainId: effectiveChainId,
    query: { enabled: Boolean(deployed && contractAddress) }
  });

  const write = useWriteContract();
  const signTyped = useSignTypedData();
  const fhe = useFhevmMock({ chainId });

  const [globalTotal, setGlobalTotal] = useState<bigint>(0n);
  const [globalCount, setGlobalCount] = useState<bigint>(0n);
  const [deptTotal, setDeptTotal] = useState<bigint>(0n);
  const [deptCount, setDeptCount] = useState<bigint>(0n);
  const [cachedSignature, setCachedSignature] = useState<`0x${string}` | null>(null);
  const [cachedTimestamp, setCachedTimestamp] = useState<{ start: number; duration: number } | null>(null);
  const isDecryptingRef = useRef(false);

  // Decrypt aggregates
  useEffect(() => {
    const run = async () => {
      if (!deployed || !contractAddress || !fhe.instance || !address) return;
      if (isDecryptingRef.current) return;
      
      const handles: string[] = [];
      if (globalAgg && Array.isArray(globalAgg)) {
        const [t, c] = globalAgg as unknown as [`0x${string}`, `0x${string}`];
        if (t !== "0x0000000000000000000000000000000000000000000000000000000000000000") handles.push(t);
        if (c !== "0x0000000000000000000000000000000000000000000000000000000000000000") handles.push(c);
      }
      if (deptAgg && Array.isArray(deptAgg)) {
        const [t, c] = deptAgg as unknown as [`0x${string}`, `0x${string}`];
        if (t !== "0x0000000000000000000000000000000000000000000000000000000000000000") handles.push(t);
        if (c !== "0x0000000000000000000000000000000000000000000000000000000000000000") handles.push(c);
      }
      if (handles.length === 0) {
        setGlobalTotal(0n); setGlobalCount(0n); setDeptTotal(0n); setDeptCount(0n);
        return;
      }

      isDecryptingRef.current = true;
      try {
        let signature = cachedSignature;
        let timestamp = cachedTimestamp;
        
        if (!signature || !timestamp) {
          const { eip712, startTimestamp, durationDays } = fhe.buildTypedData(contractAddress);
          signature = await signTyped.signTypedDataAsync({
            domain: eip712.domain as any,
            types: { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification as any },
            primaryType: "UserDecryptRequestVerification",
            message: eip712.message as any,
          }) as `0x${string}`;
          timestamp = { start: startTimestamp, duration: durationDays };
          setCachedSignature(signature);
          setCachedTimestamp(timestamp);
        }
        
        const res = await fhe.decryptHandles(
          contractAddress, 
          address as `0x${string}`, 
          signature, 
          handles,
          timestamp.start,
          timestamp.duration
        );
        const gt = (globalAgg?.[0] as string) ? BigInt(res[globalAgg?.[0] as string] ?? 0) : 0n;
        const gc = (globalAgg?.[1] as string) ? BigInt(res[globalAgg?.[1] as string] ?? 0) : 0n;
        const dt = (deptAgg?.[0] as string) ? BigInt(res[deptAgg?.[0] as string] ?? 0) : 0n;
        const dc = (deptAgg?.[1] as string) ? BigInt(res[deptAgg?.[1] as string] ?? 0) : 0n;
        setGlobalTotal(gt); setGlobalCount(gc); setDeptTotal(dt); setDeptCount(dc);
      } finally {
        isDecryptingRef.current = false;
      }
    };
    run();
  }, [globalAgg, deptAgg, deployed, contractAddress, fhe.instance, address, cachedSignature, cachedTimestamp]);

  const canSubmit = useMemo(() => {
    const ratingNum = Number.parseInt(rating);
    const ratingOk = Number.isInteger(ratingNum) && ratingNum >= 1 && ratingNum <= 10;
    return deployed && address && chainId === 31337 && fhe.instance && ratingOk && dept >= 0;
  }, [deployed, address, chainId, fhe.instance, rating, dept]);

  const onSubmit = async () => {
    try {
      const ratingNum = Number.parseInt(rating);
      if (!canSubmit || !contractAddress || !address) return;

      const enc = await fhe.encryptInputs(contractAddress as `0x${string}`, address as `0x${string}`, ratingNum);

      const toHexAny = (v: unknown): `0x${string}` => {
        if (typeof v === "string") {
          return (isHex(v as string) ? (v as `0x${string}`) : (toHex(v as string) as `0x${string}`));
        }
        if (v instanceof Uint8Array) return bytesToHex(v) as `0x${string}`;
        if (v instanceof ArrayBuffer) return bytesToHex(new Uint8Array(v as ArrayBuffer)) as `0x${string}`;
        if (typeof v === "bigint" || typeof v === "number") return toHex(v as number) as `0x${string}`;
        return toHex(JSON.stringify(v)) as `0x${string}`;
      };

      const handleScoreHex = padHex(toHexAny(enc.handles[0]), { size: 32 });
      const handleOneHex = padHex(toHexAny(enc.handles[1]), { size: 32 });
      const inputProofHex = toHexAny(enc.inputProof);

      await write.writeContractAsync({
        abi: SatisfactionSurveyABI.abi,
        address: contractAddress as `0x${string}`,
        functionName: "submitResponse",
        args: [handleScoreHex, inputProofHex, BigInt(dept), handleOneHex, inputProofHex],
      });

      alert("Survey submitted successfully!");
    } catch (e: any) {
      console.error("Submit error:", e);
      alert("Submit failed: " + (e?.message ?? String(e)));
    }
  };

  const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string | undefined;
  const hasProjectId = typeof projectId === 'string' && projectId.length > 0 && projectId !== 'WALLETCONNECT_PROJECT_ID_REQUIRED';

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Employee Satisfaction Survey</h1>
          <div className="flex items-center gap-2">
            {hasProjectId ? (
              <ConnectButton chainStatus="icon" label="连接钱包" showBalance={false} />
            ) : (
              <span className="text-xs text-muted-foreground px-3 py-1 border rounded-md">
                Connect Wallet
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto space-y-12">
          <div className="text-center space-y-6 animate-fade-in">
            <h1 className="text-5xl font-bold text-foreground">
              Anonymous Satisfaction Survey
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Submit encrypted ratings; view decrypted aggregates. Your individual answers are never revealed.
            </p>
          </div>

          <div className="rounded-xl border border-border p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">Department</label>
                <select
                  className="w-full mt-2 border rounded-md px-3 py-2 bg-background"
                  value={dept}
                  onChange={(e) => setDept(parseInt(e.target.value))}
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Rating (1-10)</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  className="w-full mt-2 border rounded-md px-3 py-2 bg-background"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button 
                onClick={onSubmit}
                disabled={!canSubmit || fhe.loading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-2 rounded-md disabled:opacity-50"
              >
                Submit
              </button>
            </div>
            {chainId !== 31337 && (
              <p className="text-xs text-muted-foreground">Note: Browser-side FHE encryption is enabled on local Hardhat network (31337).</p>
            )}
            {!deployed && (
              <p className="text-sm text-destructive">Contract not deployed for current chain. Please deploy SatisfactionSurvey and refresh.</p>
            )}
          </div>

          <div className="rounded-xl border border-border p-6 space-y-2">
            <h2 className="text-lg font-semibold">Global Aggregates</h2>
            <p className="text-sm">Total: {globalTotal.toString()} | Count: {globalCount.toString()} | Avg: {globalCount === 0n ? "-" : (Number(globalTotal) / Number(globalCount)).toFixed(2)}</p>
          </div>

          <div className="rounded-xl border border-border p-6 space-y-2">
            <h2 className="text-lg font-semibold">{DEPARTMENTS.find(d => d.id === dept)?.name || "Department"} Aggregates</h2>
            <p className="text-sm">Total: {deptTotal.toString()} | Count: {deptCount.toString()} | Avg: {deptCount === 0n ? "-" : (Number(deptTotal) / Number(deptCount)).toFixed(2)}</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function Index() {
  return <SurveyMVP />;
}
