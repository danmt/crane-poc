use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod token_program {
    use super::*;

    pub fn initialize_mint(
        ctx: Context<InitializeMint>,
        decimals: u8,
        mint_authority: Pubkey,
        freeze_authority: Option<Pubkey>,
    ) -> Result<()> {
        Ok(())
    }

    pub fn initialize_account(ctx: Context<InitializeAccount>) -> Result<()> {
        Ok(())
    }

    pub fn initialize_multisig(ctx: Context<InitializeMultisig>, m: u8) -> Result<()> {
        Ok(())
    }

    pub fn transfer(ctx: Context<Transfer>, amount: u64) -> Result<()> {
        Ok(())
    }

    pub fn approve(ctx: Context<Approve>, amount: u64) -> Result<()> {
        Ok(())
    }

    pub fn revoke(ctx: Context<Revoke>) -> Result<()> {
        Ok(())
    }

    pub fn set_authority(
        ctx: Context<SetAuthority>,
        authority_type: AuthorityType,
        new_authority: Option<Pubkey>,
    ) -> Result<()> {
        Ok(())
    }

    pub fn mint_to(ctx: Context<MintTo>, amount: u64) -> Result<()> {
        Ok(())
    }

    pub fn burn(ctx: Context<Burn>, amount: u64) -> Result<()> {
        Ok(())
    }

    pub fn close_account(ctx: Context<CloseAccount>) -> Result<()> {
        Ok(())
    }

    pub fn freeze_account(ctx: Context<FreezeAccount>) -> Result<()> {
        Ok(())
    }

    pub fn thaw_account(ctx: Context<ThawAccount>) -> Result<()> {
        Ok(())
    }

    pub fn transfer_checked(
        ctx: Context<TransferChecked>,
        amount: u64,
        decimals: u8,
    ) -> Result<()> {
        Ok(())
    }

    pub fn approve_checked(ctx: Context<ApproveChecked>, amount: u64, decimals: u8) -> Result<()> {
        Ok(())
    }

    pub fn mint_to_checked(ctx: Context<MintToChecked>, amount: u64, decimals: u8) -> Result<()> {
        Ok(())
    }

    pub fn burn_checked(ctx: Context<BurnChecked>, amount: u64, decimals: u8) -> Result<()> {
        Ok(())
    }

    pub fn initialize_account2(ctx: Context<InitializeAccount2>, owner: Pubkey) -> Result<()> {
        Ok(())
    }

    pub fn sync_native(ctx: Context<SyncNative>) -> Result<()> {
        Ok(())
    }

    pub fn initialize_account3(ctx: Context<InitializeAccount3>, owner: Pubkey) -> Result<()> {
        Ok(())
    }

    pub fn initialize_multisig2(ctx: Context<InitializeMultisig2>, m: u8) -> Result<()> {
        Ok(())
    }

    pub fn initialize_mint2(
        ctx: Context<InitializeMint2>,
        decimals: u8,
        mint_authority: Pubkey,
        freeze_authority: Option<Pubkey>,
    ) -> Result<()> {
        Ok(())
    }

    pub fn get_account_data_size(ctx: Context<GetAccountDataSize>) -> Result<()> {
        Ok(())
    }

    pub fn initialize_immutable_owner(ctx: Context<InitializeImmutableOwner>) -> Result<()> {
        Ok(())
    }

    pub fn amount_to_ui_amount(ctx: Context<AmountToUiAmount>, amount: u64) -> Result<()> {
        Ok(())
    }

    pub fn ui_amount_to_amount(ctx: Context<UiAmountToAmount>, ui_amount: String) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeMint<'info> {
    #[account(mut)]
    /// CHECK: ignore
    mint: AccountInfo<'info>,
    rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct InitializeAccount<'info> {
    #[account(mut)]
    /// CHECK: ignore
    account: AccountInfo<'info>,
    /// CHECK: ignore
    mint: AccountInfo<'info>,
    /// CHECK: ignore
    owner: AccountInfo<'info>,
    rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct InitializeMultisig<'info> {
    /// CHECK: ignore
    multisig: AccountInfo<'info>,
    rent: Sysvar<'info, Rent>,
    //signer: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct Transfer<'info> {
    /// CHECK: ignore
    source: AccountInfo<'info>,
    /// CHECK: ignore
    destination: AccountInfo<'info>,
    authority: Signer<'info>,
    //signer: Signer<'info>,
}

#[derive(Accounts)]
pub struct Approve<'info> {
    /// CHECK: ignore
    source: AccountInfo<'info>,
    /// CHECK: ignore
    delegate: AccountInfo<'info>,
    owner: Signer<'info>,
    //signer: Signer<'info>,
}

