import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/button";
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
import { useDisconnect } from "wagmi";
import { useState, useEffect } from "react";
import ProfileSettingsModal from "./ProfileSettingsModal";
import attestationConfig from "@/constants/attestaion";
import { UserProfile } from "@/types/profile";
import { useUserStore } from "@/store/userStore";

// GraphQL 查询
const PROFILE_QUERY = `
  query GetProfile($address: Bytes!, $schemaId: String!) {
    attestations(
      where: {
        subject: $address,
        schema: $schemaId,
        revoked: false
      },
      orderBy: attestedDate,
      orderDirection: desc,
      first: 1
    ) {
      decodedData
    }
  }
`;

const ConnectWallet: React.FC = () => {
  const { toast } = useToast();
  const { disconnect } = useDisconnect();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const { setSocialAccounts } = useUserStore();

  const fetchProfile = async (address: `0x${string}`) => {
    try {
      // 使用 GraphQL 查询用户资料
      // https://api.studio.thegraph.com/query/67521/verax-v2-linea-sepolia/v0.0.2
      const response = await fetch(
        "https://api.studio.thegraph.com/query/67521/verax-v2-linea-sepolia/v0.0.2",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: PROFILE_QUERY,
            variables: {
              address: address.toLowerCase(),
              schemaId: attestationConfig.schema,
            },
          }),
        }
      );

      const data = await response.json();

      console.log(data);

      if (data.data?.attestations?.length > 0) {
        const [nickname, avatar, socialAccount] =
          data.data.attestations[0].decodedData;

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
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      setProfile(null);
    }
  };

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
    if (modalType === "profile") {
      setIsProfileModalOpen(true);
      // 清除 URL 参数
      window.history.replaceState({}, "", window.location.pathname);
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
        useEffect(() => {
          if (account?.address) {
            fetchProfile(account.address as `0x${string}`);
          }
        }, [account?.address]);

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
                            <img
                              alt={chain.name ?? "Chain icon"}
                              src={chain.iconUrl}
                              className="h-4 w-4"
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
                            <img
                              src={profile.avatar}
                              alt="Profile"
                              className="w-5 h-5 rounded-full mr-2 ring-2 ring-purple-500/30"
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
                  // 重新获取用户资料
                  if (account.address) {
                    fetchProfile(account.address as `0x${string}`);
                  }
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
