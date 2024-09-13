// acquisitions.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AcquisitionsService {

  constructor(private http: HttpClient) { }

  getAquisitionsByYear(): Promise<any> {
    // Replace with the actual API URL
    return this.http.get<any[]>('/api/acquisitions').toPromise();
  }
}
