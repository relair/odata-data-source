import { HttpClient } from '@angular/common/http';
import { Component, OnInit, ViewChild } from '@angular/core';

import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';

import { ODataDataSource } from 'projects/odata-data-source/src/public_api';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

  title = 'odata-data-source-demo';

  displayedColumns: string[] = ['Name', 'Description', 'ReleaseDate', 'Rating', 'Price'];

  dataSource: ODataDataSource;

  isLoading: boolean;

  constructor(private readonly httpClient: HttpClient) {}

  ngOnInit() {
    const resourcePath = 'https://services.odata.org/V4/OData/OData.svc/Products';
    this.dataSource = new ODataDataSource(this.httpClient, resourcePath);
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.dataSource.initialSort = ['Rating desc', 'Name'];
    this.dataSource.loading.subscribe(loading => this.isLoading = loading);
    this.dataSource.errors.subscribe(error => {
      if (error) {
        console.error(error);
      } else {
        console.log('Error cleared');
      }      
    });    
  }
}
