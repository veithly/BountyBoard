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
    setIsVerifying(true);
    try {
      // 这里添加实际的 Twitter API 验证逻辑
      const verified = true; // 模拟验证
      if (verified) {
        toast({ title: "Success", description: "X action verified successfully" });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify X action",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // 验证 Discord 加入
  const verifyDiscordJoin = async () => {
    setIsVerifying(true);
    try {
      // 这里添加实际的 Discord API 验证逻辑
      const verified = true; // 模拟验证
      if (verified) {
        toast({ title: "Success", description: "Discord join verified successfully" });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify Discord join",
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
        setTransactionHash(result.hash);
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
                      placeholder="https://github.com/..."
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
                    <label className="block text-sm font-medium mb-2">
                      <SiX className="inline h-4 w-4 mr-2" />
                      {type.replace('X ', '')} Verification
                    </label>
                    <div className="flex gap-2">
                      <Input
                        placeholder={
                          type === 'X Follow' ? '@username' :
                          type === 'X Post' ? 'Post URL' :
                          'Tweet URL'
                        }
                        value={proofData.xId || ''}
                        onChange={(e) => setProofData(prev => ({ ...prev, xId: e.target.value }))}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isVerifying}
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
                    <label className="block text-sm font-medium mb-2">
                      <SiDiscord className="inline h-4 w-4 mr-2" />
                      Discord Verification
                    </label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Discord Username"
                        value={proofData.discordId || ''}
                        onChange={(e) => setProofData(prev => ({ ...prev, discordId: e.target.value }))}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isVerifying}
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