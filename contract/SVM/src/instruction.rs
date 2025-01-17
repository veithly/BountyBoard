use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::pubkey::Pubkey;

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub enum BountyBoardInstruction {
    /// Initialize a new board
    /// Accounts expected:
    /// 0. `[signer]` The board creator
    /// 1. `[writable]` The board account
    /// 2. `[]` The reward token mint account
    /// 3. `[]` The system program
    /// 4. `[]` The rent sysvar
    InitializeBoard {
        name: String,
        description: String,
        img: String,
        config: String,
    },

    /// Create a new task in a board
    /// Accounts expected:
    /// 0. `[signer]` The task creator (must be board creator)
    /// 1. `[writable]` The board account
    /// 2. `[writable]` The task account
    CreateTask {
        name: String,
        description: String,
        deadline: i64,
        max_completions: u64,
        reward_amount: u64,
        config: String,
        allow_self_check: bool,
    },

    /// Join a board as a member
    /// Accounts expected:
    /// 0. `[signer]` The user joining the board
    /// 1. `[writable]` The board account
    JoinBoard,

    /// Submit proof for a task
    /// Accounts expected:
    /// 0. `[signer]` The submitter
    /// 1. `[writable]` The board account
    /// 2. `[writable]` The task account
    /// 3. `[writable]` The submission account
    SubmitProof {
        proof: String,
    },

    /// Review a submission
    /// Accounts expected:
    /// 0. `[signer]` The reviewer
    /// 1. `[writable]` The board account
    /// 2. `[writable]` The task account
    /// 3. `[writable]` The submission account
    /// 4. `[writable]` The submitter's token account
    /// 5. `[]` The token program
    ReviewSubmission {
        status: i8,
        review_comment: String,
    },

    /// Self-check submission with signature
    /// Accounts expected:
    /// 0. `[signer]` The submitter
    /// 1. `[writable]` The board account
    /// 2. `[writable]` The task account
    /// 3. `[writable]` The submission account
    /// 4. `[writable]` The submitter's token account
    /// 5. `[]` The token program
    SelfCheckSubmission {
        signature: Vec<u8>,
        check_data: String,
    },

    /// Pledge tokens to a board
    /// Accounts expected:
    /// 0. `[signer]` The pledger
    /// 1. `[writable]` The board account
    /// 2. `[writable]` The pledger's token account
    /// 3. `[writable]` The board's token account
    /// 4. `[]` The token program
    PledgeTokens {
        amount: u64,
    },

    /// Close a board
    /// Accounts expected:
    /// 0. `[signer]` The board creator
    /// 1. `[writable]` The board account
    CloseBoard,
}

impl BountyBoardInstruction {
    /// Unpacks a byte buffer into a BountyBoardInstruction
    pub fn unpack(input: &[u8]) -> Result<Self, String> {
        let (&variant, rest) = input.split_first().ok_or("Invalid instruction")?;
        Ok(match variant {
            0 => Self::try_from_slice(rest).map_err(|_| "Invalid instruction data")?,
            _ => return Err("Invalid instruction".to_string()),
        })
    }
}