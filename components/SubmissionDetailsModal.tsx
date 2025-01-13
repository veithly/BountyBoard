import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Address } from "./ui/Address";
import { useState, useEffect } from "react";
import { useToast } from "./ui/use-toast";
import { useReviewSubmission } from "@/hooks/useContract";
import { useWaitForTransactionReceipt } from "wagmi";
import { Loader2, CheckCircle, ExternalLink } from "lucide-react";
import Image from "next/image";
import type { SubmissionView, TaskView, SubmissionProof, TaskConfig } from "@/types/types";
import { SiGithub, SiX, SiDiscord } from '@icons-pack/react-simple-icons';
import { cn } from "@/lib/utils";

interface SubmissionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: SubmissionView | null;
  boardId: bigint;
  task: TaskView | null;
  isReviewer: boolean;
  onConfirmed?: () => void;
}

// 添加一个通用的社交平台按钮组件
const SocialButton = ({
  href,
  icon: Icon,
  label,
  username
}: {
  href: string;
  icon: any;
  label: string;
  username?: string;
}) => (
  <div className="flex items-center gap-2">
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-muted hover:bg-muted/80 transition-colors text-foreground"
      title={label}
    >
      <Icon className="h-4 w-4" />
      {username && <span className="text-sm font-medium">{username}</span>}
      <ExternalLink className="h-3 w-3" />
    </a>
  </div>
);

