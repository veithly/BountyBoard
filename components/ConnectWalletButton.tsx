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

  const fetchProfile = async (address: `0x${string}`) => {
    try {
      // 使用 GraphQL 查询用户资料
      // https://api.studio.thegraph.com/query/67521/verax-v2-linea-sepolia/v0.0.2
      const response = await fetch('https://api.studio.thegraph.com/query/67521/verax-v2-linea-sepolia/v0.0.2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: PROFILE_QUERY,
          variables: {
            address: address.toLowerCase(),
            schemaId: attestationConfig.schema
          }
        })
      });

      const data = await response.json();

      if (data.data?.attestations?.length > 0) {
        const [nickname, avatar, socialAccount] = data.data.attestations[0].decodedData;
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
    const modalType = params.get('modal');
    if (modalType === 'profile') {
      setIsProfileModalOpen(true);
      // 清除 URL 参数
      window.history.replaceState({}, '', window.location.pathname);
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
                    size="sm"
                    variant="outline"
                  >
                    Connect Wallet
                  </Button>
                );
              }

              return (
                <div className="flex items-center gap-2">
                  <Button onClick={openChainModal} size="sm" variant="outline">
                    {chain.hasIcon && (
                      <div className="mr-2 h-4 w-4">
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
                      <Button size="sm" variant="outline">
                        {profile?.avatar ? (
                          <img
                            src={profile.avatar}
                            alt="Profile"
                            className="w-4 h-4 rounded-full mr-2"
                          />
                        ) : (
                          <User className="mr-2 h-4 w-4" />
                        )}
                        {profile?.nickname || account.displayName}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>My Account</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => setIsProfileModalOpen(true)}
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        Profile Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleCopyAddress(account.address)}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Address
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => disconnect()}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Disconnect
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <ProfileSettingsModal
                    isOpen={isProfileModalOpen}
                    onClose={() => setIsProfileModalOpen(false)}
                    address={account.address as `0x${string}`}
                    onSuccess={() => fetchProfile(account.address as `0x${string}`)}
                    initialData={profile}
                  />
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};

export default ConnectWallet;