#[derive(Accounts)]
pub struct Revoke<'info> {
    /// CHECK: ignore
    source: AccountInfo<'info>,
    owner: Signer<'info>,
    //signer: Signer<'info>,
}

#[derive(Accounts)]
pub struct SetAuthority<'info> {
    /// CHECK: ignore
    owned: AccountInfo<'info>,
    owner: Signer<'info>,
    //signer: Signer<'info>,
}

#[derive(Accounts)]
pub struct MintTo<'info> {
    /// CHECK: ignore
    mint: AccountInfo<'info>,
    /// CHECK: ignore
    account: AccountInfo<'info>,
    owner: Signer<'info>,
    //signer: Signer<'info>,
}

#[derive(Accounts)]
pub struct Burn<'info> {
    /// CHECK: ignore
    account: AccountInfo<'info>,
    /// CHECK: ignore
    mint: AccountInfo<'info>,
    authority: Signer<'info>,
    //signer: Signer<'info>,
}

#[derive(Accounts)]
pub struct CloseAccount<'info> {
    /// CHECK: ignore
    account: AccountInfo<'info>,
    /// CHECK: ignore
    destination: AccountInfo<'info>,
    owner: Signer<'info>,
    //signer: Signer<'info>,
}

#[derive(Accounts)]
pub struct FreezeAccount<'info> {
    /// CHECK: ignore
    account: AccountInfo<'info>,
    /// CHECK: ignore
    mint: AccountInfo<'info>,
    owner: Signer<'info>,
    //signer: Signer<'info>,
}

#[derive(Accounts)]
pub struct ThawAccount<'info> {
    /// CHECK: ignore
    account: AccountInfo<'info>,
    /// CHECK: ignore
    mint: AccountInfo<'info>,
    owner: Signer<'info>,
    //signer: Signer<'info>,
}

#[derive(Accounts)]
pub struct TransferChecked<'info> {
    /// CHECK: ignore
    source: AccountInfo<'info>,
    /// CHECK: ignore
    mint: AccountInfo<'info>,
    /// CHECK: ignore
    destination: AccountInfo<'info>,
    authority: Signer<'info>,
    //signer: Signer<'info>,
}

#[derive(Accounts)]
pub struct ApproveChecked<'info> {
    /// CHECK: ignore
    source: AccountInfo<'info>,
    /// CHECK: ignore
    mint: AccountInfo<'info>,
    /// CHECK: ignore
    delegate: AccountInfo<'info>,
    owner: Signer<'info>,
    //signer: Signer<'info>,
}

#[derive(Accounts)]
pub struct MintToChecked<'info> {
    /// CHECK: ignore
    mint: AccountInfo<'info>,
    /// CHECK: ignore
    account: AccountInfo<'info>,
    owner: Signer<'info>,
    //signer: Signer<'info>,
}

#[derive(Accounts)]
pub struct BurnChecked<'info> {
    /// CHECK: ignore
    account: AccountInfo<'info>,
    /// CHECK: ignore
    mint: AccountInfo<'info>,
    authority: Signer<'info>,
    //signer: Signer<'info>,
}

#[derive(Accounts)]
pub struct InitializeAccount2<'info> {
    #[account(mut)]
    /// CHECK: ignore
    account: AccountInfo<'info>,
    /// CHECK: ignore
    mint: AccountInfo<'info>,
    rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct SyncNative<'info> {
    #[account(mut)]
    /// CHECK: ignore
    account: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct InitializeAccount3<'info> {
    #[account(mut)]
    /// CHECK: ignore
    account: AccountInfo<'info>,
    /// CHECK: ignore
    mint: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct InitializeMultisig2<'info> {
    /// CHECK: ignore
    multisig: AccountInfo<'info>,
    /// CHECK: ignore
    signer: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct InitializeMint2<'info> {
    #[account(mut)]
    /// CHECK: ignore
    mint: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct GetAccountDataSize<'info> {
    /// CHECK: ignore
    mint: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct InitializeImmutableOwner<'info> {
    #[account(mut)]
    /// CHECK: ignore
    account: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct AmountToUiAmount<'info> {
    /// CHECK: ignore
    mint: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct UiAmountToAmount<'info> {
    /// CHECK: ignore
    mint: AccountInfo<'info>,
}

#[repr(u8)]
#[derive(Clone, Debug, PartialEq, AnchorSerialize, AnchorDeserialize)]
pub enum AuthorityType {
    /// Authority to mint new tokens
    MintTokens,
    /// Authority to freeze any account associated with the Mint
    FreezeAccount,
    /// Owner of a given token account
    AccountOwner,
    /// Authority to close a token account
    CloseAccount,
}
