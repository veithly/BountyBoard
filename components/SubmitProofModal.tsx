"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { Loader2, CheckCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { TaskConfig, SubmissionProof } from "@/types/types";
import {
  SiGithub,
  SiX,
  SiDiscord,
  SiEthereum,
} from '@icons-pack/react-simple-icons';
import { useWaitForTransactionReceipt } from "wagmi";
import { useUserStore } from '@/store/userStore';
import ImageUpload from "@/components/ImageUpload";

interface SubmissionProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskConfig: TaskConfig;
  onSubmit: (data: SubmissionProof) => Promise<{ hash?: string; error?: string } | undefined>;
  onConfirmed: () => void;
}

export default function SubmissionProofModal({
  isOpen,
  onClose,
  taskConfig,
  onSubmit,
  onConfirmed,
}: SubmissionProofModalProps) {
  const { socialAccounts } = useUserStore();
  const [proofData, setProofData] = useState<SubmissionProof>({});
  const [isVerifying, setIsVerifying] = useState(false);
  const [transactionHash, setTransactionHash] = useState<`0x${string}` | null>(null);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'confirming' | 'confirmed'>('idle');
  const { toast } = useToast();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error,
  } = useWaitForTransactionReceipt({
    hash: transactionHash as `0x${string}`,
  });

  useEffect(() => {
    if (isConfirmed) {
      setSubmitStatus('confirmed');
      toast({
        title: "Success",
        description: "Proof submitted successfully!",
      });
      setTimeout(() => {
        if (onConfirmed) onConfirmed();
        onClose();
      }, 1500);
    } else if (error) {
      setSubmitStatus('idle');
      toast({
        title: "Error",
        description: "Transaction failed",
        variant: "destructive",
      });
    }
  }, [isConfirmed, error, onClose, onConfirmed]);

  const verifyXAction = async (action: 'follow' | 'retweet' | 'like') => {
    if (!socialAccounts?.xId) {
      toast({
        title: "Error",
        description: "Please connect your X account first",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    try {
      const response = await fetch(`/api/social/twitter/check-actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          encryptedTokens: socialAccounts.encryptedTokens,
          action,
          targetUser: taskConfig.XFollowUsername || '',
          tweetId: action === 'like' ? taskConfig.XLikeId || '' :
                  action === 'retweet' ? taskConfig.XRetweetId || '' : '',
          userId: socialAccounts.xId
        })
      });

      if (response.status === 403) {
        const data = await response.json();
        if (data.error?.includes("client-not-enrolled")) {
          toast({
            title: "Error",
            description: "Twitter API access not properly configured. Please contact support.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: "Authorization failed. Please reconnect your X account.",
            variant: "destructive",
          });
        }
        return;
      }

      const data = await response.json();

      if (data.verified) {
        setProofData(prev => ({
          ...prev,
          xUserName: socialAccounts.xUserName,
          xName: socialAccounts.xName,
          xId: socialAccounts.xId,
          encryptedTokens: socialAccounts.encryptedTokens,
          [`x${action.charAt(0).toUpperCase() + action.slice(1)}`]: true
        }));
        toast({
          title: "Success",
          description: `X ${action} action verified`
        });
      } else {
        throw new Error(data.error || `X ${action} action not verified`);
      }
    } catch (error) {
      console.error('X verification error:', error);
      toast({
        title: "Error",
        description: `Failed to verify X ${action}`,
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const verifyDiscordJoin = async () => {
    if (!socialAccounts?.discordId) {
      toast({
        title: "Error",
        description: "Please connect your Discord account first",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    try {
      const response = await fetch(`/api/social/discord/check-guild`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          encryptedTokens: socialAccounts.encryptedTokens,
          guildId: taskConfig.DiscordChannelId || '',
          userId: socialAccounts.discordId
        })
      });

      const data = await response.json();

      if (data.inGuild) {
        setProofData(prev => ({
          ...prev,
          discordUserName: socialAccounts.discordUserName,
          discordName: socialAccounts.discordName,
          discordId: socialAccounts.discordId,
          encryptedTokens: socialAccounts.encryptedTokens,
        }));
        toast({
          title: "Success",
          description: "Discord server membership verified"
        });
      } else {
        throw new Error(data.error || 'Not a member of the Discord server');
      }
    } catch (error) {
      console.error('Discord verification error:', error);
      toast({
        title: "Error",
        description: "Failed to verify Discord server membership",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitStatus('submitting');
    try {
      const result = await onSubmit(proofData);
      if (result?.hash) {
        setTransactionHash(result.hash as `0x${string}`);
        setSubmitStatus('confirming');
        toast({
          title: "Processing",
          description: (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
              <span>Waiting for transaction confirmation...</span>
            </div>
          ),
        });
      } else if (result?.error) {
        setSubmitStatus('idle');
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error submitting proof:", error);
      setSubmitStatus('idle');
      toast({
        title: "Error",
        description: "Failed to submit proof",
        variant: "destructive",
      });
    }
  };

  const getButtonState = () => {
    switch (submitStatus) {
      case 'submitting':
        return {
          text: "Submitting...",
          disabled: true,
          icon: <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        };
      case 'confirming':
        return {
          text: "Confirming...",
          disabled: true,
          icon: <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        };
      case 'confirmed':
        return {
          text: "Confirmed!",
          disabled: true,
          icon: <CheckCircle className="mr-2 h-4 w-4" />
        };
      default:
        return {
          text: "Submit Proof",
          disabled: isVerifying,
          icon: null
        };
    }
  };

  const buttonState = getButtonState();

  const SocialLinkButton = ({
    href,
    icon: Icon,
    label,
  }: {
    href: string;
    icon: any;
    label: string;
  }) => (
    <Button
      type="button"
      variant="outline"
      size="sm"
      asChild
      className="h-9 hover:bg-accent hover:text-accent-foreground"
    >
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2"
      >
        <Icon className="h-4 w-4" />
        {label}
      </a>
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Submit Proof</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Please provide the required proof for this task.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {taskConfig.taskType.map((type) => {
            switch (type) {
              case 'Plain Text':
                return (
                  <div key="text" className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Text Proof</label>
                    <Textarea
                      placeholder="Enter your proof..."
                      value={proofData.text || ''}
                      onChange={(e) => setProofData(prev => ({ ...prev, text: e.target.value }))}
                      className="bg-background border-input"
                    />
                  </div>
                );

              case 'Image':
                return (
                  <div key="image" className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Image Proof</label>
                    <ImageUpload
                      value={proofData.image || ''}
                      onChange={(url) => setProofData(prev => ({ ...prev, image: url }))}
                      label="Proof Image"
                      className="w-full"
                    />
                  </div>
                );

              case 'Github Pull Request':
                return (
                  <div key="github" className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-foreground">
                      <SiGithub className="h-4 w-4 mr-2" />
                      GitHub PR URL
                    </label>
                    <Input
                      placeholder="https://github.com/name/repo/pull/123"
                      value={proofData.github || ''}
                      onChange={(e) => setProofData(prev => ({ ...prev, github: e.target.value }))}
                      className="bg-background border-input"
                    />
                  </div>
                );

              case 'Contract Verification':
                return (
                  <div key="contract" className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-foreground">
                      <SiEthereum className="h-4 w-4 mr-2" />
                      Contract Address
                    </label>
                    <Input
                      placeholder="0x..."
                      value={proofData.contract || ''}
                      onChange={(e) => setProofData(prev => ({ ...prev, contract: e.target.value }))}
                      className="bg-background border-input"
                    />
                  </div>
                );

              case 'X Post':
              case 'X Follow':
              case 'X Retweet':
              case 'X Like':
                return (
                  <div key="twitter" className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="flex items-center text-sm font-medium text-foreground">
                        <SiX className="h-4 w-4 mr-2" />
                        {type.replace('X ', '')} Verification
                      </label>
                      {type === 'X Follow' && taskConfig.XFollowUsername && (
                        <SocialLinkButton
                          href={`https://x.com/${taskConfig.XFollowUsername}`}
                          icon={SiX}
                          label="View Profile"
                        />
                      )}
                      {(type === 'X Like' || type === 'X Retweet') && (
                        <SocialLinkButton
                          href={type === 'X Like' ?
                            `https://x.com/i/status/${taskConfig.XLikeId}` :
                            `https://x.com/i/status/${taskConfig.XRetweetId}`
                          }
                          icon={SiX}
                          label="View Tweet"
                        />
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-4 p-4 rounded-lg bg-muted/50 border border-border">
                      <div className="flex items-center gap-2 text-foreground">
                        <SiX className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {socialAccounts?.xUserName ?
                            `@${socialAccounts.xUserName}` :
                            'No X account connected'
                          }
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isVerifying || !socialAccounts?.xId}
                        onClick={() => verifyXAction(type.split(' ')[1].toLowerCase() as any)}
                        className="hover:bg-accent hover:text-accent-foreground"
                      >
                        {isVerifying ? "Verifying..." : "Verify"}
                      </Button>
                    </div>
                  </div>
                );

              case 'Join Discord':
                return (
                  <div key="discord" className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="flex items-center text-sm font-medium text-foreground">
                        <SiDiscord className="h-4 w-4 mr-2" />
                        Discord Verification
                      </label>
                      {taskConfig.DiscordChannelId && (
                        <SocialLinkButton
                          href={taskConfig.DiscordInviteLink || ''}
                          icon={SiDiscord}
                          label="Join Server"
                        />
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-4 p-4 rounded-lg bg-muted/50 border border-border">
                      <div className="flex items-center gap-2 text-foreground">
                        <SiDiscord className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {socialAccounts?.discordUserName ?
                            socialAccounts.discordUserName :
                            'No Discord account connected'
                          }
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isVerifying || !socialAccounts?.discordId}
                        onClick={verifyDiscordJoin}
                        className="hover:bg-accent hover:text-accent-foreground"
                      >
                        {isVerifying ? "Verifying..." : "Verify"}
                      </Button>
                    </div>
                  </div>
                );
            }
          })}
        </div>

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={buttonState.disabled}
            className="min-w-[120px] bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <div className="flex items-center">
              {buttonState.icon}
              {buttonState.text}
            </div>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}