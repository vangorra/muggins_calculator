import {
  afterEveryRender,
  Component,
  computed,
  effect,
  inject,
  Injector,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';
import { CalculationModeEnum, Die } from '../general_types';
import { ConfigurationService } from '../configuration.service';
import { ToolbarService } from '../toolbar.service';
import { Router } from '@angular/router';
import { AboutDialogComponent } from '../about-dialog/about-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import {
  CalculateStatus,
  SolverOrchestrator,
} from '../solver/solver-orchestrator';
import { CalculateEquationResult } from '@muggins_calculator/common';
import { Duration } from 'luxon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { DiceComponent } from '../dice/dice.component';
import { ScrollToTopComponent } from '../scroll-to-top/scroll-to-top.component';
import { MathJaxDirective } from '../math-jax/math-jax.directive';
import { SolutionsService } from '../solutions.service';

export interface JumpTotal {
  readonly total: number;
  readonly count: number;
}

// TODO: migrate to animate.enter/animate.leave once Angular stabilizes the new API (post-v23)
const resultCountAnimation = trigger('resultCount', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(-100%)' }),
    animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
  ]),
  transition(':leave', [
    style({ position: 'absolute', top: '0', left: '0' }),
    animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(100%)' })),
  ]),
]);

const equationAnimation = trigger('equation', [
  transition(':enter', [
    style({ opacity: 0 }),
    animate('300ms ease-out', style({ opacity: 1 })),
  ]),
]);

const jumpButtonAnimation = trigger('jumpButton', [
  transition(':enter', [
    style({ width: '0', overflow: 'hidden', padding: '0' }),
    animate('200ms ease-out', style({ width: '*', padding: '*' })),
  ]),
  transition(':leave', [
    style({ overflow: 'hidden' }),
    animate('150ms ease-in', style({ width: '0', padding: '0' })),
  ]),
]);

@Component({
  selector: 'app-calculator',
  templateUrl: './calculator.component.html',
  styleUrls: ['./calculator.component.scss'],
  animations: [resultCountAnimation, equationAnimation, jumpButtonAnimation],
  imports: [
    MatCardModule,
    MatProgressBarModule,
    MatButtonModule,
    MatDividerModule,
    MatListModule,
    DiceComponent,
    ScrollToTopComponent,
    MathJaxDirective,
  ],
})
export default class CalculatorComponent implements OnInit, OnDestroy {
  readonly calculateStatuses = CalculateStatus;

  // Writable state signals.
  private readonly _calculateStatus = signal(CalculateStatus.PROCESSING);
  private readonly _calculateProgress = signal(0);
  private readonly _jumpData = signal(new Map<number, number>());
  private readonly _dataSource = signal<'pregenerated' | 'local' | null>(null);
  private readonly _showLoadingPanel = signal(false);
  readonly loadedEquations = signal(new Map<number, CalculateEquationResult[]>());
  readonly fallbackNotified = signal(false);
  readonly estimatedTimeToCompletion = signal<string | undefined>(undefined);

  // Private state.
  private localResultsByTotal = new Map<number, CalculateEquationResult[]>();
  private loadingTotals = new Set<number>();
  private cancelledRef = false;
  private updateEstimateInterval?: ReturnType<typeof setInterval>;
  private loadingTimer?: ReturnType<typeof setTimeout>;
  private progressEffectCleanup?: () => void;
  private intersectionObserver?: IntersectionObserver;
  private observedElements = new Set<Element>();

  // Injected services.
  private readonly matDialog = inject(MatDialog);
  private readonly configurationService = inject(ConfigurationService);
  private readonly toolbarService = inject(ToolbarService);
  private readonly router = inject(Router);
  private readonly solverOrchestrator = inject(SolverOrchestrator);
  private readonly solutionsService = inject(SolutionsService);
  private readonly injector = inject(Injector);

  // Orchestrator signal for local mode estimated time.
  private readonly progressSignal = this.solverOrchestrator.progress;

  // Computed signals.
  readonly calculateStatus = this._calculateStatus.asReadonly();
  readonly calculateProgress = this._calculateProgress.asReadonly();
  readonly dataSource = this._dataSource.asReadonly();

