import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HdWalletAdapterModule } from '@heavy-duty/wallet-adapter';
import { FormlyModule } from '@ngx-formly/core';
import { FormlyMaterialModule } from '@ngx-formly/material';
import { AppComponent } from './app.component';
import { ConfirmTransactionButtonModule } from './confirm-transaction-button';
import { CreateTransactionSectionModule } from './create-transaction-section/create-transaction-section.module';
import { PluginModule, SystemPlugin, TokenPlugin } from './plugins';
import { SendTransactionButtonModule } from './send-transaction-button';
import { SignTransactionSectionModule } from './sign-transaction-section';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    CreateTransactionSectionModule,
    SignTransactionSectionModule,
    SendTransactionButtonModule,
    ConfirmTransactionButtonModule,
    HdWalletAdapterModule.forRoot({
      autoConnect: true,
    }),
    FormlyModule.forRoot(),
    FormlyMaterialModule,
    MatButtonModule,
    PluginModule.forRoot([new SystemPlugin(), new TokenPlugin()]),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
