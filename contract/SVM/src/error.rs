use solana_program::program_error::ProgramError;
use thiserror::Error;

#[derive(Error, Debug, Copy, Clone)]
pub enum BountyBoardError {
    #[error("Invalid Instruction")]
    InvalidInstruction,
    #[error("Not Rent Exempt")]
    NotRentExempt,
    #[error("Board Already Initialized")]
    BoardAlreadyInitialized,
    #[error("Board Not Initialized")]
    BoardNotInitialized,
    #[error("Board Is Closed")]
    BoardIsClosed,
    #[error("Task Already Completed")]
    TaskAlreadyCompleted,
    #[error("Task Is Cancelled")]
    TaskIsCancelled,
    #[error("Task Deadline Passed")]
    TaskDeadlinePassed,
    #[error("Not A Board Member")]
    NotABoardMember,
    #[error("Not A Task Reviewer")]
    NotATaskReviewer,
    #[error("Invalid Signature")]
    InvalidSignature,
    #[error("Self Check Not Allowed")]
    SelfCheckNotAllowed,
    #[error("Insufficient Funds")]
    InsufficientFunds,
    #[error("Already Approved")]
    AlreadyApproved,
    #[error("No Submission Found")]
    NoSubmissionFound,
}

impl From<BountyBoardError> for ProgramError {
    fn from(e: BountyBoardError) -> Self {
        ProgramError::Custom(e as u32)
    }
}