import { Component } from "@angular/core";
import { NgForm } from "@angular/forms";
import { Router } from "@angular/router";
import { AuthService } from "../auth.service";

@Component({
  styleUrls : ['./signup.component.css'],
  templateUrl : './signup.component.html'
})
export class SignupComponent {

  isLoading : boolean = false;

  constructor(private authService : AuthService, private router : Router){}

  onSignup(form : NgForm) {
    this.isLoading = true;
    this.authService.signup(form.value.email, form.value.password).subscribe({
      next : (res) => { this.router.navigate(['/'])},
      error : (err) => { this.isLoading = false;}
    });
  }
}
