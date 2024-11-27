# Bounty Board: The Web3 Community Engagement Tool

Bounty Board is a decentralized platform designed to streamline Web3 community activities. It offers transparent, secure, and efficient solutions for tasks like airdrops and development missions, eliminating the hassle of user data recording, form creation, submission review, and token payments. All records are stored on-chain to ensure fairness and integrity in activities.

![Bounty Board](./assets/Screenshot.png)

## Technical Architecture

Bounty Board employs the following technical architecture:

- **Smart Contracts (Solidity):** The core logic is implemented via smart contracts written in Solidity, managing functions such as bounty boards, activity tasks, submissions, reviews, and reward disbursements.
- **Next.js:** Next.js is utilized to build the frontend application and backend api.
- **Wagmi:** Wagmi is employed to connect Ethereum wallets, facilitating user interaction with smart contracts.
- **Shadcn/UI:** The Shadcn/UI component library is used to create an aesthetically pleasing user interface.
- **AI Agent:** AI Agent is used to review submissions.
- **Verax:** Verax is used to store user profile information.

## Core Features

- **Simplified Activity Creation:** Communities can easily create various tasks, including study groups, project collaborations, airdrops, and more, with customizable task content, rewards, reviewers, and deadlines.
- **Automated Data Recording:** User information, participation status, and completion progress are automatically recorded, with automatic generation of comprehensive tables for visualization, eliminating the need for manual table maintenance.
- **AI Review:** Board managers can set up AI agents to review submissions. When reviewing, the AI agent will get the task description and submission content(if the content is a PR link of github or a verification contract address, the AI agent will get the PR code content or contract code content), and then generate a review report and distribute rewards.
- **On-Chain Token Payments:** Supports reward distribution using various tokens. Initiators must stake the corresponding tokens into the contract, which are automatically distributed upon review completion.
- **Permanent Data Storage:** All activity information and records are stored on the blockchain, ensuring permanent, tamper-proof preservation.

## Future Development Goals

- **Refined Permission Controls:** Implement more granular permission management, such as visibility control for different bounty boards or tasks, and require application verification for joining bounty boards.
- **Multi-Token Reward System:** Support issuing different types of tokens as rewards for various tasks, increasing the flexibility of activities.
- **Token Staking Revenue:** The platform can stake tokens from the contract into liquidity pools to generate revenue, creating a sustainable economic model.
- **Decentralized Organization Collaboration:** Expand platform functionality to serve as a tool for decentralized organizations for project collaboration, task distribution, and compensation management.

## Contact

If you want to join the bounty board hackathon project or seek cooperation, please contact us at [email](mailto:veithly@live.com).
