export * from "./providers/wallet";
export * from "./types";

import type { Plugin } from "@ai16z/eliza";
import { evmWalletProvider } from "./providers/wallet";
import { reviewAction } from "./actions/review";
import { queryAction } from "./actions/query";

export const bountyboardPlugin: Plugin = {
    name: "bountyboard",
    description: "BountyBoard integration plugin",
    providers: [evmWalletProvider],
    evaluators: [],
    services: [],
    actions: [reviewAction, queryAction],
};

export default bountyboardPlugin;
