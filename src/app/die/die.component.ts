import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import { DEFAULT_DIE_SELECTED_FACE } from '../const';
import { Die } from '../general_types';

@Component({
  selector: 'app-die',
  templateUrl: './die.component.html',
  styleUrls: ['./die.component.scss'],
})
export default class DieComponent implements OnInit, OnDestroy {
  @Input()
  label!: string;

  @Input()
  die!: Die;

  @Output()
  faceChanged = new EventEmitter<Die>();

  readonly selectedFace = new FormControl(DEFAULT_DIE_SELECTED_FACE);

  selectedFaceSubscription?: Subscription;

  ngOnInit(): void {
    this.selectedFace.setValue(this.die.selectedFace);

    this.selectedFaceSubscription = this.selectedFace.valueChanges.subscribe(
      () => {
        this.faceChanged.emit({
          faceCount: this.die.faceCount,
          selectedFace: this.selectedFace.value,
        });
      }
    );
  }

  ngOnDestroy() {
    this.selectedFaceSubscription?.unsubscribe();
    this.selectedFaceSubscription = undefined;
  }

  getFaceOptions(): number[] {
    return [...new Array(this.die.faceCount).keys()].map((i) => i + 1);
  }
}
