"use client";

import { useState } from "react";
import { useCreateBoard } from "@/hooks/useContract";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Upload, ArrowLeft, Rocket, Shield, Bot, Eye } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import ImageUpload from "@/components/ImageUpload";

export default function CreateBoardPage() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    img: "",
    rewardToken: "",
  });
  const [isUploading, setIsUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const createBoard = useCreateBoard();
  const router = useRouter();
  const { toast } = useToast();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    // 这里添加你的图片上传逻辑
    setIsUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await createBoard(formData);
      if (result.hash) {
        toast({
          title: "Success!",
          description: "Board created successfully.",
        });
        router.push("/boards");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create board",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-purple-900/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/boards" className="text-purple-400 hover:text-purple-300">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-purple-600">
            Create New Bounty Board
          </h1>
        </div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          onSubmit={handleSubmit}
          className="max-w-2xl mx-auto glass-card p-8 rounded-xl"
        >
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
              <p className="mt-2 text-sm text-purple-400/60">
                Upload a square logo to represent your board
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-300 mb-2">
                Reward Token Address (Optional)
              </label>
              <Input
                type="text"
                value={formData.rewardToken}
                onChange={(e) => setFormData({ ...formData, rewardToken: e.target.value })}
                className="glass-input"
                placeholder="Leave blank for ETH"
              />
            </div>

            <Button type="submit" className="w-full neon-button-primary">
              Create Board
            </Button>
          </div>
        </motion.form>
      </div>
    </div>
  );
}