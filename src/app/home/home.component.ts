import { Component, OnDestroy, OnInit } from "@angular/core";
import { Subscription } from "rxjs";
import { AuthService } from "../auth/auth.service";
import { User } from "../auth/user.model";
import { FindingMatchStatus, FindMatchService } from "./find.match.service.ts";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy{

  isLoggedIn : boolean = false;
  loggedInUser : User = null;
  hasSubmitedQuestions : boolean = false;
  authStatusListener : Subscription;
  findMatchStatusListener : Subscription;
  resultsRetrievedListener : Subscription;
  findingMatchStatus : FindingMatchStatus = FindingMatchStatus.NotFinding;
  retrievedResults : boolean = false;
  numCorrectAnswers : Number = 0;
  findingMatchStatusEnum = FindingMatchStatus;
  questions : string[];
  userAnswers : boolean[] = [false, false, false, false, false]

  constructor(private authService : AuthService, private findMatchService : FindMatchService){}

  processFindMatchButton() {
    this.findMatchService.findOrStopFindingMatch();
  }

  answerQuestions() {
    this.hasSubmitedQuestions = true;
    this.findMatchService.answerQuestions(this.userAnswers);
  }

  ngOnInit(): void {
    this.isLoggedIn = this.authService.isLoggedIn();
    this.loggedInUser = this.authService.getLoggedInUser();
    this.authStatusListener = this.authService.getAuthStatusListener().subscribe((
      loginStatus => {
        this.isLoggedIn = loginStatus.isLoggedIn;
        this.loggedInUser = loginStatus.user;
      }
    ))
    this.findMatchStatusListener = this.findMatchService.getFindingMatchStatusListener()
      .subscribe({
        next : (findMatchStatus) => {
          this.findingMatchStatus = findMatchStatus.status;
          this.questions = findMatchStatus.questions;
        }
      });
    this.resultsRetrievedListener = this.findMatchService.getResultsListener()
      .subscribe({
        next : (results) => {
          this.retrievedResults = results.resultsRetrieved;
          this.numCorrectAnswers = results.numCorrectAnswers;
        }
      })

    // In case of a page reload - try getting the questions
    if (this.isLoggedIn) {
      this.findMatchService.fetchPendingQuestions();
    }
  }

  ngOnDestroy(): void {
    this.authStatusListener.unsubscribe();
    this.findMatchStatusListener.unsubscribe();
    this.resultsRetrievedListener.unsubscribe();
    // remove yourself from any pending lobbies
    if (this.isLoggedIn) {
      this.findMatchService.stopFindingMatch();
    }
  }

  getButtonText() : string {
    switch(this.findingMatchStatus) {
      case FindingMatchStatus.NotFinding:
        return "Find Match";
      case FindingMatchStatus.Finding:
        return "Cancel"
      case FindingMatchStatus.Found:
        return "";
    }
  }

}
