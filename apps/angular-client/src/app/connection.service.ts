import { Injectable } from '@angular/core';
import { Connection } from '@solana/web3.js';

@Injectable({ providedIn: 'root' })
export class ConnectionService {
  connection = new Connection('http://localhost:8899');
}
