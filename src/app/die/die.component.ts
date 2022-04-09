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
import { DEFAULT_DIE_SELECTED_FACE, DIE_FACE_COUNT_OPTIONS } from '../const';
import { Die } from '../general_types';

@Component({
  selector: 'app-die',
  templateUrl: './die.component.html',
  styleUrls: ['./die.component.scss'],
})
export default class DieComponent implements OnInit, OnDestroy {
  readonly faceCountOptions = DIE_FACE_COUNT_OPTIONS;

  @Input()
  label!: string;

  @Input()
  die!: Die;

  @Output()
  dieChanged = new EventEmitter<Die>();

  readonly selectedFace = new FormControl(DEFAULT_DIE_SELECTED_FACE);

  private selectedFaceSubscription?: Subscription;

  ngOnInit(): void {
    this.selectedFace.setValue(this.die.selectedFace);

    this.selectedFaceSubscription = this.selectedFace.valueChanges.subscribe(
      () => {
        this.dieChanged.emit({
          faceCount: this.die.faceCount,
          selectedFace: this.selectedFace.value,
        });
      }
    );
  }

  ngOnDestroy() {
    this.selectedFaceSubscription?.unsubscribe();
  }

  getFaceOptions(): number[] {
    return [...new Array(this.die.faceCount).keys()].map((i) => i + 1);
  }
}
