import { Component, OnDestroy, OnInit } from "@angular/core";
import { NgForm } from "@angular/forms";
import { Subscription } from "rxjs";
import { AuthService } from "../auth.service";

// No selector needed, as this will be accessible only via router
@Component({
  templateUrl : './login.component.html',
  styleUrls : ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {

  isLoading : boolean = false;
  authStatusListener : Subscription

  constructor(private authService : AuthService) {}

  onLogin(form : NgForm) {
    if (form.invalid) {
      return;
    }

    this.isLoading = true;
    this.authService.login(form.value.email, form.value.password);
  }

  ngOnInit(): void {
    this.authStatusListener = this.authService.getAuthStatusListener().subscribe({
      next : (res) => { this.isLoading = false }
    })
  }
  ngOnDestroy(): void {
    this.authStatusListener.unsubscribe();
  }
}
