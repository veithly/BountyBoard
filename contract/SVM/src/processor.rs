use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    msg,
    program::{invoke, invoke_signed},
    program_error::ProgramError,
    program_pack::Pack,
    pubkey::Pubkey,
    system_instruction,
    sysvar::{clock::Clock, rent::Rent, Sysvar},
};
use spl_token::{instruction as token_instruction, state::Account as TokenAccount};

use crate::{
    error::BountyBoardError,
    instruction::BountyBoardInstruction,
    state::{Board, Submission, SubmissionStatus, Task},
};

pub struct Processor;

impl Processor {
    pub fn process(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        instruction_data: &[u8],
    ) -> ProgramResult {
        let instruction = BountyBoardInstruction::unpack(instruction_data)
            .map_err(|_| ProgramError::InvalidInstructionData)?;

        match instruction {
            BountyBoardInstruction::InitializeBoard {
                name,
                description,
                img,
                config,
            } => {
                msg!("Instruction: Initialize Board");
                Self::process_initialize_board(program_id, accounts, name, description, img, config)
            }
            BountyBoardInstruction::CreateTask {
                name,
                description,
                deadline,
                max_completions,
                reward_amount,
                config,
                allow_self_check,
            } => {
                msg!("Instruction: Create Task");
                Self::process_create_task(
                    program_id,
                    accounts,
                    name,
                    description,
                    deadline,
                    max_completions,
                    reward_amount,
                    config,
                    allow_self_check,
                )
            }
            BountyBoardInstruction::JoinBoard => {
                msg!("Instruction: Join Board");
                Self::process_join_board(program_id, accounts)
            }
            BountyBoardInstruction::SubmitProof { proof } => {
                msg!("Instruction: Submit Proof");
                Self::process_submit_proof(program_id, accounts, proof)
            }
            BountyBoardInstruction::ReviewSubmission {
                status,
                review_comment,
            } => {
                msg!("Instruction: Review Submission");
                Self::process_review_submission(program_id, accounts, status, review_comment)
            }
            BountyBoardInstruction::SelfCheckSubmission {
                signature,
                check_data,
            } => {
                msg!("Instruction: Self Check Submission");
                Self::process_self_check_submission(program_id, accounts, signature, check_data)
            }
            BountyBoardInstruction::PledgeTokens { amount } => {
                msg!("Instruction: Pledge Tokens");
                Self::process_pledge_tokens(program_id, accounts, amount)
            }
            BountyBoardInstruction::CloseBoard => {
                msg!("Instruction: Close Board");
                Self::process_close_board(program_id, accounts)
            }
        }
    }

    fn process_initialize_board(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        name: String,
        description: String,
        img: String,
        config: String,
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let creator_info = next_account_info(account_info_iter)?;
        let board_info = next_account_info(account_info_iter)?;
        let reward_token_info = next_account_info(account_info_iter)?;
        let system_program_info = next_account_info(account_info_iter)?;
        let rent_info = next_account_info(account_info_iter)?;

        // Verify creator signature
        if !creator_info.is_signer {
            return Err(ProgramError::MissingRequiredSignature);
        }

        // Verify rent exemption
        let rent = &Rent::from_account_info(rent_info)?;
        if !rent.is_exempt(board_info.lamports(), board_info.data_len()) {
            return Err(BountyBoardError::NotRentExempt.into());
        }

        // Initialize board data
        let mut board = Board::default();
        board.is_initialized = true;
        board.creator = *creator_info.key;
        board.name = name;
        board.description = description;
        board.img = img;
        board.reward_token = *reward_token_info.key;
        board.created_at = Clock::get()?.unix_timestamp;
        board.config = config;

        // Save board data
        board.serialize(&mut *board_info.data.borrow_mut())?;

        Ok(())
    }

