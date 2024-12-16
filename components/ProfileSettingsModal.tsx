import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useState, useEffect } from "react";
import { useToast } from "./ui/use-toast";
import { Loader2 } from "lucide-react";
import { SiGithub, SiX, SiDiscord } from "@icons-pack/react-simple-icons";
import ImageUpload from "./ImageUpload";
import { UserProfile, socialAccount } from "@/types/profile";
import { signIn, useSession } from "next-auth/react";
import { useUserStore } from "@/store/userStore";
import { encryptData } from "@/utils/encryption";
import { useSetProfile } from "@/hooks/useContract";

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
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const { data: session } = useSession();
  const { setSocialAccounts, socialAccounts } = useUserStore();
  const setProfileContract = useSetProfile();

  // 保存表单数据到 localStorage
  const saveFormData = (data: any) => {
    localStorage.setItem("profileFormData", JSON.stringify(data));
  };

  // 从 localStorage 获取表单数据
  const loadFormData = () => {
    const saved = localStorage.getItem("profileFormData");
    return saved ? JSON.parse(saved) : null;
  };

  const [formData, setFormData] = useState({
    nickname: "",
    avatar: "",
    socialAccounts: socialAccounts || {
      xUserName: "",
      xName: "",
      xId: "",
      discordUserName: "",
      discordName: "",
      discordId: "",
      githubUserName: "",
      githubName: "",
      githubId: "",
      xAccessToken: "",
      discordAccessToken: "",
      githubAccessToken: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      const params = new URLSearchParams(window.location.search);
      const modalType = params.get("modal");
      const provider = params.get("provider");

      // 如果是从社交验证回调回来，不清除表单数据
      if (modalType === "profile" && provider) {
        const savedData = loadFormData();
        if (savedData) {
          setFormData(savedData);
          return;
        }
      }

      // 其他情况下的正常逻辑
      if (!initialData) {
        setFormData({
          nickname: "",
          avatar: "",
          socialAccounts: {
            xUserName: "",
            xName: "",
            xId: "",
            discordUserName: "",
            discordName: "",
            discordId: "",
            githubUserName: "",
            githubName: "",
            githubId: "",
            xAccessToken: "",
            discordAccessToken: "",
            githubAccessToken: "",
          },
        });
        localStorage.removeItem("profileFormData");
      } else {
        let socialAccounts: socialAccount = {
          xUserName: "",
          xName: "",
          xId: "",
          discordUserName: "",
          discordName: "",
          discordId: "",
          githubUserName: "",
          githubName: "",
          githubId: "",
          xAccessToken: "",
          discordAccessToken: "",
          githubAccessToken: "",
          encryptedTokens: "",
        };

        try {
          if (initialData.socialAccount) {
            const parsed = JSON.parse(initialData.socialAccount);
            socialAccounts = {
              ...socialAccounts,
              ...parsed,
            };
          }
        } catch {}

        const newFormData = {
          nickname: initialData.nickname || "",
          avatar: initialData.avatar || "",
          socialAccounts,
        };
        setFormData(newFormData);
        saveFormData(newFormData);
      }
    }
  }, [isOpen, initialData]);

  // 添加新的 state 来保存验证信息
  const [verificationInfo, setVerificationInfo] = useState<{
    modalType: string | null;
    provider: string | null;
  } | null>(null);

  // 修改处理社交账号验证的函数
  const handleSocialVerification = async (
    provider: "twitter" | "discord" | "github"
  ) => {
    try {
      setIsVerifying(true);
      saveFormData(formData);

      // 保存验证信息到 localStorage
      const verificationInfo = { modalType: "profile", provider };
      localStorage.setItem(
        "verificationInfo",
        JSON.stringify(verificationInfo)
      );
      localStorage.setItem("profileModalShouldOpen", "true");

      await signIn(provider, {
        redirect: true,
        callbackUrl: `${window.location.origin}?modal=profile&provider=${provider}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to verify ${provider} account`,
        variant: "destructive",
      });
      setIsVerifying(false);
    }
  };

  const getSocialAccountInfo = (
    provider: "twitter" | "discord" | "github",
    data: any,
    accessToken: string
  ) => {
    switch (provider) {
      case "twitter":
        return {
          xUserName: data.data.username,
          xName: data.data.name,
          xId: data.data.id,
          xAccessToken: accessToken,
        };
      case "discord":
        return {
          discordUserName: data.username,
          discordName: data.global_name,
          discordId: data.id,
          discordAccessToken: accessToken,
        };
      case "github":
        return {
          githubUserName: data.login,
          githubName: data.name,
          githubAccessToken: accessToken,
          githubId: data.id,
        };
    }
  };

  // 修改验证回调处理
  useEffect(() => {
    // 从 localStorage 获取验证信息
    const savedVerificationInfo = localStorage.getItem("verificationInfo");
    const verificationInfo = savedVerificationInfo
      ? JSON.parse(savedVerificationInfo)
      : null;

    console.log("Verification check:", {
      session,
      isOpen,
      verificationInfo,
    });

    if (
      session &&
      verificationInfo?.modalType === "profile" &&
      verificationInfo?.provider &&
      isOpen
    ) {
      const verifyAccount = async () => {
        try {
          const savedData = loadFormData();
          if (!savedData) {
            console.error("No saved form data found");
            return;
          }

          setFormData(savedData);

          const response = await fetch(
            `/api/social/${verificationInfo.provider}/verify`,
            {
              headers: {
                Authorization: `Bearer ${(session as any).accessToken}`,
                "X-User-Id": (session as any).user.id,
              },
            }
          );

          const data = await response.json();
          console.log("Verification response:", data);

          if (data) {
            const socialInfo = getSocialAccountInfo(
              verificationInfo.provider,
              data,
              (session as any).accessToken
            );
            console.log("Social info:", socialInfo);

            const newFormData = {
              ...savedData,
              socialAccounts: {
                ...savedData.socialAccounts,
                ...socialInfo,
              },
            };

            setFormData(newFormData);
            saveFormData(newFormData);
            setSocialAccounts(newFormData.socialAccounts);

            // 清除验证信息
            localStorage.removeItem("verificationInfo");

            toast({
              title: "Success",
              description: `${verificationInfo.provider} account verified`,
            });
          }
        } catch (error) {
          console.error("Verification error:", error);
          toast({
            title: "Error",
            description: `Failed to verify ${verificationInfo.provider} account`,
            variant: "destructive",
          });
        } finally {
          setIsVerifying(false);
        }
      };

      verifyAccount();
    }
  }, [session, isOpen]);

  // 清理函数
  useEffect(() => {
    return () => {
      if (!isOpen) {
        localStorage.removeItem("profileFormData");
        localStorage.removeItem("verificationInfo");
      }
    };
  }, [isOpen]);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // 将公开数据和敏感数据分开
      const publicSocialAccounts = {
        xUserName: formData.socialAccounts.xUserName,
        xName: formData.socialAccounts.xName,
        xId: formData.socialAccounts.xId,
        discordUserName: formData.socialAccounts.discordUserName,
        discordName: formData.socialAccounts.discordName,
        discordId: formData.socialAccounts.discordId,
        githubUserName: formData.socialAccounts.githubUserName,
        githubName: formData.socialAccounts.githubName,
        githubId: formData.socialAccounts.githubId,
      };

      // 使用 AES 加密敏感数据
      const sensitiveData = {
        xAccessToken: formData.socialAccounts.xAccessToken,
        discordAccessToken: formData.socialAccounts.discordAccessToken,
        githubAccessToken: formData.socialAccounts.githubAccessToken,
      };

      const encryptedSensitiveData = await encryptData(JSON.stringify(sensitiveData));

      console.log("Encrypted sensitive data:", encryptedSensitiveData);

      // 组合公开数据和加密后的敏感数据
      const socialAccountData = {
        ...publicSocialAccounts,
        encryptedTokens: encryptedSensitiveData,
      };

      const socialAccountJson = JSON.stringify(socialAccountData);

      // 获取签名
      const response = await fetch("/api/profile/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: formData.nickname,
          avatar: formData.avatar,
          socialAccount: socialAccountJson,
          subject: address,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      // 更新合约调用
      const { hash } = await setProfileContract({
        nickname: formData.nickname,
        avatar: formData.avatar,
        socialAccount: socialAccountJson,
        signature: data.signature,
      });

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
        description:
          error instanceof Error ? error.message : "Failed to update profile",
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
            <div className="max-w-[250px]">
              <ImageUpload
                value={formData.avatar}
                onChange={(url) => {
                  const newFormData = { ...formData, avatar: url };
                  setFormData(newFormData);
                  saveFormData(newFormData);
                }}
                label="Avatar"
              />
            </div>
          </div>
          <label className="block text-sm font-medium mb-2">Nickname</label>
          <Input
            placeholder="Nickname"
            value={formData.nickname}
            onChange={(e) => {
              const newFormData = { ...formData, nickname: e.target.value };
              setFormData(newFormData);
              saveFormData(newFormData);
            }}
          />
          <div className="space-y-4">
            <label className="block text-sm font-medium">Social Accounts</label>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSocialVerification("twitter")}
              >
                <SiX className="mr-2 h-4 w-4" />
                {formData.socialAccounts.xUserName
                  ? formData.socialAccounts.xName
                  : "Verify X"}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSocialVerification("discord")}
              >
                <SiDiscord className="mr-2 h-4 w-4" />
                {formData.socialAccounts.discordUserName
                  ? formData.socialAccounts.discordName
                  : "Verify Discord"}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSocialVerification("github")}
              >
                <SiGithub className="mr-2 h-4 w-4" />
                {formData.socialAccounts.githubUserName
                  ? formData.socialAccounts.githubName
                  : "Verify GitHub"}
              </Button>
            </div>
          </div>
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
