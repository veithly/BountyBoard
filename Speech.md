Bounty Board 是一个基于Web3的赏金活动平台，致力于简化 Web3 社区活动和去中心化组织任务协作的流程。Bounty Board 为这些活动提供了透明、安全、高效的解决方案，解决了用户信息记录、表格创建、代币支付等繁琐工作，并将所有记录保存在链上，保障活动的公平公正性。

这个项目使用Next.js作为前端框架，Solidity作为智能合约语言，合约部署在ETH测试链上。

进入页面，我们可以看到已经创建好的一些活动，这些活动以悬赏板的形式发布，用户可以加入悬赏板完成任务获得悬赏，也可以创建一个悬赏板活动。下面是创建悬赏板的流程：

1. 点击页面右上角的“Create Bounty Board”按钮，进入创建悬赏板页面。
2. 在创建悬赏板页面，填写悬赏板的标题、描述、悬赏代币Token地址等，Token地址为空则默认为ETH。
3. 点击“Submit”按钮，提交悬赏板活动。

新建完成后，我们可以看到悬赏板活动已经创建成功，并且显示在活动列表中。点击进入悬赏板活动，我们可以看到悬赏板活动的详情，包括悬赏金额、任务描述、参与人数等信息。

接下来我们需要质押悬赏的代币，如果是ERC20代币，需要先授权代币给Bounty Board合约，然后才能进行质押。质押的代币会在合约中锁定，直到任务完成并被审核后，代币会自动转移给任务完成者。当悬赏板活动被关闭后，创建者可以手动将剩余的代币转移回自己的钱包。

悬赏板活动创建人可以创建赏金任务，通过详情页面的“Create Bounty Task”按钮，进入创建赏金任务窗口，填写赏金任务的描述、赏金金额、最大获奖人数、截止时间等，然后点击“Submit”按钮，即可创建赏金任务。

创建好的任务可以动态显示倒计时和任务状态还有其他基本信息，创建人可以添加其他用户作为任务的审核人，自己默认为审核人，当用户完成任务后，可以提交任务，等待审核人审核。

其他用户可以在主页中找到已经创建的悬赏板活动，点击进入后，可以查看悬赏板的详情，包括悬赏金额、任务描述、参与人数等信息。用户可以点击“Join Board”按钮加入活动，在悬赏板下方查看并完成相应任务，等待审核通过后即可获得奖励，没有通过则可以重新提交。

用户还能在悬赏板的"Members and Submissions"界面看到所有人的任务完成状态，而审核人可以在这个表格中直接审核任务，整个过程公开透明，所有记录都保存在链上，无法篡改。

===

Bounty Board 是一个专为 Web3 社区和去中心化组织设计的赏金活动平台，旨在简化任务协作流程。通过 Bounty Board，用户可以轻松创建和参与赏金任务，平台提供了透明、安全且高效的解决方案，解决了用户信息记录、表单创建、代币支付等繁琐的工作，并确保所有活动记录都保存在区块链上，保障了活动的公平和公正。该项目的所有合约均部署在 ETH 测试链上。

进入平台主页，我们可以看到已经发布的一些悬赏板活动。用户可以选择加入这些活动并完成任务以获得赏金，或者自己创建新的悬赏板。接下来，我们将演示如何创建一个悬赏板活动：

首先，点击页面右上角的“Create Bounty Board”按钮，进入悬赏板创建页面。在该页面中，填写悬赏板的标题、描述、上传图片以及悬赏代币的 Token 地址。如果不填写 Token 地址，系统将默认使用 ETH。填写完成后，点击“Submit”按钮提交，悬赏板活动即创建成功，并会显示在活动列表中。

点击进入刚创建的悬赏板活动，可以查看详情信息，如悬赏金额、任务描述和参与人数等。此时，我们需要质押悬赏的代币。如果使用 ERC20 代币，则需要先授权 Bounty Board 合约进行代币管理，授权完成后，即可进行代币质押。质押的代币会在合约中锁定，直到任务完成并通过审核，代币才会自动转移给完成任务的用户。如果悬赏板活动被关闭，创建者可以手动将未使用的代币退回到自己的钱包。

悬赏板的创建者还可以通过详情页面的“Create Bounty Task”按钮创建赏金任务。填写任务描述、赏金金额、最大获奖人数和截止时间等信息后，点击“Submit”即可发布任务。发布后的任务将动态显示倒计时和状态信息。

创建者可以指定其他地址作为审核人，默认情况下，创建者自己就是审核人。

所有用户还可以在悬赏板的"Members and Submissions"界面查看所有参与者的任务完成状态，审核人可以在该界面直接审核任务。审核通过后，奖励会自动发放给任务完成者。如果任务未通过审核，用户可以重新提交。

在主页中，用户可以浏览和加入已创建的悬赏板活动，并查看每个活动的详情。点击“Join Board”按钮即可加入活动，完成悬赏板下的相应任务并等待审核。审核通过后，用户即可获得相应奖励。

===

The Bounty Board is a platform designed specifically for the Web3 community and decentralized organizations to facilitate bounty activities, simplifying the task collaboration process. Through the Bounty Board, users can easily create and participate in bounty tasks. The platform offers a transparent, secure, and efficient solution to address cumbersome processes such as user information tracking, form creation, token payments, and more. It ensures that all activity records are stored on the blockchain, guaranteeing fairness and transparency. All contracts for this project are deployed on the ETH testnet.

Upon entering the platform's homepage, users can see several bounty board activities that have already been published. Users can choose to join these activities and complete tasks to earn rewards, or they can create a new bounty board themselves. Now, we will demonstrate how to create a bounty board activity.

First, click the "Create Bounty Board" button at the top right corner of the page to enter the bounty board creation page. On this page, fill in the title, description, upload a header image, and token address for the bounty reward. If you don’t provide a token address, the system will default to using ETH Token. Once the information is filled in, click the "Submit" button to create the bounty board activity, which will then appear in the activity list.

By clicking on the newly created bounty board activity, users can view details such as the bounty amount, task description, and the number of participants.

At this point, we need to stake the tokens for the bounty. If using ERC20 tokens, authorization must first be given to the Bounty Board contract to manage the tokens. After authorization, tokens can be staked. The staked tokens will be locked in the contract until the task is completed and approved, at which point the tokens will automatically be transferred to the user who completed the task. If the bounty board activity is closed, the creator can manually withdraw any unused tokens back to their wallet.

The creator of the bounty board can create bounty tasks through the “Create Bounty Task” button on the details page. After filling in the task title, description, bounty amount, maximum number of winners, and deadline, clicking “Submit” will publish the task. The published task will dynamically display a countdown and status information.

The creator can designate other addresses as reviewers, though by default, the creator themselves is the reviewer.

All users can view the task completion status of participants on the "Members and Submissions" page of the bounty board. Reviewers can directly review tasks from this page. Once a task is approved, the reward will be automatically distributed to the task completer. If a task is not approved, users can resubmit their work.

On the homepage, users can browse and join existing bounty board activities and view the details of each event. By clicking the "Join Board" button, they can participate in the activity, complete the associated tasks, and wait for approval. Once approved, they will receive the corresponding reward.
