import { ComponentFixture, TestBed } from '@angular/core/testing';

import {
  ButtonTypeEnum,
  ConfirmDialogComponent,
  ConfirmDialogData,
} from './confirm-dialog.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { provideAnimations } from '@angular/platform-browser/animations';
import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  Output,
} from '@angular/core';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-test-component',
  standalone: true,
  template: ` <button (click)="openDialog()">Open Dialog</button> `,
})
class TestComponent implements OnDestroy {
  @Output()
  readonly dialogClosedState = new EventEmitter<boolean>();

  @Input()
  dialogData!: RecursivePartial<ConfirmDialogData>;

  private afterClosedSubscription?: Subscription;

  private readonly matDialog = inject(MatDialog);

  ngOnDestroy(): void {
    this.afterClosedSubscription?.unsubscribe();
  }

  openDialog(): void {
    this.afterClosedSubscription = this.matDialog
      .open(ConfirmDialogComponent, {
        data: this.dialogData,
      })
      .afterClosed()
      .subscribe((state) => {
        this.dialogClosedState.emit(state);
      });
  }
}

describe(ConfirmDialogComponent.name, () => {
  let fixture: ComponentFixture<TestComponent>;
  let component: TestComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestComponent, ConfirmDialogComponent, MatDialogModule],
      providers: [provideAnimations()],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  const openAndClickButton = (
    clickAccept: boolean,
    expectState: boolean | null
  ) => {
    it(`Open and click ${
      clickAccept ? 'Accept' : 'Reject'
    } button and expect state '${expectState}'.`, async () => {
      component.dialogData = {
        acceptButton: {
          show: true,
        },
        rejectButton: {
          show: true,
        },
      };

      const statePromise = new Promise<boolean>((resolve) => {
        component.dialogClosedState.subscribe((state) => {
          resolve(state);
        });
      });
      component.openDialog();
      fixture.detectChanges();

      const dialogElement = document.querySelector(
        'app-confirm-dialog'
      ) as HTMLElement;
      expect(dialogElement).toBeTruthy();

      let button: HTMLButtonElement;
      if (clickAccept) {
        button = dialogElement.querySelector(
          'button.acceptButton'
        ) as HTMLButtonElement;
      } else {
        button = dialogElement.querySelector(
          'button.rejectButton'
        ) as HTMLButtonElement;
      }

      expect(button).toBeTruthy();
      button.click();
      fixture.detectChanges();

      const result = await statePromise;
      expect(result).toEqual(expectState);
    });
  };

  openAndClickButton(true, true);
  openAndClickButton(false, null);

  it('empty values', () => {
    component.dialogData = {} as any;
    component.openDialog();
    fixture.detectChanges();
    const dialogElement = document.querySelector(
      'app-confirm-dialog'
    ) as HTMLElement;
    expect(dialogElement).toBeTruthy();

    expect(dialogElement.querySelectorAll('[mat-dialog-title]').length).toEqual(
      0
    );
    expect(
      dialogElement.querySelectorAll('[mat-dialog-content]').length
    ).toEqual(0);
    expect(
      dialogElement.querySelectorAll('mat-dialog-actions button').length
    ).toEqual(0);
  });

  it('set title', () => {
    component.dialogData = {
      title: 'Test title',
    };
    component.openDialog();
    fixture.detectChanges();
    const dialogElement = document.querySelector(
      'app-confirm-dialog'
    ) as HTMLElement;
    expect(dialogElement).toBeTruthy();

    expect(
      dialogElement.querySelector('[mat-dialog-title]')?.textContent
    ).toEqual('Test title');
    expect(
      dialogElement.querySelectorAll('[mat-dialog-content]').length
    ).toEqual(0);
    expect(
      dialogElement.querySelectorAll('mat-dialog-actions button').length
    ).toEqual(0);
  });

  it('set content', () => {
    component.dialogData = {
      content: 'Test content',
    };
    component.openDialog();
    fixture.detectChanges();
    const dialogElement = document.querySelector(
      'app-confirm-dialog'
    ) as HTMLElement;
    expect(dialogElement).toBeTruthy();

    expect(dialogElement.querySelectorAll('[mat-dialog-title]').length).toEqual(
      0
    );
    expect(
      dialogElement.querySelector('[mat-dialog-content]')?.textContent
    ).toEqual('Test content');
    expect(
      dialogElement.querySelectorAll('mat-dialog-actions button').length
    ).toEqual(0);
  });

  const expectButtonStyle = (
    useAccept: boolean,
    buttonType: ButtonTypeEnum | undefined,
    expectAttribute: string
  ) => {
    const buttonToAttributeMap: { [key: string]: string } = {
      flat: 'mat-flat-button',
      raised: 'mat-raised-button',
      stroked: 'mat-stroked-button',
    };

    it(`button with type ${buttonType} has attribute ${expectAttribute}`, () => {
      const propName = useAccept ? 'acceptButton' : 'rejectButton';
      component.dialogData = {
        [propName]: {
          show: true,
          title: 'Accept',
          type: buttonType || ButtonTypeEnum.basic,
        },
      };
      component.openDialog();
      fixture.detectChanges();
      const dialogElement = document.querySelector(
        'app-confirm-dialog'
      ) as HTMLElement;
      expect(dialogElement).toBeTruthy();

      const query = useAccept ? 'button.acceptButton' : 'button.rejectButton';
      const button = dialogElement.querySelector(query) as HTMLButtonElement;

      Object.keys(buttonToAttributeMap)
        .filter((bt) => bt !== buttonType)
        .forEach((bt) => {
          expect(button.hasAttribute(buttonToAttributeMap[bt])).toBeFalsy();
        });
      expect(button.hasAttribute('mat-button')).toBeTruthy();
      expect(button.hasAttribute(expectAttribute)).toBeTruthy();
    });
  };

  expectButtonStyle(true, ButtonTypeEnum.basic, 'mat-button');
  expectButtonStyle(true, ButtonTypeEnum.raised, 'mat-raised-button');
  expectButtonStyle(true, ButtonTypeEnum.stroked, 'mat-stroked-button');
  expectButtonStyle(true, ButtonTypeEnum.flat, 'mat-flat-button');

  expectButtonStyle(false, ButtonTypeEnum.basic, 'mat-button');
  expectButtonStyle(false, ButtonTypeEnum.raised, 'mat-raised-button');
  expectButtonStyle(false, ButtonTypeEnum.stroked, 'mat-stroked-button');
  expectButtonStyle(false, ButtonTypeEnum.flat, 'mat-flat-button');
});
