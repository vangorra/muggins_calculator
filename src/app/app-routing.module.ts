import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import CalculatorComponent from './calculator/calculator.component';
import { ConfigurationComponent } from './configuration/configuration.component';

export const routes: Routes = [
  {
    path: 'calculator',
    component: CalculatorComponent,
  },
  {
    path: 'configuration',
    component: ConfigurationComponent,
  },
  {
    path: '',
    redirectTo: '/calculator',
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule],
})
export default class AppRoutingModule {}
