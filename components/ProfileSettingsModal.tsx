import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useState, useEffect } from "react";
import { useToast } from "./ui/use-toast";
import { Loader2 } from "lucide-react";
import { VeraxSdk } from "@verax-attestation-registry/verax-sdk";
import attestationConfig from "@/constants/attestaion";
import ImageUpload from "./ImageUpload";
import { add } from "date-fns";
import { UserProfile } from "@/types/profile";

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  address: `0x${string}`;
  onSuccess: () => void;
  initialData: UserProfile | null;
}

export default function ProfileSettingsModal({
  isOpen,
  onClose,
  address,
  onSuccess,
  initialData,
}: ProfileSettingsModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    nickname: "",
    avatar: "",
    socialAccount: "",
  });

  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        nickname: initialData.nickname || "",
        avatar: initialData.avatar || "",
        socialAccount: initialData.socialAccount || "",
      });
    }
  }, [isOpen, initialData]);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // Get signature from backend
      const response = await fetch("/api/profile/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, subject: address }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      // Initialize Verax SDK
      const veraxSdk = new VeraxSdk(VeraxSdk.DEFAULT_LINEA_SEPOLIA_FRONTEND, address);

      // Attest the profile
      const tx = await veraxSdk.portal.attest(
        attestationConfig.portal as `0x${string}`,
        {
          subject: address,
          schemaId: attestationConfig.schema,
          expirationDate: Math.floor(
            add(new Date(), { years: 1 }).getTime() / 1000,
          ),
          attestationData: [
            {
              nickname: formData.nickname,
              avatar: formData.avatar,
              socialAccount: formData.socialAccount,
            },
          ],
        },
        [],
        // [data.signature],
      );

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Profile update error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Profile Settings</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <label className="block text-sm font-medium mb-2">Avatar</label>
            <ImageUpload
              value={formData.avatar}
              onChange={(url) => setFormData(prev => ({ ...prev, avatar: url }))}
              label="Avatar"
            />
          </div>
          <Input
            placeholder="Nickname"
            value={formData.nickname}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, nickname: e.target.value }))
            }
          />
          <Input
            placeholder="Social Account"
            value={formData.socialAccount}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                socialAccount: e.target.value,
              }))
            }
          />
        </div>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            "Update Profile"
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