  // Show loading panel only when calculating AND the threshold has been exceeded.
  readonly showLoadingPanel = computed(
    () => this._calculateStatus() === CalculateStatus.PROCESSING && this._showLoadingPanel(),
  );

  readonly jumpTotals = computed(() => {
    const jumpData = this._jumpData();
    const config = this.configurationService.value();
    const { minSize, maxSize } = config.board;

    return [...jumpData.entries()]
      .filter(([total, count]) => total >= minSize && total <= maxSize && count > 0)
      .map(([total, count]) => ({ total, count }))
      .sort((a, b) => a.total - b.total);
  });

  readonly totalEquationCount = computed(() => {
    return this.jumpTotals().reduce((sum, jt) => sum + jt.count, 0);
  });

  readonly resultCountArray = computed(() => {
    if (this.calculateStatus() === CalculateStatus.PROCESSED && this.totalEquationCount() > 0) {
      return [this.totalEquationCount()];
    }
    return [];
  });

  readonly dice = computed(() => {
    const configuration = this.configurationService.value();
    return configuration.dice.map(({ faceCount, selectedFace }, index) => ({
      index,
      faceCount,
      selectedFace,
    }));
  });

  readonly selectedEquations: CalculateEquationResult[] = [];

  constructor() {
    this.toolbarService.set({
      title: 'Muggins Calculator',
      buttons: [
        ToolbarService.newButton({
          title: 'About',
          icon: 'help',
          testId: 'app-calculator_toolbar_aboutButton',
          onClick: () => this.matDialog.open(AboutDialogComponent, {}),
        }),
        ToolbarService.newButton({
          title: 'Configuration',
          icon: 'settings',
          testId: 'app-calculator_toolbar_configurationButton',
          onClick: () => this.router.navigate(['/configuration']),
        }),
      ],
    });

    this.setupIntersectionObserver();

    afterEveryRender(() => {
      if (this._calculateStatus() === CalculateStatus.PROCESSED) {
        this.observeNewSections();
      }
    });
  }

  ngOnInit(): void {
    this.doCalculate();
  }

  ngOnDestroy(): void {
    this.cancel();
    this.stopEstimatedTimeInterval();
    this.clearLoadingTimer();
    this.intersectionObserver?.disconnect();
    this.progressEffectCleanup?.();
  }

  // --- IntersectionObserver ---

