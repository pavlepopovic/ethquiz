import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { Observable, Subject } from "rxjs";
import { environment } from "src/environments/environment";
import { User } from "./user.model";

const BACKEND_API_WITH_SLASH = environment.BACKEND_API_WITH_SLASH + "users/";

@Injectable({providedIn: 'root'})
export class AuthService {

  private loggedInUser : User = null;
  private authStatusListener : Subject<{isLoggedIn : boolean, user : User}> = new Subject<{isLoggedIn : boolean, user : User}>();
  private tokenTimer : NodeJS.Timer;
  private jwtToken : string = null;

  constructor(private router : Router, private httpClient : HttpClient) {}

  public autoAuthUser() {
    const user : User = JSON.parse(localStorage.getItem('User'));
    const jwtToken : string = localStorage.getItem('JwtToken');
    const expirationDate : Date = new Date(localStorage.getItem('TokenExpirationDate'));

    if (!user || !jwtToken || !expirationDate) {
      return;
    }

    // check for token expiry
    const now = new Date();
    const expiresIn = expirationDate.getTime() - now.getTime();

    if (expiresIn > 0) {
      this.loggedInUser = user;
      this.jwtToken = jwtToken;
      this.setTokenExpirationTimer(expiresIn / 1000); // convert to seconds
      this.authStatusListener.next({isLoggedIn : true, user : this.loggedInUser});
    }
  }

  public login(email : string, password: string) {
    this.httpClient.post<{resEmail : string, resTokenCount : number, _id : string, resJWT : string, resExpiresIn : number}>(BACKEND_API_WITH_SLASH + 'login', {email : email, password : password})
      .subscribe({
        next : (res) => {

          this.jwtToken = res.resJWT;
          if (this.jwtToken) {
            this.loggedInUser = {
              email : res.resEmail,
              tokenCount : res.resTokenCount,
              id : res._id
            }

            // this will auto log off after some time
            this.setTokenExpirationTimer(res.resExpiresIn);

            const now = new Date();
            const expirationDate = new Date(now.getTime() + res.resExpiresIn * 1000); // miliseconds

            this.storeAuthDataInLocalStorage(this.loggedInUser, expirationDate, this.jwtToken);
            this.authStatusListener.next({isLoggedIn : true, user : this.loggedInUser});
            this.router.navigate(['/']);
          }

        },
        error : (err) => {
          this.loggedInUser = null;
          this.jwtToken = null;
          this.deleteAuthDataFromLocalStorage();
          this.authStatusListener.next({isLoggedIn : false, user : null});
        }
      })
  }

  public logout() {
    this.loggedInUser = null;
    this.jwtToken = null;
    this.authStatusListener.next({isLoggedIn : false, user : null});
    clearTimeout(this.tokenTimer);
    this.deleteAuthDataFromLocalStorage();
    this.router.navigate(['/']);
  }

  public signup(email : string, password: string) : Observable<any> {
    return this.httpClient.post(BACKEND_API_WITH_SLASH + 'signup',  {
      email : email,
      password : password,
    });
  }

  public isLoggedIn() : boolean {
    return this.loggedInUser != null;
  }

  public getLoggedInUser() : User {
    return this.loggedInUser;
  }

  public getJwtToken() : string {
    return this.jwtToken;
  }

  public getAuthStatusListener() : Observable<{isLoggedIn : boolean, user : User}> {
    return this.authStatusListener.asObservable();
  }

  private setTokenExpirationTimer(expiresInSeconds : number) {
    this.tokenTimer = setTimeout(() => {
      this.logout();
    }, expiresInSeconds * 1000);
  }

  private storeAuthDataInLocalStorage(user : User, expirationTime : Date, jwtToken : string) {
    if (user != null)
    {
      localStorage.setItem('User', JSON.stringify(user));
      localStorage.setItem('TokenExpirationDate', expirationTime.toISOString());
      localStorage.setItem('JwtToken', jwtToken);
    }
  }

  private deleteAuthDataFromLocalStorage() {
    localStorage.removeItem('User');
    localStorage.removeItem('TokenExpirationDate');
    localStorage.removeItem('JwtToken');
  }
}
