import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { ReactiveFormsModule } from '@angular/forms';
import DieComponent from './die.component';
import { DEFAULT_CONFIG } from '../const';
import { Config } from '../general_types';
import createSpy = jasmine.createSpy;

describe(DieComponent.name, () => {
  it('custom face count not visible', async () => {
    const dieChangedCallback = createSpy();
    const config: Config = { ...DEFAULT_CONFIG };
    await render(
      `<app-die [config]="config" [die]="die" (dieChanged)="dieChanged($event)"></app-die>`,
      {
        declarations: [DieComponent],
        componentProperties: {
          config,
          die: {
            selectedFaceCount: 6,
            selectedFace: 3,
          },
          dieChanged: dieChangedCallback,
        },
        imports: [MatSelectModule, ReactiveFormsModule, MatRadioModule],
      }
    );

    // Confirm the select is not visible yet.
    expect(await screen.queryByLabelText('Face Count')).toBeNull();
  });

  it('select face count', async () => {
    const dieChangedCallback = createSpy();
    const config: Config = { ...DEFAULT_CONFIG, customizeDieFaceCount: true };
    const { fixture } = await render(
      `<app-die [config]="config" [die]="die" (dieChanged)="dieChanged($event)"></app-die>`,
      {
        declarations: [DieComponent],
        componentProperties: {
          config,
          die: {
            selectedFaceCount: 6,
            selectedFace: 3,
          },
          dieChanged: dieChangedCallback,
        },
        imports: [MatSelectModule, ReactiveFormsModule, MatRadioModule],
      }
    );

    const targetFaceCountSelection = 4;
    const targetFaceSelection = 2;
    const faceCountElement = await screen.findByLabelText('Face Count');

    // Select a face count.
    userEvent.click(faceCountElement);
    const option = await screen.getByText(
      (text, element) =>
        text === `${targetFaceCountSelection}` &&
        element?.className === 'mat-option-text'
    );
    userEvent.click(option);
    expect(dieChangedCallback).toHaveBeenCalledWith({
      selectedFaceCount: targetFaceCountSelection,
      selectedFace: 3,
    });

    // Confirm the number of face radios have changed.
    const faceOptionArr = screen.queryAllByText((content, element) => {
      if (element instanceof HTMLInputElement) {
        const inputElement = element as HTMLInputElement;
        return inputElement.type === 'radio';
      }
      return false;
    }) as HTMLInputElement[];
    expect(faceOptionArr.length).toEqual(targetFaceCountSelection);

    // Click a face option.
    const faceOption = faceOptionArr.filter(
      (o) => o.value === `${targetFaceSelection}`
    )[0];
    userEvent.click(faceOption);
    expect(dieChangedCallback).toHaveBeenCalledWith({
      selectedFaceCount: targetFaceCountSelection,
      selectedFace: targetFaceSelection,
    });

    fixture.destroy();
  });
});
