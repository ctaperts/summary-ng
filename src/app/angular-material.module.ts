import { NgModule } from '@angular/core';
import {
  MatPaginatorModule,
  MatInputModule,
  MatCardModule,
  MatButtonModule,
  MatToolbarModule,
  MatExpansionModule,
  MatProgressSpinnerModule,
  MatDialogModule,
  MatSidenavModule
} from '@angular/material'

@NgModule({
  exports: [
    MatInputModule,
    MatCardModule,
    MatButtonModule,
    MatToolbarModule,
    MatExpansionModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatDialogModule,
    MatSidenavModule
  ]
})
export class AngularMaterialModule {}