    fn process_create_task(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        name: String,
        description: String,
        deadline: i64,
        max_completions: u64,
        reward_amount: u64,
        config: String,
        allow_self_check: bool,
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let creator_info = next_account_info(account_info_iter)?;
        let board_info = next_account_info(account_info_iter)?;
        let task_info = next_account_info(account_info_iter)?;

        // Verify creator signature
        if !creator_info.is_signer {
            return Err(ProgramError::MissingRequiredSignature);
        }

        // Verify board state
        let board = Board::try_from_slice(&board_info.data.borrow())?;
        if !board.is_initialized {
            return Err(BountyBoardError::BoardNotInitialized.into());
        }
        if board.closed {
            return Err(BountyBoardError::BoardIsClosed.into());
        }
        if board.creator != *creator_info.key {
            return Err(ProgramError::InvalidAccountData);
        }

        // Initialize task data
        let mut task = Task::default();
        task.name = name;
        task.creator = *creator_info.key;
        task.description = description;
        task.deadline = deadline;
        task.max_completions = max_completions;
        task.reward_amount = reward_amount;
        task.created_at = Clock::get()?.unix_timestamp;
        task.config = config;
        task.allow_self_check = allow_self_check;
        task.reviewers.push(*creator_info.key);

        // Save task data
        task.serialize(&mut *task_info.data.borrow_mut())?;

        Ok(())
    }

    fn process_join_board(program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let user_info = next_account_info(account_info_iter)?;
        let board_info = next_account_info(account_info_iter)?;
        let member_info = next_account_info(account_info_iter)?;
        let system_program_info = next_account_info(account_info_iter)?;

        // Verify user signature
        if !user_info.is_signer {
            return Err(ProgramError::MissingRequiredSignature);
        }

        // Verify board state
        let mut board = Board::try_from_slice(&board_info.data.borrow())?;
        if !board.is_initialized {
            return Err(BountyBoardError::BoardNotInitialized.into());
        }
        if board.closed {
            return Err(BountyBoardError::BoardIsClosed.into());
        }

        // Create member PDA account
        let (member_pda, bump_seed) = Pubkey::find_program_address(
            &[
                b"member",
                board_info.key.as_ref(),
                user_info.key.as_ref(),
            ],
            program_id,
        );

        if member_pda != *member_info.key {
            return Err(ProgramError::InvalidAccountData);
        }

        // Create member account if it doesn't exist
        if member_info.data_borrow().is_empty() {
            let space = 1; // Just a flag to indicate membership
            let rent = Rent::get()?;
            let lamports = rent.minimum_balance(space);

            invoke_signed(
                &system_instruction::create_account(
                    user_info.key,
                    &member_pda,
                    lamports,
                    space as u64,
                    program_id,
                ),
                &[
                    user_info.clone(),
                    member_info.clone(),
                    system_program_info.clone(),
                ],
                &[&[
                    b"member",
                    board_info.key.as_ref(),
                    user_info.key.as_ref(),
                    &[bump_seed],
                ]],
            )?;
        }

        Ok(())
    }

    fn process_submit_proof(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        proof: String,
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let submitter_info = next_account_info(account_info_iter)?;
        let board_info = next_account_info(account_info_iter)?;
        let task_info = next_account_info(account_info_iter)?;
        let submission_info = next_account_info(account_info_iter)?;
        let member_info = next_account_info(account_info_iter)?;

        // Verify submitter signature
        if !submitter_info.is_signer {
            return Err(ProgramError::MissingRequiredSignature);
        }

        // Verify board state
        let board = Board::try_from_slice(&board_info.data.borrow())?;
        if !board.is_initialized {
            return Err(BountyBoardError::BoardNotInitialized.into());
        }
        if board.closed {
            return Err(BountyBoardError::BoardIsClosed.into());
        }

        // Verify membership
        let (member_pda, _) = Pubkey::find_program_address(
            &[
                b"member",
                board_info.key.as_ref(),
                submitter_info.key.as_ref(),
            ],
            program_id,
        );
        if member_pda != *member_info.key || member_info.data_borrow().is_empty() {
            return Err(BountyBoardError::NotABoardMember.into());
        }

        // Verify task state
        let task = Task::try_from_slice(&task_info.data.borrow())?;
        if task.completed {
            return Err(BountyBoardError::TaskAlreadyCompleted.into());
        }
        if task.cancelled {
            return Err(BountyBoardError::TaskIsCancelled.into());
        }
        if task.deadline > 0 && task.deadline < Clock::get()?.unix_timestamp {
            return Err(BountyBoardError::TaskDeadlinePassed.into());
        }

        // Create submission
        let mut submission = Submission::default();
        submission.submitter = *submitter_info.key;
        submission.proof = proof;
        submission.status = SubmissionStatus::Pending;
        submission.submitted_at = Clock::get()?.unix_timestamp;

        // Save submission
        submission.serialize(&mut *submission_info.data.borrow_mut())?;

        Ok(())
    }

