import {
  Component,
  effect,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DEFAULT_DIE_SELECTED_FACE } from '../const';
import { Die } from '../general_types';
import {
  MatButtonToggle,
  MatButtonToggleGroup,
} from '@angular/material/button-toggle';

@Component({
  selector: 'app-die',
  templateUrl: './die.component.html',
  styleUrls: ['./die.component.scss'],
  imports: [MatButtonToggle, MatButtonToggleGroup, ReactiveFormsModule],
})
export default class DieComponent implements OnInit {
  @Input()
  label!: string;

  @Input()
  die!: Die;

  @Output()
  faceChanged = new EventEmitter<Die>();

  readonly selectedFace = new FormControl(DEFAULT_DIE_SELECTED_FACE, {
    nonNullable: true,
  });

  private readonly selectedFaceValue = toSignal(this.selectedFace.valueChanges);

  constructor() {
    effect(() => {
      const value = this.selectedFaceValue();
      if (value !== undefined) {
        this.faceChanged.emit({
          index: this.die.index,
          faceCount: this.die.faceCount,
          selectedFace: value,
        });
      }
    });
  }

  ngOnInit(): void {
    this.selectedFace.setValue(this.die.selectedFace);
  }

  getFaceOptions(): number[] {
    return [...new Array(this.die.faceCount).keys()].map((i) => i + 1);
  }
}
