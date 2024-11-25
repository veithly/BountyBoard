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
import { Upload, Loader2, CheckCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import Image from "next/image";
import { TaskConfig, SubmissionProof } from "@/types/types";
import {
  SiGithub,
  SiX,
  SiDiscord,
  SiEthereum,
} from '@icons-pack/react-simple-icons';
import { useWaitForTransactionReceipt } from "wagmi";
import { useUserStore } from '@/store/userStore';

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
  const [isUploading, setIsUploading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [transactionHash, setTransactionHash] = useState<`0x${string}` | null>(null);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'confirming' | 'confirmed'>('idle');
  const { toast } = useToast();

  // 使用 useWaitForTransactionReceipt
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error,
  } = useWaitForTransactionReceipt({
    hash: transactionHash as `0x${string}`,
  });

  // 监听交易状态
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

  // 处理图片上传
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("https://api.img2ipfs.org/api/v0/add", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      setProofData(prev => ({ ...prev, image: data.Url }));
      toast({ title: "Success", description: "Image uploaded successfully" });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // 验证 X (Twitter) 操作
  const verifyXAction = async (action: 'follow' | 'retweet' | 'like') => {
    if (!socialAccounts?.xAccessToken) {
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
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${socialAccounts.xAccessToken}`,
          'X-User-Id': socialAccounts.xId,
          'X-Action-Type': action,
          'X-Target-User': taskConfig.XFollowUsername || '',
          'X-Tweet-Id': action === 'like' ? taskConfig.XLikeId || '' :
                        action === 'retweet' ? taskConfig.XRetweetId || '' : ''
        } as HeadersInit
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

  // 验证 Discord 加入
  const verifyDiscordJoin = async () => {
    if (!socialAccounts?.discordAccessToken) {
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
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${socialAccounts.discordAccessToken}`,
          'X-User-Id': socialAccounts.discordId,
          'X-Guild-Id': taskConfig.DiscordChannelId || ''
        } as HeadersInit
      });

      const data = await response.json();

      if (data.inGuild) {
        setProofData(prev => ({
          ...prev,
          discordUserName: socialAccounts.discordUserName,
          discordName: socialAccounts.discordName,
          discordId: socialAccounts.discordId,
          discordAccessToken: socialAccounts.discordAccessToken
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

  // 获取按钮状态
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
          disabled: isUploading || isVerifying,
          icon: null
        };
    }
  };

  const buttonState = getButtonState();

  // 添加一个通用的社交平台链接按钮组件
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
      className="h-9"
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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Submit Proof</DialogTitle>
          <DialogDescription>
            Please provide the required proof for this task.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {taskConfig.taskType.map((type) => {
            switch (type) {
              case 'Plain Text':
                return (
                  <div key="text">
                    <label className="block text-sm font-medium mb-2">Text Proof</label>
                    <Textarea
                      placeholder="Enter your proof..."
                      value={proofData.text || ''}
                      onChange={(e) => setProofData(prev => ({ ...prev, text: e.target.value }))}
                    />
                  </div>
                );

              case 'Image':
                return (
                  <div key="image">
                    <label className="block text-sm font-medium mb-2">Image Proof</label>
                    <div className="flex items-center gap-4">
                      {proofData.image && (
                        <Image src={proofData.image} alt="Proof" width={100} height={100} />
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isUploading}
                        onClick={() => document.getElementById('image-upload')?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {isUploading ? "Uploading..." : "Upload Image"}
                      </Button>
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        aria-label="Upload image"
                        onChange={handleImageUpload}
                      />
                    </div>
                  </div>
                );

              case 'Github Pull Request':
                return (
                  <div key="github">
                    <label className="block text-sm font-medium mb-2">
                      <SiGithub className="inline h-4 w-4 mr-2" />
                      GitHub PR URL
                    </label>
                    <Input
                      placeholder="https://github.com/name/repo/pull/123"
                      value={proofData.github || ''}
                      onChange={(e) => setProofData(prev => ({ ...prev, github: e.target.value }))}
                    />
                  </div>
                );

              case 'Contract Verification':
                return (
                  <div key="contract">
                    <label className="block text-sm font-medium mb-2">
                      <SiEthereum className="inline h-4 w-4 mr-2" />
                      Contract Address
                    </label>
                    <Input
                      placeholder="0x..."
                      value={proofData.contract || ''}
                      onChange={(e) => setProofData(prev => ({ ...prev, contract: e.target.value }))}
                    />
                  </div>
                );

              case 'X Post':
              case 'X Follow':
              case 'X Retweet':
              case 'X Like':
                return (
                  <div key="twitter">
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium">
                        <SiX className="inline h-4 w-4 mr-2" />
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
                    <div className="flex items-center justify-between gap-4 p-4 rounded-lg bg-muted">
                      <div className="flex items-center gap-2">
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
                        disabled={isVerifying || !socialAccounts?.xAccessToken}
                        onClick={() => verifyXAction(type.split(' ')[1].toLowerCase() as any)}
                      >
                        {isVerifying ? "Verifying..." : "Verify"}
                      </Button>
                    </div>
                  </div>
                );

              case 'Join Discord':
                return (
                  <div key="discord">
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium">
                        <SiDiscord className="inline h-4 w-4 mr-2" />
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
                    <div className="flex items-center justify-between gap-4 p-4 rounded-lg bg-muted">
                      <div className="flex items-center gap-2">
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
                        disabled={isVerifying || !socialAccounts?.discordAccessToken}
                        onClick={verifyDiscordJoin}
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
            className="min-w-[120px]"
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