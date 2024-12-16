import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Copy, LogOut, Settings, User } from "lucide-react";
import { useToast } from "./ui/use-toast";
import { useDisconnect, useAccount } from "wagmi";
import { useState, useEffect } from "react";
import ProfileSettingsModal from "./ProfileSettingsModal";
import { UserProfile } from "@/types/profile";
import { useUserStore } from "@/store/userStore";
import { useGetProfile } from "@/hooks/useContract";

const ConnectWallet: React.FC = () => {
  const { toast } = useToast();
  const { disconnect } = useDisconnect();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const { setSocialAccounts, clearSocialAccounts } = useUserStore();
  const { address } = useAccount();
  const [previousAddress, setPreviousAddress] = useState<string | undefined>(undefined);

  // 使用合约 hook 获取用户资料
  const { data: profileData, isError } = useGetProfile(address);
  console.log(profileData);

  // 当合约数据更新时，更新本地状态
  useEffect(() => {
    if (profileData && Array.isArray(profileData)) {
      const [nickname, avatar, socialAccount, _] = profileData;

      // 解析并设置社交账号信息到 store
      try {
        const parsedSocialAccount = JSON.parse(socialAccount);
        setSocialAccounts(parsedSocialAccount);
      } catch (error) {
        console.error("Failed to parse social account data:", error);
      }

      setProfile({
        nickname,
        avatar,
        socialAccount,
      });
    } else {
      setProfile(null);
    }
  }, [profileData, setSocialAccounts]);

  // 处理错误情况
  useEffect(() => {
    if (isError) {
      console.error("Failed to fetch profile from contract");
      setProfile(null);
    }
  }, [isError]);

  // 监听地址变化
  useEffect(() => {
    // 忽略初始的空地址
    if (!previousAddress && !address) {
      setPreviousAddress(address);
      return;
    }

    // 只有当之前有地址，且地址发生变化时才清除信息
    if (previousAddress && previousAddress !== address) {
      clearSocialAccounts();
      setProfile(null);
      // 清除 localStorage 中的相关数据
      localStorage.removeItem("profileFormData");
      localStorage.removeItem("verificationInfo");
    }

    setPreviousAddress(address);
  }, [address, clearSocialAccounts, previousAddress]);

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast({
      title: "Address Copied",
      description: "Wallet address copied to clipboard",
    });
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const modalType = params.get("modal");
    const provider = params.get("provider");

    if (modalType === "profile") {
      setIsProfileModalOpen(true);
      // 只有在没有 provider 参数时才清除 URL 参数
      if (!provider) {
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, []);

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        return (
          <>
            <div
              {...(!ready && {
                "aria-hidden": true,
                style: {
                  opacity: 0,
                  pointerEvents: "none",
                  userSelect: "none",
                },
              })}
            >
              {(() => {
                if (!connected) {
                  return (
                    <Button
                      onClick={openConnectModal}
                      className="relative overflow-hidden group bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white border-none shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
                    >
                      <span className="relative z-10">Connect Wallet</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-purple-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10" />
                    </Button>
                  );
                }

                return (
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={openChainModal}
                      className="bg-black/40 hover:bg-black/60 text-purple-300 border border-purple-500/30 hover:border-purple-500/50 shadow-lg hover:shadow-purple-500/20 transition-all duration-300"
                    >
                      {chain.hasIcon && (
                        <div className="mr-2 h-4 w-4 relative">
                          {chain.iconUrl && (
                            <Image
                              src={chain.iconUrl}
                              alt={chain.name ?? "Chain icon"}
                              fill
                              className="object-cover"
                              sizes="20px"
                              priority={false}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "/placeholder.png";
                              }}
                            />
                          )}
                        </div>
                      )}
                      {chain.name}
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button className="bg-gradient-to-r from-purple-500/10 to-purple-700/10 hover:from-purple-500/20 hover:to-purple-700/20 border border-purple-500/30 hover:border-purple-500/50 text-purple-300 shadow-lg hover:shadow-purple-500/20 transition-all duration-300">
                          {profile?.avatar ? (
                            <Image
                              src={profile.avatar}
                              alt="Profile"
                              className="w-5 h-5 rounded-full mr-2 ring-2 ring-purple-500/30"
                              width={20}
                              height={20}
                            />
                          ) : (
                            <User className="mr-2 h-4 w-4" />
                          )}
                          {profile?.nickname || account.displayName}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-black/90 border border-purple-500/30 backdrop-blur-xl">
                        <DropdownMenuLabel className="text-purple-300">
                          My Account
                        </DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => setIsProfileModalOpen(true)}
                          className="hover:bg-purple-500/20 text-gray-300 hover:text-white transition-colors"
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          Profile Settings
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleCopyAddress(account.address)}
                          className="hover:bg-purple-500/20 text-gray-300 hover:text-white transition-colors"
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Copy Address
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-purple-500/20" />
                        <DropdownMenuItem
                          onClick={() => disconnect()}
                          className="hover:bg-red-500/20 text-gray-300 hover:text-red-400 transition-colors"
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Disconnect
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })()}
            </div>

            {connected && (
              <ProfileSettingsModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                address={account.address as `0x${string}`}
                onSuccess={() => {
                  setIsProfileModalOpen(false);
                }}
                initialData={profile}
              />
            )}
          </>
        );
      }}
    </ConnectButton.Custom>
  );
};

export default ConnectWallet;
