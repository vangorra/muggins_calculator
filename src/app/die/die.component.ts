import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {FormControl} from "@angular/forms";
import {merge, Subject} from "rxjs";
import {takeUntil} from "rxjs/operators";
import {DEFAULT_DIE_SELECTED_FACE, DEFAULT_DIE_SELECTED_FACE_COUNT, DIE_FACE_COUNT_OPTIONS} from "../const";
import {Config, Die} from "../general_types";

@Component({
  selector: 'app-die',
  templateUrl: './die.component.html',
  styleUrls: ['./die.component.less']
})
export default class DieComponent implements OnInit, OnDestroy {
  readonly faceCountOptions = DIE_FACE_COUNT_OPTIONS;

  @Input()
  config!: Config

  @Input()
  die!: Die;

  @Output()
  dieChanged = new EventEmitter<Die>();

  readonly selectedFaceCount = new FormControl(DEFAULT_DIE_SELECTED_FACE_COUNT);

  readonly selectedFace = new FormControl(DEFAULT_DIE_SELECTED_FACE);

  private readonly destroy = new Subject<void>();

  ngOnInit(): void {
    this.selectedFaceCount.setValue(this.die.selectedFaceCount);
    this.selectedFace.setValue(this.die.selectedFace);

    // Subscribe to changes in the new form controls.
    merge(
      this.selectedFaceCount.valueChanges,
      this.selectedFace.valueChanges
    )
    .pipe(takeUntil(this.destroy))
    .subscribe(() => {
      this.die.selectedFaceCount = this.selectedFaceCount.value;
      this.die.selectedFace = this.selectedFace.value;
      this.dieChanged.emit(this.die);
    });
  }

  ngOnDestroy() {
    this.destroy.next();
  }

  getFaceOptions(): number[] {
    return [...new Array(this.selectedFaceCount.value).keys()].map(i => i + 1);
  }
}