    fn process_review_submission(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        status: i8,
        review_comment: String,
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let reviewer_info = next_account_info(account_info_iter)?;
        let board_info = next_account_info(account_info_iter)?;
        let task_info = next_account_info(account_info_iter)?;
        let submission_info = next_account_info(account_info_iter)?;
        let submitter_token_info = next_account_info(account_info_iter)?;
        let board_token_info = next_account_info(account_info_iter)?;
        let token_program_info = next_account_info(account_info_iter)?;

        // Verify reviewer signature
        if !reviewer_info.is_signer {
            return Err(ProgramError::MissingRequiredSignature);
        }

        // Load accounts
        let board = Board::try_from_slice(&board_info.data.borrow())?;
        let mut task = Task::try_from_slice(&task_info.data.borrow())?;
        let mut submission = Submission::try_from_slice(&submission_info.data.borrow())?;

        // Verify reviewer authority
        let mut is_reviewer = false;
        for reviewer in &task.reviewers {
            if reviewer == reviewer_info.key {
                is_reviewer = true;
                break;
            }
        }
        if !is_reviewer {
            return Err(BountyBoardError::NotATaskReviewer.into());
        }

        // Update submission status
        submission.status = match status {
            1 => SubmissionStatus::Approved,
            -1 => SubmissionStatus::Rejected,
            _ => SubmissionStatus::Pending,
        };
        submission.review_comment = review_comment;

        // Process reward if approved
        if let SubmissionStatus::Approved = submission.status {
            // Transfer reward tokens
            let transfer_instruction = token_instruction::transfer(
                token_program_info.key,
                board_token_info.key,
                submitter_token_info.key,
                board_info.key,
                &[],
                task.reward_amount,
            )?;

            invoke_signed(
                &transfer_instruction,
                &[
                    board_token_info.clone(),
                    submitter_token_info.clone(),
                    board_info.clone(),
                    token_program_info.clone(),
                ],
                &[&[b"board", board_info.key.as_ref(), &[]]],
            )?;

            // Update task completion status
            task.num_completions += 1;
            if task.num_completions >= task.max_completions {
                task.completed = true;
            }
        }

        // Save updates
        submission.serialize(&mut *submission_info.data.borrow_mut())?;
        task.serialize(&mut *task_info.data.borrow_mut())?;

        Ok(())
    }

