import { Component, OnDestroy, OnInit } from "@angular/core";
import { Subscription } from "rxjs";
import { AuthService } from "../auth/auth.service";

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  public isUserLoggedIn = false;
  private authStatusListener : Subscription;

  constructor(private authService : AuthService) {}

  onLogout(): void {
    this.authService.logout();
  }

  ngOnDestroy(): void {
    this.authStatusListener.unsubscribe();
  }

  ngOnInit(): void {
    this.isUserLoggedIn = this.authService.isLoggedIn();
    this.authStatusListener = this.authService.getAuthStatusListener().subscribe(
      (isLoggedIn) => {
        this.isUserLoggedIn = isLoggedIn.isLoggedIn;
      })
  }
}
