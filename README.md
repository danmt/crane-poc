# Transaction Builder

This project intention is to explore a combination of XState, Angular and Solana to have a reactive transaction builder to visually showcase the way a transaction works.

## Create transaction

Connection and fee payer are provided as `@Input` properties. Instructions can be added dynamically by the user. While [idl-all-the-things](https://discord.com/channels/889577356681945098/975157963465588756) is in progress, we'll have a JSON-based structure to define all the available instructions maintained manually. In the future, replace this with IDLs.

Each instruction belongs to a program, using an autocomplete field the user can easily navigate through the instructions. Once an instruction is selected a form is generated using [ngx-formly](), when the user submits the form the instruction is added to the list, the form and autocomplete states are cleared.

When the transaction is done the user clicks "Create Transaction", this fetches the latest blockhash and adds it to the transaction. After finished, the Signing phase starts.

## Sign transaction

The UI displays the number of required signatures and the public key of each signer. When the user signs, the quantity of signatures increases. There has to be a way to check the block height and display to the user how close it is to be invalid.

NOTE: If the block height becomes invalid the signatures become invalid.

When the transaction is fully signed the Sending phase automatically starts.

## Send transaction

The user can press a button to send the transaction. Once sent, the Confirmation phase starts.

## Confirm transaction

The user can press a button to confirm the transaction, the transaction signature is shown to the user.
