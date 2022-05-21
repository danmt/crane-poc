# Transaction Builder

This project intention is to explore a combination of XState, Angular and Solana to have a reactive transaction builder to visually showcase the way a transaction works.

## Create transaction

Connection and fee payer are provided as `@Input` properties. Instructions can be added dynamically by the user. We download the IDLs from [native-to-anchor](https://github.com/acheroncrypto/native-to-anchor/tree/master/anchor/solana) and store them in the assets folder. Using the instruction data from the IDL generate a form structure that can be used by [ngx-formly](https://github.com/ngx-formly/ngx-formly) to generate a form ready to use.

Each instruction belongs to a program, using an autocomplete field the user can easily navigate through the available instructions. When the user submits the form, the instruction is added to the list, the form and autocomplete states are cleared.

When the transaction is done the user clicks "Create Transaction", this fetches the latest blockhash and adds it to the transaction. After finished, the Signing phase starts.

## Sign transaction

The UI displays the number of required signatures and the public key of each signer. When the user signs, the quantity of signatures increases. There has to be a way to check the block height and display to the user how close it is to be invalid.

NOTE: If the block height becomes invalid the signatures become invalid.

When the transaction is fully signed the Sending phase automatically starts.

## Send transaction

The user can press a button to send the transaction. Once sent, the Confirmation phase starts.

## Confirm transaction

The user can press a button to confirm the transaction, the transaction signature is shown to the user. The UI tracks the whole confirmation: processed -> confirmed -> finalized. Adds a timestamp for each step of the confirmation.
