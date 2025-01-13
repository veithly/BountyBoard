import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import ImageUpload from "@/components/ImageUpload";
import { useWaitForTransactionReceipt } from "wagmi";
import { Chain, zeroAddress } from 'viem';
import { useAccount } from 'wagmi';
import { getNativeTokenSymbol } from '@/utils/chain';

interface BoardFormProps {
  initialData?: {
    id?: bigint;
    name: string;
    description: string;
    img: string;
    rewardToken: string;
    config?: string;
  };
  onSubmit: (data: any) => Promise<{ hash?: string }>;
  mode: 'create' | 'update';
  redirectPath?: string;
  isDialog?: boolean;
}

interface FormData {
  id?: bigint;
  name: string;
  description: string;
  img: string;
  tokenType: 'native' | 'erc20';
  rewardToken: string;
  channelId: string;
}

export default function BoardForm({ initialData, onSubmit, mode, redirectPath = '/boards', isDialog = false }: BoardFormProps) {

  const initialConfig = initialData?.config ? JSON.parse(initialData.config) : {};
  const [formData, setFormData] = useState<FormData>({
    id: initialData?.id,
    name: initialData?.name || "",
    description: initialData?.description || "",
    img: initialData?.img || "",
    tokenType: initialData?.rewardToken === zeroAddress ? 'native' : 'erc20',
    rewardToken: initialData?.rewardToken === zeroAddress ? "" : (initialData?.rewardToken || ""),
    channelId: initialConfig?.channelId || "",
  });

  const [transactionHash, setTransactionHash] = useState<`0x${string}`>();
  const router = useRouter();
  const { toast } = useToast();
  const { chain } = useAccount();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error
  } = useWaitForTransactionReceipt({
    hash: transactionHash,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        rewardToken: formData.tokenType === 'native' ? zeroAddress : formData.rewardToken,
        config: JSON.stringify({
          channelId: formData.channelId
        })
      };

      if (mode === 'update' && initialData) {
        submitData.id = initialData.id;
      }

      const result = await onSubmit(submitData);
      if (result.hash) {
        setTransactionHash(result.hash as `0x${string}`);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit transaction",
        variant: "destructive",
      });
    }
  };

  // Monitor transaction status
  useEffect(() => {
    if (isConfirming) {
      toast({
        title: "Processing",
        description: (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
            <span>Waiting for transaction confirmation...</span>
          </div>
        ),
      });
    } else if (isConfirmed) {
      toast({
        title: "Success!",
        description: `Board ${mode === 'create' ? 'created' : 'updated'} successfully.`,
      });

      // Send Discord announcement
      if (formData.channelId) {
        fetch('/api/discord-announcement', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            channelId: formData.channelId,
            type: 'board_created',
            data: `Please introduce yourself and help us announce the new bounty board: Board Name: ${formData.name} Board Description: ${formData.description}`
          })
        }).catch(error => {
          console.error('Failed to send Discord announcement:', error);
        });
      }

      router.push(redirectPath);
    } else if (error) {
      toast({
        title: "Error",
        description: "Transaction failed",
        variant: "destructive",
      });
      setTransactionHash(undefined);
    }
  }, [isConfirming, isConfirmed, error, mode, redirectPath, router, toast, formData]);

  return (
    <motion.form
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4 }}
      onSubmit={handleSubmit}
      className={`max-w-2xl mx-auto ${!isDialog ? 'glass-card p-8 rounded-xl' : ''}`}
    >
      {/* Form fields */}
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-purple-300 mb-2">
            Board Name
          </label>
          <Input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="glass-input"
            placeholder="Enter your board name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-purple-300 mb-2">
            Description
          </label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="glass-input min-h-[100px]"
            placeholder="Describe your bounty board's purpose and goals"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-purple-300 mb-2">
            Board Logo
          </label>
          <div className="max-w-[240px]">
            <ImageUpload
              value={formData.img}
              onChange={(url) => setFormData({ ...formData, img: url })}
              label="Board Logo"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-purple-300 mb-2">
            Reward Token Type
          </label>
          <div className="flex gap-4">
            <Button
              type="button"
              variant={formData.tokenType === 'native' ? 'default' : 'outline'}
              onClick={() => setFormData({ ...formData, tokenType: 'native', rewardToken: '' })}
              className="flex-1"
            >
              Native Token ({getNativeTokenSymbol(chain)})
            </Button>
            <Button
              type="button"
              variant={formData.tokenType === 'erc20' ? 'default' : 'outline'}
              onClick={() => setFormData({ ...formData, tokenType: 'erc20' })}
              className="flex-1"
            >
              ERC20 Token
            </Button>
          </div>

          {formData.tokenType === 'erc20' && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-purple-300 mb-2">
                ERC20 Token Address
              </label>
              <Input
                type="text"
                value={formData.rewardToken}
                onChange={(e) => setFormData({ ...formData, rewardToken: e.target.value })}
                className="glass-input"
                placeholder="Enter ERC20 token contract address"
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-purple-300 mb-2">
            Discord Channel ID
          </label>
          <Input
            type="text"
            value={formData.channelId}
            onChange={(e) => setFormData({ ...formData, channelId: e.target.value })}
            className="glass-input"
            placeholder="Enter the Discord channel ID"
          />
        </div>

        <Button
          type="submit"
          className="w-full neon-button-primary"
          disabled={isConfirming}
        >
          {isConfirming ? 'Processing...' : mode === 'create' ? 'Create Board' : 'Update Board'}
        </Button>
      </div>
    </motion.form>
  );
}