import { Component, OnInit, ViewChild } from '@angular/core';
import { MatSort, MatPaginator } from '@angular/material';
import { HttpClient } from '@angular/common/http';
import { ODataDataSource } from 'projects/odata-data-source/src/lib/odata-data-source';
import { ODataFilter } from 'projects/odata-data-source/src/lib/odata-filter';
import { extend } from 'webdriver-js-extender';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  title = 'odata-data-source-demo';

  displayedColumns: string[] = ['Name', 'Description', 'ReleaseDate', 'Rating', 'Price'];

  dataSource: ODataDataSource;
  filterValue: string = '';
  inputText$ = new Subject<string>();
  inputText$Delayed = this.inputText$.pipe(
    debounceTime(500)
  );

  constructor(private readonly httpClient: HttpClient) { }

  ngOnInit() {
    const resourcePath = 'https://services.odata.org/V4/OData/OData.svc/Products';
    this.dataSource = new ODataDataSource(this.httpClient, resourcePath);
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.dataSource.initialSort = ['Rating desc', 'Name'];

    this.inputText$Delayed.subscribe(filter => {
      this.dataSource.setFilters([new ContainsNameFilter(filter)]);
    });
  }

  applyFilter(event: any) {
    this.inputText$.next(this.filterValue);
  }
}

export class ContainsNameFilter implements ODataFilter {
  constructor(private filter: string) { }
  getFilter(): object {
    return { Name: { contains: this.filter } };
  }
}
