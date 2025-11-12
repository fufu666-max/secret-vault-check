import { ConnectButton } from "@rainbow-me/rainbowkit";

const WalletConnect = () => {
  const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string | undefined;
  const hasProjectId = typeof projectId === "string" && projectId.length > 0 && projectId !== "WALLETCONNECT_PROJECT_ID_REQUIRED";
  
  return (
    <div className="flex items-center gap-2">
      {hasProjectId ? (
        <ConnectButton chainStatus="icon" label="连接钱包" showBalance={false} />
      ) : (
        <span className="text-xs text-muted-foreground px-3 py-1 border rounded-md">
          请设置 VITE_WALLETCONNECT_PROJECT_ID 以启用 RainbowKit
        </span>
      )}
    </div>
  );
};

export default WalletConnect;

