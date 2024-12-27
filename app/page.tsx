"use client";

import { useAccount } from "wagmi";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import Image from "next/image";
import { Bot, Shield, Rocket, Eye, Users, Share } from "lucide-react";
import { useRouter } from "next/navigation";

// Use Cases data
const USE_CASES = [
  {
    title: "Developer Education",
    image: "/home/DeveloperEducation.jpg",
    description: "Attract developers to your project ecosystem through AI-powered learning paths and incentivized development programs.",
    features: [
      "Create collaborative study groups and track learning progress within the Bounty Board platform",
      "Reward contributors upon completion of project milestones, incentivizing continued engagement",
      "Utilize AI to automate code reviews, ensuring efficient and consistent evaluation of submissions"
    ],
    reverse: false
  },
  {
    title: "Product Attraction and Testing",
    image: "/home/ProductTesting.jpg",
    description: "Guide users to interact with your project through incentivized testing programs, increasing exposure while identifying potential issues.",
    features: [
      "AI-powered bug detection and verification system",
      "Automated reward distribution for valuable feedback and bug reports",
      "Smart contract security testing and validation",
      "User experience feedback analysis and tracking"
    ],
    reverse: true
  },
  {
    title: "Community Building",
    image: "/home/CommunityBuilding.jpg",
    description: "Encourage DAO members to organize and participate in community activities with automated reward distribution.",
    features: [
      "AI-assisted Discord and social media engagement tracking",
      "Automated community event management and reward distribution",
      "Smart contract-based governance participation incentives",
      "AI-powered content moderation and quality assessment"
    ],
    reverse: false
  }
];

// Features data
const FEATURES = [
  {
    title: "Quick Launch",
    description: "Create community reward activities in minutes. Streamlined process for setting up bounty boards, defining tasks, and managing rewards - all in one place.",
    icon: Rocket
  },
  {
    title: "AI Review",
    description: "Leverage AI assistance for task verification or set up multiple reviewers for flexible and efficient task assessment. Customizable review processes to match your community needs.",
    icon: Bot
  },
  {
    title: "AI Community Management",
    description: "Intelligent AI agents assist in community operations by automating announcements, task reviews, and member engagement. Seamlessly integrates with Discord for enhanced community interaction and management.",
    icon: Users
  },
  {
    title: "Smart Contract Automation",
    description: "Automated reward distribution through smart contracts ensures accurate and timely payments. No manual intervention needed, eliminating human error and ensuring trustless execution.",
    icon: Shield
  },
  {
    title: "Full Transparency",
    description: "Complete visibility of all task activities and progress. On-chain records ensure permanent and transparent history of all submissions, reviews, and reward distributions.",
    icon: Eye
  },
  {
    title: "Social Integration",
    description: "Seamless integration with popular platforms like Discord, Twitter, and GitHub. Verify social engagements automatically and track community growth across multiple channels.",
    icon: Share
  }
];

export default function HomePage() {
  const { address } = useAccount();
  const { toast } = useToast();
  const router = useRouter();

  const handleCreateBoard = () => {
    if (!address) {
      toast({
        variant: "destructive",
        title: "Wallet not connected",
        description: "Please connect your wallet to create a board",
      });
      return;
    }
    router.push("/boards/create");
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="relative h-[600px] w-full">
        <Image
          src="/index-head.png"
          alt="Bounty Board"
          fill
          className="object-cover brightness-50"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background" />
        <div className="relative container mx-auto h-full flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-6xl font-bold mb-6 glow-text animate-fade-in">
            Welcome to Bounty Board
          </h1>
          <p className="text-xl text-purple-200/90 max-w-3xl mb-8 animate-fade-in-delay">
            A Web3-native platform revolutionizing community engagement and task
            management. Create, manage, and participate in bounty tasks with
            transparency and efficiency.
          </p>
          <div className="flex gap-6 mt-4">
            <Link
              href="/boards"
              className="neon-button-primary group animate-fade-in-delay-2"
            >
              <span className="relative z-10 flex items-center">
                Explore Boards
                <svg
                  className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </span>
            </Link>
            <button
              type="button"
              onClick={handleCreateBoard}
              className="neon-button-secondary group animate-fade-in-delay-2"
            >
              <span className="relative z-10 flex items-center">
                Create Board
                <svg
                  className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Use Cases Section */}
      <div className="bg-black/30 backdrop-blur-sm py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-8">
            {USE_CASES.map((useCase, index) => (
              <div key={index} className="glass-card p-8 rounded-2xl">
                <div className={`flex flex-col ${useCase.reverse ? 'md:flex-row-reverse' : 'md:flex-row'} gap-8 items-center`}>
                  <div className="w-full md:w-1/2">
                    <div className="relative aspect-square max-w-[270px] mx-auto">
                      <Image
                        src={useCase.image}
                        alt={useCase.title}
                        fill
                        className="rounded-xl object-cover border-2 border-purple-500/30"
                      />
                    </div>
                  </div>
                  <div className="w-full md:w-1/2 space-y-4">
                    <h3 className="text-3xl font-bold text-purple-300">
                      {useCase.title}
                    </h3>
                    <div className="space-y-4 text-gray-400">
                      <p>{useCase.description}</p>
                      <ul className="list-disc list-inside space-y-2">
                        {useCase.features.map((feature, featureIndex) => (
                          <li key={featureIndex}>{feature}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURES.map((feature, index) => (
            <div key={index} className="glass-card p-8 rounded-2xl">
              <div className="h-16 w-16 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center">
                <feature.icon className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-4 text-purple-300">
                {feature.title}
              </h2>
              <p className="text-gray-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-auto py-6 text-center text-sm text-gray-400">
        <p>© 2024 Bounty Board. All rights reserved.</p>
      </footer>
    </div>
  );
}