    fn process_self_check_submission(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        signature: Vec<u8>,
        check_data: String,
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let submitter_info = next_account_info(account_info_iter)?;
        let board_info = next_account_info(account_info_iter)?;
        let task_info = next_account_info(account_info_iter)?;
        let submission_info = next_account_info(account_info_iter)?;
        let submitter_token_info = next_account_info(account_info_iter)?;
        let board_token_info = next_account_info(account_info_iter)?;
        let token_program_info = next_account_info(account_info_iter)?;
        let member_info = next_account_info(account_info_iter)?;

        // Verify submitter signature
        if !submitter_info.is_signer {
            return Err(ProgramError::MissingRequiredSignature);
        }

        // Verify board and task state
        let board = Board::try_from_slice(&board_info.data.borrow())?;
        let mut task = Task::try_from_slice(&task_info.data.borrow())?;

        if !task.allow_self_check {
            return Err(BountyBoardError::SelfCheckNotAllowed.into());
        }

        // Verify membership
        let (member_pda, _) = Pubkey::find_program_address(
            &[
                b"member",
                board_info.key.as_ref(),
                submitter_info.key.as_ref(),
            ],
            program_id,
        );
        if member_pda != *member_info.key || member_info.data_borrow().is_empty() {
            return Err(BountyBoardError::NotABoardMember.into());
        }

        // Verify signature
        // TODO: Implement proper signature verification using ed25519 program
        let message = [
            board_info.key.as_ref(),
            task_info.key.as_ref(),
            submitter_info.key.as_ref(),
            check_data.as_bytes(),
        ]
        .concat();

        // Create and approve submission
        let mut submission = Submission::default();
        submission.submitter = *submitter_info.key;
        submission.status = SubmissionStatus::Approved;
        submission.submitted_at = Clock::get()?.unix_timestamp;
        submission.review_comment = check_data;

        // Process reward
        let transfer_instruction = token_instruction::transfer(
            token_program_info.key,
            board_token_info.key,
            submitter_token_info.key,
            board_info.key,
            &[],
            task.reward_amount,
        )?;

        invoke_signed(
            &transfer_instruction,
            &[
                board_token_info.clone(),
                submitter_token_info.clone(),
                board_info.clone(),
                token_program_info.clone(),
            ],
            &[&[b"board", board_info.key.as_ref(), &[]]],
        )?;

        // Update task completion status
        task.num_completions += 1;
        if task.num_completions >= task.max_completions {
            task.completed = true;
        }

        // Save updates
        submission.serialize(&mut *submission_info.data.borrow_mut())?;
        task.serialize(&mut *task_info.data.borrow_mut())?;

        Ok(())
    }

    fn process_pledge_tokens(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        amount: u64,
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let pledger_info = next_account_info(account_info_iter)?;
        let board_info = next_account_info(account_info_iter)?;
        let pledger_token_info = next_account_info(account_info_iter)?;
        let board_token_info = next_account_info(account_info_iter)?;
        let token_program_info = next_account_info(account_info_iter)?;

        // Verify pledger signature
        if !pledger_info.is_signer {
            return Err(ProgramError::MissingRequiredSignature);
        }

        // Verify board state
        let mut board = Board::try_from_slice(&board_info.data.borrow())?;
        if board.closed {
            return Err(BountyBoardError::BoardIsClosed.into());
        }

        // Verify pledger is board creator
        if board.creator != *pledger_info.key {
            return Err(ProgramError::InvalidAccountData);
        }

        // Transfer tokens
        let transfer_instruction = token_instruction::transfer(
            token_program_info.key,
            pledger_token_info.key,
            board_token_info.key,
            pledger_info.key,
            &[],
            amount,
        )?;

        invoke(
            &transfer_instruction,
            &[
                pledger_token_info.clone(),
                board_token_info.clone(),
                pledger_info.clone(),
                token_program_info.clone(),
            ],
        )?;

        // Update total pledged amount
        board.total_pledged += amount;
        board.serialize(&mut *board_info.data.borrow_mut())?;

        Ok(())
    }

    fn process_close_board(program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let creator_info = next_account_info(account_info_iter)?;
        let board_info = next_account_info(account_info_iter)?;
        let board_token_info = next_account_info(account_info_iter)?;
        let creator_token_info = next_account_info(account_info_iter)?;
        let token_program_info = next_account_info(account_info_iter)?;

        // Verify creator signature
        if !creator_info.is_signer {
            return Err(ProgramError::MissingRequiredSignature);
        }

        // Verify board state and ownership
        let mut board = Board::try_from_slice(&board_info.data.borrow())?;
        if board.creator != *creator_info.key {
            return Err(ProgramError::InvalidAccountData);
        }

        // Return remaining tokens to creator
        if board.total_pledged > 0 {
            let transfer_instruction = token_instruction::transfer(
                token_program_info.key,
                board_token_info.key,
                creator_token_info.key,
                board_info.key,
                &[],
                board.total_pledged,
            )?;

            invoke_signed(
                &transfer_instruction,
                &[
                    board_token_info.clone(),
                    creator_token_info.clone(),
                    board_info.clone(),
                    token_program_info.clone(),
                ],
                &[&[b"board", board_info.key.as_ref(), &[]]],
            )?;

            board.total_pledged = 0;
        }

        // Close board
        board.closed = true;
        board.serialize(&mut *board_info.data.borrow_mut())?;

        Ok(())
    }
}