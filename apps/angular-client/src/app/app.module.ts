import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { GetLatestBlockhashButtonModule } from './get-latest-blockhash-button';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, GetLatestBlockhashButtonModule],
  bootstrap: [AppComponent],
})
export class AppModule {}
