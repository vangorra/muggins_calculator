import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Die } from '../general_types';
import DieComponent from '../die/die.component';

@Component({
  selector: 'app-dice',
  templateUrl: './dice.component.html',
  styleUrls: ['./dice.component.scss'],
  imports: [DieComponent],
})
export class DiceComponent {
  @Input() dice: Die[] = [];

  @Output() readonly faceChanged = new EventEmitter<Die[]>();

  onDieChanged(index: number, die: Die): void {
    this.dice[index] = die;
    this.faceChanged.emit(this.dice);
  }
}