  private setupIntersectionObserver(): void {
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const total = Number(entry.target.getAttribute('data-total'));
            if (!isNaN(total)) {
              this.loadEquationsForTotal(total);
            }
            this.intersectionObserver?.unobserve(entry.target);
            this.observedElements.delete(entry.target);
          }
        }
      },
      { rootMargin: '200px' },
    );
  }

  private observeNewSections(): void {
    const sections = document.querySelectorAll('.total-section[data-total]');
    sections.forEach((section) => {
      if (!this.observedElements.has(section)) {
        this.observedElements.add(section);
        this.intersectionObserver?.observe(section);
      }
    });
  }

  // --- Estimated time ---

  private stopEstimatedTimeInterval(): void {
    if (!this.updateEstimateInterval) return;
    clearInterval(this.updateEstimateInterval);
    this.updateEstimateInterval = undefined;
  }

  private restartEstimatedTimeInterval(): void {
    this.stopEstimatedTimeInterval();

    let lastEstimatedTimeToCompletion = 0;
    let currentEstimatedTimeToCompletion = 0;
    this.updateEstimateInterval = setInterval(() => {
      const p = this.progressSignal();
      if (!p || !p.duration) {
        this.estimatedTimeToCompletion.set(undefined);
        return;
      }

      if (p.estimatedTimeToCompletion !== lastEstimatedTimeToCompletion) {
        currentEstimatedTimeToCompletion = p.estimatedTimeToCompletion;
        lastEstimatedTimeToCompletion = p.estimatedTimeToCompletion;
      }

      currentEstimatedTimeToCompletion -= 1000;

      const rescaledDuration = Duration.fromMillis(
        Math.floor(currentEstimatedTimeToCompletion / 1000) * 1000,
      ).rescale();
      this.estimatedTimeToCompletion.set(rescaledDuration.toHuman());
    }, 1000);
  }

  // --- Loading panel visibility ---

  private clearLoadingTimer(): void {
    if (this.loadingTimer) {
      clearTimeout(this.loadingTimer);
      this.loadingTimer = undefined;
    }
  }

  private scheduleLoadingPanel(): void {
    this.clearLoadingTimer();
    this._showLoadingPanel.set(false);
    this.loadingTimer = setTimeout(() => {
      if (this._calculateStatus() === CalculateStatus.PROCESSING) {
        this._showLoadingPanel.set(true);
      }
    }, 1000);
  }

  private showLoadingPanelNow(): void {
    this.clearLoadingTimer();
    this._showLoadingPanel.set(true);
  }

  private hideLoadingPanel(): void {
    this.clearLoadingTimer();
    this._showLoadingPanel.set(false);
  }

  // --- State management ---

  private clearState(): void {
    this.clearSelectedEquations();
    this.localResultsByTotal.clear();
    this.loadingTotals.clear();
    this.loadedEquations.set(new Map());
    this._dataSource.set(null);
    this.fallbackNotified.set(false);
    this.cancelledRef = false;
    this.observedElements.clear();
    this.progressEffectCleanup?.();
    this.progressEffectCleanup = undefined;
  }

  // --- Main calculation flow ---

  async doCalculate(): Promise<void> {
    this.clearState();
    this._calculateStatus.set(CalculateStatus.PROCESSING);
    this._calculateProgress.set(0);

    const configuration = this.configurationService.value();
    const faces = this.dice().map(({ selectedFace }) => selectedFace);
    const diceCount = faces.length;

    // Schedule loading panel to appear after 1 second if still calculating.
    this.scheduleLoadingPanel();

    // Try pre-generated solutions first, unless the user has opted out.
    if (configuration.calculationMode !== CalculationModeEnum.LOCAL_ONLY) {
      const jumpData = await this.solutionsService.getJumpData(
        diceCount,
        faces,
        configuration.operations,
        (completed, total) => {
          if (!this.cancelledRef) {
            // Show loading panel immediately if downloading more than 20 files.
            if (total > 20) {
              this.showLoadingPanelNow();
            }
            this._calculateProgress.set(Math.floor((completed / total) * 100));
          }
        },
      );

      if (this.cancelledRef) {
        return;
      }

      if (jumpData !== null) {
        console.log('Using pre-generated solutions.');
        this._dataSource.set('pregenerated');
        this._jumpData.set(jumpData);
        this.hideLoadingPanel();
        this._calculateStatus.set(CalculateStatus.PROCESSED);
        return;
      }
    }

    // Fall back to local computation — show loading immediately for more than 4 dice.
    if (diceCount > 4) {
      this.showLoadingPanelNow();
    }
    const notifyFallback = configuration.calculationMode !== CalculationModeEnum.LOCAL_ONLY;
    console.log(notifyFallback
      ? 'Pre-generated solutions unavailable. Falling back to local computation.'
      : 'Local computation selected.');
    await this.doLocalCalculation(configuration, faces, diceCount, notifyFallback);
  }

  private async doLocalCalculation(
    configuration: ReturnType<ConfigurationService['value']>,
    faces: number[],
    _diceCount: number,
    notifyFallback = false,
  ): Promise<void> {
    this.fallbackNotified.set(notifyFallback);
    this._dataSource.set('local');
    this._calculateProgress.set(0);

    // Track orchestrator progress via effect.
    // Must pass injector explicitly since this runs in an async method, outside the constructor injection context.
    const effectRef = effect(() => {
      const p = this.solverOrchestrator.progress();
      this._calculateProgress.set(Math.floor(p.percentage * 100));
    }, { injector: this.injector });
    this.progressEffectCleanup = () => effectRef.destroy();

    this.restartEstimatedTimeInterval();

    try {
      const results = await this.solverOrchestrator.calculate({
        calculateConfig: {
          minTotal: configuration.board.minSize,
          maxTotal: configuration.board.maxSize,
          faces,
          operations: configuration.operations as any,
        },
      });

      if (this.solverOrchestrator.isCancelled()) {
        this._calculateStatus.set(CalculateStatus.CANCELLED);
        return;
      }

      // Group results by total.
      this.localResultsByTotal = new Map();
      for (const result of results) {
        let existing = this.localResultsByTotal.get(result.total);
        if (!existing) {
          existing = [];
          this.localResultsByTotal.set(result.total, existing);
        }
        existing.push(result);
      }

      const localJumpData = new Map<number, number>();
      for (const [total, equations] of this.localResultsByTotal) {
        localJumpData.set(total, equations.length);
      }
      this._jumpData.set(localJumpData);
      // All equation data is already in memory — load it all immediately.
      this.loadedEquations.set(new Map(this.localResultsByTotal));
      this.hideLoadingPanel();
      this._calculateStatus.set(CalculateStatus.PROCESSED);
    } catch {
      if (!this.solverOrchestrator.isCancelled()) {
        throw new Error('Calculation failed');
      }
      this._calculateStatus.set(CalculateStatus.CANCELLED);
    } finally {
      this.stopEstimatedTimeInterval();
      this.progressEffectCleanup?.();
      this.progressEffectCleanup = undefined;
    }
  }

  // --- Lazy loading ---

  async loadEquationsForTotal(total: number): Promise<void> {
    if (this.loadedEquations().has(total) || this.loadingTotals.has(total)) return;
    this.loadingTotals.add(total);

    try {
      let equations: CalculateEquationResult[] | null = null;

      if (this._dataSource() === 'pregenerated') {
        const faces = this.dice().map((d) => d.selectedFace);
        const diceCount = faces.length;
        const configuration = this.configurationService.value();
        equations = await this.solutionsService.getEquationsForTotal(diceCount, faces, total, configuration.operations);

        if (equations === null) {
          // Totals file failed — fall back to local computation.
          this.fallbackNotified.set(true);
          this.doCalculate();
          return;
        }
      } else {
        equations = this.localResultsByTotal.get(total) || [];
      }

      const newMap = new Map(this.loadedEquations());
      newMap.set(total, equations);
      this.loadedEquations.set(newMap);
    } finally {
      this.loadingTotals.delete(total);
    }
  }

  // --- User actions ---

  cancel(): void {
    this.cancelledRef = true;
    this.hideLoadingPanel();
    if (this._dataSource() === 'local' || this._dataSource() === null) {
      this.solverOrchestrator.cancel();
    }
    this._calculateStatus.set(CalculateStatus.CANCELLED);
    this.stopEstimatedTimeInterval();
  }

  onDiceFaceChanged(dice: Die[]): void {
    this.configurationService.update({
      dice: dice.map(({ faceCount, selectedFace }) => ({
        faceCount,
        selectedFace,
      })),
    });
    this.configurationService.save();
    this.doCalculate();
  }

  async onJumpToTotal(total: number): Promise<void> {
    await this.loadEquationsForTotal(total);
    this.scrollToTotal(total);
    this.selectAllEquationsWithTotal(total);
  }

  private scrollToTotal(total: number): void {
    const element = document.getElementById(`total-${total}`);
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  readonly reloadResultsToStart = async () => {
    document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- Equation selection ---

  clearSelectedEquations(): void {
    this.selectedEquations.splice(0, this.selectedEquations.length);
  }

  onEquationClicked(calculateResult: CalculateEquationResult): void {
    const index = this.selectedEquations.findIndex(
      (eq) => eq.fullEquation === calculateResult.fullEquation,
    );
    if (index >= 0) {
      this.selectedEquations.splice(index, 1);
    } else {
      this.selectedEquations.push(calculateResult);
    }
  }

  isEquationSelected(calculateResult: CalculateEquationResult): boolean {
    return this.selectedEquations.some(
      (eq) => eq.fullEquation === calculateResult.fullEquation,
    );
  }

  selectAllEquationsWithTotal(total: number): void {
    this.clearSelectedEquations();
    const equations = this.loadedEquations().get(total) || [];
    equations.forEach((eq) => this.selectedEquations.push(eq));
  }
}