export default function SubmissionDetailsModal({
  isOpen,
  onClose,
  submission,
  boardId,
  task,
  isReviewer,
  onConfirmed,
}: SubmissionDetailsModalProps) {
  const [comment, setComment] = useState("");
  const [transactionHash, setTransactionHash] = useState<`0x${string}` | null>(null);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'confirming' | 'confirmed'>('idle');
  const { toast } = useToast();
  const reviewSubmission = useReviewSubmission();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error,
  } = useWaitForTransactionReceipt({
    hash: transactionHash as `0x${string}`,
  });

  const getExplorerUrl = (address: string, network?: string) => {
    switch (network) {
      case 'Mantle':
        return `https://explorer.mantle.xyz/address/${address}`;
      case 'Mantle Sepolia':
        return `https://explorer.sepolia.mantle.xyz/address/${address}`;
      case 'Linea':
        return `https://lineascan.build/address/${address}`;
      case 'Linea Sepolia':
        return `https://sepolia.lineascan.build/address/${address}`;
      case 'Ethereum':
        return `https://etherscan.io/address/${address}`;
      case 'Sepolia':
        return `https://sepolia.etherscan.io/address/${address}`;
      default:
        return `https://lineascan.build/address/${address}`; // 默认 Linea
    }
  };

  const handleReview = async (approved: boolean) => {
    if (!submission || !task) return;

    setSubmitStatus('submitting');
    try {
      const result = await reviewSubmission({
        boardId: boardId,
        taskId: task.id,
        submissionAddress: submission.submitter,
        approved: approved ? 1 : -1,
        reviewComment: comment,
      });

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
    } catch (error: any) {
      setSubmitStatus('idle');
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // 监听交易状态
  useEffect(() => {
    if (isConfirmed && submitStatus !== 'confirmed') {
      setSubmitStatus('confirmed');
      toast({
        title: "Success",
        description: "Review submitted successfully!",
      });
      if (onConfirmed) onConfirmed();
      onClose();
    } else if (error) {
      setSubmitStatus('idle');
      toast({
        title: "Error",
        description: "Transaction failed",
        variant: "destructive",
      });
    }
  }, [isConfirmed, error, onClose, onConfirmed, submitStatus]);

  const getButtonState = (type: 'approve' | 'reject') => {
    if (submitStatus === 'submitting' || submitStatus === 'confirming') {
      return {
        disabled: true,
        icon: <Loader2 className="mr-2 h-4 w-4 animate-spin" />,
        text: submitStatus === 'submitting' ? 'Submitting...' : 'Confirming...'
      };
    }
    if (submitStatus === 'confirmed') {
      return {
        disabled: true,
        icon: <CheckCircle className="mr-2 h-4 w-4" />,
        text: 'Confirmed!'
      };
    }
    return {
      disabled: false,
      icon: null,
      text: type === 'approve' ? 'Approve' : 'Reject'
    };
  };

  // 从 MemberSubmissionTable 复制并修改的 renderProofContent 函数
  const renderProofContent = (proof: string) => {
    try {
      const proofData: SubmissionProof = JSON.parse(proof);
      const taskConfig: TaskConfig = task ? JSON.parse(task.config || '{}') : {};

      return (
        <Tabs defaultValue="text" className="w-full">
          <TabsList className="grid w-full grid-cols-7 bg-muted/30">
            {proofData.text && <TabsTrigger value="text">Text</TabsTrigger>}
            {proofData.image && <TabsTrigger value="image">Image</TabsTrigger>}
            {proofData.github && <TabsTrigger value="github">GitHub</TabsTrigger>}
            {proofData.contract && <TabsTrigger value="contract">Contract</TabsTrigger>}
            {proofData.xPost && <TabsTrigger value="xPost">X Post</TabsTrigger>}
            {proofData.xUserName && <TabsTrigger value="X">X Profile</TabsTrigger>}
            {proofData.discordUserName && <TabsTrigger value="discord">Discord</TabsTrigger>}
          </TabsList>

          <div className="mt-4 p-4">
            {proofData.text && (
              <TabsContent value="text">
                <Textarea
                  value={proofData.text}
                  readOnly
                  className="resize-none bg-muted/30 border-input min-h-[100px]"
                />
              </TabsContent>
            )}

            {proofData.image && (
              <TabsContent value="image">
                <div className="relative h-[300px] w-full rounded-lg border border-border overflow-hidden">
                  <Image
                    src={proofData.image}
                    alt="Proof"
                    fill
                    className="object-contain"
                  />
                </div>
              </TabsContent>
            )}

            {proofData.github && (
              <TabsContent value="github">
                <div className="flex flex-col gap-3">
                  <span className="text-sm text-muted-foreground">Repository:</span>
                  <SocialButton
                    href={`https://github.com/${proofData.github}`}
                    icon={SiGithub}
                    label="View on GitHub"
                    username={proofData.github}
                  />
                </div>
              </TabsContent>
            )}

            {proofData.contract && (
              <TabsContent value="contract">
                <div className="flex flex-col gap-3">
                  <span className="text-sm text-muted-foreground">Contract Address:</span>
                  <div className="flex items-center gap-2">
                    <code className="px-2 py-1 bg-muted/30 border-input rounded text-sm font-mono">
                      {proofData.contract}
                    </code>
                    <a
                      href={getExplorerUrl(proofData.contract, taskConfig.contractNetwork)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-md bg-muted/30 border-input hover:bg-muted/40 transition-colors"
                      title="View on Explorer"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </TabsContent>
            )}

            {proofData.xUserName && (
              <TabsContent value="X">
                <div className="flex flex-col gap-3">
                  <span className="text-sm text-muted-foreground">X Profile:</span>
                  <SocialButton
                    href={`https://x.com/${proofData.xUserName}`}
                    icon={SiX}
                    label="View X Profile"
                    username={`@${proofData.xUserName}`}
                  />
                </div>
              </TabsContent>
            )}

            {proofData.xPost && (
              <TabsContent value="xPost">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Posted by:</span>
                    <SocialButton
                      href={`https://x.com/${proofData.xUserName}/status/${proofData.xPost}`}
                      icon={SiX}
                      label="View Post"
                    />
                  </div>
                  <span className="text-sm font-medium">@{proofData.xUserName}</span>
                </div>
              </TabsContent>
            )}

            {proofData.discordUserName && (
              <TabsContent value="discord">
                <div className="flex flex-col gap-3">
                  <span className="text-sm text-muted-foreground">Discord User:</span>
                  <div className="flex items-center gap-2">
                    <SiDiscord className="h-4 w-4" />
                    <span className="font-medium">{proofData.discordUserName}</span>
                  </div>
                </div>
              </TabsContent>
            )}
          </div>
        </Tabs>
      );
    } catch (e) {
      return (
        <Textarea
          value={proof}
          readOnly
          className="mt-2 resize-none bg-muted/30 border-input min-h-[100px]"
        />
      );
    }
  };

  useEffect(() => {
    if (isOpen) {
      setComment("");
      setTransactionHash(null);
      setSubmitStatus('idle');
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Submission Details</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Submitted by: <Address address={submission?.submitter || "0x0"} />
          </DialogDescription>
        </DialogHeader>

        {submission && task && (
          <div className="mt-4 space-y-6">
            <div className="grid grid-cols-2 gap-4 p-4 rounded-lg border border-border bg-muted/30">
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground">Task:</span>
                <p className="text-foreground">{task.name}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground">Status:</span>
                <p className={cn(
                  "font-medium",
                  submission.status === 1 && "text-green-500 dark:text-green-400",
                  submission.status === -1 && "text-red-500 dark:text-red-400",
                  submission.status === 0 && "text-yellow-500 dark:text-yellow-400"
                )}>
                  {submission.status === 1
                    ? "Approved"
                    : submission.status === -1
                    ? "Rejected"
                    : "Pending"}
                </p>
              </div>
            </div>

            {submission.reviewComment && (
              <div className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">Review Comment:</span>
                <p className="p-4 rounded-lg bg-muted/30 border border-border text-foreground">
                  {submission.reviewComment}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <span className="text-sm font-medium text-muted-foreground">Proof:</span>
              <div className="rounded-lg border border-border bg-background">
                {renderProofContent(submission.proof)}
              </div>
            </div>

            {/* 审核部分 - 只对审核人员显示 */}
            {isReviewer && submission.status === 0 && (
              <div className="space-y-4 pt-4 border-t border-border">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Review Comment:
                  </label>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Enter your review comment..."
                    className="min-h-[100px] bg-background border-input focus-visible:ring-ring"
                  />
                </div>
                <div className="flex justify-end gap-4">
                  <Button
                    variant="destructive"
                    onClick={() => handleReview(false)}
                    disabled={getButtonState('reject').disabled}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {getButtonState('reject').icon}
                    {getButtonState('reject').text}
                  </Button>
                  <Button
                    onClick={() => handleReview(true)}
                    disabled={getButtonState('approve').disabled}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {getButtonState('approve').icon}
                    {getButtonState('approve').text}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}