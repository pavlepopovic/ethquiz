import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, Subject } from "rxjs";
import { environment } from "src/environments/environment";
import { AuthService } from "../auth/auth.service";

const BACKEND_API_WITH_SLASH = environment.BACKEND_API_WITH_SLASH + 'matchLobby/';

export enum FindingMatchStatus {
  NotFinding,
  Finding,
  Found,
}

@Injectable({providedIn: "root"})
export class FindMatchService {
  findingMatchStatus : FindingMatchStatus = FindingMatchStatus.NotFinding;
  private findingMatchStatusListener : Subject<{status : FindingMatchStatus, questions : string[]}> = new Subject();
  private resultsListener : Subject<{resultsRetrieved : boolean, numCorrectAnswers : Number}> = new Subject();
  findingMatchTimer : NodeJS.Timer;
  resultsTimer : NodeJS.Timer;
  lobbyId : string;
  questions : string[];

  constructor(private httpClient : HttpClient, private authService : AuthService){}

  findOrStopFindingMatch() {
    if (this.findingMatchStatus == FindingMatchStatus.NotFinding) {
      this.findMatch();
    }
    else if (this.findingMatchStatus == FindingMatchStatus.Finding){
      this.stopFindingMatch();
    }
  }

  answerQuestions(answers: boolean[]) {
    let stringAnswers: string[] = [];
    answers.forEach((val, index) => {
      let toPush : string = 'false';
      if (val) {
        toPush = 'true';
      }
      stringAnswers.push(toPush);
    })


    this.httpClient.put<{message : string}>(BACKEND_API_WITH_SLASH + 'answer', {
      answers : stringAnswers,
      lobbyId : this.lobbyId
    }).subscribe({
      next : (response) => {
        console.log(response.message);
      },
      error : (err) => {
        console.log(err);
      }
    })
  }

  findMatch() {
    this.findingMatchStatus = FindingMatchStatus.Finding;
    this.findingMatchStatusListener.next({status: FindingMatchStatus.Finding, questions : null});
    this.findingMatchTimer = setInterval(() => {
      if (!this.authService.isLoggedIn()) {
        return;
      }
      this.httpClient.get<{state : string, questions : string[], id : string}>(BACKEND_API_WITH_SLASH).subscribe({
        next : (result) => {
          if (result.state == 'WAITING') {
            return;
          }
          if (result.state == "SEND_QUESTIONS") {
            this.handleIncomingQuestions(result.questions, result.id);
            clearInterval(this.findingMatchTimer);
          }
        },
        error: (err) => {
          this.findingMatchStatus = FindingMatchStatus.NotFinding;
          this.findingMatchStatusListener.next({status : FindingMatchStatus.NotFinding, questions : null});
          clearInterval(this.findingMatchTimer);
        }
      })
    }, 1000)
  }

  stopFindingMatch() {
    this.httpClient.put(BACKEND_API_WITH_SLASH, "").subscribe({
      next : () => {
        this.findingMatchStatus = FindingMatchStatus.NotFinding;
        this.findingMatchStatusListener.next({status: FindingMatchStatus.NotFinding, questions: null})
        clearInterval(this.findingMatchTimer);
      },
      error : (err) => { /* should not happen*/ console.log(err);}
    })
  }

  // in case of a page reload
  fetchPendingQuestions() {
    this.httpClient.post<{state : string, questions : string[], id : string}>(BACKEND_API_WITH_SLASH, "").subscribe({
      next : (results) => {
        if (results.state == 'SEND_QUESTIONS') {
          this.handleIncomingQuestions(results.questions, results.id);
        }
      },
      error : (err) => {
        console.log(err);
      }
    })
  }

  private handleIncomingQuestions(questions : string[], lobbyId : string) {
    this.findingMatchStatus = FindingMatchStatus.Found;
    this.questions = questions;
    this.lobbyId = lobbyId;
    this.findingMatchStatusListener.next({status : FindingMatchStatus.Found, questions : questions});
    this.resultsTimer = setInterval(() => {
      this.httpClient.post<{numCorrect : Number}>(BACKEND_API_WITH_SLASH + 'getResults', { lobbyId : this.lobbyId}).subscribe({
        next : (resp) => {
          if (resp.numCorrect > 0) {
            this.resultsListener.next({resultsRetrieved : true, numCorrectAnswers : resp.numCorrect});
            console.log("STOPPING SPAM");
            clearInterval(this.resultsTimer);
          }
        },
        error: (err) => {
          console.log(err);
          clearInterval(this.resultsTimer);
        }
      })
    }, 1000);
  }

  getFindingMatchStatusListener() : Observable<{status : FindingMatchStatus, questions : string[]}> {
    return this.findingMatchStatusListener.asObservable();
  }

  getResultsListener() : Observable<{resultsRetrieved : boolean, numCorrectAnswers : Number}> {
    return this.resultsListener.asObservable();
  }

}
