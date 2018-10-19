import { DataSource } from '@angular/cdk/table';
import { HttpClient } from '@angular/common/http';
import { MatSort, MatPaginator } from '@angular/material';
import { Observable, of as observableOf, merge, BehaviorSubject, ObservableInput } from 'rxjs';
import { switchMap, tap, map, catchError } from 'rxjs/operators';
import buildQuery from 'odata-query';
import { ODataFilter } from './odata-filter';

export class ODataDataSource extends DataSource<any> {

  sort: MatSort;
  paginator: MatPaginator;
  selectedFields: string[];

  protected readonly filtersSubject = new BehaviorSubject<ODataFilter[]>(null);

  constructor(
    private readonly httpClient: HttpClient,
    private readonly resourcePath: string) {
      super();
  }

  connect(): Observable<any> {
    const observable = this.getObservable();

    return observable.pipe(
      switchMap(() => {
        let page = 0;
        if (this.paginator) {
          page = this.paginator.pageIndex;
        }

        let sortBy = '';
        let sortOrder = '';
        if (this.sort) {
          sortBy = this.sort.active;
          sortOrder = this.sort.direction;
        }

        const result = this.getData(page, sortBy, sortOrder, this.filtersSubject.value);
        return result.pipe(catchError(error => {
          console.log(error);
          return observableOf({ data: [] });
        }));
      }),
      tap(result => {
        if (this.paginator) {
          this.paginator.length = result['@odata.count'];
        }
      }),
      map(this.mapResult)
    );
  }

  private getObservable() {
    const toObserve = [this.filtersSubject] as Array<ObservableInput<any>>;

    if (this.paginator) {
      toObserve.push(this.paginator.page);
    }
    if (this.sort) {
      toObserve.push(this.sort.sortChange);
    }

    return merge(...toObserve);
  }

  disconnect(): void {
  }

  getData(page: number, sortBy: string, order: string, filters: ODataFilter[]): Observable<object> {
    let url = this.resourcePath;
    const query = {} as any;

    if (this.paginator) {
      const perPage = this.paginator.pageSize;
      query.top = perPage;
      query.skip = perPage * page;
      query.count = true;
    }

    if (this.selectedFields) {
      query.select = this.selectedFields;
    }

    if (sortBy) {
      if (order === 'asc') {
        query.orderBy = [sortBy];
      } else if (order === 'desc') {
        query.orderBy = [`${sortBy} desc`];
      }
    }

    if (filters) {
      const filterQuery = { and: [] };
      filters.forEach(filter => {
        filterQuery.and.push(filter.getFilter());
      });

      query.filter = filterQuery;
    }

    url = url + buildQuery(query);
      
    return this.httpClient.get(url) as Observable<object>;
  }

  mapResult(result) {
    return result.value;
  }

  set filters(filters: ODataFilter[]) { this.filtersSubject.next(filters); }
}