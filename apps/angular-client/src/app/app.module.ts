import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HdWalletAdapterModule } from '@heavy-duty/wallet-adapter';
import { AppComponent } from './app.component';
import { ConfirmTransactionButtonModule } from './confirm-transaction-button';
import { CreateTransactionButtonModule } from './create-transaction-button';
import { InstructionAutocompleteModule } from './instruction-autocomplete';
import { SendTransactionButtonModule } from './send-transaction-button';
import { SignTransactionButtonModule } from './sign-transaction-button';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    CreateTransactionButtonModule,
    SignTransactionButtonModule,
    SendTransactionButtonModule,
    ConfirmTransactionButtonModule,
    HdWalletAdapterModule.forRoot({
      autoConnect: true,
    }),
    InstructionAutocompleteModule,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
