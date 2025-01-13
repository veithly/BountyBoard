import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Button } from './ui/button';
import { useMediaQuery } from '../hooks/useMediaQuery';
import Image from 'next/image';
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
import { UserProfile } from "@/types/profile";
import { useUserStore } from '@/store/userStore';
import { useGetProfile } from '@/hooks/useContract';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from "react";

function ConnectWalletButtonInner() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { toast } = useToast();
  const { disconnect } = useDisconnect();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const { setSocialAccounts } = useUserStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Handle URL parameter control for modal
  useEffect(() => {
    const modalParam = searchParams.get('modal');
    const shouldOpenModal = localStorage.getItem("profileModalShouldOpen");

    if (modalParam === 'profile' || shouldOpenModal) {
      setIsProfileModalOpen(true);
    }
  }, [searchParams]);

  const handleOpenModal = () => {
    // Update URL parameters
    const newUrl = `${window.location.pathname}?modal=profile`;
    window.history.pushState({}, '', newUrl);
    setIsProfileModalOpen(true);
  };

  const handleCloseModal = () => {
    // Clean up URL parameters
    const newUrl = window.location.pathname;
    window.history.replaceState({}, '', newUrl);
    // Clear localStorage
    localStorage.removeItem("profileModalShouldOpen");
    localStorage.removeItem("verificationInfo");
    localStorage.removeItem("profileFormData");
    setIsProfileModalOpen(false);
  };

  const handleCopyAddress = (address: `0x${string}`) => {
    navigator.clipboard.writeText(address);
    toast({
      title: "Address Copied",
      description: "Wallet address copied to clipboard",
    });
  };

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

        // Use contract hook to get user profile
        const { data: userProfileData } = useGetProfile(connected ? account.address as `0x${string}` : undefined);

        // When contract data is updated, update local state
        useEffect(() => {
          if (userProfileData && Array.isArray(userProfileData)) {
            const [nickname, avatar, socialAccount] = userProfileData;

            // Parse and set social account information to the store
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
        }, [userProfileData, setSocialAccounts]);

        const renderContent = () => {
          if (!connected) {
            return (
              <Button
                onClick={openConnectModal}
                className="bg-purple-500/20 text-purple-100 hover:bg-purple-500/30 backdrop-blur-sm"
                size={isMobile ? "sm" : "default"}
              >
                {isMobile ? 'Connect' : 'Connect Wallet'}
              </Button>
            );
          }

          if (chain.unsupported) {
            return (
              <Button
                onClick={openChainModal}
                variant="destructive"
                size={isMobile ? "sm" : "default"}
              >
                Wrong network
              </Button>
            );
          }

          return (
            <div className="flex items-center gap-2">
              <Button
                onClick={openChainModal}
                variant="outline"
                size={isMobile ? "sm" : "default"}
                className="hidden sm:flex"
              >
                {chain.hasIcon && (
                  <div className="mr-2">
                    {chain.iconUrl && (
                      <img
                        alt={chain.name ?? 'Chain icon'}
                        src={chain.iconUrl}
                        className="w-4 h-4"
                      />
                    )}
                  </div>
                )}
                {chain.name}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size={isMobile ? "sm" : "default"}
                    className="bg-gradient-to-r from-purple-500/10 to-purple-700/10 hover:from-purple-500/20 hover:to-purple-700/20 border border-purple-500/30 hover:border-purple-500/50 text-purple-300"
                  >
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
                    <span className="truncate max-w-[100px] sm:max-w-[140px]">
                      {profile?.nickname || account.displayName}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-[200px] bg-black/90 border border-purple-500/30 backdrop-blur-xl"
                >
                  <DropdownMenuLabel className="text-purple-300">
                    My Account
                  </DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={handleOpenModal}
                    className="hover:bg-purple-500/20 text-gray-300 hover:text-white transition-colors"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Profile Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleCopyAddress(account.address as `0x${string}`)}
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
        };

        return (
          <>
            <div
              {...(!ready && {
                'aria-hidden': true,
                style: {
                  opacity: 0,
                  pointerEvents: 'none',
                  userSelect: 'none',
                },
              })}
            >
              {renderContent()}
            </div>

            {connected && (
              <ProfileSettingsModal
                isOpen={isProfileModalOpen}
                onClose={handleCloseModal}
                address={account.address as `0x${string}`}
                onSuccess={() => {
                  handleCloseModal();
                }}
                initialData={profile}
              />
            )}
          </>
        );
      }}
    </ConnectButton.Custom>
  );
}

export default function ConnectWalletButton() {
  return (
    <Suspense fallback={null}>
      <ConnectWalletButtonInner />
    </Suspense>
  );
}
