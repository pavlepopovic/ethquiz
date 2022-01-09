import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { NotAuthGuard } from './auth/not.auth.guard';
import { SignupComponent } from './auth/signup/signup.component';
import { HomeComponent } from './home/home.component';

const routes: Routes = [
  {path : '', component: HomeComponent},
  {path : 'login', component: LoginComponent, canActivate: [NotAuthGuard]},
  {path : 'signup', component: SignupComponent, canActivate: [NotAuthGuard]},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [NotAuthGuard]
})
export class AppRoutingModule { }
