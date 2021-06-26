import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {FormControl} from "@angular/forms";
import {DEFAULT_DIE_SELECTED_FACE, DEFAULT_DIE_SELECTED_FACE_COUNT, DIE_FACE_COUNT_OPTIONS} from "../const";
import {Die} from "../general_types";
import {merge} from "rxjs";

@Component({
  selector: 'app-die',
  templateUrl: './die.component.html',
  styleUrls: ['./die.component.less']
})
export class DieComponent implements OnInit {
  readonly faceCountOptions = DIE_FACE_COUNT_OPTIONS;

  @Input()
  die!: Die;

  @Output()
  onChange = new EventEmitter<Die>();

  readonly selectedFaceCount = new FormControl(DEFAULT_DIE_SELECTED_FACE_COUNT);
  readonly selectedFace = new FormControl(DEFAULT_DIE_SELECTED_FACE);

  constructor() { }

  ngOnInit(): void {
    this.selectedFaceCount.setValue(this.die.selectedFaceCount);
    this.selectedFace.setValue(this.die.selectedFace);

    merge(
      this.selectedFaceCount.valueChanges,
      this.selectedFace.valueChanges
    ).subscribe(() => {
      this.die.selectedFaceCount = this.selectedFaceCount.value;
      this.die.selectedFace = this.selectedFace.value;
      this.onChange.emit(this.die);
    });
  }

  getFaceOptions(): number[] {
    return [...new Array(this.selectedFaceCount.value).keys()].map(i => i + 1);
  }
}
