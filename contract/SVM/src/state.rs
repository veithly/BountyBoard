use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    program_pack::{IsInitialized, Sealed},
    pubkey::Pubkey,
};

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct Board {
    pub is_initialized: bool,
    pub creator: Pubkey,
    pub name: String,
    pub description: String,
    pub img: String,
    pub reward_token: Pubkey,
    pub total_pledged: u64,
    pub created_at: i64,
    pub closed: bool,
    pub config: String,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct Task {
    pub id: u64,
    pub name: String,
    pub creator: Pubkey,
    pub description: String,
    pub deadline: i64,
    pub max_completions: u64,
    pub num_completions: u64,
    pub reviewers: Vec<Pubkey>,
    pub completed: bool,
    pub reward_amount: u64,
    pub created_at: i64,
    pub cancelled: bool,
    pub config: String,
    pub allow_self_check: bool,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone, PartialEq)]
pub enum SubmissionStatus {
    Pending,
    Approved,
    Rejected,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct Submission {
    pub submitter: Pubkey,
    pub proof: String,
    pub status: SubmissionStatus,
    pub submitted_at: i64,
    pub review_comment: String,
}

impl Sealed for Board {}
impl IsInitialized for Board {
    fn is_initialized(&self) -> bool {
        self.is_initialized
    }
}

impl Default for Board {
    fn default() -> Self {
        Self {
            is_initialized: false,
            creator: Pubkey::default(),
            name: String::new(),
            description: String::new(),
            img: String::new(),
            reward_token: Pubkey::default(),
            total_pledged: 0,
            created_at: 0,
            closed: false,
            config: String::new(),
        }
    }
}

impl Default for Task {
    fn default() -> Self {
        Self {
            id: 0,
            name: String::new(),
            creator: Pubkey::default(),
            description: String::new(),
            deadline: 0,
            max_completions: 1,
            num_completions: 0,
            reviewers: Vec::new(),
            completed: false,
            reward_amount: 0,
            created_at: 0,
            cancelled: false,
            config: String::new(),
            allow_self_check: false,
        }
    }
}

impl Default for Submission {
    fn default() -> Self {
        Self {
            submitter: Pubkey::default(),
            proof: String::new(),
            status: SubmissionStatus::Pending,
            submitted_at: 0,
            review_comment: String::new(),
        }
    }
}