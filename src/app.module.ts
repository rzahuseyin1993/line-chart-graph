import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { AppComponent } from "./app.component";
import { GraphLineChartComponent } from "./app/graph-line-chart/graph-line-chart.component";
import { RouterModule, Routes } from '@angular/router';

const appRoutes: Routes = [      
  // { path: '',
  //     redirectTo: '/multi-series',
  //     pathMatch: 'full'
  // },
  { path: '**', component: GraphLineChartComponent }
];

@NgModule({
  bootstrap: [AppComponent],
  declarations: [
    AppComponent,    
    GraphLineChartComponent
],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    RouterModule.forRoot(appRoutes),
    CommonModule,
    FormsModule,
],
  providers: [],
  schemas: []  
})
export class AppModule {}
