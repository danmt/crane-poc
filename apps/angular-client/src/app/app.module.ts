import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { CreateTransactionButtonModule } from './create-transaction-button';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, CreateTransactionButtonModule],
  bootstrap: [AppComponent],
})
export class AppModule {}
