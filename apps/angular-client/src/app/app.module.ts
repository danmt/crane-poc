import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HdWalletAdapterModule } from '@heavy-duty/wallet-adapter';
import { AppComponent } from './app.component';
import { CreateTransactionButtonModule } from './create-transaction-button';
import { SignTransactionButtonModule } from './sign-transaction-button';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    CreateTransactionButtonModule,
    SignTransactionButtonModule,
    HdWalletAdapterModule.forRoot({
      autoConnect: true,
    }),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
